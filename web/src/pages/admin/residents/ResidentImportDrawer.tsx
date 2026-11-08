/**
 * ResidentImportDrawer
 *
 * Excel bulk-import for residents.
 * Flow:
 *   1. Staff uploads an .xlsx / .xls file.
 *   2. The file is parsed client-side (xlsx library), rows are validated
 *      and sent to POST /residents/import/validate for server-side checks
 *      (duplicate e-mail, unknown unit identifier, etc.).
 *   3. A preview table shows every row with its status (valid / invalid / duplicate)
 *      and the error reason for bad rows.
 *   4. Staff click "Import Valid Rows" → POST /residents/import/confirm sends only
 *      the valid rows.
 *   5. A result summary (imported / skipped / failed) is shown.
 *
 * Template download: a pre-built xlsx with the expected column headers.
 */

import { useState } from 'react';
import {
  Drawer, Button, Space, Typography, Upload, Table, Tag, Alert, Steps,
  Result, App as AntApp, Tooltip,
} from 'antd';
import {
  UploadOutlined, DownloadOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../../../lib/api';
import type { ImportResidentRow, ImportResult } from '@phison/types';

const { Text, Paragraph } = Typography;

// ── Expected Excel columns (case-insensitive match) ──────────────────────────

const EXPECTED_COLUMNS = [
  'Full Name',
  'Email',
  'Phone',
  'Unit Identifier',
  'Resident Role',   // tenant | owner
  'Has Vehicle',     // yes | no
  'Vehicle Number',  // optional
];

// ── Template generation ───────────────────────────────────────────────────────

function downloadTemplate(): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    EXPECTED_COLUMNS,
    ['Abebe Girma', 'abebe@example.com', '+251911234567', 'Apt 1A', 'tenant', 'yes', 'ET-001'],
    ['Tigist Bekele', 'tigist@example.com', '+251922345678', 'Apt 1B', 'owner', 'no', ''],
  ]);
  // Column widths
  ws['!cols'] = EXPECTED_COLUMNS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Residents');
  XLSX.writeFile(wb, 'resident_import_template.xlsx');
}

// ── Raw row shape after Excel parse ──────────────────────────────────────────

interface RawRow {
  'Full Name'?: unknown;
  'Email'?: unknown;
  'Phone'?: unknown;
  'Unit Identifier'?: unknown;
  'Resident Role'?: unknown;
  'Has Vehicle'?: unknown;
  'Vehicle Number'?: unknown;
  [key: string]: unknown;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findValue(row: RawRow, canonical: string): string {
  for (const [k, v] of Object.entries(row)) {
    if (normalizeHeader(k) === normalizeHeader(canonical)) {
      return String(v ?? '').trim();
    }
  }
  return '';
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ResidentImportDrawerProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'done';

export function ResidentImportDrawer({ open, onClose }: ResidentImportDrawerProps) {
  const { message } = AntApp.useApp();
  const qc = useQueryClient();

  const [step, setStep]             = useState<Step>('upload');
  const [parseError, setParseError]  = useState<string | null>(null);
  const [rows, setRows]              = useState<ImportResidentRow[]>([]);
  const [result, setResult]          = useState<ImportResult | null>(null);

  // ── Validate mutation ─────────────────────────────────────────────────────

  const validateMutation = useMutation({
    mutationFn: (rawRows: RawRow[]) =>
      api.post<{ rows: ImportResidentRow[] }>('/residents/import/validate', {
        rows: rawRows.map(r => ({
          fullName:       findValue(r, 'Full Name'),
          email:          findValue(r, 'Email'),
          phone:          findValue(r, 'Phone'),
          unitIdentifier: findValue(r, 'Unit Identifier'),
          residentRole:   findValue(r, 'Resident Role').toLowerCase(),
          hasVehicle:     findValue(r, 'Has Vehicle').toLowerCase(),
          vehicleNumber:  findValue(r, 'Vehicle Number'),
        })),
      }).then(res => res.data),
    onSuccess: (data) => {
      setRows(data.rows);
      setStep('preview');
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── Confirm mutation ──────────────────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: () =>
      api.post<ImportResult>('/residents/import/confirm', {
        rows: rows
          .filter(r => r.status === 'valid')
          .map(r => ({
            fullName:     r.fullName,
            email:        r.email,
            phone:        r.phone,
            unitId:       r.unitId!,
            residentRole: r.residentRole,
            hasVehicle:   r.hasVehicle,
            vehicleNumber: r.vehicleNumber,
          })),
      }).then(res => res.data),
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
      qc.invalidateQueries({ queryKey: ['residents'] });
    },
    onError: (e) => message.error(getErrorMessage(e)),
  });

  // ── File parse ────────────────────────────────────────────────────────────

  function handleFile(file: File): boolean {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<RawRow>(ws, { defval: '' });

        if (json.length === 0) {
          setParseError('The file is empty or has no data rows.');
          return;
        }
        // Check for at least the required headers
        const headers = Object.keys(json[0]).map(normalizeHeader);
        const missing = ['full name', 'email', 'unit identifier', 'resident role']
          .filter(h => !headers.includes(h));
        if (missing.length > 0) {
          setParseError(`Missing columns: ${missing.join(', ')}. Download the template for the correct format.`);
          return;
        }

        validateMutation.mutate(json);
      } catch {
        setParseError('Could not read the file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // prevent antd Upload default behavior
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  function handleClose() {
    setStep('upload');
    setParseError(null);
    setRows([]);
    setResult(null);
    onClose();
  }

  // ── Preview table columns ─────────────────────────────────────────────────

  const previewColumns = [
    {
      title: '#', key: 'row',
      render: (_: unknown, __: unknown, i: number) =>
        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{i + 1}</Text>,
      width: 40,
    },
    { title: 'Name',  dataIndex: 'fullName', key: 'name', ellipsis: true },
    { title: 'Email', dataIndex: 'email',    key: 'email', ellipsis: true },
    { title: 'Phone', dataIndex: 'phone',    key: 'phone', ellipsis: true },
    { title: 'Unit',  dataIndex: 'unitId',   key: 'unit',
      render: (v: string | null, r: ImportResidentRow) => v ?? r.unitIdentifier ?? '—' },
    { title: 'Role',  dataIndex: 'residentRole', key: 'role' },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        if (s === 'valid')     return <Tag color="green">Valid</Tag>;
        if (s === 'duplicate') return <Tag color="orange">Duplicate</Tag>;
        return <Tag color="red">Invalid</Tag>;
      },
    },
    {
      title: 'Issues', dataIndex: 'errors', key: 'errors',
      render: (errs: string[]) =>
        errs.length > 0 ? (
          <Tooltip title={errs.join(' · ')}>
            <ExclamationCircleOutlined style={{ color: '#E74C3C' }} />
            <Text style={{ fontSize: 11, color: '#E74C3C', marginLeft: 4 }}>
              {errs[0]}
            </Text>
          </Tooltip>
        ) : null,
    },
  ];

  const validCount     = rows.filter(r => r.status === 'valid').length;
  const invalidCount   = rows.filter(r => r.status !== 'valid').length;
  const stepItems = [
    { title: 'Upload',  description: 'Select Excel file' },
    { title: 'Preview', description: 'Review rows' },
    { title: 'Done',    description: 'Import complete' },
  ];
  const stepIndex = step === 'upload' ? 0 : step === 'preview' ? 1 : 2;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Drawer
      title="Bulk Import Residents"
      open={open}
      onClose={handleClose}
      width={720}
      footer={
        step === 'preview' ? (
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Button onClick={() => { setStep('upload'); setRows([]); }}>Back</Button>
            <Space>
              <Text type="secondary">{validCount} valid · {invalidCount} skipped</Text>
              <Button
                type="primary"
                loading={confirmMutation.isPending}
                disabled={validCount === 0}
                onClick={() => confirmMutation.mutate()}
              >
                Import {validCount} Valid Row{validCount !== 1 ? 's' : ''}
              </Button>
            </Space>
          </Space>
        ) : step === 'done' ? (
          <Button type="primary" onClick={handleClose}>Close</Button>
        ) : null
      }
    >
      <Steps
        current={stepIndex}
        items={stepItems}
        size="small"
        style={{ marginBottom: 28 }}
      />

      {/* ── Step 1: Upload ──────────────────────────────────────────── */}
      {step === 'upload' && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Button
              icon={<DownloadOutlined />}
              onClick={downloadTemplate}
              style={{ marginBottom: 12 }}
            >
              Download Template (.xlsx)
            </Button>
            <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
              Fill in the template and upload it below. Required columns:
              Full Name, Email, Phone, Unit Identifier, Resident Role (tenant/owner),
              Has Vehicle (yes/no). Vehicle Number is optional.
            </Paragraph>
          </div>

          {parseError && (
            <Alert type="error" message={parseError} showIcon closable onClose={() => setParseError(null)} />
          )}

          <Upload.Dragger
            accept=".xlsx,.xls"
            multiple={false}
            showUploadList={false}
            beforeUpload={handleFile}
            disabled={validateMutation.isPending}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 32, color: '#2D3B8E' }} />
            </p>
            <p className="ant-upload-text">Click or drag an Excel file here</p>
            <p className="ant-upload-hint">.xlsx or .xls · Max 5 MB</p>
          </Upload.Dragger>

          {validateMutation.isPending && (
            <Text type="secondary">Validating rows…</Text>
          )}
        </Space>
      )}

      {/* ── Step 2: Preview ─────────────────────────────────────────── */}
      {step === 'preview' && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space>
            <CheckCircleOutlined style={{ color: '#27AE60' }} />
            <Text>{validCount} row{validCount !== 1 ? 's' : ''} ready to import</Text>
            {invalidCount > 0 && (
              <>
                <CloseCircleOutlined style={{ color: '#E74C3C', marginLeft: 8 }} />
                <Text type="danger">{invalidCount} skipped (shown in red/orange)</Text>
              </>
            )}
          </Space>

          <Table
            dataSource={rows}
            columns={previewColumns}
            rowKey="rowNumber"
            size="small"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            rowClassName={(r: ImportResidentRow) =>
              r.status !== 'valid' ? 'import-row-invalid' : ''}
            scroll={{ x: 640 }}
          />
        </Space>
      )}

      {/* ── Step 3: Done ────────────────────────────────────────────── */}
      {step === 'done' && result && (
        <Result
          status={result.failed === 0 ? 'success' : 'warning'}
          title="Import Complete"
          subTitle={
            <Space direction="vertical" size={4}>
              <Text><CheckCircleOutlined style={{ color: '#27AE60' }} /> {result.imported} imported</Text>
              <Text type="secondary">{result.skipped} skipped (duplicates / invalid)</Text>
              {result.failed > 0 && (
                <Text type="danger">{result.failed} failed (server error)</Text>
              )}
            </Space>
          }
        />
      )}
    </Drawer>
  );
}

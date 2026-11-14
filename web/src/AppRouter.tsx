import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Spin } from 'antd';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './store/auth';
import { AdminLayout } from './components/layout/AdminLayout';
import { ResidentLayout } from './components/layout/ResidentLayout';

// ── Auth ──────────────────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

// ── Admin pages ───────────────────────────────────────────────────────────────
const DashboardPage        = lazy(() => import('./pages/admin/DashboardPage'));
const ResidentsPage        = lazy(() => import('./pages/admin/residents/ResidentsPage'));
const ResidentDetailPage   = lazy(() => import('./pages/admin/residents/ResidentDetailPage'));
const UnitsPage            = lazy(() => import('./pages/admin/UnitsPage'));
const ProviderPaymentsPage = lazy(() => import('./pages/admin/ProviderPaymentsPage'));
const MeterReadingsPage    = lazy(() => import('./pages/admin/MeterReadingsPage'));
const AllocationPage       = lazy(() => import('./pages/admin/AllocationPage'));
const ChargesAdminPage     = lazy(() => import('./pages/admin/ChargesAdminPage'));
const PendingPaymentsPage  = lazy(() => import('./pages/admin/PendingPaymentsPage'));
const LedgerPage           = lazy(() => import('./pages/admin/LedgerPage'));
const VouchersAdminPage    = lazy(() => import('./pages/admin/VouchersAdminPage'));
const NoticesAdminPage     = lazy(() => import('./pages/admin/NoticesAdminPage'));
const RequestsAdminPage    = lazy(() => import('./pages/admin/RequestsAdminPage'));
const PaymentPricingPage  = lazy(() => import('./pages/admin/PaymentPricingPage'));
// const SettingsPage         = lazy(() => import('./pages/admin/SettingsPage'));

// ── Resident portal pages ─────────────────────────────────────────────────────
const ResidentDashboard     = lazy(() => import('./pages/resident/ResidentDashboard'));
const ResidentCharges       = lazy(() => import('./pages/resident/ResidentCharges'));
const ResidentVouchers      = lazy(() => import('./pages/resident/ResidentVouchers'));
const ResidentNotices       = lazy(() => import('./pages/resident/ResidentNotices'));
const ResidentRequests      = lazy(() => import('./pages/resident/ResidentRequests'));
const ResidentRequestDetail = lazy(() => import('./pages/resident/ResidentRequestDetail'));

// ── Auth guard ────────────────────────────────────────────────────────────────
function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const PageLoader = <Spin size="large" style={{ display: 'block', margin: '40vh auto' }} />;

// ── Router ────────────────────────────────────────────────────────────────────
export function AppRouter() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Suspense fallback={PageLoader}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* ── Admin & Staff ────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RequireAuth roles={['admin', 'staff']}>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* Residents (formerly Users) — old /admin/users redirects here */}
            <Route path="users" element={<Navigate to="/admin/residents" replace />} />
            <Route path="residents" element={<ResidentsPage />} />
            <Route path="residents/:id" element={<ResidentDetailPage />} />

            {/* Units */}
            <Route path="units" element={<UnitsPage />} />

            {/* Payments */}
            <Route path="payments" element={<Navigate to="/admin/payments/provider" replace />} />
            <Route path="payments/provider" element={<ProviderPaymentsPage />} />
            <Route path="payments/meter-readings" element={<MeterReadingsPage />} />
            <Route path="payments/allocation/:paymentId" element={<AllocationPage />} />
            <Route path="payments/charges" element={<ChargesAdminPage />} />
            <Route path="payments/pending" element={<PendingPaymentsPage />} />
            <Route path="payments/ledger" element={<LedgerPage />} />
            <Route path="payments/pricing" element={<PaymentPricingPage />} />

            {/* Other modules */}
            <Route path="vouchers" element={<VouchersAdminPage />} />
            <Route path="notices" element={<NoticesAdminPage />} />
            <Route path="requests" element={<RequestsAdminPage />} />
          </Route>

          {/* ── Resident portal ──────────────────────────────────────── */}
          <Route
            path="/resident"
            element={
              <RequireAuth roles={['resident']}>
                <ResidentLayout />
              </RequireAuth>
            }
          >
            <Route index element={<ResidentDashboard />} />
            <Route path="charges" element={<ResidentCharges />} />
            <Route path="vouchers" element={<ResidentVouchers />} />
            <Route path="notices" element={<ResidentNotices />} />
            <Route path="requests" element={<ResidentRequests />} />
            <Route path="requests/:id" element={<ResidentRequestDetail />} />
          </Route>

          {/* ── Default redirect ─────────────────────────────────────── */}
          <Route
            path="/"
            element={
              user
                ? user.role === 'resident'
                  ? <Navigate to="/resident" replace />
                  : <Navigate to="/admin" replace />
                : <Navigate to="/login" replace />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

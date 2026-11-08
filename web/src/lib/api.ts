import axios from 'axios';
import type { AxiosError } from 'axios';
import { installMockInterceptor } from './mock';

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Install mock FIRST so it runs before the 401 redirect interceptor.
// When VITE_USE_MOCK=true all requests are intercepted in-browser.
if (import.meta.env.VITE_USE_MOCK === 'true') {
  installMockInterceptor(api);
}

// Attach access token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 redirect to login (only fires for real API responses, not mock)
api.interceptors.response.use(
  res => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return 'An unexpected error occurred';
}

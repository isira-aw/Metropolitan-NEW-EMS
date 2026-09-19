import axios from 'axios';
import { showGlobalToast } from '@/components/ui/Toast';
import { beginGlobalLoading, endGlobalLoading } from '@/components/ui/LoadingOverlay';

declare module 'axios' {
  export interface AxiosRequestConfig {
    // Opt out of the global error-alert interceptor below for this request.
    skipGlobalError?: boolean;
    // Opt out of the global full-screen loading overlay for this request.
    skipGlobalLoading?: boolean;
    // Internal: tracks whether this request incremented the loading counter,
    // so the response/error handler decrements it exactly once.
    _globalLoadingStarted?: boolean;
    // Internal: prevents an infinite refresh loop if the retried request
    // still comes back unauthorized after a token refresh.
    _retriedAfterRefresh?: boolean;
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.skipGlobalLoading) {
      beginGlobalLoading();
      config._globalLoadingStarted = true;
    }
    return config;
  },
  (error) => {
    // A request rejected before it was ever dispatched still incremented the
    // counter above. Without this the overlay's pending count never returns to
    // zero and the full-screen "Processing..." spinner blocks the UI until the
    // page is reloaded.
    if (error?.config?._globalLoadingStarted) {
      endGlobalLoading();
      error.config._globalLoadingStarted = false;
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    if (response.config?._globalLoadingStarted) {
      endGlobalLoading();
    }
    return response;
  },
  async (error) => {
    if (error.config?._globalLoadingStarted) {
      endGlobalLoading();
      error.config._globalLoadingStarted = false;
    }

    // Only 401 means "your token is missing, expired or invalid" - that is the one
    // case worth attempting a refresh for.
    //
    // 403 deliberately does NOT trigger this path. A 403 means the caller is
    // authenticated but not allowed to perform *this* action (an employee hitting an
    // admin route, a @PreAuthorize denial, an ownership check). Treating it as an
    // expired session meant any such response silently wiped localStorage and bounced
    // the user to /login mid-task, which read as the app randomly logging people out.
    // A 403 is now surfaced as a normal error like any other.
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && !error.config?._retriedAfterRefresh) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          error.config._retriedAfterRefresh = true;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } else {
        // No refresh token, or the retried request still failed authorization.
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    // Global error toast handling
    // Surfaces backend error messages via the app-wide toast system.
    // Components can opt-out by adding { skipGlobalError: true } to config.
    const skipGlobalError = error.config?.skipGlobalError;

    if (!skipGlobalError) {
      if (error.response?.data?.message) {
        // Don't show a toast for silent failures (like getToday which handles its own errors)
        const isSilentRequest = error.config?.url?.includes('/employee/attendance/today');
        if (!isSilentRequest) {
          showGlobalToast(error.response.data.message, 'error');
        }
      } else if (error.message && !error.response) {
        // Network or other errors (only if there's no response from server)
        showGlobalToast('Network error: ' + error.message, 'error');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

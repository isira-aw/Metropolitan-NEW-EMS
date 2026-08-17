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

    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Retry original request
          error.config.headers.Authorization = `Bearer ${response.data.accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/login';
        }
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

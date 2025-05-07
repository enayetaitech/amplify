// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8008';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ← send your HttpOnly cookies automatically
});

interface FailedQueueItem {
  resolve: (value?: AxiosResponse<unknown>) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

/**
 * Drain the queue: either retry all or reject all.
 */
function processQueue(error?: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
  (error: AxiosError & {
    config?: AxiosRequestConfig & { _retry?: boolean };
  }) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
        axios
          .post(
            `${BASE_URL}/auth/refresh`,
            null,
            { withCredentials: true }
          )
          .then(() => {
            processQueue();
            resolve(api(originalRequest));
          })
          .catch((refreshError: unknown) => {
            processQueue(refreshError);
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;

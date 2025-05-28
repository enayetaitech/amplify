// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? 'https://bamplify.hgsingalong.com';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ← send your HttpOnly cookies automatically
});

interface FailedQueueItem {
  resolve: () => void;
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
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      isRefreshing = true;

      return new Promise<AxiosResponse<unknown>>((resolve, reject) => {
        axios
          .post(
            `${BASE_URL}/api/v1/auth/refresh`,
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

api.interceptors.response.use(
  response => response,
  (error: unknown) => {
    if (axios.isAxiosError<{ message: string }>(error) && error.response?.data?.message) {
      // override the built-in AxiosError.message
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;

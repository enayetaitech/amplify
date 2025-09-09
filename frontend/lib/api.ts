// lib/api.ts
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL?.trim() || "https://amplifyre.shop";

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

interface FailedQueueItem {
  resolve: () => void;
  reject: (error: unknown) => void;
}

/** ✅  Auth routes that should NOT trigger silent refresh */
const AUTH_ROUTES_REGEX = [
  /\/api\/v1\/auth\/(login|register|forgot-password|reset-password)$/,
  /\/api\/v1\/users\/login$/, // 👈  your current login URL
];

const REFRESH_ENDPOINT = "/api/v1/auth/refreshToken";

const isAuthRoute = (url?: string): boolean =>
  AUTH_ROUTES_REGEX.some((re) => re.test(url ?? ""));

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
  async (
    error: AxiosError & {
      config?: AxiosRequestConfig & { _retry?: boolean };
    }
  ) => {
    const { config: originalRequest, response } = error;

    /* 1️⃣  Put backend “message” onto error.message for easy toasting */
    if (axios.isAxiosError(error)) {
      const msg = (error.response?.data as { message?: string } | undefined)
        ?.message;
      if (msg) {
        error.message = msg;
      }
    }

    /* 2️⃣  Silent token refresh (but skip for auth routes) */
    if (
      response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // queue while a refresh is already in flight
        await new Promise<void>((resolve, reject) =>
          failedQueue.push({ resolve, reject })
        );
        return api(originalRequest); // retry after queue is released
      }

      isRefreshing = true;

      isRefreshing = true;
      try {
        await axios.post(`${BASE_URL}${REFRESH_ENDPOINT}`, null, {
          withCredentials: true,
        });
        processQueue();
        return api(originalRequest); // retry original
      } catch (refreshErr) {
        processQueue(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    /* 3️⃣  Anything else bubbles up */
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError<{ message: string }>(error) &&
      error.response?.data?.message
    ) {
      // override the built-in AxiosError.message
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================================
// VISION ERP - Typed API Client
// lib/api-client.ts
// ------------------------------------------------------------
// Single place that unwraps the { success, data, meta, error }
// envelope and centralises 401 handling. Cookies (the NextAuth
// session) ride along automatically on same-origin requests.
// ============================================================

import type { ApiResponse, PaginationMeta } from "@/types";

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    sp.append(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const current = window.location.pathname + window.location.search;
  const callback = encodeURIComponent(current);
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?callbackUrl=${callback}`;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { params?: QueryParams } = {}
): Promise<ApiResult<T>> {
  const { params, headers, ...rest } = init;
  const url = `${path}${buildQuery(params)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      ...rest,
    });
  } catch {
    throw new ApiError("Network error — please check your connection", 0);
  }

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  let json: ApiResponse<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new ApiError("Unexpected response from server", res.status);
    }
  }

  if (!res.ok || !json || json.success === false) {
    throw new ApiError(
      json?.error || `Request failed (${res.status})`,
      res.status,
      json?.errors
    );
  }

  return { data: json.data as T, meta: json.meta, message: json.message };
}

export const apiClient = {
  get<T>(path: string, params?: QueryParams): Promise<ApiResult<T>> {
    return request<T>(path, { method: "GET", params });
  },
  post<T>(path: string, body?: unknown, params?: QueryParams): Promise<ApiResult<T>> {
    return request<T>(path, {
      method: "POST",
      params,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, params?: QueryParams): Promise<ApiResult<T>> {
    return request<T>(path, {
      method: "PATCH",
      params,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown, params?: QueryParams): Promise<ApiResult<T>> {
    return request<T>(path, {
      method: "PUT",
      params,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, params?: QueryParams): Promise<ApiResult<T>> {
    return request<T>(path, { method: "DELETE", params });
  },
};
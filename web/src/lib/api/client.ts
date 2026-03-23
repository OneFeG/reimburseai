/**
 * API Client
 * ==========
 * Central API client for communicating with the backend.
 */

import { auth } from "@/hooks/firebaseAuth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.reembolsoai.com";

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async parseError(response: Response): Promise<ApiError> {
    const statusCode = response.status;

    let parsedBody: unknown = undefined;
    try {
      const text = await response.text();
      if (!text) {
        parsedBody = undefined;
      } else {
        try {
          parsedBody = JSON.parse(text);
        } catch {
          parsedBody = text;
        }
      }
    } catch {
      parsedBody = undefined;
    }

    const body: any = parsedBody;
    const message =
      (typeof body === "string" && body) ||
      body?.message ||
      body?.error ||
      body?.detail ||
      response.statusText ||
      "Request failed";

    return {
      code: `HTTP_${statusCode}`,
      message,
      details:
        body && typeof body === "object"
          ? (body as Record<string, unknown>)
          : body
            ? { value: body }
            : undefined,
    };
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const user = auth?.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  private async getHeaders(): Promise<HeadersInit> {
    return {
      "Content-Type": "application/json",
      ...(await this.getAuthHeader()),
    };
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PATCH",
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "PUT",
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "DELETE",
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          ...(await this.getAuthHeader()),
        },
        body: formData,
      });

      if (!response.ok) {
        return { success: false, error: await this.parseError(response) };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: error instanceof Error ? error.message : "Upload failed",
        },
      };
    }
  }
}

export const api = new ApiClient();
export const apiClient = api;
export default api;

/**
 * API Client
 * ==========
 * Central API client for communicating with the backend.
 * All API calls go through this client.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
  private companyId: string | null = null;
  private employeeId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set context for API calls (company and employee IDs)
   */
  setContext(companyId: string, employeeId: string) {
    this.companyId = companyId;
    this.employeeId = employeeId;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.companyId) {
      headers['X-Company-ID'] = this.companyId;
    }
    if (this.employeeId) {
      headers['X-Employee-ID'] = this.employeeId;
    }

    return headers;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /**
   * Upload a file (multipart/form-data)
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const headers: HeadersInit = {};
      if (this.companyId) headers['X-Company-ID'] = this.companyId;
      if (this.employeeId) headers['X-Employee-ID'] = this.employeeId;

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.detail || error };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Upload failed',
        },
      };
    }
  }
}

// Export singleton instance
export const api = new ApiClient();

// Export types
export type { ApiClient };

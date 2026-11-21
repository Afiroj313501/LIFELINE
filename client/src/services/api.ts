export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = `${API_URL}/api/v1`;

export const apiClient = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = localStorage.getItem('lifeline_token');

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // sends and receives HttpOnly refresh token cookie
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: 'An unexpected response was received from the server.',
  }));

  if (!response.ok) {
    let errorMsg = data.message || 'Request failed';
    if (Array.isArray(data.details) && data.details.length > 0) {
      errorMsg = data.details.map((d: any) => d.message || d.field).join('. ');
    } else if (typeof data.details === 'string') {
      errorMsg = data.details;
    }
    throw new Error(errorMsg);
  }

  return data;
};

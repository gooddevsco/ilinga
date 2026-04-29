export const baseUrl =
  (import.meta.env['VITE_API_ORIGIN'] as string | undefined) ?? 'http://localhost:3001';

export interface ApiError extends Error {
  status: number;
  body?: unknown;
}

const headers = (init?: HeadersInit): HeadersInit => {
  const csrf = document.cookie
    .split('; ')
    .find((c) => c.startsWith('il_csrf='))
    ?.split('=')[1];
  return {
    'Content-Type': 'application/json',
    ...(csrf ? { 'X-Il-Csrf': decodeURIComponent(csrf) } : {}),
    ...init,
  };
};

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: headers(),
    });
    if (!res.ok) await throwApiError(res);
    return (await res.json()) as T;
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) await throwApiError(res);
    return (await res.json()) as T;
  },
  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) await throwApiError(res);
    return (await res.json()) as T;
  },
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) await throwApiError(res);
    return (await res.json()) as T;
  },
  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: headers(),
    });
    if (!res.ok) await throwApiError(res);
    return (await res.json()) as T;
  },
};

const throwApiError = async (res: Response): Promise<never> => {
  const err = new Error(`API ${res.status}`) as ApiError;
  err.status = res.status;
  try {
    err.body = await res.json();
  } catch {
    /* ignore */
  }
  throw err;
};

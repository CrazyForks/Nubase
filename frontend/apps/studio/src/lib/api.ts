export const API_BASE = process.env.NEXT_PUBLIC_NUBASE_API_URL ?? 'http://localhost:9999';

export interface ApiError {
  status: number;
  message: string;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  apikey?: string;
  bearer?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, apikey, bearer, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apikey ? { apikey } : {}),
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    ...(headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw { status: res.status, message } satisfies ApiError;
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

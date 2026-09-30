import { ApiKeyInfo, ProviderInfo, QueryLogRow, Stats } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8321";

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJSON<T>(path: string, token: string | null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

// POST body only — never query params, so a key never lands in an access log or browser
// history entry. Nothing here persists the key: the caller is responsible for discarding
// it from React state right after this resolves.
async function postJSON<T>(
  path: string,
  body: unknown,
  token: string | null,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `${path} responded ${res.status}`);
  }
  return (await res.json()) as T;
}

export function fetchStats(token: string | null): Promise<Stats> {
  return getJSON<Stats>("/stats", token);
}

export function fetchQueries(
  token: string | null,
  limit = 25,
): Promise<QueryLogRow[]> {
  return getJSON<QueryLogRow[]>(`/queries?limit=${limit}`, token);
}

export function fetchProviders(token: string | null): Promise<ProviderInfo[]> {
  return getJSON<ProviderInfo[]>("/settings/providers", token);
}

export function fetchApiKeys(token: string | null): Promise<ApiKeyInfo[]> {
  return getJSON<ApiKeyInfo[]>("/settings/api-keys", token);
}

export function saveApiKey(
  provider: string,
  apiKey: string,
  token: string | null,
): Promise<{ provider: string; masked_key: string }> {
  return postJSON("/settings/api-key", { provider, api_key: apiKey }, token);
}

export async function deleteApiKey(
  provider: string,
  token: string | null,
): Promise<void> {
  const res = await fetch(`${API_BASE}/settings/api-key/${provider}`, {
    method: "DELETE",
    cache: "no-store",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`delete ${provider} responded ${res.status}`);
  }
}

export function setActiveProvider(
  provider: string,
  token: string | null,
): Promise<{ active_provider: string }> {
  return postJSON("/settings/active-provider", { provider }, token);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export interface Stats {
  total_queries: number;
  cache_hits: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  requests_by_model: Record<string, number>;
}

export interface QueryLogRow {
  ts: string;
  query: string;
  cache_hit: boolean;
  model_used: string | null;
  cost_usd: number | null;
  latency_ms: number;
}

export const EMPTY_STATS: Stats = {
  total_queries: 0,
  cache_hits: 0,
  cache_hit_rate: 0,
  avg_latency_ms: 0,
  total_cost_usd: 0,
  requests_by_model: {},
};

export type ConnectionState = "loading" | "error" | "ok";

export interface ProviderInfo {
  provider: string;
  display_name: string;
  configured: boolean;
}

export interface ApiKeyInfo {
  provider: string;
  masked_key: string;
  created_at: string;
  active: boolean;
}

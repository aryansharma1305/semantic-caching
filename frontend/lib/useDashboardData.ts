"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchQueries, fetchStats } from "./api";
import { ConnectionState, EMPTY_STATS, QueryLogRow, Stats } from "./types";

const POLL_INTERVAL_MS = 4000;
const QUERIES_LIMIT = 25;

interface DashboardData {
  stats: Stats;
  previousStats: Stats;
  queries: QueryLogRow[];
  state: ConnectionState;
  lastUpdated: Date | null;
}

export function useDashboardData(): DashboardData {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [previousStats, setPreviousStats] = useState<Stats>(EMPTY_STATS);
  const [queries, setQueries] = useState<QueryLogRow[]>([]);
  const [state, setState] = useState<ConnectionState>("loading");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const statsRef = useRef<Stats>(EMPTY_STATS);

  const poll = useCallback(async () => {
    try {
      const token = await getToken();
      const [nextStats, nextQueries] = await Promise.all([
        fetchStats(token),
        fetchQueries(token, QUERIES_LIMIT),
      ]);
      setPreviousStats(statsRef.current);
      statsRef.current = nextStats;
      setStats(nextStats);
      setQueries(nextQueries);
      setState("ok");
      setLastUpdated(new Date());
    } catch {
      setState("error");
    }
  }, [getToken]);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [poll]);

  return { stats, previousStats, queries, state, lastUpdated };
}

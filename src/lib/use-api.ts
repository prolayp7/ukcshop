"use client";

import { useEffect, useState } from "react";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

/** Minimal same-origin fetch hook for the /api/* proxy routes. No caching
 * library needed for this scope - one bounded need, not a data layer. */
export function useApi<T>(url: string | null, initialData: T | null = null): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ data: initialData, loading: !!url && !initialData, error: false });

  useEffect(() => {
    if (!url) {
      setState({ data: null, loading: false, error: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((json) => {
        if (!cancelled) setState({ data: json, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}

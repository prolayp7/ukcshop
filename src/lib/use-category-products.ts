"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ListMeta } from "./api";
import type { Product } from "./types";

type ProductResults = { items: Product[]; meta: ListMeta };

export function useCategoryProducts(query: string, initialData: ProductResults | null) {
  const [state, setState] = useState({ data: initialData, query, loading: !initialData, error: false });
  const request = useRef<AbortController | null>(null);
  const initial = useRef(true);

  const fetchPage = useCallback(async (page: number) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setState((current) => ({ ...current, loading: true, error: false }));
    try {
      const response = await fetch(`/api/products?${query}&page=${page}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Products unavailable");
      const data: ProductResults = await response.json();
      if (controller.signal.aborted) return;
      setState((current) => {
        const previous = page > 1 && current.query === query ? current.data?.items ?? [] : [];
        const seen = new Set(previous.map((product) => product.id));
        return { data: { ...data, items: [...previous, ...data.items.filter((product) => !seen.has(product.id))] }, query, loading: false, error: false };
      });
    } catch {
      if (!controller.signal.aborted) setState((current) => ({ ...current, loading: false, error: true }));
    } finally {
      if (request.current === controller) request.current = null;
    }
  }, [query]);

  useEffect(() => {
    // The first page is already server-rendered; don't request it twice.
    if (initial.current && initialData) {
      initial.current = false;
      return;
    }
    initial.current = false;
    const timer = window.setTimeout(() => { void fetchPage(1); }, 0);
    return () => { window.clearTimeout(timer); request.current?.abort(); };
  }, [fetchPage, initialData]);

  const hasMore = !!state.data && state.data.meta.page < state.data.meta.totalPages;
  const loadMore = useCallback(() => {
    if (request.current || state.loading || state.error || state.query !== query || !hasMore) return;
    void fetchPage((state.data?.meta.page ?? 0) + 1);
  }, [fetchPage, hasMore, query, state]);
  const retry = () => { void fetchPage(state.query === query && state.data ? state.data.meta.page + 1 : 1); };

  return { ...state, loading: state.loading || (state.query !== query && !state.error), hasMore, loadMore, retry };
}

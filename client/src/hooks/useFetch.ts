import { useState, useEffect, useCallback, useRef } from "react";

type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * 通用数据获取 hook，替代 React Query 的 useQuery
 * @param fetchFn 返回 Promise 的异步函数
 * @param deps 依赖数组，变化时重新请求
 * @param options.enabled 是否启用请求，false 时跳过
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = [],
  options?: { enabled?: boolean }
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : "请求失败";
        setError(message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (options?.enabled === false) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    refetch();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, options?.enabled]);

  return { data, loading, error, refetch };
}

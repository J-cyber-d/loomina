import useSWR from 'swr';
import type { CubeQuery } from '@loomina/shared';

export interface QueryResult<T = Record<string, unknown>> {
  data: T[];
  query?: CubeQuery;
  lastRefreshTime?: string;
  isSimulated?: boolean;
  executionTimeMs?: number;
}

export interface UseLoominaQueryOptions {
  token?: string | null;
  query?: CubeQuery | null;
  apiHost?: string;
  refreshInterval?: number;
}

export function useLoominaQuery<T = Record<string, unknown>>({
  token,
  query,
  apiHost = 'http://localhost:4000',
  refreshInterval = 0,
}: UseLoominaQueryOptions) {
  const isValidJwt = Boolean(token && typeof token === 'string' && token.split('.').length === 3);
  const shouldFetch = Boolean(isValidJwt && query);

  const fetcher = async (): Promise<QueryResult<T>> => {
    const res = await fetch(`${apiHost}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error((errorJson as { error?: string }).error || `Query failed: ${res.statusText}`);
    }

    return (await res.json()) as QueryResult<T>;
  };

  const swrKey = shouldFetch ? [token, JSON.stringify(query), apiHost] : null;

  const { data, error, isLoading, mutate } = useSWR<QueryResult<T>>(swrKey, fetcher, {
    refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval: 4000,
  });

  return {
    data,
    loading: isLoading,
    error: error as Error | null,
    refetch: mutate,
  };
}

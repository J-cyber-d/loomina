import useSWR from 'swr';
import type { CubeQuery } from '@loomina/shared';

interface UseLoominaQueryOptions {
  token: string;
  query: CubeQuery;
  apiHost?: string;
  refreshInterval?: number;
}

export function useLoominaQuery({
  token,
  query,
  apiHost = 'http://localhost:4000',
  refreshInterval = 0,
}: UseLoominaQueryOptions) {
  const fetcher = async () => {
    const res = await fetch(`${apiHost}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Query failed: ${res.statusText}`);
    }

    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR([token, JSON.stringify(query)], fetcher, {
    refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch: mutate,
  };
}

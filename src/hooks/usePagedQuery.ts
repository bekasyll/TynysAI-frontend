import { useState } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { PageResponse } from '../types';

interface Options<T> {
  initialPage?: number;
  enabled?: boolean;
  refetchInterval?: number | false | ((items: T[]) => number | false);
  retry?: boolean | number | ((failureCount: number, error: unknown) => boolean);
}

export function usePagedQuery<T>(
  baseKey: QueryKey,
  fetcher: (page: number) => Promise<PageResponse<T>>,
  opts: Options<T> = {},
) {
  const [page, setPage] = useState(opts.initialPage ?? 0);

  const query = useQuery({
    queryKey: [...baseKey, page],
    queryFn: () => fetcher(page),
    enabled: opts.enabled,
    retry: opts.retry,
    refetchInterval:
      typeof opts.refetchInterval === 'function'
        ? (q) => (opts.refetchInterval as (items: T[]) => number | false)(
            (q.state.data as PageResponse<T> | undefined)?.content ?? [],
          )
        : opts.refetchInterval,
  });

  const data = query.data;
  return {
    ...query,
    page,
    setPage,
    items: data?.content ?? [],
    pagination: {
      page: data?.page ?? 0,
      totalPages: data?.totalPages ?? 0,
      totalElements: data?.totalElements ?? 0,
      size: data?.size ?? 10,
      onPageChange: setPage,
    },
  };
}

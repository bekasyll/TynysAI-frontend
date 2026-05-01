import { useEffect, useState } from 'react';
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
  const initialPage = opts.initialPage ?? 0;
  const [page, setPage] = useState(initialPage);

  // baseKey carries filter values (e.g. ['admin-reports', search, severity]).
  // When any filter flips, jump back to page 0 so the user isn't stranded
  // on page 5 of a now-much-shorter result set. Stringified so array
  // identity changes (which happen on every render) don't trigger resets.
  const baseKeyStr = JSON.stringify(baseKey);
  useEffect(() => { setPage(initialPage); }, [baseKeyStr]);

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

const IN_FLIGHT = new Set(['PENDING', 'PROCESSING']);

export function isXrayInFlight(status?: string): boolean {
  return !!status && IN_FLIGHT.has(status);
}

/** For useQuery on a single x-ray detail. */
export const xrayDetailRefetch = (q: { state: { data?: { status?: string } } }) =>
  isXrayInFlight(q.state.data?.status) ? 3000 : (false as const);

/** For usePagedQuery on a paged x-ray list. */
export const xrayPagedRefetch = <T extends { status?: string }>(items: T[]) =>
  items.some((x) => isXrayInFlight(x.status)) ? 3000 : (false as const);

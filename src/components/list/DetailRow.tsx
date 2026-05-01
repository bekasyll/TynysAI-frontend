import type { ReactNode } from 'react';

/**
 * Label/value row used in the read-only detail Modal that opens when a
 * user clicks a row in admin/doctor list pages (reports, analyses).
 * Label sits left, value right-aligned, both wrap on overflow.
 */
export default function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-400 uppercase tracking-wide pt-0.5 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right break-words min-w-0">{value}</span>
    </div>
  );
}

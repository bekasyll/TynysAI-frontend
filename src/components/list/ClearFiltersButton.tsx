import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Standalone "Clear filters" button used by patient-side list pages that
 * have selects but no text-search (so they can't reuse <ListFilters/>).
 * Renders nothing when no filters are active.
 */
export default function ClearFiltersButton({ hasActive, onClear }: { hasActive: boolean; onClear: () => void }) {
  const { t } = useTranslation();
  if (!hasActive) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 px-2 py-1.5"
    >
      <X size={12} /> {t('common.clear_filters')}
    </button>
  );
}

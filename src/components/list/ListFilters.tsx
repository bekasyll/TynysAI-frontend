import { useEffect, useState, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  /** Current search input. Caller controls debounce + page reset. */
  search: string;
  onSearchChange: (v: string) => void;
  /** Whether ANY filter (incl. search) is active - shown as "Clear" button hint. */
  hasActive: boolean;
  onClear: () => void;
  /**
   * Page-specific placeholder telling the user what fields the search
   * actually covers (e.g. "patient name, diagnosis, notes"). Falls back
   * to a generic "Search..." if not provided.
   */
  placeholder?: string;
  /** Filter selects rendered to the right of the search box. */
  children?: ReactNode;
}

/**
 * Reused on every list page (analyses / reports / lab-results) for
 * search + clear-filters affordances. Selects are passed as children so
 * each page can show a different combination (status / severity / type / date).
 *
 * Search input is debounced inside this component (300ms) so callers don't
 * each have to re-implement the timeout. Clearing fires immediately.
 */
export default function ListFilters({ search, onSearchChange, hasActive, onClear, placeholder, children }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(search);

  // Sync external resets (e.g. "Clear" button) into the local input.
  useEffect(() => { setDraft(search); }, [search]);

  // Debounce keystrokes -> commit
  useEffect(() => {
    if (draft === search) return;
    const id = setTimeout(() => onSearchChange(draft), 300);
    return () => clearTimeout(id);
  }, [draft]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? t('common.search') + '...'}
          className="form-input !pl-9 !py-2 text-base sm:text-sm w-full"
        />
      </div>
      {children}
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 px-2 py-1.5"
        >
          <X size={12} /> {t('common.clear_filters')}
        </button>
      )}
    </div>
  );
}

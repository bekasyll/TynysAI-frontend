import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalElements, size, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  // Hide only when there's truly nothing to paginate. With at least one
  // element we still render the bar so the user always sees the page
  // indicator and arrows (disabled at boundaries).
  if (totalElements === 0) return null;

  const safeTotalPages = Math.max(totalPages, 1);
  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between gap-2 pt-4 flex-wrap">
      <p className="text-xs sm:text-sm text-gray-500 shrink-0">
        {from}–{to} {t('pagination.of')} {totalElements}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t('pagination.prev')}
        >
          <ChevronLeft size={18} />
        </button>
        <span className="px-2 text-sm text-gray-600 tabular-nums select-none">
          {page + 1} / {safeTotalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= safeTotalPages - 1}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={t('pagination.next')}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

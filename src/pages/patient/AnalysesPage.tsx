import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FileImage, Upload, ChevronRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import ClearFiltersButton from '../../components/list/ClearFiltersButton';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import { ANALYSIS_STATUSES, DISEASE_TYPES } from '../../types';
import type { AnalysisStatus, DiseaseType } from '../../types';

export default function AnalysesPage() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [status, setStatus] = useState<AnalysisStatus | ''>('');
  const [diagnosis, setDiagnosis] = useState<DiseaseType | ''>('');
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const queryClient = useQueryClient();

  // Patient-side: text search removed (filters are sufficient since user
  // sees only their own scans). Status + diagnosis selects remain.
  const filters = {
    status: status || undefined,
    diagnosis: diagnosis || undefined,
  };
  const hasActive = !!status || !!diagnosis;

  const { items, pagination, isLoading } = usePagedQuery(
    ['patient-analyses', status, diagnosis],
    (p) => xraysApi.listForPatient(p, 10, filters).then((r) => r.data.data!),
  );

  const clearAll = () => { setStatus(''); setDiagnosis(''); };

  const initialLoading = isLoading && !hasActive && items.length === 0;

  const deleteMutation = useApiMutation(
    (id: number) => xraysApi.remove(id),
    {
      successMessage: t('analyses.deleted'),
      errorMessage: t('analyses.delete_error'),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['patient-analyses'] });
        setDeleteId(null);
      },
    },
  );

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select className="form-select !py-2 text-base sm:text-sm" value={status} onChange={(e) => setStatus(e.target.value as AnalysisStatus | '')}>
            <option value="">{t('common.any_status')}</option>
            {ANALYSIS_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
          <select className="form-select !py-2 text-base sm:text-sm" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value as DiseaseType | '')}>
            <option value="">{t('common.any_diagnosis')}</option>
            {DISEASE_TYPES.map((d) => <option key={d} value={d}>{t(`disease.${d}`)}</option>)}
          </select>
          <ClearFiltersButton hasActive={hasActive} onClear={clearAll} />
        </div>
        <Link to="/patient/upload">
          <Button icon={<Upload size={16} />}>{t('analyses.upload_btn')}</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title={hasActive ? t('common.no_filter_match') : t('analyses.empty')}
            subtitle={hasActive ? t('common.try_clear_filters') : t('analyses.empty_sub')}
            action={hasActive ? undefined : (
              <Link to="/patient/upload">
                <Button variant="outline" icon={<Upload size={14} />}>{t('common.open')}</Button>
              </Link>
            )}
          />
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_file')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_ai_diagnosis')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('analyses.col_status')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[130px]">{t('analyses.col_date')}</th>
                  <th className="px-2 sm:px-6 py-3 w-[78px] sm:w-[140px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <Link to={`/patient/analyses/${a.id}`} className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <FileImage size={16} className="text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 break-all block">{a.originalFileName}</span>
                          <span className="md:hidden text-xs text-gray-500 break-words block">
                            {a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-600">
                      {a.aiPrimaryDiagnosis ? (
                        <span>{t('disease.' + a.aiPrimaryDiagnosis)}
                          {a.aiConfidence != null && (
                            <span className="text-gray-400 ml-1">({Math.round(a.aiConfidence * 100)}%)</span>
                          )}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 sm:px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="hidden lg:table-cell px-6 py-4 text-gray-500">{format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}</td>
                    <td className="px-2 sm:px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/patient/analyses/${a.id}`}>
                          <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />}>
                            <span className="hidden sm:inline">{t('common.open')}</span>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(a.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-6 pb-4 pt-2">
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId != null && deleteMutation.mutate(deleteId)}
        title={t('analyses.delete_title')}
        message={t('analyses.delete_msg')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

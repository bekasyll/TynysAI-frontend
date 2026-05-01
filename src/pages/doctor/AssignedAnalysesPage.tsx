import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileImage, UserCheck, ChevronRight, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { xraysApi } from '../../api/xrays.api';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import ListFilters from '../../components/list/ListFilters';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { xrayPagedRefetch } from '../../hooks/useXrayAutoRefresh';
import { ANALYSIS_STATUSES, DISEASE_TYPES } from '../../types';
import type { AnalysisStatus, DiseaseType } from '../../types';

export default function AssignedAnalysesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AnalysisStatus | ''>('');
  const [diagnosis, setDiagnosis] = useState<DiseaseType | ''>('');

  const filters = {
    q: search || undefined,
    status: status || undefined,
    diagnosis: diagnosis || undefined,
  };
  const hasActive = !!search || !!status || !!diagnosis;

  const { items, pagination, isLoading } = usePagedQuery(
    ['doctor-assigned-analyses', search, status, diagnosis],
    (p) => xraysApi.listAssignedToDoctor(p, 10, filters).then((r) => r.data.data!),
    { refetchInterval: (list) => xrayPagedRefetch(list) },
  );

  const clearAll = () => { setSearch(''); setStatus(''); setDiagnosis(''); };
  const initialLoading = isLoading && !hasActive && items.length === 0;

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <ListFilters search={search} onSearchChange={setSearch} hasActive={hasActive} onClear={clearAll} placeholder={t('common.search_patient_name')}>
          <select className="form-select !py-2 text-base sm:text-sm" value={status} onChange={(e) => setStatus(e.target.value as AnalysisStatus | '')}>
            <option value="">{t('common.any_status')}</option>
            {ANALYSIS_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
          <select className="form-select !py-2 text-base sm:text-sm" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value as DiseaseType | '')}>
            <option value="">{t('common.any_diagnosis')}</option>
            {DISEASE_TYPES.map((d) => <option key={d} value={d}>{t(`disease.${d}`)}</option>)}
          </select>
        </ListFilters>
        <Link to="/doctor/ai-analysis">
          <Button icon={<Upload size={16} />}>{t('analyses.upload_btn')}</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title={hasActive ? t('common.no_filter_match') : t('assigned_analyses.empty')}
            subtitle={hasActive ? t('common.try_clear_filters') : t('assigned_analyses.empty_desc')}
          />
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_patient')}</th>
                  <th className="pl-0 pr-2 sm:pl-0 sm:pr-6 py-3 text-left font-medium text-gray-500 w-[110px] sm:w-[200px]">{t('assigned_analyses.col_status')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[130px]">{t('assigned_analyses.col_date')}</th>
                  <th className="px-2 sm:px-6 py-3 w-[44px] sm:w-[230px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/analyses/${a.id}`)}
                  >
                    <td className="px-3 sm:px-6 py-4">
                      <div className="font-medium text-gray-900 break-words">{a.patientName ?? '-'}</div>
                      <div className="md:hidden text-xs text-gray-400 mt-0.5 break-words">
                        {format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                      </div>
                    </td>
                    <td className="pl-0 pr-2 sm:pl-0 sm:pr-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">
                      {format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                    </td>
                    <td className="px-2 sm:px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* Reserved slot for the Validate button so the
                            Open button always sits at the same x-coordinate
                            regardless of analysis status. `invisible` keeps
                            layout space but hides the placeholder. */}
                        <div className={(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') ? '' : 'invisible'}>
                          <Button
                            size="sm"
                            icon={<UserCheck size={12} />}
                            onClick={() => navigate(`/doctor/analyses/${a.id}/validate`)}
                            tabIndex={(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') ? 0 : -1}
                          >
                            <span className="hidden sm:inline">{t('assigned_analyses.validate_btn')}</span>
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<ChevronRight size={14} />}
                          onClick={() => navigate(`/doctor/analyses/${a.id}`)}
                          className="hidden sm:inline-flex"
                        >
                          <span className="hidden sm:inline">{t('common.open')}</span>
                        </Button>
                        <ChevronRight size={16} className="text-gray-400 sm:hidden" />
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
    </div>
  );
}

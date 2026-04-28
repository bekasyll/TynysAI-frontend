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
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { xrayPagedRefetch } from '../../hooks/useXrayAutoRefresh';

export default function AssignedAnalysesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['doctor-assigned-analyses'],
    (p) => xraysApi.listAssignedToDoctor(p).then((r) => r.data.data!),
    { refetchInterval: (list) => xrayPagedRefetch(list) },
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/doctor/ai-analysis">
          <Button icon={<Upload size={16} />}>{t('analyses.upload_btn')}</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title={t('assigned_analyses.empty')}
            subtitle={t('assigned_analyses.empty_desc')}
          />
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_patient')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('assigned_analyses.col_status')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[130px]">{t('assigned_analyses.col_date')}</th>
                  <th className="px-2 sm:px-6 py-3 w-[44px] sm:w-[180px]"></th>
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
                        {format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-500">
                      {format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') && (
                          <Button
                            size="sm"
                            icon={<UserCheck size={12} />}
                            onClick={() => navigate(`/doctor/analyses/${a.id}/validate`)}
                          >
                            <span className="hidden sm:inline">{t('assigned_analyses.validate_btn')}</span>
                          </Button>
                        )}
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

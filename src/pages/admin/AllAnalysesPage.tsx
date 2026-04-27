import { FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';

export default function AllAnalysesPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['admin-analyses'],
    (p) => xraysApi.listAll(p).then((r) => r.data.data!),
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title={t('admin.all_analyses_empty')}
            subtitle={t('admin.all_analyses_empty_sub')}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_file')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_ai_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_confidence')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_status')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.patientName ?? '-'}</td>
                    <td className="px-6 py-3 text-gray-600 truncate max-w-[160px]">{a.originalFileName}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {a.aiConfidence != null ? `${Math.round(a.aiConfidence * 100)}%` : '-'}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-3 text-gray-500">{format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}</td>
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

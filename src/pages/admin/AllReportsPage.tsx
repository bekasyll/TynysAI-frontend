import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';

export default function AllReportsPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['admin-reports'],
    (p) => reportsApi.listAll(p).then((r) => r.data.data!),
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('admin.all_reports_empty')}
            subtitle={t('admin.all_reports_empty_sub')}
          />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_doctor')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_severity')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_date')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_sent')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.patientName ?? '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.doctorName ?? '-'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</td>
                    <td className="px-6 py-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-6 py-3 text-gray-500">{format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-3">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('admin.sent_yes')}</span>
                        : <span className="text-xs text-gray-400">{t('admin.sent_no')}</span>}
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

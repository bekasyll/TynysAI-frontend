import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function AllReportsPage() {
  const [page, setPage] = useState(0);
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: async () => { const r = await adminApi.getAllReports(page); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500">{t('admin.all_reports_empty')}</p>
          </div>
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
                {data?.content.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.patientName ?? '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{r.doctorName ?? '—'}</td>
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
              <Pagination
                page={data?.page ?? 0}
                totalPages={data?.totalPages ?? 0}
                totalElements={data?.totalElements ?? 0}
                size={data?.size ?? 20}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

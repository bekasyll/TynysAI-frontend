import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function AllAnalysesPage() {
  const [page, setPage] = useState(0);
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analyses', page],
    queryFn: async () => { const r = await adminApi.getAllAnalyses(page); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <FileImage size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500">{t('admin.all_analyses_empty')}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_file')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_type')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_ai_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_confidence')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_status')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{a.patientName ?? '—'}</td>
                    <td className="px-6 py-3 text-gray-600 truncate max-w-[160px]">{a.originalFileName}</td>
                    <td className="px-6 py-3 text-gray-600">{t('imageType.' + a.imageType)}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {a.aiConfidence != null ? `${Math.round(a.aiConfidence * 100)}%` : '—'}
                    </td>
                    <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-3 text-gray-500">{format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}</td>
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

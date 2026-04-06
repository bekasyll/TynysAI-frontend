import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileImage, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { doctorsApi } from '../../api/doctors.api';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function AssignedAnalysesPage() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-assigned-analyses', page],
    queryFn: async () => { const r = await doctorsApi.getMyAssignedAnalyses(page); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <FileImage size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('assigned_analyses.empty')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('assigned_analyses.empty_desc')}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_type')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_status')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('assigned_analyses.col_date')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{a.patientName ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{t('imageType.' + a.imageType)}</td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 text-gray-500">
                      {format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
                    </td>
                    <td className="px-6 py-4">
                      {(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') && (
                        <Button
                          size="sm"
                          icon={<UserCheck size={12} />}
                          onClick={() => navigate(`/doctor/analyses/${a.id}/validate`)}
                        >
                          {t('assigned_analyses.validate_btn')}
                        </Button>
                      )}
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
                size={data?.size ?? 10}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

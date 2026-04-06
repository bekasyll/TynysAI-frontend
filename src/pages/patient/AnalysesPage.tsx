import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileImage, Upload, ChevronRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { patientsApi } from '../../api/patients.api';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function AnalysesPage() {
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { success, error } = useToast();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-analyses', page],
    queryFn: async () => { const r = await patientsApi.getMyAnalyses(page); return r.data.data!; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsApi.deleteAnalysis(id),
    onSuccess: () => {
      success(t('analyses.deleted'));
      queryClient.invalidateQueries({ queryKey: ['patient-analyses'] });
      setDeleteId(null);
    },
    onError: () => error(t('analyses.delete_error')),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/patient/upload">
          <Button icon={<Upload size={16} />}>{t('analyses.upload_btn')}</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <FileImage size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('analyses.empty')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('analyses.empty_sub')}</p>
            <Link to="/patient/upload" className="mt-4 inline-block">
              <Button variant="outline" icon={<Upload size={14} />}>{t('common.open')}</Button>
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_file')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_type')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_ai_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_status')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('analyses.col_date')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <FileImage size={16} className="text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">{a.originalFileName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{t('imageType.' + a.imageType)}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {a.aiPrimaryDiagnosis ? (
                        <span>{t('disease.' + a.aiPrimaryDiagnosis)}
                          {a.aiConfidence != null && (
                            <span className="text-gray-400 ml-1">({Math.round(a.aiConfidence * 100)}%)</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/patient/analyses/${a.id}`}>
                          <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />}>{t('common.open')}</Button>
                        </Link>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteId(a.id)} />
                      </div>
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

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('analyses.delete_title')}
        message={t('analyses.delete_msg')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

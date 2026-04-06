import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function DoctorReportsPage() {
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-reports', page],
    queryFn: async () => { const r = await doctorsApi.getMyReports(page); return r.data.data!; },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => doctorsApi.sendReport(id),
    onSuccess: () => {
      success(t('doctor_reports.send_success'));
      queryClient.invalidateQueries({ queryKey: ['doctor-reports'] });
    },
    onError: () => error(t('doctor_reports.send_error')),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={16} />} onClick={() => navigate('/doctor/reports/create')}>
          {t('doctor_reports.create_btn')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('doctor_reports.empty')}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_severity')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_date')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_status')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.patientName ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</td>
                    <td className="px-6 py-4"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-4">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('doctor_reports.sent')}</span>
                        : <span className="text-xs text-gray-400">{t('doctor_reports.draft')}</span>}
                    </td>
                    <td className="px-6 py-4">
                      {!r.sentToPatient && (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Send size={12} />}
                          loading={sendMutation.isPending}
                          onClick={() => sendMutation.mutate(r.id)}
                        >
                          {t('doctor_reports.send_btn')}
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

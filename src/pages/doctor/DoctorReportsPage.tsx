import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';

export default function DoctorReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['doctor-reports'],
    (p) => reportsApi.listForDoctor(p).then((r) => r.data.data!),
  );

  const sendMutation = useApiMutation(
    (id: number) => reportsApi.send(id),
    {
      successMessage: t('doctor_reports.send_success'),
      errorMessage: t('doctor_reports.send_error'),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-reports'] }),
    },
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button icon={<Plus size={16} />} onClick={() => navigate('/doctor/reports/create')}>
          {t('doctor_reports.create_btn')}
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t('doctor_reports.empty')}
            subtitle={t('doctor_reports.empty_sub')}
          />
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
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{r.patientName ?? '-'}</td>
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
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

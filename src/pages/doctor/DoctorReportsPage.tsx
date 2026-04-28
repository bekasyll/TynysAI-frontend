import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Send, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import type { DiagnosticReportResponse } from '../../types';

export default function DoctorReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [selected, setSelected] = useState<DiagnosticReportResponse | null>(null);

  const { items, pagination, isLoading } = usePagedQuery(
    ['doctor-reports'],
    (p) => reportsApi.listForDoctor(p).then((r) => r.data.data!),
  );

  const sendMutation = useApiMutation(
    (id: number) => reportsApi.send(id),
    {
      successMessage: t('doctor_reports.send_success'),
      errorMessage: t('doctor_reports.send_error'),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['doctor-reports'] });
        setSelected(null);
      },
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
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_patient')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('doctor_reports.col_diagnosis')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[90px] sm:w-[110px]">{t('doctor_reports.col_severity')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[130px]">{t('doctor_reports.col_date')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[100px]">{t('doctor_reports.col_status')}</th>
                  <th className="px-2 sm:px-6 py-3 w-[44px] sm:w-[120px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-3 sm:px-6 py-4">
                      <div className="font-medium text-gray-900 break-words">{r.patientName ?? '-'}</div>
                      <div className="md:hidden text-xs text-gray-500 break-words">
                        {r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-gray-600 break-words">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</td>
                    <td className="px-2 sm:px-6 py-4"><SeverityBadge severity={r.severity} /></td>
                    <td className="hidden lg:table-cell px-6 py-4 text-gray-500 break-words">{format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('doctor_reports.sent')}</span>
                        : <span className="text-xs text-gray-400">{t('doctor_reports.draft')}</span>}
                    </td>
                    <td className="px-2 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {!r.sentToPatient && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Send size={12} />}
                            loading={sendMutation.isPending}
                            onClick={() => sendMutation.mutate(r.id)}
                          >
                            <span className="hidden sm:inline">{t('doctor_reports.send_btn')}</span>
                          </Button>
                        )}
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

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.patientName ?? '-'}
        size="md"
      >
        {selected && (
          <div className="p-5 space-y-3 text-sm">
            <DetailRow
              label={t('doctor_reports.col_diagnosis')}
              value={selected.finalDiagnosisDisplayName ?? t('disease.' + selected.finalDiagnosis)}
            />
            <DetailRow label={t('doctor_reports.col_severity')} value={<SeverityBadge severity={selected.severity} />} />
            <DetailRow
              label={t('doctor_reports.col_date')}
              value={format(new Date(selected.createdAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale })}
            />
            <DetailRow
              label={t('doctor_reports.col_status')}
              value={selected.sentToPatient
                ? <span className="text-green-600 font-medium">{t('doctor_reports.sent')}</span>
                : <span className="text-gray-400">{t('doctor_reports.draft')}</span>}
            />
            {selected.reportNumber && <DetailRow label="№" value={selected.reportNumber} />}
            {selected.clinicalFindings && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('reports.clinical_findings') ?? 'Clinical findings'}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">{selected.clinicalFindings}</p>
              </div>
            )}
            {!selected.sentToPatient && (
              <div className="pt-2">
                <Button
                  className="w-full"
                  icon={<Send size={14} />}
                  loading={sendMutation.isPending}
                  onClick={() => sendMutation.mutate(selected.id)}
                >
                  {t('doctor_reports.send_btn')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-400 uppercase tracking-wide pt-0.5 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right break-words min-w-0">{value}</span>
    </div>
  );
}

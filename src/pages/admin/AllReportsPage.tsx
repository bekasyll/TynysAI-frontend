import { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import type { DiagnosticReportResponse } from '../../types';

export default function AllReportsPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [selected, setSelected] = useState<DiagnosticReportResponse | null>(null);

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
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_patient')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_doctor')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_diagnosis')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[90px] sm:w-[110px]">{t('admin.col_severity')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[120px]">{t('admin.col_date')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[90px]">{t('admin.col_sent')}</th>
                  <th className="md:hidden px-2 py-3 w-[36px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(r)}
                  >
                    <td className="px-3 sm:px-6 py-3">
                      <div className="font-medium text-gray-900 break-words">{r.patientName ?? '-'}</div>
                      <div className="md:hidden text-xs text-gray-500 break-words">
                        {r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-600 break-words">{r.doctorName ?? '-'}</td>
                    <td className="hidden lg:table-cell px-6 py-3 text-gray-600 break-words">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</td>
                    <td className="px-2 sm:px-6 py-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-500 break-words">{format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="hidden sm:table-cell px-6 py-3">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('admin.sent_yes')}</span>
                        : <span className="text-xs text-gray-400">{t('admin.sent_no')}</span>}
                    </td>
                    <td className="md:hidden px-2 py-3 text-gray-400"><ChevronRight size={16} /></td>
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
            <DetailRow label={t('admin.col_doctor')} value={selected.doctorName ?? '-'} />
            <DetailRow
              label={t('admin.col_diagnosis')}
              value={selected.finalDiagnosisDisplayName ?? t('disease.' + selected.finalDiagnosis)}
            />
            <DetailRow label={t('admin.col_severity')} value={<SeverityBadge severity={selected.severity} />} />
            <DetailRow
              label={t('admin.col_date')}
              value={format(new Date(selected.createdAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale })}
            />
            <DetailRow
              label={t('admin.col_sent')}
              value={selected.sentToPatient
                ? <span className="text-green-600 font-medium">{t('admin.sent_yes')}</span>
                : <span className="text-gray-400">{t('admin.sent_no')}</span>}
            />
            {selected.reportNumber && <DetailRow label="№" value={selected.reportNumber} />}
            {selected.clinicalFindings && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('reports.clinical_findings') ?? 'Clinical findings'}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">{selected.clinicalFindings}</p>
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

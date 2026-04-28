import { useState } from 'react';
import { FileImage, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import { StatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import type { XrayAnalysisResponse } from '../../types';

export default function AllAnalysesPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [selected, setSelected] = useState<XrayAnalysisResponse | null>(null);

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
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_patient')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_file')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_ai_diagnosis')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[100px]">{t('admin.col_confidence')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('admin.col_status')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[120px]">{t('admin.col_date')}</th>
                  <th className="md:hidden px-2 py-3 w-[36px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <td className="px-3 sm:px-6 py-3">
                      <div className="font-medium text-gray-900 break-words">{a.patientName ?? '-'}</div>
                      <div className="md:hidden text-xs text-gray-500 break-all">{a.originalFileName}</div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-600 break-all">{a.originalFileName}</td>
                    <td className="hidden lg:table-cell px-6 py-3 text-gray-600 break-all">
                      {a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : '-'}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-3 text-gray-600">
                      {a.aiConfidence != null ? `${Math.round(a.aiConfidence * 100)}%` : '-'}
                    </td>
                    <td className="px-2 sm:px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-500 break-all">{format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}</td>
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
            <DetailRow label={t('admin.col_file')} value={selected.originalFileName} />
            <DetailRow label={t('admin.col_status')} value={<StatusBadge status={selected.status} />} />
            <DetailRow
              label={t('admin.col_ai_diagnosis')}
              value={selected.aiPrimaryDiagnosis ? t('disease.' + selected.aiPrimaryDiagnosis) : '-'}
            />
            <DetailRow
              label={t('admin.col_confidence')}
              value={selected.aiConfidence != null ? `${Math.round(selected.aiConfidence * 100)}%` : '-'}
            />
            {selected.assignedDoctorName && (
              <DetailRow label={t('admin.col_doctor')} value={selected.assignedDoctorName} />
            )}
            {selected.validatedByDoctorName && (
              <>
                <DetailRow label={t('analyses.doctor_diagnosis')} value={selected.doctorDiagnosis ? t('disease.' + selected.doctorDiagnosis) : '-'} />
                <DetailRow label={t('analyses.doctor_label')} value={selected.validatedByDoctorName} />
              </>
            )}
            <DetailRow
              label={t('admin.col_date')}
              value={format(new Date(selected.uploadedAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale })}
            />
            {selected.aiFindings && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('analyses.description_label')}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">{selected.aiFindings}</p>
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

import { Link } from 'react-router-dom';
import { FileText, ChevronRight, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';

export default function ReportsPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['patient-reports'],
    (p) => reportsApi.listForPatient(p).then((r) => r.data.data!),
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={FileText}
            title={t('reports.empty')}
            subtitle={t('reports.empty_sub')}
          />
        </div>
      ) : (
        <>
          {items.map((r) => (
            <Link key={r.id} to={`/patient/reports/${r.id}`}>
              <Card className="hover:border-blue-300 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={22} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      <p className="font-semibold text-gray-900 break-words">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</p>
                      <SeverityBadge severity={r.severity} />
                    </div>
                    <p className="text-sm text-gray-500 break-words">
                      {t('reports.doctor_label')}: {r.doctorName} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}
                      {r.reportNumber && ` · №${r.reportNumber}`}
                    </p>
                    {r.xrayAnalysisId != null && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-blue-600">
                        <FileImage size={12} />
                        {t('reports.linked_analysis')}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, FileImage } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { SeverityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import ClearFiltersButton from '../../components/list/ClearFiltersButton';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { SEVERITY_TYPES, DISEASE_TYPES } from '../../types';
import type { Severity, DiseaseType } from '../../types';

export default function ReportsPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [diagnosis, setDiagnosis] = useState<DiseaseType | ''>('');

  // Patient-side: text search removed (filters cover the relevant axes).
  const filters = {
    severity: severity || undefined,
    diagnosis: diagnosis || undefined,
  };
  const hasActive = !!severity || !!diagnosis;

  const { items, pagination, isLoading } = usePagedQuery(
    ['patient-reports', severity, diagnosis],
    (p) => reportsApi.listForPatient(p, 10, filters).then((r) => r.data.data!),
  );

  const clearAll = () => { setSeverity(''); setDiagnosis(''); };
  const initialLoading = isLoading && !hasActive && items.length === 0;

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center gap-2">
        <select className="form-select !py-2 text-base sm:text-sm" value={severity} onChange={(e) => setSeverity(e.target.value as Severity | '')}>
          <option value="">{t('common.any_severity')}</option>
          {SEVERITY_TYPES.map((s) => <option key={s} value={s}>{t(`severity.${s}`)}</option>)}
        </select>
        <select className="form-select !py-2 text-base sm:text-sm" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value as DiseaseType | '')}>
          <option value="">{t('common.any_diagnosis')}</option>
          {DISEASE_TYPES.map((d) => <option key={d} value={d}>{t(`disease.${d}`)}</option>)}
        </select>
        <ClearFiltersButton hasActive={hasActive} onClear={clearAll} />
      </div>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={FileText}
            title={hasActive ? t('common.no_filter_match') : t('reports.empty')}
            subtitle={hasActive ? t('common.try_clear_filters') : t('reports.empty_sub')}
          />
        </div>
      ) : (
        <>
          {/* Wrap the cards in their own space-y - the parent's space-y-4
              doesn't reach them because <Link> renders as <a> (inline) and
              vertical margins are ignored on inline boxes. */}
          <div className="space-y-3">
          {items.map((r) => (
            <Link key={r.id} to={`/patient/reports/${r.id}`} className="block">
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
                      {t('reports.doctor_label')}: {r.doctorName} · {format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}
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
          </div>
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

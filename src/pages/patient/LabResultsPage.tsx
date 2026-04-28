import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { labResultsApi } from '../../api/medical-records.api';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import type { LabResultResponse } from '../../types';

function LabResultCard({ result }: { result: LabResultResponse }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const fields: [string, number | string | undefined, string][] = [
    ['Hemoglobin', result.hemoglobin, 'g/L'],
    ['WBC', result.wbc, '×10⁹/L'],
    ['RBC', result.rbc, '×10¹²/L'],
    ['Platelets', result.platelets, '×10⁹/L'],
    ['Hematocrit', result.hematocrit, '%'],
    ['CRP', result.crp, 'mg/L'],
    ['ESR', result.esr, 'mm/h'],
    ['Procalcitonin', result.proCalcitonin, 'ng/mL'],
    ['Glucose', result.glucose, 'mmol/L'],
    ['Creatinine', result.creatinine, 'μmol/L'],
    ['ALT', result.alt, 'U/L'],
    ['AST', result.ast, 'U/L'],
    ['SpO₂', result.spo2, '%'],
    ['FEV1', result.fev1, 'L'],
    ['FVC', result.fvc, 'L'],
    ['PCR', result.pcrResult, ''],
    ['IGRA', result.igraResult, ''],
    ['Culture', result.cultureResult, ''],
  ].filter(([, v]) => v != null) as [string, number | string, string][];

  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <FlaskConical size={18} className="text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 break-words">{t('labTest.' + result.testType)}</p>
            <p className="text-sm text-gray-500 break-words">
              {result.labName && `${result.labName} · `}
              {format(new Date(result.testDate), 'd MMMM yyyy', { locale: dateLocale })}
              {result.addedByDoctorName && ` · ${t('lab_results.doctor_label')}: ${result.addedByDoctorName}`}
            </p>
          </div>
        </div>
        {fields.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {expanded && fields.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fields.map(([label, value, unit]) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{value} {unit}</p>
            </div>
          ))}
        </div>
      )}

      {expanded && result.notes && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <span className="font-medium">{t('lab_results.notes_label')}: </span>{result.notes}
        </div>
      )}
      {expanded && result.rawResultText && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono text-xs whitespace-pre-wrap">
          {result.rawResultText}
        </div>
      )}
    </Card>
  );
}

export default function LabResultsPage() {
  const { t } = useTranslation();

  const { items, pagination, isLoading } = usePagedQuery(
    ['patient-lab-results'],
    (p) => labResultsApi.listForPatient(p).then((r) => r.data.data!),
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={FlaskConical}
            title={t('lab_results.empty')}
            subtitle={t('lab_results.empty_sub')}
          />
        </div>
      ) : (
        <>
          {items.map((r) => <LabResultCard key={r.id} result={r} />)}
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
}

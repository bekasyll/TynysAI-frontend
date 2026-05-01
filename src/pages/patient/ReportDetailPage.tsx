import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportsApi } from '../../api/medical-records.api';
import { xraysApi } from '../../api/xrays.api';
import { SeverityBadge, StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfidenceBar from '../../components/ui/ConfidenceBar';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['patient-report', id],
    queryFn: async () => { const r = await reportsApi.getForPatient(id!); return r.data.data!; },
  });

  const { data: analysis } = useQuery({
    queryKey: ['patient-analysis', data?.xrayAnalysisId],
    queryFn: async () => { const r = await xraysApi.getOne(data!.xrayAnalysisId!, data!.patientId); return r.data.data!; },
    enabled: data?.xrayAnalysisId != null,
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return <div className="text-center py-16 text-gray-400">{t('reports.not_found')}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/patient/reports"><Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>{t('common.back')}</Button></Link>
        <SeverityBadge severity={data.severity} />
      </div>

      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 font-mono mb-1">{data.reportNumber}</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {data.finalDiagnosisDisplayName ?? t('disease.' + data.finalDiagnosis)}
            </h2>
          </div>
          <SeverityBadge severity={data.severity} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t('reports.doctor_label')}</p>
            <p className="font-medium text-gray-900">{data.doctorName}</p>
            {data.doctorSpecialization && <p className="text-gray-400 text-xs">{data.doctorSpecialization}</p>}
          </div>
          <div>
            <p className="text-gray-500">{t('reports.date_label')}</p>
            <p className="font-medium text-gray-900">{format(new Date(data.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}</p>
          </div>
          {data.followUpDate && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-orange-500" />
              <div>
                <p className="text-gray-500">{t('reports.next_visit')}</p>
                <p className="font-medium text-gray-900">{format(new Date(data.followUpDate), 'dd/MM/yyyy', { locale: dateLocale })}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {data.clinicalFindings && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">{t('reports.clinical_findings')}</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{data.clinicalFindings}</p>
        </Card>
      )}

      {data.reportText && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">{t('reports.report_text')}</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap">{data.reportText}</p>
        </Card>
      )}

      {(data.treatmentRecommendations || data.medicationRecommendations || data.lifestyleRecommendations) && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t('reports.recommendations')}</h3>
          <div className="space-y-4">
            {data.treatmentRecommendations && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('reports.treatment')}</p>
                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 whitespace-pre-wrap">{data.treatmentRecommendations}</p>
              </div>
            )}
            {data.medicationRecommendations && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('reports.medications')}</p>
                <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3 whitespace-pre-wrap">{data.medicationRecommendations}</p>
              </div>
            )}
            {data.lifestyleRecommendations && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{t('reports.lifestyle')}</p>
                <p className="text-sm text-gray-600 bg-yellow-50 rounded-lg p-3 whitespace-pre-wrap">{data.lifestyleRecommendations}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {analysis && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('reports.linked_analysis')}</h3>
            <div className="ml-auto"><StatusBadge status={analysis.status} /></div>
          </div>
          <ConfidenceBar
            confidence={analysis.aiConfidence}
            diagnosis={analysis.aiPrimaryDiagnosis ?? undefined}
            size="sm"
          />
          {analysis.aiFindings && (
            <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{analysis.aiFindings}</p>
          )}
        </Card>
      )}
    </div>
  );
}

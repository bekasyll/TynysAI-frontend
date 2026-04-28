import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileImage, Brain, UserCheck, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { xrayDetailRefetch } from '../../hooks/useXrayAutoRefresh';

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['analysis', id],
    queryFn: async () => { const r = await xraysApi.getOne(id!); return r.data.data!; },
    refetchInterval: xrayDetailRefetch,
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return <div className="text-center py-16 text-gray-400">{t('analyses.not_found')}</div>;

  const confidence = data.aiConfidence != null ? Math.round(data.aiConfidence * 100) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/patient/analyses"><Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>{t('common.back')}</Button></Link>
        <StatusBadge status={data.status} />
        {(data.status === 'PENDING' || data.status === 'PROCESSING') && (
          <Button variant="ghost" size="sm" icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />} onClick={() => refetch()}>
            {t('analyses.refresh')}
          </Button>
        )}
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            <FileImage size={28} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 break-all">{data.originalFileName}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              {data.contentType && <span>{data.contentType}</span>}
              {data.fileSizeBytes && <span>{(data.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>}
              <span>{t('analyses.uploaded_at')}: {format(new Date(data.uploadedAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale })}</span>
            </div>
          </div>
        </div>
        {data.patientNotes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <span className="font-medium">{t('analyses.notes_label')}: </span>{data.patientNotes}
          </div>
        )}
      </Card>

      {(data.status === 'PENDING' || data.status === 'PROCESSING') && (
        <Card>
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-blue-600 animate-pulse" />
            </div>
            <p className="font-semibold text-gray-900">{t('analyses.processing_title')}</p>
            <p className="text-gray-500 text-sm mt-1">{t('analyses.processing_sub')}</p>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
              onClick={() => refetch()}
              className="mt-4"
            >
              {t('analyses.refresh')}
            </Button>
          </div>
        </Card>
      )}

      {data.aiPrimaryDiagnosis && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Brain size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('analyses.ai_result')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">{t('analyses.diagnosis_label')}</p>
              <p className="font-semibold text-gray-900">{t('disease.' + data.aiPrimaryDiagnosis)}</p>
            </div>
            {confidence != null && (
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">{t('analyses.confidence_label')}</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{confidence}%</p>
                  <div className="flex-1 h-2 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${confidence}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {data.aiFindings && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">{t('analyses.description_label')}</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{data.aiFindings}</p>
            </div>
          )}

          {data.aiDetectedAbnormalities && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('analyses.abnormalities_label')}</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{data.aiDetectedAbnormalities}</p>
            </div>
          )}
          {data.analyzedAt && (
            <p className="text-xs text-gray-400 mt-4">{t('analyses.analyzed_at')}: {format(new Date(data.analyzedAt), 'd MMMM yyyy, HH:mm', { locale: dateLocale })}</p>
          )}
        </Card>
      )}

      {data.validatedByDoctorName && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">{t('analyses.doctor_conclusion')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">{t('analyses.doctor_diagnosis')}</p>
              <p className="font-semibold text-gray-900">
                {data.doctorDiagnosis ? t('disease.' + data.doctorDiagnosis) : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{t('analyses.doctor_label')}</p>
              <p className="font-semibold text-gray-900">{data.validatedByDoctorName}</p>
              {data.validatedAt && (
                <p className="text-xs text-gray-500 mt-0.5">{format(new Date(data.validatedAt), 'd MMM yyyy', { locale: dateLocale })}</p>
              )}
            </div>
          </div>
          {data.doctorNotes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">{t('analyses.doctor_comment')}</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{data.doctorNotes}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { ArrowLeft, Brain, UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import InteractiveGradcam from '../../components/ui/InteractiveGradcam';
import { useApiMutation } from '../../hooks/useApiMutation';
import { xrayDetailRefetch } from '../../hooks/useXrayAutoRefresh';
import { DISEASE_TYPES } from '../../types';
import type { DoctorValidationRequest } from '../../types';

export default function ValidateAnalysisPage() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: analysis, isLoading } = useQuery({
    queryKey: ['doctor-analysis', analysisId],
    queryFn: async () => { const r = await xraysApi.getDoctorOne(analysisId!); return r.data.data!; },
    // Auto-poll while the AI is still working (PENDING/PROCESSING). Stops as
    // soon as the analysis lands in a terminal status, so we're not hammering
    // the API after the result is final.
    refetchInterval: xrayDetailRefetch,
  });

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting } } = useForm<DoctorValidationRequest>({
    defaultValues: { agreesWithAi: true },
  });

  const mutation = useApiMutation(
    (data: DoctorValidationRequest) => xraysApi.validate(analysisId!, data),
    {
      successMessage: t('validate.success'),
      errorMessage: t('validate.error'),
      onSuccess: () => navigate('/doctor/assigned-analyses'),
    },
  );

  const agreesWithAi = watch('agreesWithAi');

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    let revoke = '';
    apiClient
      .get(`/xrays/${analysisId}/image`, { responseType: 'blob' })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        revoke = url;
        setImageUrl(url);
      })
      .catch(() => setImageUrl(null));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [analysisId]);

  if (isLoading) return <PageSpinner />;
  if (!analysis) return <div className="text-center py-16 text-gray-400">{t('analyses.not_found')}</div>;

  const confidence = analysis.aiConfidence != null ? Math.round(analysis.aiConfidence * 100) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<ArrowLeft size={16} />}
        onClick={() => navigate(-1)}
      >
        {t('common.back')}
      </Button>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{t('validate.file_info')}</h3>
          <StatusBadge status={analysis.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">{t('validate.file_label')}</p>
            <p className="font-medium text-gray-900">{analysis.originalFileName}</p>
          </div>
          <div>
            <p className="text-gray-400">{t('validate.patient_label')}</p>
            <p className="font-medium text-gray-900">{analysis.patientName ?? '-'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">{t('validate.ai_result')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">{t('validate.diagnosis_label')}</p>
            <p className="font-semibold text-gray-900">
              {analysis.aiPrimaryDiagnosis ? t('disease.' + analysis.aiPrimaryDiagnosis) : '-'}
            </p>
          </div>
          {confidence != null && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{t('validate.confidence_label')}</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{confidence}%</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${confidence}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {analysis.aiFindings && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 whitespace-pre-wrap">{analysis.aiFindings}</div>
        )}
      </Card>

      {analysis.gradcamAvailable && analysis.aiPrimaryDiagnosis && analysis.aiPrimaryDiagnosis !== 'OTHER' && analysisId && (
        <Card>
          <InteractiveGradcam
            analysisId={analysisId}
            imageUrl={imageUrl}
            aiPrimaryDiagnosis={analysis.aiPrimaryDiagnosis}
            aiAllPredictionsJson={analysis.aiAllPredictionsJson}
            gradcamAvailable={analysis.gradcamAvailable ?? false}
          />
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <UserCheck size={20} className="text-purple-600" />
          <h3 className="font-semibold text-gray-900">{t('validate.title')}</h3>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">{t('validate.agree_question')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue('agreesWithAi', true);
                  if (analysis.aiPrimaryDiagnosis) setValue('doctorDiagnosis', analysis.aiPrimaryDiagnosis);
                }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                  agreesWithAi ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                <CheckCircle size={18} /> {t('validate.agree_yes')}
              </button>
              <button
                type="button"
                onClick={() => setValue('agreesWithAi', false)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                  !agreesWithAi ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                <XCircle size={18} /> {t('validate.agree_no')}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">{t('validate.doctor_diagnosis')}</label>
            <select
              className="form-input"
              {...register('doctorDiagnosis', { required: t('common.required') })}
              defaultValue={analysis.aiPrimaryDiagnosis ?? ''}
            >
              <option value="">{t('validate.choose_diagnosis')}</option>
              {DISEASE_TYPES.map((k) => (
                <option key={k} value={k}>{t('disease.' + k)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">{t('validate.doctor_comment')}</label>
            <textarea
              className="form-input resize-none"
              rows={4}
              placeholder={t('validate.comment_placeholder')}
              {...register('doctorNotes')}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              icon={<UserCheck size={16} />}
              loading={isSubmitting || mutation.isPending}
            >
              {t('validate.confirm_btn')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

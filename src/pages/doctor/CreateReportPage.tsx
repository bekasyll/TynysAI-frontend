import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FileText, Send, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { DiagnosticReportRequest } from '../../types';
import { DISEASE_TYPES, SEVERITY_TYPES } from '../../types';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const patientId = params.get('patientId') ?? '';
  const appointmentIdParam = params.get('appointmentId') ?? '';
  const { success, error } = useToast();
  const { t } = useTranslation();

  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctor-patients-all'],
    queryFn: async () => { const r = await doctorsApi.getPatients(0, 100); return r.data.data!; },
  });

  const { data: labs } = useQuery({
    queryKey: ['doctor-patient-labs', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const r = await doctorsApi.getPatientLabResults(patientId, 0, 50);
      return r.data.data!;
    },
    enabled: !!patientId,
  });

  const { data: appointments } = useQuery({
    queryKey: ['doctor-appointments-accepted', patientId],
    queryFn: async () => {
      const r = await doctorsApi.getMyAppointments('ACCEPTED', 0, 50);
      return r.data.data!.content.filter((a) => !patientId || a.patientId === patientId);
    },
    enabled: !!patientId,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<DiagnosticReportRequest>({
    defaultValues: { patientId, appointmentId: appointmentIdParam, severity: 'NONE', sendToPatient: true },
  });

  const watchedPatientId = watch('patientId');

  // Auto-set xrayAnalysisId from the linked appointment
  const linkedAppointment = appointments?.find((a) => a.id === appointmentIdParam);

  useEffect(() => {
    if (linkedAppointment?.xrayAnalysisId) {
      setValue('xrayAnalysisId', linkedAppointment.xrayAnalysisId);
    }
  }, [linkedAppointment?.xrayAnalysisId]);

  const { data: linkedAnalysis } = useQuery({
    queryKey: ['doctor-analysis', linkedAppointment?.xrayAnalysisId],
    queryFn: async () => { const r = await doctorsApi.getAnalysis(linkedAppointment!.xrayAnalysisId!); return r.data.data!; },
    enabled: !!linkedAppointment?.xrayAnalysisId,
  });

  const mutation = useMutation({
    mutationFn: (data: DiagnosticReportRequest) => doctorsApi.createReport(data),
    onSuccess: (res) => {
      success(t('create_report.success'));
      navigate(`/doctor/patients/${res.data.data!.patientId}`);
    },
    onError: () => error(t('create_report.error')),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <FileText size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('create_report.base_info')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('create_report.patient_label')}</label>
              <select className="form-input" {...register('patientId', { required: t('common.required') })}>
                <option value="">{t('create_report.choose_patient')}</option>
                {patients?.content.map((p) => (
                  <option key={p.userId} value={p.userId}>{p.fullName}</option>
                ))}
              </select>
              {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
            </div>

            {watchedPatientId && appointments && appointments.length > 0 && (
              <div>
                <label className="form-label">{t('create_report.linked_appointment')}</label>
                <select className="form-input" {...register('appointmentId')}>
                  <option value="">{t('create_report.no_appointment')}</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.patientName}{a.appointmentDate ? ` — ${new Date(a.appointmentDate).toLocaleDateString()}` : ''}{a.patientComplaints ? ` (${a.patientComplaints.slice(0, 40)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkedAnalysis && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Brain size={15} className="text-blue-600 shrink-0" />
                  <p className="text-sm font-medium text-blue-800">{t('create_report.patient_ai_result')}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-blue-600">{t('validate.diagnosis_label')}</p>
                    <p className="font-semibold text-gray-900">
                      {linkedAnalysis.aiPrimaryDiagnosisDisplayName ?? (linkedAnalysis.aiPrimaryDiagnosis ? t('disease.' + linkedAnalysis.aiPrimaryDiagnosis) : '—')}
                    </p>
                  </div>
                  {linkedAnalysis.aiConfidence != null && (
                    <div>
                      <p className="text-xs text-blue-600">{t('validate.confidence_label')}</p>
                      <p className="font-semibold text-gray-900">{Math.round(linkedAnalysis.aiConfidence * 100)}%</p>
                    </div>
                  )}
                </div>
                {linkedAnalysis.aiFindings && (
                  <p className="text-xs text-gray-600 bg-white rounded-lg p-2">{linkedAnalysis.aiFindings}</p>
                )}
                <input type="hidden" {...register('xrayAnalysisId')} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('create_report.diagnosis_label')}</label>
                <select className="form-input" {...register('finalDiagnosis', { required: t('common.required') })}>
                  <option value="">{t('create_report.choose')}</option>
                  {DISEASE_TYPES.map((k) => (
                    <option key={k} value={k}>{t('disease.' + k)}</option>
                  ))}
                </select>
                {errors.finalDiagnosis && <p className="form-error">{errors.finalDiagnosis.message}</p>}
              </div>
              <div>
                <label className="form-label">{t('create_report.severity_label')}</label>
                <select className="form-input" {...register('severity', { required: true })}>
                  {SEVERITY_TYPES.map((k) => (
                    <option key={k} value={k}>{t('severity.' + k)}</option>
                  ))}
                </select>
              </div>
            </div>


{watchedPatientId && labs && labs.content.length > 0 && (
              <div>
                <label className="form-label">{t('create_report.linked_lab')}</label>
                <select className="form-input" {...register('labResultId')}>
                  <option value="">{t('create_report.no_lab')}</option>
                  {labs.content.map((l) => (
                    <option key={l.id} value={l.id}>{l.testTypeDisplayName ?? l.testType} — {l.testDate}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="form-label">{t('create_report.follow_up')}</label>
              <input type="date" className="form-input" {...register('followUpDate')} />
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t('create_report.clinical_section')}</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('create_report.clinical_label')}</label>
              <textarea className="form-input resize-none" rows={4}
                placeholder={t('create_report.clinical_placeholder')}
                {...register('clinicalFindings', { required: t('common.required') })} />
              {errors.clinicalFindings && <p className="form-error">{errors.clinicalFindings.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('create_report.report_text_label')}</label>
              <textarea className="form-input resize-none" rows={5}
                placeholder={t('create_report.report_text_placeholder')}
                {...register('reportText', { required: t('common.required') })} />
              {errors.reportText && <p className="form-error">{errors.reportText.message}</p>}
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t('create_report.rec_section')}</h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('create_report.treatment_label')}</label>
              <textarea className="form-input resize-none" rows={3} {...register('treatmentRecommendations')} />
            </div>
            <div>
              <label className="form-label">{t('create_report.medication_label')}</label>
              <textarea className="form-input resize-none" rows={3} {...register('medicationRecommendations')} />
            </div>
            <div>
              <label className="form-label">{t('create_report.lifestyle_label')}</label>
              <textarea className="form-input resize-none" rows={2} {...register('lifestyleRecommendations')} />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" icon={<Send size={14} />} loading={isSubmitting || mutation.isPending}>
            {t('create_report.submit_btn')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, CalendarDays, FileImage, FlaskConical, FileText,
  Check, X, Brain, UserCheck, CheckCircle, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { appointmentsApi } from '../../api/appointments.api';
import { xraysApi } from '../../api/xrays.api';
import { AppointmentStatusBadge, StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useDateLocale } from '../../hooks/useDateLocale';
import { useApiMutation } from '../../hooks/useApiMutation';

export default function AppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  // Reject keeps a notes field (the reason ends up on the patient's
  // notification). Accept doesn't - just one click and we're done.
  const [action, setAction] = useState<'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const { data: appt, isLoading } = useQuery({
    queryKey: ['doctor-appointment', appointmentId],
    queryFn: async () => { const r = await appointmentsApi.getForDoctor(appointmentId!); return r.data.data!; },
  });

  const { data: analysis } = useQuery({
    queryKey: ['doctor-analysis', appt?.xrayAnalysisId],
    queryFn: async () => { const r = await xraysApi.getDoctorOne(appt!.xrayAnalysisId!); return r.data.data!; },
    enabled: appt?.xrayAnalysisId != null,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['doctor-appointment', appointmentId] });
    queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
    setAction(null);
    setNotes('');
  }

  const acceptMutation = useApiMutation(
    () => appointmentsApi.accept(appointmentId!, {}),
    {
      successMessage: t('doctor_appointments.accept_success'),
      errorMessage: t('doctor_appointments.accept_error'),
      onSuccess: invalidate,
    },
  );

  const rejectMutation = useApiMutation(
    () => appointmentsApi.reject(appointmentId!, { doctorNotes: notes || undefined }),
    {
      successMessage: t('doctor_appointments.reject_success'),
      errorMessage: t('doctor_appointments.reject_error'),
      onSuccess: invalidate,
    },
  );

  if (isLoading) return <PageSpinner />;
  if (!appt) return <div className="text-center py-16 text-gray-400">{t('common.not_found')}</div>;

  const confidence = analysis?.aiConfidence != null ? Math.round(analysis.aiConfidence * 100) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate('/doctor/appointments')}>
          {t('common.back')}
        </Button>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, #4664E0, #1CBEAF)' }}
            >
              {(appt.patientName ?? '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{appt.patientName ?? '-'}</h2>
              {appt.appointmentDate && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                  <CalendarDays size={14} />
                  {format(new Date(appt.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })}
                </div>
              )}
            </div>
          </div>
          <AppointmentStatusBadge status={appt.status} />
        </div>

        {appt.patientComplaints && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <p className="text-xs font-medium text-amber-700 mb-1">{t('appointment_detail.complaints_label')}</p>
            <p className="text-sm text-amber-900">{appt.patientComplaints}</p>
          </div>
        )}

        {appt.doctorNotes && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-1">{t('appointment_detail.doctor_note')}</p>
            <p className="text-sm text-blue-900">{appt.doctorNotes}</p>
          </div>
        )}
      </Card>

      {appt.status === 'PENDING' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">{t('appointment_detail.decision_title')}</h3>

          {!action && (
            <div className="flex gap-3">
              <Button
                icon={<Check size={16} />}
                loading={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate()}
              >
                {t('doctor_appointments.accept_btn')}
              </Button>
              <Button variant="outline" icon={<X size={16} />} onClick={() => setAction('reject')}>
                {t('doctor_appointments.reject_btn')}
              </Button>
            </div>
          )}

          {action === 'reject' && (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="form-label">{t('doctor_appointments.notes_label')}</label>
                <textarea className="form-input resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button variant="danger" icon={<X size={14} />} loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
                  {t('appointment_detail.confirm_reject')}
                </Button>
                <Button variant="secondary" onClick={() => setAction(null)}>{t('common.cancel')}</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {appt.status === 'ACCEPTED' && (
        <Card>
          <h3 className="font-semibold text-gray-900 mb-3">{t('appointment_detail.services_section')}</h3>
          <div className="flex flex-wrap gap-2 mb-5">
            {appt.xrayAnalysisId != null && (
              <button
                onClick={() => navigate(`/doctor/analyses/${appt.xrayAnalysisId}/validate`)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-medium text-blue-700"
              >
                <FileImage size={15} />
                {t('appointment_detail.view_analysis')}
              </button>
            )}
            <button
              onClick={() => navigate(`/doctor/lab-results/add?patientId=${appt.patientId}`)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors text-sm font-medium text-purple-700"
            >
              <FlaskConical size={15} />
              {t('appointment_detail.add_lab')}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-2">{t('appointment_detail.complete_hint')}</p>
            <button
              onClick={() => navigate(`/doctor/reports/create?patientId=${appt.patientId}&appointmentId=${appt.id}`)}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText size={20} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{t('appointment_detail.create_report')}</p>
                <p className="text-xs text-gray-500">{t('appointment_detail.create_report_desc')}</p>
              </div>
              <ChevronRight size={18} className="text-green-600 shrink-0" />
            </button>
          </div>

        </Card>
      )}

      {appt.status === 'COMPLETED' && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <CheckCircle size={16} />
          {t('appointment_detail.completed_info')}
          {appt.reportId != null && (
            <button
              onClick={() => navigate(`/doctor/reports/${appt.reportId}`)}
              className="ml-auto underline font-medium"
            >
              {t('appointment_detail.view_report')}
            </button>
          )}
        </div>
      )}

      {analysis && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('appointment_detail.analysis_section')}</h3>
            <div className="ml-auto"><StatusBadge status={analysis.status} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">{t('validate.diagnosis_label')}</p>
              <p className="font-semibold text-gray-900 text-sm">
                {analysis.aiPrimaryDiagnosis ? t('disease.' + analysis.aiPrimaryDiagnosis) : '-'}
              </p>
            </div>
            {confidence != null && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{t('validate.confidence_label')}</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{confidence}%</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${confidence}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {analysis.aiFindings && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{analysis.aiFindings}</p>
          )}

          {(analysis.status === 'COMPLETED' || analysis.status === 'REQUIRES_REVIEW') && (
            <div className="mt-3">
              <Button
                size="sm"
                icon={<UserCheck size={14} />}
                onClick={() => navigate(`/doctor/analyses/${analysis.id}/validate`)}
              >
                {t('assigned_analyses.validate_btn')}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

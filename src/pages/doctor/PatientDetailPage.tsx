import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileImage, FlaskConical, FileText, Plus, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { patientsApi } from '../../api/patients.api';
import { xraysApi } from '../../api/xrays.api';
import { reportsApi } from '../../api/medical-records.api';
import { StatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [tab, setTab] = useState<'analyses' | 'reports'>('analyses');

  const { data: patient, isLoading: lP } = useQuery({
    queryKey: ['doctor-patient', patientId],
    queryFn: async () => { const r = await patientsApi.getByUserId(patientId!); return r.data.data!; },
  });

  // The microservices backend doesn't expose per-patient analyses to a doctor;
  // we fall back to the doctor's full assigned list and filter locally.
  const { data: analyses } = useQuery({
    queryKey: ['doctor-patient-analyses', patientId],
    queryFn: async () => {
      const r = await xraysApi.listAssignedToDoctor(0, 100);
      const all = r.data.data!;
      return { ...all, content: all.content.filter((a) => a.patientId === patientId) };
    },
  });

  // Same workaround for reports.
  const { data: reports } = useQuery({
    queryKey: ['doctor-patient-reports', patientId],
    queryFn: async () => {
      const r = await reportsApi.listForDoctor(0, 100);
      const all = r.data.data!;
      return { ...all, content: all.content.filter((rep) => rep.patientId === patientId) };
    },
  });

  if (lP) return <PageSpinner />;
  if (!patient) return <div className="text-center py-16 text-gray-400">{t('patients.not_found')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/doctor/patients"><Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>{t('common.back')}</Button></Link>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {patient.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{patient.fullName}</h2>
            <p className="text-gray-500">{patient.email}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
              {patient.age && <div><p className="text-gray-400">{t('patients.age_label')}</p><p className="font-medium">{t('patients.age_years', { age: patient.age })}</p></div>}
              {patient.gender && <div><p className="text-gray-400">{t('patients.gender_label')}</p><p className="font-medium">{t('gender.' + patient.gender)}</p></div>}
              {patient.bloodType && <div><p className="text-gray-400">{t('patients.blood_type_label')}</p><p className="font-medium">{t('bloodType.' + patient.bloodType)}</p></div>}
              {patient.phoneNumber && <div><p className="text-gray-400">{t('patients.phone_label')}</p><p className="font-medium">{patient.phoneNumber}</p></div>}
            </div>
            {patient.chronicDiseases && (
              <div className="mt-3 p-2.5 bg-yellow-50 rounded-lg">
                <p className="text-xs font-medium text-yellow-700">{t('patients.chronic_label')}:</p>
                <p className="text-sm text-yellow-800 mt-0.5">{patient.chronicDiseases}</p>
              </div>
            )}
            {patient.allergies && (
              <div className="mt-2 p-2.5 bg-red-50 rounded-lg">
                <p className="text-xs font-medium text-red-700">{t('patients.allergy_label')}:</p>
                <p className="text-sm text-red-800 mt-0.5">{patient.allergies}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-3 flex-wrap">
        <Button
          icon={<FlaskConical size={14} />}
          variant="outline"
          onClick={() => navigate(`/doctor/lab-results/add?patientId=${patientId}`)}
        >
          {t('patients.add_lab')}
        </Button>
        <Button
          icon={<Plus size={14} />}
          variant="outline"
          onClick={() => navigate(`/doctor/reports/create?patientId=${patientId}`)}
        >
          {t('patients.create_report')}
        </Button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'analyses', label: t('patients.tab_analyses', { n: analyses?.totalElements ?? analyses?.content.length ?? 0 }) },
          { key: 'reports', label: t('patients.tab_reports', { n: reports?.totalElements ?? reports?.content.length ?? 0 }) },
        ].map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key as typeof tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === tabItem.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'analyses' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {analyses?.content.length === 0 ? (
            <div className="py-10 text-center text-gray-400"><FileImage size={32} className="mx-auto mb-2 opacity-40" />{t('patients.no_analyses')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_file')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_ai_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_status')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_date')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analyses?.content.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900 truncate max-w-[200px]">{a.originalFileName}</td>
                    <td className="px-6 py-3 text-gray-600">{a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : '-'}</td>
                    <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-6 py-3 text-gray-500">{format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-3">
                      {(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') && (
                        <Link to={`/doctor/analyses/${a.id}/validate`}>
                          <Button size="sm" icon={<UserCheck size={12} />}>{t('patients.validate')}</Button>
                        </Link>
                      )}
                      {a.status === 'VALIDATED' && (
                        <span className="text-xs text-purple-600 font-medium">{t('patients.validated')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {reports?.content.length === 0 ? (
            <div className="py-10 text-center text-gray-400"><FileText size={32} className="mx-auto mb-2 opacity-40" />{t('patients.no_reports')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_diagnosis')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_severity')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_date')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports?.content.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</td>
                    <td className="px-6 py-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="px-6 py-3 text-gray-500">{format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-3">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('patients.sent')}</span>
                        : <span className="text-xs text-gray-400">{t('patients.not_sent')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

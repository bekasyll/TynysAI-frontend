import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileImage, FlaskConical, FileText, Plus, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { patientsApi } from '../../api/patients.api';
import { xraysApi } from '../../api/xrays.api';
import { reportsApi, labResultsApi } from '../../api/medical-records.api';
import { useAuthStore } from '../../store/auth.store';
import { StatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const currentDoctorId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState<'analyses' | 'lab' | 'reports'>('analyses');

  const { data: patient, isLoading: lP } = useQuery({
    queryKey: ['doctor-patient', patientId],
    queryFn: async () => { const r = await patientsApi.getByUserId(patientId!); return r.data.data!; },
  });

  // Any doctor can see any patient's full history. The /by-patient endpoint
  // filters server-side by patientId and isn't gated on assignment - that
  // gate moved to the validate-mutation only.
  const analysesQ = usePagedQuery(
    ['doctor-patient-analyses', patientId],
    (p) => xraysApi.listByPatientId(patientId!, p, 10).then((r) => r.data.data!),
    { enabled: !!patientId },
  );

  const reportsQ = usePagedQuery(
    ['doctor-patient-reports', patientId],
    (p) => reportsApi.listByPatientId(patientId!, p, 10).then((r) => r.data.data!),
    { enabled: !!patientId },
  );

  const labQ = usePagedQuery(
    ['doctor-patient-lab-results', patientId],
    (p) => labResultsApi.listByPatientId(patientId!, p, 10).then((r) => r.data.data!),
    { enabled: !!patientId },
  );

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
              {patient.age != null && patient.age > 0 && <div><p className="text-gray-400">{t('patients.age_label')}</p><p className="font-medium">{t('patients.age_years', { count: patient.age })}</p></div>}
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

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { key: 'analyses', label: t('patients.tab_analyses', { n: analysesQ.pagination.totalElements }) },
          { key: 'lab', label: t('patients.tab_lab', { n: labQ.pagination.totalElements }) },
          { key: 'reports', label: t('patients.tab_reports', { n: reportsQ.pagination.totalElements }) },
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
          {analysesQ.items.length === 0 ? (
            <div className="py-10 text-center text-gray-400"><FileImage size={32} className="mx-auto mb-2 opacity-40" />{t('patients.no_analyses')}</div>
          ) : (
            <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_file')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_ai_diagnosis')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('patients.col_status')}</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[120px]">{t('patients.col_date')}</th>
                  <th className="px-2 sm:px-6 py-3 w-[44px] sm:w-[120px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analysesQ.items.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3">
                      <div className="font-medium text-gray-900 break-words">{a.originalFileName}</div>
                      <div className="md:hidden text-xs text-gray-500 break-words">
                        {a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-600 break-words">{a.aiPrimaryDiagnosis ? t('disease.' + a.aiPrimaryDiagnosis) : '-'}</td>
                    <td className="px-2 sm:px-6 py-3"><StatusBadge status={a.status} /></td>
                    <td className="hidden lg:table-cell px-6 py-3 text-gray-500 break-words">{format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}</td>
                    <td className="px-2 sm:px-6 py-3 text-right">
                      {(a.status === 'COMPLETED' || a.status === 'REQUIRES_REVIEW') && (
                        a.assignedDoctorId === currentDoctorId ? (
                          <Link to={`/doctor/analyses/${a.id}/validate`}>
                            <Button size="sm" icon={<UserCheck size={12} />}>
                              <span className="hidden sm:inline">{t('patients.validate')}</span>
                            </Button>
                          </Link>
                        ) : (
                          // Read-only marker so the doctor sees there's nothing
                          // to do here - this scan was assigned to someone else.
                          <span className="text-xs text-gray-400" title={t('patients.assigned_to_other_full')}>
                            {t('patients.assigned_to_other')}
                          </span>
                        )
                      )}
                      {/* No "Validated" label here - the status column's badge
                          already shows that. Duplicating it in the actions
                          column made the row look like it had two statuses. */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 pb-4 pt-2"><Pagination {...analysesQ.pagination} /></div>
            </>
          )}
        </div>
      )}

      {tab === 'lab' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {labQ.items.length === 0 ? (
            <div className="py-10 text-center text-gray-400"><FlaskConical size={32} className="mx-auto mb-2 opacity-40" />{t('patients.no_lab')}</div>
          ) : (
            <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_lab_test')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_lab_lab')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[140px]">{t('patients.col_lab_doctor')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[120px]">{t('patients.col_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {labQ.items.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3">
                      <div className="font-medium text-gray-900 break-words">
                        {l.testTypeDisplayName ?? t('labTest.' + l.testType)}
                      </div>
                      <div className="md:hidden text-xs text-gray-500 break-words">
                        {l.labName ?? '-'}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-600 break-words">{l.labName ?? '-'}</td>
                    <td className="hidden sm:table-cell px-6 py-3 text-gray-500 break-words">{l.addedByDoctorName ?? '-'}</td>
                    <td className="px-2 sm:px-6 py-3 text-gray-500 break-words">
                      {format(new Date(l.testDate), 'dd/MM/yyyy', { locale: dateLocale })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 pb-4 pt-2"><Pagination {...labQ.pagination} /></div>
            </>
          )}
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {reportsQ.items.length === 0 ? (
            <div className="py-10 text-center text-gray-400"><FileText size={32} className="mx-auto mb-2 opacity-40" />{t('patients.no_reports')}</div>
          ) : (
            <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_diagnosis')}</th>
                  <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[90px] sm:w-[110px]">{t('patients.col_severity')}</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[120px]">{t('patients.col_date')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[100px]">{t('patients.col_status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportsQ.items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3">
                      <div className="font-medium text-gray-900 break-words">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</div>
                      <div className="md:hidden text-xs text-gray-500 break-words">{format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}</div>
                      <div className="sm:hidden text-xs mt-0.5">
                        {r.sentToPatient
                          ? <span className="text-green-600 font-medium">{t('patients.sent')}</span>
                          : <span className="text-gray-400">{t('patients.not_sent')}</span>}
                      </div>
                    </td>
                    <td className="px-2 sm:px-6 py-3"><SeverityBadge severity={r.severity} /></td>
                    <td className="hidden md:table-cell px-6 py-3 text-gray-500 break-words">{format(new Date(r.createdAt), 'dd/MM/yyyy', { locale: dateLocale })}</td>
                    <td className="hidden sm:table-cell px-6 py-3">
                      {r.sentToPatient
                        ? <span className="text-xs text-green-600 font-medium">{t('patients.sent')}</span>
                        : <span className="text-xs text-gray-400">{t('patients.not_sent')}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 pb-4 pt-2"><Pagination {...reportsQ.pagination} /></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

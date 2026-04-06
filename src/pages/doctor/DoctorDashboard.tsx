import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, FileImage, AlertTriangle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { StatCard } from '../../components/ui/Card';
import { SeverityBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data: patientsData, isLoading: lP } = useQuery({
    queryKey: ['doctor-patients', 0],
    queryFn: async () => { const r = await doctorsApi.getPatients(0, 5); return r.data.data!; },
  });

  const { data: reportsData, isLoading: lR } = useQuery({
    queryKey: ['doctor-reports-preview'],
    queryFn: async () => { const r = await doctorsApi.getMyReports(0, 10); return r.data.data!; },
  });

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => { const r = await doctorsApi.getMyProfile(); return r.data.data!; },
  });

  if (lP || lR) return <PageSpinner />;

  return (
    <div className="space-y-6">
      {profile && !profile.approved && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800">{t('dashboard.pending_approval_title')}</p>
            <p className="text-sm text-yellow-700 mt-0.5">{t('dashboard.pending_approval_sub')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.patients_title')} value={patientsData?.totalElements ?? 0} icon={<Users size={22} />} color="blue" />
        <StatCard title={t('dashboard.reports_count')} value={reportsData?.totalElements ?? 0} icon={<ClipboardList size={22} />} color="green" />
        <StatCard title={t('dashboard.specialization')} value={profile?.specialization ?? '—'} icon={<FileImage size={22} />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">{t('dashboard.recent_patients')}</h3>
            </div>
            <Link to="/doctor/patients" className="text-sm text-blue-600 hover:underline">{t('dashboard.all')}</Link>
          </div>
          {patientsData?.content.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">{t('dashboard.no_patients')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {patientsData?.content.map((p) => (
                <Link key={p.id} to={`/doctor/patients/${p.id}`} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {p.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{p.fullName}</p>
                    <p className="text-xs text-gray-500">{p.email}{p.age ? ` · ${t('profile.age_years', { age: p.age })}` : ''}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">{t('dashboard.last_reports')}</h3>
            </div>
            <Link to="/doctor/reports" className="text-sm text-blue-600 hover:underline">{t('dashboard.all')}</Link>
          </div>
          {reportsData?.content.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400">{t('dashboard.no_reports')}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reportsData?.content.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}
                    </p>
                    <p className="text-xs text-gray-500">{r.patientName} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}</p>
                  </div>
                  <SeverityBadge severity={r.severity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

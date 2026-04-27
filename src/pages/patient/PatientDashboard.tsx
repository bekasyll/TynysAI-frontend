import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileImage, FlaskConical, FileText, Upload, ChevronRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { xraysApi } from '../../api/xrays.api';
import { labResultsApi, reportsApi } from '../../api/medical-records.api';
import { StatCard } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function PatientDashboard() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data: analysesData, isLoading: loadingAnalyses } = useQuery({
    queryKey: ['patient-analyses', 0],
    queryFn: async () => { const r = await xraysApi.listForPatient(0, 5); return r.data.data!; },
  });

  const { data: labData, isLoading: loadingLab } = useQuery({
    queryKey: ['patient-lab-results', 0],
    queryFn: async () => { const r = await labResultsApi.listForPatient(0, 3); return r.data.data!; },
  });

  const { data: reportsData } = useQuery({
    queryKey: ['patient-reports-preview'],
    queryFn: async () => { const r = await reportsApi.listForPatient(0, 10); return r.data.data!; },
  });

  if (loadingAnalyses || loadingLab) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.patient_title')} value={analysesData?.totalElements ?? 0} icon={<FileImage size={22} />} color="blue" />
        <StatCard title={t('dashboard.lab_title')} value={labData?.totalElements ?? 0} icon={<FlaskConical size={22} />} color="green" />
        <StatCard title={t('dashboard.reports_title')} value={reportsData?.totalElements ?? 0} icon={<FileText size={22} />} color="purple" />
      </div>

      <Link
        to="/patient/upload"
        className="flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md"
      >
        <div className="bg-white/20 rounded-xl p-3"><Upload size={24} /></div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{t('dashboard.upload_title')}</p>
          <p className="text-blue-100 text-sm">{t('dashboard.upload_sub')}</p>
        </div>
        <ChevronRight size={20} className="text-blue-200" />
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('dashboard.recent_analyses')}</h3>
          </div>
          <Link to="/patient/analyses" className="text-sm text-blue-600 hover:underline">{t('dashboard.all_analyses')}</Link>
        </div>

        {analysesData?.content.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <FileImage size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t('dashboard.no_analyses')}</p>
            <Link to="/patient/upload" className="text-blue-600 text-sm hover:underline mt-1 inline-block">{t('dashboard.upload_first')}</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {analysesData?.content.map((a) => (
              <Link key={a.id} to={`/patient/analyses/${a.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileImage size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{a.originalFileName}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
                    {a.aiPrimaryDiagnosis && ` · ${t('disease.' + a.aiPrimaryDiagnosis)}`}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {(reportsData?.content.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">{t('dashboard.recent_reports')}</h3>
            </div>
            <Link to="/patient/reports" className="text-sm text-blue-600 hover:underline">{t('dashboard.all_reports')}</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {reportsData?.content.map((r) => (
              <Link key={r.id} to={`/patient/reports/${r.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{r.finalDiagnosisDisplayName ?? t('disease.' + r.finalDiagnosis)}</p>
                  <p className="text-xs text-gray-500">
                    {t('dashboard.doctor_label')}: {r.doctorName} · {format(new Date(r.createdAt), 'd MMM yyyy', { locale: dateLocale })}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, FileImage, FileText, FlaskConical, Activity, TrendingUp, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const r = await adminApi.getStats(); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;
  if (!stats) return null;

  const diseaseEntries = Object.entries(stats.diseaseDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const total = diseaseEntries.reduce((s, [, v]) => s + v, 0);

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-500',
    VALIDATED: 'bg-purple-500',
    PENDING: 'bg-gray-400',
    PROCESSING: 'bg-blue-500',
    REQUIRES_REVIEW: 'bg-yellow-500',
    FAILED: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('admin.total_users')} value={stats.totalUsers} icon={<Users size={22} />} color="blue" />
        <StatCard title={t('admin.patients')} value={stats.totalPatients} icon={<Users size={22} />} color="teal" />
        <StatCard title={t('admin.doctors')} value={stats.totalDoctors} icon={<UserCheck size={22} />} color="green" />
        <StatCard title={t('admin.pending_approvals')} value={stats.pendingDoctorApprovals} icon={<Clock size={22} />} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('admin.total_analyses')} value={stats.totalAnalyses} icon={<FileImage size={22} />} color="purple" />
        <StatCard title={t('admin.analyses_30d')} value={stats.analysesLast30Days} icon={<TrendingUp size={22} />} color="blue" />
        <StatCard title={t('admin.reports')} value={stats.totalReports} icon={<FileText size={22} />} color="green" />
        <StatCard title={t('admin.lab_results')} value={stats.totalLabResults} icon={<FlaskConical size={22} />} color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">{t('admin.status_chart')}</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.analysesByStatus).map(([status, count]) => {
              const pct = stats.totalAnalyses > 0 ? Math.round((count / stats.totalAnalyses) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{t('status.' + status)}</span>
                    <span className="font-medium text-gray-900">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[status] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <FileImage size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">{t('admin.disease_chart')}</h3>
          </div>
          <div className="space-y-3">
            {diseaseEntries.map(([disease, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={disease}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 truncate">{t('disease.' + disease)}</span>
                    <span className="font-medium text-gray-900 ml-2 shrink-0">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

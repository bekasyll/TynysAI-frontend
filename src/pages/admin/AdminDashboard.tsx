import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, FileImage, FileText, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { xraysApi } from '../../api/xrays.api';
import { reportsApi } from '../../api/medical-records.api';
import { StatCard } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const r = await adminApi.getStats(); return r.data.data!; },
  });

  // The microservices stats endpoint only returns user counters; pull the
  // cross-service totals (analyses / reports) directly from those services.
  const { data: analysesPage } = useQuery({
    queryKey: ['admin-analyses-count'],
    queryFn: async () => { const r = await xraysApi.listAll(0, 1); return r.data.data!; },
  });

  const { data: reportsPage } = useQuery({
    queryKey: ['admin-reports-count'],
    queryFn: async () => { const r = await reportsApi.listAll(0, 1); return r.data.data!; },
  });

  if (isLoading) return <PageSpinner />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('admin.total_users')} value={stats.totalUsers} icon={<Users size={22} />} color="blue" />
        <StatCard title={t('admin.patients')} value={stats.totalPatients} icon={<Users size={22} />} color="teal" />
        <StatCard title={t('admin.doctors')} value={stats.totalDoctors} icon={<UserCheck size={22} />} color="green" />
        <StatCard title={t('admin.pending_approvals')} value={stats.pendingDoctorApprovals} icon={<Clock size={22} />} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('admin.active_patients')} value={stats.activePatients} icon={<Users size={22} />} color="blue" />
        <StatCard title={t('admin.active_doctors')} value={stats.activeDoctors} icon={<UserCheck size={22} />} color="green" />
        <StatCard title={t('admin.total_analyses')} value={analysesPage?.totalElements ?? 0} icon={<FileImage size={22} />} color="purple" />
        <StatCard title={t('admin.reports')} value={reportsPage?.totalElements ?? 0} icon={<FileText size={22} />} color="green" />
      </div>
    </div>
  );
}

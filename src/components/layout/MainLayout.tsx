import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const location = useLocation();
  const { t } = useTranslation();
  const path = location.pathname;

  const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    '/patient/dashboard': { title: t('nav.dashboard'), subtitle: t('dashboard.patient_title') + ' / ' + t('dashboard.lab_title') },
    '/patient/upload': { title: t('upload.title') },
    '/patient/analyses': { title: t('analyses.title') },
    '/patient/lab-results': { title: t('lab_results.title') },
    '/patient/reports': { title: t('reports.title') },
    '/patient/profile': { title: t('nav.profile') },
    '/doctor/dashboard': { title: t('nav.dashboard') },
    '/doctor/patients': { title: t('patients.title') },
    '/doctor/reports': { title: t('nav.my_reports') },
    '/doctor/profile': { title: t('nav.profile') },
    '/admin/dashboard': { title: t('nav.dashboard') },
    '/admin/users': { title: t('nav.users') },
    '/admin/approvals': { title: t('nav.approvals') },
    '/admin/analyses': { title: t('nav.all_analyses') },
    '/admin/reports': { title: t('nav.all_reports') },
    '/notifications': { title: t('nav.notifications') },
  };

  const pageInfo = pageTitles[path] ??
    (path.includes('/analyses/') ? { title: t('analyses.title') } :
     path.includes('/patients/') ? { title: t('patients.title') } :
     path.includes('/reports/') ? { title: t('reports.title') } :
     path.includes('/validate') ? { title: t('validate.title') } :
     path.includes('/lab-results/add') ? { title: t('add_lab.base_info') } :
     path.includes('/reports/create') ? { title: t('create_report.submit_btn') } :
     { title: 'TynysAI' });

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <Header title={pageInfo.title} subtitle={pageInfo.subtitle} />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

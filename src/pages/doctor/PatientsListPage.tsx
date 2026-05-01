import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronRight, Search, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { patientsApi } from '../../api/patients.api';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { getApiError } from '../../lib/api-error';
import { usePagedQuery } from '../../hooks/usePagedQuery';

export default function PatientsListPage() {
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const { items, pagination, isLoading, error } = usePagedQuery(
    ['doctor-patients'],
    (p) => patientsApi.list(p, 10).then((r) => r.data.data!),
    {
      retry: (failureCount, err) =>
        // don't retry on auth/authorization failures - they won't get better
        isAxiosError(err) && err.response && [401, 403].includes(err.response.status)
          ? false
          : failureCount < 1,
    },
  );

  const filtered = search
    ? items.filter((p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (isLoading) return <PageSpinner />;

  if (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const message = getApiError(error) ?? t('common.error');
    return (
      <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-8 text-center">
        <ShieldAlert size={48} className="mx-auto mb-4 text-amber-500" />
        <p className="text-gray-900 font-semibold mb-1">
          {status === 403
            ? t('patients.forbidden_title')
            : t('common.error')}
        </p>
        <p className="text-gray-600 text-sm">{message}</p>
        {status === 403 && (
          <p className="text-gray-500 text-xs mt-3">
            {t('patients.forbidden_hint')}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9 w-full max-w-sm"
          placeholder={t('patients.search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('patients.empty')}
            subtitle={t('patients.empty_sub')}
          />
        ) : (
          <>
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {/* All columns have explicit widths (table-fixed honours
                      them) so the right-hand columns sit next to email
                      instead of getting pushed to the far right by an
                      unbounded "Patient" column. */}
                  <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500 sm:w-[260px] lg:w-[320px]">{t('patients.col_patient')}</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[220px] lg:w-[260px]">{t('patients.col_email')}</th>
                  <th className="hidden md:table-cell px-3 py-3 text-left font-medium text-gray-500 w-[80px]">{t('patients.col_age')}</th>
                  <th className="hidden md:table-cell px-3 py-3 text-left font-medium text-gray-500 w-[100px]">{t('patients.col_blood_type')}</th>
                  <th className="px-3 sm:px-6 py-3 w-[44px] sm:w-[90px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <Link to={`/doctor/patients/${p.userId}`} className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                          {p.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-900 break-words block">{p.fullName}</span>
                          <span className="sm:hidden text-xs text-gray-500 break-all block">{p.email}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 text-gray-600 break-all">{p.email}</td>
                    <td className="hidden md:table-cell px-3 py-4 text-gray-600">{p.age && p.age > 0 ? t('patients.age_years', { count: p.age }) : '-'}</td>
                    <td className="hidden md:table-cell px-3 py-4 text-gray-600">{p.bloodType ? t('bloodType.' + p.bloodType) : '-'}</td>
                    <td className="px-3 sm:px-6 py-4 text-right">
                      <Link
                        to={`/doctor/patients/${p.userId}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                      >
                        <span className="hidden sm:inline">{t('common.open')}</span>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 pb-4 pt-2">
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

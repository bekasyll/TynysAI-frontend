import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function PatientsListPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-patients', page],
    queryFn: async () => { const r = await doctorsApi.getPatients(page, 20); return r.data.data!; },
  });

  const filtered = search
    ? data?.content.filter((p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
      )
    : data?.content;

  if (isLoading) return <PageSpinner />;

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
        {filtered?.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('patients.empty')}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_patient')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_email')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_age')}</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">{t('patients.col_blood_type')}</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered?.map((p) => (
                  <tr key={p.userId ?? p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                          {p.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{p.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.email}</td>
                    <td className="px-6 py-4 text-gray-600">{p.age ? t('patients.age_years', { age: p.age }) : '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{p.bloodType ? t('bloodType.' + p.bloodType) : '—'}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/doctor/patients/${p.userId ?? p.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                      >
                        {t('common.open')} <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 pb-4 pt-2">
              <Pagination
                page={data?.page ?? 0}
                totalPages={data?.totalPages ?? 0}
                totalElements={data?.totalElements ?? 0}
                size={data?.size ?? 20}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

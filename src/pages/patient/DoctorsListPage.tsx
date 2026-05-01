import { useState } from 'react';
import { Stethoscope, Search, Building2, Clock, BadgeCheck, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import type { DoctorProfileResponse } from '../../types';

export default function DoctorsListPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DoctorProfileResponse | null>(null);
  const { t } = useTranslation();

  const { items, pagination, isLoading } = usePagedQuery(
    ['available-doctors'],
    (p) => doctorsApi.listApproved(p, 10).then((r) => r.data.data!),
  );

  const filtered = search
    ? items.filter((d) => d.fullName.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="form-input pl-9 w-full max-w-sm"
          placeholder={t('common.search_doctor_name')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Stethoscope size={48} className="mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">{t('doctors_list.empty')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #4664E0, #1CBEAF)' }}
                  >
                    {d.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 break-words">{d.fullName}</p>
                    {d.specialization && (
                      <p className="text-sm text-blue-600 break-words">{d.specialization}</p>
                    )}
                  </div>
                  <BadgeCheck size={18} className="text-green-500 shrink-0 ml-auto" />
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  {d.hospitalName && (
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 shrink-0" />
                      <span className="break-words">{d.hospitalName}{d.department ? ` · ${d.department}` : ''}</span>
                    </div>
                  )}
                  {d.yearsOfExperience != null && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <span>{t('doctors_list.experience', { years: d.yearsOfExperience })}</span>
                    </div>
                  )}
                </div>

                {d.bio && (
                  <p className="text-xs text-gray-500 line-clamp-2">{d.bio}</p>
                )}
              </div>
            ))}
          </div>

          <Pagination {...pagination} />
        </>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.fullName ?? ''}
        size="md"
      >
        {selected && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #4664E0, #1CBEAF)' }}
              >
                {selected.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg break-words min-w-0">{selected.fullName}</p>
                  <BadgeCheck size={18} className="text-green-500 shrink-0" />
                </div>
                {selected.specialization && (
                  <p className="text-blue-600 font-medium">{selected.specialization}</p>
                )}
                {selected.licenseNumber && (
                  <p className="text-xs text-gray-400">{t('doctors_list.license')}: {selected.licenseNumber}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {selected.hospitalName && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{t('doctors_list.hospital')}</p>
                    <p className="text-sm font-medium text-gray-800">{selected.hospitalName}</p>
                    {selected.department && <p className="text-xs text-gray-500">{selected.department}</p>}
                  </div>
                </div>
              )}

              {selected.yearsOfExperience != null && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{t('doctors_list.experience_label')}</p>
                    <p className="text-sm font-medium text-gray-800">{t('doctors_list.experience', { years: selected.yearsOfExperience })}</p>
                  </div>
                </div>
              )}

              {selected.education && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <GraduationCap size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">{t('doctors_list.education')}</p>
                    <p className="text-sm text-gray-800">{selected.education}</p>
                  </div>
                </div>
              )}

            </div>

            {selected.bio && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">{t('doctors_list.bio')}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.bio}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

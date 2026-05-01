import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ListFilters from '../../components/list/ListFilters';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import type { DoctorProfileResponse } from '../../types';

export default function DoctorApprovalsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [selected, setSelected] = useState<DoctorProfileResponse | null>(null);
  const [search, setSearch] = useState('');

  const hasActive = !!search;

  const { items, pagination, isLoading } = usePagedQuery(
    ['admin-pending-doctors', search],
    (p) => adminApi.getPendingDoctors(p, 10, search || undefined).then((r) => r.data.data!),
  );

  const clearAll = () => setSearch('');
  const initialLoading = isLoading && !hasActive && items.length === 0;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] });

  // Backend identifies doctors by their Keycloak userId (UUID), not the
  // DB primary key - see DoctorProfileService.approve(UUID).
  const approveMutation = useApiMutation(
    (userId: string) => adminApi.approveDoctor(userId),
    { successMessage: t('admin.approved'), onSuccess: () => { invalidate(); setSelected(null); } },
  );

  const rejectMutation = useApiMutation(
    (userId: string) => adminApi.rejectDoctor(userId),
    { successMessage: t('admin.rejected'), onSuccess: () => { invalidate(); setSelected(null); } },
  );

  if (initialLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <ListFilters search={search} onSearchChange={setSearch} hasActive={hasActive} onClear={clearAll} placeholder={t('common.search_doctor_name')} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={hasActive ? t('common.no_filter_match') : t('admin.approvals_empty')}
            subtitle={hasActive ? t('common.try_clear_filters') : t('admin.approvals_empty_sub')}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {items.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelected(doc)}
                  className="w-full flex items-start gap-4 px-6 py-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0">
                    {doc.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{doc.fullName}</p>
                    <p className="text-gray-500 text-sm">{doc.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                      {doc.specialization && <span><span className="text-gray-400">{t('admin.specialization_label')}: </span>{doc.specialization}</span>}
                      {doc.licenseNumber && <span><span className="text-gray-400">{t('admin.license_label')}: </span>{doc.licenseNumber}</span>}
                      {doc.hospitalName && <span><span className="text-gray-400">{t('admin.clinic_label')}: </span>{doc.hospitalName}</span>}
                      {doc.yearsOfExperience !== undefined && doc.yearsOfExperience !== null && <span><span className="text-gray-400">{t('admin.experience_label')}: </span>{doc.yearsOfExperience}</span>}
                    </div>
                    {doc.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{doc.bio}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {t('admin.registered_label')}: {format(new Date(doc.profileCreatedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="px-6 pb-4 pt-2">
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={t('admin.doctor_details_title')}
        size="lg"
      >
        {selected && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
                {selected.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-lg break-words">{selected.fullName}</p>
                <p className="text-gray-500 text-sm break-all">{selected.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <DetailRow label={t('profile.phone')} value={selected.phoneNumber} />
              <DetailRow label={t('profile.gender')} value={selected.gender ? t(`gender.${selected.gender}`) : undefined} />
              <DetailRow
                label={t('profile.date_of_birth')}
                value={selected.dateOfBirth
                  ? format(new Date(selected.dateOfBirth), 'dd/MM/yyyy', { locale: dateLocale })
                  : undefined}
              />
              <DetailRow label={t('admin.specialization_label')} value={selected.specialization} />
              <DetailRow label={t('admin.license_label')} value={selected.licenseNumber} />
              <DetailRow label={t('admin.clinic_label')} value={selected.hospitalName} />
              <DetailRow label={t('profile.department')} value={selected.department} />
              <DetailRow
                label={t('profile.experience')}
                value={selected.yearsOfExperience !== undefined && selected.yearsOfExperience !== null
                  ? String(selected.yearsOfExperience)
                  : undefined}
              />
              {/* workSchedule is edited in /admin/users via the schedule dialog;
                  showing the raw structured value here would be noisy. */}
              <DetailRow
                label={t('admin.registered_label')}
                value={format(new Date(selected.profileCreatedAt), 'dd/MM/yyyy', { locale: dateLocale })}
              />
            </dl>

            {selected.education && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t('profile.education')}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.education}</p>
              </div>
            )}

            {selected.bio && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t('profile.bio')}</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.bio}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                icon={<XCircle size={14} className="text-red-500" />}
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(selected.userId)}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {t('admin.reject_btn')}
              </Button>
              <Button
                variant="outline"
                icon={<CheckCircle size={14} className="text-green-600" />}
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate(selected.userId)}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                {t('admin.approve_btn')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-gray-900 break-words">{value}</dd>
    </div>
  );
}

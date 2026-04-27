import { useQueryClient } from '@tanstack/react-query';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';

export default function DoctorApprovalsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['admin-pending-doctors'],
    (p) => adminApi.getPendingDoctors(p).then((r) => r.data.data!),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] });

  // Backend identifies doctors by their Keycloak userId (UUID), not the
  // DB primary key - see DoctorProfileService.approve(UUID).
  const approveMutation = useApiMutation(
    (userId: string) => adminApi.approveDoctor(userId),
    { successMessage: t('admin.approved'), onSuccess: invalidate },
  );

  const rejectMutation = useApiMutation(
    (userId: string) => adminApi.rejectDoctor(userId),
    { successMessage: t('admin.rejected'), onSuccess: invalidate },
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={t('admin.approvals_empty')}
            subtitle={t('admin.approvals_empty_sub')}
          />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {items.map((doc) => (
                <div key={doc.id} className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50 transition-colors">
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
                      {doc.yearsOfExperience && <span><span className="text-gray-400">{t('admin.experience_label')}: </span>{doc.yearsOfExperience}</span>}
                    </div>
                    {doc.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{doc.bio}</p>}
                    <p className="text-xs text-gray-400 mt-2">
                      {t('admin.registered_label')}: {format(new Date(doc.profileCreatedAt), 'd MMMM yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<CheckCircle size={14} className="text-green-600" />}
                      loading={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(doc.userId)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {t('admin.approve_btn')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<XCircle size={14} className="text-red-500" />}
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(doc.userId)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {t('admin.reject_btn')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-4 pt-2">
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

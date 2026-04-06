import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';

export default function DoctorApprovalsPage() {
  const [page, setPage] = useState(0);
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-doctors', page],
    queryFn: async () => { const r = await adminApi.getPendingDoctors(page); return r.data.data!; },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveDoctor(id),
    onSuccess: () => { success(t('admin.approved')); queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] }); },
    onError: () => error(t('common.error')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectDoctor(id),
    onSuccess: () => { success(t('admin.rejected')); queryClient.invalidateQueries({ queryKey: ['admin-pending-doctors'] }); },
    onError: () => error(t('common.error')),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <UserCheck size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('admin.approvals_empty')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('admin.approvals_empty_sub')}</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {data?.content.map((doc) => (
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
                      onClick={() => approveMutation.mutate(doc.id)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      {t('admin.approve_btn')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<XCircle size={14} className="text-red-500" />}
                      loading={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(doc.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {t('admin.reject_btn')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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

import { useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useApiMutation } from '../../hooks/useApiMutation';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { UpdateUserRequest } from '../../types';

export default function AccountTab({ submitIcon }: { submitIcon: ReactNode }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { applyProfile } = useAuthStore();

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await usersApi.getMe(); return r.data.data!; },
    staleTime: 0,
  });

  const form = useForm<UpdateUserRequest>();

  useEffect(() => {
    if (meData) {
      form.reset({
        firstName: meData.firstName ?? '',
        lastName: meData.lastName ?? '',
        middleName: meData.middleName ?? '',
        phoneNumber: meData.phoneNumber ?? '',
      });
    }
  }, [meData]);

  const mutation = useApiMutation(
    (d: UpdateUserRequest) => usersApi.updateMe({
      firstName: d.firstName?.trim() || undefined,
      lastName: d.lastName?.trim() || undefined,
      // Send null (not "") to clear the middle name - the backend's @Size(min=1)
      // rejects empty strings, and null is what tells it to wipe the field.
      middleName: d.middleName?.trim() || null,
      // Empty strings fail backend's @Pattern; only send when the user
      // actually typed something.
      phoneNumber: d.phoneNumber?.trim() || undefined,
    }),
    {
      successMessage: t('profile.account_updated'),
      errorMessage: t('profile.save_error'),
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: ['me'] });
        // Source the sidebar/header name from the DB response, not the stale JWT.
        const updated = res?.data?.data;
        if (updated) applyProfile({
          // "Имя Фамилия" only - the backend's fullName includes the middle name.
          fullName: [updated.firstName, updated.lastName].filter(Boolean).join(' '),
          email: updated.email,
        });
      },
    },
  );

  return (
    <Card>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('profile.first_name')}</label>
            <input className="form-input"
              {...form.register('firstName', { required: t('common.required') })} />
          </div>
          <div>
            <label className="form-label">{t('profile.last_name')}</label>
            <input className="form-input"
              {...form.register('lastName', { required: t('common.required') })} />
          </div>
        </div>
        <div>
          <label className="form-label">{t('profile.middle_name')}</label>
          <input className="form-input" {...form.register('middleName')} />
        </div>
        <div>
          <label className="form-label">{t('profile.phone')}</label>
          <input className="form-input" placeholder="+77001234567"
            {...form.register('phoneNumber')} />
        </div>
        <Button type="submit" icon={submitIcon} loading={mutation.isPending}>
          {t('common.save')}
        </Button>
      </form>
    </Card>
  );
}

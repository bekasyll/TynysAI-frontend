import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { useApiMutation } from '../../hooks/useApiMutation';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
}

export default function PasswordTab() {
  const { t } = useTranslation();
  const form = useForm<PasswordForm>();

  // Backend returns 400 with "Current password is incorrect" - bubble up the
  // server message; otherwise show a generic error (default useApiMutation behavior).
  const mutation = useApiMutation(
    (d: PasswordForm) => usersApi.changePassword(d.currentPassword, d.newPassword),
    {
      successMessage: t('profile.password_changed'),
      errorMessage: t('profile.wrong_password'),
      onSuccess: () => form.reset(),
    },
  );

  return (
    <Card>
      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div>
          <label className="form-label">{t('profile.current_password')}</label>
          <input
            type="password"
            autoComplete="current-password"
            className="form-input"
            {...form.register('currentPassword', { required: t('common.required') })}
          />
          {form.formState.errors.currentPassword && (
            <p className="form-error">{form.formState.errors.currentPassword.message}</p>
          )}
        </div>
        <div>
          <label className="form-label">{t('profile.new_password')}</label>
          <input
            type="password"
            autoComplete="new-password"
            className="form-input"
            {...form.register('newPassword', {
              required: t('common.required'),
              minLength: { value: 8, message: t('auth.password_min') },
              pattern: {
                value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: t('auth.password_pattern'),
              },
            })}
          />
          {form.formState.errors.newPassword && (
            <p className="form-error">{form.formState.errors.newPassword.message}</p>
          )}
        </div>
        <Button type="submit" icon={<Lock size={14} />} loading={mutation.isPending}>
          {t('profile.change_password')}
        </Button>
      </form>
    </Card>
  );
}

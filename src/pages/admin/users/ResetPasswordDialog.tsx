import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../api/admin.api';
import { useApiMutation } from '../../../hooks/useApiMutation';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import type { UserResponse } from '../../../types';

interface Props {
  user: UserResponse | null;
  onClose: () => void;
}

export default function ResetPasswordDialog({ user, onClose }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [temporary, setTemporary] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useApiMutation(
    (vars: { id: string; password: string; temporary: boolean }) =>
      adminApi.resetUserPassword(vars.id, vars.password, vars.temporary),
    {
      successMessage: t('admin.password_reset_done'),
      onSuccess: () => {
        setPassword('');
        setTemporary(true);
        onClose();
      },
    },
  );

  if (!user) return null;

  const tooShort = password.length > 0 && password.length < 8;

  return (
    <Modal
      isOpen={!!user}
      onClose={() => { setPassword(''); onClose(); }}
      title={t('admin.reset_password_title')}
      size="sm"
    >
      <div className="p-6 space-y-4">
        <div className="text-sm text-gray-600">
          <p>{user.fullName}</p>
          <p className="text-gray-400 text-xs">{user.email}</p>
        </div>

        <div>
          <label className="form-label">{t('admin.new_password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`form-input pr-10 ${tooShort ? 'border-red-400' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
              placeholder={t('admin.password_min_hint')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs uppercase tracking-wide"
              tabIndex={-1}
            >
              {showPassword ? t('admin.hide') : t('admin.show')}
            </button>
          </div>
          {tooShort && (
            <p className="form-error">{t('auth.password_min')}</p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={temporary}
            onChange={(e) => setTemporary(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span>
            <span className="font-medium">{t('admin.temporary_password')}</span>
            <span className="block text-xs text-gray-500">
              {t('admin.temporary_password_hint')}
            </span>
          </span>
        </label>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={() => { setPassword(''); onClose(); }}>
            {t('common.cancel')}
          </Button>
          <Button
            icon={<Mail size={14} />}
            disabled={password.length < 8}
            loading={mutation.isPending}
            onClick={() => mutation.mutate({ id: user.id, password, temporary })}
          >
            {t('admin.reset_password_btn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

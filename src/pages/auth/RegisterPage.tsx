import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import logoIcon from '../../assets/logo-background-removed.png';
import { setLanguage } from '../../i18n';
import { getApiError } from '../../lib/api-error';
import type { RegisterRequest, Role } from '../../types';

const LANGS = ['ru', 'kk', 'en'] as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterRequest & { confirmPassword: string }>({
    defaultValues: { role: 'PATIENT' },
  });

  async function onSubmit({ confirmPassword: _, ...data }: RegisterRequest & { confirmPassword: string }) {
    setError('');
    try {
      const res = await authApi.register(data);
      const auth = res.data.data!;
      setAuth({ id: auth.userId, email: auth.email, fullName: auth.fullName, role: auth.role, avatarBase64: auth.avatarBase64 }, auth.accessToken, auth.refreshToken);
      const redirect = auth.role === 'PATIENT' ? '/patient/dashboard' : auth.role === 'DOCTOR' ? '/doctor/dashboard' : '/admin/dashboard';
      navigate(redirect, { replace: true });
    } catch (e: unknown) {
      setError(getApiError(e) ?? t('auth.register_error'));
    }
  }

  const roles: { value: Role; label: string; desc: string }[] = [
    { value: 'PATIENT', label: t('roles.PATIENT'), desc: t('auth.role_patient_desc') },
    { value: 'DOCTOR', label: t('roles.DOCTOR'), desc: t('auth.role_doctor_desc') },
  ];

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #0E2A45 50%, #0C2030 100%)' }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logoIcon} alt="TynysAI" className="h-14 w-14 object-contain" />
            <span className="text-white font-bold text-3xl tracking-tight">TynysAI</span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('auth.register_title')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">{t('auth.role')}</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedRole === r.value ? 'border-brand-blue bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input type="radio" value={r.value} {...register('role')} className="sr-only" />
                    <span className="font-medium text-sm text-gray-900">{r.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('auth.first_name')}</label>
                <input
                  className="form-input"
                  placeholder={t('auth.placeholder_first_name')}
                  {...register('firstName', { required: t('common.required'), minLength: { value: 2, message: t('common.min_chars', { n: 2 }) } })}
                />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="form-label">{t('auth.last_name')}</label>
                <input
                  className="form-input"
                  placeholder={t('auth.placeholder_last_name')}
                  {...register('lastName', { required: t('common.required'), minLength: { value: 2, message: t('common.min_chars', { n: 2 }) } })}
                />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">{t('auth.email')}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t('auth.placeholder_email')}
                {...register('email', { required: t('common.required'), pattern: { value: /\S+@\S+\.\S+/, message: t('auth.invalid_email') } })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">{t('auth.phone')}</label>
              <input
                className="form-input"
                placeholder="+77001234567"
                {...register('phoneNumber')}
              />
            </div>

            <div>
              <label className="form-label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder={t('auth.password_min')}
                  {...register('password', {
                    required: t('common.required'),
                    minLength: { value: 8, message: t('auth.password_min') },
                    pattern: { value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('auth.password_pattern') },
                  })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div>
              <label className="form-label">{t('auth.confirm_password')}</label>
              <input
                type="password"
                className="form-input"
                placeholder={t('auth.confirm_password_placeholder')}
                {...register('confirmPassword', {
                  required: t('common.required'),
                  validate: (v) => v === watch('password') || t('common.required'),
                })}
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
              {t('auth.register_btn')}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.has_account')}{' '}
            <Link to="/login" className="text-brand-teal hover:underline font-medium">{t('auth.login_link')}</Link>
          </p>
        </div>

        <div className="flex justify-center mt-5">
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {LANGS.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  i18n.language === lang
                    ? 'bg-white text-gray-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

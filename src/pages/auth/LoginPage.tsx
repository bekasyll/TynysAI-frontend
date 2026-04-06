import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import Button from '../../components/ui/Button';
import logoIcon from '../../assets/logo-background-removed.png';
import { setLanguage } from '../../i18n';
import { getApiError } from '../../lib/api-error';
import type { LoginRequest } from '../../types';

const LANGS = ['ru', 'kk', 'en'] as const;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginRequest>();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? null;

  const roleHome: Record<string, string> = {
    PATIENT: '/patient',
    DOCTOR: '/doctor',
    ADMIN: '/admin',
  };

  async function onSubmit(data: LoginRequest) {
    setError('');
    try {
      const res = await authApi.login(data);
      const auth = res.data.data!;
      setAuth({ id: auth.userId, email: auth.email, fullName: auth.fullName, role: auth.role, avatarBase64: auth.avatarBase64 }, auth.accessToken, auth.refreshToken);
      const home = roleHome[auth.role] ?? '/';
      const redirect = from?.startsWith(home) ? from : `${home}/dashboard`;
      navigate(redirect, { replace: true });
    } catch (e: unknown) {
      setError(getApiError(e) ?? t('auth.invalid_credentials'));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #0E2A45 50%, #0C2030 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logoIcon} alt="TynysAI" className="h-14 w-14 object-contain" />
            <span className="text-white font-bold text-3xl tracking-tight">TynysAI</span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('auth.login_title')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">{t('auth.email')}</label>
              <input
                type="email"
                className="form-input"
                placeholder={t('auth.placeholder_email_login')}
                {...register('email', { required: t('common.required'), pattern: { value: /\S+@\S+\.\S+/, message: t('auth.invalid_email') } })}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  {...register('password', { required: t('common.required') })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting} size="lg">
              {t('auth.login_btn')}
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-brand-teal hover:underline font-medium">
              {t('auth.register_link')}
            </Link>
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

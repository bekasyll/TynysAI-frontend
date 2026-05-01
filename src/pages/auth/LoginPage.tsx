import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/ui/Button';
import logoIcon from '../../assets/TynysAI-logo.png';
import { setLanguage } from '../../i18n';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../store/auth.store';
import { loginWithPassword } from '../../lib/keycloak';

const LANGS = ['ru', 'kk', 'en'] as const;

interface LoginForm {
  email: string;
  password: string;
}

/**
 * Maps the {@code error_description} Keycloak returns from {@code /token}
 * onto a localized message. Falls back to the raw text only for genuinely
 * unfamiliar errors (network, 5xx) so the user still sees something useful.
 */
function translateKeycloakError(raw: string, t: TFunction): string {
  const m = raw.toLowerCase();

  if (/account.*disabled|user.*disabled/.test(m))
    return t('auth.account_disabled');
  if (/not fully set up|requires.*action/.test(m))
    return t('auth.account_not_set_up');
  if (/email.*not.*verified|verify.*email/.test(m))
    return t('auth.email_not_verified');
  if (/too many|temporarily locked|rate/.test(m))
    return t('auth.rate_limited');
  if (/invalid_grant|user credentials|invalid.*password|invalid.*username/.test(m))
    return t('auth.invalid_credentials');

  // network / 5xx / unrecognized - show the raw text rather than a misleading
  // "wrong password" message
  return raw || t('auth.invalid_credentials');
}

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { error: toastError } = useToast();
  const navigate = useNavigate();
  const refresh = useAuthStore((s) => s.refresh);

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  async function onSubmit(values: LoginForm) {
    setSubmitting(true);
    try {
      await loginWithPassword(values.email.trim(), values.password);
      refresh();
      navigate('/', { replace: true });
    } catch (e: unknown) {
      const raw = (e instanceof Error ? e.message : '').trim();
      toastError(translateKeycloakError(raw, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-3 py-6 sm:p-4"
      style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #0E2A45 50%, #0C2030 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logoIcon} alt="TynysAI" className="h-12 w-12 sm:h-14 sm:w-14 object-contain" />
            <span className="text-white font-bold text-2xl sm:text-3xl tracking-tight">TynysAI</span>
          </div>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">{t('auth.subtitle')}</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('auth.login_title')}</h2>
          <p className="text-sm text-gray-500 -mt-2">
            {t('auth.login_subtitle')}
          </p>

          {/* email */}
          <div>
            <label className="form-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                autoComplete="email"
                autoFocus
                inputMode="email"
                className={`form-input pl-9 ${errors.email ? 'border-red-400' : ''}`}
                {...register('email', {
                  required: t('common.required'),
                  pattern: {
                    value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                    message: t('register.invalid_email'),
                  },
                })}
              />
            </div>
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          {/* password */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <label className="form-label">{t('auth.password')}</label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
              >
                {t('auth.forgot_password')}
              </Link>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`form-input pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                {...register('password', { required: t('common.required') })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full" loading={submitting} icon={<LogIn size={16} />}>
            {t('auth.login_btn')}
          </Button>

          <p className="text-xs text-center text-gray-400 pt-1">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              {t('auth.register_link')}
            </Link>
          </p>
        </form>

        <div className="flex justify-center mt-5">
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {LANGS.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  i18n.language === lang ? 'bg-white text-gray-900' : 'text-slate-300 hover:text-white'
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

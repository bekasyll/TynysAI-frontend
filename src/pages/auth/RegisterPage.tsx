import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle } from 'lucide-react';
import logoIcon from '../../assets/logo-background-removed.png';
import Button from '../../components/ui/Button';
import { setLanguage } from '../../i18n';
import { useToast } from '../../components/ui/Toast';
import { getApiError } from '../../lib/api-error';
import { authApi } from '../../api/auth.api';
import type { RegisterPatientRequest, RegisterResponse } from '../../api/auth.api';
import { PatientFields, cleanPatient } from '../../components/auth/UserFormFields';

const LANGS = ['ru', 'kk', 'en'] as const;

/**
 * Public self-registration page. Only patients can self-register -
 * doctor accounts are created by an administrator from the admin panel.
 */
export default function RegisterPage() {
  const [done, setDone] = useState<RegisterResponse | null>(null);
  const { t, i18n } = useTranslation();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
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

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {done ? <DoneStep result={done} /> : <PatientForm onDone={setDone} />}
        </div>

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

function PatientForm({ onDone }: { onDone: (r: RegisterResponse) => void }) {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterPatientRequest>();

  const mutation = useMutation({
    mutationFn: (data: RegisterPatientRequest) => authApi.registerPatient(data),
    onSuccess: (res) => onDone(res.data.data!),
    onError: (e) => toastError(getApiError(e) ?? t('register.error')),
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutation.mutate(cleanPatient(d)))}
      className="p-8 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900">
        {t('register.patient_title')}
      </h2>
      <p className="text-sm text-gray-500 -mt-2">
        {t(
          'register.doctor_via_admin_hint',
          'Аккаунты врачей создаёт администратор. Если вы врач - обратитесь в клинику для регистрации.',
        )}
      </p>

      <PatientFields register={register} errors={errors} />

      <Button type="submit" size="lg" className="w-full" loading={mutation.isPending} icon={<ArrowRight size={16} />}>
        {t('register.submit')}
      </Button>

      <p className="text-xs text-center text-gray-400 pt-1">
        {t('auth.has_account')}{' '}
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          {t('auth.login_link')}
        </Link>
      </p>
    </form>
  );
}

function DoneStep({ result }: { result: RegisterResponse }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        {t('register.done_title')}
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        {t('register.done_patient')}
      </p>
      <p className="text-xs text-gray-400 mt-4">{result.email}</p>

      <Button size="lg" className="w-full mt-6" onClick={() => navigate('/login')}>
        {t('auth.login_btn')}
      </Button>
    </div>
  );
}

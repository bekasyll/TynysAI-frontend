import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useForm, Controller } from 'react-hook-form';
import { User, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DatePicker, { registerLocale } from 'react-datepicker';
import { ru as ruLocale, enUS as enLocale } from 'date-fns/locale';
import { format as formatDate, parseISO, isValid } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import AvatarUpload from '../../components/ui/AvatarUpload';
import AccountTab from '../../components/profile/AccountTab';
import PasswordTab from '../../components/profile/PasswordTab';
import { patientsApi } from '../../api/patients.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { GENDER_TYPES, BLOOD_TYPES } from '../../types';
import type { UpdatePatientProfileRequest } from '../../types';

// date-fns has no Kazakh locale, fall back to Russian (Cyrillic, sensible
// month names for kk users until date-fns ships kk).
registerLocale('ru', ruLocale);
registerLocale('kk', ruLocale);
registerLocale('en', enLocale);

const MIN_DOB = new Date(1900, 0, 1);

export default function PatientProfilePage() {
  const { user, updateAvatar } = useAuthStore();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'medical' | 'account' | 'password'>('medical');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => { const r = await patientsApi.getMe(); return r.data.data!; },
  });

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await usersApi.getMe(); return r.data.data!; },
    staleTime: 0,
  });

  useEffect(() => {
    if (meData !== undefined) {
      updateAvatar(meData.avatarPath ?? null);
    }
  }, [meData?.avatarPath]);

  const profileForm = useForm<UpdatePatientProfileRequest>();

  const profileMutation = useApiMutation(
    (d: UpdatePatientProfileRequest) => patientsApi.updateMe(d),
    {
      successMessage: t('profile.updated'),
      errorMessage: t('profile.save_error'),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient-profile'] }),
    },
  );

  if (isLoading) return <PageSpinner />;

  const tabs = [
    { key: 'medical', label: t('profile.tabs_medical') },
    { key: 'account', label: t('profile.tabs_account') },
    { key: 'password', label: t('profile.tabs_password') },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="flex items-center gap-4">
          <AvatarUpload size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{user?.fullName}</h2>
            <p className="text-sm sm:text-base text-gray-500 break-all">{user?.email}</p>
            {profile?.phoneNumber && <p className="text-sm text-gray-500">{profile.phoneNumber}</p>}
            {profile?.age != null && profile.age > 0 && <p className="text-sm text-gray-400">{t('profile.age_years', { count: profile.age })}</p>}
          </div>
        </div>
      </Card>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab_) => (
          <button
            key={tab_.key}
            onClick={() => setTab(tab_.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === tab_.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      {tab === 'medical' && (
        <Card>
          <form onSubmit={profileForm.handleSubmit((d) => {
            const cleaned = Object.fromEntries(
              Object.entries(d).filter(([, v]) =>
                v !== '' && v !== null && v !== undefined && !(typeof v === 'number' && Number.isNaN(v))
              )
            ) as UpdatePatientProfileRequest;
            profileMutation.mutate(cleaned);
          })} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.date_of_birth')}</label>
                <Controller
                  name="dateOfBirth"
                  control={profileForm.control}
                  defaultValue={profile?.dateOfBirth ?? ''}
                  render={({ field }) => {
                    const parsed = field.value ? parseISO(field.value) : null;
                    const selected = parsed && isValid(parsed) ? parsed : null;
                    return (
                      <DatePicker
                        selected={selected}
                        onChange={(d: Date | null) => field.onChange(d ? formatDate(d, 'yyyy-MM-dd') : '')}
                        onBlur={field.onBlur}
                        // Form value stays as ISO yyyy-MM-dd for the backend
                        // (LocalDate); the picker only controls how it's
                        // shown and entered.
                        dateFormat="dd/MM/yyyy"
                        placeholderText="dd/MM/yyyy"
                        minDate={MIN_DOB}
                        maxDate={new Date()}
                        locale={i18n.language}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        wrapperClassName="block w-full"
                        className="form-input w-full"
                        autoComplete="off"
                      />
                    );
                  }}
                />
              </div>
              <div>
                <label className="form-label">{t('profile.gender')}</label>
                <select className="form-input" defaultValue={profile?.gender ?? ''}
                  {...profileForm.register('gender')}>
                  <option value="">-</option>
                  {GENDER_TYPES.map((k) => (
                    <option key={k} value={k}>{t('gender.' + k)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('profile.blood_type')}</label>
                <select className="form-input" defaultValue={profile?.bloodType ?? ''}
                  {...profileForm.register('bloodType')}>
                  <option value="">-</option>
                  {BLOOD_TYPES.map((k) => (
                    <option key={k} value={k}>{t('bloodType.' + k)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('profile.height')}</label>
                <input type="number" className="form-input" defaultValue={profile?.heightCm ?? ''}
                  {...profileForm.register('heightCm', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="form-label">{t('profile.weight')}</label>
                <input type="number" className="form-input" defaultValue={profile?.weightKg ?? ''}
                  {...profileForm.register('weightKg', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="form-label">{t('profile.insurance')}</label>
                <input className="form-input" defaultValue={profile?.insuranceNumber ?? ''}
                  {...profileForm.register('insuranceNumber')} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('profile.allergies')}</label>
              <textarea className="form-input resize-none" rows={2} defaultValue={profile?.allergies ?? ''}
                {...profileForm.register('allergies')} />
            </div>
            <div>
              <label className="form-label">{t('profile.chronic_diseases')}</label>
              <textarea className="form-input resize-none" rows={2} defaultValue={profile?.chronicDiseases ?? ''}
                {...profileForm.register('chronicDiseases')} />
            </div>
            <div>
              <label className="form-label">{t('profile.medical_history')}</label>
              <textarea className="form-input resize-none" rows={3} defaultValue={profile?.medicalHistory ?? ''}
                {...profileForm.register('medicalHistory')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.emergency_name')}</label>
                <input className="form-input" defaultValue={profile?.emergencyContactName ?? ''}
                  {...profileForm.register('emergencyContactName')} />
              </div>
              <div>
                <label className="form-label">{t('profile.emergency_phone')}</label>
                <input className="form-input" defaultValue={profile?.emergencyContactPhone ?? ''}
                  {...profileForm.register('emergencyContactPhone')} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="smoker" defaultChecked={profile?.smoker ?? false}
                  {...profileForm.register('smoker')} className="rounded" />
                <label htmlFor="smoker" className="text-sm text-gray-700">{t('profile.smoker')}</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="alcohol" defaultChecked={profile?.alcoholUser ?? false}
                  {...profileForm.register('alcoholUser')} className="rounded" />
                <label htmlFor="alcohol" className="text-sm text-gray-700">{t('profile.alcohol')}</label>
              </div>
            </div>
            <Button type="submit" icon={<Save size={14} />} loading={profileMutation.isPending}>{t('common.save')}</Button>
          </form>
        </Card>
      )}

      {tab === 'account' && <AccountTab submitIcon={<User size={14} />} />}
      {tab === 'password' && <PasswordTab />}
    </div>
  );
}

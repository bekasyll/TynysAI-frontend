import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { User, Lock, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/ui/AvatarUpload';
import { patientsApi } from '../../api/patients.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { GENDER_TYPES, BLOOD_TYPES } from '../../types';
import type { UpdatePatientProfileRequest, UpdateUserRequest, ChangePasswordRequest } from '../../types';

export default function PatientProfilePage() {
  const { user, setAuth, updateAvatar } = useAuthStore();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'medical' | 'account' | 'password'>('medical');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => { const r = await patientsApi.getMyProfile(); return r.data.data!; },
  });

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: async () => { const r = await usersApi.getMe(); return r.data.data!; },
    staleTime: 0,
  });

  useEffect(() => {
    if (meData !== undefined) {
      updateAvatar(meData.avatarBase64 ?? null);
    }
  }, [meData?.avatarBase64]);

  const profileForm = useForm<UpdatePatientProfileRequest>();
  const accountForm = useForm<UpdateUserRequest>();
  const passwordForm = useForm<ChangePasswordRequest>();

  const profileMutation = useMutation({
    mutationFn: (d: UpdatePatientProfileRequest) => patientsApi.updateMyProfile(d),
    onSuccess: () => { success(t('profile.updated')); queryClient.invalidateQueries({ queryKey: ['patient-profile'] }); },
    onError: () => error(t('profile.save_error')),
  });

  const accountMutation = useMutation({
    mutationFn: (d: UpdateUserRequest) => usersApi.updateMe(d),
    onSuccess: (res) => {
      success(t('profile.account_updated'));
      const u = res.data.data!;
      if (user) setAuth({ ...user, fullName: u.fullName, avatarBase64: u.avatarBase64 ?? user.avatarBase64 }, localStorage.getItem('accessToken')!, localStorage.getItem('refreshToken')!);
    },
    onError: () => error(t('profile.save_error')),
  });

  const passwordMutation = useMutation({
    mutationFn: (d: ChangePasswordRequest) => usersApi.changePassword(d),
    onSuccess: () => { success(t('profile.password_changed')); passwordForm.reset(); },
    onError: () => error(t('profile.wrong_password')),
  });

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
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{user?.fullName}</h2>
            <p className="text-gray-500">{user?.email}</p>
            {profile?.phoneNumber && <p className="text-sm text-gray-500">{profile.phoneNumber}</p>}
            {profile?.age && <p className="text-sm text-gray-400">{t('profile.age_years', { age: profile.age })}</p>}
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
          <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.date_of_birth')}</label>
                <input type="date" className="form-input" defaultValue={profile?.dateOfBirth ?? ''}
                  {...profileForm.register('dateOfBirth')} />
              </div>
              <div>
                <label className="form-label">{t('profile.gender')}</label>
                <select className="form-input" defaultValue={profile?.gender ?? ''}
                  {...profileForm.register('gender')}>
                  <option value="">—</option>
                  {GENDER_TYPES.map((k) => (
                    <option key={k} value={k}>{t('gender.' + k)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('profile.blood_type')}</label>
                <select className="form-input" defaultValue={profile?.bloodType ?? ''}
                  {...profileForm.register('bloodType')}>
                  <option value="">—</option>
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
            <div className="grid grid-cols-2 gap-4">
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

      {tab === 'account' && (
        <Card>
          <form onSubmit={accountForm.handleSubmit((d) => accountMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.first_name')}</label>
                <input className="form-input" defaultValue={user?.fullName?.split(' ')[0] ?? ''}
                  {...accountForm.register('firstName', { required: t('common.required') })} />
              </div>
              <div>
                <label className="form-label">{t('profile.last_name')}</label>
                <input className="form-input" defaultValue={user?.fullName?.split(' ').slice(1).join(' ') ?? ''}
                  {...accountForm.register('lastName', { required: t('common.required') })} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('profile.phone')}</label>
              <input className="form-input" placeholder="+77001234567"
                defaultValue={profile?.phoneNumber ?? ''}
                {...accountForm.register('phoneNumber')} />
            </div>
            <Button type="submit" icon={<User size={14} />} loading={accountMutation.isPending}>{t('common.save')}</Button>
          </form>
        </Card>
      )}

      {tab === 'password' && (
        <Card>
          <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="form-label">{t('profile.current_password')}</label>
              <input type="password" className="form-input"
                {...passwordForm.register('currentPassword', { required: t('common.required') })} />
            </div>
            <div>
              <label className="form-label">{t('profile.new_password')}</label>
              <input type="password" className="form-input"
                {...passwordForm.register('newPassword', {
                  required: t('common.required'),
                  minLength: { value: 8, message: t('auth.password_min') },
                  pattern: { value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('auth.password_pattern') },
                })} />
              {passwordForm.formState.errors.newPassword && (
                <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <Button type="submit" icon={<Lock size={14} />} loading={passwordMutation.isPending}>{t('profile.change_password')}</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Stethoscope, Lock, Save, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/ui/AvatarUpload';
import { doctorsApi } from '../../api/doctors.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import type { UpdateDoctorProfileRequest, UpdateUserRequest, ChangePasswordRequest } from '../../types';

export default function DoctorProfilePage() {
  const { user, updateAvatar } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'profile' | 'account' | 'password'>('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => { const r = await doctorsApi.getMyProfile(); return r.data.data!; },
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

  const profileForm = useForm<UpdateDoctorProfileRequest>();
  const accountForm = useForm<UpdateUserRequest>();
  const passwordForm = useForm<ChangePasswordRequest>();

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        specialization: profile.specialization ?? '',
        licenseNumber: profile.licenseNumber ?? '',
        hospitalName: profile.hospitalName ?? '',
        department: profile.department ?? '',
        yearsOfExperience: profile.yearsOfExperience ?? undefined,
        workSchedule: profile.workSchedule ?? '',
        education: profile.education ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (meData) {
      const parts = (meData.fullName ?? '').split(' ');
      accountForm.reset({
        firstName: parts[0] ?? '',
        lastName: parts.slice(1).join(' ') ?? '',
        phoneNumber: meData.phoneNumber ?? '',
      });
    }
  }, [meData]);

  const profileMutation = useMutation({
    mutationFn: (d: UpdateDoctorProfileRequest) => doctorsApi.updateMyProfile(d),
    onSuccess: () => { success(t('profile.updated')); queryClient.invalidateQueries({ queryKey: ['doctor-profile'] }); },
    onError: () => error(t('profile.save_error')),
  });

  const accountMutation = useMutation({
    mutationFn: (d: UpdateUserRequest) => usersApi.updateMe(d),
    onSuccess: () => success(t('profile.account_updated')),
    onError: () => error(t('profile.save_error')),
  });

  const passwordMutation = useMutation({
    mutationFn: (d: ChangePasswordRequest) => usersApi.changePassword(d),
    onSuccess: () => { success(t('profile.password_changed')); passwordForm.reset(); },
    onError: () => error(t('profile.wrong_password')),
  });

  if (isLoading) return <PageSpinner />;

  const tabs = [
    { key: 'profile', label: t('profile.tabs_professional') },
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
            <p className="text-gray-500">{profile?.specialization ?? t('profile.spec_not_set')}</p>
            {meData?.phoneNumber && <p className="text-sm text-gray-500">{meData.phoneNumber}</p>}
            <div className="mt-1">
              {profile?.approved
                ? <Badge color="green"><CheckCircle size={12} className="inline mr-1" />{t('profile.verified')}</Badge>
                : <Badge color="yellow"><Clock size={12} className="inline mr-1" />{t('profile.pending_approval')}</Badge>}
            </div>
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

      {tab === 'profile' && (
        <Card>
          <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.specialization')}</label>
                <input className="form-input" {...profileForm.register('specialization')} />
              </div>
              <div>
                <label className="form-label">{t('profile.license')}</label>
                <input className="form-input" {...profileForm.register('licenseNumber')} />
              </div>
              <div>
                <label className="form-label">{t('profile.hospital')}</label>
                <input className="form-input" {...profileForm.register('hospitalName')} />
              </div>
              <div>
                <label className="form-label">{t('profile.department')}</label>
                <input className="form-input" {...profileForm.register('department')} />
              </div>
              <div>
                <label className="form-label">{t('profile.experience')}</label>
                <input type="number" className="form-input"
                  {...profileForm.register('yearsOfExperience', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="form-label">{t('profile.work_schedule')}</label>
                <input className="form-input" placeholder="Mon-Fri 9:00-17:00"
                  {...profileForm.register('workSchedule')} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('profile.education')}</label>
              <input className="form-input" {...profileForm.register('education')} />
            </div>
            <div>
              <label className="form-label">{t('profile.bio')}</label>
              <textarea className="form-input resize-none" rows={3}
                maxLength={500} {...profileForm.register('bio')} />
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
                <input className="form-input" {...accountForm.register('firstName', { required: true })} />
              </div>
              <div>
                <label className="form-label">{t('profile.last_name')}</label>
                <input className="form-input" {...accountForm.register('lastName', { required: true })} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('profile.phone')}</label>
              <input className="form-input" placeholder="+77001234567" {...accountForm.register('phoneNumber')} />
            </div>
            <Button type="submit" icon={<Stethoscope size={14} />} loading={accountMutation.isPending}>{t('common.save')}</Button>
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

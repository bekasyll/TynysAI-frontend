import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useForm } from 'react-hook-form';
import { Stethoscope, Save, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../../components/ui/AvatarUpload';
import AccountTab from '../../components/profile/AccountTab';
import PasswordTab from '../../components/profile/PasswordTab';
import { doctorsApi } from '../../api/doctors.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { UpdateDoctorProfileRequest } from '../../types';
import { buildProfileUpdate } from '../../lib/forms';

export default function DoctorProfilePage() {
  const { user, updateAvatar } = useAuthStore();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'profile' | 'account' | 'password'>('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => { const r = await doctorsApi.getMe(); return r.data.data!; },
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

  const profileForm = useForm<UpdateDoctorProfileRequest>();

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        specialization: profile.specialization ?? '',
        licenseNumber: profile.licenseNumber ?? '',
        hospitalName: profile.hospitalName ?? '',
        department: profile.department ?? '',
        yearsOfExperience: profile.yearsOfExperience ?? undefined,
        education: profile.education ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile]);

  const profileMutation = useApiMutation(
    (d: UpdateDoctorProfileRequest) => doctorsApi.updateMe(d),
    {
      successMessage: t('profile.updated'),
      errorMessage: t('profile.save_error'),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor-profile'] }),
    },
  );

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
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">{user?.fullName}</h2>
            <p className="text-sm sm:text-base text-gray-500 break-words">{profile?.specialization ?? t('profile.spec_not_set')}</p>
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
            className={`flex-1 py-2 font-medium rounded-lg transition-colors ${
              // Only the "professional profile" label is long enough to wrap
              // on narrow screens - shrink just that one to xs on mobile.
              tab_.key === 'profile' ? 'text-xs sm:text-sm' : 'text-sm'
            } ${
              tab === tab_.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card>
          <form onSubmit={profileForm.handleSubmit((d) => {
            // Keep emptied text fields ("") so the backend clears them; omit the
            // numeric field and the license (empty "" would hit the uniqueness
            // check) so they stay unchanged instead.
            const cleaned = buildProfileUpdate(d, ['yearsOfExperience', 'licenseNumber']);
            profileMutation.mutate(cleaned as UpdateDoctorProfileRequest);
          })} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('profile.specialization')}</label>
                <input className="form-input" {...profileForm.register('specialization')} />
              </div>
              <div>
                <label className="form-label">{t('profile.license')}</label>
                <input className="form-input" {...profileForm.register('licenseNumber')} />
              </div>
              <div>
                <label className="form-label">{t('profile.experience')}</label>
                <input type="number" className="form-input"
                  {...profileForm.register('yearsOfExperience', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="form-label">{t('profile.hospital')}</label>
                <input className="form-input" {...profileForm.register('hospitalName')} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('profile.department')}</label>
              <input className="form-input" {...profileForm.register('department')} />
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

      {tab === 'account' && <AccountTab submitIcon={<Stethoscope size={14} />} />}
      {tab === 'password' && <PasswordTab />}
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { Stethoscope, User as UserIcon, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../../api/admin.api';
import type { RegisterDoctorRequest, RegisterPatientRequest } from '../../../api/auth.api';
import { useToast } from '../../../components/ui/Toast';
import { useApiMutation } from '../../../hooks/useApiMutation';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { PatientFields, DoctorFields, cleanPatient, cleanDoctor } from '../../../components/auth/UserFormFields';

export type CreateRole = 'PATIENT' | 'DOCTOR' | null;

interface Props {
  role: CreateRole;
  onClose: () => void;
  onSwitchRole: (r: 'PATIENT' | 'DOCTOR') => void;
  onCreated: () => void;
}

export default function CreateUserDialog({ role, onClose, onSwitchRole, onCreated }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={role !== null}
      onClose={onClose}
      title={role === 'DOCTOR'
        ? t('admin.create_doctor_title')
        : t('admin.create_patient_title')}
      size="lg"
    >
      <div className="p-6 space-y-5">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => onSwitchRole('PATIENT')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              role === 'PATIENT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon size={14} /> {t('register.role_patient')}
          </button>
          <button
            onClick={() => onSwitchRole('DOCTOR')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              role === 'DOCTOR' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Stethoscope size={14} /> {t('register.role_doctor')}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          {t(
            'admin.create_user_hint',
            'Email будет автоматически подтверждён, пароль - временным (пользователь сменит при первом входе). Врач сразу получит статус «одобрен».',
          )}
        </p>

        {role === 'PATIENT' && <CreatePatientForm onCreated={onCreated} onCancel={onClose} />}
        {role === 'DOCTOR' && <CreateDoctorForm onCreated={onCreated} onCancel={onClose} />}
      </div>
    </Modal>
  );
}

function CreatePatientForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterPatientRequest>();

  const mutation = useApiMutation(
    (data: RegisterPatientRequest) => adminApi.createPatient(data),
    {
      onSuccess: (res) => {
        success(t('admin.created_patient') + `: ${res.data.data!.email}`);
        onCreated();
      },
    },
  );

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(cleanPatient(d)))} className="space-y-4">
      <PatientFields register={register} errors={errors} />
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={mutation.isPending} icon={<UserPlus size={14} />}>
          {t('admin.create_btn')}
        </Button>
      </div>
    </form>
  );
}

function CreateDoctorForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const { success } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterDoctorRequest>();

  const mutation = useApiMutation(
    (data: RegisterDoctorRequest) => adminApi.createDoctor(data),
    {
      onSuccess: (res) => {
        success(t('admin.created_doctor') + `: ${res.data.data!.email}`);
        onCreated();
      },
    },
  );

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(cleanDoctor(d)))} className="space-y-4">
      <DoctorFields register={register} errors={errors} />
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" loading={mutation.isPending} icon={<UserPlus size={14} />}>
          {t('admin.create_btn')}
        </Button>
      </div>
    </form>
  );
}

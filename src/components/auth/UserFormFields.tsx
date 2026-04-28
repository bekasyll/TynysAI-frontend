import { useTranslation } from 'react-i18next';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { RegisterDoctorRequest, RegisterPatientRequest } from '../../api/auth.api';

/**
 * Reusable fields for the patient/doctor registration forms. Pure presentation -
 * the parent owns the {@code useForm} instance and the submit mutation, which
 * lets the same fields drive both the public self-registration page and the
 * admin "create user" modal.
 */

export function PatientFields({
  register,
  errors,
}: {
  register: UseFormRegister<RegisterPatientRequest>;
  errors: FieldErrors<RegisterPatientRequest>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">{t('profile.first_name')} <span className="text-red-500">*</span></label>
          <input className="form-input" {...register('firstName', { required: t('common.required') })} />
          {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="form-label">{t('profile.last_name')} <span className="text-red-500">*</span></label>
          <input className="form-input" {...register('lastName', { required: t('common.required') })} />
          {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="form-label">{t('profile.middle_name')}</label>
        <input className="form-input" {...register('middleName')} />
      </div>

      <div>
        <label className="form-label">Email <span className="text-red-500">*</span></label>
        <input
          type="email"
          className="form-input"
          {...register('email', {
            required: t('common.required'),
            pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: t('register.invalid_email') },
          })}
        />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div>
        <label className="form-label">{t('auth.password')} <span className="text-red-500">*</span></label>
        <input
          type="password"
          className="form-input"
          autoComplete="new-password"
          {...register('password', {
            required: t('common.required'),
            minLength: { value: 8, message: t('auth.password_min') },
            pattern: {
              value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: t('auth.password_pattern'),
            },
          })}
        />
        {errors.password && <p className="form-error">{errors.password.message}</p>}
      </div>

      <div>
        <label className="form-label">{t('profile.phone')}</label>
        <input
          type="tel"
          className="form-input"
          placeholder="+77001234567"
          {...register('phoneNumber', {
            pattern: {
              value: /^\+?[1-9]\d{6,14}$/,
              message: t('register.invalid_phone'),
            },
          })}
        />
        {errors.phoneNumber && <p className="form-error">{errors.phoneNumber.message}</p>}
      </div>
    </>
  );
}

export function DoctorFields({
  register,
  errors,
}: {
  register: UseFormRegister<RegisterDoctorRequest>;
  errors: FieldErrors<RegisterDoctorRequest>;
}) {
  const { t } = useTranslation();

  return (
    <>
      <fieldset className="space-y-4">
        <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {t('register.section_account')}
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('profile.first_name')} <span className="text-red-500">*</span></label>
            <input className="form-input" {...register('firstName', { required: t('common.required') })} />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('profile.last_name')} <span className="text-red-500">*</span></label>
            <input className="form-input" {...register('lastName', { required: t('common.required') })} />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">{t('profile.middle_name')}</label>
          <input className="form-input" {...register('middleName')} />
        </div>

        <div>
          <label className="form-label">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            className="form-input"
            {...register('email', {
              required: t('common.required'),
              pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: t('register.invalid_email') },
            })}
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="form-label">{t('auth.password')} <span className="text-red-500">*</span></label>
          <input
            type="password"
            className="form-input"
            autoComplete="new-password"
            {...register('password', {
              required: t('common.required'),
              minLength: { value: 8, message: t('auth.password_min') },
              pattern: {
                value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: t('auth.password_pattern'),
              },
            })}
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>

        <div>
          <label className="form-label">{t('profile.phone')}</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+77001234567"
            {...register('phoneNumber', {
              pattern: {
                value: /^\+?[1-9]\d{6,14}$/,
                message: t('register.invalid_phone'),
              },
            })}
          />
          {errors.phoneNumber && <p className="form-error">{errors.phoneNumber.message}</p>}
        </div>
      </fieldset>

      <fieldset className="space-y-4 pt-2 border-t border-gray-100">
        <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4">
          {t('register.section_professional')}
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('profile.specialization')} <span className="text-red-500">*</span></label>
            <input className="form-input" {...register('specialization', { required: t('common.required') })} />
            {errors.specialization && <p className="form-error">{errors.specialization.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('profile.license')} <span className="text-red-500">*</span></label>
            <input className="form-input" {...register('licenseNumber', { required: t('common.required') })} />
            {errors.licenseNumber && <p className="form-error">{errors.licenseNumber.message}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">{t('profile.experience')}</label>
          <input
            type="number"
            min={0}
            max={70}
            className="form-input"
            {...register('yearsOfExperience', {
              min: { value: 0, message: t('register.invalid_experience') },
              valueAsNumber: true,
            })}
          />
        </div>

        <div>
          <label className="form-label">{t('profile.hospital')}</label>
          <input className="form-input" {...register('hospitalName')} />
        </div>

        <div>
          <label className="form-label">{t('profile.department')}</label>
          <input className="form-input" {...register('department')} />
        </div>

        <div>
          <label className="form-label">{t('profile.education')}</label>
          <input className="form-input" {...register('education', { maxLength: 500 })} />
        </div>

        <div>
          <label className="form-label">{t('profile.bio')}</label>
          <textarea className="form-input resize-none" rows={3} maxLength={500} {...register('bio', { maxLength: 500 })} />
        </div>
      </fieldset>
    </>
  );
}

/**
 * Strips empty strings → undefined so the JSON sent to the backend doesn't
 * fail Bean Validation patterns like {@code @Pattern(regexp=...)} on optional
 * phone fields.
 */
export function cleanPatient(d: RegisterPatientRequest): RegisterPatientRequest {
  return {
    ...d,
    middleName: d.middleName || undefined,
    phoneNumber: d.phoneNumber || undefined,
  };
}

export function cleanDoctor(d: RegisterDoctorRequest): RegisterDoctorRequest {
  return {
    ...d,
    middleName: d.middleName || undefined,
    phoneNumber: d.phoneNumber || undefined,
    hospitalName: d.hospitalName || undefined,
    department: d.department || undefined,
    bio: d.bio || undefined,
    education: d.education || undefined,
    yearsOfExperience: d.yearsOfExperience ? Number(d.yearsOfExperience) : undefined,
  };
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { xraysApi } from '../../api/xrays.api';
import { doctorsApi } from '../../api/doctors.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUploadZone from '../../components/ui/FileUploadZone';
import { useToast } from '../../components/ui/Toast';
import { getApiError } from '../../lib/api-error';

interface FormData {
  notes: string;
  doctorId: string;
  lang: string;
}

const LANG_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'kk', label: 'Қазақша' },
  { value: 'en', label: 'English' },
];

export default function UploadAnalysisPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    defaultValues: { doctorId: '', lang: i18n.language },
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: async () => { const r = await doctorsApi.listApproved(); return r.data.data!; },
  });

  async function onSubmit(data: FormData) {
    if (!file) { error(t('upload.no_file')); return; }
    try {
      const res = await xraysApi.patientUpload(file, data.notes || undefined, data.doctorId || undefined, data.lang);
      const id = res.data.data!.id;
      success(t('upload.success'));
      navigate(`/patient/analyses/${id}`);
    } catch (e: unknown) {
      error(getApiError(e) ?? t('upload.upload_error'));
    }
  }

  const steps = [
    { step: '1', label: t('upload.step1_label'), desc: t('upload.step1_desc') },
    { step: '2', label: t('upload.step2_label'), desc: t('upload.step2_desc') },
    { step: '3', label: t('upload.step3_label'), desc: t('upload.step3_desc') },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <h3 className="font-semibold text-gray-900 mb-1">{t('upload.how_title')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('upload.how_desc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {steps.map((s) => (
            <div key={s.step} className="p-3 bg-blue-50 rounded-lg">
              <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">{s.step}</div>
              <p className="text-xs font-medium text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <FileUploadZone file={file} onFileChange={setFile} />
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('upload.assign_doctor')} <span className="text-red-500">*</span></label>
              <select
                className={`form-input ${errors.doctorId ? 'border-red-400' : ''}`}
                {...register('doctorId', { required: t('common.required') })}
              >
                <option value="">{t('upload.choose_doctor_placeholder')}</option>
                {doctorsData?.content.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {d.fullName}{d.specialization ? ` - ${d.specialization}` : ''}{d.hospitalName ? ` (${d.hospitalName})` : ''}
                  </option>
                ))}
              </select>
              {errors.doctorId && <p className="form-error">{errors.doctorId.message}</p>}
              <p className="text-xs text-gray-400 mt-1">{t('upload.assign_doctor_hint')}</p>
            </div>
            <div>
              <label className="form-label">{t('upload.result_language')}</label>
              <select className="form-input" {...register('lang')}>
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">{t('upload.result_language_hint')}</p>
            </div>
            <div>
              <label className="form-label">{t('upload.notes')}</label>
              <textarea
                className="form-input resize-none"
                rows={3}
                placeholder={t('upload.notes_placeholder')}
                {...register('notes')}
              />
            </div>
          </div>
        </Card>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<Upload size={18} />}>
          {t('upload.submit_btn')}
        </Button>
      </form>
    </div>
  );
}

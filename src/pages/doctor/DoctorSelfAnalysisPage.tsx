import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUploadZone from '../../components/ui/FileUploadZone';
import { useToast } from '../../components/ui/Toast';
import { getApiError } from '../../lib/api-error';
import { IMAGE_TYPES } from '../../types';
import type { ImageType } from '../../types';

interface FormData {
  imageType: ImageType;
  notes: string;
}

export default function DoctorSelfAnalysisPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { imageType: 'XRAY_CHEST' },
  });

  async function onSubmit(data: FormData) {
    if (!file) { error(t('upload.no_file')); return; }
    try {
      const res = await doctorsApi.uploadSelfAnalysis(file, data.imageType, data.notes || undefined);
      success(t('upload.success'));
      navigate(`/doctor/analyses/${res.data.data!.id}/validate`);
    } catch (e: unknown) {
      error(getApiError(e) ?? t('upload.upload_error'));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Brain size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{t('nav.ai_analysis')}</h1>
          <p className="text-sm text-gray-500">{t('upload.self_analysis_desc')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card>
          <FileUploadZone file={file} onFileChange={setFile} />
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('upload.image_type')}</label>
              <select className="form-input" {...register('imageType')}>
                {IMAGE_TYPES.map((k) => (
                  <option key={k} value={k}>{t('imageType.' + k)}</option>
                ))}
              </select>
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

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<Brain size={18} />}>
          {t('upload.submit_btn')}
        </Button>
      </form>
    </div>
  );
}

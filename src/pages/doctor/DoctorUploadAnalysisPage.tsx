import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Upload, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUploadZone from '../../components/ui/FileUploadZone';
import { useToast } from '../../components/ui/Toast';
import { PageSpinner } from '../../components/ui/Spinner';
import { getApiError } from '../../lib/api-error';
import { IMAGE_TYPES } from '../../types';
import type { ImageType } from '../../types';

interface FormData {
  imageType: ImageType;
  notes: string;
}

export default function DoctorUploadAnalysisPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['doctor-patient', patientId],
    queryFn: async () => { const r = await doctorsApi.getPatient(patientId!); return r.data.data!; },
  });

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { imageType: 'XRAY_CHEST' },
  });

  async function onSubmit(data: FormData) {
    if (!file) { error(t('upload.no_file')); return; }
    try {
      const res = await doctorsApi.uploadPatientAnalysis(patientId!, file, data.imageType, data.notes || undefined);
      const id = res.data.data!.id;
      success(t('upload.success'));
      navigate(`/doctor/analyses/${id}/validate`);
    } catch (e: unknown) {
      error(getApiError(e) ?? t('upload.upload_error'));
    }
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
        {patient && (
          <span className="text-sm text-gray-500">{t('patients.upload_xray_for')}: <strong>{patient.fullName}</strong></span>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<Upload size={18} />}>
          {t('upload.submit_btn')}
        </Button>
      </form>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { xraysApi } from '../../api/xrays.api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FileUploadZone from '../../components/ui/FileUploadZone';
import { useToast } from '../../components/ui/Toast';
import { getApiError } from '../../lib/api-error';

interface FormData {
  notes: string;
  lang: string;
}

const LANG_OPTIONS = [
  { value: 'ru', label: 'Русский' },
  { value: 'kk', label: 'Қазақша' },
  { value: 'en', label: 'English' },
];

export default function DoctorSelfAnalysisPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { lang: i18n.language },
  });

  async function onSubmit(data: FormData) {
    if (!file) { error(t('upload.no_file')); return; }
    try {
      const res = await xraysApi.doctorUpload(file, data.notes || undefined, data.lang);
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

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} icon={<Brain size={18} />}>
          {t('upload.submit_btn')}
        </Button>
      </form>
    </div>
  );
}

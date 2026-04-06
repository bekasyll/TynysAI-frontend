import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { FlaskConical, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorsApi } from '../../api/doctors.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { LabResultRequest } from '../../types';
import { LAB_TEST_TYPES } from '../../types';

export default function AddLabResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const patientId = params.get('patientId') ?? '';
  const { success, error } = useToast();
  const { t } = useTranslation();

  const { data: patients, isLoading } = useQuery({
    queryKey: ['doctor-patients-all'],
    queryFn: async () => { const r = await doctorsApi.getPatients(0, 100); return r.data.data!; },
  });

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<LabResultRequest>({
    defaultValues: { patientId, testType: 'COMPLETE_BLOOD_COUNT', testDate: new Date().toISOString().split('T')[0] },
  });

  const testType = watch('testType');

  const mutation = useMutation({
    mutationFn: (data: LabResultRequest) => doctorsApi.addLabResult(data),
    onSuccess: (_, vars) => {
      success(t('add_lab.success'));
      navigate(`/doctor/patients/${vars.patientId}`);
    },
    onError: () => error(t('add_lab.error')),
  });

  if (isLoading) return <PageSpinner />;

  const numField = (label: string, name: keyof LabResultRequest, unit: string) => (
    <div key={name}>
      <label className="form-label">{label}{unit && <span className="text-gray-400 font-normal"> ({unit})</span>}</label>
      <input type="number" step="any" className="form-input"
        {...register(name, { valueAsNumber: true })} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <FlaskConical size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-900">{t('add_lab.base_info')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('add_lab.patient_label')}</label>
              <select className="form-input" {...register('patientId', { required: true })}>
                <option value="">{t('add_lab.choose_patient')}</option>
                {patients?.content.map((p) => (
                  <option key={p.userId} value={p.userId}>{p.fullName}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">{t('add_lab.test_type')}</label>
                <select className="form-input" {...register('testType', { required: true })}>
                  {LAB_TEST_TYPES.map((k) => (
                    <option key={k} value={k}>{t('labTest.' + k)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">{t('add_lab.test_date')}</label>
                <input type="date" className="form-input" {...register('testDate', { required: true })} />
              </div>
            </div>
            <div>
              <label className="form-label">{t('add_lab.lab_name')}</label>
              <input className="form-input" placeholder={t('add_lab.lab_placeholder')} {...register('labName')} />
            </div>
          </div>
        </Card>

        {testType === 'COMPLETE_BLOOD_COUNT' && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.cbc_title')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {numField('Hemoglobin', 'hemoglobin', 'g/L')}
              {numField('WBC', 'wbc', '×10⁹/L')}
              {numField('RBC', 'rbc', '×10¹²/L')}
              {numField('Platelets', 'platelets', '×10⁹/L')}
              {numField('Hematocrit', 'hematocrit', '%')}
              {numField('Neutrophils', 'neutrophils', '%')}
              {numField('Lymphocytes', 'lymphocytes', '%')}
              {numField('Monocytes', 'monocytes', '%')}
              {numField('Eosinophils', 'eosinophils', '%')}
            </div>
          </Card>
        )}

        {testType === 'INFLAMMATORY_MARKERS' && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.inflammatory_title')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {numField('CRP', 'crp', 'mg/L')}
              {numField('ESR', 'esr', 'mm/h')}
              {numField('Procalcitonin', 'proCalcitonin', 'ng/mL')}
              {numField('Ferritin', 'ferritin', 'ng/mL')}
              {numField('LDH', 'ldh', 'U/L')}
              {numField('D-dimer', 'dDimer', 'ng/mL')}
            </div>
          </Card>
        )}

        {testType === 'BIOCHEMISTRY' && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.biochem_title')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {numField('Glucose', 'glucose', 'mmol/L')}
              {numField('Creatinine', 'creatinine', 'μmol/L')}
              {numField('Urea', 'urea', 'mmol/L')}
              {numField('Albumin', 'albumin', 'g/L')}
              {numField('Total Protein', 'totalProtein', 'g/L')}
              {numField('ALT', 'alt', 'U/L')}
              {numField('AST', 'ast', 'U/L')}
              {numField('Bilirubin', 'bilirubin', 'μmol/L')}
            </div>
          </Card>
        )}

        {testType === 'BLOOD_GAS' && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.blood_gas_title')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {numField('pH', 'ph', '')}
              {numField('PaO₂', 'pao2', 'mmHg')}
              {numField('PaCO₂', 'paco2', 'mmHg')}
              {numField('HCO₃', 'hco3', 'mmol/L')}
              {numField('SpO₂', 'spo2', '%')}
            </div>
          </Card>
        )}

        {testType === 'SPIROMETRY' && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.spirometry_title')}</h4>
            <div className="grid grid-cols-2 gap-3">
              {numField('FEV1', 'fev1', 'L')}
              {numField('FVC', 'fvc', 'L')}
              {numField('FEV1/FVC', 'fev1FvcRatio', '%')}
            </div>
          </Card>
        )}

        {(testType === 'PCR_COVID' || testType === 'PCR_TB') && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.pcr_title')}</h4>
            <div className="space-y-3">
              <div>
                <label className="form-label">{t('add_lab.pcr_result')}</label>
                <input className="form-input" placeholder={t('add_lab.pcr_placeholder')} {...register('pcrResult')} />
              </div>
              {numField('CT value', 'pcrCtValue', '')}
            </div>
          </Card>
        )}

        {(testType === 'MANTOUX' || testType === 'IGRA_TB') && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.tb_title')}</h4>
            <div className="space-y-3">
              {testType === 'MANTOUX' && (
                <>
                  <div><label className="form-label">{t('add_lab.mantoux_result')}</label><input className="form-input" {...register('mantouxResult')} /></div>
                  <div><label className="form-label">{t('add_lab.mantoux_size')}</label><input type="number" className="form-input" {...register('mantouxInduratMm', { valueAsNumber: true })} /></div>
                </>
              )}
              {testType === 'IGRA_TB' && (
                <div><label className="form-label">{t('add_lab.igra_result')}</label><input className="form-input" {...register('igraResult')} /></div>
              )}
            </div>
          </Card>
        )}

        {(testType === 'SPUTUM_CULTURE' || testType === 'CULTURE_SENSITIVITY') && (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">{t('add_lab.culture_title')}</h4>
            <div className="space-y-3">
              <div><label className="form-label">{t('add_lab.culture_result')}</label><input className="form-input" {...register('cultureResult')} /></div>
              <div><label className="form-label">{t('add_lab.pathogen')}</label><input className="form-input" {...register('pathogenFound')} /></div>
              <div><label className="form-label">{t('add_lab.sensitivity')}</label><textarea className="form-input resize-none" rows={3} {...register('sensitivityResult')} /></div>
            </div>
          </Card>
        )}

        <Card>
          <div className="space-y-4">
            <div>
              <label className="form-label">{t('add_lab.notes')}</label>
              <textarea className="form-input resize-none" rows={3} {...register('notes')} />
            </div>
            <div>
              <label className="form-label">{t('add_lab.raw_text')}</label>
              <textarea className="form-input resize-none font-mono text-xs" rows={5}
                placeholder={t('add_lab.raw_placeholder')} {...register('rawResultText')} />
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" icon={<Save size={14} />} loading={isSubmitting || mutation.isPending}>
            {t('add_lab.submit_btn')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
        </div>
      </form>
    </div>
  );
}

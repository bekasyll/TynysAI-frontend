import { useTranslation } from 'react-i18next';

interface ConfidenceBarProps {
  confidence: number | null | undefined;
  diagnosis?: string;
  size?: 'sm' | 'md';
}

export default function ConfidenceBar({ confidence, diagnosis, size = 'md' }: ConfidenceBarProps) {
  const { t } = useTranslation();
  const pct = confidence != null ? Math.round(confidence * 100) : null;

  if (pct == null && !diagnosis) return null;

  const isSm = size === 'sm';

  return (
    <div className={`grid ${pct != null && diagnosis ? 'grid-cols-2' : 'grid-cols-1'} gap-${isSm ? '3' : '4'}`}>
      {diagnosis && (
        <div className={`${isSm ? 'p-3' : 'p-4'} bg-blue-50 rounded-xl`}>
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
            {t('validate.diagnosis_label')}
          </p>
          <p className={`font-semibold text-gray-900 ${isSm ? 'text-sm' : ''}`}>
            {t('disease.' + diagnosis)}
          </p>
        </div>
      )}
      {pct != null && (
        <div className={`${isSm ? 'p-3' : 'p-4'} bg-gray-50 rounded-xl`}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            {t('validate.confidence_label')}
          </p>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-gray-900 ${isSm ? 'text-sm' : ''}`}>{pct}%</span>
            <div className={`flex-1 ${isSm ? 'h-1.5' : 'h-2'} bg-gray-200 rounded-full overflow-hidden`}>
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import type { AnalysisStatus, Severity, AppointmentStatus } from '../../types';

type Color = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';

const colorClasses: Record<Color, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ color = 'gray', children }: { color?: Color; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

const statusColors: Record<AnalysisStatus, Color> = {
  PENDING: 'gray',
  PROCESSING: 'blue',
  COMPLETED: 'green',
  REQUIRES_REVIEW: 'yellow',
  VALIDATED: 'purple',
  FAILED: 'red',
};

export function StatusBadge({ status }: { status: AnalysisStatus }) {
  const { t } = useTranslation();
  return <Badge color={statusColors[status] ?? 'gray'}>{t(`status.${status}`)}</Badge>;
}

const severityColors: Record<Severity, Color> = {
  NONE: 'green',
  MILD: 'blue',
  MODERATE: 'yellow',
  SEVERE: 'orange',
  CRITICAL: 'red',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useTranslation();
  return <Badge color={severityColors[severity] ?? 'gray'}>{t(`severity.${severity}`)}</Badge>;
}

const appointmentStatusColors: Record<AppointmentStatus, Color> = {
  PENDING: 'yellow',
  ACCEPTED: 'blue',
  REJECTED: 'red',
  COMPLETED: 'green',
  CANCELLED: 'gray',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation();
  return <Badge color={appointmentStatusColors[status] ?? 'gray'}>{t(`appointmentStatus.${status}`)}</Badge>;
}

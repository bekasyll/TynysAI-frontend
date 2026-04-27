import type { LucideIcon } from 'lucide-react';

/**
 * Canonical empty-state rendering, used across patient/doctor/admin tables and
 * card lists. Mirrors the look the patient pages had: a faint background icon,
 * a medium-weight title and a smaller hint underneath. {@code action} is for
 * the optional CTA (a button or link).
 */
export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className = '',
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`py-16 text-center ${className}`}>
      <Icon size={48} className="mx-auto mb-4 text-gray-200" />
      <p className="text-gray-500 font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
      {action && <div className="mt-4 inline-block">{action}</div>}
    </div>
  );
}

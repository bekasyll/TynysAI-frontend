interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${padding ? 'p-4 sm:p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 break-words">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5 break-words">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatCard({ title, value, icon, color = 'blue' }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
}) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    teal: 'bg-teal-50 text-teal-600',
  };
  return (
    <Card>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${bg[color]}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 break-words">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{value}</p>
        </div>
      </div>
    </Card>
  );
}

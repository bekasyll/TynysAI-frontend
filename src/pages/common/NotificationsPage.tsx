import { useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { notificationsApi } from '../../api/notifications.api';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import type { NotificationType } from '../../types';

/**
 * Backend sends raw enum codes for some params (e.g. diagnosis=BACTERIAL_PNEUMONIA,
 * testType=COMPLETE_BLOOD_COUNT, severity=MODERATE). We replace those with the
 * already-localized versions from our shared dictionaries before handing the
 * params off to i18next, so the rendered message is fully localized.
 */
const ENUM_NAMESPACES: Record<string, string> = {
  diagnosis: 'disease',
  testType: 'labTest',
  severity: 'severity',
};

function localizeParams(params: Record<string, string> | undefined, t: TFunction): Record<string, string> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(params)) {
    const ns = ENUM_NAMESPACES[key];
    if (ns) {
      // disease.BACTERIAL_PNEUMONIA → "Бактериальная пневмония". Falls back to
      // the raw enum if no translation key exists (so unknown codes are still
      // visible rather than silently dropped).
      const translated = t(`${ns}.${raw}`, { defaultValue: raw });
      out[key] = typeof translated === 'string' ? translated : raw;
    } else {
      out[key] = raw;
    }
  }
  return out;
}

const typeColors: Record<NotificationType, string> = {
  APPOINTMENT_REQUESTED: 'bg-orange-100 text-orange-700',
  APPOINTMENT_ACCEPTED: 'bg-green-100 text-green-700',
  APPOINTMENT_REJECTED: 'bg-red-100 text-red-700',
  APPOINTMENT_CANCELLED: 'bg-gray-100 text-gray-700',
  APPOINTMENT_COMPLETED: 'bg-green-100 text-green-700',
  XRAY_ASSIGNED: 'bg-blue-100 text-blue-700',
  ANALYSIS_COMPLETED: 'bg-green-100 text-green-700',
  ANALYSIS_REQUIRES_REVIEW: 'bg-yellow-100 text-yellow-700',
  ANALYSIS_VALIDATED: 'bg-purple-100 text-purple-700',
  REPORT_READY: 'bg-blue-100 text-blue-700',
  REPORT_UPDATED: 'bg-blue-100 text-blue-700',
  LAB_RESULT_ADDED: 'bg-purple-100 text-purple-700',
  DOCTOR_MESSAGE: 'bg-teal-100 text-teal-700',
  ACCOUNT_VERIFIED: 'bg-green-100 text-green-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
};

export default function NotificationsPage() {
  const { success } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { items, pagination, isLoading } = usePagedQuery(
    ['notifications'],
    (p) => notificationsApi.list(p).then((r) => r.data.data!),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  };

  const readAllMutation = useApiMutation(
    () => notificationsApi.markAllRead(),
    {
      onSuccess: (res) => {
        success(t('notifications.read_count', { n: res.data.data ?? 0 }));
        invalidate();
      },
    },
  );

  const readOneMutation = useApiMutation(
    (id: number) => notificationsApi.markRead(id),
    { silentError: true, onSuccess: invalidate },
  );

  if (isLoading) return <PageSpinner />;

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            icon={<CheckCheck size={14} />}
            loading={readAllMutation.isPending}
            onClick={() => readAllMutation.mutate()}
          >
            {t('notifications.mark_all', { n: unreadCount })}
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title={t('notifications.empty')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
                onClick={() => { if (!n.read) readOneMutation.mutate(n.id); }}
              >
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 mt-0.5 ${typeColors[n.type]}`}>
                  {t('notificationType.' + n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{t('notificationType.' + n.type)}</p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {t('notificationMessage.' + n.type, localizeParams(n.params, t))}
                  </p>
                  {/* APPOINTMENT_REJECTED carries an optional `reason` from the doctor */}
                  {n.type === 'APPOINTMENT_REJECTED' && n.params?.reason && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      {t('notifications.reason_label')}: {n.params.reason}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5" title={format(new Date(n.createdAt), 'PPpp', { locale: dateLocale })}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateLocale })}
                  </p>
                </div>
                {!n.read && (
                  <Circle size={8} className="fill-blue-500 text-blue-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Pagination {...pagination} />
    </div>
  );
}

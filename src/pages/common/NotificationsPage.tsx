import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../../api/users.api';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import type { NotificationType } from '../../types';

const typeColors: Record<NotificationType, string> = {
  ANALYSIS_COMPLETED: 'bg-green-100 text-green-700',
  ANALYSIS_REQUIRES_REVIEW: 'bg-yellow-100 text-yellow-700',
  REPORT_READY: 'bg-blue-100 text-blue-700',
  REPORT_UPDATED: 'bg-blue-100 text-blue-700',
  LAB_RESULT_ADDED: 'bg-purple-100 text-purple-700',
  APPOINTMENT_REMINDER: 'bg-orange-100 text-orange-700',
  DOCTOR_MESSAGE: 'bg-teal-100 text-teal-700',
  ACCOUNT_VERIFIED: 'bg-green-100 text-green-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
};

export default function NotificationsPage() {
  const [page, setPage] = useState(0);
  const { success } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => { const r = await usersApi.getNotifications(page); return r.data.data!; },
  });

  const readAllMutation = useMutation({
    mutationFn: () => usersApi.markAllNotificationsRead(),
    onSuccess: (res) => {
      success(t('notifications.read_count', { n: res.data.data ?? 0 }));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const readOneMutation = useMutation({
    mutationFn: (id: string) => usersApi.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  if (isLoading) return <PageSpinner />;

  const unreadCount = data?.content.filter((n) => !n.read).length ?? 0;

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
        {data?.content.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium">{t('notifications.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data?.content.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-blue-50/40' : ''}`}
                onClick={() => { if (!n.read) readOneMutation.mutate(n.id); }}
              >
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 mt-0.5 ${typeColors[n.type]}`}>
                  {t('notificationType.' + n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                  <p className="text-gray-600 text-sm mt-0.5">{n.message}</p>
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

      <Pagination
        page={data?.page ?? 0}
        totalPages={data?.totalPages ?? 0}
        totalElements={data?.totalElements ?? 0}
        size={data?.size ?? 20}
        onPageChange={setPage}
      />
    </div>
  );
}

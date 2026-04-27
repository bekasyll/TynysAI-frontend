import { useState } from 'react';
import { Users, ShieldOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Badge } from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { useDateLocale } from '../../../hooks/useDateLocale';
import UserActionMenu, { type ActionKind } from './UserActionMenu';
import type { Role, UserResponse } from '../../../types';

interface Props {
  users: UserResponse[];
  pagination?: {
    page: number;
    totalPages: number;
    totalElements: number;
    size: number;
    onPageChange: (p: number) => void;
  };
  onAction: (kind: ActionKind, user: UserResponse) => void;
}

const ROLE_COLORS: Record<Role, 'blue' | 'green' | 'red'> = {
  PATIENT: 'blue', DOCTOR: 'green', ADMIN: 'red',
};

export default function UsersTable({ users, pagination, onAction }: Props) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <EmptyState
          icon={Users}
          title={t('admin.users_empty')}
          subtitle={t('admin.users_empty_sub')}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_user')}</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_role')}</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_status')}</th>
            <th className="px-6 py-3 text-left font-medium text-gray-500">{t('admin.col_registered')}</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {u.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.fullName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      {u.email}
                      {!u.emailVerified && (
                        <span className="inline-flex items-center gap-0.5 text-amber-600 text-[10px] font-medium uppercase tracking-wide">
                          <ShieldOff size={10} /> {t('admin.not_verified')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge color={ROLE_COLORS[u.role]}>{t('roles.' + u.role)}</Badge>
              </td>
              <td className="px-6 py-4">
                {u.enabled
                  ? <Badge color="green">{t('admin.active')}</Badge>
                  : <Badge color="red">{t('admin.blocked')}</Badge>}
              </td>
              <td className="px-6 py-4 text-gray-500">
                {format(new Date(u.createdAt), 'd MMM yyyy', { locale: dateLocale })}
              </td>
              <td className="px-6 py-4 text-right">
                <UserActionMenu
                  user={u}
                  open={openMenu === u.id}
                  onToggle={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                  onClose={() => setOpenMenu(null)}
                  onAction={(kind) => {
                    setOpenMenu(null);
                    onAction(kind, u);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div className="px-6 pb-4 pt-2">
          <Pagination {...pagination} />
        </div>
      )}
    </div>
  );
}

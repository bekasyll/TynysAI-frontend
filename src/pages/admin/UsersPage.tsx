import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { PageSpinner } from '../../components/ui/Spinner';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { useApiMutation } from '../../hooks/useApiMutation';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import UsersFilters from './users/UsersFilters';
import UsersTable from './users/UsersTable';
import CreateUserDialog, { type CreateRole } from './users/CreateUserDialog';
import EditWorkScheduleDialog from './users/EditWorkScheduleDialog';
import type { ActionKind } from './users/UserActionMenu';
import type { Role, UserResponse } from '../../types';

type ConfirmKind = 'delete' | 'toggle' | 'sessions' | null;

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; user: UserResponse | null }>({
    kind: null, user: null,
  });
  const [createRole, setCreateRole] = useState<CreateRole>(null);
  const [scheduleTargetUserId, setScheduleTargetUserId] = useState<string | null>(null);

  const { t } = useTranslation();
  const { success } = useToast();
  const queryClient = useQueryClient();

  const { items, pagination, isLoading } = usePagedQuery(
    ['admin-users', roleFilter],
    (p) => (roleFilter
      ? adminApi.getUsersByRole(roleFilter, p)
      : adminApi.getUsers(p)
    ).then((r) => r.data.data!),
  );

  const { data: searchData } = useQuery({
    queryKey: ['admin-users-search', search, roleFilter],
    queryFn: async () => {
      if (!search) return null;
      const r = await adminApi.searchUsers(search, roleFilter || undefined);
      return r.data.data!;
    },
    enabled: search.length > 1,
  });

  const displayed = search.length > 1 ? (searchData?.content ?? []) : items;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-users-search'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  }

  const toggleMutation = useApiMutation(
    (id: string) => adminApi.toggleUserStatus(id),
    {
      onSuccess: (res) => {
        success(res.data.data!.enabled ? t('admin.unblocked') : t('admin.blocked'));
        invalidate();
        setConfirm({ kind: null, user: null });
      },
    },
  );

  const deleteMutation = useApiMutation(
    (id: string) => adminApi.deleteUser(id),
    {
      successMessage: t('admin.user_deleted'),
      onSuccess: () => {
        invalidate();
        setConfirm({ kind: null, user: null });
      },
    },
  );

  const sessionsMutation = useApiMutation(
    (id: string) => adminApi.logoutSessions(id),
    {
      successMessage: t('admin.sessions_revoked'),
      onSuccess: () => setConfirm({ kind: null, user: null }),
    },
  );

  if (isLoading) return <PageSpinner />;

  function handleAction(kind: ActionKind, user: UserResponse) {
    if (kind === 'edit-schedule') {
      setScheduleTargetUserId(user.id);
    } else {
      setConfirm({ kind, user });
    }
  }

  return (
    <div className="space-y-4">
      <UsersFilters
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        onCreate={() => setCreateRole('PATIENT')}
      />

      <UsersTable
        users={displayed}
        pagination={search ? undefined : pagination}
        onAction={handleAction}
      />

      <ConfirmModal
        isOpen={confirm.kind === 'delete'}
        onClose={() => setConfirm({ kind: null, user: null })}
        onConfirm={() => confirm.user && deleteMutation.mutate(confirm.user.id)}
        title={t('admin.delete_title')}
        message={t('admin.delete_msg')
          + (confirm.user ? `\n\n${confirm.user.fullName} (${confirm.user.email})` : '')}
        confirmText={t('common.delete')}
        loading={deleteMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirm.kind === 'toggle'}
        onClose={() => setConfirm({ kind: null, user: null })}
        onConfirm={() => confirm.user && toggleMutation.mutate(confirm.user.id)}
        title={confirm.user?.enabled ? t('admin.block_title') : t('admin.unblock_title')}
        message={confirm.user?.enabled ? t('admin.block_msg') : t('admin.unblock_msg')}
        confirmText={confirm.user?.enabled ? t('admin.block_btn') : t('admin.unblock_btn')}
        loading={toggleMutation.isPending}
      />

      <ConfirmModal
        isOpen={confirm.kind === 'sessions'}
        onClose={() => setConfirm({ kind: null, user: null })}
        onConfirm={() => confirm.user && sessionsMutation.mutate(confirm.user.id)}
        title={t('admin.sessions_title')}
        message={t('admin.sessions_msg')}
        confirmText={t('admin.sessions_btn')}
        loading={sessionsMutation.isPending}
      />

      <CreateUserDialog
        role={createRole}
        onClose={() => setCreateRole(null)}
        onSwitchRole={(r) => setCreateRole(r)}
        onCreated={() => {
          invalidate();
          setCreateRole(null);
        }}
      />

      <EditWorkScheduleDialog
        userId={scheduleTargetUserId}
        onClose={() => setScheduleTargetUserId(null)}
      />
    </div>
  );
}

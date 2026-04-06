import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Users, Plus, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { useDateLocale } from '../../hooks/useDateLocale';
import type { CreateUserRequest, Role } from '../../types';

export default function UsersPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, roleFilter],
    queryFn: async () => {
      const r = roleFilter
        ? await adminApi.getUsersByRole(roleFilter, page)
        : await adminApi.getUsers(page);
      return r.data.data!;
    },
  });

  const { data: searchData } = useQuery({
    queryKey: ['admin-users-search', search, roleFilter],
    queryFn: async () => {
      if (!search) return null;
      const r = await adminApi.searchUsers(search, roleFilter || undefined);
      return r.data.data!;
    },
    enabled: search.length > 1,
  });

  const displayed = search.length > 1 ? searchData?.content : data?.content;

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUserStatus(id),
    onSuccess: () => { success(t('admin.status_updated')); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { success(t('admin.user_deleted')); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setDeleteId(null); },
    onError: () => error(t('common.error')),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateUserRequest>();

  const createMutation = useMutation({
    mutationFn: (d: CreateUserRequest) => adminApi.createUser(d),
    onSuccess: () => { success(t('admin.user_created')); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setShowCreate(false); reset(); },
    onError: () => error(t('common.error')),
  });

  if (isLoading) return <PageSpinner />;

  const roleColors: Record<Role, 'blue' | 'green' | 'red'> = { PATIENT: 'blue', DOCTOR: 'green', ADMIN: 'red' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="form-input pl-9 w-64" placeholder={t('admin.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-input w-40" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')}>
            <option value="">{t('admin.all_roles')}</option>
            <option value="PATIENT">{t('admin.role_patients')}</option>
            <option value="DOCTOR">{t('admin.role_doctors')}</option>
            <option value="ADMIN">{t('admin.role_admins')}</option>
          </select>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>{t('admin.create_user_btn')}</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!displayed || displayed.length === 0 ? (
          <div className="py-16 text-center"><Users size={48} className="mx-auto mb-4 text-gray-200" /><p className="text-gray-500">{t('admin.users_empty')}</p></div>
        ) : (
          <>
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
                {displayed.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.fullName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={roleColors[u.role]}>{t('roles.' + u.role)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {u.enabled
                        ? <Badge color="green">{t('admin.active')}</Badge>
                        : <Badge color="red">{t('admin.blocked')}</Badge>}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{format(new Date(u.createdAt), 'd MMM yyyy', { locale: dateLocale })}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={u.enabled ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} className="text-gray-400" />}
                          onClick={() => toggleMutation.mutate(u.id)}
                        />
                        <Button size="sm" variant="ghost" icon={<Trash2 size={14} />} className="text-red-400 hover:text-red-600" onClick={() => setDeleteId(u.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!search && (
              <div className="px-6 pb-4 pt-2">
                <Pagination
                  page={data?.page ?? 0}
                  totalPages={data?.totalPages ?? 0}
                  totalElements={data?.totalElements ?? 0}
                  size={data?.size ?? 20}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset(); }} title={t('admin.create_modal_title')}>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{t('admin.first_name')}</label>
              <input className="form-input" {...register('firstName', { required: t('common.required') })} />
              {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">{t('admin.last_name')}</label>
              <input className="form-input" {...register('lastName', { required: t('common.required') })} />
              {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">{t('admin.email')}</label>
            <input type="email" className="form-input" {...register('email', { required: t('common.required') })} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('admin.password')}</label>
            <input type="password" className="form-input"
              {...register('password', {
                required: t('common.required'),
                minLength: { value: 8, message: t('auth.password_min') },
                pattern: { value: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: t('auth.password_pattern') },
              })} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
          <div>
            <label className="form-label">{t('admin.role_label')}</label>
            <select className="form-input" {...register('role', { required: true })}>
              <option value="PATIENT">{t('roles.PATIENT')}</option>
              <option value="DOCTOR">{t('roles.DOCTOR')}</option>
              <option value="ADMIN">{t('roles.ADMIN')}</option>
            </select>
          </div>
          <div>
            <label className="form-label">{t('admin.phone')}</label>
            <input className="form-input" placeholder="+77001234567" {...register('phoneNumber')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={isSubmitting || createMutation.isPending}>{t('common.create')}</Button>
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }}>
              <X size={14} /> {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title={t('admin.delete_user_title')}
        message={t('admin.delete_user_msg')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

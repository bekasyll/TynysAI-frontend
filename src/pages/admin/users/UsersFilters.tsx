import { Search, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import type { Role } from '../../../types';

interface Props {
  search: string;
  onSearchChange: (s: string) => void;
  roleFilter: Role | '';
  onRoleChange: (r: Role | '') => void;
  onCreate: () => void;
}

export default function UsersFilters({ search, onSearchChange, roleFilter, onRoleChange, onCreate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9 w-64"
            placeholder={t('admin.search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value as Role | '')}
        >
          <option value="">{t('admin.all_roles')}</option>
          <option value="PATIENT">{t('admin.role_patients')}</option>
          <option value="DOCTOR">{t('admin.role_doctors')}</option>
          <option value="ADMIN">{t('admin.role_admins')}</option>
        </select>
      </div>
      <Button icon={<UserPlus size={16} />} onClick={onCreate}>
        {t('admin.create_user_btn')}
      </Button>
    </div>
  );
}

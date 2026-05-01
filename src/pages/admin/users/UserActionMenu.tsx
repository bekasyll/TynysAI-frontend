import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ToggleLeft, ToggleRight, Trash2,
  LogOut as LogOutIcon, MoreVertical, CalendarClock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserResponse } from '../../../types';

export type ActionKind = 'delete' | 'toggle' | 'sessions' | 'edit-schedule';

// Menu is rendered through a portal into document.body so it escapes the
// table's `overflow-hidden` wrapper. Position is recomputed from the trigger's
// bounding rect each time it opens, and flipped above the trigger when the
// menu would fall off the bottom of the viewport.
const MENU_WIDTH = 224;
const MENU_MARGIN = 8;
const MENU_MAX_HEIGHT = 280;

interface Props {
  user: UserResponse;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (kind: ActionKind) => void;
}

export default function UserActionMenu({ user, open, onToggle, onClose, onAction }: Props) {
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipUp = spaceBelow < MENU_MAX_HEIGHT && rect.top > MENU_MAX_HEIGHT;
    const top = flipUp ? rect.top - MENU_MAX_HEIGHT : rect.bottom + 4;
    const left = Math.max(MENU_MARGIN, rect.right - MENU_WIDTH);
    setPos({ top, left });
  }, [open]);

  // Close when the page scrolls - the trigger's position changes and the
  // menu would otherwise visually disconnect from it.
  useEffect(() => {
    if (!open) return;
    const handler = () => onClose();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <MoreVertical size={16} />
      </button>
      {open && pos && createPortal(
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-[60]" onClick={onClose} />
          <div
            className="fixed z-[61] bg-white rounded-xl shadow-lg border border-gray-200 py-1 text-left"
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
          >
            <MenuItem
              icon={user.enabled
                ? <ToggleLeft size={14} className="text-amber-500" />
                : <ToggleRight size={14} className="text-green-500" />}
              label={user.enabled
                ? t('admin.block_btn')
                : t('admin.unblock_btn')}
              onClick={() => onAction('toggle')}
            />
            {user.role === 'DOCTOR' && (
              <MenuItem
                icon={<CalendarClock size={14} className="text-blue-500" />}
                label={t('admin.edit_schedule_btn')}
                onClick={() => onAction('edit-schedule')}
              />
            )}
            <MenuItem
              icon={<LogOutIcon size={14} className="text-orange-500" />}
              label={t('admin.sessions_btn_short')}
              onClick={() => onAction('sessions')}
            />
            {user.role !== 'ADMIN' && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <MenuItem
                  icon={<Trash2 size={14} className="text-red-500" />}
                  label={t('admin.delete_btn')}
                  onClick={() => onAction('delete')}
                  danger
                />
              </>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors min-w-0 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate min-w-0">{label}</span>
    </button>
  );
}

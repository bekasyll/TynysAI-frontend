import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import { adminApi } from '../../../api/admin.api';
import { doctorsApi } from '../../../api/doctors.api';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { DAYS_OF_WEEK } from '../../../types';
import type { DayOfWeek, TimeRange, WorkSchedule } from '../../../types';

interface Props {
  userId: string | null;
  onClose: () => void;
}

type Mutable = Record<DayOfWeek, TimeRange[]>;

function emptySchedule(): Mutable {
  return DAYS_OF_WEEK.reduce((acc, d) => {
    acc[d] = [];
    return acc;
  }, {} as Mutable);
}

function fromBackend(ws: WorkSchedule | undefined | null): Mutable {
  const out = emptySchedule();
  if (!ws) return out;
  for (const day of DAYS_OF_WEEK) {
    out[day] = ws[day] ? ws[day]!.map((r) => ({ start: r.start, end: r.end })) : [];
  }
  return out;
}

function toBackend(state: Mutable): WorkSchedule {
  // Drop empty days so the JSONB blob is small and reads cleanly.
  const out: WorkSchedule = {};
  for (const day of DAYS_OF_WEEK) {
    if (state[day].length > 0) out[day] = state[day];
  }
  return out;
}

function validate(state: Mutable): string | null {
  for (const day of DAYS_OF_WEEK) {
    const ranges = state[day];
    if (ranges.length === 0) continue;
    for (const r of ranges) {
      if (!r.start || !r.end) return `${day}: start and end required`;
      if (r.end <= r.start) return `${day}: end must be after start`;
    }
    const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) return `${day}: intervals overlap`;
    }
  }
  return null;
}

export default function EditWorkScheduleDialog({ userId, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [state, setState] = useState<Mutable>(emptySchedule());

  const { data: doctor, isLoading } = useQuery({
    queryKey: ['admin-doctor-profile', userId],
    queryFn: async () => {
      const r = await doctorsApi.getByUserId(userId!);
      return r.data.data!;
    },
    enabled: !!userId,
  });

  // Hydrate local state from backend whenever the dialog opens with a new
  // doctor; resets edits if the admin reopens it.
  useEffect(() => {
    setState(fromBackend(doctor?.workSchedule));
  }, [doctor]);

  const mutation = useApiMutation(
    (schedule: WorkSchedule) =>
      adminApi.updateDoctorWorkSchedule(userId!, Object.keys(schedule).length > 0 ? schedule : null),
    {
      successMessage: t('admin.work_schedule_saved'),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin-doctor-profile', userId] });
        onClose();
      },
    },
  );

  function addInterval(day: DayOfWeek) {
    setState((s) => ({ ...s, [day]: [...s[day], { start: '09:00', end: '18:00' }] }));
  }

  function removeInterval(day: DayOfWeek, idx: number) {
    setState((s) => ({ ...s, [day]: s[day].filter((_, i) => i !== idx) }));
  }

  function updateInterval(day: DayOfWeek, idx: number, field: 'start' | 'end', value: string) {
    setState((s) => ({
      ...s,
      [day]: s[day].map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  }

  function handleSave() {
    const err = validate(state);
    if (err) {
      // Reuse the error toast plumbing from useApiMutation by passing through.
      // Direct alert keeps this self-contained and clear.
      alert(err);
      return;
    }
    mutation.mutate(toBackend(state));
  }

  return (
    <Modal
      isOpen={!!userId}
      onClose={onClose}
      title={t('admin.work_schedule_title')}
      size="lg"
    >
      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div className="p-6 space-y-4">
          {doctor && (
            <p className="text-sm text-gray-500">
              {doctor.fullName}{doctor.specialization ? ` · ${doctor.specialization}` : ''}
            </p>
          )}

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-medium text-sm text-gray-800 min-w-0 truncate">
                    {t(`weekday.${day}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() => addInterval(day)}
                    className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <Plus size={12} /> {t('admin.add_interval')}
                  </button>
                </div>
                {state[day].length === 0 ? (
                  <p className="text-xs text-gray-400 italic">{t('admin.no_intervals')}</p>
                ) : (
                  <div className="space-y-2">
                    {state[day].map((r, idx) => (
                      <div key={idx} className="flex items-center flex-wrap gap-2">
                        <input
                          type="time"
                          step={1800}
                          value={r.start}
                          onChange={(e) => updateInterval(day, idx, 'start', e.target.value)}
                          className="form-input !py-1.5 !px-2 text-sm w-28 shrink-0"
                        />
                        <span className="text-gray-400 shrink-0">—</span>
                        <input
                          type="time"
                          step={1800}
                          value={r.end}
                          onChange={(e) => updateInterval(day, idx, 'end', e.target.value)}
                          className="form-input !py-1.5 !px-2 text-sm w-28 shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => removeInterval(day, idx)}
                          className="ml-auto text-red-500 hover:text-red-700 p-1 shrink-0"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
            <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button loading={mutation.isPending} onClick={handleSave}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

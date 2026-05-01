import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isBefore, startOfDay, addMonths, subMonths,
} from 'date-fns';
import { appointmentsApi } from '../../api/appointments.api';
import { doctorsApi } from '../../api/doctors.api';
import { xraysApi } from '../../api/xrays.api';
import { AppointmentStatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import type {
  AppointmentRequest, AppointmentResponse, AppointmentStatus,
  TimeRange, DayOfWeek,
} from '../../types';

const FILTERS: (AppointmentStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

// JS Date.getDay(): 0=Sun..6=Sat. Map to Java DayOfWeek names.
const JS_DOW_TO_JAVA: DayOfWeek[] = [
  'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY',
];

function dayOfWeekFor(d: Date): DayOfWeek {
  return JS_DOW_TO_JAVA[d.getDay()];
}

/**
 * Generates 30-min slot starts (HH:mm) covering the given working intervals.
 * A 30-min slot is included only if a full 30 minutes fits before the
 * interval's end - so a 09:00-09:25 interval yields no slots.
 */
function generateSlots(intervals: TimeRange[]): string[] {
  const out: string[] = [];
  for (const r of intervals) {
    const [sh, sm] = r.start.split(':').map(Number);
    const [eh, em] = r.end.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + 30 <= end) {
      const h = Math.floor(cur / 60), m = cur % 60;
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      cur += 30;
    }
  }
  return out;
}

interface BookFormValues {
  doctorId: string;
  appointmentDate?: string;
  patientComplaints?: string;
  xrayAnalysisId?: string;
}

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);

  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentResponse | null>(null);

  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const status = filter === 'ALL' ? undefined : filter;

  const { items, pagination, isLoading } = usePagedQuery(
    ['patient-appointments', filter],
    (p) => appointmentsApi.listForPatient(status, p).then((r) => r.data.data!),
  );

  const { data: doctorsData } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: async () => { const r = await doctorsApi.listApproved(0, 100); return r.data.data!; },
    enabled: showForm,
  });

  const { data: analysesData } = useQuery({
    queryKey: ['patient-analyses-all'],
    queryFn: async () => { const r = await xraysApi.listForPatient(0, 50); return r.data.data!; },
    enabled: showForm,
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<BookFormValues>();
  const selectedDoctorId = watch('doctorId');
  const selectedDoctor = doctorsData?.content.find((d) => d.userId === selectedDoctorId);

  const busyDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const { data: busySlots } = useQuery({
    queryKey: ['busy-slots', selectedDoctorId, busyDate],
    queryFn: async () => {
      const r = await appointmentsApi.getBusySlots(selectedDoctorId!, busyDate!);
      return r.data.data ?? [];
    },
    enabled: !!selectedDoctorId && !!busyDate,
  });
  const busySet = new Set(busySlots ?? []);

  const dayIntervals: TimeRange[] = (selectedDoctor && selectedDate
    ? selectedDoctor.workSchedule?.[dayOfWeekFor(selectedDate)] ?? []
    : []);
  const availableSlots = generateSlots(dayIntervals);

  // Patient can't grab a slot less than 20 min from now. The same check also
  // hides past-time slots when the chosen date is today (negative diff < 20).
  // Future dates pass trivially since the diff is huge.
  const MIN_LEAD_MS = 20 * 60 * 1000;
  function isTooSoon(time: string): boolean {
    if (!selectedDate) return false;
    const [h, m] = time.split(':').map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);
    return dt.getTime() - Date.now() < MIN_LEAD_MS;
  }

  function selectDateTime(date: Date | null, time: string | null) {
    if (date && time) {
      const [h, m] = time.split(':').map(Number);
      const dt = new Date(date);
      dt.setHours(h, m, 0, 0);
      setValue('appointmentDate', format(dt, "yyyy-MM-dd'T'HH:mm:ss"));
    } else {
      setValue('appointmentDate', '');
    }
  }

  function handleDateSelect(day: Date) {
    setSelectedDate(day);
    selectDateTime(day, selectedTime);
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    selectDateTime(selectedDate, time);
  }

  function closeForm() {
    setShowForm(false);
    reset();
    setSelectedDate(null);
    setSelectedTime(null);
    setCalMonth(new Date());
  }

  const bookMutation = useApiMutation(
    (form: BookFormValues) => {
      const req: AppointmentRequest = {
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate || undefined,
        patientComplaints: form.patientComplaints || undefined,
        xrayAnalysisId: form.xrayAnalysisId ? Number(form.xrayAnalysisId) : undefined,
      };
      return appointmentsApi.book(req);
    },
    {
      successMessage: t('appointments.success'),
      errorMessage: t('appointments.book_error'),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
        closeForm();
      },
    },
  );

  const cancelMutation = useApiMutation(
    (id: number) => appointmentsApi.cancel(id),
    {
      successMessage: t('appointments.cancel_success'),
      errorMessage: t('appointments.cancel_error'),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patient-appointments'] }),
    },
  );

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekDayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calStart);
    d.setDate(d.getDate() + i);
    return format(d, 'EEEEEE', { locale: dateLocale });
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'ALL' ? t('common.all') : t(`appointmentStatus.${f}`)}
            </button>
          ))}
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowForm((v) => !v)}>
          {t('appointments.book_btn')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900 text-base">{t('appointments.book_title')}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit((d) => bookMutation.mutate(d))} className="space-y-5">
            <div>
              <label className="form-label">{t('appointments.choose_doctor')}</label>
              <select className="form-input" {...register('doctorId', { required: t('common.required') })}>
                <option value="">{t('appointments.choose_doctor')}</option>
                {doctorsData?.content.map((d) => (
                  <option key={d.userId} value={d.userId}>
                    {d.fullName}{d.specialization ? ` - ${d.specialization}` : ''}
                  </option>
                ))}
              </select>
              {errors.doctorId && <p className="form-error">{errors.doctorId.message}</p>}
            </div>

            <div>
              <label className="form-label mb-3">{t('appointments.date_label')}</label>
              <div className="flex flex-col lg:flex-row gap-4">

                <div className="bg-gray-50 rounded-xl p-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => setCalMonth(subMonths(calMonth, 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-gray-800 capitalize">
                      {format(calMonth, 'LLLL yyyy', { locale: dateLocale })}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalMonth(addMonths(calMonth, 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {weekDayLabels.map((d, i) => (
                      <div key={i} className="text-center text-xs font-medium text-gray-400 py-1 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((day) => {
                      const isCurrentMonth = day.getMonth() === calMonth.getMonth();
                      const isPast = isBefore(day, today);
                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                      const isToday = isSameDay(day, today);

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          disabled={isPast || !isCurrentMonth}
                          onClick={() => handleDateSelect(day)}
                          className={`
                            w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm transition-all
                            ${isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : isToday && !isSelected
                              ? 'bg-blue-100 text-blue-700 font-semibold'
                              : !isCurrentMonth || isPast
                              ? 'text-gray-300 cursor-default'
                              : 'text-gray-700 hover:bg-white hover:shadow-sm cursor-pointer'
                            }
                          `}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {selectedDate
                        ? format(selectedDate, 'd MMMM', { locale: dateLocale })
                        : t('appointments.pick_date_first')}
                    </span>
                  </div>
                  {!selectedDoctorId ? (
                    <div className="text-sm text-gray-400 italic py-3">
                      {t('appointments.pick_doctor_first')}
                    </div>
                  ) : !selectedDate ? (
                    <div className="text-sm text-gray-400 italic py-3">
                      {t('appointments.pick_date_first')}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-amber-600 py-3">
                      {t('appointments.no_schedule_for_day')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => {
                        const isBusy = busySet.has(time);
                        const tooSoon = isTooSoon(time);
                        const disabled = isBusy || tooSoon;
                        const tooltip = isBusy
                          ? t('appointments.slot_booked')
                          : tooSoon
                            ? t('appointments.slot_too_soon')
                            : undefined;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && handleTimeSelect(time)}
                            title={tooltip}
                            className={`
                              py-2 px-3 rounded-lg text-sm font-medium border transition-all
                              ${disabled
                                ? 'bg-gray-100 border-gray-200 text-gray-400 line-through cursor-not-allowed'
                                : selectedTime === time
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <CalendarDays size={14} />
                  {format(selectedDate, 'dd/MM/yyyy', { locale: dateLocale })} · {selectedTime}
                </div>
              )}

              <input type="hidden" {...register('appointmentDate')} />
            </div>

            <div>
              <label className="form-label">{t('appointments.complaints_label')}</label>
              <textarea
                className="form-input resize-none"
                rows={3}
                placeholder={t('appointments.complaints_placeholder')}
                {...register('patientComplaints')}
              />
            </div>

            <div>
              <label className="form-label">{t('appointments.link_analysis')}</label>
              <select className="form-input" {...register('xrayAnalysisId')}>
                <option value="">{t('appointments.no_analysis')}</option>
                {analysesData?.content
                  .filter((a) => a.aiPrimaryDiagnosis)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.aiPrimaryDiagnosisDisplayName ?? a.aiPrimaryDiagnosis}
                      {a.aiConfidence != null ? ` (${Math.round(a.aiConfidence * 100)}%)` : ''}
                      {' · '}
                      {format(new Date(a.uploadedAt), 'dd/MM/yyyy', { locale: dateLocale })}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" loading={isSubmitting || bookMutation.isPending}>
                {t('appointments.submit_btn')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? <PageSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t('appointments.empty')}
              subtitle={t('appointments.empty_desc')}
            />
          ) : (
            <>
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_doctor')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[170px]">{t('appointments.col_date')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_complaints')}</th>
                    <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('appointments.col_status')}</th>
                    <th className="px-2 sm:px-6 py-3 w-[44px] sm:w-[120px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedAppt(a)}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <p className="font-medium text-gray-900 break-words">{a.doctorName ?? '-'}</p>
                        {a.doctorSpecialization && <p className="text-xs text-gray-400 break-words">{a.doctorSpecialization}</p>}
                        <p className="md:hidden text-xs text-gray-500 mt-0.5 break-words">
                          {a.appointmentDate
                            ? format(new Date(a.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })
                            : '-'}
                        </p>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-gray-600 break-words">
                        {a.appointmentDate
                          ? format(new Date(a.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })
                          : '-'}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-gray-600 break-words">{a.patientComplaints ?? '-'}</td>
                      <td className="px-2 sm:px-6 py-4">
                        <AppointmentStatusBadge status={a.status} />
                        {a.doctorNotes && (
                          <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-1 max-w-[200px] hidden sm:block">
                            {a.doctorNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-2 sm:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {a.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              loading={cancelMutation.isPending}
                              onClick={() => cancelMutation.mutate(a.id)}
                            >
                              <span className="hidden sm:inline">{t('appointments.cancel_btn')}</span>
                              <X size={14} className="sm:hidden" />
                            </Button>
                          )}
                          <ChevronRight size={16} className="text-gray-400 sm:hidden" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 pb-4 pt-2">
                <Pagination {...pagination} />
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title={selectedAppt?.doctorName ?? '-'}
        size="md"
      >
        {selectedAppt && (
          <div className="p-5 space-y-3 text-sm">
            {selectedAppt.doctorSpecialization && (
              <p className="text-xs text-gray-400 -mt-2">{selectedAppt.doctorSpecialization}</p>
            )}
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide pt-0.5 shrink-0">{t('appointments.col_status')}</span>
              <AppointmentStatusBadge status={selectedAppt.status} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide pt-0.5 shrink-0">{t('appointments.col_date')}</span>
              <span className="text-sm text-gray-900 text-right break-words min-w-0">
                {selectedAppt.appointmentDate
                  ? format(new Date(selectedAppt.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })
                  : '-'}
              </span>
            </div>
            {selectedAppt.patientComplaints && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('appointments.col_complaints')}</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">{selectedAppt.patientComplaints}</p>
              </div>
            )}
            {selectedAppt.doctorNotes && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('appointments.doctor_notes') ?? 'Doctor notes'}</p>
                <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3 whitespace-pre-wrap break-words">{selectedAppt.doctorNotes}</p>
              </div>
            )}
            {selectedAppt.status === 'PENDING' && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  loading={cancelMutation.isPending}
                  onClick={() => {
                    cancelMutation.mutate(selectedAppt.id);
                    setSelectedAppt(null);
                  }}
                >
                  {t('appointments.cancel_btn')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

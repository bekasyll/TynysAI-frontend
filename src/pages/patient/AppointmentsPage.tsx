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
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import { useApiMutation } from '../../hooks/useApiMutation';
import type { AppointmentRequest, AppointmentStatus } from '../../types';

const FILTERS: (AppointmentStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => {
  const h = Math.floor(i / 2) + 9;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

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

  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const status = filter === 'ALL' ? undefined : filter;

  const { items, pagination, isLoading, setPage } = usePagedQuery(
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

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<BookFormValues>();

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
              onClick={() => { setFilter(f); setPage(0); }}
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
                  <div className={`grid grid-cols-3 gap-2 ${!selectedDate ? 'opacity-40 pointer-events-none' : ''}`}>
                    {TIME_SLOTS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => handleTimeSelect(time)}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium border transition-all
                          ${selectedTime === time
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedDate && selectedTime && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  <CalendarDays size={14} />
                  {format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })} · {selectedTime}
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
                      {format(new Date(a.uploadedAt), 'd MMM yyyy', { locale: dateLocale })}
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
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_doctor')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_date')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_complaints')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('appointments.col_status')}</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{a.doctorName ?? '-'}</p>
                        {a.doctorSpecialization && <p className="text-xs text-gray-400">{a.doctorSpecialization}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {a.appointmentDate
                          ? format(new Date(a.appointmentDate), 'd MMM yyyy, HH:mm', { locale: dateLocale })
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{a.patientComplaints ?? '-'}</td>
                      <td className="px-6 py-4">
                        <AppointmentStatusBadge status={a.status} />
                        {a.doctorNotes && (
                          <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-2 py-1 max-w-[200px]">
                            {a.doctorNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {a.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(a.id)}
                          >
                            {t('appointments.cancel_btn')}
                          </Button>
                        )}
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
    </div>
  );
}

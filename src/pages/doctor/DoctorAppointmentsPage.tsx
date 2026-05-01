import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { appointmentsApi } from '../../api/appointments.api';
import { AppointmentStatusBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useDateLocale } from '../../hooks/useDateLocale';
import { usePagedQuery } from '../../hooks/usePagedQuery';
import type { AppointmentStatus } from '../../types';

const FILTERS: (AppointmentStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('PENDING');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const status = filter === 'ALL' ? undefined : filter;

  const { items, pagination, isLoading } = usePagedQuery(
    ['doctor-appointments', filter],
    (p) => appointmentsApi.listForDoctor(status, p).then((r) => r.data.data!),
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
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

      {isLoading ? <PageSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title={t('doctor_appointments.empty')}
              subtitle={t('doctor_appointments.empty_desc')}
            />
          ) : (
            <>
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_patient')}</th>
                    <th className="hidden md:table-cell px-6 py-3 text-left font-medium text-gray-500 w-[170px]">{t('doctor_appointments.col_date')}</th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_complaints')}</th>
                    <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 w-[100px] sm:w-[130px]">{t('doctor_appointments.col_status')}</th>
                    <th className="px-2 sm:px-6 py-3 w-[36px] sm:w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((appt) => (
                    <tr
                      key={appt.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div className="font-medium text-gray-900 break-words">{appt.patientName ?? '-'}</div>
                        <div className="md:hidden text-xs text-gray-500 mt-0.5 break-words">
                          {appt.appointmentDate
                            ? format(new Date(appt.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })
                            : '-'}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 text-gray-600 break-words">
                        {appt.appointmentDate
                          ? format(new Date(appt.appointmentDate), 'dd/MM/yyyy, HH:mm', { locale: dateLocale })
                          : '-'}
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-gray-600 break-words">{appt.patientComplaints ?? '-'}</td>
                      <td className="px-2 sm:px-6 py-4"><AppointmentStatusBadge status={appt.status} /></td>
                      <td className="px-2 sm:px-6 py-4 text-gray-400">
                        <ChevronRight size={16} />
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

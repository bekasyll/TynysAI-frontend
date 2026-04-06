import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { doctorsApi } from '../../api/doctors.api';
import { AppointmentStatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import { useDateLocale } from '../../hooks/useDateLocale';
import type { AppointmentStatus } from '../../types';

const FILTERS: (AppointmentStatus | 'ALL')[] = ['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED'];

export default function DoctorAppointmentsPage() {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('PENDING');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const status = filter === 'ALL' ? undefined : filter;

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments', filter, page],
    queryFn: async () => { const r = await doctorsApi.getMyAppointments(status, page); return r.data.data!; },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
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

      {isLoading ? <PageSpinner /> : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {data?.content.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500 font-medium">{t('doctor_appointments.empty')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('doctor_appointments.empty_desc')}</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_patient')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_date')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_complaints')}</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500">{t('doctor_appointments.col_status')}</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.content.map((appt) => (
                    <tr
                      key={appt.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/doctor/appointments/${appt.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{appt.patientName ?? '—'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {appt.appointmentDate
                          ? format(new Date(appt.appointmentDate), 'd MMM yyyy, HH:mm', { locale: dateLocale })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-[200px] truncate">{appt.patientComplaints ?? '—'}</td>
                      <td className="px-6 py-4"><AppointmentStatusBadge status={appt.status} /></td>
                      <td className="px-6 py-4 text-gray-400">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 pb-4 pt-2">
                <Pagination
                  page={data?.page ?? 0}
                  totalPages={data?.totalPages ?? 0}
                  totalElements={data?.totalElements ?? 0}
                  size={data?.size ?? 20}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

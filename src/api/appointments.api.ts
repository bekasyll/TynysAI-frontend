import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  AppointmentResponse, AppointmentRequest, AppointmentDecisionRequest,
  AppointmentStatus,
} from '../types';

function buildList(role: 'patient' | 'doctor', status?: AppointmentStatus, page = 0, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set('status', status);
  return `/appointments/${role}?${params}`;
}

/** appointment-service: /api/appointments */
export const appointmentsApi = {
  // Lists
  listForPatient: (status?: AppointmentStatus, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>(
      buildList('patient', status, page, size)
    ),

  listForDoctor: (status?: AppointmentStatus, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>(
      buildList('doctor', status, page, size)
    ),

  // Get one
  getForPatient: (id: number | string) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/appointments/patient/${id}`),

  getForDoctor: (id: number | string) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/appointments/doctor/${id}`),

  // Mutations
  book: (data: AppointmentRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', data),

  accept: (id: number | string, data?: AppointmentDecisionRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/accept`, data ?? {}),

  reject: (id: number | string, data?: AppointmentDecisionRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/reject`, data ?? {}),

  cancel: (id: number | string) =>
    apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/cancel`),

  complete: (id: number | string, reportId?: number | string) => {
    const qs = reportId != null ? `?reportId=${reportId}` : '';
    return apiClient.post<ApiResponse<AppointmentResponse>>(`/appointments/${id}/complete${qs}`);
  },

  /**
   * Returns booked 30-min slot starts ("HH:mm") for the doctor on the given
   * date. Used to disable already-taken time buttons in the booking UI.
   */
  getBusySlots: (doctorId: string, date: string) =>
    apiClient.get<ApiResponse<string[]>>(
      `/appointments/doctor/${doctorId}/busy?date=${encodeURIComponent(date)}`
    ),
};

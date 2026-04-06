import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  PatientProfileResponse, UpdatePatientProfileRequest,
  XrayAnalysisResponse, ImageType,
  LabResultResponse, DiagnosticReportResponse,
  DoctorProfileResponse,
  AppointmentResponse, AppointmentRequest, AppointmentStatus,
} from '../types';

export const patientsApi = {
  getMyProfile: () =>
    apiClient.get<ApiResponse<PatientProfileResponse>>('/patients/me/profile'),

  updateMyProfile: (data: UpdatePatientProfileRequest) =>
    apiClient.put<ApiResponse<PatientProfileResponse>>('/patients/me/profile', data),

  uploadAnalysis: (file: File, imageType: ImageType = 'XRAY_CHEST', notes?: string, doctorId?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('imageType', imageType);
    if (notes) form.append('notes', notes);
    const params = new URLSearchParams({ doctorId: doctorId! });
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>(`/patients/me/analyses?${params}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getAvailableDoctors: (page = 0, size = 50) =>
    apiClient.get<ApiResponse<PageResponse<DoctorProfileResponse>>>(
      `/patients/doctors?page=${page}&size=${size}`
    ),

  getMyAnalyses: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/patients/me/analyses?page=${page}&size=${size}`
    ),

  getAnalysis: (analysisId: string) =>
    apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/patients/me/analyses/${analysisId}`),

  deleteAnalysis: (analysisId: string) =>
    apiClient.delete<ApiResponse<void>>(`/patients/me/analyses/${analysisId}`),

  getMyLabResults: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<LabResultResponse>>>(
      `/patients/me/lab-results?page=${page}&size=${size}`
    ),

  getLabResult: (labResultId: string) =>
    apiClient.get<ApiResponse<LabResultResponse>>(`/patients/me/lab-results/${labResultId}`),

  getMyReports: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/patients/me/reports?page=${page}&size=${size}`
    ),

  getReport: (reportId: string) =>
    apiClient.get<ApiResponse<DiagnosticReportResponse>>(`/patients/me/reports/${reportId}`),

  bookAppointment: (data: AppointmentRequest) =>
    apiClient.post<ApiResponse<AppointmentResponse>>('/patients/me/appointments', data),

  getMyAppointments: (status?: AppointmentStatus, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>(`/patients/me/appointments?${params}`);
  },

  getAppointment: (appointmentId: string) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/patients/me/appointments/${appointmentId}`),

  cancelAppointment: (appointmentId: string) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(`/patients/me/appointments/${appointmentId}/cancel`),
};

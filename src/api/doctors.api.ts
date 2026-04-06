import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  DoctorProfileResponse, UpdateDoctorProfileRequest,
  PatientProfileResponse,
  XrayAnalysisResponse, DoctorValidationRequest, ImageType,
  LabResultResponse, LabResultRequest,
  DiagnosticReportResponse, DiagnosticReportRequest,
  AppointmentResponse, AppointmentDecisionRequest, AppointmentStatus,
} from '../types';

export const doctorsApi = {
  getMyProfile: () =>
    apiClient.get<ApiResponse<DoctorProfileResponse>>('/doctors/me/profile'),

  updateMyProfile: (data: UpdateDoctorProfileRequest) =>
    apiClient.put<ApiResponse<DoctorProfileResponse>>('/doctors/me/profile', data),

  getPatients: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<PatientProfileResponse>>>(
      `/doctors/patients?page=${page}&size=${size}`
    ),

  getPatient: (patientId: string) =>
    apiClient.get<ApiResponse<PatientProfileResponse>>(`/doctors/patients/${patientId}`),

  getPatientAnalyses: (patientId: string, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/doctors/patients/${patientId}/analyses?page=${page}&size=${size}`
    ),

  getMyAssignedAnalyses: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/doctors/me/analyses?page=${page}&size=${size}`
    ),

  getMyAssignedAnalysis: (analysisId: string) =>
    apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/doctors/me/analyses/${analysisId}`),

  getAnalysis: (analysisId: string) =>
    apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/doctors/analyses/${analysisId}`),

  validateAnalysis: (analysisId: string, data: DoctorValidationRequest) =>
    apiClient.patch<ApiResponse<XrayAnalysisResponse>>(
      `/doctors/analyses/${analysisId}/validate`, data
    ),

  addLabResult: (data: LabResultRequest) =>
    apiClient.post<ApiResponse<LabResultResponse>>('/doctors/lab-results', data),

  getPatientLabResults: (patientId: string, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<LabResultResponse>>>(
      `/doctors/patients/${patientId}/lab-results?page=${page}&size=${size}`
    ),

  getLabResult: (labResultId: string) =>
    apiClient.get<ApiResponse<LabResultResponse>>(`/doctors/lab-results/${labResultId}`),

  createReport: (data: DiagnosticReportRequest) =>
    apiClient.post<ApiResponse<DiagnosticReportResponse>>('/doctors/reports', data),

  getMyReports: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/doctors/me/reports?page=${page}&size=${size}`
    ),

  getPatientReports: (patientId: string, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/doctors/patients/${patientId}/reports?page=${page}&size=${size}`
    ),

  getReport: (reportId: string) =>
    apiClient.get<ApiResponse<DiagnosticReportResponse>>(`/doctors/reports/${reportId}`),

  sendReport: (reportId: string) =>
    apiClient.patch<ApiResponse<DiagnosticReportResponse>>(`/doctors/reports/${reportId}/send`),

  getMyAppointments: (status?: AppointmentStatus, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set('status', status);
    return apiClient.get<ApiResponse<PageResponse<AppointmentResponse>>>(`/doctors/me/appointments?${params}`);
  },

  getAppointment: (appointmentId: string) =>
    apiClient.get<ApiResponse<AppointmentResponse>>(`/doctors/me/appointments/${appointmentId}`),

  acceptAppointment: (appointmentId: string, data?: AppointmentDecisionRequest) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(`/doctors/me/appointments/${appointmentId}/accept`, data ?? {}),

  rejectAppointment: (appointmentId: string, data?: AppointmentDecisionRequest) =>
    apiClient.patch<ApiResponse<AppointmentResponse>>(`/doctors/me/appointments/${appointmentId}/reject`, data ?? {}),

  uploadPatientAnalysis: (patientId: string, file: File, imageType: ImageType = 'XRAY_CHEST', notes?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('imageType', imageType);
    if (notes) form.append('notes', notes);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>(`/doctors/patients/${patientId}/analyses`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadSelfAnalysis: (file: File, imageType: ImageType = 'XRAY_CHEST', notes?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('imageType', imageType);
    if (notes) form.append('notes', notes);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>('/doctors/me/analyses', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

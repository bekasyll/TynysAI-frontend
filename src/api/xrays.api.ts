import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  XrayAnalysisResponse, DoctorValidationRequest,
} from '../types';

/** xray-service: /api/xrays */
export const xraysApi = {
  // Lists
  listForPatient: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/patient?page=${page}&size=${size}`
    ),

  listAssignedToDoctor: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/doctor/assigned?page=${page}&size=${size}`
    ),

  listAll: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/admin/all?page=${page}&size=${size}`
    ),

  // Get one
  getOne: (id: number | string, patientId?: string) => {
    const qs = patientId ? `?patientId=${patientId}` : '';
    return apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/xrays/${id}${qs}`);
  },

  getDoctorOne: (id: number | string) =>
    apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/xrays/doctor/${id}`),

  // Upload
  patientUpload: (file: File, patientNotes?: string, assignedDoctorId?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (patientNotes) form.append('patientNotes', patientNotes);
    if (assignedDoctorId) form.append('assignedDoctorId', assignedDoctorId);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>('/xrays/patient/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  doctorUpload: (file: File, notes?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (notes) form.append('notes', notes);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>('/xrays/doctor/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Validate (doctor)
  validate: (id: number | string, data: DoctorValidationRequest) =>
    apiClient.post<ApiResponse<XrayAnalysisResponse>>(`/xrays/${id}/validate`, data),

  // Delete (patient)
  remove: (id: number | string) =>
    apiClient.delete<ApiResponse<void>>(`/xrays/${id}`),
};

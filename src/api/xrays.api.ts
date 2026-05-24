import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  XrayAnalysisResponse, DoctorValidationRequest,
  GradcamRequest, GradcamResponse,
  AnalysisStatus, DiseaseType,
} from '../types';

/** Server-side filters for xray list endpoints. All fields optional. */
export interface XrayFilters {
  status?: AnalysisStatus;
  diagnosis?: DiseaseType;
  /** ISO datetime, inclusive lower bound on uploadedAt */
  from?: string;
  /** ISO datetime, exclusive upper bound on uploadedAt */
  to?: string;
  /** Free-text search on findings/notes/file name */
  q?: string;
}

function buildQs(page: number, size: number, f?: XrayFilters): string {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (f?.status) p.set('status', f.status);
  if (f?.diagnosis) p.set('diagnosis', f.diagnosis);
  if (f?.from) p.set('from', f.from);
  if (f?.to) p.set('to', f.to);
  if (f?.q) p.set('q', f.q);
  return p.toString();
}

/** xray-service: /api/xrays */
export const xraysApi = {
  // Lists
  listForPatient: (page = 0, size = 10, filters?: XrayFilters) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/patient?${buildQs(page, size, filters)}`
    ),

  listAssignedToDoctor: (page = 0, size = 10, filters?: XrayFilters) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/doctor/assigned?${buildQs(page, size, filters)}`
    ),

  listAll: (page = 0, size = 10, filters?: XrayFilters) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/admin/all?${buildQs(page, size, filters)}`
    ),

  /** Doctor/admin variant - all xrays of a specific patient. */
  listByPatientId: (patientId: string, page = 0, size = 10, filters?: XrayFilters) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/xrays/by-patient/${patientId}?${buildQs(page, size, filters)}`
    ),

  // Get one
  getOne: (id: number | string, patientId?: string) => {
    const qs = patientId ? `?patientId=${patientId}` : '';
    return apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/xrays/${id}${qs}`);
  },

  getDoctorOne: (id: number | string) =>
    apiClient.get<ApiResponse<XrayAnalysisResponse>>(`/xrays/doctor/${id}`),

  getImageUrl: (id: number | string) => `/api/xrays/${id}/image`,

  // Upload
  patientUpload: (file: File, patientNotes?: string, assignedDoctorId?: string, lang?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (patientNotes) form.append('patientNotes', patientNotes);
    if (assignedDoctorId) form.append('assignedDoctorId', assignedDoctorId);
    if (lang) form.append('lang', lang);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>('/xrays/patient/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  doctorUpload: (file: File, notes?: string, lang?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (notes) form.append('notes', notes);
    if (lang) form.append('lang', lang);
    return apiClient.post<ApiResponse<XrayAnalysisResponse>>('/xrays/doctor/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Validate (doctor)
  validate: (id: number | string, data: DoctorValidationRequest) =>
    apiClient.post<ApiResponse<XrayAnalysisResponse>>(`/xrays/${id}/validate`, data),

  // Grad-CAM heatmap
  getGradcam: (id: number | string, data: GradcamRequest) =>
    apiClient.post<ApiResponse<GradcamResponse>>(`/xrays/${id}/gradcam`, data),

  // Delete (patient)
  remove: (id: number | string) =>
    apiClient.delete<ApiResponse<void>>(`/xrays/${id}`),
};

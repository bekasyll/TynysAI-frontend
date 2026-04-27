import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  PatientProfileResponse, UpdatePatientProfileRequest,
} from '../types';

/**
 * user-service: /api/patients
 *
 * Only owns the patient profile. Analyses, lab results, reports and
 * appointments live in their own services - see xrays.api / medical-records.api /
 * appointments.api.
 */
export const patientsApi = {
  getMe: () =>
    apiClient.get<ApiResponse<PatientProfileResponse>>('/patients/me'),

  getByUserId: (userId: string) =>
    apiClient.get<ApiResponse<PatientProfileResponse>>(`/patients/${userId}`),

  list: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<PatientProfileResponse>>>(
      `/patients?page=${page}&size=${size}`
    ),

  updateMe: (data: UpdatePatientProfileRequest) =>
    apiClient.put<ApiResponse<PatientProfileResponse>>('/patients/me', data),
};

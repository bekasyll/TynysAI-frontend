import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  DoctorProfileResponse, UpdateDoctorProfileRequest,
} from '../types';

/**
 * user-service: /api/doctors
 *
 * Only owns the doctor profile + the public approved-doctors directory.
 * Analyses, lab results, reports and appointments live in their own services.
 */
export const doctorsApi = {
  getMe: () =>
    apiClient.get<ApiResponse<DoctorProfileResponse>>('/doctors/me'),

  getByUserId: (userId: string) =>
    apiClient.get<ApiResponse<DoctorProfileResponse>>(`/doctors/${userId}`),

  listApproved: (page = 0, size = 50) =>
    apiClient.get<ApiResponse<PageResponse<DoctorProfileResponse>>>(
      `/doctors/approved?page=${page}&size=${size}`
    ),

  updateMe: (data: UpdateDoctorProfileRequest) =>
    apiClient.put<ApiResponse<DoctorProfileResponse>>('/doctors/me', data),
};

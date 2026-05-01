import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  AdminStatsResponse, UserResponse,
  DoctorProfileResponse, Role, WorkSchedule,
} from '../types';
import type {
  RegisterDoctorRequest,
  RegisterPatientRequest,
  RegisterResponse,
} from './auth.api';

/**
 * user-service: /api/admin
 *
 * Cross-service admin views (analyses, reports) live on the respective
 * services and are exposed via xraysApi.listAll / reportsApi.listAll.
 */
export const adminApi = {
  getStats: () =>
    apiClient.get<ApiResponse<AdminStatsResponse>>('/admin/stats'),

  getUsers: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users?page=${page}&size=${size}`
    ),

  getUsersByRole: (role: Role, page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users/by-role?role=${role}&page=${page}&size=${size}`
    ),

  searchUsers: (query: string, role?: Role, page = 0, size = 10) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    if (role) params.set('role', role);
    return apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users/search?${params}`
    );
  },

  // ----- user creation (admin-initiated) -----
  createPatient: (data: RegisterPatientRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/admin/users/patient', data),

  createDoctor: (data: RegisterDoctorRequest) =>
    apiClient.post<ApiResponse<RegisterResponse>>('/admin/users/doctor', data),

  // ----- user-state mutations -----
  toggleUserStatus: (userId: string) =>
    apiClient.patch<ApiResponse<UserResponse>>(`/admin/users/${userId}/toggle-status`),

  deleteUser: (userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/users/${userId}`),

  logoutSessions: (userId: string) =>
    apiClient.post<ApiResponse<void>>(`/admin/users/${userId}/logout-sessions`),

  // ----- doctor approvals -----
  getPendingDoctors: (page = 0, size = 10, q?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    return apiClient.get<ApiResponse<PageResponse<DoctorProfileResponse>>>(
      `/admin/doctors/pending?${params}`
    );
  },

  approveDoctor: (doctorId: number | string) =>
    apiClient.patch<ApiResponse<DoctorProfileResponse>>(`/admin/doctors/${doctorId}/approve`),

  rejectDoctor: (doctorId: number | string) =>
    apiClient.patch<ApiResponse<void>>(`/admin/doctors/${doctorId}/reject`),

  updateDoctorWorkSchedule: (doctorUserId: string, workSchedule: WorkSchedule | null) =>
    apiClient.put<ApiResponse<DoctorProfileResponse>>(
      `/admin/doctors/${doctorUserId}/work-schedule`,
      { workSchedule },
    ),
};

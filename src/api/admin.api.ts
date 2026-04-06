import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  AdminStatsResponse, UserResponse, CreateUserRequest,
  DoctorProfileResponse, XrayAnalysisResponse, DiagnosticReportResponse,
  Role,
} from '../types';

export const adminApi = {
  getStats: () =>
    apiClient.get<ApiResponse<AdminStatsResponse>>('/admin/stats'),

  getUsers: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users?page=${page}&size=${size}`
    ),

  getUsersByRole: (role: Role, page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users/by-role?role=${role}&page=${page}&size=${size}`
    ),

  searchUsers: (query: string, role?: Role, page = 0, size = 20) => {
    const params = new URLSearchParams({ query, page: String(page), size: String(size) });
    if (role) params.set('role', role);
    return apiClient.get<ApiResponse<PageResponse<UserResponse>>>(
      `/admin/users/search?${params}`
    );
  },

  createUser: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<UserResponse>>('/admin/users', data),

  toggleUserStatus: (userId: string) =>
    apiClient.patch<ApiResponse<UserResponse>>(`/admin/users/${userId}/toggle-status`),

  deleteUser: (userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/admin/users/${userId}`),

  getPendingDoctors: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<DoctorProfileResponse>>>(
      `/admin/doctors/pending?page=${page}&size=${size}`
    ),

  approveDoctor: (doctorId: string) =>
    apiClient.patch<ApiResponse<DoctorProfileResponse>>(`/admin/doctors/${doctorId}/approve`),

  rejectDoctor: (doctorId: string) =>
    apiClient.patch<ApiResponse<DoctorProfileResponse>>(`/admin/doctors/${doctorId}/reject`),

  getAllAnalyses: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<XrayAnalysisResponse>>>(
      `/admin/analyses?page=${page}&size=${size}`
    ),

  getAllReports: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/admin/reports?page=${page}&size=${size}`
    ),
};

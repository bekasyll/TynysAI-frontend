import apiClient from './client';
import type { ApiResponse, UserResponse, UpdateUserRequest } from '../types';

/**
 * User-service: /api/users
 *
 * Auto-provisions the user from Keycloak claims on the first call to /me.
 * Password changes and account creation/deletion are handled in Keycloak;
 * those endpoints don't exist in the microservice backend.
 */
export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<UserResponse>>('/users/me'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<UserResponse>>(`/users/${id}`),

  getByEmail: (email: string) =>
    apiClient.get<ApiResponse<UserResponse>>(`/users?email=${encodeURIComponent(email)}`),

  updateMe: (data: UpdateUserRequest) =>
    apiClient.put<ApiResponse<UserResponse>>('/users/me', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<ApiResponse<void>>('/users/me/password', { currentPassword, newPassword }),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<UserResponse>>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    apiClient.delete<ApiResponse<void>>('/users/me/avatar'),

  /** Returns the relative URL to fetch the avatar binary. */
  getAvatarUrl: (userId: string) => `/api/users/${userId}/avatar`,
};

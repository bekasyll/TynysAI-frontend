import apiClient from './client';
import type {
  ApiResponse, PageResponse, UserResponse,
  UpdateUserRequest, ChangePasswordRequest, NotificationResponse,
} from '../types';

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<UserResponse>>('/users/me'),

  updateMe: (data: UpdateUserRequest) =>
    apiClient.put<ApiResponse<UserResponse>>('/users/me', data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<void>>('/users/me/password', data),

  getNotifications: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/users/me/notifications?page=${page}&size=${size}`
    ),

  getUnreadNotifications: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/users/me/notifications/unread?page=${page}&size=${size}`
    ),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<number>>('/users/me/notifications/unread/count'),

  markNotificationRead: (notificationId: string) =>
    apiClient.patch<ApiResponse<void>>(`/users/me/notifications/${notificationId}/read`),

  markAllNotificationsRead: () =>
    apiClient.patch<ApiResponse<number>>('/users/me/notifications/read-all'),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<ApiResponse<UserResponse>>('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    apiClient.delete<ApiResponse<void>>('/users/me/avatar'),

  getAvatarUrl: (userId: string) => `/api/users/${userId}/avatar`,
};

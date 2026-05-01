import apiClient from './client';
import type { ApiResponse, PageResponse, NotificationResponse } from '../types';

/** notification-service: /api/notifications */
export const notificationsApi = {
  list: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/notifications?page=${page}&size=${size}`
    ),

  unread: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<NotificationResponse>>>(
      `/notifications/unread?page=${page}&size=${size}`
    ),

  unreadCount: () =>
    apiClient.get<ApiResponse<number>>('/notifications/unread/count'),

  markRead: (id: number | string) =>
    apiClient.post<ApiResponse<void>>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.post<ApiResponse<number>>('/notifications/read-all'),

  deleteAll: () =>
    apiClient.delete<ApiResponse<void>>('/notifications'),
};

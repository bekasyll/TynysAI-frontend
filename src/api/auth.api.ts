import apiClient from './client';
import type { AuthResponse, LoginRequest, RegisterRequest, ApiResponse } from '../types';

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),
};

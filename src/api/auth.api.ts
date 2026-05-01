import axios from 'axios';
import type { ApiResponse, Role } from '../types';

/**
 * Public self-registration. Patients can sign up themselves; doctors are
 * created exclusively by an administrator (see {@code adminApi.createDoctor}).
 *
 * Uses a bare axios instance - no Keycloak token to attach yet, and we don't
 * want the request interceptor to redirect anonymous users into the login flow.
 */
const anonClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface RegisterPatientRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface RegisterDoctorRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  password: string;
  phoneNumber?: string;
  specialization: string;
  licenseNumber: string;
  hospitalName?: string;
  department?: string;
  yearsOfExperience?: number;
  bio?: string;
  education?: string;
  workSchedule?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  role: Role;
  approved: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export const authApi = {
  registerPatient: (data: RegisterPatientRequest) =>
    anonClient.post<ApiResponse<RegisterResponse>>('/auth/register/patient', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    anonClient.post<ApiResponse<void>>('/auth/forgot-password', data),
};

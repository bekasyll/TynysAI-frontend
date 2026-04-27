import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  DiagnosticReportResponse, DiagnosticReportRequest,
  LabResultResponse, LabResultRequest,
} from '../types';

/** medical-record-service: /api/reports */
export const reportsApi = {
  // GET one
  getById: (id: number | string) =>
    apiClient.get<ApiResponse<DiagnosticReportResponse>>(`/reports/${id}`),

  getForPatient: (id: number | string) =>
    apiClient.get<ApiResponse<DiagnosticReportResponse>>(`/reports/patient/${id}`),

  getForDoctor: (id: number | string) =>
    apiClient.get<ApiResponse<DiagnosticReportResponse>>(`/reports/doctor/${id}`),

  // Lists
  listForPatient: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/patient?page=${page}&size=${size}`
    ),

  listForDoctor: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/doctor?page=${page}&size=${size}`
    ),

  listAll: (page = 0, size = 20) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/admin/all?page=${page}&size=${size}`
    ),

  // Mutations
  create: (data: DiagnosticReportRequest) =>
    apiClient.post<ApiResponse<DiagnosticReportResponse>>('/reports', data),

  send: (id: number | string) =>
    apiClient.post<ApiResponse<DiagnosticReportResponse>>(`/reports/${id}/send`),
};

/** medical-record-service: /api/lab-results */
export const labResultsApi = {
  getById: (id: number | string) =>
    apiClient.get<ApiResponse<LabResultResponse>>(`/lab-results/${id}`),

  getForPatient: (id: number | string) =>
    apiClient.get<ApiResponse<LabResultResponse>>(`/lab-results/patient/${id}`),

  listForPatient: (page = 0, size = 10) =>
    apiClient.get<ApiResponse<PageResponse<LabResultResponse>>>(
      `/lab-results/patient?page=${page}&size=${size}`
    ),

  create: (data: LabResultRequest) =>
    apiClient.post<ApiResponse<LabResultResponse>>('/lab-results', data),

  remove: (id: number | string) =>
    apiClient.delete<ApiResponse<void>>(`/lab-results/${id}`),
};

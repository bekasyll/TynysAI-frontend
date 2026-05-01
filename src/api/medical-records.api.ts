import apiClient from './client';
import type {
  ApiResponse, PageResponse,
  DiagnosticReportResponse, DiagnosticReportRequest,
  LabResultResponse, LabResultRequest,
  Severity, DiseaseType, LabTestType,
} from '../types';

export interface ReportFilters {
  severity?: Severity;
  diagnosis?: DiseaseType;
  /** ISO datetime, inclusive lower bound on createdAt */
  from?: string;
  /** ISO datetime, exclusive upper bound on createdAt */
  to?: string;
  q?: string;
}

export interface LabFilters {
  testType?: LabTestType;
  /** ISO date (YYYY-MM-DD), inclusive lower bound on testDate */
  from?: string;
  /** ISO date (YYYY-MM-DD), inclusive upper bound on testDate */
  to?: string;
  q?: string;
}

function reportQs(page: number, size: number, f?: ReportFilters): string {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (f?.severity) p.set('severity', f.severity);
  if (f?.diagnosis) p.set('diagnosis', f.diagnosis);
  if (f?.from) p.set('from', f.from);
  if (f?.to) p.set('to', f.to);
  if (f?.q) p.set('q', f.q);
  return p.toString();
}

function labQs(page: number, size: number, f?: LabFilters): string {
  const p = new URLSearchParams({ page: String(page), size: String(size) });
  if (f?.testType) p.set('testType', f.testType);
  if (f?.from) p.set('from', f.from);
  if (f?.to) p.set('to', f.to);
  if (f?.q) p.set('q', f.q);
  return p.toString();
}

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
  listForPatient: (page = 0, size = 10, filters?: ReportFilters) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/patient?${reportQs(page, size, filters)}`
    ),

  listForDoctor: (page = 0, size = 10, filters?: ReportFilters) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/doctor?${reportQs(page, size, filters)}`
    ),

  listAll: (page = 0, size = 10, filters?: ReportFilters) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/admin/all?${reportQs(page, size, filters)}`
    ),

  /** Doctor/admin variant - all reports for a specific patient. */
  listByPatientId: (patientId: string, page = 0, size = 10, filters?: ReportFilters) =>
    apiClient.get<ApiResponse<PageResponse<DiagnosticReportResponse>>>(
      `/reports/by-patient/${patientId}?${reportQs(page, size, filters)}`
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

  listForPatient: (page = 0, size = 10, filters?: LabFilters) =>
    apiClient.get<ApiResponse<PageResponse<LabResultResponse>>>(
      `/lab-results/patient?${labQs(page, size, filters)}`
    ),

  /** Doctor/admin variant - lists lab results for a specific patient by id. */
  listByPatientId: (patientId: string, page = 0, size = 10, filters?: LabFilters) =>
    apiClient.get<ApiResponse<PageResponse<LabResultResponse>>>(
      `/lab-results/by-patient/${patientId}?${labQs(page, size, filters)}`
    ),

  create: (data: LabResultRequest) =>
    apiClient.post<ApiResponse<LabResultResponse>>('/lab-results', data),

  remove: (id: number | string) =>
    apiClient.delete<ApiResponse<void>>(`/lab-results/${id}`),
};

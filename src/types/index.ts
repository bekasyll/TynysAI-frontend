// ==================== ENUMS ====================

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType =
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'
  | 'O_POSITIVE' | 'O_NEGATIVE';

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REQUIRES_REVIEW' | 'VALIDATED' | 'FAILED';

export type DiseaseType =
  | 'NORMAL'
  | 'BACTERIAL_PNEUMONIA'
  | 'VIRAL_PNEUMONIA'
  | 'COVID_19'
  | 'TUBERCULOSIS'
  | 'COPD'
  | 'LUNG_CANCER'
  | 'PLEURAL_EFFUSION'
  | 'PNEUMOTHORAX'
  | 'PULMONARY_FIBROSIS'
  | 'ATELECTASIS'
  | 'CARDIOMEGALY'
  | 'EDEMA'
  | 'OTHER';

export type Severity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

export type LabTestType =
  | 'COMPLETE_BLOOD_COUNT'
  | 'BIOCHEMISTRY'
  | 'SPUTUM_CULTURE'
  | 'PCR_COVID'
  | 'PCR_TB'
  | 'IGRA_TB'
  | 'MANTOUX'
  | 'BLOOD_GAS'
  | 'SPIROMETRY'
  | 'CULTURE_SENSITIVITY'
  | 'INFLAMMATORY_MARKERS'
  | 'OTHER';

export type AppointmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export type NotificationType =
  | 'APPOINTMENT_REQUESTED'
  | 'APPOINTMENT_ACCEPTED'
  | 'APPOINTMENT_REJECTED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'XRAY_ASSIGNED'
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_REQUIRES_REVIEW'
  | 'ANALYSIS_VALIDATED'
  | 'REPORT_READY'
  | 'REPORT_UPDATED'
  | 'LAB_RESULT_ADDED'
  | 'DOCTOR_MESSAGE'
  | 'DOCTOR_PENDING_APPROVAL'
  | 'ACCOUNT_VERIFIED'
  | 'SYSTEM';

// ==================== API WRAPPERS ====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// ==================== USER ====================

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
  avatarPath?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
}

// ==================== PATIENT PROFILE ====================

export interface PatientProfileResponse {
  id: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: Gender;
  bloodType?: BloodType;
  heightCm?: number;
  weightKg?: number;
  allergies?: string;
  chronicDiseases?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  insuranceNumber?: string;
  occupation?: string;
  smoker?: boolean;
  alcoholUser?: boolean;
  medicalHistory?: string;
  profileCreatedAt: string;
}

export interface UpdatePatientProfileRequest {
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: BloodType;
  heightCm?: number;
  weightKg?: number;
  allergies?: string;
  chronicDiseases?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  address?: string;
  insuranceNumber?: string;
  occupation?: string;
  smoker?: boolean;
  alcoholUser?: boolean;
  medicalHistory?: string;
}

// ==================== DOCTOR PROFILE ====================

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];

/** Single working interval inside a weekday. Times are "HH:mm" strings. */
export interface TimeRange {
  start: string;
  end: string;
}

/**
 * Doctor's weekly work schedule. Keys are DayOfWeek names (matches Java
 * DayOfWeek enum), values are arrays of intervals. Missing or empty array
 * for a day means "doesn't work that day".
 */
export type WorkSchedule = Partial<Record<DayOfWeek, TimeRange[]>>;

export interface DoctorProfileResponse {
  id: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: Gender;
  specialization?: string;
  licenseNumber?: string;
  hospitalName?: string;
  department?: string;
  yearsOfExperience?: number;
  bio?: string;
  education?: string;
  approved: boolean;
  workSchedule?: WorkSchedule;
  profileCreatedAt: string;
}

export interface UpdateDoctorProfileRequest {
  dateOfBirth?: string;
  gender?: Gender;
  specialization?: string;
  licenseNumber?: string;
  hospitalName?: string;
  department?: string;
  yearsOfExperience?: number;
  bio?: string;
  education?: string;
  workSchedule?: WorkSchedule;
}

// ==================== X-RAY ANALYSIS ====================

export interface XrayAnalysisResponse {
  id: number;
  patientId: string;
  patientName?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes?: number;
  status: AnalysisStatus;
  aiPrimaryDiagnosis?: DiseaseType;
  aiPrimaryDiagnosisDisplayName?: string;
  aiConfidence?: number;
  aiFindings?: string;
  aiDetectedAbnormalities?: string;
  aiAllPredictionsJson?: string;
  gradcamAvailable?: boolean;
  validatedByDoctorId?: string;
  validatedByDoctorName?: string;
  doctorDiagnosis?: DiseaseType;
  doctorDiagnosisDisplayName?: string;
  doctorNotes?: string;
  validatedAt?: string;
  patientNotes?: string;
  uploadedAt: string;
  analyzedAt?: string;
}

export interface GradcamRequest {
  targetClass: string;
  alpha?: number;
  threshold?: number;
  colormap?: string;
}

export interface GradcamResponse {
  heatmapB64: string;
  overlayB64: string;
  activePercent: number;
  targetClass: string;
  modelUsed: string;
}

export interface DoctorValidationRequest {
  doctorDiagnosis: DiseaseType;
  doctorNotes?: string;
  agreesWithAi: boolean;
}

// ==================== LAB RESULTS ====================

export interface LabResultResponse {
  id: number;
  patientId: string;
  patientName?: string;
  addedByDoctorId?: string;
  addedByDoctorName?: string;
  testType: LabTestType;
  testTypeDisplayName?: string;
  testDate: string;
  labName?: string;
  hemoglobin?: number;
  wbc?: number;
  rbc?: number;
  platelets?: number;
  hematocrit?: number;
  neutrophils?: number;
  lymphocytes?: number;
  monocytes?: number;
  eosinophils?: number;
  crp?: number;
  esr?: number;
  proCalcitonin?: number;
  ferritin?: number;
  ldh?: number;
  dDimer?: number;
  glucose?: number;
  creatinine?: number;
  urea?: number;
  albumin?: number;
  totalProtein?: number;
  alt?: number;
  ast?: number;
  bilirubin?: number;
  ph?: number;
  pao2?: number;
  paco2?: number;
  hco3?: number;
  spo2?: number;
  fev1?: number;
  fvc?: number;
  fev1FvcRatio?: number;
  cultureResult?: string;
  pathogenFound?: string;
  sensitivityResult?: string;
  igraResult?: string;
  mantouxResult?: string;
  mantouxInduratMm?: number;
  pcrResult?: string;
  pcrCtValue?: number;
  notes?: string;
  rawResultText?: string;
  createdAt: string;
}

export interface LabResultRequest {
  patientId: string;
  testType: LabTestType;
  testDate: string;
  labName?: string;
  hemoglobin?: number;
  wbc?: number;
  rbc?: number;
  platelets?: number;
  hematocrit?: number;
  neutrophils?: number;
  lymphocytes?: number;
  monocytes?: number;
  eosinophils?: number;
  crp?: number;
  esr?: number;
  proCalcitonin?: number;
  ferritin?: number;
  ldh?: number;
  dDimer?: number;
  glucose?: number;
  creatinine?: number;
  urea?: number;
  albumin?: number;
  totalProtein?: number;
  alt?: number;
  ast?: number;
  bilirubin?: number;
  ph?: number;
  pao2?: number;
  paco2?: number;
  hco3?: number;
  spo2?: number;
  fev1?: number;
  fvc?: number;
  fev1FvcRatio?: number;
  cultureResult?: string;
  pathogenFound?: string;
  sensitivityResult?: string;
  igraResult?: string;
  mantouxResult?: string;
  mantouxInduratMm?: number;
  pcrResult?: string;
  pcrCtValue?: number;
  notes?: string;
  rawResultText?: string;
}

// ==================== DIAGNOSTIC REPORT ====================

export interface DiagnosticReportResponse {
  id: number;
  reportNumber?: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  xrayAnalysisId?: number;
  labResultId?: number;
  finalDiagnosis: DiseaseType;
  finalDiagnosisDisplayName?: string;
  severity: Severity;
  severityDisplayName?: string;
  clinicalFindings: string;
  treatmentRecommendations?: string;
  medicationRecommendations?: string;
  lifestyleRecommendations?: string;
  followUpDate?: string;
  reportText: string;
  sentToPatient: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DiagnosticReportRequest {
  patientId: string;
  appointmentId?: number;
  xrayAnalysisId?: number;
  labResultId?: number;
  finalDiagnosis: DiseaseType;
  severity: Severity;
  clinicalFindings: string;
  treatmentRecommendations?: string;
  medicationRecommendations?: string;
  lifestyleRecommendations?: string;
  followUpDate?: string;
  reportText: string;
  sendToPatient?: boolean;
}

// ==================== APPOINTMENTS ====================

export interface AppointmentResponse {
  id: number;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  status: AppointmentStatus;
  appointmentDate?: string;
  patientComplaints?: string;
  doctorNotes?: string;
  reportId?: number;
  xrayAnalysisId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentRequest {
  doctorId: string;
  appointmentDate?: string;
  patientComplaints?: string;
  xrayAnalysisId?: number;
}

export interface AppointmentDecisionRequest {
  doctorNotes?: string;
  appointmentDate?: string;
}

// ==================== NOTIFICATIONS ====================

export interface NotificationResponse {
  id: number;
  userId: string;
  type: NotificationType;
  params?: Record<string, string>;
  read: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  readAt?: string;
  createdAt: string;
}

// ==================== ADMIN STATS ====================

export interface AdminStatsResponse {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  activePatients: number;
  activeDoctors: number;
  pendingDoctorApprovals: number;
}

// ==================== ENUM ARRAYS ====================

export const DISEASE_TYPES: DiseaseType[] = [
  'NORMAL', 'BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA', 'COVID_19', 'TUBERCULOSIS',
  'COPD', 'LUNG_CANCER', 'PLEURAL_EFFUSION', 'PNEUMOTHORAX', 'PULMONARY_FIBROSIS',
  'ATELECTASIS', 'CARDIOMEGALY', 'EDEMA', 'OTHER',
];

export const SEVERITY_TYPES: Severity[] = ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];

export const ANALYSIS_STATUSES: AnalysisStatus[] = [
  'PENDING', 'PROCESSING', 'COMPLETED', 'REQUIRES_REVIEW', 'VALIDATED', 'FAILED',
];

export const LAB_TEST_TYPES: LabTestType[] = [
  'COMPLETE_BLOOD_COUNT', 'BIOCHEMISTRY', 'SPUTUM_CULTURE', 'PCR_COVID', 'PCR_TB',
  'IGRA_TB', 'MANTOUX', 'BLOOD_GAS', 'SPIROMETRY', 'CULTURE_SENSITIVITY',
  'INFLAMMATORY_MARKERS', 'OTHER',
];

export const GENDER_TYPES: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

export const BLOOD_TYPES: BloodType[] = [
  'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
  'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
];

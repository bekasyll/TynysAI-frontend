// ==================== ENUMS ====================

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodType =
  | 'A_POSITIVE' | 'A_NEGATIVE'
  | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'
  | 'O_POSITIVE' | 'O_NEGATIVE';

export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REQUIRES_REVIEW' | 'VALIDATED' | 'FAILED';
export type ImageType = 'XRAY_CHEST' | 'XRAY_OTHER' | 'CT_CHEST' | 'CT_OTHER';

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
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_REQUIRES_REVIEW'
  | 'REPORT_READY'
  | 'REPORT_UPDATED'
  | 'LAB_RESULT_ADDED'
  | 'APPOINTMENT_REMINDER'
  | 'DOCTOR_MESSAGE'
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

// ==================== AUTH ====================

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  avatarBase64?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ==================== USER ====================

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  avatarBase64?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Role;
}

// ==================== PATIENT PROFILE ====================

export interface PatientProfileResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
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

export interface DoctorProfileResponse {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  specialization?: string;
  licenseNumber?: string;
  hospitalName?: string;
  department?: string;
  yearsOfExperience?: number;
  bio?: string;
  education?: string;
  approved: boolean;
  workSchedule?: string;
  profileCreatedAt: string;
}

export interface UpdateDoctorProfileRequest {
  specialization?: string;
  licenseNumber?: string;
  hospitalName?: string;
  department?: string;
  yearsOfExperience?: number;
  bio?: string;
  education?: string;
  workSchedule?: string;
}

// ==================== X-RAY ANALYSIS ====================

export interface XrayAnalysisResponse {
  id: string;
  patientId: string;
  patientName?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes?: number;
  imageType: ImageType;
  status: AnalysisStatus;
  aiPrimaryDiagnosis?: DiseaseType;
  aiPrimaryDiagnosisDisplayName?: string;
  aiConfidence?: number;
  aiFindings?: string;
  aiDetectedAbnormalities?: string;
  aiAllPredictionsJson?: string;
  validatedByDoctorId?: string;
  validatedByDoctorName?: string;
  doctorDiagnosis?: DiseaseType;
  doctorDiagnosisDisplayName?: string;
  doctorNotes?: string;
  validatedAt?: string;
  patientNotes?: string;
  uploadedAt: string;
  analyzedAt?: string;
  imageBase64?: string;
}

export interface DoctorValidationRequest {
  doctorDiagnosis: DiseaseType;
  doctorNotes?: string;
  agreesWithAi: boolean;
}

// ==================== LAB RESULTS ====================

export interface LabResultResponse {
  id: string;
  patientId: string;
  patientName?: string;
  addedByDoctorId?: string;
  addedByDoctorName?: string;
  testType: LabTestType;
  testTypeDisplayName?: string;
  testDate: string;
  labName?: string;
  // CBC
  hemoglobin?: number;
  wbc?: number;
  rbc?: number;
  platelets?: number;
  hematocrit?: number;
  neutrophils?: number;
  lymphocytes?: number;
  monocytes?: number;
  eosinophils?: number;
  // Inflammatory
  crp?: number;
  esr?: number;
  proCalcitonin?: number;
  ferritin?: number;
  ldh?: number;
  dDimer?: number;
  // Biochemistry
  glucose?: number;
  creatinine?: number;
  urea?: number;
  albumin?: number;
  totalProtein?: number;
  alt?: number;
  ast?: number;
  bilirubin?: number;
  // Blood gas
  ph?: number;
  pao2?: number;
  paco2?: number;
  hco3?: number;
  spo2?: number;
  // Spirometry
  fev1?: number;
  fvc?: number;
  fev1FvcRatio?: number;
  // Culture
  cultureResult?: string;
  pathogenFound?: string;
  sensitivityResult?: string;
  // TB
  igraResult?: string;
  mantouxResult?: string;
  mantouxInduratMm?: number;
  // PCR
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
  id: string;
  reportNumber?: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  doctorSpecialization?: string;
  xrayAnalysisId?: string;
  labResultId?: string;
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
  appointmentId?: string;
  xrayAnalysisId?: string;
  labResultId?: string;
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
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  status: AppointmentStatus;
  appointmentDate?: string;
  patientComplaints?: string;
  doctorNotes?: string;
  reportId?: string;
  xrayAnalysisId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentRequest {
  doctorId: string;
  appointmentDate?: string;
  patientComplaints?: string;
  xrayAnalysisId?: string;
}

export interface AppointmentDecisionRequest {
  doctorNotes?: string;
  appointmentDate?: string;
}

// ==================== NOTIFICATIONS ====================

export interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
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
  totalAnalyses: number;
  pendingAnalyses: number;
  completedAnalyses: number;
  analysesLast30Days: number;
  totalReports: number;
  totalLabResults: number;
  diseaseDistribution: Record<string, number>;
  analysesByStatus: Record<string, number>;
}

// ==================== ENUM ARRAYS (for iteration in dropdowns) ====================

export const DISEASE_TYPES: DiseaseType[] = [
  'NORMAL', 'BACTERIAL_PNEUMONIA', 'VIRAL_PNEUMONIA', 'COVID_19', 'TUBERCULOSIS',
  'COPD', 'LUNG_CANCER', 'PLEURAL_EFFUSION', 'PNEUMOTHORAX', 'PULMONARY_FIBROSIS',
  'ATELECTASIS', 'CARDIOMEGALY', 'EDEMA', 'OTHER',
];

export const SEVERITY_TYPES: Severity[] = ['NONE', 'MILD', 'MODERATE', 'SEVERE', 'CRITICAL'];

export const IMAGE_TYPES: ImageType[] = ['XRAY_CHEST', 'XRAY_OTHER', 'CT_CHEST', 'CT_OTHER'];

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

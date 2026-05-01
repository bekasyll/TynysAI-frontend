import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import type { Role } from './types';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import UploadAnalysisPage from './pages/patient/UploadAnalysisPage';
import AnalysesPage from './pages/patient/AnalysesPage';
import AnalysisDetailPage from './pages/patient/AnalysisDetailPage';
import LabResultsPage from './pages/patient/LabResultsPage';
import ReportsPage from './pages/patient/ReportsPage';
import ReportDetailPage from './pages/patient/ReportDetailPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import DoctorsListPage from './pages/patient/DoctorsListPage';
import AppointmentsPage from './pages/patient/AppointmentsPage';

// Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientsListPage from './pages/doctor/PatientsListPage';
import PatientDetailPage from './pages/doctor/PatientDetailPage';
import ValidateAnalysisPage from './pages/doctor/ValidateAnalysisPage';
import DoctorAnalysisDetailPage from './pages/doctor/AnalysisDetailPage';
import AddLabResultPage from './pages/doctor/AddLabResultPage';
import CreateReportPage from './pages/doctor/CreateReportPage';
import DoctorReportsPage from './pages/doctor/DoctorReportsPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import AssignedAnalysesPage from './pages/doctor/AssignedAnalysesPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorSelfAnalysisPage from './pages/doctor/DoctorSelfAnalysisPage';
import AppointmentDetailPage from './pages/doctor/AppointmentDetailPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import DoctorApprovalsPage from './pages/admin/DoctorApprovalsPage';
import AllAnalysesPage from './pages/admin/AllAnalysesPage';
import AllReportsPage from './pages/admin/AllReportsPage';

// Common
import NotificationsPage from './pages/common/NotificationsPage';

function RoleRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'PATIENT') return <Navigate to="/patient/dashboard" replace />;
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

const DOCTOR_ADMIN: Role[] = ['DOCTOR', 'ADMIN'];
const ADMIN_ONLY: Role[] = ['ADMIN'];
const PATIENT_ONLY: Role[] = ['PATIENT'];

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/unauthorized" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
            <p className="text-gray-500">Access denied</p>
          </div>
        </div>
      } />

      {/* Protected layout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

        {/* Patient routes */}
        <Route path="/patient/dashboard" element={<RoleRoute roles={PATIENT_ONLY}><PatientDashboard /></RoleRoute>} />
        <Route path="/patient/upload" element={<RoleRoute roles={PATIENT_ONLY}><UploadAnalysisPage /></RoleRoute>} />
        <Route path="/patient/analyses" element={<RoleRoute roles={PATIENT_ONLY}><AnalysesPage /></RoleRoute>} />
        <Route path="/patient/analyses/:id" element={<RoleRoute roles={PATIENT_ONLY}><AnalysisDetailPage /></RoleRoute>} />
        <Route path="/patient/lab-results" element={<RoleRoute roles={PATIENT_ONLY}><LabResultsPage /></RoleRoute>} />
        <Route path="/patient/reports" element={<RoleRoute roles={PATIENT_ONLY}><ReportsPage /></RoleRoute>} />
        <Route path="/patient/reports/:id" element={<RoleRoute roles={PATIENT_ONLY}><ReportDetailPage /></RoleRoute>} />
        <Route path="/patient/doctors" element={<RoleRoute roles={PATIENT_ONLY}><DoctorsListPage /></RoleRoute>} />
        <Route path="/patient/appointments" element={<RoleRoute roles={PATIENT_ONLY}><AppointmentsPage /></RoleRoute>} />
        <Route path="/patient/profile" element={<RoleRoute roles={PATIENT_ONLY}><PatientProfilePage /></RoleRoute>} />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorDashboard /></RoleRoute>} />
        <Route path="/doctor/patients" element={<RoleRoute roles={DOCTOR_ADMIN}><PatientsListPage /></RoleRoute>} />
        <Route path="/doctor/patients/:patientId" element={<RoleRoute roles={DOCTOR_ADMIN}><PatientDetailPage /></RoleRoute>} />
        <Route path="/doctor/analyses/:id" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorAnalysisDetailPage /></RoleRoute>} />
        <Route path="/doctor/analyses/:analysisId/validate" element={<RoleRoute roles={DOCTOR_ADMIN}><ValidateAnalysisPage /></RoleRoute>} />
        <Route path="/doctor/lab-results/add" element={<RoleRoute roles={DOCTOR_ADMIN}><AddLabResultPage /></RoleRoute>} />
        <Route path="/doctor/reports/create" element={<RoleRoute roles={DOCTOR_ADMIN}><CreateReportPage /></RoleRoute>} />
        <Route path="/doctor/reports" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorReportsPage /></RoleRoute>} />
        <Route path="/doctor/assigned-analyses" element={<RoleRoute roles={DOCTOR_ADMIN}><AssignedAnalysesPage /></RoleRoute>} />
        <Route path="/doctor/appointments" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorAppointmentsPage /></RoleRoute>} />
        <Route path="/doctor/appointments/:appointmentId" element={<RoleRoute roles={DOCTOR_ADMIN}><AppointmentDetailPage /></RoleRoute>} />
        <Route path="/doctor/ai-analysis" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorSelfAnalysisPage /></RoleRoute>} />
        <Route path="/doctor/profile" element={<RoleRoute roles={DOCTOR_ADMIN}><DoctorProfilePage /></RoleRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<RoleRoute roles={ADMIN_ONLY}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute roles={ADMIN_ONLY}><UsersPage /></RoleRoute>} />
        <Route path="/admin/approvals" element={<RoleRoute roles={ADMIN_ONLY}><DoctorApprovalsPage /></RoleRoute>} />
        <Route path="/admin/analyses" element={<RoleRoute roles={ADMIN_ONLY}><AllAnalysesPage /></RoleRoute>} />
        <Route path="/admin/reports" element={<RoleRoute roles={ADMIN_ONLY}><AllReportsPage /></RoleRoute>} />

        {/* Shared */}
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

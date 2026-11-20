import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import NewComplaint from './pages/NewComplaint.jsx';
import TrackComplaint from './pages/TrackComplaint.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminStaff from './pages/AdminStaff.jsx';
import AdminReports from './pages/AdminReports.jsx';

// All page URLs live here. Wrap a page in <ProtectedRoute> to require login (and optionally a role).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      {/* Student / faculty */}
      <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/new" element={<ProtectedRoute role="student"><NewComplaint /></ProtectedRoute>} />

      {/* Both roles */}
      <Route path="/complaint" element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>} />
      <Route path="/complaint/:id" element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/staff" element={<ProtectedRoute role="admin"><AdminStaff /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

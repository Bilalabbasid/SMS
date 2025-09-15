import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Import pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Import dashboards
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import TeacherDashboard from '@/pages/dashboards/TeacherDashboard';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import ParentDashboard from '@/pages/dashboards/ParentDashboard';
import AccountantDashboard from '@/pages/dashboards/AccountantDashboard';
import LibrarianDashboard from '@/pages/dashboards/LibrarianDashboard';

// Import protected route component
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Default redirect to appropriate dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Role-based Dashboards */}
                  <Route path="dashboard" element={
                    <ProtectedRoute requireRole="any">
                      <DashboardRouter />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Routes */}
                  <Route path="admin/*" element={
                    <ProtectedRoute requireRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Teacher Routes */}
                  <Route path="teacher/*" element={
                    <ProtectedRoute requireRole="teacher">
                      <TeacherDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Student Routes */}
                  <Route path="student/*" element={
                    <ProtectedRoute requireRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Parent Routes */}
                  <Route path="parent/*" element={
                    <ProtectedRoute requireRole="parent">
                      <ParentDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Accountant Routes */}
                  <Route path="accountant/*" element={
                    <ProtectedRoute requireRole="accountant">
                      <AccountantDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Librarian Routes */}
                  <Route path="librarian/*" element={
                    <ProtectedRoute requireRole="librarian">
                      <LibrarianDashboard />
                    </ProtectedRoute>
                  } />
                </Route>
                
                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
    </div>
  );
}

// Dashboard Router Component - Redirects to appropriate dashboard based on role
function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to role-specific dashboard
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'parent':
      return <Navigate to="/parent" replace />;
    case 'accountant':
      return <Navigate to="/accountant" replace />;
    case 'librarian':
      return <Navigate to="/librarian" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default App;
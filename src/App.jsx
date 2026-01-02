import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import ObservationPage from './pages/ObservationPage';
import VisitsPage from './pages/VisitsPage';
import ReportsPage from './pages/ReportsPage';
import Training from './pages/Training';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/observation" replace />} />
            <Route path="observation" element={<ObservationPage />} />
            <Route path="visits" element={<VisitsPage />} />
            <Route path="training" element={<Training />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

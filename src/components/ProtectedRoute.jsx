import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // انتظر حتى ينتهي التحميل قبل التحقق من الجلسة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // فقط إذا لم يكن هناك جلسة ولم نكن في صفحة Login، وجه إلى Login
  if (!session && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // إذا كان في صفحة Login ولديه جلسة، وجه إلى الصفحة الرئيسية
  if (session && location.pathname === '/login') {
    return <Navigate to="/observation" replace />;
  }

  return children;
};

export default ProtectedRoute;


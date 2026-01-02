import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && session) {
      navigate('/observation', { replace: true });
    }
  }, [session, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (session) return null;

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!nationalId || !password) {
      setMessage('الرجاء إدخال رقم الهوية وكلمة المرور');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const email = `${nationalId}@eleot.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/observation');
    } catch (error) {
      setMessage(error?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/observation`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMessage(error?.message || 'حدث خطأ أثناء تسجيل الدخول عبر Google');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-purple-600 via-blue-500 to-blue-100"
      dir="rtl"
      style={{ overflowX: 'hidden' }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 w-full py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          {/* Right: Logo + Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center shrink-0">
              {/* IMPORTANT: add width/height attributes as fallback */}
              <svg
                width="32"
                height="32"
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            <div className="text-white min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">تسجيل دخول الموظفين</h1>
              <p className="text-xs sm:text-sm opacity-90 truncate">مدارس الأنجال الأهلية</p>
            </div>
          </div>

          {/* Left: Back to Home */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-white inline-flex items-center gap-2 hover:underline self-start sm:self-auto"
          >
            <span>العودة للرئيسية</span>
            <svg
              width="20"
              height="20"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex items-center justify-center px-4 py-10 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  width="48"
                  height="48"
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">تسجيل دخول الموظفين</h2>
              <p className="text-gray-700">أدخل رقم الهوية وكلمة المرور</p>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 border-2 border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-900 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg width="24" height="24" className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>تسجيل الدخول عبر Google</span>
            </button>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-sm text-gray-500">أو</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 text-right">
                  رقم الهوية الوطنية (10 أرقام)
                </label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNationalId(value);
                  }}
                  placeholder="2185255896"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-right"
                  required
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2 text-right">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........."
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-right"
                  required
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg text-sm ${
                    message.includes('نجاح') || message.includes('success')
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                <svg
                  width="20"
                  height="20"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>{loading ? 'جاري المعالجة...' : 'تسجيل الدخول'}</span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/student-login')}
                className="text-blue-600 hover:text-blue-700 text-sm inline-flex items-center justify-center gap-1"
              >
                <span>هل أنت طالب؟ سجل دخولك من هنا</span>
                <svg width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;

import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

const AppLayout = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState('ar');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const tabs = [
    { path: '/observation', label: 'التقييم', labelEn: 'Evaluation' },
    { path: '/visits', label: 'الزيارات', labelEn: 'Visits' },
    { path: '/training', label: 'تدريب على أداة الملاحظة ELEOT', labelEn: 'Training on ELEOT Observation Tool' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header - Light Blue Rounded Container */}
      <header className="bg-blue-100 rounded-b-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left: Settings and Language Toggle */}
            <div className="flex items-center gap-2">
              <button
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700 shadow-sm transition-colors"
                title="الإعدادات"
              >
                ⚙️
              </button>
              <button
                onClick={toggleLanguage}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700 shadow-sm transition-colors"
                title="English"
              >
                EN
              </button>
            </div>

            {/* Center: Title */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-blue-900">أداة المراقبة الذكية (ELEOT)</h1>
            </div>

            {/* Right: School Logo */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">مدارس الأنجال الأهلية</div>
                <div className="text-xs text-gray-600">Since 1985</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-yellow-400 to-green-400 rounded-lg flex items-center justify-center shadow-sm">
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-yellow-500 rounded flex flex-col items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded mb-0.5"></div>
                    <div className="w-2 h-2 bg-white rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - RTL aligned with green underline for active */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex justify-end gap-1">
              {tabs.map((tab) => {
                const isActive = location.pathname === tab.path || 
                  (tab.path === '/training' && location.pathname.startsWith('/training'));
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-green-500"></span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;



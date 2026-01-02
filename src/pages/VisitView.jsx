import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getVisit, deleteVisit } from '../services/supabaseService';
import { exportToPDF } from '../utils/exportUtils';
import { ELEOT_SECTIONS } from '../config/eleotConfig';

const VisitView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isRTL, language } = useLanguage();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVisit();
  }, [id]);

  const loadVisit = async () => {
    try {
      const data = await getVisit(id);
      setVisit(data);
    } catch (error) {
      console.error('Error loading visit:', error);
      alert(isRTL ? 'خطأ في تحميل الزيارة' : 'Error loading visit');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الزيارة؟' : 'Are you sure you want to delete this visit?')) {
      return;
    }
    try {
      await deleteVisit(id);
      navigate('/visits');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert(isRTL ? 'خطأ في حذف الزيارة' : 'Error deleting visit');
    }
  };

  const handleExportPDF = () => {
    if (!visit || !visit.results) return;
    const observationData = {
      teacherName: visit.teacher_name,
      date: visit.created_at,
      criteria: visit.results.criteria || [],
      recommendations: visit.results.recommendations,
    };
    exportToPDF(observationData, visit.results.language || language);
  };

  const copyJustification = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(isRTL ? 'تم النسخ' : 'Copied');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">
          {isRTL ? 'الزيارة غير موجودة' : 'Visit not found'}
        </p>
        <button onClick={() => navigate('/visits')} className="btn-primary mt-4">
          {isRTL ? 'العودة للزيارات' : 'Back to Visits'}
        </button>
      </div>
    );
  }

  const visitLanguage = visit.results?.language || language;
  const results = visit.results || {};

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">
          {isRTL ? 'تفاصيل الزيارة' : 'Visit Details'}
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExportPDF} className="btn-secondary">
            PDF
          </button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
            {isRTL ? 'حذف' : 'Delete'}
          </button>
          <button onClick={() => navigate('/visits')} className="btn-secondary">
            {isRTL ? 'العودة' : 'Back'}
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isRTL ? 'معلومات الزيارة' : 'Visit Information'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              {isRTL ? 'اسم المعلم:' : 'Teacher Name:'}
            </p>
            <p className="font-medium">{visit.teacher_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              {isRTL ? 'التاريخ:' : 'Date:'}
            </p>
            <p className="font-medium">{formatDate(visit.created_at)}</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {isRTL ? 'ملاحظات الحصة' : 'Observation Notes'}
        </h2>
        <p className="text-gray-700 whitespace-pre-wrap">{visit.observation_text}</p>
      </div>

      {results.criteria && results.criteria.length > 0 && (
        <div className="space-y-6">
          {/* Group criteria by environment section */}
          {['A', 'B', 'C', 'D', 'E', 'F'].map((envCode) => {
            const sectionCriteria = results.criteria.filter(item => 
              item.id && item.id.startsWith(envCode)
            );
            
            if (sectionCriteria.length === 0) return null;

            const sectionLabels = {
              A: 'بيئة التعلم العادلة',
              B: 'بيئة التوقعات العالية',
              C: 'بيئة التعلم الداعمة',
              D: 'بيئة التعلم النشط',
              E: 'مراقبة التقدم والملاحظات',
              F: 'الإدارة الجيدة',
            };

            return (
              <div key={envCode} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Section Header - Blue Banner */}
                <div className="bg-blue-600 text-white px-6 py-3">
                  <h3 className="text-lg font-bold">
                    {envCode}. {sectionLabels[envCode]}
                  </h3>
                </div>

                {/* Section Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">المعيار</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الدرجة</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التبرير</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionCriteria.map((item, idx) => {
                        const criterion = item.criterion || {};
                        return (
                          <tr key={idx} className="border-b">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {item.id}: {visitLanguage === 'ar' ? criterion.label_ar : criterion.label_en}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="inline-block px-3 py-1 bg-blue-100 rounded text-blue-900 font-bold">
                                {item.score || '4'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <textarea
                                  readOnly
                                  value={item.justification || 'لوحظ بوضوح تحقق ' + (visitLanguage === 'ar' ? criterion.label_ar : criterion.label_en) + '، حيث كان متوافقاً تماماً مع الممارسات المرصودة.'}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                                  rows={2}
                                />
                                <button
                                  onClick={() => copyJustification(item.justification || '')}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                                >
                                  نسخ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Recommendations Section */}
          {results.recommendations && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-green-600 mb-4">التوصيات</h2>
              <p className="text-gray-700 mb-6">كل الشكر والتقدير للمعلم المعلم</p>
              
              <div
                dangerouslySetInnerHTML={{ __html: results.recommendations }}
                className="prose max-w-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitView;



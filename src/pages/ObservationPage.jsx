import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveVisit } from '../services/visitsService';
import { evaluateWithAI } from '../services/aiEvaluationService';

const ObservationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [teacherNameAr, setTeacherNameAr] = useState('هشام يسن يسري');
  const [subject, setSubject] = useState('تقنية رقمية');
  const [gradeKey, setGradeKey] = useState('أول ثانوي');
  const [segment, setSegment] = useState('');
  const [visitDate, setVisitDate] = useState('2025-12-20');
  const [supervisorName, setSupervisorName] = useState('هشام يسن يسري');
  const [startTime, setStartTime] = useState('');
  const [middleTime, setMiddleTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [overallScore, setOverallScore] = useState('');
  const [environmentScores, setEnvironmentScores] = useState([
    { envCode: 'A', avgScore: '', justification: '' },
    { envCode: 'B', avgScore: '', justification: '' },
    { envCode: 'C', avgScore: '', justification: '' },
    { envCode: 'D', avgScore: '', justification: '' },
    { envCode: 'E', avgScore: '', justification: '' },
    { envCode: 'F', avgScore: '', justification: '' },
    { envCode: '3', avgScore: '', justification: '' },
  ]);
  
  const [saving, setSaving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState('');
  const [aiResults, setAiResults] = useState(null);

  const gradeOptions = [
    { value: 'KG1', label: 'KG1' },
    { value: 'KG2', label: 'KG2' },
    { value: 'G1', label: 'G1' },
    { value: 'G2', label: 'G2' },
    { value: 'G3', label: 'G3' },
    { value: 'G4', label: 'G4' },
    { value: 'G5', label: 'G5' },
    { value: 'G6', label: 'G6' },
  ];

  const segmentOptions = [
    { value: 'Beginning', label: 'بداية' },
    { value: 'Middle', label: 'وسط' },
    { value: 'End', label: 'نهاية' },
  ];

  const envLabels = {
    A: { ar: 'التعلم العادل', en: 'Equitable Learning' },
    B: { ar: 'التوقعات العالية', en: 'High Expectations' },
    C: { ar: 'التعلم الداعم', en: 'Supportive Learning' },
    D: { ar: 'التعلم النشط', en: 'Active Learning' },
    E: { ar: 'مراقبة التقدم والتغذية الراجعة', en: 'Progress Monitoring & Feedback' },
    F: { ar: 'التعلم المدار جيداً', en: 'Well-Managed Learning' },
    '3': { ar: 'التعلم الرقمي', en: 'Digital Learning' },
  };

  const handleEnvScoreChange = (index, field, value) => {
    const updated = [...environmentScores];
    updated[index][field] = value;
    setEnvironmentScores(updated);
  };

  const handleEvaluateWithAI = async () => {
    if (!lessonDescription.trim()) {
      setMessage('الرجاء إدخال وصف الدرس أولاً');
      return;
    }

    if (!teacherNameAr.trim()) {
      setMessage('الرجاء إدخال اسم المعلم أولاً');
      return;
    }

    if (!subject.trim()) {
      setMessage('الرجاء إدخال المادة أولاً');
      return;
    }

    setEvaluating(true);
    setMessage('');
    setAiResults(null);

    try {
      const result = await evaluateWithAI({
        lesson_description: lessonDescription,
        teacher_name: teacherNameAr,
        subject: subject,
        grade: gradeKey,
        segment: segment,
        visit_date: visitDate,
        lang: 'ar',
      });

      setAiResults(result);

      // Fill environment scores from AI results
      if (result.environments && Array.isArray(result.environments)) {
        const updatedScores = [...environmentScores];
        
        result.environments.forEach((env) => {
          const index = updatedScores.findIndex(e => e.envCode === env.env_code);
          if (index !== -1) {
            updatedScores[index] = {
              ...updatedScores[index],
              avgScore: env.env_score?.toString() || '',
              justification: env.justification_ar || env.evidence_ar || '',
            };
          }
        });

        setEnvironmentScores(updatedScores);
      }

      // Set overall score if available
      if (result.environments && result.environments.length > 0) {
        const avgScore = result.environments.reduce((sum, env) => {
          return sum + (parseFloat(env.env_score) || 0);
        }, 0) / result.environments.length;
        setOverallScore(avgScore.toFixed(2));
      }

      setMessage('تم التقييم بنجاح! يمكنك مراجعة النتائج وتعديلها قبل الحفظ.');
    } catch (error) {
      console.error('AI Evaluation error:', error);
      setMessage(`خطأ في التقييم: ${error.message || 'حدث خطأ أثناء التقييم'}`);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!teacherNameAr.trim()) {
      setMessage('الرجاء إدخال اسم المعلم');
      return;
    }

    if (!visitDate) {
      setMessage('الرجاء إدخال تاريخ الزيارة');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Prepare visit data
      const visitData = {
        teacherNameAr: teacherNameAr.trim(),
        subject: subject || null,
        gradeKey: gradeKey || null,
        segment: segment || null,
        visitDate,
        lessonDescription: lessonDescription || null,
        overallScore: overallScore ? parseFloat(overallScore) : null,
      };

      // Prepare environment scores (only include non-empty ones)
      const envScores = environmentScores
        .filter(env => env.avgScore || env.justification)
        .map(env => ({
          envCode: env.envCode,
          avgScore: env.avgScore ? parseFloat(env.avgScore) : null,
          justification: env.justification || null,
          recommendationsHtml: null,
        }));

      await saveVisit(visitData, envScores);
      
      setMessage('تم حفظ الزيارة بنجاح!');
      setTimeout(() => {
        navigate('/visits');
      }, 1500);
    } catch (error) {
      console.error('Error saving visit:', error);
      setMessage(`خطأ في حفظ الزيارة: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Administrative Data Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">البيانات الإدارية</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المعلم</label>
                <input
                  type="text"
                  value={teacherNameAr}
                  onChange={(e) => setTeacherNameAr(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الصف</label>
                <input
                  type="text"
                  value={gradeKey}
                  onChange={(e) => setGradeKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المادة</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الجزء</label>
                <input
                  type="text"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المشرف</label>
                <div className="relative">
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">📅</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البداية</label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنتصف</label>
                <input
                  type="text"
                  value={middleTime}
                  onChange={(e) => setMiddleTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النهاية</label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ELEOT Environment Cards */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">بيئات ELEOT المراد تقييمها</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {environmentScores.map((env) => (
                <div
                  key={env.envCode}
                  className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {env.envCode}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {envLabels[env.envCode]?.ar}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{envLabels[env.envCode]?.en}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">وصف الحصة:</label>
            <textarea
              value={lessonDescription}
              onChange={(e) => setLessonDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل وصفاً مفصلاً للدرس..."
            />
            <p className="mt-2 text-xs text-gray-500">
              يُفضل أن لا يقل عن 50 كلمة للحصول على تقييم دقيق
            </p>
          </div>

          {/* AI Evaluation Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                مسح جميع البيانات
              </button>
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-2xl">🎤</span>
                <button
                  type="button"
                  onClick={handleEvaluateWithAI}
                  disabled={evaluating || !lessonDescription.trim()}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {evaluating ? 'جاري التقييم...' : 'AI Evaluation'}
                </button>
              </div>
            </div>

            {/* Overall Score Display */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-lg font-semibold text-gray-700">النتيجة الإجمالية:</span>
              <div className="px-4 py-2 bg-blue-600 rounded text-white">
                <span className="text-xl font-bold">{overallScore || '0'}</span>
                <span className="text-white">/4</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الزيارة'}
              </button>
            </div>

            {/* Export Buttons */}
            <div className="mt-6 flex gap-4 justify-center">
              <button
                type="button"
                className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                تصدير PDF
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                تصدير Word
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                تصدير CSV
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                إرسال بالبريد الإلكتروني
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('نجاح') || message.includes('success')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ObservationPage;

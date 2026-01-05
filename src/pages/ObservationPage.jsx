import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { evaluateWithAI } from '../services/aiEvaluationService';
import { saveVisit } from '../services/visitsService';
import { exportToPDF, exportToWord, copyAllText } from '../utils/exportUtils';
import { ELEOT_SECTIONS } from '../config/eleotConfig';
import { applyClarificationRules, getAdjustmentExplanation } from '../config/clarificationRules';
import { 
  Mic, 
  MicOff, 
  Trash2, 
  FileText, 
  Download, 
  Mail, 
  Save, 
  CheckCircle2,
  X,
  Copy,
  Info
} from 'lucide-react';

// Static grades list (can be replaced with database fetch)
const GRADES = [
  { key: 'first_primary', ar: 'أول ابتدائي', en: 'First Primary' },
  { key: 'second_primary', ar: 'ثاني ابتدائي', en: 'Second Primary' },
  { key: 'third_primary', ar: 'ثالث ابتدائي', en: 'Third Primary' },
  { key: 'fourth_primary', ar: 'رابع ابتدائي', en: 'Fourth Primary' },
  { key: 'fifth_primary', ar: 'خامس ابتدائي', en: 'Fifth Primary' },
  { key: 'sixth_primary', ar: 'سادس ابتدائي', en: 'Sixth Primary' },
  { key: 'first_intermediate', ar: 'أول متوسط', en: 'First Intermediate' },
  { key: 'second_intermediate', ar: 'ثاني متوسط', en: 'Second Intermediate' },
  { key: 'third_intermediate', ar: 'ثالث متوسط', en: 'Third Intermediate' },
  { key: 'first_secondary', ar: 'أول ثانوي', en: 'First Secondary' },
  { key: 'second_secondary', ar: 'ثاني ثانوي', en: 'Second Secondary' },
  { key: 'third_secondary', ar: 'ثالث ثانوي', en: 'Third Secondary' },
];

// Clarification questions based on images
const CLARIFICATION_QUESTIONS = [
  {
    key: 'equal_access',
    env: 'A2',
    title_ar: '1. البيئة 2. - الوصول المتساوي:',
    title_en: '1. Environment 2. - Equal Access:',
    question_ar: 'هل تمكن جميع الطلاب من الوصول إلى التكنولوجيا / الموارد أو الدعم الفردي من المعلم بشكل متساو؟',
    question_en: 'Did all students have equal access to technology/resources or individual support from the teacher?',
    options: [
      { ar: 'نعم، متساو للجميع', en: 'Yes, equal for all' },
      { ar: 'لا، غير متساو', en: 'No, unequal' },
      { ar: 'غير واضح', en: 'Unclear' }
    ]
  },
  {
    key: 'fair_treatment',
    env: 'A3',
    title_ar: '2. البيئة 3. - المعاملة العادلة:',
    title_en: '2. Environment 3. - Fair Treatment:',
    question_ar: 'هل كانت معاملة المعلم للطلاب عادلة وواضحة ومتسقة مع الجميع؟',
    question_en: 'Was the teacher\'s treatment of students fair, clear, and consistent with everyone?',
    options: [
      { ar: 'نعم، عادلة ومتسقة', en: 'Yes, fair and consistent' },
      { ar: 'لا، غير متسقة', en: 'No, inconsistent' },
      { ar: 'غير واضح', en: 'Unclear' }
    ]
  },
  {
    key: 'respect_empathy',
    env: 'A4',
    title_ar: '3. البيئة 4. - الاحترام والتعاطف:',
    title_en: '3. Environment 4. - Respect and Empathy:',
    question_ar: 'هل أظهر المعلم والطلاب احتراماً وتعاطفاً مع الاختلافات بين الطلاب (ثقافية، قدرات، خلفيات)؟',
    question_en: 'Did the teacher and students show respect and empathy for differences among students (cultural, abilities, backgrounds)?',
    options: [
      { ar: 'نعم، كان هناك احترام واضح', en: 'Yes, clear respect' },
      { ar: 'لا، لم يكن واضحاً', en: 'No, not clear' },
      { ar: 'غير واضح', en: 'Unclear' }
    ]
  },
  {
    key: 'challenging_activities',
    env: 'B2',
    title_ar: '4. البيئة 2.B - الأنشطة الصعبة:',
    title_en: '4. Environment 2.B - Challenging Activities:',
    question_ar: 'هل كانت الأنشطة صعبة ولكن قابلة للتحقيق (ليست سهلة جداً ولا صعبة جداً)؟',
    question_en: 'Were the activities challenging but attainable (not too easy and not too difficult)?',
    options: [
      { ar: 'نعم، صعبة وقابلة للتحقيق', en: 'Yes, challenging and attainable' },
      { ar: 'سهلة جداً', en: 'Too easy' },
      { ar: 'صعبة جداً', en: 'Too difficult' },
      { ar: 'غير واضح', en: 'Unclear' }
    ]
  },
  {
    key: 'intellectual_risk',
    env: 'C1',
    title_ar: '5. البيئة 1.C - المخاطرة الفكرية:',
    title_en: '5. Environment 1.C - Intellectual Risk-taking:',
    question_ar: 'هل كان الطلاب يشعرون بالأمان لطرح أسئلة أو مشاركة أفكار غير مؤكدة دون خوف من الخطأ؟',
    question_en: 'Did students feel safe to ask questions or share uncertain ideas without fear of making mistakes?',
    options: [
      { ar: 'نعم، كانوا يشعرون بالأمان', en: 'Yes, they felt safe' },
      { ar: 'لا، لم يكونوا يشعرون بالأمان', en: 'No, they did not feel safe' },
      { ar: 'غير واضح', en: 'Unclear' }
    ]
  }
];

const ObservationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isRTL, language, setLanguage } = useLanguage();
  
  // Administrative data
  const [teacherName, setTeacherName] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [lessonParts, setLessonParts] = useState([]); // Array: ['beginning', 'middle', 'end']
  const [supervisorName, setSupervisorName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [middleTime, setMiddleTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // ELEOT environments
  const [selectedEnvironments, setSelectedEnvironments] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  
  // Lesson description
  const [lessonDescription, setLessonDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  // Evaluation state
  const [evaluation, setEvaluation] = useState(null);
  const [editableScores, setEditableScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Clarification questions
  const [showClarification, setShowClarification] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [clarificationSkipped, setClarificationSkipped] = useState(false);
  const [scoreAdjustments, setScoreAdjustments] = useState({}); // Track which scores were adjusted
  
  // Initialize supervisor name from user
  useEffect(() => {
    if (user?.email) {
      setSupervisorName(user.email.split('@')[0] || '');
    }
  }, [user]);
  
  // Voice input setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setLessonDescription(prev => prev + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognitionRef.current.onend = () => {
        if (isRecording) {
          recognitionRef.current.start();
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, isRecording]);
  
  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      alert(isRTL ? 'متصفحك لا يدعم التعرف على الصوت' : 'Your browser does not support speech recognition');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };
  
  const handleLessonPartToggle = (part) => {
    setLessonParts(prev => 
      prev.includes(part)
        ? prev.filter(p => p !== part)
        : [...prev, part]
    );
  };
  
  const handleEnvironmentToggle = (envId) => {
    setSelectedEnvironments(prev =>
      prev.includes(envId)
        ? prev.filter(id => id !== envId)
        : [...prev, envId]
    );
  };
  
  const handleClearText = () => {
    setLessonDescription('');
  };
  
  const handleAIEvaluation = async () => {
    if (!lessonDescription.trim()) {
      alert(isRTL ? 'الرجاء إدخال وصف الحصة' : 'Please enter lesson description');
      return;
    }
    
    if (lessonDescription.trim().split(/\s+/).length < 50) {
      const proceed = confirm(
        isRTL 
          ? 'يُفضل أن لا يقل عن 50 كلمة للحصول على تقييم دقيق. هل تريد المتابعة؟'
          : 'It is preferable not to be less than 50 words to get an accurate evaluation. Do you want to continue?'
      );
      if (!proceed) return;
    }
    
    if (selectedEnvironments.length === 0) {
      alert(isRTL ? 'الرجاء اختيار بيئة واحدة على الأقل' : 'Please select at least one environment');
      return;
    }
    
    // Show clarification questions
    setShowClarification(true);
  };
  
  const handleSubmitClarification = async () => {
    setShowClarification(false);
    setClarificationSkipped(false);
    await proceedWithEvaluation();
  };
  
  const handleSkipClarification = async () => {
    setShowClarification(false);
    setClarificationAnswers({});
    setClarificationSkipped(true);
    await proceedWithEvaluation();
  };
  
  const proceedWithEvaluation = async () => {
    setLoading(true);
    try {
      // Prepare clarifications (normalize skipped to empty object)
      const clarificationsToSend = clarificationSkipped ? {} : clarificationAnswers;
      
      // Call AI evaluation with clarifications
      const result = await evaluateWithAI({
        lesson_description: lessonDescription,
        teacher_name: teacherName,
        subject: subject,
        grade: grade,
        segment: lessonParts.join(', '),
        visit_date: visitDate,
        lang: language,
        clarifications: clarificationsToSend, // Pass clarifications to AI
        selected_environments: selectedEnvironments, // Pass selected environments
      });
      
      // Transform API response to match expected format
      // API returns: { criteria: [...], recommendations: "...", totalScore: 3.5 }
      // We need: { results: [...], recommendations: "...", totalScore: 3.5 }
      
      let transformedResult = result;
      
      if (result.criteria && !result.results) {
        // Transform criteria array to results array
        const results = result.criteria.map(item => {
          // Find the criterion in ELEOT_SECTIONS
          let criterion = null;
          let environmentId = null;
          
          for (const section of ELEOT_SECTIONS) {
            const found = section.criteria.find(c => c.id === item.id);
            if (found) {
              criterion = found;
              environmentId = section.id;
              break;
            }
          }
          
          return {
            id: item.id,
            criterion: criterion || { id: item.id, label_ar: item.id, label_en: item.id },
            environmentId: environmentId || item.id.charAt(0),
            environmentLabel: environmentId 
              ? (isRTL ? ELEOT_SECTIONS.find(s => s.id === environmentId)?.label_ar : ELEOT_SECTIONS.find(s => s.id === environmentId)?.label_en)
              : item.id,
            score: item.score || 4,
            justification: item.justification || ''
          };
        });
        
        transformedResult = {
          ...result,
          results: results
        };
      }
      
      // Initialize scores from AI results
      const aiScores = {};
      if (transformedResult.results) {
        transformedResult.results.forEach(item => {
          aiScores[item.criterion?.id || item.id] = item.score || 4;
        });
      }
      
      // 🔴 Layer 2: Apply deterministic clarification rules
      const { adjustedScores, adjustments } = applyClarificationRules(
        aiScores,
        clarificationsToSend,
        selectedEnvironments
      );
      
      // Store adjustments for UI display
      const adjustmentsMap = {};
      adjustments.forEach(adj => {
        adjustmentsMap[adj.criterionId] = {
          original: adj.originalScore,
          adjusted: adj.adjustedScore,
          reason: getAdjustmentExplanation(adj, isRTL),
          clarificationKey: adj.clarificationKey
        };
      });
      setScoreAdjustments(adjustmentsMap);
      
      // Update results with adjusted scores
      if (transformedResult.results) {
        transformedResult.results = transformedResult.results.map(item => {
          const criterionId = item.criterion?.id || item.id;
          const adjustedScore = adjustedScores[criterionId] || item.score;
          return {
            ...item,
            score: adjustedScore
          };
        });
        
        // Recalculate total score with adjusted scores
        const totalScore = transformedResult.results.length > 0
          ? Math.round((transformedResult.results.reduce((sum, r) => sum + (r.score || 0), 0) / transformedResult.results.length) * 10) / 10
          : 0;
        
        transformedResult.totalScore = totalScore;
      }
      
      // Set editable scores to adjusted scores
      setEditableScores(adjustedScores);
      
      setEvaluation(transformedResult);
    } catch (error) {
      console.error('Evaluation error:', error);
      alert(isRTL ? 'حدث خطأ أثناء التقييم' : 'Error during evaluation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleScoreChange = (criterionId, newScore) => {
    const score = Math.max(1, Math.min(4, parseInt(newScore) || 1));
    setEditableScores(prev => ({
      ...prev,
      [criterionId]: score
    }));
    
    // Update evaluation results
    if (evaluation?.results) {
      const updatedResults = evaluation.results.map(item => {
        const id = item.criterion?.id || item.id;
        if (id === criterionId) {
          return { ...item, score };
        }
        return item;
      });
      
      // Recalculate total score
      const totalScore = updatedResults.length > 0
        ? Math.round((updatedResults.reduce((sum, r) => sum + (r.score || 0), 0) / updatedResults.length) * 10) / 10
        : 0;
      
      setEvaluation(prev => ({
        ...prev,
        results: updatedResults,
        totalScore
      }));
    }
  };
  
  const handleSaveVisit = async () => {
    if (!evaluation) {
      alert(isRTL ? 'لا توجد نتائج للحفظ' : 'No results to save');
      return;
    }
    
    if (!teacherName.trim()) {
      alert(isRTL ? 'الرجاء إدخال اسم المعلم' : 'Please enter teacher name');
      return;
    }
    
    setSaving(true);
    try {
      // Prepare clarifications data for persistence
      const clarificationsData = {
        version: 'v1',
        skipped: clarificationSkipped,
        answers: clarificationSkipped ? {} : clarificationAnswers,
        submittedAt: new Date().toISOString()
      };
      
      const visitData = {
        teacherNameAr: teacherName,
        teacherNameEn: teacherName,
        subject: subject || null,
        gradeKey: grade || null,
        segment: lessonParts.length > 0 ? lessonParts.join(',') : null,
        visitDate: visitDate,
        lessonDescription: lessonDescription,
        overallScore: evaluation.totalScore,
        clarifications: clarificationsData // Include clarifications
      };
      
      const environmentScores = selectedEnvironments.map(envId => {
        const envResults = evaluation.results?.filter(r => 
          (r.environmentId || r.criterion?.sectionId) === envId
        ) || [];
        const avgScore = envResults.length > 0
          ? envResults.reduce((sum, r) => sum + (editableScores[r.criterion?.id || r.id] || r.score || 0), 0) / envResults.length
          : 0;
        
        return {
          envCode: envId,
          avgScore: Math.round(avgScore * 10) / 10,
          justification: null,
          recommendationsHtml: null
        };
      });
      
      await saveVisit(visitData, environmentScores);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Save error:', error);
      alert(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving visit');
    } finally {
      setSaving(false);
    }
  };
  
  const handleExportPDF = () => {
    if (!evaluation) return;
    const observation = { 
      date: visitDate, 
      teacherName, 
      environments: selectedEnvironments 
    };
    exportToPDF(observation, evaluation);
  };
  
  const handleExportWord = () => {
    if (!evaluation) return;
    const observation = { 
      date: visitDate, 
      teacherName, 
      environments: selectedEnvironments 
    };
    exportToWord(observation, evaluation);
  };
  
  const handleExportCSV = () => {
    if (!evaluation) return;
    // CSV export logic
    const csvContent = [
      ['Criterion', 'Score', 'Justification'].join(','),
      ...(evaluation.results || []).map(r => [
        r.criterion?.id || r.id,
        editableScores[r.criterion?.id || r.id] || r.score || 0,
        `"${(r.justification || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ELEOT_Report_${visitDate.replace(/\//g, '_')}.csv`;
    link.click();
  };
  
  const handleSendEmail = () => {
    if (!evaluation) return;
    // Email functionality - can be implemented with email service
    alert(isRTL ? 'سيتم إرسال التقرير بالبريد الإلكتروني' : 'Report will be sent via email');
  };
  
  const copyJustification = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(isRTL ? 'تم النسخ' : 'Copied');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };
  
  // Get score color
  const getScoreColor = (score) => {
    if (score >= 4) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 3) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };
  
  // Generate recommendations
  const generateRecommendations = () => {
    if (!evaluation?.results) return null;
    
    const results = evaluation.results.map(r => ({
      ...r,
      score: editableScores[r.criterion?.id || r.id] || r.score || 0
    }));
    
    const strengths = results.filter(r => r.score === 4);
    const weaknesses = results.filter(r => r.score <= 2);
    const improvementSuggestions = weaknesses.length > 0 ? weaknesses : results.filter(r => r.score === 3);
    
    return { strengths, weaknesses, improvementSuggestions };
  };
  
  const recommendations = generateRecommendations();
  
  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top hint */}
      <div className="bg-yellow-50 border-b border-yellow-200 py-2 px-4">
        <p className="text-sm text-yellow-800 text-center">
          {isRTL ? 'يُفضل أن لا يقل عن 50 كلمة للحصول على تقييم دقيق' : 'It is preferable not to be less than 50 words to get an accurate evaluation'}
        </p>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Administrative Data Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isRTL ? 'البيانات الإدارية' : 'Administrative Data'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'اسم المعلم' : 'Teacher Name'}
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isRTL ? 'أدخل اسم المعلم' : 'Enter teacher name'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'الصف' : 'Class'}
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{isRTL ? 'اختر الصف' : 'Select class'}</option>
                {GRADES.map(g => (
                  <option key={g.key} value={g.key}>
                    {isRTL ? g.ar : g.en}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'المادة' : 'Subject'}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isRTL ? 'أدخل المادة' : 'Enter subject'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'الجزء' : 'Part'}
              </label>
              <div className="flex gap-2">
                {[
                  { key: 'beginning', ar: 'البداية', en: 'Beginning' },
                  { key: 'middle', ar: 'المنتصف', en: 'Middle' },
                  { key: 'end', ar: 'النهاية', en: 'End' }
                ].map(part => (
                  <button
                    key={part.key}
                    type="button"
                    onClick={() => handleLessonPartToggle(part.key)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      lessonParts.includes(part.key)
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isRTL ? part.ar : part.en}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'اسم المشرف' : 'Supervisor Name'}
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isRTL ? 'التاريخ' : 'Date'}
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* ELEOT Environments Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isRTL ? 'بيئات ELEOT المراد تقييمها' : 'ELEOT Environments to be evaluated'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ELEOT_SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleEnvironmentToggle(section.id)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  selectedEnvironments.includes(section.id)
                    ? 'bg-green-50 border-green-500 shadow-md'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    section.id === 'A' ? 'bg-blue-500' :
                    section.id === 'B' ? 'bg-purple-500' :
                    section.id === 'C' ? 'bg-green-500' :
                    section.id === 'D' ? 'bg-yellow-500' :
                    section.id === 'E' ? 'bg-orange-500' :
                    section.id === 'F' ? 'bg-red-500' :
                    'bg-indigo-500'
                  }`}>
                    {section.id}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="font-semibold text-gray-900">
                      {isRTL ? section.label_ar : section.label_en}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {isRTL ? section.label_en : section.label_ar}
                    </div>
                  </div>
                  {selectedEnvironments.includes(section.id) && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Lesson Description Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {isRTL ? 'وصف الحصة:' : 'Lesson Description:'}
            </h2>
            <button
              type="button"
              onClick={handleToggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>{isRTL ? 'إيقاف التسجيل' : 'Stop Recording'}</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>{isRTL ? 'تسجيل صوتي' : 'Voice Input'}</span>
                </>
              )}
            </button>
          </div>
          
          <textarea
            value={lessonDescription}
            onChange={(e) => setLessonDescription(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px] resize-y"
            placeholder={isRTL ? 'أدخل وصف الحصة هنا...' : 'Enter lesson description here...'}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
          
          <p className="text-sm text-gray-500 mt-2">
            {isRTL ? 'يُفضل أن لا يقل عن 50 كلمة للحصول على تقييم دقيق' : 'It is preferable not to be less than 50 words to get an accurate evaluation'}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleAIEvaluation}
            disabled={loading}
            className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{isRTL ? 'جارٍ التقييم...' : 'Evaluating...'}</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>{isRTL ? 'تقييم AI' : 'AI Evaluation'}</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleClearText}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            <span>{isRTL ? 'مسح النص' : 'Clear Text'}</span>
          </button>
          
          {evaluation && (
            <>
              <button
                onClick={handleExportPDF}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                <span>{isRTL ? 'تصدير PDF' : 'Export PDF'}</span>
              </button>
              
              <button
                onClick={handleExportWord}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>{isRTL ? 'تصدير Word' : 'Export Word'}</span>
              </button>
              
              <button
                onClick={handleExportCSV}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                <span>{isRTL ? 'تصدير CSV' : 'Export CSV'}</span>
              </button>
              
              <button
                onClick={handleSendEmail}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                <span>{isRTL ? 'إرسال بالبريد' : 'Send Email'}</span>
              </button>
            </>
          )}
        </div>
        
        {/* Overall Result */}
        {evaluation && (
          <div className="bg-blue-600 text-white rounded-lg p-6 mb-6 text-center">
            <div className="text-2xl font-bold">
              {isRTL ? 'النتيجة الإجمالية:' : 'Overall Result:'} 
              <span className="ml-3 text-4xl">{evaluation.totalScore}/4</span>
            </div>
          </div>
        )}
        
        {/* Evaluation Table */}
        {evaluation && evaluation.results && (
          <div className="space-y-6 mb-6">
            {ELEOT_SECTIONS.filter(s => selectedEnvironments.includes(s.id)).map(section => {
              const sectionResults = evaluation.results.filter(r => 
                (r.criterion?.sectionId || r.environmentId) === section.id
              );
              
              if (sectionResults.length === 0) return null;
              
              return (
                <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-blue-600 text-white px-6 py-3">
                    <h3 className="text-lg font-bold">
                      {section.id}. {isRTL ? section.label_ar : section.label_en}
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            {isRTL ? 'المعيار' : 'Criterion'}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            {isRTL ? 'الدرجة' : 'Score'}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            {isRTL ? 'التبرير' : 'Justification'}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                            {isRTL ? 'نسخ' : 'Copy'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionResults.map((item, idx) => {
                          const criterion = item.criterion || {};
                          const criterionId = criterion.id || item.id;
                          const score = editableScores[criterionId] || item.score || 0;
                          const justification = item.justification || '';
                          
                          return (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {criterionId}: {isRTL ? criterion.label_ar : criterion.label_en}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={score}
                                    onChange={(e) => handleScoreChange(criterionId, e.target.value)}
                                    className={`w-16 px-2 py-1 border-2 rounded text-center font-bold ${getScoreColor(score)}`}
                                  />
                                  {scoreAdjustments[criterionId] && (
                                    <div className="relative group">
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded border border-blue-300">
                                        <Info className="w-3 h-3" />
                                        {isRTL ? 'معدل' : 'Adjusted'}
                                      </span>
                                      <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-full mb-2 hidden group-hover:block z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg`}>
                                        <div className="font-semibold mb-1">
                                          {isRTL ? 'تم التعديل بناءً على السؤال التوضيحي' : 'Adjusted by clarification'}
                                        </div>
                                        <div className="text-gray-300">
                                          {scoreAdjustments[criterionId].reason}
                                        </div>
                                        <div className="mt-1 text-gray-400">
                                          {isRTL ? 'من' : 'From'} {scoreAdjustments[criterionId].original} → {scoreAdjustments[criterionId].adjusted}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <textarea
                                  readOnly
                                  value={justification}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white resize-none"
                                  rows={2}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => copyJustification(justification)}
                                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1"
                                >
                                  <Copy className="w-4 h-4" />
                                  {isRTL ? 'نسخ' : 'Copy'}
                                </button>
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
          </div>
        )}
        
        {/* Recommendations Section */}
        {recommendations && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              {isRTL ? 'التوصيات' : 'Recommendations'}
            </h2>
            
            <p className="text-gray-700 mb-6">
              {isRTL ? 'كل الشكر والتقدير للمعلم' : 'All thanks and appreciation to the teacher'}
            </p>
            
            {/* Strengths */}
            {recommendations.strengths.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-green-700 mb-3">
                  {isRTL ? 'نواحي القوة (العناصر التي حصلت على درجة 4)' : 'Strengths (Elements that received a score of 4)'}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {recommendations.strengths.map((item, idx) => {
                    const criterion = item.criterion || {};
                    return (
                      <li key={idx}>
                        {criterion.id}: {isRTL ? criterion.label_ar : criterion.label_en} - {isRTL ? 'الدرجة:' : 'Score:'} 4/4
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {/* Weaknesses */}
            {recommendations.weaknesses.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-red-700 mb-3">
                  {isRTL ? 'نواحي الضعف (العناصر التي حصلت على درجة 1 أو 2)' : 'Weaknesses (Elements that received a score of 1 or 2)'}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {recommendations.weaknesses.map((item, idx) => {
                    const criterion = item.criterion || {};
                    const score = editableScores[criterion.id] || item.score || 0;
                    return (
                      <li key={idx}>
                        {criterion.id}: {isRTL ? criterion.label_ar : criterion.label_en} - {isRTL ? 'الدرجة:' : 'Score:'} {score}/4
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {/* Improvement Suggestions */}
            {recommendations.improvementSuggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-blue-700 mb-3">
                  {isRTL ? 'اقتراحات التحسين للمعايير التي حصلت على درجة 1 أو 2' : 'Improvement Suggestions for criteria that received a score of 1 or 2'}
                </h3>
                <ul className="list-disc list-inside space-y-3 text-gray-700">
                  {recommendations.improvementSuggestions.map((item, idx) => {
                    const criterion = item.criterion || {};
                    const score = editableScores[criterion.id] || item.score || 0;
                    return (
                      <li key={idx}>
                        <strong>{criterion.id}: {isRTL ? criterion.label_ar : criterion.label_en}</strong>
                        <p className="mt-1 text-sm text-gray-600">
                          {isRTL 
                            ? 'اقتراحات التحسين: ركز على تطوير هذا الجانب من خلال...'
                            : 'Improvement suggestions: Focus on developing this aspect through...'
                          }
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {/* Save Visit Button */}
        {evaluation && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSaveVisit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isRTL ? 'تم الحفظ!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isRTL ? 'حفظ الزيارة' : 'Save Visit'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>
      
      {/* Clarification Questions Overlay */}
      {showClarification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-yellow-400 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>❓</span>
                  {isRTL ? 'أسئلة توضيحية' : 'Clarification Questions'}
                </h3>
                <button
                  onClick={() => setShowClarification(false)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                {isRTL 
                  ? 'لضمان دقة التقييم، يرجى الإجابة على الأسئلة التالية:'
                  : 'To ensure the accuracy of the evaluation, please answer the following questions:'
                }
              </p>
              
              <div className="space-y-6">
                {CLARIFICATION_QUESTIONS.map((question, idx) => (
                  <div key={question.key} className="bg-yellow-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-bold text-gray-900 mb-2">
                      {isRTL ? question.title_ar : question.title_en}
                    </h4>
                    <p className="text-gray-700 mb-3">
                      {isRTL ? question.question_ar : question.question_en}
                    </p>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className="flex items-center gap-2 p-2 hover:bg-yellow-100 rounded cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`clarification_${question.key}`}
                            value={isRTL ? option.ar : option.en}
                            onChange={(e) => setClarificationAnswers(prev => ({
                              ...prev,
                              [question.key]: e.target.value
                            }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-gray-700">
                            {isRTL ? option.ar : option.en}
                            {!isRTL && <span className="text-gray-500 ml-2">({option.ar})</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmitClarification}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isRTL ? 'إرسال الإجابات والمتابعة' : 'Submit Answers and Continue'}
                </button>
                <button
                  onClick={handleSkipClarification}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {isRTL ? 'تخطي والمتابعة' : 'Skip and Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationPage;

/**
 * Call AI evaluation via secure Vercel serverless function
 * All OpenAI API calls happen server-side to keep API keys secure
 */
export const evaluateWithAI = async (data) => {
  const {
    lesson_description,
    teacher_name,
    subject,
    grade,
    segment,
    visit_date,
    lang = 'ar',
  } = data;

  // Validate required fields
  if (!lesson_description || !teacher_name || !subject) {
    throw new Error('الحقول المطلوبة: وصف الدرس، اسم المعلم، المادة');
  }

  try {
    // Call Vercel serverless function
    const response = await fetch('/api/ai-evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lesson_description,
        teacher_name,
        subject,
        grade: grade || '',
        segment: segment || '',
        visit_date: visit_date || '',
        lang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('AI Evaluation error:', error);
    throw error;
  }
};


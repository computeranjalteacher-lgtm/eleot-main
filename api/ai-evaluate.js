/**
 * Vercel Serverless Function for AI Evaluation
 * This function handles OpenAI API calls server-side to keep API keys secure
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Validate OpenAI API key exists
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('Missing OPENAI_API_KEY on server');
    return res.status(500).json({ 
      error: 'Missing OPENAI_API_KEY on server. Please configure it in Vercel Environment Variables.' 
    });
  }

  // Validate request body
  const {
    lesson_description,
    teacher_name,
    subject,
    grade,
    segment,
    visit_date,
    lang = 'ar',
    clarifications = {}, // New: clarification answers
    selected_environments = [], // New: selected ELEOT environments
  } = req.body;

  // Required fields validation
  if (!lesson_description || !teacher_name || !subject) {
    return res.status(400).json({ 
      error: 'Missing required fields: lesson_description, teacher_name, subject' 
    });
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(lang, clarifications);

  // Build user prompt
  const userPrompt = buildUserPrompt({
    lesson_description,
    teacher_name,
    subject,
    grade: grade || '',
    segment: segment || '',
    visit_date: visit_date || '',
    clarifications,
    selected_environments,
  }, lang);

  try {
    // Call OpenAI API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0, // Deterministic output
        max_tokens: 4000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('OpenAI API error:', errorMessage);
      
      return res.status(response.status >= 500 ? 500 : 400).json({ 
        error: `OpenAI API error: ${errorMessage}` 
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ 
        error: 'Invalid response format from OpenAI API' 
      });
    }

    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Response is not valid JSON');
      }
    }

    // Return result in expected format
    return res.status(200).json(result);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('OpenAI API request timeout');
      return res.status(504).json({ 
        error: 'Request timeout. The AI evaluation took too long.' 
      });
    }

    console.error('AI Evaluation error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error during AI evaluation' 
    });
  }
}

/**
 * Build system prompt for ELEOT evaluation
 * Now includes clarification handling instructions
 */
function buildSystemPrompt(lang = 'ar', clarifications = {}) {
  const hasClarifications = clarifications && Object.keys(clarifications).length > 0;
  
  const clarificationInstructions = hasClarifications
    ? (lang === 'ar'
        ? `\n\n⚠️ تعليمات مهمة حول الأسئلة التوضيحية:\n- الأسئلة التوضيحية هي حقائق مؤكدة من قبل المقيّم.\n- يجب عليك تعديل الدرجات بناءً على هذه الحقائق.\n- لا تتجاهل الإجابات السلبية.\n- لا تعطي درجات كاملة إذا كانت الإجابات التوضيحية تتعارض مع الوصف.\n- استخدم الإجابات التوضيحية كأدلة إضافية لتعديل درجاتك.`
        : `\n\n⚠️ Important Instructions on Clarification Questions:\n- Clarification answers are confirmed facts provided by the evaluator.\n- You MUST adjust scores based on these facts.\n- You MUST NOT ignore negative clarifications.\n- You MUST NOT give full scores if clarifications contradict the description.\n- Use clarification answers as additional evidence to adjust your scores.`)
    : '';
  
  if (lang === 'ar') {
    return `أنت خبير في تقييم الملاحظات الصفية باستخدام معايير ELEOT 2.0.
قم بتقييم الملاحظة المقدمة وإرجاع النتائج بتنسيق JSON صحيح.
يجب أن تكون النتيجة على الشكل التالي:
{
  "criteria": [
    {
      "id": "A1",
      "score": 4,
      "justification": "التبرير بالعربية"
    }
  ],
  "recommendations": "التوصيات العامة بصيغة HTML",
  "totalScore": 3.5,
  "used_clarifications": ["equal_access", "fair_treatment"]
}
استخدم درجات من 1 إلى 4 لكل معيار.${clarificationInstructions}`;
  } else {
    return `You are an expert in evaluating classroom observations using ELEOT 2.0 standards.
Evaluate the provided observation and return results in valid JSON format.
The result should be in the following format:
{
  "criteria": [
    {
      "id": "A1",
      "score": 4,
      "justification": "Justification in English"
    }
  ],
  "recommendations": "Overall recommendations in HTML format",
  "totalScore": 3.5,
  "used_clarifications": ["equal_access", "fair_treatment"]
}
Use scores from 1 to 4 for each criterion.${clarificationInstructions}`;
  }
}

/**
 * Build user prompt for ELEOT evaluation
 * Now includes clarification answers
 */
function buildUserPrompt(data, lang = 'ar') {
  const {
    lesson_description,
    teacher_name,
    subject,
    grade,
    segment,
    visit_date,
    clarifications = {},
    selected_environments = [],
  } = data;

  // Build clarification summary
  const clarificationSummary = buildClarificationSummary(clarifications, lang);
  
  const environmentsList = selected_environments.length > 0 
    ? selected_environments.join(', ')
    : 'A, B, C, D, E, F, G';

  if (lang === 'ar') {
    return `قم بتقييم الملاحظة التالية:

المعلم: ${teacher_name}
المادة: ${subject}
الصف: ${grade || 'غير محدد'}
الجزء: ${segment || 'غير محدد'}
التاريخ: ${visit_date || 'غير محدد'}

وصف الحصة:
${lesson_description}
${clarificationSummary}

قم بتقييم البيئات المحددة (${environmentsList}) وأعطِ درجات وتبريرات لكل معيار في هذه البيئات.
${Object.keys(clarifications).length > 0 ? '⚠️ تأكد من استخدام الإجابات التوضيحية أعلاه في تقييمك.' : ''}`;
  } else {
    return `Evaluate the following observation:

Teacher: ${teacher_name}
Subject: ${subject}
Grade: ${grade || 'Not specified'}
Segment: ${segment || 'Not specified'}
Date: ${visit_date || 'Not specified'}

Lesson Description:
${lesson_description}
${clarificationSummary}

Evaluate the selected environments (${environmentsList}) and provide scores and justifications for each criterion in these environments.
${Object.keys(clarifications).length > 0 ? '⚠️ Make sure to use the clarification answers above in your evaluation.' : ''}`;
  }
}

/**
 * Build human-readable clarification summary
 */
function buildClarificationSummary(clarifications, lang = 'ar') {
  if (!clarifications || Object.keys(clarifications).length === 0) {
    return '';
  }

  const questionMap = {
    'equal_access': {
      ar: 'الوصول المتساوي',
      en: 'Equal Access',
    },
    'fair_treatment': {
      ar: 'المعاملة العادلة',
      en: 'Fair Treatment',
    },
    'respect_empathy': {
      ar: 'الاحترام والتعاطف',
      en: 'Respect and Empathy',
    },
    'challenging_activities': {
      ar: 'الأنشطة الصعبة',
      en: 'Challenging Activities',
    },
    'intellectual_risk': {
      ar: 'المخاطرة الفكرية',
      en: 'Intellectual Risk-taking',
    },
  };

  const lines = [];
  if (lang === 'ar') {
    lines.push('\n\n📋 الأسئلة التوضيحية والإجابات:');
    Object.entries(clarifications).forEach(([key, value]) => {
      const questionLabel = questionMap[key]?.ar || key;
      lines.push(`- ${questionLabel}: ${value}`);
    });
  } else {
    lines.push('\n\n📋 Clarification Questions and Answers:');
    Object.entries(clarifications).forEach(([key, value]) => {
      const questionLabel = questionMap[key]?.en || key;
      lines.push(`- ${questionLabel}: ${value}`);
    });
  }

  return lines.join('\n');
}


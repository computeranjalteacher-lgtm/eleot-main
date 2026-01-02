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
  } = req.body;

  // Required fields validation
  if (!lesson_description || !teacher_name || !subject) {
    return res.status(400).json({ 
      error: 'Missing required fields: lesson_description, teacher_name, subject' 
    });
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(lang);

  // Build user prompt
  const userPrompt = buildUserPrompt({
    lesson_description,
    teacher_name,
    subject,
    grade: grade || '',
    segment: segment || '',
    visit_date: visit_date || '',
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
 */
function buildSystemPrompt(lang = 'ar') {
  if (lang === 'ar') {
    return `أنت خبير في تقييم الملاحظات الصفية باستخدام معايير ELEOT 2.0.
قم بتقييم الملاحظة المقدمة وإرجاع النتائج بتنسيق JSON صحيح.
يجب أن تكون النتيجة على الشكل التالي:
{
  "environments": [
    {
      "env_code": "A",
      "env_score": 3.5,
      "justification_ar": "التبرير بالعربية",
      "evidence_ar": "الأدلة بالعربية"
    }
  ],
  "overall_recommendations_ar": "التوصيات العامة"
}
استخدم درجات من 1 إلى 4 لكل بيئة.`;
  } else {
    return `You are an expert in evaluating classroom observations using ELEOT 2.0 standards.
Evaluate the provided observation and return results in valid JSON format.
The result should be in the following format:
{
  "environments": [
    {
      "env_code": "A",
      "env_score": 3.5,
      "justification_en": "Justification in English",
      "evidence_en": "Evidence in English"
    }
  ],
  "overall_recommendations_en": "Overall recommendations"
}
Use scores from 1 to 4 for each environment.`;
  }
}

/**
 * Build user prompt for ELEOT evaluation
 */
function buildUserPrompt(data, lang = 'ar') {
  const {
    lesson_description,
    teacher_name,
    subject,
    grade,
    segment,
    visit_date,
  } = data;

  if (lang === 'ar') {
    return `قم بتقييم الملاحظة التالية:

المعلم: ${teacher_name}
المادة: ${subject}
الصف: ${grade || 'غير محدد'}
الجزء: ${segment || 'غير محدد'}
التاريخ: ${visit_date || 'غير محدد'}

وصف الحصة:
${lesson_description}

قم بتقييم جميع البيئات (A, B, C, D, E, F, G) وأعطِ درجات وتبريرات لكل بيئة.`;
  } else {
    return `Evaluate the following observation:

Teacher: ${teacher_name}
Subject: ${subject}
Grade: ${grade || 'Not specified'}
Segment: ${segment || 'Not specified'}
Date: ${visit_date || 'Not specified'}

Lesson Description:
${lesson_description}

Evaluate all environments (A, B, C, D, E, F, G) and provide scores and justifications for each environment.`;
  }
}


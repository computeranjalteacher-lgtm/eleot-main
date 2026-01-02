# إعداد متغيرات البيئة (Environment Variables)

## الملف المطلوب

أنشئ ملف `.env.local` في جذر المشروع (نفس مكان `package.json`) مع المحتوى التالي:

```env
VITE_SUPABASE_URL=ضع_رابط_supabase_هنا
VITE_SUPABASE_ANON_KEY=ضع_anon_key_هنا
OPENAI_API_KEY=ضع_مفتاح_openai_هنا
```

## كيفية الحصول على القيم

### 1. Supabase URL و Anon Key

1. اذهب إلى [Supabase Dashboard](https://app.supabase.com)
2. اختر مشروعك أو أنشئ مشروع جديد
3. اذهب إلى **Settings** → **API**
4. انسخ:
   - **Project URL** → ضعه في `VITE_SUPABASE_URL`
   - **anon public** key → ضعه في `VITE_SUPABASE_ANON_KEY`

### 2. OpenAI API Key

1. اذهب إلى [OpenAI Platform](https://platform.openai.com)
2. سجل الدخول أو أنشئ حساب
3. اذهب إلى **API Keys**
4. انقر على **Create new secret key**
5. انسخ المفتاح → ضعه في `OPENAI_API_KEY`

## ملاحظات مهمة

- ✅ ملف `.env.local` موجود في `.gitignore` ولن يُرفع إلى Git
- ✅ المتغيرات التي تبدأ بـ `VITE_` متاحة في الكود عبر `import.meta.env`
- ✅ بعد إضافة القيم، أعد تشغيل خادم التطوير (`npm run dev`)

## التحقق من الإعداد

بعد إضافة القيم، افتح Console في المتصفح وتحقق من عدم وجود رسائل خطأ تتعلق بـ Supabase configuration.

## استخدام المتغيرات في الكود

### Supabase
```javascript
// src/services/supabase.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### OpenAI API Key
```javascript
// يمكن استخدامه في Netlify Functions أو مباشرة
const openaiKey = import.meta.env.OPENAI_API_KEY;
```

## استكشاف الأخطاء

إذا ظهرت رسالة خطأ:
- ✅ تأكد من أن الملف اسمه `.env.local` (وليس `.env`)
- ✅ تأكد من أن الملف في جذر المشروع
- ✅ أعد تشغيل خادم التطوير بعد إضافة القيم
- ✅ تحقق من عدم وجود مسافات إضافية في القيم


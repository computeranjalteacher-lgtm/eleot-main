# Smart Observation Tool (ELEOT) - Web Application

A professional web application for evaluating classroom observations using the ELEOT framework.

## Features

- 🔐 Google OAuth Authentication
- 📝 Observation Evaluation with AI Analysis
- 💾 Save observations to user account
- 📊 Visit History and Comparison
- 📄 Export to PDF, Word, or Copy
- 🌐 Full Arabic RTL Support
- 📱 Mobile Responsive Design

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your Supabase credentials in `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** `OPENAI_API_KEY` should NOT be in `.env.local` for local development. It's only used server-side in Vercel.

### 3. Supabase Setup

1. Create a Supabase project at [Supabase Dashboard](https://app.supabase.com)
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 4. Run Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 5. Vercel Deployment

#### Local Development with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Run locally:
```bash
vercel dev
```

#### Production Deployment

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add Environment Variables in Vercel:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `OPENAI_API_KEY` - Your OpenAI API key (server-side only)

**Security Note:** `OPENAI_API_KEY` is only used in the serverless function (`api/ai-evaluate.js`) and is never exposed to the client. Never add it to client-side environment variables.

## Project Structure

```
eleot-web-app/
├── src/
│   ├── components/          # Reusable components
│   ├── config/             # Configuration files
│   ├── pages/              # Main pages
│   ├── services/           # API and service functions
│   ├── utils/              # Utility functions
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Usage

1. **Sign In**: Use Google OAuth to sign in
2. **Create Observation**: 
   - Enter teacher name and date
   - Select ELEOT environments to evaluate
   - Paste or type observation notes
   - Click "Evaluate"
3. **View Results**: See scores, justifications, and recommendations
4. **Save**: Save observation to your account
5. **Export**: Export to PDF, Word, or copy to clipboard
6. **Compare**: Compare two visits side-by-side

## Technologies

- React 18
- Vite
- TailwindCSS
- Firebase (Authentication & Firestore)
- jsPDF (PDF export)
- React Router

## License

MIT


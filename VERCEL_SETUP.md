# Vercel Deployment Setup Guide

## Environment Variables Setup

### Local Development

1. Create `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** `OPENAI_API_KEY` is NOT needed in `.env.local` for local development. It's only used server-side.

### Vercel Production

1. Go to your project in [Vercel Dashboard](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `OPENAI_API_KEY` | Your OpenAI API key | Production, Preview, Development |

**Security:** `OPENAI_API_KEY` is only accessible server-side in `api/ai-evaluate.js` and is never exposed to the browser.

## Running Locally with Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
vercel link
```

4. Run development server:
```bash
vercel dev
```

This will:
- Start the Vite dev server for the frontend
- Run serverless functions locally
- Use environment variables from `.env.local` and Vercel

## API Route

The AI evaluation endpoint is available at:
- **Local:** `http://localhost:3000/api/ai-evaluate`
- **Production:** `https://your-domain.vercel.app/api/ai-evaluate`

The endpoint:
- Accepts POST requests with JSON body
- Validates required fields
- Calls OpenAI API server-side
- Returns evaluation results in JSON format

## Troubleshooting

### "Missing OPENAI_API_KEY on server"
- Make sure `OPENAI_API_KEY` is set in Vercel Environment Variables
- Redeploy after adding environment variables
- For local dev, use `vercel dev` (not `npm run dev`) to access server-side env vars

### API Route Not Found
- Ensure `api/ai-evaluate.js` exists in the project root
- Check `vercel.json` configuration
- Verify the route is accessible at `/api/ai-evaluate`


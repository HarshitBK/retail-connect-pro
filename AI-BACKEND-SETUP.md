# AI Test Generation — Local Backend (no Supabase schema changes)

The AI-based MCQ flow uses a **local Node.js API + MongoDB** so you don't need to change Lovable's Supabase schema.

## 1. MongoDB

Use your existing cluster. In `server/.env` set:

- `MONGODB_URI=mongodb+srv://abk:YOUR_PASSWORD@cluster0.hxhq6q4.mongodb.net/retail-connect?retryWrites=true&w=majority`  
  (Replace `YOUR_PASSWORD` with your real DB password.)

The app uses database `retail-connect` and collections:

- `test_snapshots` — per-test question bank, approved IDs, questions to show
- `attempt_delivered` — per-attempt randomized questions

## 2. OpenAI API key

**Do not commit your API key.** Use environment variables only.

In `server/.env`:

- `OPENAI_API_KEY=sk-your-key-here` (paste your key from platform.openai.com; **never commit it**)

A template `server/.env` exists with placeholders; replace `your-openai-key-here` and `YOUR_MONGODB_PASSWORD` with your real values.

## 3. Run the backend

```bash
cd server
cp .env.example .env
# Edit .env: set OPENAI_API_KEY and MONGODB_URI (with real password)
npm install
npm run dev
```

API runs at **http://localhost:3001** by default.

## 4. Frontend

The app calls the AI API at `VITE_AI_API_URL`. Default is `http://localhost:3001`.

To use a different URL, add to your **frontend** `.env`:

- `VITE_AI_API_URL=http://localhost:3001`

Then run the frontend as usual (`npm run dev`). Generate MCQs and create/edit tests; snapshots and delivered questions are stored in MongoDB, not Supabase.

## Summary

- **Supabase**: unchanged; still used for auth, `skill_tests` (basic fields + `questions` list), and `skill_test_attempts` (no `delivered_questions` column).
- **Local API**: PDF/PPTX → text → OpenAI → MCQs; stores question banks and per-attempt delivered sets in MongoDB.

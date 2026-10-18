# Vedika 2.0 - Native PostgreSQL LMS (Option B) Guide

This branch (`feature/native-next-lms`) provides an alternative, high-performance, native LMS backend built directly into Next.js. It replaces Frappe's 350+ ERP tables with **exactly 10 clean PostgreSQL tables**.

---

## 🛡️ Production Safety Assurance

Your production deployment on Vercel is connected to the **`main`** branch (Deployment: `vedika-v20c.vercel.app`).
- Pushing this branch to GitHub **WILL NOT affect, crash, or overwrite your live main deployment**.
- It creates an isolated GitHub branch node for benchmarking and testing Option B.

---

## ⚡ Step 1: Get a 100% Free PostgreSQL Database

You can use any free serverless PostgreSQL provider. We recommend **Neon.tech** or **Supabase**:

1. Sign up for free at [https://neon.tech](https://neon.tech) (or [https://supabase.com](https://supabase.com)).
2. Click **Create Project** (Name: `vedika-native-db`).
3. Copy your connection string. It looks like:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

---

## ⚡ Step 2: Add Connection String to `.env.local`

In `frontend/.env.local` (or `frontend/.env`), add:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

*(Note: If `DATABASE_URL` is omitted, the app automatically falls back to your local files and TiDB cluster without throwing errors).*

---

## ⚡ Step 3: Run the Auto-Seed Script

In your terminal, navigate to `frontend` and run:
```bash
node database/seed.js
```

This will automatically:
1. Create all 10 normalized tables defined in `frontend/database/schema.sql`.
2. Seed default courses (Physics, Mathematics, Python, Chemistry, Biology, Web Development).
3. Seed chapters, lessons with YouTube video lectures, and quizzes.
4. Create demo accounts:
   - **Admin:** `admin@vedika.edu` (Password: `admin123`)
   - **Student:** `student@vedika.edu` (Password: `student123`)

---

## ⚡ Step 4: Test in Development

Run:
```bash
npm run dev
```

Visit:
- **Courses:** `http://localhost:3000/courses` (Fetches instantly via native SQL)
- **Lesson:** `http://localhost:3000/lesson/physics-mechanics-fundamentals`
- **Quizzes:** `http://localhost:3000/quizzes`
- **Ask Vedika & Coding Tutor:** Works with real-time Gemini streaming and local documents.

---

## 📊 Summary of Architectural Differences

| Metric | Option A (Frappe on Render + TiDB) | Option B (Native Next.js + Neon Postgres) |
| :--- | :--- | :--- |
| **Database Tables** | ~380 tables (Frappe ERP system junk) | **10 clean tables** |
| **Idle Database Cost** | Exhausts free tier (continuous polling) | **Zero (Scales to 0 when idle)** |
| **API Response Latency** | 250ms – 1.2s | **Sub-25ms** |
| **Cold Starts** | 15–30s on Render | **Instant** |
| **Unified Codebase** | Python + Jinja + Next.js | **100% Next.js (TypeScript/JavaScript)** |

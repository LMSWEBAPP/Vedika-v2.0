-- ==============================================================================
-- VEDIKA 2.0 - NATIVE POSTGRESQL LMS SCHEMA
-- Replaces 350+ Frappe ERP tables with exactly 10 clean, high-performance tables.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional: Vector extension for RAG embeddings (supported by Neon & Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'super_admin')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    instructor_name VARCHAR(150),
    description TEXT,
    image_url TEXT,
    status VARCHAR(30) DEFAULT 'Published' CHECK (status IN ('Draft', 'Published', 'Archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CHAPTERS (Course Modules)
CREATE TABLE IF NOT EXISTS course_chapters (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. LESSONS (Video & Reading content)
CREATE TABLE IF NOT EXISTS course_lessons (
    id VARCHAR(100) PRIMARY KEY,
    chapter_id VARCHAR(100) REFERENCES course_chapters(id) ON DELETE CASCADE,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_body TEXT,
    youtube_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ENROLLMENTS
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 6. BATCHES / COHORTS
CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    seats INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
    id VARCHAR(100) PRIMARY KEY,
    lesson_id VARCHAR(100) REFERENCES course_lessons(id) ON DELETE SET NULL,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    passing_score INT DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id VARCHAR(100) REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INT NOT NULL,
    explanation TEXT
);

-- 9. QUIZ SUBMISSIONS
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id VARCHAR(100) REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ASSIGNMENTS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(100) PRIMARY KEY,
    course_id VARCHAR(100) REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id VARCHAR(100) REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT,
    text_content TEXT,
    score INT,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR INSTANT SUB-10MS READS
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_chapters_course ON course_chapters(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter ON course_lessons(chapter_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sub_user ON quiz_submissions(user_id, quiz_id);

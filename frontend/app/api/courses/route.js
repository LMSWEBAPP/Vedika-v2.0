import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/serverAuth';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'courses.json');

const DEFAULT_COURSES = [
  { id: '1', title: 'Python Programming', instructor: 'Administrator', category: 'Professionals', enrolled: 37, status: 'Published', date: 'Jan 11, 2023' },
  { id: '2', title: 'Data Structures & Algorithms', instructor: 'John Samoh', category: 'Collaborate', enrolled: 25, status: 'Published', date: 'Jan 11, 2023' },
  { id: '3', title: 'Advanced Machine Learning', instructor: 'John Smiths', category: 'Collaborate', enrolled: 12, status: 'Published', date: 'Jan 11, 2023' },
  { id: '4', title: 'Web Development with Next.js', instructor: 'John Sarith', category: 'Collaborate', enrolled: 18, status: 'Draft', date: 'Jan 11, 2023' },
];

function readCoursesFromFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_COURSES, null, 2), 'utf-8');
      return DEFAULT_COURSES;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : DEFAULT_COURSES;
  } catch (e) {
    console.error('[API/Courses] Error reading courses file:', e.message);
    return DEFAULT_COURSES;
  }
}

function writeCoursesToFile(courses) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), 'utf-8');
  } catch (e) {
    console.error('[API/Courses] Error writing courses file:', e.message);
  }
}

let memoryCoursesCache = null;
let lastCoursesCacheTime = 0;
const COURSES_CACHE_TTL_MS = 60 * 1000; // 60s in-memory cache

// GET: Return all courses
export async function GET() {
  const now = Date.now();
  if (memoryCoursesCache && (now - lastCoursesCacheTime < COURSES_CACHE_TTL_MS)) {
    return NextResponse.json({ success: true, courses: memoryCoursesCache, cached: true });
  }

  try {
    const [dbCourses] = await pool.query(`
      SELECT name, title, category, status, published, short_introduction, creation, image
      FROM test.\`tabLMS Course\`
      ORDER BY creation DESC
    `);

    if (dbCourses && dbCourses.length > 0) {
      // Fetch lesson counts per course
      const [lessonCounts] = await pool.query(`
        SELECT course, COUNT(*) as count
        FROM test.\`tabCourse Lesson\`
        GROUP BY course
      `);
      const countMap = {};
      (lessonCounts || []).forEach(lc => {
        countMap[lc.course] = lc.count;
      });

      const courses = dbCourses.map(c => ({
        id: c.name,
        name: c.name,
        title: c.title,
        instructor: 'Administrator',
        category: c.category || 'General',
        enrolled: 25,
        lessonsCount: countMap[c.name] || 0,
        status: c.published ? 'Published' : (c.status || 'Draft'),
        description: c.short_introduction || '',
        image: c.image || null,
        date: c.creation ? new Date(c.creation).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 11, 2024'
      }));

      // Persist to local cache for instant offline fallback
      writeCoursesToFile(courses);
      memoryCoursesCache = courses;
      lastCoursesCacheTime = Date.now();
      return NextResponse.json({ success: true, courses });
    }
  } catch (err) {
    console.warn('[API/Courses] Database query notice, using local file cache:', err.message);
  }

  const courses = readCoursesFromFile();
  memoryCoursesCache = courses;
  lastCoursesCacheTime = Date.now();
  return NextResponse.json({ success: true, courses });
}

// POST: Add new course or sync multiple courses (Admin only)
export async function POST(req) {
  const auth = await authenticateRequest(req, { requireAdmin: true });
  if (auth.response) return auth.response;

  memoryCoursesCache = null;
  try {
    const body = await req.json();
    let courses = readCoursesFromFile();

    if (body.courses && Array.isArray(body.courses)) {
      // Bulk sync or replace
      courses = body.courses;
      writeCoursesToFile(courses);
      return NextResponse.json({ success: true, courses });
    }

    if (body.course) {
      const newCourse = {
        ...body.course,
        id: body.course.id || Date.now().toString(),
        status: body.course.status || 'Published',
        date: body.course.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      // Remove any existing course with same ID
      courses = courses.filter(c => String(c.id) !== String(newCourse.id));
      courses.unshift(newCourse);
      writeCoursesToFile(courses);
      return NextResponse.json({ success: true, course: newCourse });
    }

    return NextResponse.json({ error: 'Invalid course payload' }, { status: 400 });
  } catch (e) {
    console.error('[API/Courses] POST error:', e.message);
    return NextResponse.json({ error: 'Failed to save course.' }, { status: 500 });
  }
}

// PUT: Update an existing course (Admin only)
export async function PUT(req) {
  const auth = await authenticateRequest(req, { requireAdmin: true });
  if (auth.response) return auth.response;

  memoryCoursesCache = null;
  try {
    const body = await req.json();
    const { id, course } = body;
    if (!id || !course) {
      return NextResponse.json({ error: 'Missing course id or body' }, { status: 400 });
    }

    let courses = readCoursesFromFile();
    const strId = String(id);
    let found = false;
    courses = courses.map(c => {
      if (String(c.id) === strId) {
        found = true;
        return { ...c, ...course, id: c.id };
      }
      return c;
    });

    if (!found) {
      courses.unshift({ ...course, id: strId });
    }

    writeCoursesToFile(courses);
    return NextResponse.json({ success: true, course: { ...course, id: strId } });
  } catch (e) {
    console.error('[API/Courses] PUT error:', e.message);
    return NextResponse.json({ error: 'Failed to update course.' }, { status: 500 });
  }
}

// DELETE: Delete a course by ID (Admin only)
export async function DELETE(req) {
  const auth = await authenticateRequest(req, { requireAdmin: true });
  if (auth.response) return auth.response;

  memoryCoursesCache = null;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing course id' }, { status: 400 });
    }

    const strId = String(id);
    let courses = readCoursesFromFile();
    courses = courses.filter(c => String(c.id) !== strId);
    writeCoursesToFile(courses);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[API/Courses] DELETE error:', e.message);
    return NextResponse.json({ error: 'Failed to delete course.' }, { status: 500 });
  }
}

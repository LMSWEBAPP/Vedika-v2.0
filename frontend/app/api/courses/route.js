import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { authenticateRequest } from '@/lib/serverAuth';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'courses.json');

const DEFAULT_COURSES = [
  {
    id: "physics-mechanics-fundamentals",
    name: "physics-mechanics-fundamentals",
    title: "Physics: Mechanics & Energy",
    instructor: "Dr. Angela Thorne",
    category: "Physics",
    enrolled: 38,
    lessonsCount: 4,
    status: "Published",
    description: "Master classical mechanics, 1D motion, Newton's laws of motion, conservation of mechanical energy, and universal gravitation.",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Aug 15, 2026"
  },
  {
    id: "calculus-advanced-mathematics",
    name: "calculus-advanced-mathematics",
    title: "Mathematics: Calculus & Analysis",
    instructor: "Prof. David Miller",
    category: "Maths",
    enrolled: 42,
    lessonsCount: 4,
    status: "Published",
    description: "Comprehensive journey through differential and integral calculus, limits, continuity, rate of change, and geometric area integrals.",
    image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Aug 14, 2026"
  },
  {
    id: "general-physical-chemistry",
    name: "general-physical-chemistry",
    title: "Chemistry: Atoms, Bonds & Reactions",
    instructor: "Dr. Maya Lin",
    category: "Chemistry",
    enrolled: 35,
    lessonsCount: 4,
    status: "Published",
    description: "Investigate quantum electron orbitals, ionic and covalent bonding, stoichiometric reaction yields, and acid-base titration equilibria.",
    image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Aug 12, 2026"
  },
  {
    id: "cellular-biology-genetics",
    name: "cellular-biology-genetics",
    title: "Biology: Cells & Molecular Genetics",
    instructor: "Dr. Sarah Jenkins",
    category: "Biology",
    enrolled: 40,
    lessonsCount: 4,
    status: "Published",
    description: "Explore living systems from cellular organelles and ATP cellular respiration to DNA replication, central dogma, and Mendelian inheritance.",
    image: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Aug 10, 2026"
  },
  {
    id: "python-programming-essentials",
    name: "python-programming-essentials",
    title: "Python Programming Essentials",
    instructor: "Alex Mercer",
    category: "Python",
    enrolled: 65,
    lessonsCount: 4,
    status: "Published",
    description: "From beginner syntax to structured programming: master dynamic typing, collections, conditionals, iteration, and reusable modular functions.",
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Jul 28, 2026"
  },
  {
    id: "modern-web-development-html-css",
    name: "modern-web-development-html-css",
    title: "Web Development: HTML & CSS",
    instructor: "Elena Rostova",
    category: "Web Development",
    enrolled: 52,
    lessonsCount: 4,
    status: "Published",
    description: "Learn fundamental front-end web engineering with semantic HTML5 elements, accessible forms, modern CSS box models, and responsive Flexbox.",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    date: "Jul 25, 2026"
  }
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
    return (Array.isArray(parsed) && parsed.length > 0) ? parsed : DEFAULT_COURSES;
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
    const dbPromise = pool.query(`
      SELECT name, title, category, status, published, short_introduction, creation, image
      FROM test.\`tabLMS Course\`
      ORDER BY creation DESC
    `);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 1000));
    const [dbCourses] = await Promise.race([dbPromise, timeoutPromise]);

    if (dbCourses && dbCourses.length > 0) {
      // Fetch lesson counts per course
      const [lessonCounts] = await Promise.race([
        pool.query(`
          SELECT course, COUNT(*) as count
          FROM test.\`tabCourse Lesson\`
          GROUP BY course
        `),
        timeoutPromise
      ]).catch(() => [[]]);
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

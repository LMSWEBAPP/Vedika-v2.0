// database/seed.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('\n❌ ERROR: DATABASE_URL environment variable is missing.');
  console.error('Please add DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" to frontend/.env.local\n');
  process.exit(1);
}

const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false }
});

const DEFAULT_COURSES = [
  {
    id: "physics-mechanics-fundamentals",
    title: "Physics: Mechanics & Energy",
    category: "Physics",
    instructor_name: "Dr. Angela Thorne",
    description: "Master classical mechanics, 1D motion, Newton's laws of motion, conservation of mechanical energy, and universal gravitation.",
    image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    status: "Published",
    chapters: [
      {
        id: "phys-ch1-kinematics",
        title: "Chapter 1: Kinematics & 1D Motion",
        sort_order: 1,
        lessons: [
          {
            id: "phys-les-1-1",
            title: "Position, Velocity & Acceleration",
            youtube_url: "https://www.youtube.com/watch?v=ZM8ECpBuQYE",
            sort_order: 1,
            content_body: "### Kinematics Fundamentals\nKinematics describes the motion of points, bodies, and systems of bodies without considering the forces that cause them to move.\n\n$$\\vec{v} = \\frac{d\\vec{x}}{dt}, \\quad \\vec{a} = \\frac{d\\vec{v}}{dt}$$\n\nKey takeaways:\n- Displacement is a vector quantity.\n- Speed is scalar; velocity is vector."
          },
          {
            id: "phys-les-1-2",
            title: "Constant Acceleration Equations",
            youtube_url: "https://www.youtube.com/watch?v=o04_vYxHwEE",
            sort_order: 2,
            content_body: "### The Big Four Kinematic Equations\nWhen acceleration is constant ($a = \\text{const}$):\n\n1. $v = v_0 + at$\n2. $\\Delta x = v_0 t + \\frac{1}{2}at^2$\n3. $v^2 = v_0^2 + 2a\\Delta x$\n4. $\\Delta x = \\frac{v + v_0}{2} t$"
          }
        ]
      },
      {
        id: "phys-ch2-newton-laws",
        title: "Chapter 2: Newton's Laws of Motion",
        sort_order: 2,
        lessons: [
          {
            id: "phys-les-2-1",
            title: "Inertia, Force & F = ma",
            youtube_url: "https://www.youtube.com/watch?v=kKKM8Y-u7ds",
            sort_order: 1,
            content_body: "### Newton's Three Laws\n1. **First Law:** An object at rest remains at rest unless acted upon by a net external force.\n2. **Second Law:** $\\sum \\vec{F} = m\\vec{a}$\n3. **Third Law:** For every action, there is an equal and opposite reaction."
          }
        ]
      }
    ]
  },
  {
    id: "calculus-advanced-mathematics",
    title: "Mathematics: Calculus & Analysis",
    category: "Maths",
    instructor_name: "Prof. David Miller",
    description: "Comprehensive journey through differential and integral calculus, limits, continuity, rate of change, and geometric area integrals.",
    image_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    status: "Published",
    chapters: [
      {
        id: "calc-ch1-limits",
        title: "Chapter 1: Limits & Continuity",
        sort_order: 1,
        lessons: [
          {
            id: "calc-les-1-1",
            title: "The Formal Definition of a Limit",
            youtube_url: "https://www.youtube.com/watch?v=kfF40MiS7zA",
            sort_order: 1,
            content_body: "### Limits and Epsilon-Delta\nUnderstanding asymptotic behavior and how functions behave arbitrarily close to a point."
          }
        ]
      }
    ]
  },
  {
    id: "python-programming-essentials",
    title: "Python Programming Essentials",
    category: "Python",
    instructor_name: "Alex Mercer",
    description: "From beginner syntax to structured programming: master dynamic typing, collections, conditionals, iteration, and reusable modular functions.",
    image_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    status: "Published",
    chapters: [
      {
        id: "py-ch1-basics",
        title: "Chapter 1: Variables, Types & Control Flow",
        sort_order: 1,
        lessons: [
          {
            id: "py-les-1-1",
            title: "Data Structures: Lists, Tuples & Dicts",
            youtube_url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
            sort_order: 1,
            content_body: "### Essential Python Structures\n\n```python\n# Dictionary comprehension\nsquares = {x: x**2 for x in range(10)}\nprint(squares)\n```"
          }
        ]
      }
    ]
  }
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database schema initialization...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Schema created successfully.');

    console.log('🌱 Seeding demo users...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const studentHash = await bcrypt.hash('student123', 10);

    const adminUser = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id, email
    `, ['admin@vedika.edu', adminHash, 'System Administrator', 'admin']);

    const studentUser = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
      RETURNING id, email
    `, ['student@vedika.edu', studentHash, 'Demo Student', 'student']);

    const adminId = adminUser.rows[0].id;
    const studentId = studentUser.rows[0].id;

    console.log('🌱 Seeding courses, chapters, and lessons...');
    for (const c of DEFAULT_COURSES) {
      await client.query(`
        INSERT INTO courses (id, title, category, instructor_id, instructor_name, description, image_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url
      `, [c.id, c.title, c.category, adminId, c.instructor_name, c.description, c.image_url, c.status]);

      // Enroll demo student in all courses
      await client.query(`
        INSERT INTO enrollments (user_id, course_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, course_id) DO NOTHING
      `, [studentId, c.id]);

      for (const ch of c.chapters) {
        await client.query(`
          INSERT INTO course_chapters (id, course_id, title, sort_order)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order
        `, [ch.id, c.id, ch.title, ch.sort_order]);

        for (const les of ch.lessons) {
          await client.query(`
            INSERT INTO course_lessons (id, chapter_id, course_id, title, content_body, youtube_url, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET 
              title = EXCLUDED.title,
              content_body = EXCLUDED.content_body,
              youtube_url = EXCLUDED.youtube_url,
              sort_order = EXCLUDED.sort_order
          `, [les.id, ch.id, c.id, les.title, les.content_body, les.youtube_url, les.sort_order]);
        }
      }
    }

    // Seed Sample Quiz
    console.log('🌱 Seeding sample quiz...');
    const quizId = 'phys-quiz-1';
    await client.query(`
      INSERT INTO quizzes (id, lesson_id, course_id, title, passing_score)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
    `, [quizId, 'phys-les-1-1', 'physics-mechanics-fundamentals', 'Kinematics Mastery Quiz', 75]);

    await client.query(`
      INSERT INTO quiz_questions (quiz_id, question_text, options, correct_option, explanation)
      VALUES 
      ($1, 'What is the rate of change of displacement with respect to time?', $2, 0, 'Velocity is the first derivative of displacement with respect to time.'),
      ($1, 'Which equation relates final velocity, initial velocity, acceleration, and displacement?', $3, 1, 'v^2 = v0^2 + 2a*dx is derived from eliminating time from the kinematic relations.')
      ON CONFLICT DO NOTHING
    `, [
      quizId,
      JSON.stringify(['Velocity', 'Speed', 'Acceleration', 'Jerk']),
      JSON.stringify(['v = v0 + at', 'v^2 = v0^2 + 2a*dx', 'x = vt', 'a = v/t'])
    ]);

    console.log('\n🎉 SUCCESS! Native LMS Database initialized & seeded successfully.');
    console.log('------------------------------------------------------------');
    console.log('👤 Demo Admin:   admin@vedika.edu   | Password: admin123');
    console.log('👤 Demo Student: student@vedika.edu | Password: student123');
    console.log('------------------------------------------------------------\n');

  } catch (err) {
    console.error('❌ Migration Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

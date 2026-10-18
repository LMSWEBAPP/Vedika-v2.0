import { nativeQuery } from './native-db.js';
import bcrypt from 'bcryptjs';

/**
 * Fetch all published courses with student enrollment counts and lesson counts
 */
export async function getNativeCourses() {
  const sql = `
    SELECT 
      c.id, c.title, c.category, c.instructor_name, c.description, c.image_url, c.status, c.created_at,
      COUNT(DISTINCT e.user_id)::int AS enrolled,
      COUNT(DISTINCT l.id)::int AS "lessonsCount"
    FROM courses c
    LEFT JOIN enrollments e ON c.id = e.course_id
    LEFT JOIN course_lessons l ON c.id = l.course_id
    WHERE c.status = 'Published'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  const res = await nativeQuery(sql);
  return res ? res.rows : null;
}

/**
 * Fetch a course with all its chapters and ordered lessons
 */
export async function getNativeCourseSyllabus(courseId) {
  const courseRes = await nativeQuery('SELECT * FROM courses WHERE id = $1', [courseId]);
  if (!courseRes || courseRes.rows.length === 0) return null;
  const course = courseRes.rows[0];

  const chaptersRes = await nativeQuery(
    'SELECT * FROM course_chapters WHERE course_id = $1 ORDER BY sort_order, created_at ASC',
    [courseId]
  );
  const lessonsRes = await nativeQuery(
    'SELECT * FROM course_lessons WHERE course_id = $1 ORDER BY sort_order, created_at ASC',
    [courseId]
  );

  const chapters = (chaptersRes?.rows || []).map(ch => ({
    ...ch,
    lessons: (lessonsRes?.rows || []).filter(l => l.chapter_id === ch.id)
  }));

  return {
    ...course,
    chapters
  };
}

/**
 * Native User Authentication
 */
export async function authenticateNativeUser(email, password) {
  const res = await nativeQuery(
    'SELECT id, email, password_hash, full_name, role FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  if (!res || res.rows.length === 0) return null;
  const user = res.rows[0];

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role
  };
}

/**
 * Native User Registration
 */
export async function registerNativeUser(email, password, fullName, role = 'student') {
  const hash = await bcrypt.hash(password, 10);
  const res = await nativeQuery(`
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role
  `, [email, hash, fullName, role]);

  return res ? res.rows[0] : null;
}

/**
 * Fetch user's enrolled courses
 */
export async function getNativeEnrolledCourses(userId) {
  const sql = `
    SELECT c.* 
    FROM courses c
    INNER JOIN enrollments e ON c.id = e.course_id
    WHERE e.user_id = $1
    ORDER BY e.enrolled_at DESC
  `;
  const res = await nativeQuery(sql, [userId]);
  return res ? res.rows : [];
}

export default {
  getNativeCourses,
  getNativeCourseSyllabus,
  authenticateNativeUser,
  registerNativeUser,
  getNativeEnrolledCourses
};

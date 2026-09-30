'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourses, getCourseSyllabus, frappeRestGet, saveProgressToRedis, getProgressFromRedis, DEFAULT_COURSES } from '@/lib/frappe';
import { getCourseDetails } from '@/lib/lms-data';
import LessonPage from '@/components/LessonPage';

// Instant local lesson resolver (< 1ms execution time)
function normalizeLesson(l, m, details, defaultCourse) {
  if (!l) return null;
  const rawVid = l.vid || l.youtube || "";
  let resolvedVid = rawVid;
  if (!/^[a-zA-Z0-9_-]{11}$/.test(rawVid)) {
    const match = String(rawVid || l.content || "").match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    resolvedVid = match ? match[1] : (rawVid || "_uQrJ0TkZlc");
  }
  return {
    ...l,
    vid: resolvedVid,
    youtube: resolvedVid,
    moduleTitle: m?.title || l.moduleTitle || '',
    courseTitle: details?.title || defaultCourse?.title || l.courseTitle || '',
    courseId: details?.id || defaultCourse?.id || l.courseId || '',
    module: m
  };
}

function findLocalLesson(lessonId) {
  if (!lessonId) return null;

  // 1. Check all stored course details in localStorage
  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('admin_course_details_'));
      for (const k of keys) {
        try {
          const syl = JSON.parse(localStorage.getItem(k));
          if (syl && Array.isArray(syl.modules)) {
            for (const m of syl.modules) {
              const l = (m.lessons || []).find(x => x.id === lessonId);
              if (l) {
                return normalizeLesson(l, m, syl, null);
              }
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  // 2. Check DEFAULT_COURSES and built-in course details
  for (const c of DEFAULT_COURSES) {
    const details = getCourseDetails(c);
    if (details && Array.isArray(details.modules)) {
      for (const m of details.modules) {
        const l = (m.lessons || []).find(x => x.id === lessonId);
        if (l) {
          return normalizeLesson(l, m, details, c);
        }
      }
    }
  }

  return null;
}

export default function LessonRoute() {
  const params = useParams();
  const id = decodeURIComponent(params.id);
  const router = useRouter();
  const [completed, setCompleted] = useState({});

  // Instant synchronous lesson hydration (0ms load)
  const [lesson, setLesson] = useState(() => findLocalLesson(id));
  const [loading, setLoading] = useState(() => !findLocalLesson(id));

  // Sync completion states
  useEffect(() => {
    let key = 'completed_lessons';
    let email = '';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('frappe_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user && user.email) {
            key = `completed_lessons_${user.email}`;
            email = user.email;
          }
        } catch (e) {}
      }
      const saved = localStorage.getItem(key);
      let localCompleted = {};
      if (saved) {
        try {
          localCompleted = JSON.parse(saved);
          setCompleted(localCompleted);
        } catch (e) {}
      }

      if (email) {
        getProgressFromRedis(email).then(async (remoteCompleted) => {
          if (remoteCompleted) {
            const merged = { ...localCompleted, ...remoteCompleted };
            setCompleted(merged);
            localStorage.setItem(`completed_lessons_${email}`, JSON.stringify(merged));
            
            const remoteKeys = Object.keys(remoteCompleted).length;
            const mergedKeys = Object.keys(merged).length;
            if (mergedKeys > remoteKeys) {
              await saveProgressToRedis(email, merged);
            }
          }
        }).catch(err => console.error("Error synchronizing progress:", err));
      }
    }
  }, []);

  // Fetch courses dynamically and compile/revalidate the lesson list
  useEffect(() => {
    let isMounted = true;
    async function loadLesson() {
      let found = findLocalLesson(id);
      if (found) {
        setLesson(found);
        setLoading(false);
      }

      try {
        const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || process.env.FRAPPE_URL;

        if (FRAPPE_URL && (!found || found.lazyLoad)) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1800);
            const lDoc = await frappeRestGet(`Course Lesson/${id}`);
            clearTimeout(timer);
            if (lDoc && lDoc.course) {
              const syllabus = await getCourseSyllabus(lDoc.course);
              if (syllabus && syllabus.modules) {
                const lessonsInCourse = [];
                syllabus.modules.forEach(m => {
                  m.lessons.forEach(l => {
                    lessonsInCourse.push({
                      ...l,
                      moduleTitle: m.title,
                      courseTitle: syllabus.title,
                      courseId: syllabus.id,
                      module: m
                    });
                  });
                });
                const remoteFound = lessonsInCourse.find(l => l.id === id);
                if (remoteFound) {
                  let pts = remoteFound.pts || ["Key concept introduction."];
                  let quizQuestions = remoteFound.quizQuestions || [];
                  let codingExercise = remoteFound.codingExercise || {
                    hasExercise: false,
                    language: 'python',
                    instruction: '',
                    starterCode: '',
                    solutionCode: '',
                    testCases: []
                  };
                  let pdf = remoteFound.pdf || "";
                  if (lDoc.instructor_notes) {
                    try {
                      const meta = JSON.parse(lDoc.instructor_notes);
                      if (Array.isArray(meta.pts)) pts = meta.pts;
                      if (Array.isArray(meta.quizQuestions)) quizQuestions = meta.quizQuestions;
                      if (meta.codingExercise) codingExercise = meta.codingExercise;
                      if (meta.pdf) pdf = meta.pdf;
                    } catch (e) {}
                  }
                  
                  found = {
                    ...remoteFound,
                    title: lDoc.title || remoteFound.title,
                    dur: lDoc.duration || remoteFound.dur || "10 min",
                    vid: lDoc.youtube || remoteFound.vid || remoteFound.youtube || "_uQrJ0TkZlc",
                    youtube: lDoc.youtube || remoteFound.vid || remoteFound.youtube || "_uQrJ0TkZlc",
                    overview: lDoc.body || remoteFound.overview || "",
                    pts,
                    quizQuestions,
                    codingExercise,
                    pdf,
                    lazyLoad: false
                  };
                  if (isMounted) setLesson(found);
                }
              }
            }
          } catch (_) {
            // Background sync error handled gracefully
          }
        }

        // Parallel fallback across all courses if not found
        if (!found) {
          const courses = await getCourses();
          const syllabuses = await Promise.all(
            courses.map(course => getCourseSyllabus(course.id).catch(() => null))
          );
          const allLessons = [];
          courses.forEach((course, idx) => {
            const syllabus = syllabuses[idx];
            const details = (syllabus && syllabus.modules?.length > 0) ? syllabus : getCourseDetails(course);
            if (details && details.modules) {
              details.modules.forEach(m => {
                m.lessons.forEach(l => {
                  allLessons.push(normalizeLesson(l, m, details, course));
                });
              });
            }
          });
          found = allLessons.find(l => l.id === id);
          if (found && isMounted) {
            setLesson(found);
          }
        }
      } catch (e) {
        console.error("Error during background lesson lookup:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLesson();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const onComplete = async (lessonId) => {
    let key = 'completed_lessons';
    let email = '';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('frappe_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user && user.email) {
            key = `completed_lessons_${user.email}`;
            email = user.email;
          }
        } catch (e) {}
      }
    }
    const updated = { ...completed, [lessonId]: true };
    setCompleted(updated);
    localStorage.setItem(key, JSON.stringify(updated));

    if (email) {
      try {
        await saveProgressToRedis(email, updated);
      } catch (err) {
        console.error("Failed to sync completed lesson to Redis:", err);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading lesson...</div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ padding: '60px 36px', textAlign: 'center', color: 'var(--muted)', background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Lesson not found</h2>
        <button onClick={() => router.push('/courses')}
          style={{ marginTop: 16, background: 'var(--accent)', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <LessonPage
      lesson={lesson}
      completed={completed}
      onComplete={onComplete}
    />
  );
}

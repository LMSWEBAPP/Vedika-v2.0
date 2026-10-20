'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, CheckCircle, Circle, Clock, Trophy, Award, FileText, ClipboardList
} from 'lucide-react';
import { T, getCourseDetails } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ, isTabletMQ } from '@/lib/useMediaQuery';
import { 
  getCourses, 
  getStudentEnrollments, 
  getCourseSyllabus, 
  getQuizzes, 
  getQuizSubmissions, 
  getAssignments, 
  getAssignmentSubmissions 
} from '@/lib/frappe';

export default function ProgressPage({ completed = {} }) {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);
  const isTablet = useMediaQuery(isTabletMQ);
  const statCols = isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)';
  const lessonCols = isMobile ? 'repeat(3,1fr)' : isTablet ? 'repeat(4,1fr)' : 'repeat(5,1fr)';

  // LMS Backend Stats
  const [currentUser, setCurrentUser] = useState(null);
  const [quizzesCount, setQuizzesCount] = useState(0);
  const [passedQuizzesCount, setPassedQuizzesCount] = useState(0);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [submittedAssignmentsCount, setSubmittedAssignmentsCount] = useState(0);
  const [submissionsList, setSubmissionsList] = useState([]);

  // Enrolled Courses & Selected Syllabus
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourseSyllabus, setSelectedCourseSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('frappe_user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    async function loadStatsAndCourses() {
      setLoading(true);
      try {
        const email = currentUser.email || '';
        const [list, enrollments, quizzes, quizSubs, assignments, assSubs] = await Promise.all([
          getCourses(),
          email ? getStudentEnrollments(email) : Promise.resolve([]),
          getQuizzes(),
          getQuizSubmissions(),
          getAssignments(),
          getAssignmentSubmissions()
        ]);
        
        const published = list.filter(c => c.status === 'Published');
        const enrolled = published.filter(c => enrollments.includes(c.id));
        setEnrolledCourses(enrolled);

        let defaultId = '';
        if (typeof window !== 'undefined') {
          const lastCourseId = localStorage.getItem('selected_course_id');
          if (lastCourseId && enrolled.some(c => c.id === lastCourseId)) {
            defaultId = lastCourseId;
          }
        }
        if (!defaultId && enrolled.length > 0) {
          defaultId = enrolled[0].id;
        }
        setSelectedCourseId(defaultId);

        if (defaultId) {
          try {
            const syllabus = await getCourseSyllabus(defaultId);
            setSelectedCourseSyllabus(syllabus);
          } catch (err) {
            console.error("Failed to load syllabus", err);
          }
        }

        setQuizzesCount(quizzes.length);
        
        // Count passed quizzes
        const userQuizSubs = quizSubs.filter(s => s.member === currentUser.username);
        const passedQuizzes = new Set();
        userQuizSubs.forEach(sub => {
          if (sub.percentage >= sub.passing_percentage) {
            passedQuizzes.add(sub.quiz);
          }
        });
        setPassedQuizzesCount(passedQuizzes.size);

        setAssignmentsCount(assignments.length);
        const userAssSubs = assSubs.filter(s => s.member === currentUser.username);
        setSubmittedAssignmentsCount(userAssSubs.length);
        setSubmissionsList(userAssSubs);
      } catch (e) {
        console.error("Failed to load progress stats:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStatsAndCourses();
  }, [currentUser]);

  // Load syllabus when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) return;
    async function loadSyllabus() {
      try {
        const syllabus = await getCourseSyllabus(selectedCourseId);
        setSelectedCourseSyllabus(syllabus);
      } catch (e) {
        console.error("Failed to load syllabus for", selectedCourseId, e);
      }
    }
    loadSyllabus();
  }, [selectedCourseId]);

  // Compute course-specific progress stats
  const modules = selectedCourseSyllabus?.modules || [];
  const courseLessons = modules.flatMap(m => m.lessons || []);
  const total = courseLessons.length;
  const done = courseLessons.filter(l => completed[l.id]).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: 'Lessons Done',    val: done,                   total: total,        color: T.accent, Icon: CheckCircle },
    { label: 'Quizzes Passed',   val: passedQuizzesCount,      total: quizzesCount, color: T.purple, Icon: Award },
    { label: 'Assignments Done', val: submittedAssignmentsCount, total: assignmentsCount, color: T.amber, Icon: FileText },
    { label: 'Completion',       val: `${pct}%`,              total: null,         color: T.green,  Icon: Trophy },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading progress details...</div>
        </div>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', maxWidth: 860, fontFamily: 'var(--font-outfit), sans-serif', margin: '0 auto', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          Progress Dashboard
        </h2>
        <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 16, padding: '48px 24px', marginTop: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📈</div>
          <h3 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px 0' }}>No Active Enrollments</h3>
          <p style={{ color: T.muted, fontSize: 13.5, maxWidth: 360, margin: '0 auto 20px' }}>
            To see your learning progress and KPIs, enroll in a course first.
          </p>
          <a href="/courses" style={{ background: T.accent, color: '#faf7f7ff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
            Explore Courses
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '14px 12px 32px' : '32px 36px', maxWidth: 860, fontFamily: 'var(--font-outfit), sans-serif', margin: '0 auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: T.s2,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <h2 style={{ color: T.text, fontSize: isMobile ? 20 : 22, fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>
          Progress Dashboard
        </h2>
      </div>
      <p style={{ color: T.muted, margin: '0 0 18px', fontSize: isMobile ? 13 : 14 }}>
        Your progress in <span style={{ color: T.accent, fontWeight: 600 }}>{selectedCourseSyllabus?.title || "selected course"}</span> at a glance.
      </p>

      {/* Course Selector */}
      {enrolledCourses.length > 1 && (
        <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: T.muted, fontWeight: 500 }}>Select Course:</span>
          <select 
            value={selectedCourseId} 
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              if (typeof window !== 'undefined') {
                localStorage.setItem('selected_course_id', e.target.value);
              }
            }}
            style={{
              background: T.s3,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: isMobile ? '7px 10px' : '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '100%',
              width: isMobile ? '100%' : 'auto',
              minWidth: isMobile ? '100%' : 200
            }}
          >
            {enrolledCourses.map(course => (
              <option key={course.id} value={course.id} style={{ background: T.s1 }}>
                {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: statCols, gap: isMobile ? 8 : 12, marginBottom: 18 }}>
        {stats.map(({ label, val, total: t, color, Icon }) => (
          <div key={label} style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '12px 10px' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: isMobile ? 11 : 12, color: T.muted }}>{label}</span>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={12} color={color} />
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: T.text, letterSpacing: '-0.04em' }}>{val}</div>
            {t !== null && <div style={{ fontSize: 10.5, color: T.muted, marginTop: 2 }}>of {t}</div>}
          </div>
        ))}
      </div>

      {/* Assignment submissions feedback panel */}
      {submissionsList.length > 0 && (
        <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '14px 12px' : '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={16} color={T.amber} /> Assignment Grading Reviews
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {submissionsList.map(sub => (
              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 6, background: T.s3, padding: isMobile ? '10px 10px' : '10px 14px', borderRadius: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{sub.assignment_title}</div>
                  {sub.comments && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>Feedback: "{sub.comments}"</div>}
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  alignSelf: isMobile ? 'flex-start' : 'auto',
                  background: sub.status === 'Pass' ? `${T.green}18` : sub.status === 'Fail' ? `${T.red}18` : `${T.amber}18`,
                  color: sub.status === 'Pass' ? T.green : sub.status === 'Fail' ? T.red : T.amber
                }}>
                  {sub.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module progress */}
      <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '14px 12px' : '20px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Module Progress</div>
        {modules.map(mod => {
          const modDone = (mod.lessons || []).filter(l => completed[l.id]).length;
          const modPct  = mod.lessons?.length > 0 ? Math.round((modDone / mod.lessons.length) * 100) : 0;
          return (
            <div key={mod.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12.5, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{mod.emoji || "📖"} {mod.title}</span>
                <span style={{ fontSize: 11.5, color: T.muted, flexShrink: 0 }}>{modDone}/{mod.lessons?.length || 0} · {modPct}%</span>
              </div>
              <div style={{ background: T.s3, borderRadius: 99, height: 6 }}>
                <div style={{ background: mod.accent || T.accent, height: 6, borderRadius: 99, width: `${modPct}%`, transition: 'width 0.5s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Lesson status grid */}
      <div style={{ background: T.s2, border: `1px solid ${T.border}`, borderRadius: 12, padding: isMobile ? '14px 12px' : '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>Lesson Status</div>
        {courseLessons.length === 0 ? (
          <div style={{ fontSize: 12, color: T.muted, textAlign: 'center', padding: '10px 0' }}>No lessons in this course yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: lessonCols, gap: 6 }}>
            {courseLessons.map(l => (
              <div key={l.id} title={l.title}
                style={{
                  background: completed[l.id] ? `${T.green}18` : T.s3,
                  border: `1px solid ${completed[l.id] ? T.green + '40' : T.border}`,
                  borderRadius: 7, padding: isMobile ? '6px 4px' : '8px', textAlign: 'center',
                  minWidth: 0,
                  overflow: 'hidden'
                }}>
                {completed[l.id]
                  ? <CheckCircle size={12} color={T.green} style={{ display: 'block', margin: '0 auto 3px' }} />
                  : <Circle size={12} color={T.dim} style={{ display: 'block', margin: '0 auto 3px' }} />}
                <div style={{ fontSize: 9.5, color: completed[l.id] ? T.green : T.muted, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {l.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

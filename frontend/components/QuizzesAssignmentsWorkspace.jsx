'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, FileText, Clock, CheckCircle, X, ChevronRight, HelpCircle,
  ArrowLeft, Search, Send, AlertCircle, Filter, Sparkles, BookOpen, Check,
  Edit2, RotateCcw
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import {
  getQuizzes, getQuizSubmissions, submitQuizResponse,
  getAssignments, getAssignmentSubmissions, submitAssignmentResponse,
  getCourses, parseQuestionsList,
  DEFAULT_QUIZZES, DEFAULT_ASSIGNMENTS, DEFAULT_COURSES
} from '@/lib/frappe';
import { getSubjectArtwork } from '@/lib/artwork';
import CategoryShowcaseCarousel from '@/components/CategoryShowcaseCarousel';
import PacmanPagination from '@/components/PacmanPagination';
import VedikaParticleBot from '@/components/VedikaParticleBot';

export default function QuizzesAssignmentsWorkspace({ initialMode = 'quizzes' }) {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);

  // Active Tab State: 'quizzes' | 'assignments'
  const [activeTab, setActiveTab] = useState(initialMode);
  const isAssignmentsOpen = activeTab === 'assignments';

  // Shared Data States (Instant synchronous local hydration)
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin_courses_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return DEFAULT_COURSES;
  });
  const [loading, setLoading] = useState(false);

  // Quizzes Specific States
  const [quizzes, setQuizzes] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin_quizzes_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return DEFAULT_QUIZZES;
  });
  const [quizSubmissions, setQuizSubmissions] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('quiz_submissions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [selectedQuizCategory, setSelectedQuizCategory] = useState(null);
  const [quizSearch, setQuizSearch] = useState('');
  const [quizPage, setQuizPage] = useState(1);
  const QUIZ_ITEMS_PER_PAGE = 3;

  // Quiz Attempt Modal States
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [isAttemptingQuiz, setIsAttemptingQuiz] = useState(false);
  const [currentQuizQIdx, setCurrentQuizQIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Assignments Specific States
  const [assignments, setAssignments] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admin_assignments_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return DEFAULT_ASSIGNMENTS;
  });
  const [assignmentSubmissions, setAssignmentSubmissions] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('assignment_submissions');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [selectedAssignmentCategory, setSelectedAssignmentCategory] = useState(null);
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState('all');
  const [assignmentChapterFilter, setAssignmentChapterFilter] = useState('all');
  const [assignmentPage, setAssignmentPage] = useState(1);
  const ASSIGNMENT_ITEMS_PER_PAGE = 3;

  // Assignment Modal States
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isViewingAssignmentPrompt, setIsViewingAssignmentPrompt] = useState(false);
  const [activeAssignmentQIdx, setActiveAssignmentQIdx] = useState(0);
  const [assignmentAnswers, setAssignmentAnswers] = useState({});
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState('');
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const existingUserSub = useMemo(() => {
    if (!selectedAssignment || !currentUser) return null;
    const curU = (currentUser.username || '').toLowerCase();
    const curE = (currentUser.email || '').toLowerCase();
    return assignmentSubmissions.find(
      (s) => s.assignment === selectedAssignment.id && 
      (s.member?.toLowerCase() === curU || s.member?.toLowerCase() === curE || (currentUser.name && s.member_name?.toLowerCase() === currentUser.name.toLowerCase()))
    ) || null;
  }, [selectedAssignment, currentUser, assignmentSubmissions]);


  // Read current user
  useEffect(() => {
    const stored = localStorage.getItem('frappe_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // Fetch initial combined data in background (SWR pattern)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [quizList, courseList, qSubs, assList, aSubs] = await Promise.all([
          getQuizzes(),
          getCourses(),
          getQuizSubmissions(),
          getAssignments(),
          getAssignmentSubmissions()
        ]);
        if (!isMounted) return;
        if (Array.isArray(quizList) && quizList.length > 0) setQuizzes(quizList);
        if (Array.isArray(courseList) && courseList.length > 0) setCourses(courseList);
        if (Array.isArray(qSubs)) setQuizSubmissions(qSubs);
        if (Array.isArray(assList) && assList.length > 0) setAssignments(assList);
        if (Array.isArray(aSubs)) setAssignmentSubmissions(aSubs);
      } catch (e) {
        console.error('Failed to load quizzes & assignments data', e);
      }
    }
    loadData();

    // Live update listeners
    const handleQuizzesUpdated = () => getQuizzes().then(q => { if (isMounted && q) setQuizzes(q); });
    const handleAssignmentsUpdated = () => getAssignments().then(a => { if (isMounted && a) setAssignments(a); });
    const handleCoursesUpdated = () => getCourses().then(c => { if (isMounted && c) setCourses(c); });
    const handleSubmissionsUpdated = () => {
      getQuizSubmissions().then(qs => { if (isMounted && qs) setQuizSubmissions(qs); });
      getAssignmentSubmissions().then(as => { if (isMounted && as) setAssignmentSubmissions(as); });
    };

    window.addEventListener('quizzes_updated', handleQuizzesUpdated);
    window.addEventListener('assignments_updated', handleAssignmentsUpdated);
    window.addEventListener('courses_updated', handleCoursesUpdated);
    window.addEventListener('submissions_updated', handleSubmissionsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('quizzes_updated', handleQuizzesUpdated);
      window.removeEventListener('assignments_updated', handleAssignmentsUpdated);
      window.removeEventListener('courses_updated', handleCoursesUpdated);
      window.removeEventListener('submissions_updated', handleSubmissionsUpdated);
    };
  }, [currentUser]);

  // Reset pagination when category or search changes
  useEffect(() => {
    setQuizPage(1);
  }, [selectedQuizCategory, quizSearch]);

  useEffect(() => {
    setAssignmentPage(1);
  }, [selectedAssignmentCategory, assignmentSearch, assignmentCourseFilter, assignmentChapterFilter]);

  // Helper to map course ID to name
  const getCourseName = (courseId) => {
    return courses.find((c) => String(c.id) === String(courseId))?.title || 'Course Topic';
  };

  // Helper to resolve category
  const getItemCategory = (item) => {
    if (item.category) return item.category;
    const match = courses.find((c) => String(c.id) === String(item.course));
    return match?.category || 'General';
  };

  // -------------------------------------------------------------
  // QUIZZES LOGIC & MEMOS
  // -------------------------------------------------------------
  const getQuizStatus = (quizId) => {
    if (!currentUser) return { status: 'Not Attempted', percentage: null };
    const attempts = quizSubmissions.filter(
      (s) => s.quiz === quizId && (s.member === currentUser.username || s.member === currentUser.email)
    );
    if (attempts.length === 0) return { status: 'Not Attempted', percentage: null };
    const passed = attempts.some((a) => a.percentage >= (a.passing_percentage || 70));
    const highestAttempt = [...attempts].sort((a, b) => b.percentage - a.percentage)[0];
    return {
      status: passed ? 'Passed' : 'Failed',
      percentage: highestAttempt.percentage,
      score: highestAttempt.score,
      total: highestAttempt.score_out_of
    };
  };

  const quizCategoryShowcaseItems = useMemo(() => {
    const map = new Map();
    quizzes.forEach((q) => {
      const cat = getItemCategory(q);
      if (!map.has(cat)) map.set(cat, { quizzes: [], courseIds: new Set() });
      const entry = map.get(cat);
      entry.quizzes.push(q);
      if (q.course) entry.courseIds.add(String(q.course));
    });
    return Array.from(map.entries()).map(([cat, val]) => ({
      category: cat,
      count: val.quizzes.length,
      coursesCount: val.courseIds.size,
      artwork: getSubjectArtwork(cat),
      quizzes: val.quizzes
    }));
  }, [quizzes, courses]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const cat = getItemCategory(q);
      if (selectedQuizCategory && cat.toLowerCase() !== selectedQuizCategory.toLowerCase()) {
        return false;
      }
      if (quizSearch.trim()) {
        const query = quizSearch.toLowerCase().trim();
        const titleMatch = q.title?.toLowerCase().includes(query);
        const courseMatch = getCourseName(q.course)?.toLowerCase().includes(query);
        const catMatch = cat.toLowerCase().includes(query);
        if (!titleMatch && !courseMatch && !catMatch) return false;
      }
      return true;
    });
  }, [quizzes, selectedQuizCategory, quizSearch, courses]);

  const totalQuizPages = Math.max(1, Math.ceil(filteredQuizzes.length / QUIZ_ITEMS_PER_PAGE));
  const paginatedQuizzes = filteredQuizzes.slice(
    (quizPage - 1) * QUIZ_ITEMS_PER_PAGE,
    quizPage * QUIZ_ITEMS_PER_PAGE
  );

  const handleStartAttempt = (quiz) => {
    setSelectedQuiz(quiz);
    setQuizAnswers(new Array(quiz.questions?.length || 0).fill(null));
    setCurrentQuizQIdx(0);
    setQuizScore(null);
    setIsAttemptingQuiz(true);
  };

  const handleSelectQuizOption = (oIdx) => {
    const updated = [...quizAnswers];
    updated[currentQuizQIdx] = oIdx;
    setQuizAnswers(updated);
  };

  const handleQuizSubmit = async () => {
    if (!selectedQuiz || !currentUser) return;
    setSubmittingQuiz(true);
    try {
      let correctCount = 0;
      selectedQuiz.questions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.correct) correctCount++;
      });
      const totalQs = selectedQuiz.questions.length;
      const percentage = Math.round((correctCount / totalQs) * 100);
      const passed = percentage >= (selectedQuiz.passing_percentage || 70);

      const subPayload = {
        quiz: selectedQuiz.id,
        quiz_title: selectedQuiz.title,
        course: selectedQuiz.course,
        member: currentUser.username || currentUser.email,
        member_name: currentUser.name || 'Student',
        score: correctCount,
        score_out_of: totalQs,
        percentage: percentage,
        passing_percentage: selectedQuiz.passing_percentage || 70
      };

      await submitQuizResponse(subPayload);
      setQuizScore({ score: correctCount, total: totalQs, percentage, passed });
      const freshSubs = await getQuizSubmissions();
      setQuizSubmissions(freshSubs || []);
    } catch (e) {
      console.error(e);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // -------------------------------------------------------------
  // ASSIGNMENTS LOGIC & MEMOS
  // -------------------------------------------------------------
  const getAssignmentStatus = (assignmentId) => {
    if (!currentUser) return { status: 'Not Submitted', graded: false };
    const sub = assignmentSubmissions.find(
      (s) => s.assignment === assignmentId && (s.member === currentUser.username || s.member === currentUser.email)
    );
    if (!sub) return { status: 'Not Submitted', graded: false };
    if (sub.grade !== undefined && sub.grade !== null && sub.grade !== '') {
      return { status: 'Graded', grade: sub.grade, score: sub.score, max_score: sub.max_score, graded: true };
    }
    return { status: 'Submitted (Pending Review)', graded: false };
  };

  const assignmentCategoryShowcaseItems = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      const cat = getItemCategory(a);
      if (!map.has(cat)) map.set(cat, { assignments: [], courseIds: new Set() });
      const entry = map.get(cat);
      entry.assignments.push(a);
      if (a.course) entry.courseIds.add(String(a.course));
    });
    return Array.from(map.entries()).map(([cat, val]) => ({
      category: cat,
      count: val.assignments.length,
      coursesCount: val.courseIds.size,
      artwork: cat.toLowerCase() === 'general' ? '/assignment-general-desk.jpg' : getSubjectArtwork(cat),
      assignments: val.assignments
    }));
  }, [assignments, courses]);

  const categoryFilteredCourses = useMemo(() => {
    if (!selectedAssignmentCategory) return courses;
    return courses.filter((c) => (c.category || 'General').toLowerCase() === selectedAssignmentCategory.toLowerCase());
  }, [courses, selectedAssignmentCategory]);

  const uniqueChapters = useMemo(() => {
    const set = new Set();
    assignments.forEach((a) => {
      if (a.chapter) set.add(a.chapter);
    });
    return Array.from(set).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return String(a).localeCompare(String(b));
    });
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const cat = getItemCategory(a);
      if (selectedAssignmentCategory && cat.toLowerCase() !== selectedAssignmentCategory.toLowerCase()) {
        return false;
      }
      if (assignmentCourseFilter !== 'all' && String(a.course) !== String(assignmentCourseFilter)) {
        return false;
      }
      if (assignmentChapterFilter !== 'all' && String(a.chapter) !== String(assignmentChapterFilter)) {
        return false;
      }
      if (assignmentSearch.trim()) {
        const query = assignmentSearch.toLowerCase().trim();
        const titleMatch = a.title?.toLowerCase().includes(query);
        const courseMatch = getCourseName(a.course)?.toLowerCase().includes(query);
        const catMatch = cat.toLowerCase().includes(query);
        if (!titleMatch && !courseMatch && !catMatch) return false;
      }
      return true;
    });
  }, [assignments, selectedAssignmentCategory, assignmentCourseFilter, assignmentChapterFilter, assignmentSearch, courses]);

  const totalAssignmentPages = Math.max(1, Math.ceil(filteredAssignments.length / ASSIGNMENT_ITEMS_PER_PAGE));
  const paginatedAssignments = filteredAssignments.slice(
    (assignmentPage - 1) * ASSIGNMENT_ITEMS_PER_PAGE,
    assignmentPage * ASSIGNMENT_ITEMS_PER_PAGE
  );

  const handleOpenAssignmentPrompt = (ass) => {
    const resolvedQuestions = parseQuestionsList(ass.question || '', ass.questions, ass.answer);
    const targetAss = { ...ass, questions: resolvedQuestions };
    setSelectedAssignment(targetAss);
    setAssignmentSuccessMsg('');
    setActiveAssignmentQIdx(0);
    const curU = (currentUser?.username || '').toLowerCase();
    const curE = (currentUser?.email || '').toLowerCase();
    const existingSub = assignmentSubmissions.find(
      (s) => s.assignment === ass.id && 
      (s.member?.toLowerCase() === curU || s.member?.toLowerCase() === curE || (currentUser?.name && s.member_name?.toLowerCase() === currentUser?.name?.toLowerCase()))
    );
    const initialAns = {};
    if (existingSub && existingSub.answer) {
      const text = existingSub.answer;
      if (resolvedQuestions.length > 1 && text.includes('[Question 1]')) {
        resolvedQuestions.forEach((_, idx) => {
          const tag = `[Question ${idx + 1}]`;
          const nextTag = `[Question ${idx + 2}]`;
          const sIdx = text.indexOf(tag);
          if (sIdx !== -1) {
            const afterTag = sIdx + tag.length;
            const eIdx = text.indexOf(nextTag, afterTag);
            initialAns[idx] = (eIdx !== -1 ? text.substring(afterTag, eIdx) : text.substring(afterTag)).trim();
          }
        });
      } else {
        initialAns[0] = existingSub.answer;
      }
      setIsEditingSubmission(false); // Open in read-only View Work mode
    } else {
      setIsEditingSubmission(true); // Open in Solve mode
    }
    setAssignmentAnswers(initialAns);
    setIsViewingAssignmentPrompt(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !currentUser) return;
    const qList = parseQuestionsList(selectedAssignment.question || '', selectedAssignment.questions, selectedAssignment.answer);
    const minChars = selectedAssignment.min_char_count !== undefined ? selectedAssignment.min_char_count : 20;

    for (let i = 0; i < qList.length; i++) {
      const text = (assignmentAnswers[i] || '').trim();
      if (selectedAssignment.type === 'Text') {
        if (text.length < minChars) {
          alert(`Question ${i + 1} requires at least ${minChars} characters before submitting. Currently: ${text.length} characters.`);
          setActiveAssignmentQIdx(i);
          return;
        }
      } else {
        if (!text) {
          alert(`Please provide a response for Question ${i + 1}.`);
          setActiveAssignmentQIdx(i);
          return;
        }
      }
    }

    const fullAnswerText = qList.map((q, idx) => {
      const ans = (assignmentAnswers[idx] || '').trim();
      return qList.length > 1 ? `[Question ${idx + 1}]\n${ans}` : ans;
    }).join('\n\n');

    setSubmittingAssignment(true);
    setAssignmentSuccessMsg('');
    try {
      const subPayload = {
        id: existingUserSub?.id || undefined,
        assignment: selectedAssignment.id,
        assignment_title: selectedAssignment.title,
        type: selectedAssignment.type || 'Text',
        member: currentUser.username || currentUser.email,
        member_name: currentUser.name || currentUser.username || 'Student',
        answer: fullAnswerText,
        course: selectedAssignment.course,
        question: typeof selectedAssignment.question === 'string' && selectedAssignment.question
          ? selectedAssignment.question
          : (typeof qList[0]?.prompt === 'string' ? qList[0].prompt : '')
      };
      await submitAssignmentResponse(subPayload);
      setAssignmentSuccessMsg(existingUserSub ? 'Assignment submission updated successfully! Your updated work has been recorded.' : 'Assignment submitted successfully! An instructor will review and grade your work.');
      const freshSubs = await getAssignmentSubmissions();
      setAssignmentSubmissions(freshSubs || []);
      setIsEditingSubmission(false);
    } catch (e) {
      console.error(e);
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
      background: '#070A12',
      color: '#F8FAFC',
      fontFamily: 'var(--font-outfit), sans-serif',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      padding: 0,
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <style>{`
        .box-container {
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          display: flex;
          align-items: stretch;
          background: #07080B;
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        }

        /* Seamless Cosmic Gold Ambient Background */
        .quizzes-ambient-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: 
            radial-gradient(ellipse 65% 60% at 82% 48%, rgba(245, 158, 11, 0.20) 0%, rgba(217, 119, 6, 0.05) 45%, transparent 75%),
            radial-gradient(circle 380px at 15% 82%, rgba(245, 158, 11, 0.09) 0%, transparent 62%),
            radial-gradient(circle 260px at 45% 18%, rgba(251, 191, 36, 0.06) 0%, transparent 55%),
            #07080B;
          overflow: hidden;
        }


        /* Seamless Cosmic Purple Ambient Background */
        .assignments-ambient-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: 
            radial-gradient(ellipse 65% 60% at 20% 50%, rgba(168, 85, 247, 0.22) 0%, rgba(126, 34, 206, 0.06) 45%, transparent 75%),
            radial-gradient(circle 380px at 85% 80%, rgba(168, 85, 247, 0.12) 0%, transparent 62%),
            radial-gradient(circle 280px at 55% 15%, rgba(192, 132, 252, 0.08) 0%, transparent 55%),
            #090714;
          overflow: hidden;
        }


        /* DEFAULT STATE: QUIZZES ACTIVE */
        .box1-content {
          background: transparent !important;
          flex: 6.2 !important;
          max-width: 65% !important;
          display: flex;
          flex-direction: column;
          opacity: 1 !important;
          min-width: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: ${isMobile ? '16px 12px' : '22px 28px 20px 24px'};
          box-sizing: border-box;
          pointer-events: auto !important;
          position: relative;
          z-index: 1;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .box1-side {
          background: transparent !important;
          border-left: none !important;
          flex: 3.8 !important;
          max-width: 38% !important;
          opacity: 1 !important;
          min-width: 0;
          padding: ${isMobile ? '12px 10px' : '16px 10px 20px 0'};
          pointer-events: auto !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* COLLAPSED ASSIGNMENTS IN DEFAULT STATE */
        .box2-side {
          background: transparent !important;
          border-right: none !important;
          border-left: none !important;
          flex: 0 0 0% !important;
          max-width: 0px !important;
          width: 0px !important;
          opacity: 0 !important;
          min-width: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          pointer-events: none !important;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .box2-content {
          background: transparent !important;
          border-right: none !important;
          border-left: none !important;
          flex: 0 0 0% !important;
          max-width: 0px !important;
          width: 0px !important;
          opacity: 0 !important;
          min-width: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          pointer-events: none !important;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* RIGHT-OPEN STATE: ASSIGNMENTS ACTIVE */
        .box-container.right-open {
          background: #090714 !important;
        }

        .box-container.right-open .box1-content,
        .box-container.right-open .box1-side {
          flex: 0 0 0% !important;
          max-width: 0px !important;
          width: 0px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .box-container.right-open .box2-side {
          flex: 3.8 !important;
          max-width: 38% !important;
          background: transparent !important;
          border-right: none !important;
          border-left: none !important;
          opacity: 1 !important;
          min-width: 0 !important;
          padding: ${isMobile ? '12px 10px' : '16px 0 20px 10px'} !important;
          pointer-events: auto !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justifyContent: center !important;
          box-sizing: border-box !important;
          position: relative !important;
          z-index: 1 !important;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .box-container.right-open .box2-content {
          flex: 6.2 !important;
          max-width: 65% !important;
          background: transparent !important;
          border-right: none !important;
          border-left: none !important;
          opacity: 1 !important;
          min-width: 0 !important;
          padding: ${isMobile ? '16px 12px' : '22px 28px 20px 24px'} !important;
          pointer-events: auto !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          position: relative !important;
          z-index: 1 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes botFloatBounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.6deg); }
        }

        @media (max-width: 960px) {
          .box1-side, .box2-side { display: none !important; }
          .box1-content, .box-container.right-open .box2-content {
            flex: 1 !important;
            max-width: 100% !important;
            padding: 18px 14px !important;
          }
        }

        @media (max-width: 640px) {
          .box1-content, .box-container.right-open .box2-content {
            padding: 12px 8px 24px 8px !important;
          }
        }
      `}</style>

      <div className={`box-container ${isAssignmentsOpen ? 'right-open' : ''}`}>
        {/* Ambient Backdrop: Cosmic Purple when Assignments active, Cosmic Gold when Quizzes active */}
        {isAssignmentsOpen ? (
          <div className="assignments-ambient-bg">
            <svg
              viewBox="0 0 1440 900"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <defs>
                <linearGradient id="purpleWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(168, 85, 247, 0)" />
                  <stop offset="25%" stopColor="rgba(192, 132, 252, 0.32)" />
                  <stop offset="60%" stopColor="rgba(168, 85, 247, 0.25)" />
                  <stop offset="100%" stopColor="rgba(126, 34, 206, 0)" />
                </linearGradient>
                <linearGradient id="purpleWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(192, 132, 252, 0)" />
                  <stop offset="40%" stopColor="rgba(168, 85, 247, 0.2)" />
                  <stop offset="80%" stopColor="rgba(147, 51, 234, 0.14)" />
                  <stop offset="100%" stopColor="rgba(126, 34, 206, 0)" />
                </linearGradient>
              </defs>

              {/* Sweeping Purple Flow Wave 1 */}
              <path
                d="M -100 640 C 260 540, 580 700, 940 570 C 1180 480, 1360 530, 1600 560"
                fill="none"
                stroke="url(#purpleWave1)"
                strokeWidth="2"
              />

              {/* Sweeping Purple Flow Wave 2 */}
              <path
                d="M -80 720 C 220 620, 520 760, 880 650 C 1180 560, 1400 610, 1680 640"
                fill="none"
                stroke="url(#purpleWave2)"
                strokeWidth="1.5"
              />

              {/* Purple Sparkle Stars matching Image 1 */}
              <g transform="translate(100, 180)">
                <path d="M 0 -10 Q 0 0, -10 0 Q 0 0, 0 10 Q 0 0, 10 0 Q 0 0, 0 -10 Z" fill="#E9D5FF" opacity="0.9" />
              </g>
              <g transform="translate(240, 570)">
                <path d="M 0 -8 Q 0 0, -8 0 Q 0 0, 0 8 Q 0 0, 8 0 Q 0 0, 0 -8 Z" fill="#C084FC" opacity="0.85" />
              </g>
              <g transform="translate(560, 150)">
                <path d="M 0 -9 Q 0 0, -9 0 Q 0 0, 0 9 Q 0 0, 9 0 Q 0 0, 0 -9 Z" fill="#E9D5FF" opacity="0.9" />
              </g>
              <g transform="translate(740, 260)">
                <path d="M 0 -7 Q 0 0, -7 0 Q 0 0, 0 7 Q 0 0, 7 0 Q 0 0, 0 -7 Z" fill="#D8B4FE" opacity="0.8" />
              </g>
              <g transform="translate(1060, 320)">
                <path d="M 0 -8 Q 0 0, -8 0 Q 0 0, 0 8 Q 0 0, 8 0 Q 0 0, 0 -8 Z" fill="#C084FC" opacity="0.85" />
              </g>
              <g transform="translate(1320, 290)">
                <path d="M 0 -10 Q 0 0, -10 0 Q 0 0, 0 10 Q 0 0, 10 0 Q 0 0, 0 -10 Z" fill="#E9D5FF" opacity="0.8" />
              </g>
            </svg>
          </div>
        ) : (
          <div className="quizzes-ambient-bg">
            <svg
              viewBox="0 0 1440 900"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
              }}
            >
              <defs>
                <linearGradient id="goldWave1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0)" />
                  <stop offset="25%" stopColor="rgba(245, 158, 11, 0.28)" />
                  <stop offset="60%" stopColor="rgba(251, 191, 36, 0.22)" />
                  <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
                </linearGradient>
                <linearGradient id="goldWave2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(251, 191, 36, 0)" />
                  <stop offset="40%" stopColor="rgba(245, 158, 11, 0.16)" />
                  <stop offset="80%" stopColor="rgba(251, 191, 36, 0.1)" />
                  <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
                </linearGradient>
              </defs>

              {/* Sweeping Golden Flow Wave 1 */}
              <path
                d="M -100 680 C 220 580, 480 720, 840 590 C 1100 490, 1320 540, 1600 580"
                fill="none"
                stroke="url(#goldWave1)"
                strokeWidth="2"
              />

              {/* Sweeping Golden Flow Wave 2 */}
              <path
                d="M -80 740 C 260 660, 560 780, 920 670 C 1220 580, 1420 630, 1680 660"
                fill="none"
                stroke="url(#goldWave2)"
                strokeWidth="1.5"
              />

              {/* Golden Upper Orbit Arc behind bot */}
              <ellipse
                cx="1100"
                cy="260"
                rx="460"
                ry="180"
                fill="none"
                stroke="rgba(245, 158, 11, 0.15)"
                strokeWidth="1.2"
                strokeDasharray="6 6"
              />

              {/* Scattered 4-Point Golden Sparkle Stars matching the reference image */}
              <g transform="translate(80, 110)">
                <path d="M 0 -10 Q 0 0, -10 0 Q 0 0, 0 10 Q 0 0, 10 0 Q 0 0, 0 -10 Z" fill="#FDE68A" opacity="0.85" />
              </g>
              <g transform="translate(480, 140)">
                <path d="M 0 -8 Q 0 0, -8 0 Q 0 0, 0 8 Q 0 0, 8 0 Q 0 0, 0 -8 Z" fill="#FDE68A" opacity="0.9" />
              </g>
              <g transform="translate(780, 110)">
                <path d="M 0 -9 Q 0 0, -9 0 Q 0 0, 0 9 Q 0 0, 9 0 Q 0 0, 0 -9 Z" fill="#FDE68A" opacity="0.9" />
              </g>
              <g transform="translate(980, 130)">
                <path d="M 0 -7 Q 0 0, -7 0 Q 0 0, 0 7 Q 0 0, 7 0 Q 0 0, 0 -7 Z" fill="#FCD34D" opacity="0.75" />
              </g>
              <g transform="translate(180, 480)">
                <path d="M 0 -7 Q 0 0, -7 0 Q 0 0, 0 7 Q 0 0, 7 0 Q 0 0, 0 -7 Z" fill="#FDE68A" opacity="0.75" />
              </g>
            </svg>
          </div>
        )}
        {/* ============================================================== */}
        {/* BOX 1 CONTENT: LARGER PANEL (FLEX: 7) - QUIZZES                */}
        {/* ============================================================== */}
        <div className="box1-content">
          {/* STAGE 1: QUIZZES CATEGORY CAROUSEL */}
          {!selectedQuizCategory ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '100%',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h1 style={{
                  color: '#FFFFFF',
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 850,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span>Course</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 30%, #F59E0B 70%, #D97706 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 14px rgba(245, 158, 11, 0.4))'
                  }}>
                    Quizzes
                  </span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, margin: '8px 0 0', fontWeight: 500 }}>
                  Select a subject domain to enter quizzes and test your knowledge.
                </p>
              </div>

              <CategoryShowcaseCarousel
                items={quizCategoryShowcaseItems}
                itemTypeLabel="Quizzes"
                theme="gold"
                onSelectCategory={(cat) => {
                  setSelectedQuizCategory(cat);
                  setQuizPage(1);
                }}
              />
            </div>
          ) : (
            /* STAGE 2: QUIZZES DRILLDOWN */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              minHeight: 0
            }}>
              {/* Drilldown Top Bar */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'rgba(12, 16, 24, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 14,
                  flexWrap: 'wrap',
                  rowGap: 10,
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
                    <button
                      onClick={() => {
                        setSelectedQuizCategory(null);
                        setQuizPage(1);
                        setQuizSearch('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        color: '#FDE68A',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Domains</span>
                    </button>

                    <h2 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {selectedQuizCategory}
                    </h2>
                    <span style={{
                      fontSize: 11.5,
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#FDE68A',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {filteredQuizzes.length} Quizzes
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div style={{
                    position: 'relative',
                    minWidth: 140,
                    maxWidth: 220,
                    flex: '1 1 140px'
                  }}>
                    <Search size={14} color="#F59E0B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={quizSearch}
                      onChange={(e) => setQuizSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        background: 'rgba(10, 13, 20, 0.85)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12.5,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {quizSearch && (
                      <button
                        onClick={() => setQuizSearch('')}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Cards Grid */}
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(245, 158, 11, 0.3)', borderTopColor: '#F59E0B', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : filteredQuizzes.length === 0 ? (
                  <div style={{ background: 'rgba(12, 16, 24, 0.75)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 14, padding: '36px 20px', textAlign: 'center' }}>
                    <Award size={36} color="#F59E0B" style={{ marginBottom: 12 }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: 15, margin: '0 0 6px 0' }}>No Quizzes Found</h4>
                    <p style={{ color: '#94A3B8', fontSize: 12.5, margin: 0 }}>No quizzes match your search query in {selectedQuizCategory}.</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: 14,
                    alignItems: 'stretch',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {paginatedQuizzes.map((quiz) => {
                      const qStatus = getQuizStatus(quiz.id);
                      return (
                        <div
                          key={quiz.id}
                          style={{
                            background: '#0C0E14',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: 240,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <span style={{
                                fontSize: 9.5,
                                background: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.28)',
                                color: '#FDE68A',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 600,
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                📚 {getCourseName(quiz.course)}
                              </span>
                              {quiz.chapter && (
                                <span style={{
                                  fontSize: 9.5,
                                  background: 'rgba(251, 191, 36, 0.1)',
                                  color: '#FCD34D',
                                  padding: '2px 8px',
                                  borderRadius: 4
                                }}>
                                  Ch: {quiz.chapter}
                                </span>
                              )}
                            </div>

                            <h3 style={{
                              color: '#FFFFFF',
                              fontSize: 14,
                              fontWeight: 700,
                              margin: '0 0 8px 0',
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {quiz.title}
                            </h3>

                            <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: '#94A3B8', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color="#F59E0B" />
                                <span>{quiz.duration || '10 mins'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HelpCircle size={12} color="#F59E0B" />
                                <span>{quiz.questions?.length || 5} Questions</span>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              Pass Score: <strong style={{ color: '#FDE68A' }}>{quiz.passing_percentage || 70}%</strong>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: 10,
                            marginTop: 8
                          }}>
                            <div>
                              {qStatus.status === 'Passed' && (
                                <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                  <CheckCircle size={13} /> {qStatus.percentage}%
                                </span>
                              )}
                              {qStatus.status === 'Failed' && (
                                <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 700 }}>
                                  Failed ({qStatus.percentage}%)
                                </span>
                              )}
                              {qStatus.status === 'Not Attempted' && (
                                <span style={{ fontSize: 11, color: '#64748B' }}>
                                  Not Attempted
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleStartAttempt(quiz)}
                              style={{
                                background: qStatus.status === 'Passed'
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
                                color: qStatus.status === 'Passed' ? '#FFFFFF' : '#000000',
                                border: qStatus.status === 'Passed' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: 'none',
                                transform: 'none',
                                transition: 'none'
                              }}
                            >
                              <span>{qStatus.status === 'Passed' ? 'Retake' : 'Start'}</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pacman Pagination */}
              {totalQuizPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px 0' }}>
                  <PacmanPagination
                    currentPage={quizPage}
                    totalPages={totalQuizPages}
                    onPageChange={(p) => setQuizPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* BOX 1 SIDE: SMALLER PANEL - QUIZ BOT PARTICLE ANIMATION        */}
        {/* ============================================================== */}
        <div className="box1-side">
          {/* Interactive Particle Bot Canvas (Golden & White Particles, No Obscuring Glow) */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            height: isMobile ? 280 : 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <VedikaParticleBot
              src="/vedika-bot-quiz.png?v=12"
              colorMode="golden"
              width={isMobile ? 320 : 460}
              height={isMobile ? 260 : 400}
              inline={true}
              particleStep={isMobile ? 3 : 2}
            />
          </div>

          {/* Mode Switch Pill */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: 8,
            zIndex: 3
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 9999,
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#FDE68A',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'none',
                boxShadow: 'none',
                transform: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.55)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
                e.currentTarget.style.color = '#FDE68A';
              }}
            >
              <span>Assignments Mode</span>
              <ChevronRight size={14} color="#F59E0B" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOX 2 SIDE: SMALLER PANEL - ASSIGNMENT BOT PARTICLE ANIMATION  */}
        {/* ============================================================== */}
        <div className="box2-side">
          {/* Interactive Particle Bot Canvas (Cosmic Purple & White Ultra-Crisp Micro-Particles) */}
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            height: isMobile ? 280 : 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <VedikaParticleBot
              src="/vedika-bot-assignment.png?v=12"
              colorMode="cosmic-purple"
              width={isMobile ? 320 : 460}
              height={isMobile ? 260 : 400}
              inline={true}
              particleStep={isMobile ? 3 : 2}
            />
          </div>

          {/* Mode Switch Pill */}
          <div style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginTop: 8,
            zIndex: 3
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 9999,
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                color: '#E9D5FF',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                transition: 'none',
                boxShadow: 'none',
                transform: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.22)';
                e.currentTarget.style.borderColor = 'rgba(192, 132, 252, 0.6)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                e.currentTarget.style.color = '#E9D5FF';
              }}
            >
              <ArrowLeft size={14} color="#C084FC" />
              <span>Quizzes Mode</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOX 2 CONTENT: LARGER PANEL - ASSIGNMENTS                      */}
        {/* ============================================================== */}
        <div className="box2-content">
          {/* STAGE 1: ASSIGNMENTS CATEGORY CAROUSEL */}
          {!selectedAssignmentCategory ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '100%',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: 16 }}>
                <h1 style={{
                  color: '#FFFFFF',
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: 850,
                  margin: 0,
                  letterSpacing: '-0.03em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span>Course</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #FAF5FF 0%, #E9D5FF 30%, #C084FC 70%, #A855F7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 14px rgba(168, 85, 247, 0.5))'
                  }}>
                    Assignments
                  </span>
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, margin: '8px 0 0', fontWeight: 500 }}>
                  Select a subject domain to view and submit your assignments.
                </p>
              </div>

              <CategoryShowcaseCarousel
                items={assignmentCategoryShowcaseItems}
                itemTypeLabel="Assignments"
                theme="purple"
                onSelectCategory={(cat) => {
                  setSelectedAssignmentCategory(cat);
                  setAssignmentPage(1);
                }}
              />
            </div>
          ) : (
            /* STAGE 2: ASSIGNMENTS DRILLDOWN */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              width: '100%',
              height: '100%',
              minHeight: 0
            }}>
              <div>
                {/* Drilldown Top Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'rgba(168, 85, 247, 0.04)',
                  border: '1px solid rgba(168, 85, 247, 0.16)',
                  borderRadius: 12,
                  flexWrap: 'wrap',
                  rowGap: 10,
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
                    <button
                      onClick={() => {
                        setSelectedAssignmentCategory(null);
                        setAssignmentPage(1);
                        setAssignmentSearch('');
                        setAssignmentCourseFilter('all');
                        setAssignmentChapterFilter('all');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        color: '#E9D5FF',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Domains</span>
                    </button>

                    <h2 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {selectedAssignmentCategory}
                    </h2>
                    <span style={{
                      fontSize: 11.5,
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      color: '#E9D5FF',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {filteredAssignments.length} Assignments
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    minWidth: 0,
                    flex: '1 1 auto',
                    justifyContent: 'flex-end'
                  }}>
                    {/* Course Filter */}
                    <select
                      value={assignmentCourseFilter}
                      onChange={(e) => setAssignmentCourseFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(14, 10, 24, 0.85)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                        maxWidth: 130,
                        minWidth: 90,
                        flexShrink: 1
                      }}
                    >
                      <option value="all">All Courses</option>
                      {categoryFilteredCourses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>

                    {/* Chapter Filter */}
                    <select
                      value={assignmentChapterFilter}
                      onChange={(e) => setAssignmentChapterFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(14, 10, 24, 0.85)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                        maxWidth: 115,
                        minWidth: 80,
                        flexShrink: 1
                      }}
                    >
                      <option value="all">All Chapters</option>
                      {uniqueChapters.map((ch) => (
                        <option key={ch} value={ch}>Chapter {ch}</option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div style={{
                      position: 'relative',
                      minWidth: 120,
                      maxWidth: 180,
                      flex: '1 1 120px'
                    }}>
                      <Search size={14} color="#C084FC" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search assignments..."
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 28px',
                          background: 'rgba(14, 10, 24, 0.85)',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontSize: 12,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cards Grid */}
                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(168, 85, 247, 0.3)', borderTopColor: '#A855F7', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div style={{ background: 'rgba(12, 8, 24, 0.75)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: 14, padding: '36px 20px', textAlign: 'center' }}>
                    <FileText size={36} color="#A855F7" style={{ marginBottom: 12 }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: 15, margin: '0 0 6px 0' }}>No Assignments Found</h4>
                    <p style={{ color: '#94A3B8', fontSize: 12.5, margin: 0 }}>No assignments found matching your filter selections.</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: 14,
                    alignItems: 'stretch',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {paginatedAssignments.map((ass) => {
                      const aStatus = getAssignmentStatus(ass.id);
                      return (
                        <div
                          key={ass.id}
                          style={{
                            background: '#0C0818',
                            border: '1px solid rgba(168, 85, 247, 0.25)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: 240,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <span style={{
                                fontSize: 9.5,
                                background: 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.28)',
                                color: '#E9D5FF',
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontWeight: 600,
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                📚 {getCourseName(ass.course)}
                              </span>
                              {ass.chapter && (
                                <span style={{
                                  fontSize: 9.5,
                                  background: 'rgba(192, 132, 252, 0.1)',
                                  border: '1px solid rgba(192, 132, 252, 0.25)',
                                  color: '#D8B4FE',
                                  padding: '2px 8px',
                                  borderRadius: 4
                                }}>
                                  Ch: {ass.chapter}
                                </span>
                              )}
                            </div>

                            <h3 style={{
                              color: '#FFFFFF',
                              fontSize: 14,
                              fontWeight: 700,
                              margin: '0 0 8px 0',
                              lineHeight: 1.35,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {ass.title}
                            </h3>

                            <div style={{ display: 'flex', gap: 12, fontSize: 11.5, color: '#94A3B8', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} color="#A855F7" />
                                <span>{ass.type || 'Written Task'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileText size={12} color="#A855F7" />
                                <span>{ass.questions?.length || 1} Prompts</span>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              Min Response: <strong style={{ color: '#E9D5FF' }}>{ass.min_char_count || 20} chars</strong>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            paddingTop: 10,
                            marginTop: 8
                          }}>
                            <div>
                              {aStatus.graded ? (
                                <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                  <CheckCircle size={13} /> Graded: {aStatus.score}/{aStatus.max_score}
                                </span>
                              ) : aStatus.status.startsWith('Submitted') ? (
                                <span style={{ fontSize: 11, color: '#C084FC', fontWeight: 600 }}>
                                  Submitted (Review)
                                </span>
                              ) : (
                                <span style={{ fontSize: 11, color: '#64748B' }}>
                                  Not Submitted
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleOpenAssignmentPrompt(ass)}
                              style={{
                                background: aStatus.status !== 'Not Submitted'
                                  ? 'rgba(255, 255, 255, 0.06)'
                                  : 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
                                color: '#FFFFFF',
                                border: aStatus.status !== 'Not Submitted' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                                padding: '6px 14px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: 'none',
                                transform: 'none',
                                transition: 'none'
                              }}
                            >
                              <span>{aStatus.status !== 'Not Submitted' ? 'View Work' : 'Solve'}</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pacman Pagination */}
              {totalAssignmentPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px 0' }}>
                  <PacmanPagination
                    currentPage={assignmentPage}
                    totalPages={totalAssignmentPages}
                    onPageChange={(p) => setAssignmentPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ATTEMPT QUIZ                                            */}
      {/* ============================================================== */}
      {isAttemptingQuiz && selectedQuiz && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 8, 15, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: isMobile ? '70px 14px 20px 14px' : '76px 24px 30px 24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.75)',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>
                  {selectedQuiz.title}
                </h2>
                <span style={{ fontSize: 11.5, color: '#94A3B8' }}>
                  Passing rate requirement: {selectedQuiz.passing_percentage || 70}%
                </span>
              </div>
              <button
                onClick={() => setIsAttemptingQuiz(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
              {quizScore ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: quizScore.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <Award size={28} color={quizScore.passed ? '#10B981' : '#EF4444'} />
                  </div>
                  <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, margin: '0 0 6px 0' }}>
                    {quizScore.passed ? 'Congratulations! You Passed' : 'Quiz Attempt Failed'}
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: 13.5, margin: '0 0 20px 0' }}>
                    You scored {quizScore.score} out of {quizScore.total} questions ({quizScore.percentage}%)
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    {!quizScore.passed && (
                      <button
                        onClick={() => handleStartAttempt(selectedQuiz)}
                        style={{
                          background: '#7C3AED', color: '#fff', border: 'none',
                          padding: '8px 16px', borderRadius: 8, fontSize: 12.5,
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setIsAttemptingQuiz(false)}
                      style={{
                        background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF', padding: '8px 16px', borderRadius: 8,
                        fontSize: 12.5, cursor: 'pointer'
                      }}
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>
                      Question {currentQuizQIdx + 1} of {selectedQuiz.questions.length}
                    </span>
                    <span style={{ fontSize: 12, color: '#A78BFA', fontWeight: 600 }}>
                      {selectedQuiz.duration || '10 mins'}
                    </span>
                  </div>

                  <h3 style={{ color: '#FFFFFF', fontSize: 14.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 16 }}>
                    {selectedQuiz.questions[currentQuizQIdx]?.question}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {selectedQuiz.questions[currentQuizQIdx]?.options?.map((opt, oIdx) => {
                      const isSelected = quizAnswers[currentQuizQIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectQuizOption(oIdx)}
                          style={{
                            background: isSelected ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1.5px solid ${isSelected ? '#7C3AED' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: 10,
                            padding: '12px 16px',
                            color: isSelected ? '#C4B5FD' : '#E2E8F0',
                            fontSize: 13,
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#A855F7' : '#64748B'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7' }} />}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentQuizQIdx((i) => Math.max(0, i - 1))}
                      disabled={currentQuizQIdx === 0}
                      style={{
                        background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF', padding: '6px 14px', borderRadius: 8,
                        fontSize: 12, cursor: currentQuizQIdx === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentQuizQIdx === 0 ? 0.4 : 1
                      }}
                    >
                      Previous
                    </button>

                    {currentQuizQIdx < selectedQuiz.questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuizQIdx((i) => i + 1)}
                        style={{
                          background: '#7C3AED', color: '#FFFFFF', border: 'none',
                          padding: '6px 16px', borderRadius: 8, fontSize: 12,
                          fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleQuizSubmit}
                        disabled={submittingQuiz || quizAnswers.includes(null)}
                        style={{
                          background: '#10B981', color: '#FFFFFF', border: 'none',
                          padding: '6px 18px', borderRadius: 8, fontSize: 12,
                          fontWeight: 700, cursor: submittingQuiz || quizAnswers.includes(null) ? 'not-allowed' : 'pointer',
                          opacity: submittingQuiz || quizAnswers.includes(null) ? 0.5 : 1
                        }}
                      >
                        {submittingQuiz ? 'Submitting...' : 'Finish & Submit'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: VIEW / SUBMIT ASSIGNMENT                                */}
      {/* ============================================================== */}
      {isViewingAssignmentPrompt && selectedAssignment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 8, 15, 0.88)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: isMobile ? '70px 14px 20px 14px' : '76px 24px 30px 24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: '#0D0819',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 640,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: 16, fontWeight: 700 }}>
                  {selectedAssignment.title}
                </h2>
                <span style={{ fontSize: 11.5, color: '#C084FC' }}>
                  {getCourseName(selectedAssignment.course)} • {selectedAssignment.type || 'Text Submission'}
                </span>
              </div>
              <button
                onClick={() => setIsViewingAssignmentPrompt(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
              {assignmentSuccessMsg ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <CheckCircle size={30} color="#10B981" />
                  </div>
                  <h3 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                    Assignment Submitted
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 20px 0' }}>
                    {assignmentSuccessMsg}
                  </p>
                  <button
                    onClick={() => setIsViewingAssignmentPrompt(false)}
                    style={{
                      background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)', color: '#FFFFFF', border: 'none',
                      padding: '8px 18px', borderRadius: 8, fontSize: 12.5,
                      fontWeight: 600, cursor: 'pointer',
                      boxShadow: 'none', transform: 'none', transition: 'none'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAssignmentSubmit}>
                  {/* Status Banner for Existing Submission */}
                  {existingUserSub && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      marginBottom: 14,
                      background: (existingUserSub.status === 'Pass' || (existingUserSub.score !== undefined && existingUserSub.score >= (selectedAssignment.pass_threshold || 70)))
                        ? 'rgba(16, 185, 129, 0.1)'
                        : (existingUserSub.status === 'Fail')
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(168, 85, 247, 0.1)',
                      border: `1px solid ${
                        (existingUserSub.status === 'Pass' || (existingUserSub.score !== undefined && existingUserSub.score >= (selectedAssignment.pass_threshold || 70)))
                          ? 'rgba(16, 185, 129, 0.3)'
                          : (existingUserSub.status === 'Fail')
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(168, 85, 247, 0.3)'
                      }`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: existingUserSub.comments ? 4 : 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: (existingUserSub.status === 'Pass' || (existingUserSub.score !== undefined && existingUserSub.score >= (selectedAssignment.pass_threshold || 70))) ? '#10B981' : (existingUserSub.status === 'Fail') ? '#EF4444' : '#C084FC' }}>
                          {existingUserSub.status ? `Status: ${existingUserSub.status}` : 'Submission Received'}
                          {existingUserSub.score !== undefined && ` (${existingUserSub.score}%)`}
                        </span>
                        {existingUserSub.evaluator && (
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>Evaluated by {existingUserSub.evaluator}</span>
                        )}
                      </div>
                      {existingUserSub.comments && (
                        <p style={{ margin: 0, fontSize: 11.5, color: '#CBD5E1' }}>
                          <strong>Feedback:</strong> {existingUserSub.comments}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Multi-question tabs if > 1 question */}
                  {selectedAssignment.questions?.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
                      {selectedAssignment.questions.map((_, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => setActiveAssignmentQIdx(qIdx)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background: activeAssignmentQIdx === qIdx ? 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: 'none', transform: 'none', transition: 'none'
                          }}
                        >
                          Question {qIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(168, 85, 247, 0.06)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    marginBottom: 14
                  }}>
                    <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C084FC', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                      Task Instruction {selectedAssignment.questions?.length > 1 ? `(Question ${activeAssignmentQIdx + 1} of ${selectedAssignment.questions.length})` : ''}
                    </span>
                    {(() => {
                      const curQ = selectedAssignment.questions?.[activeAssignmentQIdx] || selectedAssignment.question;
                      const promptText = (typeof curQ === 'object' && curQ !== null)
                        ? (curQ.prompt || curQ.question || curQ.title || '')
                        : (curQ || '');
                      const hasHtml = /<[a-z][\s\S]*>/i.test(promptText);

                      return hasHtml ? (
                        <div
                          style={{ margin: 0, fontSize: 13.5, color: '#FFFFFF', lineHeight: 1.6 }}
                          dangerouslySetInnerHTML={{ __html: promptText }}
                        />
                      ) : (
                        <p style={{ margin: 0, fontSize: 13.5, color: '#FFFFFF', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {promptText}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Evaluation Criteria if present */}
                  {Array.isArray(selectedAssignment.evaluation_criteria) && selectedAssignment.evaluation_criteria.length > 0 && (
                    <div style={{
                      marginBottom: 14,
                      padding: 12,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A855F7', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                        Evaluation Criteria (Passing threshold: {selectedAssignment.pass_threshold || 70}%)
                      </span>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#CBD5E1', lineHeight: 1.5 }}>
                        {selectedAssignment.evaluation_criteria.map((crit, idx) => (
                          <li key={idx} style={{ marginBottom: 3 }}>{typeof crit === 'string' ? crit : JSON.stringify(crit)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reference / Sample Answer if show_answer is true and student has submitted */}
                  {selectedAssignment.show_answer && existingUserSub && (
                    <div style={{
                      marginBottom: 14,
                      padding: 12,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.25)'
                    }}>
                      <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34D399', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        Reference Solution {selectedAssignment.questions?.length > 1 ? `(Question ${activeAssignmentQIdx + 1})` : ''}
                      </span>
                      <pre style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#A7F3D0',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        background: 'rgba(0,0,0,0.3)',
                        padding: 8,
                        borderRadius: 6
                      }}>
                        {(() => {
                          const curQ = selectedAssignment.questions?.[activeAssignmentQIdx];
                          return (curQ && typeof curQ === 'object' && curQ.sample_answer)
                            ? curQ.sample_answer
                            : (selectedAssignment.answer || 'No sample answer provided.');
                        })()}
                      </pre>
                    </div>
                  )}

                  {/* View Work Mode vs Active Submit Form Mode */}
                  {!isEditingSubmission && existingUserSub ? (
                    <div>
                      {/* Submitted Response Display Box */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#C084FC', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircle size={14} color="#10B981" />
                            <span>Your Submitted Response {selectedAssignment.questions?.length > 1 ? `(Question ${activeAssignmentQIdx + 1})` : ''}</span>
                          </label>
                          {existingUserSub.timestamp && (
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>
                              Submitted: {new Date(existingUserSub.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div style={{
                          width: '100%',
                          padding: 16,
                          borderRadius: 10,
                          background: 'rgba(12, 8, 22, 0.95)',
                          border: '1.5px solid rgba(168, 85, 247, 0.35)',
                          color: '#FFFFFF',
                          fontSize: 13.5,
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                          fontFamily: selectedAssignment.type === 'Code' ? 'monospace' : 'inherit',
                          minHeight: 120,
                          boxSizing: 'border-box'
                        }}>
                          {assignmentAnswers[activeAssignmentQIdx] || existingUserSub.answer || 'No response recorded.'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                          <span>Character count: {(assignmentAnswers[activeAssignmentQIdx] || existingUserSub.answer || '').length}</span>
                          <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Recorded on Server</span>
                        </div>
                      </div>

                      {/* View Work Mode Action Buttons */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 20 }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingSubmission(true)}
                          style={{
                            background: 'rgba(168, 85, 247, 0.15)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            color: '#C084FC',
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Edit2 size={13} />
                          <span>Edit / Resubmit Answer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsViewingAssignmentPrompt(false)}
                          style={{
                            background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 22px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Textarea */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 11.5, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                          Your Solution Response {selectedAssignment.questions?.length > 1 ? `(Question ${activeAssignmentQIdx + 1})` : ''}:
                        </label>
                        <textarea
                          rows={6}
                          value={assignmentAnswers[activeAssignmentQIdx] || ''}
                          onChange={(e) => {
                            setAssignmentAnswers({
                              ...assignmentAnswers,
                              [activeAssignmentQIdx]: e.target.value
                            });
                          }}
                          placeholder="Write your comprehensive response or paste code solution..."
                          style={{
                            width: '100%',
                            padding: 12,
                            borderRadius: 10,
                            background: 'rgba(12, 8, 22, 0.95)',
                            border: '1.5px solid rgba(168, 85, 247, 0.35)',
                            color: '#FFFFFF',
                            fontSize: 13,
                            outline: 'none',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginTop: 4 }}>
                          <span>Character count: {(assignmentAnswers[activeAssignmentQIdx] || '').length}</span>
                          <span>Min requirement: {selectedAssignment.min_char_count || 20} chars</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (existingUserSub) {
                              setIsEditingSubmission(false);
                            } else {
                              setIsViewingAssignmentPrompt(false);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#FFFFFF',
                            padding: '7px 16px',
                            borderRadius: 8,
                            fontSize: 12,
                            cursor: 'pointer',
                            boxShadow: 'none', transform: 'none', transition: 'none'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingAssignment}
                          style={{
                            background: 'linear-gradient(135deg, #C084FC 0%, #A855F7 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 18px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: submittingAssignment ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: 'none', transform: 'none', transition: 'none'
                          }}
                        >
                          <Send size={13} />
                          <span>{submittingAssignment ? 'Saving...' : existingUserSub ? 'Update Submission' : 'Submit Assignment'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

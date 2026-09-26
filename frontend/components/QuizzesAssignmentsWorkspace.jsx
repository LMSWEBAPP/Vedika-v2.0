'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, FileText, Clock, CheckCircle, X, ChevronRight, HelpCircle,
  ArrowLeft, Search, Send, AlertCircle, Filter, Sparkles, BookOpen, Check
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import {
  getQuizzes, getQuizSubmissions, submitQuizResponse,
  getAssignments, getAssignmentSubmissions, submitAssignmentResponse,
  getCourses, parseQuestionsList
} from '@/lib/frappe';
import { getSubjectArtwork } from '@/lib/artwork';
import CategoryShowcaseCarousel from '@/components/CategoryShowcaseCarousel';
import PacmanPagination from '@/components/PacmanPagination';

export default function QuizzesAssignmentsWorkspace({ initialMode = 'quizzes' }) {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);

  // Active Tab State: 'quizzes' | 'assignments'
  const [activeTab, setActiveTab] = useState(initialMode);
  const isAssignmentsOpen = activeTab === 'assignments';

  // Shared Data States
  const [currentUser, setCurrentUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quizzes Specific States
  const [quizzes, setQuizzes] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
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
  const [assignments, setAssignments] = useState([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
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

  // Read current user
  useEffect(() => {
    const stored = localStorage.getItem('frappe_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // Fetch initial combined data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [quizList, courseList, qSubs, assList, aSubs] = await Promise.all([
          getQuizzes(),
          getCourses(),
          getQuizSubmissions(),
          getAssignments(),
          getAssignmentSubmissions()
        ]);
        setQuizzes(quizList || []);
        setCourses(courseList || []);
        setQuizSubmissions(qSubs || []);
        setAssignments(assList || []);
        setAssignmentSubmissions(aSubs || []);
      } catch (e) {
        console.error('Failed to load quizzes & assignments data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
      artwork: getSubjectArtwork(cat),
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
    const existingSub = assignmentSubmissions.find(
      (s) => s.assignment === ass.id && (s.member === currentUser?.username || s.member === currentUser?.email)
    );
    const initialAns = {};
    if (existingSub && existingSub.answer) {
      initialAns[0] = existingSub.answer;
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
        assignment: selectedAssignment.id,
        assignment_title: selectedAssignment.title,
        type: selectedAssignment.type || 'Text',
        member: currentUser.username || currentUser.email,
        member_name: currentUser.name || 'Student',
        answer: fullAnswerText,
        course: selectedAssignment.course,
        question: selectedAssignment.question || ''
      };
      await submitAssignmentResponse(subPayload);
      setAssignmentSuccessMsg('Assignment submitted successfully! An instructor will review and grade your work.');
      const freshSubs = await getAssignmentSubmissions();
      setAssignmentSubmissions(freshSubs || []);
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
          background: #090D18;
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        }

        /* DEFAULT STATE: QUIZZES ACTIVE */
        .box1-content {
          background: #090D18;
          flex: 7 !important;
          max-width: 74% !important;
          display: flex;
          flex-direction: column;
          opacity: 1 !important;
          min-width: 0;
          overflow-y: auto;
          padding: ${isMobile ? '14px 12px' : '18px 36px 16px 36px'};
          box-sizing: border-box;
          pointer-events: auto !important;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .box1-side {
          background: linear-gradient(180deg, rgba(20, 16, 44, 0.94) 0%, rgba(9, 13, 26, 0.98) 100%);
          border-left: 1px solid rgba(124, 58, 237, 0.2);
          flex: 3 !important;
          max-width: 26% !important;
          opacity: 1 !important;
          min-width: 0;
          padding: 22px 20px;
          pointer-events: auto !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* COLLAPSED ASSIGNMENTS IN DEFAULT STATE */
        .box2-side {
          background: linear-gradient(180deg, rgba(10, 24, 44, 0.94) 0%, rgba(7, 13, 24, 0.98) 100%);
          border-right: none !important;
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
          background: #070B14;
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
          flex: 3 !important;
          max-width: 26% !important;
          opacity: 1 !important;
          padding: 22px 20px !important;
          border-right: 1px solid rgba(14, 165, 233, 0.2) !important;
          pointer-events: auto !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .box-container.right-open .box2-content {
          flex: 7 !important;
          max-width: 74% !important;
          opacity: 1 !important;
          padding: ${isMobile ? '14px 12px' : '18px 36px 16px 36px'} !important;
          pointer-events: auto !important;
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
            padding: 14px 12px !important;
          }
        }
      `}</style>

      <div className={`box-container ${isAssignmentsOpen ? 'right-open' : ''}`}>
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
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.03em'
                }}>
                  Course Quizzes
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, margin: '6px 0 0' }}>
                  Select a subject domain to enter quizzes and test your knowledge.
                </p>
              </div>

              <CategoryShowcaseCarousel
                items={quizCategoryShowcaseItems}
                itemTypeLabel="Quizzes"
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
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#94A3B8',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Domains</span>
                    </button>

                    <h2 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700 }}>
                      {selectedQuizCategory}
                    </h2>
                    <span style={{
                      fontSize: 11.5,
                      background: 'rgba(124, 58, 237, 0.15)',
                      color: '#C4B5FD',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600
                    }}>
                      {filteredQuizzes.length} Quizzes
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div style={{ position: 'relative', width: isMobile ? '100%' : 240 }}>
                    <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search quizzes..."
                      value={quizSearch}
                      onChange={(e) => setQuizSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(124, 58, 237, 0.3)', borderTopColor: '#7C3AED', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : filteredQuizzes.length === 0 ? (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '36px 20px', textAlign: 'center' }}>
                    <Award size={36} color="#64748B" style={{ marginBottom: 12 }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: 15, margin: '0 0 6px 0' }}>No Quizzes Found</h4>
                    <p style={{ color: '#94A3B8', fontSize: 12.5, margin: 0 }}>No quizzes match your search query in {selectedQuizCategory}.</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: 14,
                    alignItems: 'stretch'
                  }}>
                    {paginatedQuizzes.map((quiz) => {
                      const qStatus = getQuizStatus(quiz.id);
                      return (
                        <div
                          key={quiz.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(124, 58, 237, 0.2)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: 240,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <span style={{
                                fontSize: 9.5,
                                background: 'rgba(124, 58, 237, 0.15)',
                                border: '1px solid rgba(124, 58, 237, 0.3)',
                                color: '#C4B5FD',
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
                                  background: 'rgba(56, 189, 248, 0.12)',
                                  color: '#38BDF8',
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
                                <Clock size={12} />
                                <span>{quiz.duration || '10 mins'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HelpCircle size={12} />
                                <span>{quiz.questions?.length || 5} Questions</span>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              Pass Score: <strong style={{ color: '#E2E8F0' }}>{quiz.passing_percentage || 70}%</strong>
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
                                background: qStatus.status === 'Passed' ? 'rgba(255, 255, 255, 0.06)' : '#7C3AED',
                                color: '#FFFFFF',
                                border: qStatus.status === 'Passed' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
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
        {/* BOX 1 SIDE: SMALLER PANEL (FLEX: 3) - QUIZZES OVERVIEW         */}
        {/* ============================================================== */}
        <div className="box1-side" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '36px 22px'
        }}>
          {/* Middle: Clean Hub Icon */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '12px 16px'
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(99, 102, 241, 0.12) 100%)',
              border: '1.5px solid rgba(124, 58, 237, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Award size={38} color="#C4B5FD" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Quizzes
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Interactive Assessments & Tests
            </span>
          </div>

          {/* Switch to Assignments Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('assignments')}
              style={{
                width: '100%',
                maxWidth: 270,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: 'none',
                transform: 'none',
                transition: 'none'
              }}
            >
              <span>Assignments Mode →</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOX 2 SIDE: SMALLER PANEL (FLEX: 3) - ASSIGNMENTS OVERVIEW     */}
        {/* ============================================================== */}
        <div className="box2-side" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '36px 22px'
        }}>
          {/* Middle: Clean Hub Icon */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '12px 16px'
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(37, 99, 235, 0.12) 100%)',
              border: '1.5px solid rgba(14, 165, 233, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <FileText size={38} color="#7DD3FC" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
              Assignments
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
              Practical Tasks & Projects
            </span>
          </div>

          {/* Switch to Quizzes Button */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              style={{
                width: '100%',
                maxWidth: 270,
                padding: '12px 18px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: 'none',
                transform: 'none',
                transition: 'none'
              }}
            >
              <span>← Quizzes Mode</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOX 2 CONTENT: LARGER PANEL (FLEX: 7) - ASSIGNMENTS            */}
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
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: '-0.03em'
                }}>
                  Subject Assignments
                </h1>
                <p style={{ color: '#94A3B8', fontSize: 13.5, margin: '6px 0 0' }}>
                  Choose a course track to access written exercises and project evaluations.
                </p>
              </div>

              <CategoryShowcaseCarousel
                items={assignmentCategoryShowcaseItems}
                itemTypeLabel="Assignments"
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
                  gap: 10,
                  marginBottom: 16,
                  padding: '10px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#94A3B8',
                        padding: '6px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Domains</span>
                    </button>

                    <h2 style={{ margin: 0, fontSize: 16, color: '#FFFFFF', fontWeight: 700 }}>
                      {selectedAssignmentCategory}
                    </h2>
                    <span style={{
                      fontSize: 11.5,
                      background: 'rgba(14, 165, 233, 0.15)',
                      color: '#7DD3FC',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontWeight: 600
                    }}>
                      {filteredAssignments.length} Assignments
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    {/* Course Filter */}
                    <select
                      value={assignmentCourseFilter}
                      onChange={(e) => setAssignmentCourseFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                        maxWidth: 150
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
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        color: '#FFFFFF',
                        fontSize: 12,
                        outline: 'none',
                        maxWidth: 130
                      }}
                    >
                      <option value="all">All Chapters</option>
                      {uniqueChapters.map((ch) => (
                        <option key={ch} value={ch}>Chapter {ch}</option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div style={{ position: 'relative', width: isMobile ? '100%' : 180 }}>
                      <Search size={14} color="#64748B" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search assignments..."
                        value={assignmentSearch}
                        onChange={(e) => setAssignmentSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px 6px 28px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(14, 165, 233, 0.3)', borderTopColor: '#0EA5E9', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : filteredAssignments.length === 0 ? (
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: '36px 20px', textAlign: 'center' }}>
                    <FileText size={36} color="#64748B" style={{ marginBottom: 12 }} />
                    <h4 style={{ color: '#FFFFFF', fontSize: 15, margin: '0 0 6px 0' }}>No Assignments Found</h4>
                    <p style={{ color: '#94A3B8', fontSize: 12.5, margin: 0 }}>No assignments found matching your filter selections.</p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                    gap: 14,
                    alignItems: 'stretch'
                  }}>
                    {paginatedAssignments.map((ass) => {
                      const aStatus = getAssignmentStatus(ass.id);
                      return (
                        <div
                          key={ass.id}
                          style={{
                            background: 'rgba(15, 23, 42, 0.7)',
                            border: '1px solid rgba(14, 165, 233, 0.2)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: 240,
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                              <span style={{
                                fontSize: 9.5,
                                background: 'rgba(14, 165, 233, 0.15)',
                                border: '1px solid rgba(14, 165, 233, 0.3)',
                                color: '#7DD3FC',
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
                                  background: 'rgba(168, 85, 247, 0.12)',
                                  color: '#C4B5FD',
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
                                <Clock size={12} />
                                <span>{ass.type || 'Written Task'}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FileText size={12} />
                                <span>{ass.questions?.length || 1} Prompts</span>
                              </div>
                            </div>

                            <div style={{ fontSize: 11, color: '#94A3B8' }}>
                              Min Response: <strong style={{ color: '#E2E8F0' }}>{ass.min_char_count || 20} chars</strong>
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
                                <span style={{ fontSize: 11, color: '#38BDF8', fontWeight: 600 }}>
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
                                background: aStatus.status !== 'Not Submitted' ? 'rgba(255, 255, 255, 0.06)' : '#0EA5E9',
                                color: '#FFFFFF',
                                border: aStatus.status !== 'Not Submitted' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4
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
          background: 'rgba(7, 8, 15, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 580,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
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
          background: 'rgba(7, 8, 15, 0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#0F172A',
            border: '1px solid rgba(14, 165, 233, 0.3)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 640,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxHeight: '88vh',
            display: 'flex',
            flexDirection: 'column'
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
                <span style={{ fontSize: 11.5, color: '#38BDF8' }}>
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
                      background: '#0EA5E9', color: '#FFFFFF', border: 'none',
                      padding: '8px 18px', borderRadius: 8, fontSize: 12.5,
                      fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAssignmentSubmit}>
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
                            background: activeAssignmentQIdx === qIdx ? '#0EA5E9' : 'rgba(255, 255, 255, 0.05)',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Prompt {qIdx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question Prompt */}
                  <div style={{
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 14
                  }}>
                    <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38BDF8', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                      Task Instruction
                    </span>
                    <p style={{ margin: 0, fontSize: 13.5, color: '#FFFFFF', lineHeight: 1.5 }}>
                      {selectedAssignment.questions?.[activeAssignmentQIdx] || selectedAssignment.question}
                    </p>
                  </div>

                  {/* Textarea */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11.5, color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                      Your Solution Response:
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
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1.5px solid rgba(14, 165, 233, 0.3)',
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
                      onClick={() => setIsViewingAssignmentPrompt(false)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#FFFFFF',
                        padding: '7px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAssignment}
                      style={{
                        background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '7px 18px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: submittingAssignment ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Send size={13} />
                      <span>{submittingAssignment ? 'Submitting...' : 'Submit Assignment'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

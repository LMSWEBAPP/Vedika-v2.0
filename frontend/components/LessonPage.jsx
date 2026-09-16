'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain, CheckCircle, Circle, ChevronRight, Clock,
  Loader2, Sparkles, RotateCcw, ArrowLeft, Send,
  FileText, Award, AlertCircle, ThumbsUp, HelpCircle, Terminal,
  BookOpen, Bot, MessageSquare, Mic, MicOff, BookMarked,
  Trash2, Plus, Play, Download, Bell, Megaphone, X
} from 'lucide-react';
import { T, COURSE, geminiCall, buildQuizPrompt, parseQuizOutput, getCourseDetails } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import dynamic from 'next/dynamic';
import {
  getCourses, getQuizzes, submitQuizResponse, getQuizSubmissions,
  getAssignments, submitAssignmentResponse, getAssignmentSubmissions,
  getNotifications
} from '@/lib/frappe';
import PDFViewerModal from './PDFViewerModal';
import VideoPlayerWithAI from './VideoPlayerWithAI';
import VideoAIExplainerCard from './VideoAIExplainerCard';
import PracticePlaygroundModal from './PracticePlaygroundModal';
import CompanionTabs, { TABS } from './CompanionTabs';
import OverviewModal from './OverviewModal';
import './LessonPage.css';

function formatTimestamp(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function extractYoutubeId(urlOrId) {
  if (!urlOrId) return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const match = String(urlOrId).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : urlOrId;
}

export default function LessonPage({ lesson, completed = {}, onComplete }) {
  const router  = useRouter();
  const [next, setNext] = useState(null);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedPdfResource, setSelectedPdfResource] = useState(null);

  // Video & AI states
  const [videoSeekTime, setVideoSeekTime] = useState(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [aiExplainerData, setAiExplainerData] = useState(null);
  const [explainerLoading, setExplainerLoading] = useState(false);
  const [activeCompanionTab, setActiveCompanionTab] = useState('ask_vedika'); // 'ask_vedika' | 'notes' | 'qa' | 'quiz'
  const [isOverviewModalOpen, setIsOverviewModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 90-10 collapsed by default, 50-50 when expanded

  // Q&A Chat states
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Personal Notes states
  const [notes, setNotes] = useState([]);
  const [allCourseNotes, setAllCourseNotes] = useState([]);
  const [noteFilter, setNoteFilter] = useState('lesson'); // 'lesson' | 'course'
  const [recentNoteAlert, setRecentNoteAlert] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [forcePause, setForcePause] = useState(false);
  const recognitionRef = useRef(null);
  const dictationBaseTextRef = useRef('');

  // Course Announcements state
  const [announcements, setAnnouncements] = useState([]);

  // Resolve module
  const mod = lesson.module || COURSE.modules.find(m => m.lessons.some(l => l.id === lesson.id)) || COURSE.modules[0];

  // System states
  const [currentUser, setCurrentUser] = useState(null);
  const isMobile = useMediaQuery(isMobileMQ);
  const isTabletOrSmallDesktop = useMediaQuery('(max-width: 1150px)');
  const rPad = isMobile ? 16 : 32;

  // AI Practice Quiz states
  const [aiQuiz,    setAiQuiz]    = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErr,     setAiErr]     = useState('');
  const [aiQuizIdx, setAiQuizIdx] = useState(0);
  const [aiQuizAns, setAiQuizAns] = useState(null);

  // Official Quizzes & Assignments states
  const [officialQuiz, setOfficialQuiz] = useState(null);
  const [officialAssignment, setOfficialAssignment] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [assignmentSub, setAssignmentSub] = useState(null);
  
  // Official Quiz Attempt State
  const [isOfficialQuizActive, setIsOfficialQuizActive] = useState(false);
  const [officialQuizIdx, setOfficialQuizIdx] = useState(0);
  const [officialQuizAnswers, setOfficialQuizAnswers] = useState([]);
  const [officialQuizScore, setOfficialQuizScore] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Official Assignment Submission State
  const [assignmentText, setAssignmentText] = useState('');
  const [submittingAss, setSubmittingAss] = useState(false);
  const [assSuccessMsg, setAssSuccessMsg] = useState('');

  // Load current user & notes
  useEffect(() => {
    const stored = localStorage.getItem('frappe_user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch (e) {}
    }

    // Load notes from localStorage
    try {
      const lessonKey = `vedika_notes_${lesson?.id || 'general'}`;
      const savedLessonNotes = localStorage.getItem(lessonKey);
      if (savedLessonNotes) setNotes(JSON.parse(savedLessonNotes));

      const courseKey = `vedika_course_notes_${lesson?.courseId || 'general'}`;
      const savedCourseNotes = localStorage.getItem(courseKey);
      if (savedCourseNotes) setAllCourseNotes(JSON.parse(savedCourseNotes));
    } catch (e) {
      console.warn("Could not load notes:", e);
    }

    // Load Announcements / Notifications
    getNotifications().then(notifs => {
      const courseAlerts = (notifs || []).filter(n => 
        !lesson.courseId || n.course === lesson.courseId || n.category === 'Enrollment' || n.category === 'System'
      );
      setAnnouncements(courseAlerts.slice(0, 3));
    }).catch(() => {
      // Offline fallback announcements
      setAnnouncements([
        {
          id: 'ann-1',
          title: `Welcome to ${lesson.title}`,
          content: 'Remember to complete both the Practice Quiz and Official Assignment to track your progress score.',
          timestamp: 'Recently'
        }
      ]);
    });
  }, [lesson?.id, lesson?.courseId]);

  // Dynamically load next lesson
  useEffect(() => {
    async function loadNext() {
      try {
        const courses = await getCourses();
        const allLessons = [];
        courses.forEach(course => {
          const details = getCourseDetails(course);
          if (details && details.modules) {
            details.modules.forEach(m => {
              m.lessons.forEach(l => {
                allLessons.push(l);
              });
            });
          }
        });
        const allIds = allLessons.map(l => l.id);
        const idx = allIds.indexOf(lesson.id);
        if (idx !== -1 && idx < allLessons.length - 1) {
          setNext(allLessons[idx + 1]);
        } else {
          setNext(null);
        }
      } catch (e) {
        console.error("Error loading next lesson:", e);
      }
    }
    loadNext();
  }, [lesson?.id]);

  // Fetch official quizzes, assignments, and student submissions
  useEffect(() => {
    if (!currentUser) return;

    async function loadOfficialLmsData() {
      try {
        const [quizzes, assignments, quizSubs, assSubs] = await Promise.all([
          getQuizzes(),
          getAssignments(),
          getQuizSubmissions(),
          getAssignmentSubmissions()
        ]);

        const linkedQuiz = quizzes.find(q => q.lesson === lesson.id || (q.course === lesson.courseId && !q.lesson));
        setOfficialQuiz(linkedQuiz || null);

        const linkedAss = assignments.find(a => a.course === lesson.courseId);
        setOfficialAssignment(linkedAss || null);

        if (linkedQuiz) {
          setQuizAttempts(quizSubs.filter(s => s.quiz === linkedQuiz.id && s.member === currentUser.username));
        }

        if (linkedAss) {
          setAssignmentSub(assSubs.find(s => s.assignment === linkedAss.id && s.member === currentUser.username));
        }
      } catch (e) {
        console.error("Failed to load official quiz data:", e);
      }
    }

    loadOfficialLmsData();
  }, [lesson?.id, lesson?.courseId, currentUser]);

  // --------------------------------------------------------------------------
  // TAB 1: ASK VEDIKA HANDLER
  // --------------------------------------------------------------------------
  const handleExplainMoment = async (optionalSecs) => {
    setForcePause(true);
    setTimeout(() => setForcePause(false), 400);

    const targetSecs = typeof optionalSecs === 'number' ? optionalSecs : Math.floor(videoCurrentTime || 0);
    const vId = extractYoutubeId(lesson?.vid);
    setExplainerLoading(true);

    try {
      const res = await fetch('/api/youtube/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: vId,
          timestamp: targetSecs,
          title: lesson?.title || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplainerData(data);
      } else {
        throw new Error('Explain request failed');
      }
    } catch (err) {
      console.warn('Explain moment fallback:', err);
      // Gemini fallback
      try {
        const gemRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: `You are Vedika, an expert AI tutor for the lesson "${lesson.title}". Explain the key concept at timestamp ${formatTimestamp(targetSecs)} clearly with key takeaways.`,
            user: `Explain the concept being taught at ${formatTimestamp(targetSecs)} in ${lesson.title}. Overview: ${lesson.overview}`
          })
        });
        if (gemRes.ok) {
          const gemData = await gemRes.json();
          setAiExplainerData({
            timestamp: formatTimestamp(targetSecs),
            coreExplanation: gemData.text || 'Key learning moment.',
            keyTakeaways: [lesson.overview?.slice(0, 80) || 'Core conceptual point.'],
            transcriptSnippet: `Video paused at ${formatTimestamp(targetSecs)}.`
          });
        }
      } catch (e) {}
    } finally {
      setExplainerLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // TAB 2: PERSONAL NOTES HANDLERS
  // --------------------------------------------------------------------------
  const handleSaveManualNote = (e) => {
    if (e) e.preventDefault();
    if (!newNoteText.trim()) return;

    const noteObj = {
      id: Date.now().toString(),
      lessonId: lesson?.id,
      lessonTitle: lesson?.title,
      courseId: lesson?.courseId || 'general',
      courseTitle: lesson?.courseTitle || COURSE?.title || 'Course',
      noteText: newNoteText.trim(),
      timestampSeconds: Math.floor(videoCurrentTime || 0),
      timestampFormatted: formatTimestamp(videoCurrentTime),
      source: isDictating ? 'dictated' : 'manual',
      createdAt: new Date().toISOString()
    };

    const updated = [noteObj, ...notes];
    setNotes(updated);
    try {
      localStorage.setItem(`vedika_notes_${lesson?.id || 'general'}`, JSON.stringify(updated));
      const courseKey = `vedika_course_notes_${lesson?.courseId || 'general'}`;
      const curCourseNotes = JSON.parse(localStorage.getItem(courseKey) || '[]');
      const updatedCourse = [noteObj, ...curCourseNotes];
      localStorage.setItem(courseKey, JSON.stringify(updatedCourse));
      setAllCourseNotes(updatedCourse);
    } catch (err) {}

    setNewNoteText('');
    setRecentNoteAlert(noteObj);
  };

  const handleDeleteNoteById = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try {
      localStorage.setItem(`vedika_notes_${lesson?.id || 'general'}`, JSON.stringify(updated));
      const courseKey = `vedika_course_notes_${lesson?.courseId || 'general'}`;
      const curCourseNotes = JSON.parse(localStorage.getItem(courseKey) || '[]');
      const updatedCourse = curCourseNotes.filter(n => n.id !== id);
      localStorage.setItem(courseKey, JSON.stringify(updatedCourse));
      setAllCourseNotes(updatedCourse);
    } catch (err) {}
  };

  const handleDownloadNote = (note) => {
    const content = `Lesson: ${note.lessonTitle || lesson?.title}\nTimestamp: ${note.timestampFormatted}\nDate: ${note.createdAt}\nSource: ${note.source}\n\nNote:\n${note.noteText}\n`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Note_${note.timestampFormatted.replace(':', '-')}_${lesson?.title || 'Lesson'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllNotes = (noteList) => {
    const content = noteList.map((n, i) => `[${i + 1}] Timestamp: ${n.timestampFormatted} (${n.lessonTitle || 'Lesson'})\n${n.noteText}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Notes_${lesson?.title || 'Course'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleDictation = () => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      setIsDictating(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        dictationBaseTextRef.current = newNoteText;

        recognition.onstart = () => setIsDictating(true);
        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          if (text) {
            setNewNoteText((dictationBaseTextRef.current ? dictationBaseTextRef.current + ' ' : '') + text);
          }
        };
        recognition.onerror = () => setIsDictating(false);
        recognition.onend = () => setIsDictating(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsDictating(true);
      } catch (err) {
        setIsDictating(false);
      }
    }
  };

  // --------------------------------------------------------------------------
  // TAB 3: LESSON Q&A HANDLER
  // --------------------------------------------------------------------------
  const handleAskQuestion = async (qText) => {
    if (!qText.trim() || chatLoading) return;
    const userText = qText.trim();
    const vId = extractYoutubeId(lesson?.vid);
    const newHist = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHist);
    setChatQuestion('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/youtube/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: vId,
          title: lesson?.title || '',
          question: userText,
          currentTime: Math.floor(videoCurrentTime || 0),
          history: newHist.slice(-6)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatHistory([...newHist, { role: 'ai', text: data.reply || data.text || 'Explanation provided.' }]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      // Direct Gemini fallback
      try {
        const gemRes = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system: `You are Vedika, an expert AI tutor answering student questions regarding the lesson "${lesson.title}". Lesson Overview: ${lesson.overview}`,
            user: userText
          })
        });
        if (gemRes.ok) {
          const gemData = await gemRes.json();
          setChatHistory([...newHist, { role: 'ai', text: gemData.text || 'Here is the answer based on the lesson curriculum.' }]);
        }
      } catch (e) {
        setChatHistory([...newHist, { role: 'ai', text: 'Could not connect to AI. Please try again in a moment.' }]);
      }
    } finally {
      setChatLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // TAB 4: PRACTICE QUIZ HANDLER
  // --------------------------------------------------------------------------
  const handleGeneratePracticeQuiz = async () => {
    setAiLoading(true);
    setAiErr('');
    setAiQuizAns(null);
    setAiQuizIdx(0);
    try {
      const prompt = buildQuizPrompt(lesson);
      const res = await geminiCall(prompt);
      const parsed = parseQuizOutput(res);
      setAiQuiz(parsed);
    } catch (err) {
      setAiErr(err.message || 'Could not generate quiz. Please retry.');
    } finally {
      setAiLoading(false);
    }
  };

  // Official Quiz Submission
  const handleOfficialQuizSubmit = async (e) => {
    e.preventDefault();
    if (!officialQuiz || !currentUser) return;
    setSubmittingQuiz(true);

    try {
      let correctCount = 0;
      officialQuiz.questions.forEach((q, idx) => {
        if (officialQuizAnswers[idx] === q.correct) correctCount++;
      });

      const totalQuestions = officialQuiz.questions.length;
      const percentage = Math.round((correctCount / totalQuestions) * 100);

      const subData = {
        quiz: officialQuiz.id,
        quiz_title: officialQuiz.title,
        course: lesson.courseId || officialQuiz.course,
        member: currentUser.username,
        member_name: currentUser.name || 'Student',
        score: correctCount,
        score_out_of: totalQuestions,
        percentage,
        passing_percentage: officialQuiz.passing_percentage || 70
      };

      await submitQuizResponse(subData);
      setOfficialQuizScore({
        score: correctCount,
        total: totalQuestions,
        percentage,
        passed: percentage >= (officialQuiz.passing_percentage || 70)
      });

      const subs = await getQuizSubmissions();
      setQuizAttempts(subs.filter(s => s.quiz === officialQuiz.id && s.member === currentUser.username));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Official Assignment Submission
  const handleOfficialAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!officialAssignment || !currentUser || !assignmentText.trim()) return;
    setSubmittingAss(true);
    setAssSuccessMsg('');

    const subData = {
      assignment: officialAssignment.id,
      assignment_title: officialAssignment.title,
      type: officialAssignment.type,
      member: currentUser.username,
      member_name: currentUser.name || 'Student',
      answer: assignmentText,
      course: lesson.courseId || officialAssignment.course,
      question: officialAssignment.question
    };

    try {
      await submitAssignmentResponse(subData);
      setAssSuccessMsg('Assignment submitted successfully! Your submission is saved and ready for instructor review.');
      const subs = await getAssignmentSubmissions();
      setAssignmentSub(subs.find(s => s.assignment === officialAssignment.id && s.member === currentUser.username));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAss(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      background: T.bg,
      height: 'calc(100vh - 64px)',
      maxHeight: 'calc(100vh - 64px)',
      overflow: 'hidden',
      fontFamily: 'var(--font-outfit), sans-serif',
      boxSizing: 'border-box',
      padding: isMobile ? '8px 10px' : '10px 20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1600,
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Navigation Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          flexWrap: 'wrap',
          gap: 10,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/courses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: T.muted,
                cursor: 'pointer',
                fontSize: 13,
                padding: '4px 2px',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.text}
              onMouseLeave={(e) => e.currentTarget.style.color = T.muted}
            >
              <ArrowLeft size={15} /> Back to Course
            </button>

            <button
              onClick={() => setIsOverviewModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: T.s2,
                border: `1px solid ${T.border}`,
                color: T.text,
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 8,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${T.accent}15`;
                e.currentTarget.style.borderColor = `${T.accent}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.s2;
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <BookOpen size={14} color={T.accent} />
              <span>Overview</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsPlaygroundOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: `${T.accent}15`,
                border: `1px solid ${T.accent}40`,
                color: T.accent,
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '7px 14px',
                borderRadius: 8,
                transition: 'all 0.15s'
              }}
            >
              <Terminal size={14} />
              <span>Practice Playground</span>
            </button>

            {completed[lesson.id] ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: T.green,
                fontSize: 12,
                fontWeight: 600,
                background: `${T.green}14`,
                border: `1px solid ${T.green}30`,
                padding: '6px 12px',
                borderRadius: 8
              }}>
                <CheckCircle size={14} /> Completed
              </div>
            ) : (
              <button
                onClick={() => onComplete && onComplete(lesson.id)}
                style={{
                  background: T.green,
                  color: '#000',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'opacity 0.15s'
                }}
              >
                <CheckCircle size={14} /> Mark Complete
              </button>
            )}

            {next && (
              <button
                onClick={() => router.push(`/lesson/${next.id}`)}
                style={{
                  background: T.s2,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────── */}
        {/* TWO-COLUMN WORKSPACE: Video Player (Left) + 4 Tabs (Right) */}
        {/* ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          height: 'calc(100% - 46px)',
          gap: 12,
          alignItems: 'stretch',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Left: Video Player */}
          <div style={{
            flex: isExpanded ? '0 0 calc(50% - 6px)' : '0 0 calc(90% - 6px)',
            width: isExpanded ? 'calc(50% - 6px)' : 'calc(90% - 6px)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.s1,
            overflow: 'hidden',
            minWidth: 0,
            height: '100%',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box'
          }}>
            <div style={{
              padding: '8px 14px',
              minHeight: 40,
              maxHeight: 40,
              borderBottom: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: T.s2,
              gap: 10,
              flexShrink: 0,
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                <span style={{
                  fontSize: 11,
                  color: mod?.accent || T.accent,
                  background: `${mod?.accent || T.accent}18`,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {mod?.emoji} {mod?.title}
                </span>
                <span style={{
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {lesson.title}
                </span>
                <span style={{
                  color: T.muted,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  <Clock size={11} />
                  <span>{lesson.dur}</span>
                </span>
              </div>

              <div style={{
                fontSize: 11,
                color: T.muted,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}>
                <Clock size={11} /> {formatTimestamp(videoCurrentTime)}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, height: 'calc(100% - 40px)', background: '#000', overflow: 'hidden' }}>
              <VideoPlayerWithAI
                videoId={extractYoutubeId(lesson.vid)}
                onTimeUpdate={(secs) => setVideoCurrentTime(secs)}
                onExplainRequested={(secs) => {
                  setActiveCompanionTab('ask_vedika');
                  setIsExpanded(true);
                  handleExplainMoment(secs);
                }}
                seekTime={videoSeekTime}
                onSeekComplete={() => setVideoSeekTime(null)}
                forcePause={forcePause}
              />
            </div>
          </div>

          {/* Middle: Active Companion Tab Panel (Opens in between video and tabs, taking 40% width) */}
          {isExpanded && (
            <div style={{
              flex: 1,
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 14,
              border: `1px solid ${T.border}`,
              background: T.s1,
              padding: '14px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              minWidth: 0,
              height: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Panel Header */}
              {(() => {
                const currentTab = TABS.find(t => t.id === activeCompanionTab) || TABS[0];
                const TabIcon = currentTab.Icon;
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    marginBottom: 10,
                    borderBottom: `1px solid ${T.border}`,
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: `${currentTab.color}20`,
                        color: currentTab.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <TabIcon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.2 }}>
                          {currentTab.label}
                        </div>
                        <div style={{ fontSize: 10, color: T.muted }}>
                          {currentTab.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      title="Close panel"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: `1px solid ${T.border}`,
                        borderRadius: 6,
                        color: T.muted,
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })()}

              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* TAB 1 CONTENT: ASK VEDIKA */}
            {activeCompanionTab === 'ask_vedika' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                <div style={{
                  padding: 14,
                  borderRadius: 12,
                  background: T.s2,
                  border: `1px solid ${T.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#F59E0B'
                    }}>
                      Paused at {formatTimestamp(videoCurrentTime)}
                    </span>
                    <span style={{ fontSize: 11.5, color: T.muted }}>{lesson.dur}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                    {lesson.title}
                  </div>
                  <p style={{ fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.5 }}>
                    Pause the video at any time to receive a step-by-step Socratic breakdown of what is being explained.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleExplainMoment(videoCurrentTime)}
                  disabled={explainerLoading}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 10,
                    background: T.purple,
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: explainerLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                    transition: 'opacity 0.15s'
                  }}
                >
                  <Bot size={16} />
                  <span>
                    {explainerLoading ? 'Analyzing Lecture Moment...' : `Explain Concept at ${formatTimestamp(videoCurrentTime)}`}
                  </span>
                </button>

                {aiExplainerData && (
                  <div style={{
                    padding: 14,
                    borderRadius: 12,
                    background: T.s2,
                    border: `1px solid ${T.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    fontSize: 12.5,
                    lineHeight: 1.5
                  }}>
                    <div style={{ fontWeight: 700, color: T.purple, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} />
                      <span>Lecture Concept Breakdown</span>
                    </div>
                    <div style={{ color: T.text }}>
                      {aiExplainerData.coreExplanation}
                    </div>
                    {aiExplainerData.keyTakeaways?.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 11.5, color: T.muted }}>Key Takeaways:</span>
                        {aiExplainerData.keyTakeaways.map((point, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span style={{ color: T.accent }}>•</span>
                            <span style={{ color: T.muted }}>{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: PERSONAL NOTES */}
            {activeCompanionTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setNoteFilter('lesson')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: noteFilter === 'lesson' ? T.purple : T.s2,
                        color: noteFilter === 'lesson' ? '#fff' : T.muted,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      This Lesson ({notes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteFilter('course')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: noteFilter === 'course' ? T.purple : T.s2,
                        color: noteFilter === 'course' ? '#fff' : T.muted,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      All Course ({allCourseNotes.length || notes.length})
                    </button>
                  </div>

                  {(noteFilter === 'lesson' ? notes : (allCourseNotes.length > 0 ? allCourseNotes : notes)).length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDownloadAllNotes(noteFilter === 'lesson' ? notes : (allCourseNotes.length > 0 ? allCourseNotes : notes))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'transparent',
                        border: 'none',
                        color: T.muted,
                        fontSize: 11,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={12} /> Export .txt
                    </button>
                  )}
                </div>

                {/* Composer */}
                <form onSubmit={handleSaveManualNote} style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={isDictating ? "Listening... Speak note now" : `Add note at ${formatTimestamp(videoCurrentTime)}...`}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: T.s2,
                      border: `1px solid ${isDictating ? '#EC4899' : T.border}`,
                      color: T.text,
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleToggleDictation}
                    title="Voice dictation"
                    style={{
                      padding: '0 10px',
                      borderRadius: 8,
                      border: `1px solid ${isDictating ? '#EC4899' : T.border}`,
                      background: isDictating ? 'rgba(236, 72, 153, 0.2)' : T.s2,
                      color: isDictating ? '#EC4899' : T.muted,
                      cursor: 'pointer'
                    }}
                  >
                    {isDictating ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    style={{
                      padding: '0 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: T.purple,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: newNoteText.trim() ? 'pointer' : 'default',
                      opacity: newNoteText.trim() ? 1 : 0.6
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </form>

                {/* Notes List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(noteFilter === 'lesson' ? notes : (allCourseNotes.length > 0 ? allCourseNotes : notes)).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: T.muted, fontSize: 12 }}>
                      No study notes recorded yet. Type or dictate notes at any lecture timestamp!
                    </div>
                  ) : (
                    (noteFilter === 'lesson' ? notes : (allCourseNotes.length > 0 ? allCourseNotes : notes)).map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: 10,
                          borderRadius: 8,
                          background: T.s2,
                          border: `1px solid ${T.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setVideoSeekTime(n.timestampSeconds || 0)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              background: `${T.accent}15`,
                              border: `1px solid ${T.accent}40`,
                              color: T.accent,
                              fontSize: 11,
                              fontWeight: 700,
                              borderRadius: 4,
                              padding: '2px 6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Play size={9} />
                            <span>{n.timestampFormatted || '00:00'}</span>
                          </button>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadNote(n)}
                              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2 }}
                            >
                              <Download size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNoteById(n.id)}
                              style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 2 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div style={{ fontSize: 12.5, color: T.text }}>
                          {n.noteText}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3 CONTENT: LESSON Q&A */}
            {activeCompanionTab === 'qa' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  overflowY: 'auto',
                  padding: 10,
                  borderRadius: 10,
                  background: T.s2,
                  border: `1px solid ${T.border}`,
                  minHeight: 180
                }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: T.muted, fontSize: 12 }}>
                      <MessageSquare size={22} style={{ color: T.accent, margin: '0 auto 8px' }} />
                      <div>Ask questions regarding concepts or code covered in this lesson.</div>
                    </div>
                  ) : (
                    chatHistory.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: m.role === 'user' ? T.accent : T.s1,
                          color: m.role === 'user' ? '#fff' : T.text,
                          fontSize: 12,
                          border: m.role === 'user' ? 'none' : `1px solid ${T.border}`
                        }}
                      >
                        {m.text}
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.accent, fontSize: 11.5 }}>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Vedika is thinking...</span>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion(chatQuestion);
                  }}
                  style={{ display: 'flex', gap: 6 }}
                >
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    placeholder="Ask a question about this lesson..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: T.s2,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                      fontSize: 12,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatQuestion.trim()}
                    style={{
                      padding: '0 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: T.accent,
                      color: '#fff',
                      cursor: chatLoading || !chatQuestion.trim() ? 'default' : 'pointer',
                      opacity: chatLoading || !chatQuestion.trim() ? 0.6 : 1
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4 CONTENT: PRACTICE QUIZ */}
            {activeCompanionTab === 'quiz' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
                {!aiQuiz && !aiLoading && (
                  <div style={{ textAlign: 'center', padding: '24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <Award size={26} color={T.green} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Generate Practice Quiz</div>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                      Take an instant AI-generated practice quiz based on this lecture topic to test your knowledge!
                    </p>
                    <button
                      onClick={handleGeneratePracticeQuiz}
                      style={{
                        background: T.green,
                        color: '#000',
                        border: 'none',
                        padding: '9px 18px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Start Practice Quiz
                    </button>
                  </div>
                )}

                {aiLoading && (
                  <div style={{ textAlign: 'center', padding: '36px 12px', color: T.green, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>Crafting practice quiz questions...</span>
                  </div>
                )}

                {aiQuiz && aiQuiz.questions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: T.muted }}>
                      <span>Question {aiQuizIdx + 1} of {aiQuiz.questions.length}</span>
                      <button
                        onClick={handleGeneratePracticeQuiz}
                        style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                      >
                        <RotateCcw size={11} /> New Quiz
                      </button>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                      {aiQuiz.questions[aiQuizIdx].q}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {aiQuiz.questions[aiQuizIdx].opts.map((opt, oi) => {
                        const isSelected = aiQuizAns === oi;
                        const isCorrect = oi === aiQuiz.questions[aiQuizIdx].ans;
                        let optBg = T.s2;
                        let optBorder = T.border;

                        if (aiQuizAns !== null) {
                          if (isCorrect) {
                            optBg = 'rgba(16, 185, 129, 0.15)';
                            optBorder = '#10B981';
                          } else if (isSelected) {
                            optBg = 'rgba(239, 68, 68, 0.15)';
                            optBorder = '#EF4444';
                          }
                        }

                        return (
                          <button
                            key={oi}
                            disabled={aiQuizAns !== null}
                            onClick={() => setAiQuizAns(oi)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              color: T.text,
                              fontSize: 12,
                              textAlign: 'left',
                              cursor: aiQuizAns !== null ? 'default' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8
                            }}
                          >
                            <span style={{ fontWeight: 700, color: T.muted }}>{String.fromCharCode(65 + oi)}.</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {aiQuizAns !== null && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: aiQuizAns === aiQuiz.questions[aiQuizIdx].ans ? T.green : '#EF4444' }}>
                          {aiQuizAns === aiQuiz.questions[aiQuizIdx].ans ? '✓ Correct Answer!' : '✗ Incorrect Option'}
                        </span>
                        {aiQuizIdx < aiQuiz.questions.length - 1 && (
                          <button
                            onClick={() => {
                              setAiQuizIdx(idx => idx + 1);
                              setAiQuizAns(null);
                            }}
                            style={{
                              background: T.green,
                              color: '#000',
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Next Question →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
                </div>
            </div>
          )}

          {/* Far Right: 4 Companion Tabs (Always 10% width, vertically centered, unselected boxes removed) */}
          <div style={{
            flex: '0 0 calc(10% - 6px)',
            width: 'calc(10% - 6px)',
            maxWidth: 'calc(10% - 6px)',
            flexShrink: 0,
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 14,
            border: `1px solid ${T.border}`,
            background: T.s1,
            padding: '8px 4px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            minWidth: 0,
            height: '100%',
            boxSizing: 'border-box'
          }}>
            <CompanionTabs
              vertical={true}
              activeTab={isExpanded ? activeCompanionTab : null}
              onSelectTab={(tabId) => {
                if (isExpanded && activeCompanionTab === tabId) {
                  setIsExpanded(false);
                } else {
                  setActiveCompanionTab(tabId);
                  setIsExpanded(true);
                }
              }}
              notesCount={notes.length}
              qaCount={chatHistory.length}
            />
          </div>
        </div>
      </div>

      {/* Lesson Overview & Key Points Modal */}
      <OverviewModal
        isOpen={isOverviewModalOpen}
        onClose={() => setIsOverviewModalOpen(false)}
        lesson={lesson}
        mod={mod}
        onOpenPdf={lesson.pdf ? () => {
          setSelectedPdfResource({ file_link: lesson.pdf, name: `${lesson.title} Reference PDF` });
          setIsPdfViewerOpen(true);
        } : null}
      />

      {/* PDF Viewer Modal */}
      {selectedPdfResource && (
        <PDFViewerModal
          isOpen={isPdfViewerOpen}
          onClose={() => setIsPdfViewerOpen(false)}
          fileUrl={selectedPdfResource.file_link}
          title={selectedPdfResource.name}
        />
      )}

      {/* Practice Playground Modal */}
      <PracticePlaygroundModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        title={`Practice: ${lesson.title}`}
        badge={mod?.title || 'Python'}
        initialCode={lesson?.codingExercise?.starterCode || `# Practice code for: ${lesson.title}\nprint("Practicing: ${lesson.title}")\n`}
        codingExercise={lesson?.codingExercise}
      />
    </div>
  );
}

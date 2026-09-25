'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CheckCircle, Circle, Clock, Play, GraduationCap, ChevronRight, ChevronLeft, ArrowLeft, Users, Tag, BookOpen, Terminal, X, Award, Search, Grid, Layers
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import { getCourses, getCourseSyllabus, checkStudentEnrollment, enrollStudentInCourse, getStudentEnrollments, saveProgressToRedis, getProgressFromRedis } from '@/lib/frappe';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import dynamic from 'next/dynamic';
import PDFViewerModal from './PDFViewerModal';
import CourseEmotionsSlider from './CourseEmotionsSlider';
import PacmanPagination from './PacmanPagination';
import PracticePlaygroundModal from './PracticePlaygroundModal';
import { getSubjectArtwork } from '@/lib/artwork';
const Playground = dynamic(() => import('./Playground'), { ssr: false });

const DECK_ROTATIONS = ['4deg', '-2deg', '-9deg', '7deg', '3deg', '-5deg', '6deg'];

const DEFAULT_THUMBNAILS = [
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'
];

const CATEGORY_IMAGES = {
  'Web Development': 'https://images.unsplash.com/photo-1547658719-da2b51169166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Frontend': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Framework': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Programming': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Python Programming': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Data Structures & Algorithms': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Business': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Finance': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Personal Development': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Data Science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Artificial Intelligence': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Cybersecurity': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600',
  'Cloud Computing': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600'
};

function CourseDeckWidget({
  mode = 'courses', // 'categories' | 'courses'
  items,
  activeDrilldownCategory,
  onSelectCategory,
  onBackToCategories,
  handleSelectCourse,
  handleEnrollFromCard,
  enrolledCourseIds = [],
  isMobile
}) {
  if (!items || items.length === 0) return null;

  if (mode === 'categories') {
    return (
      <div style={{
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        padding: '0 0',
        marginBottom: 2,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: 6
      }}>
        {/* Category Carousel Title Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: `${T.accent}14`,
          border: `1px solid ${T.accent}30`,
          color: T.accent,
          padding: '4px 12px',
          borderRadius: 20,
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: 0
        }}>
          <span>📂 Course Categories</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{items.length} {items.length === 1 ? 'Category' : 'Categories'} Available</span>
        </div>

        {/* 3D Geometric Looping Emotions Carousel for Categories */}
        <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
          <CourseEmotionsSlider
            items={items}
            mode="categories"
            onSelectCategory={onSelectCategory}
          />
        </div>
      </div>
    );
  }

  // Course mode (when a category is selected or searching)
  return (
    <div style={{
      background: 'transparent',
      border: 'none',
      borderRadius: 0,
      padding: '0 0',
      marginBottom: 2,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      gap: 6
    }}>
      {/* Course Emotions 3D Geometric Interactive Slider */}
      <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto' }}>
        <CourseEmotionsSlider
          items={items}
          mode="courses"
          onSelectCourse={handleSelectCourse}
          onEnrollFromCard={handleEnrollFromCard}
          enrolledCourseIds={enrolledCourseIds}
        />
      </div>
    </div>
  );
}

export default function CoursePage() {
  const isMobile = useMediaQuery(isMobileMQ);
  const isTabletOrSmallDesktop = useMediaQuery('(max-width: 1150px)');
  const rPad = isMobile ? 16 : 36;
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);

  const outerStyle = { padding: isMobile ? '20px 16px' : '32px 36px', fontFamily: 'var(--font-outfit), sans-serif' };

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [completed, setCompleted] = useState({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  // Category, Search, Carousel & Modal States
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDrilldownCategory, setActiveDrilldownCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('deck'); // 'deck' or 'grid'
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [selectedPdfResource, setSelectedPdfResource] = useState(null);
  const carouselRef = useRef(null);
  const categoriesContainerRef = useRef(null);

  // Group published courses into category cards for the initial Category Carousel
  const categoryDeckItems = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (!c) return;
      let locallyDeleted = [];
      try { locallyDeleted = JSON.parse(localStorage.getItem('locally_deleted_courses') || '[]').map(String); } catch (e) { }
      if (locallyDeleted.includes(String(c.id))) return;

      const cat = (c.category || 'General').trim();
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat).push(c);
    });

    const list = [];
    let idx = 0;
    map.forEach((catCourses, catName) => {
      const totalLessons = catCourses.reduce((sum, c) => sum + ((c && (c.lessonsCount || (c.lessons ? c.lessons.length : 0))) || 0), 0);
      const instructors = new Set(catCourses.map(c => c?.instructor).filter(Boolean));
      const thumb = catCourses.find(c => c?.image)?.image || getSubjectArtwork(catName);

      list.push({
        id: `cat-${catName}`,
        title: catName,
        category: 'Category',
        badge: `${catCourses.length} ${catCourses.length === 1 ? 'Course' : 'Courses'}`,
        thumbnail: thumb,
        courses: catCourses,
        totalLessons,
        instructorsCount: instructors.size,
        tagline: `Explore ${catCourses.length} ${catCourses.length === 1 ? 'specialized course' : 'specialized courses'} in ${catName} with comprehensive modules and hands-on practice.`
      });
      idx++;
    });
    return list;
  }, [courses]);

  // Dynamic unique categories list for pill navigation
  const allCategories = useMemo(() => {
    const set = new Set();
    courses.forEach(c => {
      if (!c) return;
      let locallyDeleted = [];
      try { locallyDeleted = JSON.parse(localStorage.getItem('locally_deleted_courses') || '[]').map(String); } catch (e) { }
      if (locallyDeleted.includes(String(c.id))) return;
      if (c.category) set.add(String(c.category).trim());
    });
    return ['All', ...Array.from(set)];
  }, [courses]);

  const handleScrollCarousel = (dir) => {
    if (!carouselRef.current) return;
    const container = carouselRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: dir === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const [canScrollCategories, setCanScrollCategories] = useState(false);

  const checkCategoriesScroll = useCallback(() => {
    if (categoriesContainerRef.current) {
      const { scrollWidth, clientWidth } = categoriesContainerRef.current;
      setCanScrollCategories(scrollWidth > clientWidth + 4);
    }
  }, []);

  useEffect(() => {
    checkCategoriesScroll();
    window.addEventListener('resize', checkCategoriesScroll);
    return () => window.removeEventListener('resize', checkCategoriesScroll);
  }, [allCategories, checkCategoriesScroll]);

  const handleScrollCategories = (dir) => {
    if (!categoriesContainerRef.current) return;
    categoriesContainerRef.current.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth'
    });
  };

  // Fetch courses and load completion progress
  useEffect(() => {
    let email = '';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('frappe_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user && user.email) {
            email = user.email;
            setUserEmail(user.email);
          }
        } catch (e) { }
      }
    }

    async function loadData() {
      try {
        const [list, enrollments] = await Promise.all([
          getCourses({ forceRefresh: true }),
          email ? getStudentEnrollments(email) : Promise.resolve([])
        ]);
        let locallyDeleted = [];
        try {
          locallyDeleted = JSON.parse(localStorage.getItem('locally_deleted_courses') || '[]').map(String);
        } catch (e) {}

        // Students see Published courses and newly created local courses
        const isCourseVisible = (c) => {
          if (!c) return false;
          if (locallyDeleted.includes(String(c.id))) return false;
          if (c.status === 'Published' || c.status === 'published' || !c.status) return true;
          if (/^\d{10,}$/.test(String(c.id)) || String(c.id).startsWith('local_') || String(c.id).startsWith('course_') || String(c.id).startsWith('ch_')) return true;
          return false;
        };
        const published = list.filter(isCourseVisible);
        setCourses(published);
        setEnrolledCourseIds(enrollments || []);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Listen for reset courses view event (e.g. from navbar clicks)
    const handleResetCoursesView = () => {
      setSelectedCourse(null);
      setActiveDrilldownCategory(null);
      setSelectedCategory('All');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_course_id');
      }
    };
    window.addEventListener('reset_courses_view', handleResetCoursesView);

    // Browser back/forward navigation support
    const handlePopState = () => {
      setSelectedCourse(null);
      setActiveDrilldownCategory(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selected_course_id');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Listen for cross-tab or cross-component course updates
    const handleCoursesUpdated = () => {
      loadData();
    };
    window.addEventListener('courses_updated', handleCoursesUpdated);
    window.addEventListener('storage', handleCoursesUpdated);
    window.addEventListener('focus', handleCoursesUpdated);

    let key = 'completed_lessons';
    if (email) {
      key = `completed_lessons_${email}`;
    }
    const savedCompleted = localStorage.getItem(key);
    let localCompleted = {};
    if (savedCompleted) {
      try {
        localCompleted = JSON.parse(savedCompleted);
        setCompleted(localCompleted);
      } catch (e) { }
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

    return () => {
      window.removeEventListener('reset_courses_view', handleResetCoursesView);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('courses_updated', handleCoursesUpdated);
      window.removeEventListener('storage', handleCoursesUpdated);
      window.removeEventListener('focus', handleCoursesUpdated);
    };
  }, []);

  async function handleSelectCourse(course) {
    setSelectedCourse(course);
    if (typeof window !== 'undefined' && course) {
      localStorage.setItem('selected_course_id', course.id);
      try {
        window.history.pushState({ inCourse: true, courseId: course.id }, '', '/courses');
      } catch (e) {}
    }
    setDetailsLoading(true);
    try {
      // Retrieve stored user email directly in case it changed
      let email = userEmail;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('frappe_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (user && user.email) {
              email = user.email;
              setUserEmail(user.email);
            }
          } catch (e) { }
        }
      }

      const enrolledStatus = enrolledCourseIds.includes(course.id) || await checkStudentEnrollment(course.id, email);
      setIsEnrolled(enrolledStatus);

      const details = await getCourseSyllabus(course.id);
      setCourseDetails(details);
    } catch (e) {
      console.error("Failed to load course details", e);
    } finally {
      setDetailsLoading(false);
    }
  }

  const handleEnroll = async () => {
    if (!selectedCourse || !userEmail) return;
    setIsEnrolling(true);
    try {
      await enrollStudentInCourse(selectedCourse.id, userEmail);
      setIsEnrolled(true);
      // Refresh enrollments list
      const enrollments = await getStudentEnrollments(userEmail);
      setEnrolledCourseIds(enrollments || []);
    } catch (e) {
      console.error("Failed to enroll student", e);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleEnrollFromCard = async (courseId, e) => {
    e.stopPropagation(); // Prevent opening the outline page
    if (!userEmail) return;
    try {
      await enrollStudentInCourse(courseId, userEmail);
      // Refresh enrollments list
      const enrollments = await getStudentEnrollments(userEmail);
      setEnrolledCourseIds(enrollments || []);
    } catch (err) {
      console.error("Failed to enroll student from card", err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading courses...</div>
        </div>
      </div>
    );
  }

  if (detailsLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Loading course syllabus...</div>
        </div>
      </div>
    );
  }

  // Render course outline if a specific course is selected
  if (selectedCourse && courseDetails) {
    const details = courseDetails;
    const modules = details.modules || [];

    // Compile all lessons in this course
    const courseLessons = modules.flatMap(m => ((m && m.lessons) ? m.lessons : []).map(l => ({ ...l, module: m })));
    const total = courseLessons.length;
    const done = courseLessons.filter(l => completed[l.id]).length;
    const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          overflowY: isEnrolled ? 'auto' : 'hidden',
          background: T.bg,
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: isMobile ? '20px 16px' : '28px 36px',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }} className="no-scrollbar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedCourse(null);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('selected_course_id');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: T.muted,
                cursor: 'pointer',
                fontSize: 13,
                padding: 0,
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.text}
              onMouseLeave={(e) => e.currentTarget.style.color = T.muted}
            >
              <ArrowLeft size={15} /> Back to Courses
            </button>

            <button
              data-practice-trigger="true"
              onClick={(e) => {
                if (typeof window !== 'undefined') {
                  const r = e.currentTarget.getBoundingClientRect();
                  window.__lastPracticeTriggerRect = { left: r.left, top: r.top, width: r.width, height: r.height };
                }
                setIsPlaygroundOpen(!isPlaygroundOpen);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isPlaygroundOpen ? `${T.accent}15` : 'transparent',
                border: `1px solid ${isPlaygroundOpen ? T.accent : 'var(--border)'}`,
                color: isPlaygroundOpen ? T.accent : 'var(--text)',
                cursor: 'pointer',
                fontSize: 12.5,
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 8,
                transition: 'all 0.15s'
              }}
            >
              <Terminal size={14} />
              {isPlaygroundOpen ? 'Close Playground' : 'Practice Playground'}
            </button>
          </div>

          {/* Course Detail Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: T.accent, background: `${T.accent}15`, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                {selectedCourse.category}
              </span>
              <span style={{ fontSize: 11.5, color: T.muted }}>
                By {selectedCourse.instructor}
              </span>
            </div>

            <h2 style={{ color: T.text, fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
              {details.title}
            </h2>

            <p style={{ color: T.muted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
              {details.tagline}
            </p>

            {selectedCourse.pdf && (
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setSelectedPdfResource({ file_link: selectedCourse.pdf, name: `${selectedCourse.title} Reference Materials` });
                    setIsPdfViewerOpen(true);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: `${T.accent}12`, border: `1px solid ${T.accent}40`,
                    color: T.accent, padding: '7px 14px', borderRadius: 8,
                    fontSize: 12.5, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  📄 View Course PDF Materials
                </button>
              </div>
            )}
          </div>

          {/* Enrollment CTA Card or Outline List */}
          {!isEnrolled ? (
            <div style={{
              background: T.s1,
              border: `1px solid ${T.border}`,
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${T.accent} 0%, #3B82F6 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)',
                marginBottom: 8
              }}>
                <GraduationCap size={30} color="#fff" />
              </div>
              <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>Enroll in Course</h3>
              <p style={{ color: T.muted, fontSize: 13.5, maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
                Enroll now to gain complete access to modules, lesson transcripts, hands-on assignments, and start learning with your personalized AI tutor!
              </p>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                style={{
                  background: isEnrolling ? T.dim : T.accent,
                  color: '#000',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isEnrolling ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(91, 140, 248, 0.3)',
                  transition: 'all 0.2s',
                  marginTop: 8
                }}
              >
                {isEnrolling ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          ) : (
            <div>
              {progressPercent === 100 && (
                <div style={{
                  background: `linear-gradient(135deg, ${T.purple}12 0%, ${T.accent}12 100%)`,
                  border: `1px solid ${T.purple}30`,
                  borderRadius: 16,
                  padding: '24px 20px',
                  textAlign: 'center',
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{ fontSize: 32 }}>🏆</div>
                  <h3 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: 0 }}>Congratulations! You completed the course!</h3>
                  <p style={{ color: T.muted, fontSize: 13, margin: 0, maxWidth: 460 }}>
                    You have successfully completed all lessons in this course. You can now view and download your verified completion certificate!
                  </p>
                  <button
                    onClick={() => setIsCertModalOpen(true)}
                    style={{
                      background: `linear-gradient(135deg, ${T.purple} 0%, ${T.accent} 100%)`,
                      color: '#fff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(155, 110, 248, 0.2)'
                    }}
                  >
                    View Completion Certificate
                  </button>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: T.muted }}>
                  <span>Progress: {done}/{total} lessons completed</span>
                  <span style={{ fontWeight: 600, color: T.accent }}>{progressPercent}% Complete</span>
                </div>

                <div style={{ background: T.s3, borderRadius: 99, height: 6, marginTop: 8, width: '100%', overflow: 'hidden' }}>
                  <div style={{
                    background: T.accent, height: '100%', borderRadius: 99,
                    width: `${progressPercent}%`, transition: 'width 0.4s'
                  }} />
                </div>
              </div>

              {/* Modules list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {modules.map((mod, mi) => {
                  const modDone = mod.lessons.filter(l => completed[l.id]).length;
                  return (
                    <div key={mod.id} style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
                      {/* Module header */}
                      <div style={{
                        padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 9,
                            background: `${mod.accent || T.accent}18`, border: `1px solid ${mod.accent || T.accent}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                          }}>{mod.emoji}</div>
                          <div>
                            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{mi + 1}. {mod.title}</div>
                            <div style={{ color: T.muted, fontSize: 12 }}>{mod.lessons.length} lessons · {modDone} completed</div>
                          </div>
                        </div>
                        {/* Circular progress */}
                        <div style={{ width: 36, height: 36, borderRadius: '50%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="36" height="36" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                            <circle cx="18" cy="18" r="14" fill="none" stroke={T.s3} strokeWidth="3" />
                            <circle cx="18" cy="18" r="14" fill="none" stroke={mod.accent || T.accent} strokeWidth="3"
                              strokeDasharray={`${2 * Math.PI * 14}`}
                              strokeDashoffset={`${2 * Math.PI * 14 * (1 - (mod.lessons.length > 0 ? modDone / mod.lessons.length : 0))}`}
                              strokeLinecap="round" />
                          </svg>
                          <span style={{ fontSize: 10, color: mod.accent || T.accent, fontWeight: 700, position: 'relative' }}>
                            {mod.lessons.length > 0 ? Math.round((modDone / mod.lessons.length) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Lessons */}
                      <div>
                        {mod.lessons.map((lesson, li) => (
                          <a
                            key={lesson.id}
                            href={`/lesson/${lesson.id}`}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center',
                              justifyContent: 'space-between', padding: '13px 20px',
                              background: 'transparent', border: 'none',
                              borderBottom: li < mod.lessons.length - 1 ? `1px solid ${T.border}` : 'none',
                              cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = T.s2}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              {completed[lesson.id]
                                ? <CheckCircle size={16} color={T.green} />
                                : <Circle size={16} color={T.dim} />}
                              <div>
                                <div style={{ color: T.text, fontSize: 13.5, fontWeight: 500 }}>{lesson.title}</div>
                                <div style={{ color: T.muted, fontSize: 12, marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Clock size={11} />{lesson.dur}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {completed[lesson.id] && (
                                <span style={{ fontSize: 11, color: T.green, background: `${T.green}18`, padding: '2px 8px', borderRadius: 20 }}>Done</span>
                              )}
                              <Play size={14} color={T.muted} />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <PracticePlaygroundModal
            isOpen={isPlaygroundOpen}
            onClose={() => setIsPlaygroundOpen(false)}
            title={`Practice: ${selectedCourse.title}`}
            badge={selectedCourse.category || 'Python'}
            initialCode={`# Practice for: ${selectedCourse.title}\n# Write your code here\n\n`}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxHeight: '100%',
      overflowY: isMobile ? 'auto' : 'hidden',
      overflowX: 'hidden',
      background: T.bg,
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1440,
        margin: '0 auto',
        padding: isMobile ? '8px 12px' : '10px 24px 6px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        height: '100%',
        justifyContent: 'flex-start'
      }} className="no-scrollbar">
        {/* Compact Top Action Toolbar: Search & Practice Playground */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 8
        }}>
          {/* Real-Time Course Search Bar */}
          <div style={{ position: 'relative', width: isMobile ? '100%' : 300, flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses, instructors, tags..."
              style={{
                width: '100%',
                padding: '7px 32px 7px 34px',
                borderRadius: 10,
                background: T.s2,
                border: `1px solid ${T.border}`,
                color: T.text,
                fontSize: 12.5,
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = T.accent}
              onBlur={(e) => e.target.style.borderColor = T.border}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Practice Playground Launch Button */}
          <button
            data-practice-trigger="true"
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                const r = e.currentTarget.getBoundingClientRect();
                window.__lastPracticeTriggerRect = { left: r.left, top: r.top, width: r.width, height: r.height };
              }
              setIsPlaygroundOpen(!isPlaygroundOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isPlaygroundOpen ? `${T.accent}15` : T.s2,
              border: `1px solid ${isPlaygroundOpen ? T.accent : T.border}`,
              color: isPlaygroundOpen ? T.accent : T.text,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 10,
              transition: 'all 0.15s',
              marginLeft: isMobile ? 0 : 'auto'
            }}
          >
            <Terminal size={13} />
            {isPlaygroundOpen ? 'Close Playground' : 'Practice Playground'}
          </button>
        </div>

        {/* 100% Width Category Pills Carousel */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8, marginBottom: 12, position: 'relative' }}>
          {activeDrilldownCategory && (
            <button
              type="button"
              onClick={() => {
                setActiveDrilldownCategory(null);
                setSelectedCategory('All');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: T.s2,
                border: `1px solid ${T.accent}`,
                color: T.accent,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `${T.accent}20`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = T.s2; }}
              title="Back to all categories"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}

          {canScrollCategories && (
            <button
              onClick={() => handleScrollCategories('left')}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: T.s2,
                border: `1px solid ${T.border}`,
                color: T.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div
            ref={categoriesContainerRef}
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              scrollBehavior: 'smooth',
              width: '100%',
              padding: '4px 0'
            }}
            className="no-scrollbar"
          >
            {allCategories.map(cat => {
              const isSelected = (!activeDrilldownCategory && selectedCategory === cat) || (activeDrilldownCategory === cat);
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (cat === 'All') {
                      setActiveDrilldownCategory(null);
                    } else {
                      setActiveDrilldownCategory(cat);
                    }
                  }}
                  style={{
                    background: isSelected ? T.accent : T.s2,
                    color: isSelected ? '#fff' : T.text,
                    border: isSelected ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {canScrollCategories && (
            <button
              onClick={() => handleScrollCategories('right')}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: T.s2,
                border: `1px solid ${T.border}`,
                color: T.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text; }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Dynamic Category / Course Carousel Drilldown Presentation */}
        {(() => {
          // If searching: show filtered courses directly matching search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const searchResults = courses.filter(c => {
              let locallyDeleted = [];
              try { locallyDeleted = JSON.parse(localStorage.getItem('locally_deleted_courses') || '[]').map(String); } catch (e) { }
              if (locallyDeleted.includes(String(c.id))) return false;

              return (
                c.title?.toLowerCase().includes(q) ||
                c.category?.toLowerCase().includes(q) ||
                c.instructor?.toLowerCase().includes(q) ||
                c.tagline?.toLowerCase().includes(q)
              );
            });

            if (searchResults.length === 0) {
              return (
                <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '48px 20px', textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                  <h3 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px 0' }}>No matching courses found</h3>
                  <p style={{ color: T.muted, fontSize: 13, maxWidth: 360, margin: '0 auto 16px auto' }}>
                    No courses match "{searchQuery}".
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear Search
                  </button>
                </div>
              );
            }

            return (
              <div>
                <CourseDeckWidget
                  mode="courses"
                  items={searchResults}
                  handleSelectCourse={handleSelectCourse}
                  handleEnrollFromCard={handleEnrollFromCard}
                  enrolledCourseIds={enrolledCourseIds}
                  isMobile={isMobile}
                />
              </div>
            );
          }

          // If student has selected a specific category: show that category's courses carousel with breadcrumbs
          if (activeDrilldownCategory) {
            const categoryCourses = courses.filter(c => {
              if (!c) return false;
              let locallyDeleted = [];
              try { locallyDeleted = JSON.parse(localStorage.getItem('locally_deleted_courses') || '[]').map(String); } catch (e) { }
              if (locallyDeleted.includes(String(c.id))) return false;

              return (c.category || 'General').trim().toLowerCase() === (activeDrilldownCategory || '').trim().toLowerCase();
            });

            if (categoryCourses.length === 0) {
              return (
                <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '48px 20px', textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                  <h3 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px 0' }}>No courses in {activeDrilldownCategory} yet</h3>
                  <p style={{ color: T.muted, fontSize: 13, maxWidth: 360, margin: '0 auto 16px auto' }}>
                    No published courses are currently assigned to this category.
                  </p>
                  <button
                    onClick={() => { setActiveDrilldownCategory(null); setSelectedCategory('All'); }}
                    style={{ background: T.accent, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    ← Back to All Courses
                  </button>
                </div>
              );
            }

            return (
              <div>
                <CourseDeckWidget
                  mode="courses"
                  items={categoryCourses}
                  activeDrilldownCategory={activeDrilldownCategory}
                  onBackToCategories={() => {
                    setActiveDrilldownCategory(null);
                    setSelectedCategory('All');
                  }}
                  handleSelectCourse={handleSelectCourse}
                  handleEnrollFromCard={handleEnrollFromCard}
                  enrolledCourseIds={enrolledCourseIds}
                  isMobile={isMobile}
                />
              </div>
            );
          }

          // Initial Landing: Show Category Carousel (grouped categories with CourseEmotionsSlider)
          if (categoryDeckItems.length === 0) {
            return (
              <div style={{ background: T.s1, border: `1px solid ${T.border}`, borderRadius: 16, padding: '48px 20px', textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <h3 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: '0 0 6px 0' }}>No categories available</h3>
                <p style={{ color: T.muted, fontSize: 13, maxWidth: 360, margin: '0 auto 16px auto' }}>
                  There are currently no published courses or categories to display.
                </p>
              </div>
            );
          }

          return (
            <div>
              <CourseDeckWidget
                mode="categories"
                items={categoryDeckItems}
                onSelectCategory={(catName) => {
                  setActiveDrilldownCategory(catName);
                  setSelectedCategory(catName);
                }}
                handleSelectCourse={handleSelectCourse}
                handleEnrollFromCard={handleEnrollFromCard}
                enrolledCourseIds={enrolledCourseIds}
                isMobile={isMobile}
              />
            </div>
          );
        })()}
        <PracticePlaygroundModal
          isOpen={isPlaygroundOpen}
          onClose={() => setIsPlaygroundOpen(false)}
          title="Python Practice Playground"
          badge="Interactive Sandbox"
          initialCode={`# General Coding Playground\n# Write your code here\n\n`}
        />
      </div>

      {/* Course Completion Certificate Modal */}
      {isCertModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 8, 15, 0.85)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#faf7f7ff', border: '15px double #7C3AED',
            borderRadius: 8, width: '100%', maxWidth: 700, padding: '40px 48px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative',
            color: '#0F1D30', fontFamily: 'serif', textAlign: 'center'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setIsCertModalOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'transparent',
                border: 'none', cursor: 'pointer', color: '#647298'
              }}
            >
              <X size={20} />
            </button>

            {/* Certificate Content */}
            <div style={{ border: '2px solid #7C3AED', padding: '30px 20px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
                Certificate of Completion
              </div>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: '#4B5E7D', marginBottom: 24 }}>
                This is proudly presented to
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#0F1D30', borderBottom: '2px solid #E1EBF5', display: 'inline-block', paddingBottom: 6, marginBottom: 18, minWidth: 260 }}>
                {userEmail ? (userEmail.split('@')[0].replace(/\d+/g, '').replace(/[\._]/g, ' ').toUpperCase()) : 'AARAV MEHTA'}
              </div>
              <div style={{ fontSize: 13, color: '#4B5E7D', lineHeight: 1.6, maxWidth: 500, margin: '0 auto 28px' }}>
                for successfully fulfilling all requirements and completing the certified curriculum for the course
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F1D30', marginTop: 8, fontFamily: 'var(--font-outfit), sans-serif' }}>
                  {selectedCourse?.title}
                </div>
              </div>

              {/* Signatures & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, padding: '0 30px' }}>
                <div style={{ textAlign: 'center', width: 140 }}>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', fontStyle: 'italic', color: '#7C3AED', marginBottom: 4 }}>AI Tutor Academy</div>
                  <div style={{ borderTop: '1px solid #C4CFE5', paddingTop: 4, fontSize: 10, color: '#8CA2C0', textTransform: 'uppercase' }}>Authorized Entity</div>
                </div>
                <div style={{ fontSize: 11, color: '#8CA2C0' }}>
                  Issued on: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ textAlign: 'center', width: 140 }}>
                  <div style={{ fontSize: 14, fontFamily: 'cursive', color: '#2563EB', marginBottom: 4 }}>Seshu Yashu</div>
                  <div style={{ borderTop: '1px solid #C4CFE5', paddingTop: 4, fontSize: 10, color: '#8CA2C0', textTransform: 'uppercase' }}>Lead Instructor</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        isOpen={isPdfViewerOpen}
        onClose={() => { setIsPdfViewerOpen(false); setSelectedPdfResource(null); }}
        pdfResource={selectedPdfResource}
      />

    </div>
  );
}

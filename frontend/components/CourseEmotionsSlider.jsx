'use client';

import { useReducer, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ArrowUpRight } from 'lucide-react';
import CourseInteractiveCanvas from './CourseInteractiveCanvas';
import './emotions-slider.css';

const SHAPE_NAMES = ['Tetrahedron', 'Octahedron', 'Icosahedron', 'TorusKnot'];

const initialSliderState = {
  activeIdx: 0,
  isAnimating: false
};

function sliderReducer(state, action) {
  switch (action.type) {
    case 'SET_INDEX':
      if (state.activeIdx === action.payload) return state;
      return { ...state, activeIdx: action.payload, isAnimating: true };
    case 'PREV_SLIDE': {
      const len = action.payload || 1;
      const prev = state.activeIdx > 0 ? state.activeIdx - 1 : len - 1;
      return { ...state, activeIdx: prev, isAnimating: true };
    }
    case 'NEXT_SLIDE': {
      const len = action.payload || 1;
      const next = state.activeIdx < len - 1 ? state.activeIdx + 1 : 0;
      return { ...state, activeIdx: next, isAnimating: true };
    }
    case 'ANIMATION_END':
      return { ...state, isAnimating: false };
    default:
      return state;
  }
}

export default function CourseEmotionsSlider({
  items = [],
  mode = 'courses', // 'courses' | 'categories'
  onSelectCourse,
  onSelectCategory,
  onEnrollFromCard,
  enrolledCourseIds = []
}) {
  const [state, dispatch] = useReducer(sliderReducer, initialSliderState);
  const { activeIdx } = state;
  const trackRef = useRef(null);

  // By default, make the middle item show and set initial index
  useEffect(() => {
    if (items && items.length > 0) {
      const middleIdx = Math.floor(items.length / 2);
      dispatch({ type: 'SET_INDEX', payload: middleIdx });
    }
  }, [items?.length]);

  if (!items || items.length === 0) return null;

  const N = items.length;

  const handlePrev = () => {
    dispatch({ type: 'PREV_SLIDE', payload: N });
  };

  const handleNext = () => {
    dispatch({ type: 'NEXT_SLIDE', payload: N });
  };

  const handleSelectBullet = (idx) => {
    dispatch({ type: 'SET_INDEX', payload: idx });
  };

  const CARD_WIDTH = 380;
  const CARD_GAP = 28;
  const slideStep = CARD_WIDTH + CARD_GAP;

  return (
    <div className="base-template__wrapper">
      <div className="emotions-slider">
        {/* Slider Navigation Arrows */}
        <div className="slider-nav">
          <button
            type="button"
            className="slider-nav__item"
            onClick={handlePrev}
            aria-label="Previous Item"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="slider-nav__item"
            onClick={handleNext}
            aria-label="Next Item"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Slider Track Wrapper with Infinite-Feel Relative Offsets */}
        <div className="emotions-slider__track-wrapper">
          <div
            ref={trackRef}
            className="emotions-slider__track"
            style={{
              position: 'relative',
              height: 440,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {items.map((c, idx) => {
              if (!c) return null;
              const isActive = idx === activeIdx;
              const shapeName = SHAPE_NAMES[idx % SHAPE_NAMES.length];

              // Calculate shortest circular modular distance so cards wrap seamlessly
              let d = (idx - activeIdx) % N;
              if (d > N / 2) d -= N;
              if (d < -N / 2) d += N;

              const totalLessons = c.totalLessons || c.lessonsCount || (c.lessons ? c.lessons.length : 0);
              const isEnrolled = Array.isArray(enrolledCourseIds) && enrolledCourseIds.includes(c.id);
              const isCategory = mode === 'categories' || c.category === 'Category';

              // Fallback duration and level
              const totalMins = totalLessons * 10;
              const hours = Math.floor(totalMins / 60);
              const mins = totalMins % 60;
              const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              const level = isCategory
                ? c.badge || `${c.courses?.length || 1} Courses`
                : (c.title?.toLowerCase().includes('advanced') || c.title?.toLowerCase().includes('expert')
                  ? 'Advanced'
                  : (c.title?.toLowerCase().includes('intermediate') ? 'Intermediate' : 'Beginner'));

              // Visible if within display range
              const isVisible = Math.abs(d) <= 2;
              const render3D = Math.abs(d) <= 1;

              return (
                <div
                  key={c.id || idx}
                  className={`emotions-slider__slide ${isActive ? 'active-slide' : ''}`}
                  style={{
                    position: 'absolute',
                    transform: `translateX(${d * slideStep}px) scale(${isActive ? 1 : Math.max(0.78, 1 - Math.abs(d) * 0.1)})`,
                    opacity: isVisible ? (isActive ? 1 : Math.max(0.35, 1 - Math.abs(d) * 0.28)) : 0,
                    zIndex: isActive ? 10 : 10 - Math.abs(d),
                    pointerEvents: isVisible ? 'auto' : 'none',
                    transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease, filter 0.5s ease'
                  }}
                  onClick={() => {
                    if (!isActive) {
                      dispatch({ type: 'SET_INDEX', payload: idx });
                    }
                  }}
                >
                  <div className="emotions-slider-item">
                    {/* Badge */}
                    <div className="emotions-slider-item__badge">
                      <Star size={13} fill="#FBBF24" />
                      <span>{level}</span>
                    </div>

                    {/* Cursor Interactive 3D Geometry Canvas (mounted only on active/adjacent cards to conserve WebGL contexts) */}
                    <div className="emotions-slider-item__image">
                      {render3D ? (
                        <CourseInteractiveCanvas
                          shapeName={shapeName}
                          isSelected={isActive}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="emotions-slider-item__content">
                      {/* Header (collapsible on inactive slides) */}
                      <div className="emotions-slider-item__header">
                        <div className="emotions-slider-item__header-inner">
                          <div className="emotions-slider-item__price">
                            {isCategory ? (c.title) : (c.category || 'Science')}
                            <span>· {totalLessons} Lessons</span>
                          </div>
                          <div className="emotions-slider-item__author">
                            <div className="emotions-slider-item__author-image">
                              <span>{(c.instructor || 'Vedika').slice(0, 1).toUpperCase()}</span>
                            </div>
                            <span className="emotions-slider-item__author-name">
                              {isCategory ? `${c.instructorsCount || 1} Instructors` : (c.instructor || 'Vedika Tutor')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Main Title & Text */}
                      <div className="emotions-slider-item__body">
                        <h4 className="emotions-slider-item__title">{c.title}</h4>
                        <p className="emotions-slider-item__text">
                          {c.tagline || 'Master core subject concepts with interactive modules, 3D simulations, and AI mentorship.'}
                        </p>
                      </div>

                      {/* Footer CTA Button */}
                      <div className="emotions-slider-item__footer">
                        <button
                          type="button"
                          className="emotions-slider-item__btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isCategory) {
                              onSelectCategory && onSelectCategory(c.title);
                            } else {
                              onSelectCourse && onSelectCourse(c);
                            }
                          }}
                        >
                          <span>{isCategory ? `Explore ${c.title}` : (isEnrolled ? 'Open Course' : 'Explore Course')}</span>
                          <span className="emotions-slider-item__btn-icon">
                            <ArrowUpRight size={16} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slider Pagination Bullets */}
        <div className="slider-pagination">
          {items.map((_, pIdx) => (
            <button
              key={pIdx}
              type="button"
              className={`slider-pagination__item ${pIdx === activeIdx ? 'active' : ''}`}
              onClick={() => handleSelectBullet(pIdx)}
              aria-label={`Go to slide ${pIdx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

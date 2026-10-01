'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import './CategoryShowcaseCarousel.css';

/**
 * CategoryShowcaseCarousel
 * Distinct CoverFlow / Perspective Card Carousel for Quizzes & Assignments
 */
export default function CategoryShowcaseCarousel({
  items = [],
  activeCategory = null,
  onSelectCategory,
  itemTypeLabel = 'Items',
  theme = 'gold'
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!items || items.length === 0) return null;

  const total = items.length;

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIdx((prev) => (prev + 1) % total);
  };

  const currentItem = items[activeIdx] || items[0];

  return (
    <div className={`showcase-carousel-container ${theme === 'gold' ? 'theme-gold' : theme === 'purple' ? 'theme-purple' : ''}`}>
      {/* Title Badge matching reference design */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: theme === 'gold' ? 'rgba(245, 158, 11, 0.12)' : theme === 'purple' ? 'rgba(168, 85, 247, 0.14)' : 'rgba(124, 58, 237, 0.12)',
        border: theme === 'gold' ? '1px solid rgba(245, 158, 11, 0.35)' : theme === 'purple' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(124, 58, 237, 0.3)',
        color: theme === 'gold' ? '#FDE68A' : theme === 'purple' ? '#E9D5FF' : '#A78BFA',
        padding: '5px 14px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 16
      }}>
        <span>📂 {itemTypeLabel} by Category</span>
        <span style={{ opacity: 0.4 }}>•</span>
        <span>{total} Categories</span>
      </div>

      {/* 3D CoverFlow Stage */}
      <div className="showcase-stage">
        {/* Navigation Arrows */}
        {total > 1 && (
          <>
            <button
              className="showcase-nav-btn showcase-nav-prev"
              onClick={handlePrev}
              aria-label="Previous category"
              style={theme === 'gold' ? {
                background: 'rgba(12, 16, 24, 0.9)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#FDE68A'
              } : theme === 'purple' ? {
                background: 'rgba(14, 10, 24, 0.9)',
                borderColor: 'rgba(168, 85, 247, 0.35)',
                color: '#E9D5FF'
              } : {}}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="showcase-nav-btn showcase-nav-next"
              onClick={handleNext}
              aria-label="Next category"
              style={theme === 'gold' ? {
                background: 'rgba(12, 16, 24, 0.9)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#FDE68A'
              } : theme === 'purple' ? {
                background: 'rgba(14, 10, 24, 0.9)',
                borderColor: 'rgba(168, 85, 247, 0.35)',
                color: '#E9D5FF'
              } : {}}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {items.map((item, idx) => {
          // Calculate offset relative to activeIdx (-2, -1, 0, 1, 2)
          let offset = idx - activeIdx;
          if (offset < -Math.floor(total / 2)) offset += total;
          if (offset > Math.floor(total / 2)) offset -= total;

          const isCenter = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 210;
          const scale = isCenter ? 1.08 : Math.max(0.78, 1 - Math.abs(offset) * 0.16);
          const rotateY = offset * -25;
          const zIndex = 10 - Math.abs(offset);
          const opacity = isCenter ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.35);

          return (
            <div
              key={item.category || idx}
              className={`showcase-card ${isCenter ? 'is-active' : ''} ${theme === 'gold' ? 'theme-gold' : theme === 'purple' ? 'theme-purple' : ''}`}
              style={{
                transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
                zIndex,
                opacity,
                ...(theme === 'gold' ? {
                  background: '#0C0E14',
                  borderColor: isCenter ? 'rgba(251, 191, 36, 0.75)' : 'rgba(245, 158, 11, 0.22)',
                  boxShadow: isCenter
                    ? '0 18px 44px rgba(0, 0, 0, 0.85), 0 0 24px rgba(245, 158, 11, 0.2)'
                    : '0 10px 30px rgba(0, 0, 0, 0.5)'
                } : theme === 'purple' ? {
                  background: '#0C0818',
                  borderColor: isCenter ? 'rgba(192, 132, 252, 0.8)' : 'rgba(168, 85, 247, 0.25)',
                  boxShadow: isCenter
                    ? '0 18px 44px rgba(0, 0, 0, 0.85), 0 0 24px rgba(168, 85, 247, 0.3)'
                    : '0 10px 30px rgba(0, 0, 0, 0.5)'
                } : {})
              }}
              onClick={() => {
                if (isCenter) {
                  onSelectCategory && onSelectCategory(item.category);
                } else {
                  setActiveIdx(idx);
                }
              }}
            >
              <div className="showcase-card-img-wrapper">
                <img
                  src={item.artwork}
                  alt={item.category}
                  className="showcase-card-img"
                  loading="eager"
                />
                <div
                  className="showcase-card-badge"
                  style={theme === 'gold' ? {
                    background: 'rgba(0, 0, 0, 0.78)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#FFFBEB'
                  } : theme === 'purple' ? {
                    background: 'rgba(10, 6, 20, 0.82)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: '#F5EEFF'
                  } : {}}
                >
                  {item.count} {item.count === 1 ? itemTypeLabel.slice(0, -1) : itemTypeLabel}
                </div>
              </div>

              <div className="showcase-card-body" style={theme === 'gold' ? {
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.82) 100%)'
              } : theme === 'purple' ? {
                background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.03) 0%, rgba(12, 8, 24, 0.95) 100%)'
              } : {}}>
                <div>
                  <h4 className="showcase-card-title">{item.category}</h4>
                  <div className="showcase-card-subtitle" style={(theme === 'gold' || theme === 'purple') ? { color: '#94A3B8' } : {}}>
                    {item.coursesCount || 1} {(item.coursesCount || 1) === 1 ? 'Course' : 'Courses'}
                  </div>
                </div>

                {isCenter && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory && onSelectCategory(item.category);
                    }}
                    style={{
                      background: theme === 'gold'
                        ? 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)'
                        : theme === 'purple'
                        ? 'linear-gradient(135deg, #C084FC 0%, #A855F7 50%, #7C3AED 100%)'
                        : 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
                      color: theme === 'gold' ? '#000000' : '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '9px 18px',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginTop: 10,
                      boxShadow: 'none',
                      transform: 'none',
                      transition: 'none'
                    }}
                  >
                    <span>Explore {item.category}</span>
                    <ArrowRight size={14} color={theme === 'gold' ? '#000000' : '#FFFFFF'} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide dots */}
      {total > 1 && (
        <div className="showcase-dots">
          {items.map((_, idx) => (
            <button
              key={idx}
              className={`showcase-dot ${activeIdx === idx ? 'is-active' : ''}`}
              onClick={() => setActiveIdx(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={theme === 'gold' && activeIdx === idx ? {
                background: '#F59E0B'
              } : theme === 'purple' && activeIdx === idx ? {
                background: '#C084FC'
              } : {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

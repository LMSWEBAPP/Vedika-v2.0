'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Code, FileText } from 'lucide-react';
import { T } from '@/lib/lms-data';

export default function ResourcesHub({ navigateTo }) {
  const router = useRouter();
  const cards = [
    {
      id: 'library',
      title: 'PDF Library',
      description: 'Browse our extensive collection of educational PDFs',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      btnText: 'Explore Library',
      Icon: BookOpen
    },
    {
      id: 'cheatsheets',
      title: 'Cheat Sheets',
      description: 'Access quick reference guides and study materials',
      gradient: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
      btnText: 'Explore Sheets',
      Icon: FileText
    },
    {
      id: 'dsa',
      title: 'DSA Practice',
      description: 'Company-wise DSA questions and learning resources',
      gradient: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',
      btnText: 'Start Practicing',
      Icon: Code
    }
  ];

  return (
    <div className="resources-hub-container">
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: T.text || '#F8FAFC',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </button>
      </div>
      {/* Title Header */}
      <div className="resources-hub-header">
        <h1 className="resources-hub-title">
          Welcome, Student!
        </h1>
        <p className="resources-hub-subtitle">
          Ready to explore our digital library?
        </p>
      </div>

      {/* Grid of Cards */}
      <div className="resources-hub-grid">
        {cards.map(({ id, title, description, gradient, btnText, Icon }) => (
          <motion.div
            key={id}
            whileHover={{ y: -5, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateTo(id)}
            className="resources-hub-card"
            style={{ background: gradient }}
          >
            <div className="resources-hub-card-content">
              <div className="resources-hub-icon-wrap">
                <Icon size={26} color="#fff" />
              </div>
              <div className="resources-hub-card-text">
                <h2 className="resources-hub-card-title">
                  {title}
                </h2>
                <p className="resources-hub-card-desc">
                  {description}
                </p>
              </div>
            </div>

            <div className="resources-hub-btn">
              <span>{btnText}</span>
              <ArrowRight size={15} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

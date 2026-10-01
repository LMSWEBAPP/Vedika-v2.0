'use client';

import React from 'react';
import styles from './FeaturesGrid.module.css';
import { Eye, Mic, Brain, Network, BarChart3, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FeaturesGrid() {
  const features = [
    {
      icon: <Eye className={styles.iconCyan} size={24} />,
      title: 'Multimodal Vision & Equation Solver',
      badge: 'Vision 2.0',
      description: 'Point your camera at handwritten notebook equations, circuit diagrams, or complex graphs. Vedika perceives symbols, identifies misconceptions, and provides step-by-step guidance.',
      highlights: ['Handwriting OCR', 'Circuit & Geometric Proofs', 'Instant Error Detection']
    },
    {
      icon: <Mic className={styles.iconViolet} size={24} />,
      title: 'Ultra-Low Latency Conversational Voice',
      badge: 'Voice Kernel',
      description: 'Engage in natural spoken back-and-forth tutoring with sub-250ms voice latency. Interrupt anytime, ask for clarifications, or request simpler analogies just like speaking with a top MIT professor.',
      highlights: ['Sub-250ms Response', 'Natural Interruptions', 'Multi-Accent Support']
    },
    {
      icon: <Brain className={styles.iconPink} size={24} />,
      title: 'Dynamic Feynman Pedagogy',
      badge: 'Cognitive Engine',
      description: 'Rather than simply handing over the final answer, Vedika employs the Socratic method to test your mental models, ask probing counter-questions, and ensure true first-principles comprehension.',
      highlights: ['Socratic Inquiry', 'Concept Gap Analysis', 'Analogy Generator']
    },
    {
      icon: <Network className={styles.iconCyan} size={24} />,
      title: 'Continuous Skill & Memory Graph',
      badge: 'Graph Memory',
      description: 'Vedika maps every concept you explore onto a personalized topological skill tree. It automatically triggers spaced-repetition micro-quizzes before memory curves degrade.',
      highlights: ['Spaced Repetition', 'Concept Mastery Index', 'Prerequisite Tracking']
    },
    {
      icon: <BarChart3 className={styles.iconViolet} size={24} />,
      title: 'Deep Diagnostic Analytics',
      badge: 'Telemetry',
      description: 'Inspect precise time spent per problem, speed vs accuracy ratios, and cognitive friction areas. Export comprehensive progress dossiers for parents and academic advisors.',
      highlights: ['Cognitive Friction Maps', 'Time-to-Mastery Metrics', 'Exportable Reports']
    },
    {
      icon: <Clock className={styles.iconPink} size={24} />,
      title: '24/7 Autonomous Availability',
      badge: 'Zero Waiting',
      description: 'No scheduling friction or timezone barriers. Whether you are studying at 2:00 AM before a final or preparing an Olympiad theorem at dawn, your private tutor is perpetually live.',
      highlights: ['Always Online', 'Zero Queues', 'Sync Across Devices']
    }
  ];

  return (
    <section id="features" className={styles.featuresSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <Sparkles size={14} />
            <span>CORE ARCHITECTURE</span>
          </div>
          <h2 className={styles.title}>
            Engineered for <span className={styles.glow}>Exponential Retention</span>
          </h2>
          <p className={styles.subtitle}>
            Traditional tutorials are passive. Vedika is an active cognitive counterpart that listens,
            observes, and adapts to how your brain processes complex ideas.
          </p>
        </div>

        <div className={styles.cardsGrid}>
          {features.map((f, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>{f.icon}</div>
                <span className={styles.cardBadge}>{f.badge}</span>
              </div>
              <h3 className={styles.cardTitle}>{f.title}</h3>
              <p className={styles.cardDesc}>{f.description}</p>
              <div className={styles.highlightList}>
                {f.highlights.map((h, idx) => (
                  <div key={idx} className={styles.highlightItem}>
                    <CheckCircle2 size={13} className={styles.checkIcon} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
              <div className={styles.cardBorderGlow}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

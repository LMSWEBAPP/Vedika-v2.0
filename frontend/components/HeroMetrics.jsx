'use client';

import React from 'react';
import styles from './HeroMetrics.module.css';
import { ArrowUpRight } from 'lucide-react';

export default function HeroMetrics() {
  const metrics = [
    {
      number: '01',
      title: 'Adaptive Learning Matrix',
      description: 'Dynamically shifts pacing, complexity, and mental models based on your unique retention curve.',
      tag: 'Neural Routing',
      targetId: 'features'
    },
    {
      number: '02',
      title: 'Multimodal Problem Solving',
      description: 'Break down complex equations, handwritten proofs, diagrams, and code snippets in real-time.',
      tag: 'Vision & Logic',
      targetId: 'features'
    },
    {
      number: '03',
      title: 'Active Feynman Recall',
      description: 'Teaches through dialogue. Explains concepts backwards and challenges gaps to build deep intuition.',
      tag: 'Socratic AI',
      targetId: 'demo'
    },
    {
      number: '04',
      title: 'Persistent Knowledge Graph',
      description: 'Builds an evolving skill map across mathematics, sciences, engineering, and humanities.',
      tag: 'Memory Engine',
      targetId: 'technology'
    },
  ];

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.metricsSection}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {metrics.map((item) => (
            <div
              key={item.number}
              className={styles.card}
              onClick={() => handleScrollTo(item.targetId)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>{item.number}</span>
                <span className={styles.cardTag}>{item.tag}</span>
              </div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.exploreLink}>
                  Explore Module <ArrowUpRight size={14} className={styles.arrowIcon} />
                </span>
              </div>
              <div className={styles.glowCorner}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

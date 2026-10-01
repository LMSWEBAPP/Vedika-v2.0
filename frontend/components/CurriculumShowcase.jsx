'use client';

import React, { useState } from 'react';
import styles from './CurriculumShowcase.module.css';
import { Layers, CheckCircle2, Award } from 'lucide-react';

export default function CurriculumShowcase() {
  const tracks = [
    {
      id: 'math',
      name: 'Advanced Mathematics',
      badge: 'Calculus to Topology',
      topics: [
        {
          title: 'Multivariable Calculus & Vector Fields',
          level: 'Undergrad Level',
          modules: ['Gradient, Divergence & Curl', 'Green’s & Stokes’ Theorems', 'Optimization with Lagrange Multipliers'],
          benchmark: '98% pass rate on College Board AP Calc BC equivalent'
        },
        {
          title: 'Linear Algebra & Matrix Decompositions',
          level: 'Core Foundations',
          modules: ['Eigenvalues & Eigenvectors', 'Singular Value Decomposition (SVD)', 'Orthogonal Projections & Gram-Schmidt'],
          benchmark: 'Essential for ML & Computer Graphics'
        },
        {
          title: 'Discrete Math & Proof Mechanics',
          level: 'Mathematical Rigor',
          modules: ['Mathematical Induction', 'Combinatorics & Graph Theory', 'Modular Arithmetic & Cryptography basics'],
          benchmark: 'Mastery in rigorous proof construction'
        }
      ]
    },
    {
      id: 'physics',
      name: 'Physics & Engineering',
      badge: 'Classical to Quantum',
      topics: [
        {
          title: 'Quantum Mechanics & Hilbert Space',
          level: 'Advanced Track',
          modules: ['Schrödinger Equation & Wavefunctions', 'Bra-Ket Dirac Notation', 'Quantum Tunneling & Harmonic Oscillators'],
          benchmark: 'Interactive particle wave packet simulations'
        },
        {
          title: 'Electromagnetism & Maxwell’s Equations',
          level: 'Field Theory',
          modules: ['Gauss & Ampère Laws with Maxwell Correction', 'Electromagnetic Wave Propagation', 'Poynting Vectors & Radiation'],
          benchmark: 'Intuitive 3D vector field visualizers'
        },
        {
          title: 'Analytical Mechanics & Lagrangians',
          level: 'Theoretical Physics',
          modules: ['Principle of Least Action', 'Euler-Lagrange Equations', 'Noether’s Theorem & Conservation Laws'],
          benchmark: 'Deep symmetry & energy invariance'
        }
      ]
    },
    {
      id: 'cs',
      name: 'Computer Science & AI',
      badge: 'Algorithms to LLMs',
      topics: [
        {
          title: 'Advanced Data Structures & Algorithms',
          level: 'FAANG / Competitive',
          modules: ['Segment Trees & Fenwick Trees', 'Dynamic Programming on Trees', 'Dijkstra, A* & Flow Networks'],
          benchmark: 'Targeted for 2000+ LeetCode rating'
        },
        {
          title: 'Deep Learning & Transformer Architectures',
          level: 'State of the Art',
          modules: ['Multi-Head Self-Attention Mechanics', 'Backpropagation through Time (BPTT)', 'KV Caching & FlashAttention'],
          benchmark: 'Build attention layers from scratch'
        },
        {
          title: 'Systems Programming & Memory Safety',
          level: 'Low-Level Mastery',
          modules: ['Pointers, Stack vs Heap & Memory Layouts', 'Rust Ownership & Borrow Checker', 'Concurrency, Locks & Mutexes'],
          benchmark: 'Zero-overhead performance engineering'
        }
      ]
    },
    {
      id: 'prep',
      name: 'Standardized & Olympiad Prep',
      badge: 'Top 1% Percentile',
      topics: [
        {
          title: 'SAT & ACT Math Perfect Score Track',
          level: 'Elite Test Prep',
          modules: ['Speed Elimination Shortcuts', 'Advanced Algebra & Heart of Mathematics', 'Data Analysis Trap Avoidance'],
          benchmark: 'Average score jump: +190 points'
        },
        {
          title: 'IIT JEE & Advanced Olympiad Math',
          level: 'Extreme Rigor',
          modules: ['Complex Numbers & Coordinate Geometry', 'Functional Equations', 'Inequalities: Cauchy-Schwarz & AM-GM-HM'],
          benchmark: 'Deep problem breakdown for top ranks'
        },
        {
          title: 'AP Physics C & Mechanics Mastery',
          level: 'College Credit',
          modules: ['Rotational Dynamics & Torque Integrals', 'Simple Harmonic Motion with Damping', 'Center of Mass Variable Systems'],
          benchmark: '5/5 score focus with diagnostic drills'
        }
      ]
    }
  ];

  const [activeTrack, setActiveTrack] = useState(tracks[0]);

  return (
    <section id="curriculum" className={styles.curriculumSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <Layers size={14} />
            <span>KNOWLEDGE DOMAINS</span>
          </div>
          <h2 className={styles.title}>
            From First Principles to <span className={styles.glow}>Olympiad Rigor</span>
          </h2>
          <p className={styles.subtitle}>
            Vedika isn&apos;t confined to elementary tutoring. Its knowledge core covers rigorous university
            curricula, competitive exams, and cutting-edge engineering fields.
          </p>
        </div>

        {/* Track Selection Tabs */}
        <div className={styles.tabsWrapper}>
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrack(track)}
              className={`${styles.tabBtn} ${activeTrack.id === track.id ? styles.activeTab : ''}`}
            >
              <span className={styles.tabName}>{track.name}</span>
              <span className={styles.tabBadge}>{track.badge}</span>
            </button>
          ))}
        </div>

        {/* Topic Modules Grid */}
        <div className={styles.modulesGrid}>
          {activeTrack.topics.map((topic, idx) => (
            <div key={idx} className={styles.topicCard}>
              <div className={styles.cardHeader}>
                <span className={styles.topicLevel}>{topic.level}</span>
                <span className={styles.topicIndex}>Module 0{idx + 1}</span>
              </div>
              <h3 className={styles.topicTitle}>{topic.title}</h3>

              <div className={styles.moduleList}>
                {topic.modules.map((m, mIdx) => (
                  <div key={mIdx} className={styles.moduleItem}>
                    <CheckCircle2 size={14} className={styles.checkIcon} />
                    <span>{m}</span>
                  </div>
                ))}
              </div>

              <div className={styles.benchmarkBox}>
                <Award size={14} className={styles.awardIcon} />
                <span>{topic.benchmark}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

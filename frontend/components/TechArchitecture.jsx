'use client';

import React from 'react';
import styles from './TechArchitecture.module.css';
import { Cpu, Database, ShieldCheck, GitBranch, Radio } from 'lucide-react';

export default function TechArchitecture() {
  const specs = [
    {
      icon: <Radio className={styles.iconCyan} size={22} />,
      title: 'Full-Duplex Audio Engine',
      stat: '180ms',
      statLabel: 'Voice Response Turnaround',
      description: 'Zero-latency streaming with bidirectional audio tokenization. Allows fluid real-time interruptions and speech-to-speech cadence matching.'
    },
    {
      icon: <Cpu className={styles.iconViolet} size={22} />,
      title: 'Pedagogical Reasoning Core',
      stat: '99.4%',
      statLabel: 'Proof Verification Accuracy',
      description: 'Specialized mixture-of-experts model optimized on mathematical proofs, formal logic verification, and progressive hint disclosure.'
    },
    {
      icon: <Database className={styles.iconCyan} size={22} />,
      title: 'Episodic Memory & Graph RAG',
      stat: '10M+',
      statLabel: 'Interconnected Knowledge Nodes',
      description: 'Every interaction updates a vectorized knowledge graph of your personal understanding, tracking weak nodes and concept decay curves.'
    },
    {
      icon: <ShieldCheck className={styles.iconViolet} size={22} />,
      title: 'Hallucination Guardrails',
      stat: '0.01%',
      statLabel: 'Factual Deviation Rate',
      description: 'Double-pass symbolic verification ensures all mathematical solutions and scientific derivations are rigorously grounded against formal solvers.'
    }
  ];

  return (
    <section id="technology" className={styles.techSection}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <GitBranch size={14} />
            <span>NEURAL FOUNDATION</span>
          </div>
          <h2 className={styles.title}>
            The Cognitive <span className={styles.glow}>Architecture</span>
          </h2>
          <p className={styles.subtitle}>
            Vedika isn&apos;t a generic conversational wrapper. It is a multi-tier cognitive agent built on
            rigorous symbolic solvers, latency-minimized audio transformers, and pedagogical knowledge trees.
          </p>
        </div>

        {/* Technical Pipeline Grid */}
        <div className={styles.specsGrid}>
          {specs.map((item, index) => (
            <div key={index} className={styles.specCard}>
              <div className={styles.specHeader}>
                <div className={styles.iconWrap}>{item.icon}</div>
                <div className={styles.statBox}>
                  <span className={styles.statVal}>{item.stat}</span>
                  <span className={styles.statSub}>{item.statLabel}</span>
                </div>
              </div>

              <h3 className={styles.specTitle}>{item.title}</h3>
              <p className={styles.specDesc}>{item.description}</p>

              <div className={styles.techBar}>
                <div className={styles.techBarFill} style={{ width: `${80 + index * 5}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Infrastructure Status Pill */}
        <div className={styles.infraStatusBanner}>
          <div className={styles.statusLeft}>
            <span className={styles.pulseDot}></span>
            <span className={styles.statusTitle}>Global Inference Cluster: Online</span>
            <span className={styles.statusRegion}>us-east • eu-central • ap-southeast</span>
          </div>
          <div className={styles.statusRight}>
            <span className={styles.latencyChip}>⚡ Mean Latency: 42ms</span>
            <span className={styles.uptimeChip}>99.99% Uptime</span>
          </div>
        </div>
      </div>
    </section>
  );
}

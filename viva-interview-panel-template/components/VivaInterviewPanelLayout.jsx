'use client';

import React, { useState } from 'react';
import VedikaParticleBot from './VedikaParticleBot';
import '../styles/viva-panel.css';

/**
 * VivaInterviewPanelLayout
 * 
 * Production-ready Dual-Mode Panel Architecture:
 * - Mode A: Academic Viva Defense (Theme: Neon Violet / Purple)
 * - Mode B: Technical Engineering Interview (Theme: Electric Cyan / Sky Blue)
 * - 74% / 26% dynamic sliding split panel with Bruno Imbrizi Interactive Particle Bots
 * 
 * Props:
 * @param {string} [initialMode='viva'] - Initial active mode ('viva' or 'interview')
 * @param {function} [onModeChange] - Callback when user switches modes
 * @param {function} [onSubmitAnswer] - Callback when answer is submitted
 */
export default function VivaInterviewPanelLayout({
  initialMode = 'viva',
  onModeChange = null,
  onSubmitAnswer = null
}) {
  const [sessionMode, setSessionMode] = useState(initialMode); // 'viva' | 'interview'
  const isRightOpen = sessionMode === 'interview';

  // Demo state for questions
  const [vivaAnswer, setVivaAnswer] = useState('');
  const [interviewAnswer, setInterviewAnswer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadCode, setScratchpadCode] = useState('// Write algorithmic notes or code here...\nfunction solution() {\n  \n}');

  const handleSwitchMode = (mode) => {
    setSessionMode(mode);
    setStatusMessage('');
    if (onModeChange) onModeChange(mode);
  };

  const handleVivaSubmit = () => {
    if (!vivaAnswer.trim()) {
      setStatusMessage('⚠️ Please provide an answer before submitting. Speak or type your defense.');
      return;
    }
    setStatusMessage('Evaluating oral viva response...');
    if (onSubmitAnswer) onSubmitAnswer({ mode: 'viva', answer: vivaAnswer });
    setTimeout(() => {
      setVivaAnswer('');
      setStatusMessage('Next question ready.');
    }, 1200);
  };

  const handleInterviewSubmit = () => {
    if (!interviewAnswer.trim() && !scratchpadCode.trim()) {
      setStatusMessage('⚠️ Please explain your engineering approach or write code before submitting.');
      return;
    }
    setStatusMessage('Reviewing technical design and trade-offs...');
    if (onSubmitAnswer) onSubmitAnswer({ mode: 'interview', answer: interviewAnswer, code: scratchpadCode });
    setTimeout(() => {
      setInterviewAnswer('');
      setStatusMessage('Follow-up technical question ready.');
    }, 1200);
  };

  return (
    <div className="viva-interview-wrapper">
      <div className={`box-container ${isRightOpen ? 'right-open' : ''}`}>
        
        {/* ============================================================== */}
        {/* 1. ACADEMIC VIVA CONTENT (EXPANDED BY DEFAULT: 74% / FLEX 7)   */}
        {/* ============================================================== */}
        <main className="box1-content" aria-label="Academic Viva Examination Area">
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="status-pill viva">
                  <span className="pulse-dot viva" />
                  Academic Viva Mode
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Syllabus: Database Management Systems</span>
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Oral Thesis & Concept Defense
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.78rem', color: '#C4B5FD', background: 'rgba(124, 58, 237, 0.15)', padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                Turn 1 of 4
              </span>
            </div>
          </div>

          {/* Examiner Question Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 16, 44, 0.7) 0%, rgba(9, 13, 26, 0.85) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.35)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>🎓</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Professor Question
              </span>
            </div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#F1F5F9', margin: 0, fontWeight: 500 }}>
              "Explain how the Write-Ahead Logging (WAL) protocol guarantees ACID durability during sudden server crashes. Walk through the undo/redo recovery phase."
            </p>
          </div>

          {/* Candidate Response Workspace */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
              Your Spoken or Written Defense:
            </label>
            <textarea
              value={vivaAnswer}
              onChange={(e) => setVivaAnswer(e.target.value)}
              placeholder="Speak aloud into your microphone or articulate your answer here..."
              rows={6}
              style={{
                width: '100%',
                flex: 1,
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: 12,
                padding: 16,
                color: '#F8FAFC',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '0.82rem', color: statusMessage.startsWith('⚠️') ? '#F59E0B' : '#A855F7', fontWeight: 600 }}>
                {statusMessage || 'Tip: Speak clearly. You can also interrupt or elaborate.'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleVivaSubmit}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)'
                  }}
                >
                  Submit Defense ➔
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* ============================================================== */}
        {/* 2. ACADEMIC VIVA SIDEBAR (VEDIKA BOT IN SCHOOL UNIFORM)         */}
        {/* ============================================================== */}
        <aside className="box1-side" aria-label="Academic Viva Examiner Sidebar">
          {/* Top Status */}
          <div className="status-pill viva">
            <span className="pulse-dot viva" />
            <span>Academic Viva Examiner</span>
          </div>

          {/* Interactive Particle Bot */}
          <div className="bot-halo-wrapper">
            <div className="bot-ambient-halo viva" />
            <VedikaParticleBot
              src="/assets/vedika-bot-school.png"
              width={220}
              height={295}
              inline={true}
              colorMode="vibrant"
              particleStep={2}
            />
          </div>

          {/* Switch to Technical Interview Mode */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="mode-switch-btn to-interview"
              onClick={() => handleSwitchMode('interview')}
            >
              <span>Technical Interview Mode</span>
              <span>➔</span>
            </button>

            <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: '#64748B' }}>
              <span>📚 Syllabus Driven</span>
              <span>•</span>
              <span>🎙️ Oral Defense</span>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* 3. TECHNICAL INTERVIEW SIDEBAR (VEDIKA BOT IN SUIT: COLLAPSED) */}
        {/* ============================================================== */}
        <aside className="box2-side" aria-label="Technical Interviewer Sidebar">
          {/* Top Status */}
          <div className="status-pill interview">
            <span className="pulse-dot interview" />
            <span>Technical Interviewer</span>
          </div>

          {/* Interactive Particle Bot in Suit */}
          <div className="bot-halo-wrapper">
            <div className="bot-ambient-halo interview" />
            <VedikaParticleBot
              src="/assets/vedika-bot-suit.png"
              width={220}
              height={295}
              inline={true}
              colorMode="vibrant"
              particleStep={2}
            />
          </div>

          {/* Switch to Academic Viva Mode */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="mode-switch-btn to-viva"
              onClick={() => handleSwitchMode('viva')}
            >
              <span>Academic Viva Mode</span>
              <span>➔</span>
            </button>

            <div style={{ display: 'flex', gap: 10, fontSize: '0.72rem', color: '#64748B' }}>
              <span>💼 System Design</span>
              <span>•</span>
              <span>⚡ Live Coding</span>
            </div>
          </div>
        </aside>

        {/* ============================================================== */}
        {/* 4. TECHNICAL INTERVIEW CONTENT (COLLAPSED UNTIL RIGHT-OPEN)     */}
        {/* ============================================================== */}
        <main className="box2-content" aria-label="Technical Interview Area">
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="status-pill interview">
                  <span className="pulse-dot interview" />
                  Technical Interview Mode
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Track: Full Stack & Distributed Systems</span>
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Senior Engineering Technical Discussion
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: isScratchpadOpen ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {isScratchpadOpen ? 'Hide Scratchpad' : 'Open Scratchpad 💻'}
              </button>
            </div>
          </div>

          {/* Interviewer Scenario Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(10, 24, 44, 0.7) 0%, rgba(7, 13, 24, 0.85) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.35)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>💼</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engineering Architecture Challenge
              </span>
            </div>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#F1F5F9', margin: 0, fontWeight: 500 }}>
              "Suppose we have a flash-sale endpoint receiving 50,000 req/sec attempting to decrement product stock in a relational database. How would you architect this to avoid row lock contention, overselling, and cascading database crashes?"
            </p>
          </div>

          {/* Scratchpad (Conditional) */}
          {isScratchpadOpen && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#38BDF8', display: 'block', marginBottom: 6 }}>
                Engineering Scratchpad / Pseudocode:
              </label>
              <textarea
                value={scratchpadCode}
                onChange={(e) => setScratchpadCode(e.target.value)}
                rows={5}
                style={{
                  width: '100%',
                  background: '#040711',
                  border: '1px solid rgba(14, 165, 233, 0.4)',
                  borderRadius: 10,
                  padding: 14,
                  color: '#38BDF8',
                  fontSize: '0.88rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          {/* Candidate Explanation */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#CBD5E1' }}>
              Your Architectural Strategy & Trade-offs:
            </label>
            <textarea
              value={interviewAnswer}
              onChange={(e) => setInterviewAnswer(e.target.value)}
              placeholder="Describe your design (Redis atomic decrements, Kafka queues, optimistic locking, idempotent checkout tokens)..."
              rows={isScratchpadOpen ? 4 : 7}
              style={{
                width: '100%',
                flex: 1,
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                borderRadius: 12,
                padding: 16,
                color: '#F8FAFC',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '0.82rem', color: statusMessage.startsWith('⚠️') ? '#F59E0B' : '#38BDF8', fontWeight: 600 }}>
                {statusMessage || 'Tip: Discuss latency, consistency guarantees, and failover behavior.'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={handleInterviewSubmit}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(14, 165, 233, 0.4)'
                  }}
                >
                  Submit Solution ➔
                </button>
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

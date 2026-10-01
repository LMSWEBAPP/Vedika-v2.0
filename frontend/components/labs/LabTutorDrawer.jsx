'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, RefreshCw, BookOpen, HelpCircle, ChevronRight, 
  Sparkles, Award, Atom, Minimize2, Maximize2 
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import MathEquationRenderer from '@/components/labs/MathEquationRenderer';

export default function LabTutorDrawer({
  subject = 'physics',
  experiment = null,
  isOpen = false,
  onClose,
  initialQuestion = ''
}) {
  const [query, setQuery] = useState(initialQuestion || '');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('chat'); // 'chat' | 'viva'
  const chatBottomRef = useRef(null);

  // Initialize greeting on open or experiment change
  useEffect(() => {
    if (experiment) {
      const formulas = experiment.keyFormulas?.length 
        ? `\n\n📐 **Key Formulas:** ${experiment.keyFormulas.join(', ')}`
        : '';
      const objectives = experiment.objectives?.length
        ? `\n\n🎯 **Objectives:**\n${experiment.objectives.slice(0, 3).map(o => `• ${o}`).join('\n')}`
        : '';

      setMessages([
        {
          sender: 'ai',
          text: `Hello! I am your AI Science Tutor for **${experiment.title || 'Virtual Labs'}** (${subject.toUpperCase()}).${objectives}${formulas}\n\nAsk me any questions about the theory, procedures, or select a viva question to see a step-by-step breakdown!`
        }
      ]);
    } else {
      setMessages([
        {
          sender: 'ai',
          text: `Hello! I am your AI Science & Virtual Lab Tutor for ${subject.toUpperCase()}. Ask any question regarding scientific principles, formulas, or experiment setups.`
        }
      ]);
    }
  }, [experiment?.id, subject]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking]);

  const handleSend = async (questionText, options = {}) => {
    const q = questionText || query;
    if (!q.trim() || isThinking) return;

    const userMsg = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsThinking(true);
    setActiveSubTab('chat');

    try {
      const res = await fetch('/api/labs/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          experiment: experiment || { title: `${subject} Lab` },
          userQuery: q,
          vivaQuestion: options.vivaQuestion || null,
          questionIndex: options.questionIndex || null,
          history: messages.slice(-6).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!res.ok) throw new Error(`Tutor error: ${res.status}`);
      const data = await res.json();
      const reply = data.reply || data.response || 'No response from tutor.';
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.warn('[LabTutorDrawer API Error]:', err);
      // Local fallback
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `### Guidance for ${experiment?.title || 'Experiment'}\n\n` +
                `**Scientific Core:** This experiment demonstrates fundamental principles governing **${subject}**.\n\n` +
                `**Procedure & Observation:** Verify parameter adjustments and observe how changes reflect across measured meters and readings.`
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: 440,
      background: T.s1 || '#0c0f1d',
      borderLeft: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
      fontFamily: 'var(--font-outfit), sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: T.s2 || '#13172b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `${T.purple || '#7C3AED'}20`,
            border: `1px solid ${T.purple || '#7C3AED'}50`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: T.purple || '#7C3AED'
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ color: T.text || '#fff', fontSize: 13, fontWeight: 700 }}>
              Virtual Lab AI Tutor
            </div>
            <div style={{ color: T.muted || '#8892b0', fontSize: 11 }}>
              {experiment?.title ? experiment.title.slice(0, 30) : `${subject.toUpperCase()} Assistant`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: T.muted || '#8892b0',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Mode Subtabs */}
      {experiment?.guidedQuestions?.length > 0 && (
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
          background: T.s1 || '#0c0f1d'
        }}>
          <button
            onClick={() => setActiveSubTab('chat')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: activeSubTab === 'chat' ? (T.s2 || '#13172b') : 'transparent',
              color: activeSubTab === 'chat' ? (T.purple || '#7C3AED') : (T.muted || '#8892b0'),
              border: 'none',
              borderBottom: activeSubTab === 'chat' ? `2px solid ${T.purple || '#7C3AED'}` : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Ask Tutor
          </button>
          <button
            onClick={() => setActiveSubTab('viva')}
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 12,
              fontWeight: 600,
              background: activeSubTab === 'viva' ? (T.s2 || '#13172b') : 'transparent',
              color: activeSubTab === 'viva' ? (T.purple || '#7C3AED') : (T.muted || '#8892b0'),
              border: 'none',
              borderBottom: activeSubTab === 'viva' ? `2px solid ${T.purple || '#7C3AED'}` : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            Viva Questions ({experiment.guidedQuestions.length})
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeSubTab === 'viva' && experiment?.guidedQuestions?.length > 0 ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: T.muted || '#8892b0', fontSize: 12, marginBottom: 4 }}>
            Click any question to receive a guided theoretical and experimental walkthrough:
          </div>
          {experiment.guidedQuestions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => handleSend(`Answer Viva Question Q${idx + 1}: ${q}`, {
                vivaQuestion: q,
                questionIndex: idx + 1
              })}
              style={{
                background: T.s2 || '#13172b',
                border: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
                padding: '12px 14px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.purple || '#7C3AED';
                e.currentTarget.style.background = `${T.purple || '#7C3AED'}0f`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border || 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = T.s2 || '#13172b';
              }}
            >
              <div style={{ color: T.purple || '#7C3AED', fontWeight: 700, fontSize: 12 }}>
                Q{idx + 1}
              </div>
              <div style={{ flex: 1, color: T.text || '#fff', fontSize: 12.5, lineHeight: 1.4 }}>
                {q}
              </div>
              <ChevronRight size={14} color={T.muted || '#8892b0'} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                background: msg.sender === 'user' ? (T.purple || '#7C3AED') : (T.s2 || '#13172b'),
                color: '#fff',
                padding: '12px 14px',
                borderRadius: 10,
                border: msg.sender === 'user' ? 'none' : `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`
              }}
            >
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                opacity: 0.8,
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                {msg.sender === 'user' ? (
                  'You'
                ) : (
                  <>
                    <Bot size={13} style={{ color: T.purple || '#7C3AED' }} />
                    <span>AI Tutor</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                {msg.sender === 'ai' ? (
                  <MathEquationRenderer content={msg.text} />
                ) : (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: 8,
              background: T.s2 || '#13172b',
              border: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
              color: T.purple || '#7C3AED',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <RefreshCw size={13} style={{ animation: 'spin 1.5s linear infinite' }} />
              Formulating scientific explanation...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Query Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          padding: 12,
          borderTop: `1px solid ${T.border || 'rgba(255,255,255,0.08)'}`,
          background: T.s2 || '#13172b',
          display: 'flex',
          gap: 8
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about this experiment..."
          disabled={isThinking}
          style={{
            flex: 1,
            background: T.s1 || '#0c0f1d',
            border: `1px solid ${T.border || 'rgba(255,255,255,0.12)'}`,
            borderRadius: 8,
            padding: '9px 12px',
            color: T.text || '#fff',
            fontSize: 12.5,
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!query.trim() || isThinking}
          style={{
            background: query.trim() && !isThinking ? (T.purple || '#7C3AED') : (T.s1 || '#1c223a'),
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0 14px',
            cursor: query.trim() && !isThinking ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

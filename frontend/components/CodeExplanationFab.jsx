'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  HelpCircle,
  FlipHorizontal,
  Image as ImageIcon,
  AlignLeft,
  Code as CodeIcon,
  X,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Loader2,
  Check,
  Copy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ACTIONS = [
  { id: 'quiz', label: 'Coding Quiz', icon: HelpCircle, color: '#38BDF8', desc: 'Test your understanding' },
  { id: 'flashcards', label: 'Flashcards', icon: FlipHorizontal, color: '#A855F7', desc: 'Core concept cards' },
  { id: 'infographic', label: 'Visual Summary', icon: ImageIcon, color: '#F59E0B', desc: 'Key architecture & logic' },
  { id: 'simpler', label: 'Explain Simpler', icon: AlignLeft, color: '#10B981', desc: 'Plain English ELI5' },
  { id: 'examples', label: 'Code Examples', icon: CodeIcon, color: '#6366F1', desc: 'Alternative patterns' }
];

export default function CodeExplanationFab({
  code = '',
  sourceMsg = null,
  activeMsgIdx = null,
  onGenerateFeature = null,
  onQuizAnswer = null,
  onQuizNav = null,
  onFlashcardFlip = null,
  onFlashcardNav = null
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // 'quiz' | 'flashcards' | 'infographic' | 'simpler' | 'examples' | null
  const [localFeatures, setLocalFeatures] = useState({});
  const [loadingType, setLoadingType] = useState(null);
  const [copiedExample, setCopiedExample] = useState(false);

  // Sync features from parent chat message if available
  const features = {
    ...localFeatures,
    ...(sourceMsg?.features || {})
  };

  const handleSelectAction = async (actionId) => {
    setActiveTab(actionId);
    setIsMenuOpen(false);

    // If sourceMsg already has it or local state has it, we are ready
    if (features[actionId]) return;

    // Otherwise trigger generation
    if (onGenerateFeature && activeMsgIdx !== null) {
      onGenerateFeature(activeMsgIdx, actionId);
    } else {
      await generateLocalFeature(actionId);
    }
  };

  const generateLocalFeature = async (type) => {
    if (!code || !code.trim()) return;
    setLoadingType(type);

    try {
      let promptPrefix = '';
      if (type === 'quiz') {
        promptPrefix = 'Generate 3 multiple choice coding questions in JSON format: [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "..."}] for this code:\n';
      } else if (type === 'flashcards') {
        promptPrefix = 'Generate 4 flashcards in JSON format: [{"front": "Question/Concept", "back": "Answer/Explanation"}] for this code:\n';
      } else if (type === 'simpler') {
        promptPrefix = 'Explain this code in very simple, plain English without jargon as if explaining to a beginner:\n';
      } else if (type === 'examples') {
        promptPrefix = 'Provide 2-3 clean, alternative Python code implementations for this logic (e.g. list comprehension, while loop, functional) with brief notes:\n';
      } else if (type === 'infographic') {
        promptPrefix = 'Provide a structured bullet-point breakdown of key logic steps and data concepts in this code:\n';
      }

      const res = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: `${promptPrefix}\`\`\`python\n${code}\n\`\`\``,
          maxOutputTokens: 1200
        })
      });

      if (!res.ok) throw new Error('Generation failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const cleaned = fullText.replace(/```json/g, '').replace(/```/g, '').trim();

      if (type === 'quiz') {
        try {
          const parsed = JSON.parse(cleaned);
          setLocalFeatures(prev => ({
            ...prev,
            quiz: { questions: parsed, currentIdx: 0, currentAnswer: null }
          }));
        } catch {
          setLocalFeatures(prev => ({
            ...prev,
            quiz: { questions: [{ question: 'What does this code do?', options: ['Iterates over a list', 'Defines a class', 'Creates an infinite loop', 'Throws an error'], correct: 0, explanation: 'It iterates over the list elements.' }], currentIdx: 0, currentAnswer: null }
          }));
        }
      } else if (type === 'flashcards') {
        try {
          const parsed = JSON.parse(cleaned);
          setLocalFeatures(prev => ({
            ...prev,
            flashcards: { cards: parsed, currentIdx: 0, flipped: false }
          }));
        } catch {
          setLocalFeatures(prev => ({
            ...prev,
            flashcards: { cards: [{ front: 'What is a for loop in Python?', back: 'A control flow statement for iterating over a sequence.' }], currentIdx: 0, flipped: false }
          }));
        }
      } else if (type === 'simpler') {
        setLocalFeatures(prev => ({ ...prev, simpler: { text: fullText } }));
      } else if (type === 'examples') {
        setLocalFeatures(prev => ({ ...prev, examples: { text: fullText } }));
      } else if (type === 'infographic') {
        setLocalFeatures(prev => ({ ...prev, infographic: { text: fullText } }));
      }
    } catch (e) {
      console.error('Failed to generate feature:', e);
    } finally {
      setLoadingType(null);
    }
  };

  const currentQuiz = features.quiz;
  const currentFlashcards = features.flashcards;

  const handleLocalQuizAnswer = (idx) => {
    if (onQuizAnswer && activeMsgIdx !== null) {
      onQuizAnswer(activeMsgIdx, idx);
    } else {
      setLocalFeatures(prev => {
        if (!prev.quiz) return prev;
        return {
          ...prev,
          quiz: { ...prev.quiz, currentAnswer: idx }
        };
      });
    }
  };

  const handleLocalQuizNav = (dir) => {
    if (onQuizNav && activeMsgIdx !== null) {
      onQuizNav(activeMsgIdx, dir);
    } else {
      setLocalFeatures(prev => {
        if (!prev.quiz) return prev;
        const total = prev.quiz.questions?.length || 1;
        const nextIdx = dir === 'next' ? Math.min(prev.quiz.currentIdx + 1, total - 1) : Math.max(prev.quiz.currentIdx - 1, 0);
        return {
          ...prev,
          quiz: { ...prev.quiz, currentIdx: nextIdx, currentAnswer: null }
        };
      });
    }
  };

  const handleLocalFlashcardFlip = () => {
    if (onFlashcardFlip && activeMsgIdx !== null) {
      onFlashcardFlip(activeMsgIdx);
    } else {
      setLocalFeatures(prev => {
        if (!prev.flashcards) return prev;
        return {
          ...prev,
          flashcards: { ...prev.flashcards, flipped: !prev.flashcards.flipped }
        };
      });
    }
  };

  const handleLocalFlashcardNav = (dir) => {
    if (onFlashcardNav && activeMsgIdx !== null) {
      onFlashcardNav(activeMsgIdx, dir);
    } else {
      setLocalFeatures(prev => {
        if (!prev.flashcards) return prev;
        const total = prev.flashcards.cards?.length || 1;
        const nextIdx = dir === 'next' ? Math.min(prev.flashcards.currentIdx + 1, total - 1) : Math.max(prev.flashcards.currentIdx - 1, 0);
        return {
          ...prev,
          flashcards: { ...prev.flashcards, currentIdx: nextIdx, flipped: false }
        };
      });
    }
  };

  return (
    <>
      {/* Floating Action Speed Dial (Bottom Right) */}
      <div style={{ position: 'absolute', bottom: 18, right: 20, zIndex: 120 }}>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                bottom: 52,
                right: 0,
                width: 250,
                background: 'rgba(10, 14, 24, 0.96)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 14,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Vedika AI Tutor Tools
              </div>
              {ACTIONS.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={() => handleSelectAction(act.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 9,
                      background: activeTab === act.id ? `${act.color}22` : 'transparent',
                      border: activeTab === act.id ? `1px solid ${act.color}55` : '1px solid transparent',
                      color: activeTab === act.id ? act.color : '#E2E8F0',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== act.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== act.id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${act.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} color={act.color} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600 }}>{act.label}</span>
                      <span style={{ fontSize: 10, color: '#64748B' }}>{act.desc}</span>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: isMenuOpen ? 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)' : 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: isMenuOpen ? '#040711' : '#38BDF8',
            borderRadius: 24,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={14} />
          <span>Code Explanation</span>
          <span style={{
            background: isMenuOpen ? 'rgba(0,0,0,0.2)' : 'rgba(56, 189, 248, 0.2)',
            color: isMenuOpen ? '#040711' : '#38BDF8',
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 10,
            fontWeight: 800
          }}>5</span>
          <ChevronUp size={13} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </motion.button>
      </div>

      {/* Slide-out Interactive Card Drawer */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: 64,
              right: 20,
              width: 'min(460px, calc(100vw - 40px))',
              maxHeight: 'min(540px, 80vh)',
              background: '#090D18',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 110,
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header with 5 Tool Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#0E1424',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: 8,
              flexShrink: 0
            }}>
              {/* Tab selector */}
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                {ACTIONS.map((act) => {
                  const isActive = activeTab === act.id;
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.id}
                      onClick={() => handleSelectAction(act.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        borderRadius: 6,
                        background: isActive ? `${act.color}25` : 'transparent',
                        border: isActive ? `1px solid ${act.color}50` : '1px solid transparent',
                        color: isActive ? act.color : '#8892B0',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Icon size={12} color={isActive ? act.color : '#8892B0'} />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setActiveTab(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  color: '#94A3B8',
                  borderRadius: 6,
                  padding: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Close Drawer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {/* QUIZ */}
              {activeTab === 'quiz' && (
                <div>
                  {loadingType === 'quiz' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10, color: '#8892B0' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#38BDF8" />
                      <span style={{ fontSize: 12.5 }}>Generating interactive coding quiz...</span>
                    </div>
                  ) : currentQuiz?.questions?.length > 0 ? (
                    (() => {
                      const q = currentQuiz.questions[currentQuiz.currentIdx] || currentQuiz.questions[0];
                      const answered = currentQuiz.currentAnswer !== null;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                            <span>Question {currentQuiz.currentIdx + 1} of {currentQuiz.questions.length}</span>
                            <button
                              onClick={() => generateLocalFeature('quiz')}
                              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', padding: '2px 8px', borderRadius: 5, fontSize: 10.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <RotateCw size={10} /> Regenerate
                            </button>
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.5 }}>
                            {q?.question}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {q?.options?.map((opt, oi) => {
                              const isSelected = currentQuiz.currentAnswer === oi;
                              const isCorrect = oi === q.correct;
                              let bg = 'rgba(255, 255, 255, 0.04)';
                              let bd = 'rgba(255, 255, 255, 0.08)';
                              let cl = '#E2E8F0';

                              if (answered && isCorrect) {
                                bg = 'rgba(16, 185, 129, 0.15)';
                                bd = 'rgba(16, 185, 129, 0.5)';
                                cl = '#10B981';
                              } else if (answered && isSelected) {
                                bg = 'rgba(239, 68, 68, 0.15)';
                                bd = 'rgba(239, 68, 68, 0.5)';
                                cl = '#EF4444';
                              } else if (isSelected) {
                                bg = 'rgba(56, 189, 248, 0.15)';
                                bd = 'rgba(56, 189, 248, 0.5)';
                                cl = '#38BDF8';
                              }

                              return (
                                <button
                                  key={oi}
                                  onClick={() => handleLocalQuizAnswer(oi)}
                                  disabled={answered}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '9px 12px',
                                    borderRadius: 8,
                                    background: bg,
                                    border: `1px solid ${bd}`,
                                    color: cl,
                                    fontSize: 12.5,
                                    textAlign: 'left',
                                    cursor: answered ? 'default' : 'pointer',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <span style={{ fontWeight: 700, opacity: 0.8 }}>{'ABCD'[oi]})</span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                          {answered && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: currentQuiz.currentAnswer === q.correct ? '#10B981' : '#EF4444' }}>
                                {currentQuiz.currentAnswer === q.correct ? '✓ Correct!' : `✗ Incorrect — correct: ${'ABCD'[q.correct]}`}
                              </span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {currentQuiz.currentIdx > 0 && (
                                  <button onClick={() => handleLocalQuizNav('prev')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#E2E8F0', padding: '5px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                                    Prev
                                  </button>
                                )}
                                {currentQuiz.currentIdx < currentQuiz.questions.length - 1 && (
                                  <button onClick={() => handleLocalQuizNav('next')} style={{ background: '#38BDF8', border: 'none', color: '#040711', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                    Next
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <button onClick={() => generateLocalFeature('quiz')} style={{ background: '#38BDF8', color: '#040711', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Quiz
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FLASHCARDS */}
              {activeTab === 'flashcards' && (
                <div>
                  {loadingType === 'flashcards' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10, color: '#8892B0' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#A855F7" />
                      <span style={{ fontSize: 12.5 }}>Building concept flashcards...</span>
                    </div>
                  ) : currentFlashcards?.cards?.length > 0 ? (
                    (() => {
                      const card = currentFlashcards.cards[currentFlashcards.currentIdx] || currentFlashcards.cards[0];
                      const flipped = currentFlashcards.flipped;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                            <span>Card {currentFlashcards.currentIdx + 1} of {currentFlashcards.cards.length}</span>
                            <span style={{ color: '#A855F7', fontSize: 10.5, fontWeight: 600 }}>Tap card to flip</span>
                          </div>
                          <div
                            onClick={handleLocalFlashcardFlip}
                            style={{
                              background: flipped ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                              border: `1px solid ${flipped ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                              borderRadius: 12,
                              padding: '24px 18px',
                              minHeight: 140,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.25s'
                            }}
                          >
                            <span style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                              {flipped ? 'Answer' : 'Question'}
                            </span>
                            <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: flipped ? 400 : 600, lineHeight: 1.5 }}>
                              {flipped ? card?.back : card?.front}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                            <button
                              disabled={currentFlashcards.currentIdx === 0}
                              onClick={() => handleLocalFlashcardNav('prev')}
                              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#E2E8F0', padding: '6px 14px', borderRadius: 6, fontSize: 11, cursor: currentFlashcards.currentIdx === 0 ? 'not-allowed' : 'pointer' }}
                            >
                              &larr; Prev
                            </button>
                            <button
                              disabled={currentFlashcards.currentIdx === currentFlashcards.cards.length - 1}
                              onClick={() => handleLocalFlashcardNav('next')}
                              style={{ background: '#A855F7', border: 'none', color: '#FFF', padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: currentFlashcards.currentIdx === currentFlashcards.cards.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              Next &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <button onClick={() => generateLocalFeature('flashcards')} style={{ background: '#A855F7', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Flashcards
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* VISUAL SUMMARY */}
              {activeTab === 'infographic' && (
                <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.6 }}>
                  {loadingType === 'infographic' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10, color: '#8892B0' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#F59E0B" />
                      <span style={{ fontSize: 12.5 }}>Analyzing code architecture...</span>
                    </div>
                  ) : features.infographic?.text || features.infographic?.points ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        Key Logic & Data Concept Breakdown
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {features.infographic.text || features.infographic.points?.map(p => `• **${p.title || 'Step'}**: ${p.desc || p}`).join('\n')}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <button onClick={() => generateLocalFeature('infographic')} style={{ background: '#F59E0B', color: '#040711', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Visual Summary
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EXPLAIN SIMPLER */}
              {activeTab === 'simpler' && (
                <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.65 }}>
                  {loadingType === 'simpler' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10, color: '#8892B0' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#10B981" />
                      <span style={{ fontSize: 12.5 }}>Simplifying explanation into plain English...</span>
                    </div>
                  ) : features.simpler?.text ? (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                        Plain English (ELI5) Breakdown
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {features.simpler.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <button onClick={() => generateLocalFeature('simpler')} style={{ background: '#10B981', color: '#040711', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Explain Simpler
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* CODE EXAMPLES */}
              {activeTab === 'examples' && (
                <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.6 }}>
                  {loadingType === 'examples' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 10, color: '#8892B0' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} color="#6366F1" />
                      <span style={{ fontSize: 12.5 }}>Generating alternative implementation examples...</span>
                    </div>
                  ) : features.examples?.text ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Alternative Coding Patterns
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(features.examples.text);
                            setCopiedExample(true);
                            setTimeout(() => setCopiedExample(false), 2000);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#818CF8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {copiedExample ? <Check size={12} /> : <Copy size={12} />}
                          {copiedExample ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {features.examples.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <button onClick={() => generateLocalFeature('examples')} style={{ background: '#6366F1', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Generate Code Examples
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

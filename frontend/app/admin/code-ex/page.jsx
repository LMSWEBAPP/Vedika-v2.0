'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Code2, Sparkles, Plus, Trash2, ExternalLink, CheckCircle2,
  Loader2, BookOpen, ChevronDown, ChevronUp, Terminal
} from 'lucide-react';
import { T } from '@/lib/lms-data';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';

const DEFAULT_FACULTY_PROGRAMS = [
  {
    id: 'find_max',
    title: 'Find Largest Number in Array',
    difficulty: 'Easy',
    description: 'Write a function find_max(arr) that takes an array/list of numbers and returns the largest number in it.',
    isDefault: true,
    stepsCount: 6
  },
  {
    id: 'reverse_str',
    title: 'Reverse a String',
    difficulty: 'Easy',
    description: 'Write a function reverse_string(s) that takes a string s and returns it reversed without using slicing [::-1].',
    isDefault: true,
    stepsCount: 6
  },
  {
    id: 'count_evens',
    title: 'Count Even Numbers',
    difficulty: 'Easy',
    description: 'Write a function count_evens(arr) that returns the count of even numbers present in the array arr.',
    isDefault: true,
    stepsCount: 6
  }
];

export default function AdminCodeExercisesPage() {
  const router = useRouter();
  const isMobile = useMediaQuery(isMobileMQ);

  const [programTitle, setProgramTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPuzzles, setCustomPuzzles] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    async function loadFacultyPuzzles() {
      try {
        const res = await fetch('/api/code-puzzle/faculty');
        const data = await res.json();
        if (Array.isArray(data.puzzles)) {
          setCustomPuzzles(data.puzzles);
          localStorage.setItem('vedika_faculty_puzzles', JSON.stringify(data.puzzles));
          return;
        }
      } catch (_) {}
      try {
        const cached = JSON.parse(localStorage.getItem('vedika_faculty_puzzles') || '[]');
        if (Array.isArray(cached)) setCustomPuzzles(cached);
      } catch (_) {}
    }
    loadFacultyPuzzles();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    const trimmed = programTitle.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/code-puzzle/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, difficulty })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const nextList = Array.isArray(data.puzzles) ? data.puzzles : [...customPuzzles, data.puzzle];
      setCustomPuzzles(nextList);
      localStorage.setItem('vedika_faculty_puzzles', JSON.stringify(nextList));
      setProgramTitle('');
      if (data.puzzle?.id) setExpandedId(data.puzzle.id);
      showToast(`"${trimmed}" assigned! Vedika AI generated ${data.puzzle?.steps?.length || 5} guided steps for students.`);
    } catch (err) {
      alert(err.message || 'Failed to generate exercise steps.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteExercise = async (id, title) => {
    if (!confirm(`Remove "${title}" from Given by Faculty exercises?`)) return;
    try {
      const res = await fetch(`/api/code-puzzle/faculty?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      const nextList = Array.isArray(data.puzzles) ? data.puzzles : customPuzzles.filter(p => p.id !== id);
      setCustomPuzzles(nextList);
      localStorage.setItem('vedika_faculty_puzzles', JSON.stringify(nextList));
      showToast(`Removed "${title}"`);
    } catch (_) {
      const nextList = customPuzzles.filter(p => p.id !== id);
      setCustomPuzzles(nextList);
      localStorage.setItem('vedika_faculty_puzzles', JSON.stringify(nextList));
    }
  };

  return (
    <div style={{
      padding: isMobile ? '70px 16px 32px' : '36px 40px',
      maxWidth: 1060,
      margin: '0 auto',
      fontFamily: 'var(--font-outfit), sans-serif',
      color: T.text
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Code2 size={18} color="#A855F7" />
            </div>
            <h1 style={{ fontSize: isMobile ? 21 : 26, fontWeight: 700, margin: 0 }}>
              Faculty Programming Exercises
            </h1>
          </div>
          <p style={{ color: T.muted, fontSize: 13.5, margin: '6px 0 0 0' }}>
            Enter only the <strong>Program Name</strong> below. <strong>Vedika AI</strong> automatically builds the starter code, sample test cases, and step-by-step guidance for students under <em>&ldquo;Given by Faculty&rdquo;</em>.
          </p>
        </div>

        <button
          onClick={() => router.push('/code-puzzle')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)',
            color: '#38BDF8', padding: '9px 15px', borderRadius: 8,
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer'
          }}
        >
          <ExternalLink size={14} />
          <span>Open Student Code Puzzle IDE</span>
        </button>
      </div>

      {toastMsg && (
        <div style={{
          marginBottom: 20, padding: '11px 16px', borderRadius: 10,
          background: 'rgba(34, 197, 160, 0.12)', border: '1px solid rgba(34, 197, 160, 0.4)',
          color: '#22C5A0', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Faculty Quick-Assign Form */}
      <form
        onSubmit={handleCreateExercise}
        style={{
          background: T.s1,
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: isMobile ? 18 : 22,
          marginBottom: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#A855F7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={14} />
          <span>Assign New Program to Students (Vedika AI Step Generator)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12, alignItems: isMobile ? 'stretch' : 'center' }}>
          <input
            type="text"
            required
            placeholder="e.g., Check Palindrome Number, Fibonacci Series, Binary Search, Sum of Digits..."
            value={programTitle}
            onChange={(e) => setProgramTitle(e.target.value)}
            style={{
              flex: 1,
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 9,
              padding: '11px 14px',
              color: T.text,
              fontSize: 13.5
            }}
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 9,
              padding: '11px 14px',
              color: T.text,
              fontSize: 13,
              fontWeight: 600,
              minWidth: 130
            }}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <button
            type="submit"
            disabled={isGenerating || !programTitle.trim()}
            style={{
              background: 'linear-gradient(135deg, #A855F7, #6366F1)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              padding: '11px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: (isGenerating || !programTitle.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isGenerating || !programTitle.trim()) ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            {isGenerating ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
            <span>{isGenerating ? 'Vedika AI Generating Steps...' : 'Assign & Generate Steps'}</span>
          </button>
        </div>
      </form>

      {/* Active Faculty Programs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active &ldquo;Given by Faculty&rdquo; Dropdown Programs ({DEFAULT_FACULTY_PROGRAMS.length + customPuzzles.length})
        </div>

        {/* Custom Faculty Added Programs */}
        {customPuzzles.map((p, idx) => {
          const isOpen = expandedId === p.id;
          return (
            <div
              key={p.id}
              style={{
                background: T.s1,
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                    background: 'rgba(168, 85, 247, 0.16)', color: '#C084FC'
                  }}>
                    Faculty Assigned #{DEFAULT_FACULTY_PROGRAMS.length + idx + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{p.title}</h3>
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(34, 197, 160, 0.12)', color: '#22C5A0'
                  }}>
                    {p.difficulty || 'Easy'}
                  </span>
                  <span style={{ fontSize: 11.5, color: T.muted }}>
                    • {(p.steps || []).length} AI-Guided Steps
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setExpandedId(isOpen ? null : p.id)}
                    style={{
                      background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
                      color: T.text, padding: '5px 10px', borderRadius: 6, fontSize: 11.5,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <span>{isOpen ? 'Hide Steps' : 'View AI Steps'}</span>
                    {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <button
                    onClick={() => handleDeleteExercise(p.id, p.title)}
                    title="Delete Program"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444', padding: '5px 8px', borderRadius: 6, cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: 12.5, color: T.muted, lineHeight: 1.5 }}>{p.description}</p>

              {isOpen && Array.isArray(p.steps) && (
                <div style={{
                  marginTop: 6, padding: 12, borderRadius: 8, background: T.bg,
                  border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>
                    Vedika AI Generated Step-by-Step Guide
                  </div>
                  {p.steps.map((s, sIdx) => (
                    <div key={s.id || sIdx} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.45 }}>
                      <strong style={{ color: '#A855F7', minWidth: 52 }}>Step {sIdx + 1}:</strong>
                      <div>
                        <strong style={{ color: T.text }}>{s.shortTitle}</strong> — <span style={{ color: T.muted }}>{s.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Built-in Default Faculty Programs */}
        {DEFAULT_FACULTY_PROGRAMS.map((p, idx) => (
          <div
            key={p.id}
            style={{
              background: T.s1,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.12)', color: '#38BDF8'
                }}>
                  Core #{idx + 1}
                </span>
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: T.text }}>{p.title}</h3>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(34, 197, 160, 0.12)', color: '#22C5A0'
                }}>
                  {p.difficulty}
                </span>
                <span style={{ fontSize: 11.5, color: T.muted }}>• {p.stepsCount} Guided Steps</span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: 12.5, color: T.muted }}>{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

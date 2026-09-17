'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import {
  Code2, Loader2, ChevronRight, ChevronDown, Lock, FlipHorizontal,
  Paperclip, Mic, Image, HelpCircle, Send, AlignLeft, Sparkles, ChevronLeft,
  BookOpen, BarChart3, Home, Zap, Brain, Award, FileText, FolderOpen, Briefcase,
  Trash, X, History
} from 'lucide-react';
import {
  T, geminiCall,
  classifyIntent, evaluateMath, getGreetingResponse, getThanksResponse,
  buildChatPrompt, buildFeaturePrompt,
  parseQuizOutput, parseFlashcardsOutput, parseInfographicOutput,
  CODING_TUTOR_SYSTEM, TUTOR_SYSTEM, QUIZ_SYSTEM, FLASHCARD_SYSTEM, INFOGRAPHIC_SYSTEM, SIMPLER_SYSTEM, EXAMPLES_SYSTEM,
  BUG_ANALYSIS_SYSTEM, BUG_TIPS_SYSTEM, BUG_FIX_METHODS_SYSTEM, FIX_EXPLANATION_SYSTEM, SOCRATIC_HELP_SYSTEM,
  MODE_INSTRUCTIONS, LENGTH_INSTRUCTIONS, detectPromptInjection,
  MAX_TOKENS, getTheme, setTheme
} from '@/lib/lms-data';
import VoiceAgentView from '@/components/voice-tutor/VoiceAgentView';
import MermaidDiagram from '@/components/MermaidDiagram';
import { getJwtToken } from '@/lib/jwtCache';
import MobileNav from '@/components/MobileNav';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import dynamic from 'next/dynamic';

const Playground = dynamic(() => import('./Playground'), { ssr: false });

const MODES = ['Beginner', 'Exam', 'Interview', 'Revision'];
const LENGTHS = ['Short', 'Medium', 'Deep'];
const modeColors = { Beginner: T.green, Exam: T.accent, Interview: T.amber, Revision: T.purple };

const NAV = [
  { id: '/',              Icon: Home,          label: 'Dashboard'     },
  { id: '/courses',       Icon: BookOpen,      label: 'Courses'       },
  { id: '/quizzes',       Icon: Award,         label: 'Quizzes'       },
  { id: '/assignments',   Icon: FileText,      label: 'Assignments'   },
  { id: '/resources',     Icon: FolderOpen,    label: 'Resources'     },
  { id: '/general-tutor', Icon: Brain,         label: 'Ask your AI Tutor' },
  { id: '/coding-tutor',  Icon: Code2,         label: 'Code with AI Tutor'  },
  { id: '/jobs',          Icon: Briefcase,     label: 'Jobs'          },
  { id: '/progress',      Icon: BarChart3,     label: 'Progress'      },
];

const SUGGESTIONS = [
  { id: 'quiz', label: 'Coding Quiz', Icon: HelpCircle, color: T.accent },
  { id: 'flashcards', label: 'Flashcards', Icon: FlipHorizontal, color: T.purple },
  { id: 'infographic', label: 'Visual Summary', Icon: Image, color: T.amber },
  { id: 'simpler', label: 'Explain Simpler', Icon: AlignLeft, color: T.green },
  { id: 'examples', label: 'Code Examples', Icon: Sparkles, color: T.accent },
];

const FEATURE_SYSTEMS = {
  quiz: QUIZ_SYSTEM, flashcards: FLASHCARD_SYSTEM, infographic: INFOGRAPHIC_SYSTEM,
  simpler: SIMPLER_SYSTEM, examples: EXAMPLES_SYSTEM,
};

const FEATURE_LABELS = {
  quiz: 'Coding Quiz', flashcards: 'Flashcards', infographic: 'Visual Summary',
  simpler: 'Simplified Explanation', examples: 'Code Examples',
};

const MENTION_OPTIONS = [
  { id: 'analyze', name: 'analyze', label: 'Code Analysis & Complexity', desc: 'Detect bugs and estimate time/space Big O complexity', icon: '🔍', color: '#5B8CF8' },
  { id: 'tips', name: 'tips', label: 'Bug Correction Tips', desc: 'Hints & correction tips without giving direct solutions', icon: '💡', color: '#22C5A0' },
  { id: 'fix', name: 'fix', label: 'Bug Fixing Methods', desc: 'Possible fixing strategies & algorithms to resolve bugs', icon: '🛠️', color: '#9B6EF8' },
  { id: 'explain', name: 'explain', label: 'Why It Works', desc: 'Theoretical explanation of why these fixes work', icon: '📖', color: '#F5A95B' },
  { id: 'help', name: 'help', label: 'Interactive Guide', desc: 'Step-by-step Socratic helper guiding you to fix it', icon: '🤝', color: '#F55B6B' }
];

function parseAnalyticsFromMessage(msg) {
  if (!msg || msg.role !== 'ai' || !msg.content) return null;
  if (msg.analytics) return msg.analytics;
  const analyticsRegex = /<analytics>([\s\S]*?)<\/analytics>/i;
  const match = msg.content.match(analyticsRegex);
  if (match) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      return null;
    }
  }
  return null;
}

function renderAnalyticsCard(analytics) {
  if (!analytics) return null;
  const { timeComplexity, spaceComplexity, bugSeverity, optimizeScope, bugCount, dsaConcepts } = analytics;
  
  const getSeverityColor = (sev) => {
    const s = String(sev).toLowerCase();
    if (s === 'high') return T.red;
    if (s === 'medium') return T.amber;
    if (s === 'low') return T.accent;
    return T.green;
  };
  
  const getOptimizeColor = (opt) => {
    const o = String(opt).toLowerCase();
    if (o === 'high') return T.amber;
    if (o === 'medium') return T.accent;
    if (o === 'low') return T.purple;
    return T.green;
  };

  const sevColor = getSeverityColor(bugSeverity);
  const optColor = getOptimizeColor(optimizeScope);

  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.s2}cc, ${T.s1}aa)`,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      padding: '16px 20px',
      marginBottom: 16,
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${T.border}`, paddingBottom: 10, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Code Analysis Metrics
          </span>
        </div>
        {bugCount !== undefined && (
          <div style={{
            background: bugCount > 0 ? `${T.red}18` : `${T.green}18`,
            border: `1px solid ${bugCount > 0 ? T.red + '40' : T.green + '40'}`,
            borderRadius: 20,
            padding: '2px 10px',
            fontSize: 11,
            fontWeight: 700,
            color: bugCount > 0 ? T.red : T.green
          }}>
            {bugCount > 0 ? `${bugCount} Bugs Detected` : 'No Bugs Detected'}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
        <div style={{ background: T.s3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Time Complexity</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.amber }}>{timeComplexity || 'N/A'}</div>
        </div>
        
        <div style={{ background: T.s3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Space Complexity</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.purple }}>{spaceComplexity || 'N/A'}</div>
        </div>

        <div style={{ background: T.s3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Bug Severity</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: sevColor }}>{bugSeverity || 'None'}</div>
        </div>

        <div style={{ background: T.s3, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Optimize Scope</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: optColor }}>{optimizeScope || 'None'}</div>
        </div>
      </div>

      {dsaConcepts && dsaConcepts.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 600 }}>DSA Concepts:</span>
          {dsaConcepts.map((concept, idx) => (
            <span key={concept + idx} style={{
              background: `${T.accent}12`,
              border: `1px solid ${T.accent}30`,
              color: T.accent,
              borderRadius: 6,
              padding: '1px 8px',
              fontSize: 10.5,
              fontWeight: 600
            }}>
              {concept}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**')
    .replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');
};

export default function CodingTutor() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('Beginner');
  const [length, setLength] = useState('Short');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [generating, setGenerating] = useState({ msgIdx: null, type: null });
  const [streamingText, setStreamingText] = useState('');
  const streamElRef = useRef(null);
  
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [textSessions, setTextSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'voice'
  const [voiceSessionToRestore, setVoiceSessionToRestore] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  const [jwtToken, setJwtToken] = useState(null);
  const [authenticating, setAuthenticating] = useState(true);
  const [sessionDocs, setSessionDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileInputRef = useRef(null);
  const sessionDocsRef = useRef([]);

  useEffect(() => {
    sessionDocsRef.current = sessionDocs;
  }, [sessionDocs]);

  useEffect(() => {
    const fetchJwt = async () => {
      try {
        const token = await getJwtToken();
        setJwtToken(token);
        console.warn("[CodingTutor] Successfully retrieved JWT token.");
      } catch (e) {
        console.error("Failed to load JWT token:", e);
      } finally {
        setAuthenticating(false);
      }
    };
    fetchJwt();
  }, []);
  
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  
  const [codeOverride, setCodeOverride] = useState(null);
  const [explanationOverride, setExplanationOverride] = useState(null);

  const [currentSandboxCode, setCurrentSandboxCode] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [availableDocs, setAvailableDocs] = useState([]);

  const fetchAvailableDocs = useCallback(async () => {
    if (!jwtToken) return;
    const sid = currentSessionId || '';
    try {
      const res = await fetch(`/api/documents/list?sessionId=${sid}`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableDocs(data.documents || []);
      }
    } catch (e) {
      console.error("Failed to fetch available docs:", e);
    }
  }, [jwtToken, currentSessionId]);

  useEffect(() => {
    if (jwtToken) {
      fetchAvailableDocs();
    }
  }, [jwtToken, fetchAvailableDocs]);

  const filteredMentions = useMemo(() => {
    const query = mentionSearch.toLowerCase();
    const matchedCommands = MENTION_OPTIONS.filter(opt =>
      opt.name.startsWith(query)
    ).map(opt => ({ ...opt, isCommand: true }));

    const matchedDocs = availableDocs.filter(d =>
      d.name.toLowerCase().includes(query)
    ).map(d => ({
      id: d.id,
      name: d.name,
      file_key: d.file_key,
      label: d.name,
      desc: `PDF document uploaded on ${new Date(d.creation).toLocaleDateString()}`,
      icon: '📄',
      color: T.purple,
      isDoc: true
    }));

    return [...matchedCommands, ...matchedDocs];
  }, [mentionSearch, availableDocs]);

  const handleAttachDoc = async (doc) => {
    const sid = currentSessionId || Date.now().toString(36);
    if (!currentSessionId) setCurrentSessionId(sid);
    
    setUploading(true);
    setUploadErr('');
    setShowMentionDropdown(false);
    
    try {
      const res = await fetch('/api/documents/attach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          file_name: doc.name,
          file_key: doc.file_key,
          sessionId: sid
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to attach document');
      }
      
      const data = await res.json();
      const newDoc = { id: data.documentId, name: doc.name, status: data.status };
      
      setSessionDocs(prev => {
        const updated = [...prev, newDoc];
        setTimeout(() => saveSession(messages, sid), 100);
        return updated;
      });
      
      if (inputRef.current) {
        const val = topic;
        const selectionStart = inputRef.current.selectionStart;
        const textBeforeCursor = val.slice(0, selectionStart);
        const atIndex = textBeforeCursor.lastIndexOf('@');
        if (atIndex !== -1) {
          const newVal = val.slice(0, atIndex) + val.slice(selectionStart);
          setTopic(newVal);
          setTimeout(() => {
            inputRef.current.focus();
            inputRef.current.selectionStart = atIndex;
            inputRef.current.selectionEnd = atIndex;
          }, 50);
        }
      }
    } catch (e) {
      console.error("Attach error:", e);
      setUploadErr(e.message || 'Error attaching document');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectMention = (option) => {
    if (option.isDoc) {
      handleAttachDoc(option);
      return;
    }
    
    const textBefore = topic.slice(0, topic.lastIndexOf('@'));
    const newText = `${textBefore}@${option.name} `;
    setTopic(newText);
    setShowMentionDropdown(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleVisualizeCode = (codeText, explanationText) => {
    setIsPlaygroundOpen(true);
    setCodeOverride(codeText);
    setExplanationOverride(explanationText || '');
  };

  const renderMarkdown = (content, explanation = '') => {
    const cleaned = cleanMarkdown(content);
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ node, children }) {
            return <div style={{ margin: 0, padding: 0 }}>{children}</div>;
          },
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isPython = match && match[1] === 'python';
            const codeVal = String(children).replace(/\n$/, '');

            if (!inline && isPython) {
              return (
                <div style={{ position: 'relative', margin: 0, padding: 0 }}>
                  {mounted ? (
                    <CodeMirror
                      value={codeVal}
                      theme="dark"
                      className="tutor-code-block"
                      extensions={[python()]}
                      readOnly={true}
                      basicSetup={{
                        lineNumbers: false,
                        foldGutter: false,
                        highlightActiveLine: false,
                        highlightActiveLineGutter: false,
                      }}
                      style={{ fontSize: 13, fontFamily: 'monospace', borderRadius: 8, overflow: 'hidden' }}
                    />
                  ) : (
                    <pre className={className} {...props} style={{ margin: 0, padding: 0 }}>
                      <code>{children}</code>
                    </pre>
                  )}
                  <button
                    onClick={() => handleVisualizeCode(codeVal, explanation)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(245, 169, 91, 0.15)',
                      border: '1px solid rgba(245, 169, 91, 0.4)',
                      borderRadius: 6,
                      color: '#F5A95B',
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      zIndex: 10,
                      transition: 'all 0.15s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 169, 91, 0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 169, 91, 0.15)'; }}
                  >
                    <Zap size={11} fill="currentColor" />
                    Visualize Code
                  </button>
                </div>
              );
            }
            return <code className={className} {...props}>{children}</code>;
          }
        }}
      >
        {cleaned}
      </ReactMarkdown>
    );
  };
  
  const textSessKey = 'coding-tutor-sessions';
  const voiceSessKey = 'voice-coding-tutor-sessions';

  const [userId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('lms-user-id');
    if (!id) {
      id = 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem('lms-user-id', id);
    }
    return id;
  });

  const isMobile = useMediaQuery(isMobileMQ);
  const isTabletOrSmallDesktop = useMediaQuery('(max-width: 1150px)');
  
  const [chatWidthPercent, setChatWidthPercent] = useState(55);
  const isDraggingRef = useRef(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const container = document.getElementById('tutor-workspace-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      let newPercent = (relativeX / rect.width) * 100;
      if (newPercent < 30) newPercent = 30;
      if (newPercent > 70) newPercent = 70;
      setChatWidthPercent(newPercent);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const rPad = isMobile ? 14 : 28;
  const rGap = isMobile ? 8 : 12;
  const msgMaxW = '100%';
  const bubbleMaxW = isMobile ? '100%' : '88%';
  const fCol = isMobile ? '1fr' : '1fr 1fr';

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInputPinned, setIsInputPinned] = useState(false);
  const configDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (configDropdownRef.current && !configDropdownRef.current.contains(e.target)) {
        setIsConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  function getDateLabel(dateStr) {
    if (!dateStr) return 'Older';
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    if (date >= today) return 'Today';
    if (date >= yesterday) return 'Yesterday';
    if (date >= weekStart) return 'This Week';
    return 'Older';
  }

  // Load local sessions
  useEffect(() => {
    try {
      const raw = localStorage.getItem(textSessKey);
      if (raw) setTextSessions(JSON.parse(raw));
    } catch {}
  }, []);

  // Auto-resize the input textarea height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [topic]);

  // Save currentSessionId to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('current-coding-tutor-session-id', currentSessionId);
    } else {
      localStorage.removeItem('current-coding-tutor-session-id');
    }
  }, [currentSessionId]);

  // Synchronize state with Sidebar.jsx
  useEffect(() => {
    const event = new CustomEvent('tutor-state-update', {
      detail: {
        currentSessionId,
        textSessions,
        voiceSessions: [],
        type: 'coding-tutor'
      }
    });
    window.dispatchEvent(event);
  }, [currentSessionId, textSessions]);

  const mergedSessions = useMemo(() => {
    const text = (textSessions || []).map(s => ({ ...s, type: 'text' }));
    text.sort((a, b) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return tb - ta;
    });
    return text;
  }, [textSessions]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, streamingText]);

  const handleSelectSession = useCallback((session) => {
    const msgs = (session.messages || []).map(m => ({
      ...m,
      features: m.features || {},
    }));
    setMessages(msgs);
    setMode(session.mode || 'Beginner');
    setLength(session.length || 'Short');
    setCurrentSessionId(session.id);
    setSessionDocs(session.documents || []);
    setErr(''); setTopic(''); setUploadErr('');
  }, []);

  // Handle click outside to close open feature cards
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.closest('[data-feature-container="true"]') || e.target.closest('[data-feature-button="true"]')) {
        return;
      }
      setMessages(prev => {
        if (!prev.some(m => m.activeFeature)) return prev;
        return prev.map(m => m.activeFeature ? { ...m, activeFeature: null } : m);
      });
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen to events from the sidebar
  useEffect(() => {
    const handleSelect = (e) => {
      handleSelectSession(e.detail);
    };

    const handleNew = () => {
      setMessages([]);
      setCurrentSessionId(null);
      setSessionDocs([]);
      setTopic('');
      setErr('');
      setUploadErr('');
      setIsPlaygroundOpen(false);
      setCodeOverride(null);
      setExplanationOverride(null);
    };

    window.addEventListener('select-coding-tutor-session', handleSelect);
    window.addEventListener('new-coding-tutor-session', handleNew);

    return () => {
      window.removeEventListener('select-coding-tutor-session', handleSelect);
      window.removeEventListener('new-coding-tutor-session', handleNew);
    };
  }, [handleSelectSession]);

  const saveSession = useCallback((msgs, overrideSid) => {
    if (!msgs.some(m => m.role === 'ai')) return;
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    const label = lastUserMsg ? lastUserMsg.content.slice(0, 40) : 'Untitled';
    const sid = overrideSid || currentSessionId || Date.now().toString(36);
    const session = {
      id: sid, label, topic: label, mode, length,
      messages: msgs,
      documents: sessionDocsRef.current || [],
      timestamp: new Date().toISOString(),
    };
    const updated = [session, ...textSessions.filter(s => s.id !== sid)];
    setTextSessions(updated);
    setCurrentSessionId(sid);
    try { localStorage.setItem(textSessKey, JSON.stringify(updated)); } catch {}
  }, [mode, length, textSessions, currentSessionId, textSessKey]);

  const trackStatusStream = useCallback((docId, token) => {
    const sseUrl = `/api/documents/status-stream?documentId=${docId}&token=${encodeURIComponent(token)}`;
    const sse = new EventSource(sseUrl);
    
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const status = data.status;
        
        setSessionDocs(prev => {
          const updated = prev.map(d => d.id === docId ? { ...d, status } : d);
          setTimeout(() => {
            const raw = localStorage.getItem(textSessKey);
            if (raw) {
              const sessions = JSON.parse(raw);
              const sid = currentSessionId || localStorage.getItem('current-coding-tutor-session-id');
              const sessIdx = sessions.findIndex(s => s.id === sid);
              if (sessIdx !== -1) {
                sessions[sessIdx].documents = updated;
                localStorage.setItem(textSessKey, JSON.stringify(sessions));
                setTextSessions(sessions);
              }
            }
          }, 100);
          return updated;
        });
        
        if (status === 'completed' || status === 'failed') {
          sse.close();
        }
      } catch (e) {
        console.error("[SSE Status] Error parsing status event:", e);
      }
    };
    
    sse.onerror = () => {
      sse.close();
    };
  }, [currentSessionId, textSessKey]);

  useEffect(() => {
    if (jwtToken && sessionDocs.length > 0) {
      sessionDocs.forEach(d => {
        if (d.status === 'pending_ingestion' || d.status === 'processing') {
          trackStatusStream(d.id, jwtToken);
        }
      });
    }
  }, [jwtToken, sessionDocs.length]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadErr('Only PDF files are allowed.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('File size cannot exceed 10MB.');
      return;
    }
    
    setUploading(true);
    setUploadErr('');
    
    const sid = currentSessionId || Date.now().toString(36);
    if (!currentSessionId) setCurrentSessionId(sid);
    
    try {
      let token = jwtToken || await getJwtToken().catch(() => null);
      if (token && !jwtToken) setJwtToken(token);
      
      if (!token) {
        throw new Error("Unable to obtain authenticated token. Please refresh.");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sid);
      formData.append('courseId', 'general');
      
      const res = await fetch('/api/documents/upload', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${token}`
         },
         body: formData
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload document.');
      }
      
      const data = await res.json();
      const newDoc = { id: data.documentId, name: file.name, status: data.status };
      
      setSessionDocs(prev => {
        const updated = [...prev, newDoc];
        setTimeout(() => saveSession(messages, sid), 100);
        return updated;
      });
      
      trackStatusStream(data.documentId, token);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadErr(err.message || 'Error uploading document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDoc = async (docId) => {
    const sid = currentSessionId;
    if (!sid) return;
    
    try {
      let token = jwtToken || await getJwtToken().catch(() => null);
      if (token && !jwtToken) setJwtToken(token);
      
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: docId, sessionId: sid })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete document.');
      }
      
      setSessionDocs(prev => {
        const updated = prev.filter(d => d.id !== docId);
        setTimeout(() => saveSession(messages, sid), 100);
        return updated;
      });
    } catch (err) {
      console.error("Delete error:", err);
      setUploadErr(err.message || 'Error deleting document.');
    }
  };

  const handleLibraryDelete = async (docId) => {
    try {
      let token = jwtToken || await getJwtToken().catch(() => null);
      if (token && !jwtToken) setJwtToken(token);
      
      const res = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ documentId: docId, sessionId: currentSessionId || 'general' })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      
      setAvailableDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      console.error("Library delete error:", err);
      setUploadErr(err.message || 'Error deleting from library');
    }
  };

  // Construct a specialized coding feature system prompt that enforces programming constraints
  const getCodingFeatureSystem = (type) => {
    const baseSystem = FEATURE_SYSTEMS[type] || TUTOR_SYSTEM;
    return `${baseSystem}\n\nCRITICAL RESTRICTION: You are Vyomanta's coding and programming tutor. You must ONLY answer questions, generate quizzes, flashcards, or infographics related to computer science, programming languages, algorithms, software engineering, and data structures. If the topic requested is not related to coding or computer science, you must return an empty response (or if returning JSON, return an empty array []).`;
  };

  const handleSend = async () => {
    const raw = topic.trim();
    if (!raw) return;
    setTopic(''); setErr('');

    const sid = currentSessionId || Date.now().toString(36);
    if (!currentSessionId) setCurrentSessionId(sid);

    const userMsg = { id: Date.now().toString(36), role: 'user', content: raw, mode, length, documents: [...sessionDocs] };
    const msgsWithUser = [...messages, userMsg];
    setSessionDocs([]);

    if (detectPromptInjection(raw)) {
      const aiMsg = { 
        id: (Date.now() + 1).toString(36), 
        role: 'ai', 
        content: "⚠️ **Security Notice**: Your input was flagged as a potential prompt injection attempt or policy violation. To protect our free Gemini API tokens, please only enter programming-related queries.", 
        local: true, 
        features: {} 
      };
      const next = [...msgsWithUser, aiMsg];
      setMessages(next); saveSession(next, sid);
      return;
    }

    const intent = classifyIntent(raw);

    if (intent.type === 'greeting') {
      const aiMsg = { id: (Date.now() + 1).toString(36), role: 'ai', content: getGreetingResponse(), local: true, features: {} };
      const next = [...msgsWithUser, aiMsg];
      setMessages(next); saveSession(next, sid);
      return;
    }

    if (intent.type === 'thanks') {
      const aiMsg = { id: (Date.now() + 1).toString(36), role: 'ai', content: getThanksResponse(), local: true, features: {} };
      const next = [...msgsWithUser, aiMsg];
      setMessages(next); saveSession(next, sid);
      return;
    }

    if (intent.type === 'math') {
      const result = evaluateMath(intent.expression);
      const aiMsg = { id: (Date.now() + 1).toString(36), role: 'ai', content: `**${intent.expression}** = ${result}`, local: true, features: {} };
      const next = [...msgsWithUser, aiMsg];
      setMessages(next); saveSession(next, sid);
      return;
    }

    if (intent.type === 'feature') {
      setMessages(msgsWithUser);
      setLoading(true);
      try {
        const tokens = MAX_TOKENS[length.toLowerCase()] || 2000;
        const prompt = buildFeaturePrompt(intent.feature, intent.topic, mode);
        const system = getCodingFeatureSystem(intent.feature);
        const text = await geminiCall(system, prompt, tokens, { sessionId: sid, userId });
        
        if (!text.trim() || text.trim() === '[]') {
          throw new Error('I can only generate learning materials for coding and programming-related topics. Please try a coding-related request.');
        }
        
        const features = {};
        if (intent.feature === 'quiz') {
          const parsed = parseQuizOutput(text);
          if (parsed.length === 0) throw new Error('I can only generate quizzes on programming-related topics.');
          features.quiz = { questions: parsed, currentIdx: 0, currentAnswer: null };
        } else if (intent.feature === 'flashcards') {
          const parsed = parseFlashcardsOutput(text);
          if (parsed.length === 0) throw new Error('I can only generate flashcards on programming-related topics.');
          features.flashcards = { cards: parsed, currentIdx: 0, flipped: false };
        } else if (intent.feature === 'infographic') {
          const parsed = parseInfographicOutput(text);
          const pts = parsed.points || parsed;
          if (pts.length === 0 && !parsed.mermaid) throw new Error('I can only generate infographics on programming-related topics.');
          features.infographic = { points: pts, mermaid: parsed.mermaid || '' };
        } else if (intent.feature === 'simpler') {
          features.simpler = { text };
        } else if (intent.feature === 'examples') {
          features.examples = { text };
        }
        
        const label = FEATURE_LABELS[intent.feature] || 'response';
        const aiMsg = { id: (Date.now() + 1).toString(36), role: 'ai', content: `Here's a ${label} on ${intent.topic}:`, features };
        const next = [...msgsWithUser, aiMsg];
        setMessages(next); saveSession(next, sid);
      } catch (e) {
        setErr(e.message || 'Error generating feature.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setMessages(msgsWithUser);
    setStreamingText(' ');
    setLoading(true);

    try {
      let systemPrompt = CODING_TUTOR_SYSTEM;
      let finalPrompt = "";
      const baseTokens = MAX_TOKENS[length.toLowerCase()] || 800;
      let tokens = baseTokens;

      const mentionMatch = raw.match(/^@(analyze|tips|fix|explain|help)\b([\s\S]*)/i);
      if (mentionMatch) {
        const cmd = mentionMatch[1].toLowerCase();
        const userText = mentionMatch[2].trim();

        if (cmd === 'analyze') {
          systemPrompt = BUG_ANALYSIS_SYSTEM;
          tokens = baseTokens + 300;
        } else if (cmd === 'tips') {
          systemPrompt = BUG_TIPS_SYSTEM;
        } else if (cmd === 'fix') {
          systemPrompt = BUG_FIX_METHODS_SYSTEM;
        } else if (cmd === 'explain') {
          systemPrompt = FIX_EXPLANATION_SYSTEM;
        } else if (cmd === 'help') {
          systemPrompt = SOCRATIC_HELP_SYSTEM;
        }

        let targetCode = "";
        const codeBlockMatch = userText.match(/```python[\s\S]*?```/i) || userText.match(/```[\s\S]*?```/i);
        if (codeBlockMatch) {
          targetCode = codeBlockMatch[0];
        } else if (currentSandboxCode && currentSandboxCode.trim()) {
          targetCode = currentSandboxCode.trim();
        }

        finalPrompt = "";
        if (targetCode) {
          finalPrompt += `Here is the code context to work with:\n\`\`\`python\n${targetCode}\n\`\`\`\n\n`;
        }
        finalPrompt += `User request: ${userText || "Please perform this action on the code."}\n\n`;
        
        const modeInst = MODE_INSTRUCTIONS[mode] || '';
        const lenKey = length.toLowerCase();
        const lenInst = LENGTH_INSTRUCTIONS[lenKey] || '';
        
        let extraLenGuideline = "";
        if (lenKey === 'short') {
          extraLenGuideline = "\n- Keep your output extremely brief and direct. Pinpoint the bug or explain the concept immediately in 1-2 simple sentences or minimal bullet points. Avoid any generic introduction or long-winded text.";
        } else if (lenKey === 'medium') {
          extraLenGuideline = "\n- Keep your output moderate in size, balancing clear explanations with concise code examples.";
        } else if (lenKey === 'deep') {
          extraLenGuideline = "\n- Provide a comprehensive, in-depth analysis covering all nuances, advanced optimization strategies, edge cases, and step-by-step breakdowns.";
        }

        finalPrompt += `Mode: ${mode}\n${modeInst}\n\nLength Level: ${length}\n${lenInst}${extraLenGuideline}`;
      } else {
        finalPrompt = buildChatPrompt(raw, mode, length);
      }

      const targetEndpoint = jwtToken ? '/api/tutor/chat/stream' : '/api/gemini/stream';
      const headers = { 'Content-Type': 'application/json' };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
      
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ system: systemPrompt, user: finalPrompt, maxOutputTokens: tokens, sessionId: sid, userId, courseId: 'general' }),
      });
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
        throw new Error(errMsg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        if (streamElRef.current) {
          let displayStream = fullText.replace(/<analytics>[\s\S]*?<\/analytics>/i, '');
          if (displayStream.includes('<analytics>')) {
            displayStream = displayStream.split('<analytics>')[0];
          }
          const match = displayStream.match(/([\s\S]*?```python[\s\S]*?```)([\s\S]*)/);
          streamElRef.current.textContent = match ? match[1] : displayStream;
        }
      }
      if (!fullText.trim()) {
        throw new Error('Gemini returned an empty response. If you asked an off-topic question, please note I can only help with programming-related topics.');
      }

      const analyticsRegex = /<analytics>([\s\S]*?)<\/analytics>/i;
      const analyticsMatch = fullText.match(analyticsRegex);
      let parsedAnalytics = null;
      if (analyticsMatch) {
        try {
          parsedAnalytics = JSON.parse(analyticsMatch[1].trim());
        } catch (e) {
          console.warn("Failed to parse analytics JSON:", e);
        }
      }

      const aiMsg = { 
        id: (Date.now() + 1).toString(36), 
        role: 'ai', 
        content: fullText, 
        features: {},
        analytics: parsedAnalytics
      };
      const next = [...msgsWithUser, aiMsg];
      setMessages(next);
      setStreamingText('');
      saveSession(next, sid);
    } catch (e) {
      setErr(e.message || 'Error generating response.');
      setStreamingText('');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeature = async (msgIdx, type) => {
    if (generating.msgIdx === msgIdx && generating.type === type) return;
    const msg = messages[msgIdx];
    if (!msg || msg.role !== 'ai') return;

    setGenerating({ msgIdx, type });
    try {
      const system = getCodingFeatureSystem(type);
      const prompt = buildFeaturePrompt(type, msg.content, mode);
      const tokens = type === 'simpler' || type === 'examples' ? 1000 : 1500;
      const text = await geminiCall(system, prompt, tokens, { sessionId: currentSessionId, userId });
      if (!text.trim() || text.trim() === '[]') throw new Error('Could not generate coding-related feature for this topic.');

      setMessages(prev => prev.map((m, i) => {
        if (i !== msgIdx) return m;
        const f = { ...m.features };
        if (type === 'quiz') f.quiz = { questions: parseQuizOutput(text), currentIdx: 0, currentAnswer: null };
        else if (type === 'flashcards') f.flashcards = { cards: parseFlashcardsOutput(text), currentIdx: 0, flipped: false };
        else if (type === 'infographic') {
          const parsed = parseInfographicOutput(text);
          f.infographic = { points: parsed.points || parsed, mermaid: parsed.mermaid || '' };
        }
        else if (type === 'simpler') f.simpler = { text };
        else if (type === 'examples') f.examples = { text };
        return { ...m, features: f, activeFeature: type };
      }));
    } catch (e) {
      setErr(`Failed to generate ${type}: ${e.message}`);
    } finally {
      setGenerating({ msgIdx: null, type: null });
    }
  };

  const handleFeatureClick = (msgIdx, type) => {
    const msg = messages[msgIdx];
    if (!msg) return;
    if (featureExists(msg, type)) {
      setMessages(prev => prev.map((m, i) => {
        if (i !== msgIdx) return m;
        return { ...m, activeFeature: m.activeFeature === type ? null : type };
      }));
    } else {
      handleGenerateFeature(msgIdx, type);
    }
  };

  const handleQuizAnswer = (msgIdx, answerIdx) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx || !m.features.quiz) return m;
      if (m.features.quiz.currentAnswer !== null) return m;
      return { ...m, features: { ...m.features, quiz: { ...m.features.quiz, currentAnswer: answerIdx } } };
    }));
  };

  const handleQuizNav = (msgIdx, dir) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx || !m.features.quiz) return m;
      const q = m.features.quiz;
      const max = q.questions.length - 1;
      const next = dir === 'next' ? Math.min(q.currentIdx + 1, max) : Math.max(q.currentIdx - 1, 0);
      return { ...m, features: { ...m.features, quiz: { ...q, currentIdx: next, currentAnswer: null } } };
    }));
  };

  const handleFlashcardFlip = (msgIdx) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx || !m.features.flashcards) return m;
      return { ...m, features: { ...m.features, flashcards: { ...m.features.flashcards, flipped: !m.features.flashcards.flipped } } };
    }));
  };

  const handleFlashcardNav = (msgIdx, dir) => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== msgIdx || !m.features.flashcards) return m;
      const fc = m.features.flashcards;
      const len = fc.cards.length;
      const next = dir === 'next' ? (fc.currentIdx + 1) % len : (fc.currentIdx - 1 + len) % len;
      return { ...m, features: { ...m.features, flashcards: { ...fc, currentIdx: next, flipped: false } } };
    }));
  };

  const isGeneratingFeature = (mi, type) => generating.msgIdx === mi && generating.type === type;

  const featureExists = (msg, type) => {
    if (type === 'quiz') return !!msg.features?.quiz;
    if (type === 'flashcards') return !!msg.features?.flashcards;
    if (type === 'infographic') return !!msg.features?.infographic;
    if (type === 'simpler') return !!msg.features?.simpler;
    if (type === 'examples') return !!msg.features?.examples;
    return false;
  };

  const tutorNavItems = [
    { href: '/',              Icon: Home,      label: 'Dashboard'     },
    { href: '/courses',       Icon: BookOpen,  label: 'Courses'       },
    { href: '/coding-tutor',  Icon: Code2,     label: 'Code with AI Tutor'  },
    { href: '/progress',      Icon: BarChart3, label: 'Progress'      },
  ];

  const tutorExtras = (close) => {
    const items = [];

    // Mode select
    items.push(
      <div key="mode-select">
        <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>LEARNING MODE</label>
        <select value={mode} onChange={e => setMode(e.target.value)}
          style={{ width: '100%', appearance: 'none', background: T.s2, border: `1px solid ${modeColors[mode] + '50' || T.border}`, borderRadius: 8, padding: '8px 12px', color: modeColors[mode] || T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
          {MODES.map(m => <option key={m} value={m} style={{ background: T.s1, color: T.text }}>{m}</option>)}
        </select>
      </div>
    );

    // Length select
    items.push(
      <div key="len-select">
        <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>RESPONSE DEPTH</label>
        <select value={length} onChange={e => setLength(e.target.value)}
          style={{ width: '100%', appearance: 'none', background: T.s2, border: `1px solid ${length === 'Short' ? T.amber + '50' : length === 'Medium' ? T.accent + '50' : T.purple + '50'}`, borderRadius: 8, padding: '8px 12px', color: length === 'Short' ? T.amber : length === 'Medium' ? T.accent : T.purple, fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
          {LENGTHS.map(l => <option key={l} value={l} style={{ background: T.s1, color: T.text }}>{l}</option>)}
        </select>
      </div>
    );

    // Session history
    if (isMobile && mergedSessions?.length > 0) {
      const groups = {};
      const ordered = ['Today', 'Yesterday', 'This Week', 'Older'];
      for (const s of mergedSessions) {
        const label = getDateLabel(s.timestamp);
        if (!groups[label]) groups[label] = [];
        groups[label].push(s);
      }
      for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      items.push(
        <div key="sessions">
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.06em', marginBottom: 8 }}>SESSION HISTORY</div>
          {ordered.map(group => {
            const sList = groups[group];
            if (!sList) return null;
            return (
              <div key={group} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.dim, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 4px', marginBottom: 4 }}>{group}</div>
                {sList.map(session => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <button key={'coding-' + session.id}
                      onClick={() => {
                        setActiveTab('text');
                        handleSelectSession(session);
                        if (close) close();
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                        background: isActive ? `${T.amber}15` : 'transparent',
                        color: isActive ? T.text : T.muted, cursor: 'pointer', fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                      }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: `${T.amber}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Code2 size={11} color={T.amber} />
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 600 : 400, flex: 1 }}>
                        {session.label || 'Untitled'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    return items;
  };

  const handleKeyDown = (e) => {
    if (showMentionDropdown && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredMentions[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSplitLayout = isPlaygroundOpen && !isMobile && !isTabletOrSmallDesktop;
  const showVerticalSplit = isPlaygroundOpen && (isMobile || isTabletOrSmallDesktop);

  if (authenticating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: T.bg, color: T.text }}>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .custom-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
        <Loader2 className="custom-spin" size={48} color={T.amber} />
        <p style={{ marginTop: 16, fontSize: 14, color: T.muted, fontWeight: 500 }}>Authenticating session...</p>
      </div>
    );
  }

  return (
    <>
      <MobileNav title="Code with AI Tutor" accent={T.amber} items={[]} dropdownItems={NAV} extras={tutorExtras} />
      <div style={{ display: 'flex', height: '100%', maxHeight: '100%', width: '100%', background: T.bg, overflow: 'hidden' }}>
        <div id="tutor-workspace-container" style={{ flex: 1, display: 'flex', flexDirection: showVerticalSplit ? 'column' : 'row', height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          
          {/* Chat Container */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden',
            background: T.bg,
            position: 'relative'
          }}>
            {/* ── COMPACT HEADER ── */}
            <div style={{ padding: isMobile ? '6px 12px' : '8px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: T.s1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => router.push('/vedika-ai')}
                  title="Back to Vedika AI"
                  aria-label="Back to Vedika AI"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    height: 28,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${T.border}`,
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.45)';
                    e.currentTarget.style.color = '#F1F5F9';
                    e.currentTarget.style.transform = 'translateX(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.color = '#94A3B8';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <ChevronLeft size={14} />
                  {!isMobile && <span>Vedika AI</span>}
                </button>

                {/* Chat History Drawer Toggle Button */}
                <button
                  onClick={() => setShowChatHistory(prev => !prev)}
                  title={showChatHistory ? "Close Chat History" : "Open Chat History"}
                  aria-label="Chat History"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    height: 28,
                    borderRadius: 8,
                    background: showChatHistory ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${showChatHistory ? 'rgba(6, 182, 212, 0.45)' : T.border}`,
                    color: showChatHistory ? '#06B6D4' : '#94A3B8',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    if (!showChatHistory) {
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.1)';
                      e.currentTarget.style.color = '#F1F5F9';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!showChatHistory) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#94A3B8';
                    }
                  }}
                >
                  <History size={13} color={showChatHistory ? "#06B6D4" : "#94A3B8"} />
                  {!isMobile && <span>Chat History</span>}
                  {messages && messages.length > 0 && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      background: showChatHistory ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: showChatHistory ? '#06B6D4' : '#CBD5E1',
                      padding: '1px 6px',
                      borderRadius: 10,
                      lineHeight: 1.2
                    }}>
                      {messages.length}
                    </span>
                  )}
                </button>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6, 182, 212, 0.18)', border: '1px solid rgba(6, 182, 212, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={14} color="#06B6D4" />
                </div>
                <div>
                  <h2 style={{ color: T.text, fontSize: isMobile ? 13 : 14.5, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Code with AI Tutor</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: T.muted, fontWeight: 500 }}>Programming AI Agent</span>
                    <Lock size={9} color={T.dim} />
                  </div>
                </div>
              </div>

              {/* Action Button for Sandbox & Text/Voice Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
                  style={{
                    background: isPlaygroundOpen ? `${T.accent}15` : 'transparent',
                    border: `1px solid ${isPlaygroundOpen ? T.accent : T.border}`,
                    color: isPlaygroundOpen ? T.accent : T.text,
                    padding: '4px 10px',
                    height: 28,
                    borderRadius: 7,
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.15s',
                    fontFamily: 'inherit'
                  }}
                  title={isPlaygroundOpen ? "Hide Python Sandbox" : "Open Python Sandbox"}
                >
                  <Zap size={12} fill={isPlaygroundOpen ? T.accent : 'none'} />
                  {isPlaygroundOpen ? 'Close Sandbox' : 'Open Sandbox'}
                </button>

                <div style={{ display: 'flex', background: T.s2, borderRadius: 16, padding: 2, border: `1px solid ${T.border}` }}>
                  <button onClick={() => setActiveTab('text')}
                    style={{
                      border: 'none', background: activeTab === 'text' ? T.amber : 'transparent',
                      color: activeTab === 'text' ? '#fff' : T.muted, borderRadius: 13,
                      padding: '3px 10px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 0.2s'
                    }}>
                    Text
                  </button>
                  <button onClick={() => setActiveTab('voice')}
                    style={{
                      border: 'none', background: activeTab === 'voice' ? T.amber : 'transparent',
                      color: activeTab === 'voice' ? '#fff' : T.muted, borderRadius: 13,
                      padding: '3px 10px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', transition: 'all 0.2s'
                    }}>
                    Voice
                  </button>
                </div>

                {isMobile && streamingText && (
                  <Loader2 size={13} color={T.accent} className="custom-spin" />
                )}
              </div>
            </div>

            {activeTab === 'voice' ? (
              <VoiceAgentView
                inline={true}
                onClose={() => { setActiveTab('text'); setVoiceSessionToRestore(null); }}
                initialSession={voiceSessionToRestore}
                sessionId={currentSessionId}
                userId={userId}
                onSessionComplete={(voiceMsgs) => {
                  if (voiceMsgs?.length > 0) {
                    const mapped = voiceMsgs.map(m => ({
                      role: m.sender === 'student' ? 'user' : 'ai',
                      content: m.text
                    }));
                    setMessages(prev => {
                      const updated = [...prev, ...mapped];
                      setTimeout(() => saveSession(updated, currentSessionId), 100);
                      return updated;
                    });
                  }
                }}
              />
            ) : (
              <>
                {/* ── CHAT & WATERMARK CONTAINER ── */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                  
                  {/* WhatsApp-style subtle learning doodles wallpaper watermark ("very very lite") */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: "url('/vedika-doodles.svg')",
                    backgroundRepeat: 'repeat',
                    backgroundSize: '360px 360px',
                    opacity: 0.055,
                    pointerEvents: 'none',
                    zIndex: 0,
                    userSelect: 'none'
                  }} />

                  {/* Coding Bot image as a watermark in background so text never overlaps */}
                  <div style={{
                    position: 'absolute',
                    right: isMobile ? '-10px' : '36px',
                    bottom: isMobile ? '0px' : '15px',
                    width: isMobile ? '260px' : '430px',
                    maxWidth: '48vw',
                    pointerEvents: 'none',
                    zIndex: 0,
                    opacity: 0.32,
                    filter: 'drop-shadow(0 0 35px rgba(6, 182, 212, 0.28))',
                    userSelect: 'none'
                  }}>
                    <img
                      src="/vedika-code-watermark.png?v=2"
                      alt="Vedika Code AI Watermark"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>

                  {/* Slide-out Chat History Drawer */}
                  {showChatHistory && (
                    <aside
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: isMobile ? '85vw' : '320px',
                        maxWidth: '360px',
                        background: '#0B0F19',
                        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 50,
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '10px 0 35px rgba(0, 0, 0, 0.65)',
                        animation: 'slideInLeftDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                          background: 'rgba(16, 22, 36, 0.92)',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#F8FAFC', fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          <History size={14} color="#06B6D4" />
                          <span>Chat History</span>
                          {messages && messages.length > 0 && (
                            <span style={{ fontSize: 10, background: 'rgba(6, 182, 212, 0.2)', color: '#06B6D4', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                              {messages.length}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setShowChatHistory(false)}
                          style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                          title="Close Chat History"
                          aria-label="Close Chat History"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {messages && messages.length > 0 ? (
                          messages.map((msg, idx) => {
                            const isUser = msg.role === 'user';
                            const text = msg.content || '';
                            const hasInfographic = msg.activeFeature === 'infographic' || msg.features?.infographic;
                            return (
                              <div
                                key={msg.id || idx}
                                onClick={() => {
                                  const el = document.getElementById(`msg-${idx}`);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                  if (isMobile) setShowChatHistory(false);
                                }}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 5,
                                  padding: '9px 12px',
                                  borderRadius: 10,
                                  background: isUser ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                  border: `1px solid ${isUser ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = isUser ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.07)';
                                  e.currentTarget.style.borderColor = isUser ? 'rgba(6, 182, 212, 0.45)' : 'rgba(255, 255, 255, 0.15)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = isUser ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                                  e.currentTarget.style.borderColor = isUser ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)';
                                }}
                                title="Click to jump to message"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: isUser ? '#06B6D4' : '#38BDF8' }}>
                                    <span>{isUser ? '👤 You' : '💻 Code AI'}</span>
                                  </span>
                                  <span style={{ color: '#64748B', fontSize: 10 }}>#{idx + 1}</span>
                                </div>
                                <div style={{ color: '#CBD5E1', fontSize: 11.5, lineHeight: 1.45, maxHeight: 68, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {text || 'Code Query'}
                                </div>
                                {hasInfographic && (
                                  <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    Active Infographic 🎯
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                            <History size={24} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                            <div>No code queries yet. Ask a question or paste code to begin!</div>
                          </div>
                        )}
                      </div>
                    </aside>
                  )}

                  {/* ── CHAT MESSAGES AREA (z-index: 1 sits cleanly over watermark) ── */}
                  <div ref={chatRef} style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: isMobile ? '16px 14px 10px' : '28px 28px 16px' }}>
                    {/* Welcome AI Message */}
                    <div style={{ display: 'flex', gap: rGap, marginBottom: 24, maxWidth: msgMaxW }}>
                      <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.18)', border: '1px solid rgba(6, 182, 212, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Code2 size={isMobile ? 15 : 18} color="#06B6D4" />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#06B6D4', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>VEDIKA CODE AI</div>
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.72)',
                          border: '1px solid rgba(6, 182, 212, 0.24)',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          color: '#E2E8F0',
                          fontSize: 14,
                          lineHeight: 1.65,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)'
                        }}>
                          <div style={{ marginBottom: 6, fontWeight: 500 }}>Hello! I'm Vedika, your interactive coding and software engineering tutor.</div>
                          <div style={{ marginBottom: 6, color: '#94A3B8' }}>Ask me any programming questions, debug algorithms, or open the Python Sandbox to test code live.</div>
                          <div style={{ fontSize: 12.5, color: '#64748B' }}>You can also generate coding quizzes, flashcards, and step-by-step logic breakdowns on demand.</div>
                        </div>
                      </div>
                    </div>

              {/* Chat Thread */}
              {messages.map((msg, mi) => {
                const isAi = msg.role === 'ai';
                let displayContent = msg.content || '';
                const analyticsRegex = /<analytics>[\s\S]*?<\/analytics>/i;
                displayContent = displayContent.replace(analyticsRegex, '').trim();

                const match = isAi && displayContent ? displayContent.match(/([\s\S]*?```python[\s\S]*?```)([\s\S]*)/) : null;
                const chatContent = match ? match[1] : displayContent;
                const explanation = match ? match[2].trim() : '';

                return (
                  <div key={msg.id || mi} id={`msg-${mi}`} style={{ marginBottom: 20 }}>
                    {/* User Bubble */}
                    {msg.role === 'user' && (
                      <div style={{ display: 'flex', gap: rGap, justifyContent: 'flex-end', maxWidth: msgMaxW, marginLeft: 'auto' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>YOU</div>
                          <div style={{ background: T.s3, border: `1px solid ${T.border}`, borderRadius: '14px 14px 4px 14px', padding: '10px 14px', color: T.text, fontSize: 14, lineHeight: 1.65, maxWidth: bubbleMaxW, whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'left' }}>
                            {msg.content}
                            {msg.documents && msg.documents.length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
                                {msg.documents.map(doc => (
                                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.muted }}>
                                    <span>📄</span>
                                    <span style={{ fontWeight: 500, color: T.text }}>{doc.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: T.dim, marginTop: 4 }}>{msg.mode} &middot; {msg.length}</div>
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.s3, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, color: T.muted, fontWeight: 700 }}>S</div>
                      </div>
                    )}

                    {/* AI Bubble */}
                    {msg.role === 'ai' && (
                      <div style={{ display: 'flex', gap: rGap, maxWidth: msgMaxW }}>
                        <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.amber}25`, border: `1px solid ${T.amber}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Code2 size={isMobile ? 14 : 16} color={T.amber} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: T.amber, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>CODE WITH AI TUTOR</div>
                          
                          {/* Visual Analytics Card */}
                          {parseAnalyticsFromMessage(msg) && renderAnalyticsCard(parseAnalyticsFromMessage(msg))}

                          <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                            <div className="md-content">
                              {renderMarkdown(chatContent, explanation)}
                            </div>
                          </div>

                        {/* HTML Tab Suggestions Container */}
                        {msg.activeFeature && (
                          <div data-feature-container="true" style={{ marginTop: 16, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' }}>
                            {/* Tab Content Panel */}
                            <div style={{ padding: 20 }}>
                              {msg.activeFeature === 'quiz' && (
                                msg.features?.quiz?.questions?.length > 0 ? (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                      <span style={{ fontSize: 12, color: T.muted }}>Question {msg.features.quiz.currentIdx + 1} of {msg.features.quiz.questions.length}</span>
                                      <button onClick={() => handleGenerateFeature(mi, 'quiz')}
                                        style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                                        Regenerate
                                      </button>
                                    </div>
                                    <div style={{ color: T.text, fontSize: 14, fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>{msg.features.quiz.questions[msg.features.quiz.currentIdx]?.question}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                      {msg.features.quiz.questions[msg.features.quiz.currentIdx]?.options.map((opt, oi) => {
                                        const answered = msg.features.quiz.currentAnswer !== null;
                                        const selected = msg.features.quiz.currentAnswer === oi;
                                        const correct = oi === msg.features.quiz.questions[msg.features.quiz.currentIdx].correct;
                                        let bg = T.s3, bd = T.border, cl = T.muted;
                                        if (answered && correct) { bg = `${T.green}18`; bd = `${T.green}50`; cl = T.green; }
                                        else if (answered && selected) { bg = `${T.red}18`; bd = `${T.red}50`; cl = T.red; }
                                        else if (selected) { bg = `${T.accent}18`; bd = `${T.accent}50`; cl = T.accent; }
                                        return (
                                          <button key={oi} onClick={() => handleQuizAnswer(mi, oi)} disabled={answered}
                                            style={{ background: bg, border: `1px solid ${bd}`, borderRadius: 9, padding: '10px 14px', color: cl, fontSize: 13, cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                            <span style={{ fontWeight: 700, marginRight: 8 }}>{'ABCD'[oi]})</span>{opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    {msg.features.quiz.currentAnswer !== null && (
                                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: msg.features.quiz.currentAnswer === msg.features.quiz.questions[msg.features.quiz.currentIdx].correct ? T.green : T.red, fontWeight: 600 }}>
                                          {msg.features.quiz.currentAnswer === msg.features.quiz.questions[msg.features.quiz.currentIdx].correct ? '✓ Correct!' : `✗ Incorrect — correct: ${'ABCD'[msg.features.quiz.questions[msg.features.quiz.currentIdx].correct]}`}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          {msg.features.quiz.currentIdx > 0 && (
                                            <button onClick={() => handleQuizNav(mi, 'prev')}
                                              style={{ background: T.s3, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                                              &larr; Prev
                                            </button>
                                          )}
                                          {msg.features.quiz.currentIdx < msg.features.quiz.questions.length - 1 && (
                                            <button onClick={() => handleQuizNav(mi, 'next')}
                                              style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                              Next <ChevronRight size={12} />
                                            </button>
                                          )}
                                          {msg.features.quiz.currentIdx === msg.features.quiz.questions.length - 1 && (
                                            <span style={{ fontSize: 12, color: T.muted }}>Quiz complete!</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted }}>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                    Loading Quiz Questions...
                                  </div>
                                )
                              )}

                              {msg.activeFeature === 'flashcards' && (
                                msg.features?.flashcards?.cards?.length > 0 ? (
                                  <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                      <span style={{ fontSize: 12, color: T.muted }}>Card {msg.features.flashcards.currentIdx + 1} of {msg.features.flashcards.cards.length}</span>
                                      <button onClick={() => handleGenerateFeature(mi, 'flashcards')}
                                        style={{ background: 'none', border: `1px solid ${T.border}`, color: T.muted, borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                                        Regenerate
                                      </button>
                                    </div>
                                    <div onClick={() => handleFlashcardFlip(mi)} style={{ cursor: 'pointer' }}>
                                      <div style={{ background: msg.features.flashcards.flipped ? `${T.amber}15` : T.s3, border: `1px solid ${msg.features.flashcards.flipped ? T.amber + '40' : T.border}`, borderRadius: 14, padding: '32px 24px', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'all 0.3s' }}>
                                        <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                                          {msg.features.flashcards.flipped ? 'Answer' : 'Question — tap to reveal'}
                                        </div>
                                        <div style={{ fontSize: 15, color: T.text, fontWeight: msg.features.flashcards.flipped ? 400 : 600, lineHeight: 1.6 }}>
                                          {msg.features.flashcards.flipped ? msg.features.flashcards.cards[msg.features.flashcards.currentIdx]?.back : msg.features.flashcards.cards[msg.features.flashcards.currentIdx]?.front}
                                        </div>
                                        {!msg.features.flashcards.flipped && <div style={{ marginTop: 12, fontSize: 11, color: T.dim }}>tap to flip</div>}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                                      <button onClick={() => handleFlashcardNav(mi, 'prev')}
                                        style={{ background: T.s3, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}>
                                        &larr; Prev
                                      </button>
                                      <button onClick={() => handleFlashcardNav(mi, 'next')}
                                        style={{ background: T.s3, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', fontSize: 13 }}>
                                        Next &rarr;
                                      </button>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
                                      {msg.features.flashcards.cards.map((_, i) => (
                                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: msg.features.flashcards.currentIdx === i ? T.amber : T.dim, transition: 'all 0.2s' }} />
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted }}>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                    Loading Flashcards...
                                  </div>
                                )
                              )}

                              {msg.activeFeature === 'infographic' && (
                                (msg.features?.infographic?.points?.length > 0 || msg.features?.infographic?.mermaid) ? (
                                  <div style={{ marginTop: 8 }}>
                                    <MermaidDiagram
                                      chart={msg.features.infographic.mermaid}
                                      points={msg.features.infographic.points}
                                      chatHistory={messages}
                                      onRegenerate={() => handleGenerateFeature(mi, 'infographic')}
                                    />
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted }}>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                    Generating Visual Infographic...
                                  </div>
                                )
                              )}

                              {msg.activeFeature === 'simpler' && (
                                msg.features?.simpler?.text ? (
                                  <div style={{ background: `${T.green}10`, border: `1px solid ${T.green}30`, borderRadius: 10, padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: '0.05em' }}>SIMPLIFIED EXPLANATION</span>
                                      <button onClick={() => handleGenerateFeature(mi, 'simpler')}
                                        style={{ background: 'none', border: `1px solid ${T.green}40`, color: T.green, borderRadius: 6, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}>
                                        Regenerate
                                      </button>
                                    </div>
                                    <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                                      <div className="md-content">
                                        {renderMarkdown(msg.features.simpler.text)}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted }}>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                    Generating Simplified Explanation...
                                  </div>
                                )
                              )}

                              {msg.activeFeature === 'examples' && (
                                msg.features?.examples?.text ? (
                                  <div style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.05em' }}>CODE EXAMPLES</span>
                                      <button onClick={() => handleGenerateFeature(mi, 'examples')}
                                        style={{ background: 'none', border: `1px solid ${T.accent}40`, color: T.accent, borderRadius: 6, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}>
                                        Regenerate
                                      </button>
                                    </div>
                                    <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                                      <div className="md-content">
                                        {renderMarkdown(msg.features.examples.text)}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted }}>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                    Generating Code Examples...
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* Suggestion Chips */}
                        {!msg.local && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {SUGGESTIONS.map(s => {
                              const loading = isGeneratingFeature(mi, s.id);
                              const isActive = msg.activeFeature === s.id;
                              return (
                                <button
                                  key={s.id}
                                  data-feature-button="true"
                                  onClick={() => handleFeatureClick(mi, s.id)}
                                  disabled={loading}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '6px 12px',
                                    borderRadius: 16,
                                    background: isActive ? s.color : (loading ? 'rgba(255,255,255,0.05)' : `${s.color}12`),
                                    border: isActive ? `1px solid ${s.color}` : `1px solid ${s.color}40`,
                                    color: isActive ? '#fff' : s.color,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.15s',
                                    boxShadow: isActive ? `0 2px 8px ${s.color}40` : 'none'
                                  }}
                                >
                                  {loading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <s.Icon size={12} />}
                                  {loading ? 'Generating...' : s.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

              {/* Streaming Area */}
              {streamingText && (
                <div style={{ display: 'flex', gap: rGap, marginBottom: 20, maxWidth: msgMaxW }}>
                  <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.amber}25`, border: `1px solid ${T.amber}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Code2 size={isMobile ? 14 : 16} color={T.amber} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: T.amber, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>CODE WITH AI TUTOR</div>
                    <div ref={streamElRef} style={{ color: T.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
                    <Loader2 size={12} color={T.accent} style={{ animation: 'spin 1s linear infinite', marginTop: 6 }} />
                  </div>
                </div>
              )}

              {/* Generating Loader */}
              {loading && !streamingText && (
                <div style={{ display: 'flex', gap: rGap, marginBottom: 20, maxWidth: msgMaxW }}>
                  <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.amber}25`, border: `1px solid ${T.amber}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Code2 size={isMobile ? 14 : 16} color={T.amber} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Loader2 size={16} color={T.accent} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: 13, color: T.muted }}>Thinking...</span>
                  </div>
                </div>
              )}

              {/* Errors Display */}
              {err && (
                <div style={{ maxWidth: 720, marginBottom: 16, color: T.red, fontSize: 12, background: `${T.red}12`, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.red}30` }}>
                  {err}
                </div>
              )}
              
              {/* ── UPLOAD ERROR ── */}
              {uploadErr && (
                <div style={{ maxWidth: 720, marginBottom: 10, color: T.red, fontSize: 11, background: `${T.red}12`, padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.red}20` }}>
                  {uploadErr}
                </div>
              )}

              {/* ── SESSION DOCUMENTS ── */}
              {sessionDocs.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, maxWidth: msgMaxW }}>
                  {sessionDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.s2, border: `1px solid ${T.border}`, padding: '4px 10px', borderRadius: 14, fontSize: 11 }}>
                      <span style={{ color: T.muted }}>📄</span>
                      <span style={{ color: T.text, fontWeight: 500 }}>{doc.name}</span>
                      <span style={{ 
                        fontSize: 9, 
                        fontWeight: 700, 
                        color: doc.status === 'completed' ? T.green : doc.status === 'failed' ? T.red : T.amber,
                        textTransform: 'uppercase'
                      }}>
                        ({doc.status === 'pending_ingestion' ? 'processing' : doc.status})
                      </span>
                      <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', padding: 0, marginLeft: 4 }}>
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

            {/* ── FOOTER: Collapsible Mode/Depth selection + Collapsible Text Input ── */}
            <div
              onMouseEnter={() => setIsInputHovered(true)}
              onMouseLeave={() => setIsInputHovered(false)}
              style={{
                flexShrink: 0,
                borderTop: `1px solid ${T.border}`,
                background: 'rgba(11, 15, 25, 0.96)',
                padding: isMobile ? '8px 12px 10px' : '8px 24px 12px',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                zIndex: 10
              }}
            >
              {/* If chat has started and user is not near/hovering or typing, collapse down to just the Send button */}
              {messages.length > 0 && !isInputHovered && !isInputFocused && !topic.trim() && !loading && !streamingText ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '2px 0' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInputHovered(true);
                      setIsInputFocused(true);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    title="Ask next coding question to Vedika..."
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                      border: '1px solid rgba(6, 182, 212, 0.45)',
                      boxShadow: '0 4px 20px rgba(6, 182, 212, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Send size={18} color="#FFFFFF" />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(6, 182, 212, 0.28)', borderRadius: 14, padding: '7px 14px', position: 'relative', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" style={{ display: 'none' }} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      style={{ background: 'none', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', color: uploading ? '#06B6D4' : '#94A3B8', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title="Upload PDF Context">
                      {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Paperclip size={16} />}
                    </button>

                    {/* Autocomplete Dropdown popup */}
                    {showMentionDropdown && filteredMentions.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 8px)',
                        left: 0,
                        right: 0,
                        background: T.s3,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                        maxHeight: 220,
                        overflowY: 'auto',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '6px 0'
                      }}>
                        <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: '0.05em', padding: '6px 14px 4px', textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
                          Coding Tutor Commands
                        </div>
                        {filteredMentions.map((opt, idx) => {
                          const isSelected = idx === selectedMentionIndex;
                          return (
                            <div
                              key={opt.id}
                              onMouseEnter={() => setSelectedMentionIndex(idx)}
                              style={{
                                padding: '8px 14px',
                                background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                borderLeft: `3px solid ${isSelected ? opt.color : 'transparent'}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                transition: 'all 0.15s'
                              }}
                            >
                              <div onClick={() => handleSelectMention(opt)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                                <span style={{ fontSize: 16 }}>{opt.icon}</span>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontWeight: 700, color: opt.color, fontSize: 12.5 }}>@ {opt.name}</span>
                                    <span style={{ fontWeight: 600, color: T.text, fontSize: 12 }}>{opt.label}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{opt.desc}</div>
                                </div>
                              </div>
                              {opt.isDoc && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to permanently delete "${opt.label}" from your library?`)) {
                                      await handleLibraryDelete(opt.id);
                                    }
                                  }}
                                  style={{
                                    background: 'none', border: 'none', color: T.red, cursor: 'pointer', padding: '4px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7
                                  }}
                                  title="Delete from library"
                                >
                                  <Trash size={12} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <textarea ref={inputRef} value={topic}
                      onChange={e => {
                        const val = e.target.value;
                        setTopic(val);
                        const selectionStart = e.target.selectionStart;
                        const textBeforeCursor = val.slice(0, selectionStart);
                        const atIndex = textBeforeCursor.lastIndexOf('@');
                        
                        if (atIndex !== -1 && !textBeforeCursor.slice(atIndex).includes(' ')) {
                          const query = textBeforeCursor.slice(atIndex + 1);
                          setMentionSearch(query);
                          setShowMentionDropdown(true);
                          setSelectedMentionIndex(0);
                          if (query === '') {
                            fetchAvailableDocs();
                          }
                        } else {
                          setShowMentionDropdown(false);
                        }
                      }}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      placeholder="Type your coding question to Vedika..." rows={1}
                      onKeyDown={handleKeyDown}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#F1F5F9', fontSize: 13.5, lineHeight: 1.5, resize: 'none', fontFamily: 'inherit', padding: 0, minHeight: 22, maxHeight: 110 }} />

                    {/* Collapsible Mode & Depth Pill Button inside input */}
                    <div style={{ position: 'relative', flexShrink: 0 }} ref={configDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsConfigOpen(prev => !prev)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 9px',
                          borderRadius: 9999,
                          background: 'rgba(255, 255, 255, 0.07)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#CBD5E1',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                        title="Change learning mode & explanation depth"
                      >
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: modeColors[mode] || T.green, flexShrink: 0 }} />
                        <span>{mode} &middot; {length}</span>
                        <ChevronDown size={11} color="#94A3B8" style={{ transform: isConfigOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      </button>

                      {/* Popover */}
                      {isConfigOpen && (
                        <div style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 10px)',
                          right: 0,
                          background: 'rgba(15, 19, 34, 0.98)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          borderRadius: 14,
                          padding: '12px 14px',
                          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.65)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          zIndex: 250,
                          minWidth: 230
                        }}>
                          <div>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                              Learning Mode
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                              {MODES.map(m => {
                                const isSel = mode === m;
                                return (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    style={{
                                      padding: '5px 8px',
                                      borderRadius: 8,
                                      fontSize: 11,
                                      fontWeight: isSel ? 700 : 500,
                                      background: isSel ? `${modeColors[m] || '#06B6D4'}25` : 'rgba(255, 255, 255, 0.04)',
                                      border: isSel ? `1px solid ${modeColors[m] || '#06B6D4'}` : '1px solid transparent',
                                      color: isSel ? (modeColors[m] || '#FFFFFF') : T.muted,
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      transition: 'all 0.12s'
                                    }}
                                  >
                                    {m}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                              Explanation Depth
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {LENGTHS.map(l => {
                                const isSel = length === l;
                                return (
                                  <button
                                    key={l}
                                    type="button"
                                    onClick={() => setLength(l)}
                                    style={{
                                      flex: 1,
                                      padding: '5px 8px',
                                      borderRadius: 8,
                                      fontSize: 11,
                                      fontWeight: isSel ? 700 : 500,
                                      background: isSel ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                      border: isSel ? '1px solid #06B6D4' : '1px solid transparent',
                                      color: isSel ? '#FFFFFF' : T.muted,
                                      cursor: 'pointer',
                                      textAlign: 'center',
                                      transition: 'all 0.12s'
                                    }}
                                  >
                                    {l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={handleSend} disabled={loading}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: loading ? T.dim : 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: loading ? 'none' : '0 4px 16px rgba(6, 182, 212, 0.35)',
                      transition: 'all 0.2s ease'
                    }}>
                    {loading ? <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="#fff" />}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

          {/* Floating Sandbox Modal Overlay */}
          {isPlaygroundOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(4, 5, 8, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '10px' : '40px'
            }}>
              {/* Floating Window Container */}
              <div style={{
                width: '100%',
                maxWidth: '1440px',
                height: '100%',
                background: '#06080C',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  background: '#080A0E',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.amber }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                      Interactive Code Tutor Sandbox
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPlaygroundOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#8892B0',
                      borderRadius: '50%',
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F55B6B'; e.currentTarget.style.background = 'rgba(245, 91, 107, 0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#8892B0'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                  >
                    <X size={13} />
                  </button>
                </div>
                
                {/* Playground Canvas Body */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Playground 
                    initialCode={`# Python Coding Sandbox\n# Write python code here and run it!\n\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Seshu")\n`} 
                    codeOverride={codeOverride}
                    explanationOverride={explanationOverride}
                    onTraceComplete={() => {
                      setCodeOverride(null);
                      setExplanationOverride(null);
                    }}
                    onCodeChange={setCurrentSandboxCode}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        .md-content p { margin: 0 0 0.6em 0; text-align: justify; line-height: 1.65; }
        .md-content p:last-child { margin: 0; }
        .md-content ul, .md-content ol { margin: 0.4em 0; padding-left: 1.5em; text-align: justify; line-height: 1.65; }
        .md-content li { margin: 0.2em 0; }
        .md-content strong { color: var(--text); font-weight: 700; }
        .md-content em { color: var(--amber); font-style: italic; }
        .md-content code { background: var(--s3); padding: 1px 5px; border-radius: 4px; font-size: 13px; color: var(--amber); }
        .md-content pre { background: var(--s1); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; border: 1px solid var(--border); }
        .md-content pre code { background: none; padding: 0; color: var(--text); }
        .md-content table { border-collapse: collapse; margin: 0.6em 0; }
        .md-content th, .md-content td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; font-size: 13px; }
        .md-content th { background: var(--s2); color: var(--amber); font-weight: 600; }
        .md-content a { color: var(--accent); text-decoration: underline; }
        .md-content blockquote { border-left: 3px solid var(--accent); margin: 0.6em 0; padding: 4px 12px; color: var(--muted); background: var(--accent-tint); border-radius: 0 8px 8px 0; }
      `}</style>
    </>
  );
}

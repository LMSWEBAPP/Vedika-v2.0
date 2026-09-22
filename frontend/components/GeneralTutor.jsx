'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Brain, Loader2, ChevronRight, ChevronDown, Lock, FlipHorizontal,
  Paperclip, Mic, Image, HelpCircle, Send, AlignLeft, Sparkles, ChevronLeft,
  BookOpen, Code2, BarChart3, Home, Zap, Award, FileText, FolderOpen, Briefcase,
  Trash, History, X, Plus, Pin, Search, Check, PanelLeft, Type, Waves
} from 'lucide-react';
import {
  T, geminiCall,
  classifyIntent, evaluateMath, getGreetingResponse, getThanksResponse,
  buildChatPrompt, buildFeaturePrompt,
  parseQuizOutput, parseFlashcardsOutput, parseInfographicOutput,
  TUTOR_SYSTEM, QUIZ_SYSTEM, FLASHCARD_SYSTEM, INFOGRAPHIC_SYSTEM, SIMPLER_SYSTEM, EXAMPLES_SYSTEM,
  MAX_TOKENS
} from '@/lib/lms-data';
import VoiceAgentView from '@/components/voice-tutor/VoiceAgentView';
import MermaidDiagram from '@/components/MermaidDiagram';
import { getJwtToken } from '@/lib/jwtCache';
import MobileNav from '@/components/MobileNav';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';
import GlacierBackground from '@/components/GlacierBackground';

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
  { id: 'quiz', label: 'Quiz', Icon: HelpCircle, color: T.accent },
  { id: 'flashcards', label: 'Flashcards', Icon: FlipHorizontal, color: T.purple },
  { id: 'infographic', label: 'Visual Summary', Icon: Image, color: T.amber },
  { id: 'simpler', label: 'Explain Simpler', Icon: AlignLeft, color: T.green },
  { id: 'examples', label: 'Examples', Icon: Sparkles, color: T.accent },
];

const cleanMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**')
    .replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**')
    .replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**');
};

export default function GeneralTutor() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState('Beginner');
  const [length, setLength] = useState('Short');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [generating, setGenerating] = useState({ msgIdx: null, type: null });
  const [streamingText, setStreamingText] = useState('');
  const streamElRef = useRef(null);
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'voice'
  const [textSessions, setTextSessions] = useState([]);
  const [voiceSessions, setVoiceSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [voiceSessionToRestore, setVoiceSessionToRestore] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // FeralUI Fluid Background Themes: 'aurora' (Northern lights), 'glacier' (Deep Ocean), 'pastel' (Opal)
  const BG_THEMES = useMemo(() => [
    {
      id: 'aurora',
      name: 'Aurora Flow',
      shortLabel: 'Aurora',
      emoji: '🌌',
      desc: 'Ghost light · Luminous Ray & Night Sky',
      gradient: 'linear-gradient(135deg, #F4F8FF 0%, #BFD4EE 35%, #5C749A 65%, #232E4A 100%)',
      color: '#BFD4EE',
      border: 'rgba(191, 212, 238, 0.5)',
      bg: 'rgba(191, 212, 238, 0.12)'
    },
    {
      id: 'glacier',
      name: 'Glacier Flow',
      shortLabel: 'Glacier',
      emoji: '❄️',
      desc: 'Deep Ocean · Lapis & Hanada',
      gradient: 'linear-gradient(135deg, #65BED0 0%, #277EA3 50%, #183F60 100%)',
      color: '#65BED0',
      border: 'rgba(101, 190, 208, 0.45)',
      bg: 'rgba(101, 190, 208, 0.12)'
    },
    {
      id: 'pastel',
      name: 'Pastel Flow',
      shortLabel: 'Pastel',
      emoji: '🌸',
      desc: 'Opal · Lavender & Sakura Pink',
      gradient: 'linear-gradient(135deg, #9BE0E8 0%, #C4B5F7 50%, #F8B8D9 100%)',
      color: '#D8B4FE',
      border: 'rgba(192, 132, 252, 0.45)',
      bg: 'rgba(192, 132, 252, 0.12)'
    }
  ], []);

  const [bgTheme, setBgTheme] = useState('aurora');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vedika_tutor_bg_theme');
      if (saved === 'aurora' || saved === 'glacier' || saved === 'pastel') {
        setBgTheme(saved);
      }
    }
  }, []);

  const selectBgTheme = (themeId) => {
    setBgTheme(themeId);
    setShowThemeDropdown(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vedika_tutor_bg_theme', themeId);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setShowThemeDropdown(false);
      }
    };
    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showThemeDropdown]);

  const activeThemeConfig = BG_THEMES.find(t => t.id === bgTheme) || BG_THEMES[0];

  // Floating Glassmorphic Left Page Navbar state & shortcut
  const [showLeftNav, setShowLeftNav] = useState(false);
  const leftNavRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('frappe_user');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const userInitials = (currentUser?.name || currentUser?.full_name || 'Aarav')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AM';
  const userName = currentUser?.name?.split(' ')[0] || currentUser?.full_name?.split(' ')[0] || 'Aarav';

  // Global Keyboard Shortcut: Ctrl+B or Cmd+B toggles Left Page Navbar, Escape closes it
  useEffect(() => {
    const handleKeyShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setShowLeftNav(prev => !prev);
      } else if (e.key === 'Escape' && showLeftNav) {
        setShowLeftNav(false);
      }
    };
    window.addEventListener('keydown', handleKeyShortcut);
    return () => window.removeEventListener('keydown', handleKeyShortcut);
  }, [showLeftNav]);

  // Click outside listener for Left Page Navbar
  useEffect(() => {
    const handleLeftNavOutside = (e) => {
      if (
        leftNavRef.current &&
        !leftNavRef.current.contains(e.target) &&
        !e.target.closest('[data-leftnav-toggle]')
      ) {
        setShowLeftNav(false);
      }
    };
    if (showLeftNav) {
      document.addEventListener('mousedown', handleLeftNavOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleLeftNavOutside);
    };
  }, [showLeftNav]);
  
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

  const [showAtMenu, setShowAtMenu] = useState(false);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [menuFilter, setMenuFilter] = useState('');
  const [atMenuIndex, setAtMenuIndex] = useState(0);

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

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    setTopic(val);
    
    const selectionStart = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, selectionStart);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && !textBeforeCursor.slice(atIndex).includes(' ')) {
      const query = textBeforeCursor.slice(atIndex + 1);
      setMenuFilter(query);
      setShowAtMenu(true);
      setAtMenuIndex(0);
      if (query === '') {
        fetchAvailableDocs();
      }
    } else {
      setShowAtMenu(false);
    }
  };

  const filteredDocs = useMemo(() => {
    if (!menuFilter) return availableDocs;
    return availableDocs.filter(d => d.name.toLowerCase().includes(menuFilter.toLowerCase()));
  }, [availableDocs, menuFilter]);

  const handleAttachDoc = async (doc) => {
    const sid = currentSessionId || Date.now().toString(36);
    if (!currentSessionId) setCurrentSessionId(sid);
    
    setUploading(true);
    setUploadErr('');
    setShowAtMenu(false);
    
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

  useEffect(() => {
    const fetchJwt = async () => {
      try {
        const token = await getJwtToken();
        setJwtToken(token);
        console.warn("[GeneralTutor] Successfully retrieved JWT token.");
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
  const textSessKey = 'general-tutor-sessions';
  const voiceSessKey = 'voice-tutor-sessions';

  const [userId] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('frappe_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const u = parsed.email || parsed.name;
        if (u) return u;
      }
    } catch {}
    let id = localStorage.getItem('lms-user-id');
    if (!id) { id = 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); localStorage.setItem('lms-user-id', id); }
    return id;
  });

  const isMobile = useMediaQuery(isMobileMQ);
  const rPad = isMobile ? 14 : 28;
  const rGap = isMobile ? 8 : 12;
  const msgMaxW = '100%';
  const bubbleMaxW = isMobile ? '100%' : 'min(760px, 86%)';
  const fCol = isMobile ? '1fr' : '1fr 1fr';

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInputHovered, setIsInputHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInputPinned, setIsInputPinned] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const configDropdownRef = useRef(null);

  const handleChatScroll = useCallback(() => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 140);
  }, []);

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

  // Load sessions from DB and LocalStorage, and restore active session if present
  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      let localText = [];
      try {
        const raw1 = localStorage.getItem(textSessKey);
        if (raw1) {
          localText = JSON.parse(raw1);
          setTextSessions(localText);
        }
        const raw2 = localStorage.getItem(voiceSessKey);
        if (raw2) setVoiceSessions(JSON.parse(raw2));

        // Prefill query if coming from the dashboard quick-ask box
        const prefill = localStorage.getItem('tutor_prefill_query');
        if (prefill) {
          setTopic(prefill);
          localStorage.removeItem('tutor_prefill_query');
        }
      } catch (e) {
        console.error("Failed to parse local sessions:", e);
      }

      // Immediately restore active session from localStorage on refresh
      const activeSid = localStorage.getItem('current-general-tutor-session-id');
      if (activeSid && localText.length > 0) {
        const active = localText.find(s => s.id === activeSid);
        if (active && active.messages && active.messages.length > 0) {
          const msgs = (active.messages || []).map(m => ({ ...m, features: m.features || {} }));
          setMessages(msgs);
          setMode(active.mode || 'Beginner');
          setLength(active.length || 'Short');
          setCurrentSessionId(active.id);
          setSessionDocs(active.documents || []);
        }
      }

      // Authoritative database sync
      if (userId) {
        setIsLoadingHistory(true);
        try {
          const res = await fetch(`/api/tutor/history?userId=${encodeURIComponent(userId)}&type=general`);
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.sessions) {
              const dbSessions = data.sessions;
              const combined = [...dbSessions];
              for (const ls of localText) {
                if (!combined.some(ds => ds.id === ls.id)) {
                  combined.push(ls);
                }
              }
              combined.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
              setTextSessions(combined);
              try { localStorage.setItem(textSessKey, JSON.stringify(combined)); } catch {}

              const targetSid = activeSid || (combined.length > 0 ? combined[0].id : null);
              if (targetSid) {
                const target = combined.find(s => s.id === targetSid);
                if (target && target.messages && target.messages.length > 0) {
                  const msgs = (target.messages || []).map(m => ({ ...m, features: m.features || {} }));
                  setMessages(msgs);
                  setMode(target.mode || 'Beginner');
                  setLength(target.length || 'Short');
                  setCurrentSessionId(target.id);
                  setSessionDocs(target.documents || []);
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to load sessions from DB:", err);
        } finally {
          if (isMounted) setIsLoadingHistory(false);
        }
      }
    };

    loadSessions();
    return () => { isMounted = false; };
  }, [userId, textSessKey, voiceSessKey]);

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
      localStorage.setItem('current-general-tutor-session-id', currentSessionId);
    } else {
      localStorage.removeItem('current-general-tutor-session-id');
    }
  }, [currentSessionId]);

  // Synchronize state with Sidebar.jsx
  useEffect(() => {
    const event = new CustomEvent('tutor-state-update', {
      detail: {
        currentSessionId,
        textSessions,
        voiceSessions,
        type: 'general-tutor'
      }
    });
    window.dispatchEvent(event);
  }, [currentSessionId, textSessions, voiceSessions]);

  const mergedSessions = useMemo(() => {
    const text = (textSessions || []).map(s => ({ ...s, type: 'text' }));
    const voice = (voiceSessions || []).map(s => ({ ...s, type: 'voice' }));
    const all = [...text, ...voice];
    all.sort((a, b) => {
      const ta = new Date(a.timestamp || a.startedAt || 0).getTime();
      const tb = new Date(b.timestamp || b.startedAt || 0).getTime();
      return tb - ta;
    });
    return all;
  }, [textSessions, voiceSessions]);

  const filteredSessions = useMemo(() => {
    if (!historySearch.trim()) return mergedSessions;
    const q = historySearch.toLowerCase();
    return mergedSessions.filter(s =>
      (s.label && s.label.toLowerCase().includes(q)) ||
      (s.topic && s.topic.toLowerCase().includes(q)) ||
      (s.messages && s.messages.some(m => m.content && m.content.toLowerCase().includes(q)))
    );
  }, [mergedSessions, historySearch]);

  const sessionGroups = useMemo(() => {
    const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Older': [] };
    for (const s of filteredSessions) {
      const label = getDateLabel(s.timestamp || s.startedAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    }
    return groups;
  }, [filteredSessions]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, streamingText]);

  const handleSelectSession = useCallback((session) => {
    if (session.type === 'voice') {
      setVoiceSessionToRestore(session);
      setShowVoiceAgent(true);
      return;
    }
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
    if (isMobile) setShowChatHistory(false);
  }, [isMobile]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setSessionDocs([]);
    setTopic('');
    setErr('');
    setUploadErr('');
    setShowVoiceAgent(false);
    setVoiceSessionToRestore(null);
    try { localStorage.removeItem('current-general-tutor-session-id'); } catch {}
    if (isMobile) setShowChatHistory(false);
  }, [isMobile]);

  // Handle click outside to close open feature cards (excluding Visual Summary which only closes on explicit close)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        e.target.closest('[data-feature-container="true"]') ||
        e.target.closest('[data-feature-button="true"]') ||
        e.target.closest('.mermaid-modal-backdrop') ||
        e.target.closest('.mermaid-modal-window') ||
        e.target.closest('.mermaid-container')
      ) {
        return;
      }
      setMessages(prev => {
        if (!prev.some(m => m.activeFeature && m.activeFeature !== 'infographic')) return prev;
        return prev.map(m => (m.activeFeature && m.activeFeature !== 'infographic') ? { ...m, activeFeature: null } : m);
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
      handleNewChat();
    };

    window.addEventListener('select-general-tutor-session', handleSelect);
    window.addEventListener('new-general-tutor-session', handleNew);

    return () => {
      window.removeEventListener('select-general-tutor-session', handleSelect);
      window.removeEventListener('new-general-tutor-session', handleNew);
    };
  }, [handleSelectSession, handleNewChat]);

  const saveSession = useCallback(async (msgs, overrideSid) => {
    if (!msgs || !msgs.some(m => m.role === 'ai')) return;
    const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
    const label = lastUserMsg ? lastUserMsg.content.slice(0, 45) : 'Untitled';
    const sid = overrideSid || currentSessionId || Date.now().toString(36);
    const session = {
      id: sid,
      label,
      topic: label,
      mode,
      length,
      messages: msgs,
      documents: sessionDocsRef.current || [],
      timestamp: new Date().toISOString(),
      type: 'general'
    };
    const updated = [session, ...textSessions.filter(s => s.id !== sid)];
    setTextSessions(updated);
    setCurrentSessionId(sid);
    try {
      localStorage.setItem(textSessKey, JSON.stringify(updated));
      localStorage.setItem('current-general-tutor-session-id', sid);
    } catch {}

    if (userId) {
      try {
        await fetch('/api/tutor/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, session })
        });
      } catch (err) {
        console.error("Failed to sync session to DB:", err);
      }
    }
  }, [mode, length, textSessions, currentSessionId, textSessKey, userId]);

  const handleDeleteSession = useCallback(async (sid, e) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    const updated = textSessions.filter(s => s.id !== sid);
    setTextSessions(updated);
    try { localStorage.setItem(textSessKey, JSON.stringify(updated)); } catch {}

    if (currentSessionId === sid) {
      setMessages([]);
      setCurrentSessionId(null);
      setSessionDocs([]);
      setTopic('');
      try { localStorage.removeItem('current-general-tutor-session-id'); } catch {}
    }

    if (userId) {
      try {
        await fetch(`/api/tutor/history?id=${encodeURIComponent(sid)}&userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error("Failed to delete session from DB:", err);
      }
    }
  }, [textSessions, currentSessionId, textSessKey, userId]);

  const FEATURE_SYSTEMS = {
    quiz: QUIZ_SYSTEM, flashcards: FLASHCARD_SYSTEM, infographic: INFOGRAPHIC_SYSTEM,
    simpler: SIMPLER_SYSTEM, examples: EXAMPLES_SYSTEM,
  };

  const FEATURE_LABELS = {
    quiz: 'Quiz', flashcards: 'Flashcards', infographic: 'Visual Summary',
    simpler: 'Simplified Explanation', examples: 'Examples',
  };

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
              const sid = currentSessionId || localStorage.getItem('current-general-tutor-session-id');
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

  const handleSend = async () => {
    const raw = topic.trim();
    if (!raw) return;
    setTopic(''); setErr('');

    const sid = currentSessionId || Date.now().toString(36);
    if (!currentSessionId) setCurrentSessionId(sid);

    const intent = classifyIntent(raw);
    const userMsg = { id: Date.now().toString(36), role: 'user', content: raw, mode, length, documents: [...sessionDocs] };
    const msgsWithUser = [...messages, userMsg];
    setSessionDocs([]);

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
        const system = FEATURE_SYSTEMS[intent.feature] || TUTOR_SYSTEM;
        const text = await geminiCall(system, prompt, tokens, { sessionId: sid, userId });
        if (!text.trim()) throw new Error('Gemini returned an empty response. Try rephrasing.');
        const features = {};
        if (intent.feature === 'quiz') features.quiz = { questions: parseQuizOutput(text), currentIdx: 0, currentAnswer: null };
        else if (intent.feature === 'flashcards') features.flashcards = { cards: parseFlashcardsOutput(text), currentIdx: 0, flipped: false };
        else if (intent.feature === 'infographic') {
          const parsed = parseInfographicOutput(text);
          features.infographic = { points: parsed.points || parsed, mermaid: parsed.mermaid || '' };
        }
        else if (intent.feature === 'simpler') features.simpler = { text };
        else if (intent.feature === 'examples') features.examples = { text };
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
      const tokens = MAX_TOKENS[length.toLowerCase()] || 800;
      const prompt = buildChatPrompt(raw, mode, length);
      const targetEndpoint = jwtToken ? '/api/tutor/chat/stream' : '/api/gemini/stream';
      const headers = { 'Content-Type': 'application/json' };
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
      
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ system: TUTOR_SYSTEM, user: prompt, maxOutputTokens: tokens, sessionId: sid, userId, courseId: 'general' }),
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
          streamElRef.current.textContent = fullText;
        }
      }
      if (!fullText.trim()) {
        throw new Error('Gemini returned an empty response — the content may have been blocked by safety filters. Try rephrasing your question.');
      }
      const aiMsg = { id: (Date.now() + 1).toString(36), role: 'ai', content: fullText, features: {} };
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
      const system = FEATURE_SYSTEMS[type] || TUTOR_SYSTEM;
      const prompt = buildFeaturePrompt(type, msg.content, mode);
      const tokens = type === 'simpler' || type === 'examples' ? 1000 : 1500;
      const text = await geminiCall(system, prompt, tokens, { sessionId: currentSessionId, userId });
      if (!text.trim()) throw new Error(`Gemini returned an empty response for ${type}. Try again.`);

      setMessages(prev => {
        const next = prev.map((m, i) => {
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
        });
        setTimeout(() => saveSession(next, currentSessionId), 50);
        return next;
      });
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

    // Session history (mobile only)
    if (isMobile && mergedSessions?.length > 0) {
      const groups = {};
      const ordered = ['Today', 'Yesterday', 'This Week', 'Older'];
      for (const s of mergedSessions) {
        const label = getDateLabel(s.timestamp || s.startedAt);
        if (!groups[label]) groups[label] = [];
        groups[label].push(s);
      }
      for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => {
          return new Date(b.timestamp || b.startedAt).getTime() - new Date(a.timestamp || a.startedAt).getTime();
        });
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
                  const isVoice = session.type === 'voice';
                  return (
                    <button key={session.type + '-' + session.id}
                      onClick={() => {
                        if (isVoice) {
                          setVoiceSessionToRestore(session);
                          setActiveTab('voice');
                        } else {
                          setActiveTab('text');
                          handleSelectSession(session);
                        }
                        if (close) close();
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none',
                        background: isActive ? `${T.accent}15` : 'transparent',
                        color: isActive ? T.text : T.muted, cursor: 'pointer', fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                      }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: isVoice ? `${T.accent}20` : `${T.purple}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isVoice ? <Zap size={11} color={T.accent} /> : <Brain size={11} color={T.purple} />}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 600 : 400, flex: 1 }}>
                        {session.label || 'Untitled'}
                      </span>
                      <span style={{ fontSize: 9, color: T.dim, flexShrink: 0 }}>{isVoice ? 'Voice' : 'Text'}</span>
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
    if (showAtMenu && filteredDocs.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAtMenuIndex(prev => (prev + 1) % filteredDocs.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAtMenuIndex(prev => (prev - 1 + filteredDocs.length) % filteredDocs.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAttachDoc(filteredDocs[atMenuIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAtMenu(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        <Loader2 className="custom-spin" size={48} color={T.purple} />
        <p style={{ marginTop: 16, fontSize: 14, color: T.muted, fontWeight: 500 }}>Authenticating session...</p>
      </div>
    );
  }

  return (
    <>
      <MobileNav title="Ask your AI Tutor" accent={T.purple} items={[]} dropdownItems={NAV} extras={tutorExtras} />
      <div style={{ display: 'flex', height: '100%', maxHeight: '100%', width: '100%', background: T.bg, overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {/* Floating Glassmorphic Left Page Navbar (matching reference image) */}
        {showLeftNav && (
          <aside
            ref={leftNavRef}
            style={{
              position: 'absolute',
              top: 20,
              bottom: 20,
              left: 20,
              width: isMobile ? 'calc(100vw - 40px)' : 240,
              background: 'rgba(10, 18, 38, 0.72)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 24,
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 32px rgba(56, 189, 248, 0.15)',
              zIndex: 70,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '18px 16px',
              animation: 'slideInLeftDrawer 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Top: Close Button + Action List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button
                  onClick={() => setShowLeftNav(false)}
                  title="Close Menu (Esc / Ctrl+B)"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation items list matching the screenshot */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* New Chat */}
                <button
                  onClick={() => { handleNewChat(); setShowLeftNav(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'transparent',
                    border: 'none',
                    color: '#E2E8F0',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E2E8F0'; }}
                >
                  <Plus size={16} color="#C084FC" />
                  <span>New Chat</span>
                </button>

                {/* History */}
                <button
                  onClick={() => { setShowChatHistory(true); setShowLeftNav(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'transparent',
                    border: 'none',
                    color: '#E2E8F0',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E2E8F0'; }}
                >
                  <History size={16} color="#38BDF8" />
                  <span style={{ flex: 1 }}>History</span>
                  {mergedSessions && mergedSessions.length > 0 && (
                    <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                      {mergedSessions.length}
                    </span>
                  )}
                </button>

                {/* Vedika AI (Active highlighted pill matching the screenshot) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: 'rgba(147, 51, 234, 0.35)',
                    border: '1px solid rgba(168, 85, 247, 0.55)',
                    boxShadow: '0 4px 18px rgba(147, 51, 234, 0.25)',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 700
                  }}
                >
                  <Brain size={16} color="#E9D5FF" />
                  <span>Vedika AI</span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', margin: '4px 6px' }} />

                {/* Text */}
                <button
                  onClick={() => { setActiveTab('text'); setShowLeftNav(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 14px',
                    borderRadius: 14,
                    background: activeTab === 'text' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    border: activeTab === 'text' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                    color: activeTab === 'text' ? '#FFFFFF' : '#94A3B8',
                    fontSize: 13,
                    fontWeight: activeTab === 'text' ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                  onMouseLeave={e => { if (activeTab !== 'text') { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <Type size={16} />
                  <span>Text</span>
                </button>

                {/* Voice */}
                <button
                  onClick={() => { setActiveTab('voice'); setShowLeftNav(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 14px',
                    borderRadius: 14,
                    background: activeTab === 'voice' ? 'rgba(168, 85, 247, 0.3)' : 'transparent',
                    border: activeTab === 'voice' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
                    color: activeTab === 'voice' ? '#FFFFFF' : '#94A3B8',
                    fontSize: 13,
                    fontWeight: activeTab === 'voice' ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; }}
                  onMouseLeave={e => { if (activeTab !== 'voice') { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  <Waves size={16} />
                  <span>Voice</span>
                </button>

                {/* Theme Selector (Aurora / Glacier / Pastel) */}
                <button
                  onClick={() => {
                    const ids = BG_THEMES.map(t => t.id);
                    const nextIdx = (ids.indexOf(bgTheme) + 1) % ids.length;
                    selectBgTheme(ids[nextIdx]);
                  }}
                  title={`Switch fluid background theme (Current: ${activeThemeConfig.name})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 14px',
                    borderRadius: 14,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${activeThemeConfig.border}`,
                    color: '#E2E8F0',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#E2E8F0'; }}
                >
                  <span style={{ fontSize: 14 }}>{activeThemeConfig.emoji}</span>
                  <span style={{ flex: 1 }}>{activeThemeConfig.shortLabel}</span>
                  <span style={{ fontSize: 9.5, color: '#94A3B8', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 5px', borderRadius: 4 }}>Cycle</span>
                </button>
              </div>
            </div>

            {/* Bottom: User Profile Capsule matching reference image */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 16,
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onClick={() => { router.push('/profile'); setShowLeftNav(false); }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#38BDF8'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.65)'; }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                color: '#FFFFFF',
                flexShrink: 0
              }}>
                {userInitials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userName}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                  Free Plan
                </div>
              </div>
              <ChevronRight size={14} color="#94A3B8" />
            </div>
          </aside>
        )}

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
              
              {/* Slide-out Chat History Drawer */}
              {showChatHistory && (
                <aside
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: isMobile ? '88vw' : '330px',
                    maxWidth: '380px',
                    background: '#0B0F19',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '12px 0 40px rgba(0, 0, 0, 0.75)',
                    animation: 'slideInLeftDrawer 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Top Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      background: 'rgba(16, 22, 36, 0.95)',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F8FAFC', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.03em' }}>
                      <History size={15} color="#38BDF8" />
                      <span>Chat Sessions</span>
                      {mergedSessions && mergedSessions.length > 0 && (
                        <span style={{ fontSize: 10, background: 'rgba(56, 189, 248, 0.18)', color: '#38BDF8', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>
                          {mergedSessions.length}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={handleNewChat}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'rgba(168, 85, 247, 0.18)',
                          border: '1px solid rgba(168, 85, 247, 0.38)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          color: '#E9D5FF',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        title="Start New Chat"
                      >
                        <Plus size={12} color="#C084FC" />
                        <span>New</span>
                      </button>
                      <button
                        onClick={() => setShowChatHistory(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                        title="Close Drawer"
                        aria-label="Close Drawer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(11, 15, 25, 0.7)' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      padding: '5px 9px'
                    }}>
                      <Search size={13} color="#64748B" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        value={historySearch}
                        onChange={e => setHistorySearch(e.target.value)}
                        placeholder="Search conversations..."
                        style={{
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#F1F5F9',
                          fontSize: 12,
                          width: '100%',
                          fontFamily: 'inherit'
                        }}
                      />
                      {historySearch && (
                        <button
                          onClick={() => setHistorySearch('')}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Session List */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {isLoadingHistory && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', color: '#94A3B8', fontSize: 11.5 }}>
                        <Loader2 size={13} className="custom-spin" color="#38BDF8" />
                        <span>Syncing history...</span>
                      </div>
                    )}

                    {['Today', 'Yesterday', 'This Week', 'Older'].map(groupKey => {
                      const list = sessionGroups[groupKey] || [];
                      if (list.length === 0) return null;
                      return (
                        <div key={groupKey} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase', paddingLeft: 4 }}>
                            {groupKey}
                          </div>
                          {list.map(session => {
                            const isActive = session.id === currentSessionId;
                            const isVoice = session.type === 'voice';
                            const title = session.label || session.topic || (isVoice ? 'Voice Session' : 'Untitled Conversation');
                            const msgCount = session.messages?.length || 0;
                            const timeStr = session.timestamp ? new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                            return (
                              <div
                                key={session.id}
                                onClick={() => handleSelectSession(session)}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  background: isActive ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                  border: `1px solid ${isActive ? 'rgba(168, 85, 247, 0.45)' : 'rgba(255, 255, 255, 0.06)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  position: 'relative'
                                }}
                                onMouseEnter={e => {
                                  if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!isActive) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                  <span style={{
                                    color: isActive ? '#FFFFFF' : '#E2E8F0',
                                    fontSize: 12.5,
                                    fontWeight: isActive ? 700 : 500,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1
                                  }}>
                                    {isVoice ? '🎙️ ' : ''}{title}
                                  </span>
                                  <button
                                    onClick={(e) => handleDeleteSession(session.id, e)}
                                    title="Delete session"
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#64748B',
                                      cursor: 'pointer',
                                      padding: 3,
                                      borderRadius: 4,
                                      display: 'flex',
                                      alignItems: 'center',
                                      opacity: 0.6,
                                      transition: 'opacity 0.15s, color 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#F87171'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = '#64748B'; }}
                                  >
                                    <Trash size={12} />
                                  </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#94A3B8' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {session.mode && (
                                      <span style={{
                                        background: `${modeColors[session.mode] || T.purple}20`,
                                        color: modeColors[session.mode] || '#C084FC',
                                        padding: '1px 5px',
                                        borderRadius: 4,
                                        fontWeight: 600
                                      }}>
                                        {session.mode}
                                      </span>
                                    )}
                                    {msgCount > 0 && <span>{msgCount} msgs</span>}
                                  </div>
                                  {timeStr && <span style={{ fontSize: 10, color: '#64748B' }}>{timeStr}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {filteredSessions.length === 0 && !isLoadingHistory && (
                      <div style={{ padding: '36px 12px', textAlign: 'center', color: '#64748B', fontSize: 12 }}>
                        <History size={26} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                        {historySearch ? (
                          <div>No conversations match "{historySearch}"</div>
                        ) : (
                          <div>
                            <div>No conversations found.</div>
                            <button
                              onClick={handleNewChat}
                              style={{
                                marginTop: 12,
                                background: 'rgba(168, 85, 247, 0.2)',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                borderRadius: 8,
                                color: '#E9D5FF',
                                padding: '6px 12px',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              + Start a New Chat
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {/* FeralUI SVG flow gradient background */}
              <GlacierBackground variant={bgTheme} opacity={1.0} />

              {/* ── CHAT AREA (z-index: 1 sits cleanly over watermark) ── */}
              <div ref={chatRef} onScroll={handleChatScroll} style={{ position: 'relative', zIndex: 1, flex: 1, overflowY: 'auto', padding: isMobile ? '16px 14px 120px' : '28px 28px 135px' }}>

                {/* Centered Date Capsule matching reference image */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: '4px 14px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#94A3B8'
                  }}>
                    Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Welcome AI message */}
                <div style={{ display: 'flex', gap: rGap, marginBottom: 24, maxWidth: msgMaxW }}>
                  <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: '50%', background: `${T.purple}25`, border: `1px solid ${T.purple}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={isMobile ? 15 : 18} color={T.purple} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.purple, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>VEDIKA AI</div>
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.72)',
                      border: '1px solid rgba(168, 85, 247, 0.24)',
                      borderRadius: '16px',
                      padding: '16px 20px',
                      color: '#E2E8F0',
                      fontSize: 14,
                      lineHeight: 1.65,
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)'
                    }}>
                      <div style={{ marginBottom: 6, fontWeight: 500 }}>Hello! I'm Vedika, your AI learning assistant.</div>
                      <div style={{ marginBottom: 6, color: '#94A3B8' }}>Tell me what you'd like to learn and I'll create a personalised explanation.</div>
                      <div style={{ fontSize: 12.5, color: '#64748B' }}>You can also generate quizzes, flashcards, and infographics on demand.</div>
                    </div>
                  </div>
                </div>

          {/* Conversation messages */}
          {messages.map((msg, mi) => (
            <div key={msg.id || mi} id={`msg-${mi}`} style={{ marginBottom: 20 }}>
              {/* ── User message ── */}
              {msg.role === 'user' && (
                <div style={{ display: 'flex', gap: rGap, justifyContent: 'flex-end', maxWidth: msgMaxW, marginLeft: 'auto' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>YOU</div>
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.45)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '12px 18px',
                      color: '#F8FAFC',
                      fontSize: 14,
                      lineHeight: 1.65,
                      maxWidth: bubbleMaxW,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      textAlign: 'left',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.32)'
                    }}>
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
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, color: '#E2E8F0', fontWeight: 700, backdropFilter: 'blur(10px)' }}>S</div>
                </div>
              )}

              {/* ── AI message ── */}
              {msg.role === 'ai' && (
                <div style={{ display: 'flex', gap: rGap, maxWidth: msgMaxW }}>
                  <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.purple}25`, border: `1px solid ${T.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Brain size={isMobile ? 14 : 16} color={T.purple} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: T.purple, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>AI TUTOR</div>
                    
                    {/* Glassmorphic AI Response Message Box (strictly constrained to input width) */}
                    <div style={{
                      maxWidth: bubbleMaxW,
                      background: 'rgba(15, 23, 42, 0.55)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(168, 85, 247, 0.22)',
                      borderRadius: '4px 16px 16px 16px',
                      padding: '14px 18px',
                      color: T.text,
                      fontSize: 14,
                      lineHeight: 1.7,
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
                    }}>
                      <div className="md-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown(msg.content)}</ReactMarkdown>
                      </div>
                    </div>

                    {/* HTML Tab Suggestions Container */}
                    {msg.activeFeature && (
                      <div data-feature-container="true" style={{ marginTop: 16, background: T.s1, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)' }}>
                        {/* Tab Content Panel */}
                        <div style={{ padding: 20 }}>
                          {/* Rendering the active tab's view */}
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
                                      {msg.features.quiz.currentAnswer === msg.features.quiz.questions[msg.features.quiz.currentIdx].correct ? '\u2713 Correct!' : `\u2717 Incorrect \u2014 correct: ${'ABCD'[msg.features.quiz.questions[msg.features.quiz.currentIdx].correct]}`}
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
                                  <div style={{ background: msg.features.flashcards.flipped ? `${T.purple}15` : T.s3, border: `1px solid ${msg.features.flashcards.flipped ? T.purple + '40' : T.border}`, borderRadius: 14, padding: '32px 24px', minHeight: 120, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', transition: 'all 0.3s' }}>
                                    <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.08em', marginBottom: 10, textTransform: 'uppercase' }}>
                                      {msg.features.flashcards.flipped ? 'Answer' : 'Question \u2014 tap to reveal'}
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
                                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: msg.features.flashcards.currentIdx === i ? T.purple : T.dim, transition: 'all 0.2s' }} />
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
                                  onClose={() => {
                                    setMessages(prev => prev.map((m, i) => i === mi ? { ...m, activeFeature: null } : m));
                                  }}
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
                                  <span style={{ fontSize: 11, color: T.green, fontWeight: 700, letterSpacing: '0.05em' }}>SIMPLIFIED</span>
                                  <button onClick={() => handleGenerateFeature(mi, 'simpler')}
                                    style={{ background: 'none', border: `1px solid ${T.green}40`, color: T.green, borderRadius: 6, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}>
                                    Regenerate
                                  </button>
                                </div>
                                <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                                  <div className="md-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown(msg.features.simpler.text)}</ReactMarkdown>
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
                                  <span style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: '0.05em' }}>EXAMPLES</span>
                                  <button onClick={() => handleGenerateFeature(mi, 'examples')}
                                    style={{ background: 'none', border: `1px solid ${T.accent}40`, color: T.accent, borderRadius: 6, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}>
                                    Regenerate
                                  </button>
                                </div>
                                <div style={{ color: T.text, fontSize: 14, lineHeight: 1.7 }}>
                                  <div className="md-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown(msg.features.examples.text)}</ReactMarkdown>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted }}>
                                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
                                Generating Examples...
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Suggestion chips ── */}
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
          ))}

          {/* ── STREAMING ── */}
          {streamingText && (
            <div style={{ display: 'flex', gap: rGap, marginBottom: 20, maxWidth: msgMaxW }}>
              <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.purple}25`, border: `1px solid ${T.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Brain size={isMobile ? 14 : 16} color={T.purple} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: T.purple, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>AI TUTOR</div>
                <div style={{
                  maxWidth: bubbleMaxW,
                  background: 'rgba(15, 23, 42, 0.55)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(168, 85, 247, 0.22)',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '14px 18px',
                  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)'
                }}>
                  <div ref={streamElRef} style={{ color: T.text, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} />
                  <Loader2 size={12} color={T.accent} style={{ animation: 'spin 1s linear infinite', marginTop: 8 }} />
                </div>
              </div>
            </div>
          )}

          {/* ── LOADING ── */}
          {loading && !streamingText && (
            <div style={{ display: 'flex', gap: rGap, marginBottom: 20, maxWidth: msgMaxW }}>
              <div style={{ width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: `${T.purple}25`, border: `1px solid ${T.purple}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Brain size={isMobile ? 14 : 16} color={T.purple} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Loader2 size={16} color={T.accent} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 13, color: T.muted }}>Generating...</span>
              </div>
            </div>
          )}

          {/* ── ERROR ── */}
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

        {/* ── SCROLL FOR MORE BUTTON MATCHING REFERENCE IMAGE ── */}
        {showScrollDown && (
          <button
            type="button"
            onClick={() => {
              if (chatRef.current) {
                chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
              }
            }}
            style={{
              position: 'absolute',
              bottom: isMobile ? 68 : 78,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 20,
              padding: '4px 14px',
              color: '#CBD5E1',
              fontSize: 11.5,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              zIndex: 32,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#A855F7';
              e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#CBD5E1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
              e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
            }}
          >
            <ChevronDown size={14} color="#A855F7" />
            <span>Scroll for more</span>
          </button>
        )}

        {/* ── CREATIVE FLOATING DYNAMIC OMNIBAR CONTAINER WITH TOGGLE BUTTON ── */}
        <div
          style={{
            position: 'absolute',
            bottom: isMobile ? 12 : 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: isMobile ? 'calc(100% - 24px)' : (!isInputHovered && !isInputFocused && !isInputPinned && !topic.trim() && !isConfigOpen && !showAtMenu && !uploading && (!sessionDocs || sessionDocs.length === 0) && messages.length > 0 && !loading && !streamingText ? 'min(640px, calc(100% - 48px))' : 'min(840px, calc(100% - 48px))'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            zIndex: 35,
            pointerEvents: 'none',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Dedicated Glassmorphic Menu Toggle Button Beside Input Bar */}
          <button
            type="button"
            data-leftnav-toggle="true"
            onClick={() => setShowLeftNav(prev => !prev)}
            title={showLeftNav ? "Close Menu (Esc / Ctrl+B)" : "Open Navigation (Ctrl+B)"}
            aria-label="Toggle Navigation Menu"
            style={{
              pointerEvents: 'auto',
              width: isMobile ? 42 : 48,
              height: isMobile ? 42 : 48,
              borderRadius: isMobile ? 21 : 24,
              background: showLeftNav ? 'rgba(168, 85, 247, 0.35)' : 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: showLeftNav ? '1px solid rgba(168, 85, 247, 0.7)' : '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: showLeftNav
                ? '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.3)'
                : '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: showLeftNav ? '#FFFFFF' : '#94A3B8',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = '#A855F7';
              e.currentTarget.style.transform = 'scale(1.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = showLeftNav ? '#FFFFFF' : '#94A3B8';
              e.currentTarget.style.borderColor = showLeftNav ? 'rgba(168, 85, 247, 0.7)' : 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <PanelLeft size={isMobile ? 16 : 18} />
            {!isMobile && (
              <span style={{
                position: 'absolute',
                bottom: -6,
                background: 'rgba(10, 15, 28, 0.95)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 4,
                fontSize: 8,
                fontWeight: 800,
                color: '#C084FC',
                padding: '0 4px',
                lineHeight: '12px',
                letterSpacing: '0.04em'
              }}>
                ^B
              </span>
            )}
          </button>

          {!isInputHovered && !isInputFocused && !isInputPinned && !topic.trim() && !isConfigOpen && !showAtMenu && !uploading && (!sessionDocs || sessionDocs.length === 0) && messages.length > 0 && !loading && !streamingText ? (
            /* Sleek Resting Pill Capsule */
            <div
              onMouseEnter={() => setIsInputHovered(true)}
              onClick={() => {
                setIsInputHovered(true);
                setIsInputFocused(true);
                setTimeout(() => inputRef.current?.focus(), 60);
              }}
              style={{
                pointerEvents: 'auto',
                flex: 1,
                minWidth: 0,
                height: 48,
                borderRadius: 24,
                background: 'rgba(15, 20, 35, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 10px 0 14px',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div
                  data-leftnav-toggle="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLeftNav(prev => !prev);
                  }}
                  title="Toggle Vedika Menu (Ctrl+B)"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.45), rgba(124, 58, 237, 0.45))',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 12px rgba(168, 85, 247, 0.35)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Sparkles size={14} color="#E9D5FF" />
                </div>
                <span style={{
                  color: '#94A3B8',
                  fontSize: isMobile ? 12.5 : 13.5,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 500
                }}>
                  Ask Vedika anything, try an infographic, or type here...
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: modeColors[mode] || '#CBD5E1'
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: modeColors[mode] || T.green }} />
                  <span>{mode}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab('voice');
                  }}
                  title="Switch to Voice AI"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                >
                  <Mic size={14} />
                </button>

                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(168, 85, 247, 0.4)',
                    color: '#FFFFFF'
                  }}
                >
                  <Send size={14} />
                </div>
              </div>
            </div>
          ) : (
            /* Full Creative Omnibar */
            <div
              onMouseEnter={() => setIsInputHovered(true)}
              onMouseLeave={() => setIsInputHovered(false)}
              style={{
                pointerEvents: 'auto',
                flex: 1,
                minWidth: 0,
                background: 'rgba(12, 16, 28, 0.92)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1px solid rgba(168, 85, 247, 0.38)',
                borderRadius: 18,
                padding: isMobile ? '10px 12px' : '12px 16px',
                boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 35px rgba(168, 85, 247, 0.22)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: 'fadeSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Attached PDF documents pills (if any) */}
              {sessionDocs && sessionDocs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 6, borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                  {sessionDocs.map(doc => (
                    <div key={doc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: 8, padding: '3px 8px', fontSize: 11, color: '#E9D5FF' }}>
                      <span>📄</span>
                      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                      {doc.status && doc.status !== 'completed' && <span style={{ fontSize: 9, opacity: 0.8 }}>({doc.status})</span>}
                      <button type="button" onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Input Row: Tool buttons + Textarea + Controls + Send */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, position: 'relative' }}>
                {/* Autocomplete @ menu for PDFs */}
                {showAtMenu && filteredDocs.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: 0,
                    right: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    background: 'rgba(15, 19, 34, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: 12,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    zIndex: 150,
                    padding: '6px 0'
                  }}>
                    <div style={{ padding: '6px 14px', fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 4 }}>
                      CHOOSE PDF TO ATTACH (@)
                    </div>
                    {filteredDocs.map((doc, idx) => (
                      <div
                        key={doc.id}
                        onMouseEnter={() => setAtMenuIndex(idx)}
                        style={{
                          padding: '8px 14px',
                          fontSize: 12.5,
                          color: '#F1F5F9',
                          cursor: 'pointer',
                          background: idx === atMenuIndex ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div onClick={() => handleAttachDoc(doc)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span>📄</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                          <span style={{ fontSize: 10, color: '#64748B' }}>({new Date(doc.creation).toLocaleDateString()})</span>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${doc.name}" from your library?`)) {
                              await handleLibraryDelete(doc.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', opacity: 0.7 }}
                          title="Delete from library"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" style={{ display: 'none' }} />

                {/* Left quick actions: Menu toggle, PDF & Voice */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 3 }}>
                  <button
                    type="button"
                    data-leftnav-toggle="true"
                    onClick={() => setShowLeftNav(prev => !prev)}
                    style={{
                      background: showLeftNav ? 'rgba(168, 85, 247, 0.25)' : 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: showLeftNav ? '#C084FC' : '#94A3B8',
                      padding: 6,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                    title="Toggle Vedika Menu (Ctrl+B)"
                  >
                    <Sparkles size={16} color={showLeftNav ? '#C084FC' : '#A855F7'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      color: uploading ? '#C084FC' : '#94A3B8',
                      padding: 6,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = uploading ? '#C084FC' : '#94A3B8'; e.currentTarget.style.background = 'none'; }}
                    title="Upload PDF Document Context"
                  >
                    {uploading ? <Loader2 size={16} className="custom-spin" /> : <Paperclip size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('voice')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      padding: 6,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'none'; }}
                    title="Switch to Voice AI"
                  >
                    <Mic size={16} />
                  </button>
                </div>

                {/* Center: Textarea (Never squished or overlapping send button) */}
                <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <textarea
                    ref={inputRef}
                    value={topic}
                    onChange={handleTextareaChange}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder="Type a topic, ask for an infographic, or type @ to attach PDF..."
                    rows={1}
                    onKeyDown={handleKeyDown}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#F8FAFC',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      resize: 'none',
                      fontFamily: 'inherit',
                      padding: '4px 0',
                      minHeight: 24,
                      maxHeight: 120
                    }}
                  />
                </div>

                {/* Right tools cluster: Config Popover, Pin button, Send Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 2, flexShrink: 0 }}>
                  {/* Mode & Depth Pill Popover */}
                  <div style={{ position: 'relative' }} ref={configDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsConfigOpen(prev => !prev)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '5px 9px',
                        borderRadius: 9999,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#CBD5E1',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                      title="Learning Mode & Depth"
                    >
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: modeColors[mode] || T.green, flexShrink: 0 }} />
                      <span>{mode} &middot; {length}</span>
                      <ChevronDown size={11} color="#94A3B8" style={{ transform: isConfigOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {isConfigOpen && (
                      <div style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 12px)',
                        right: 0,
                        background: 'rgba(15, 19, 34, 0.98)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
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
                                    background: isSel ? `${modeColors[m] || T.purple}25` : 'rgba(255, 255, 255, 0.04)',
                                    border: isSel ? `1px solid ${modeColors[m] || T.purple}` : '1px solid transparent',
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
                                    background: isSel ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                    border: isSel ? '1px solid #A855F7' : '1px solid transparent',
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

                  {/* Pin Omnibar Button */}
                  <button
                    type="button"
                    onClick={() => setIsInputPinned(prev => !prev)}
                    style={{
                      background: isInputPinned ? 'rgba(168, 85, 247, 0.22)' : 'none',
                      border: isInputPinned ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid transparent',
                      borderRadius: 8,
                      padding: 6,
                      color: isInputPinned ? '#C084FC' : '#64748B',
                      cursor: 'pointer',
                      display: isMobile ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}
                    title={isInputPinned ? "Unpin omnibar" : "Pin omnibar expanded"}
                  >
                    <Pin size={14} style={{ transform: isInputPinned ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {/* Glowing Send Button */}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={loading}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: loading ? T.dim : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: loading ? 'none' : '0 4px 16px rgba(168, 85, 247, 0.45)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {loading ? <Loader2 size={16} color="#fff" className="custom-spin" /> : <Send size={16} color="#fff" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </>
    )}
    </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideInLeftDrawer {
          from { opacity: 0; transform: translateX(-100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .md-content p { margin: 0 0 0.6em 0; text-align: justify; line-height: 1.65; }
        .md-content p:last-child { margin: 0; }
        .md-content ul, .md-content ol { margin: 0.4em 0; padding-left: 1.5em; text-align: justify; line-height: 1.65; }
        .md-content li { margin: 0.2em 0; }
        .md-content strong { color: var(--text); font-weight: 700; }
        .md-content em { color: var(--purple); font-style: italic; }
        .md-content code { background: var(--s3); padding: 1px 5px; border-radius: 4px; font-size: 13px; color: var(--amber); }
        .md-content pre { background: var(--s1); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; border: 1px solid var(--border); }
        .md-content pre code { background: none; padding: 0; color: var(--text); }
        .md-content table { border-collapse: collapse; margin: 0.6em 0; }
        .md-content th, .md-content td { border: 1px solid var(--border); padding: 6px 10px; text-align: left; font-size: 13px; }
        .md-content th { background: var(--s2); color: var(--purple); font-weight: 600; }
        .md-content a { color: var(--accent); text-decoration: underline; }
        .md-content blockquote { border-left: 3px solid var(--accent); margin: 0.6em 0; padding: 4px 12px; color: var(--muted); background: var(--accent-tint); border-radius: 0 8px 8px 0; }
      `}</style>
    </div>
  </>
  );
}

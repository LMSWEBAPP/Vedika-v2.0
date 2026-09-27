'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Home, BookOpen, Brain, Code2, BarChart3, Zap, ArrowLeft, Mic, MicOff, Volume2, VolumeX, Trash2, RotateCcw } from 'lucide-react';
import { T } from '@/lib/lms-data';
import dynamic from 'next/dynamic';
import VoiceChatMessages from './VoiceChatMessages';
import UnifiedSidebar from './UnifiedSidebar';
import { getJwtToken } from '@/lib/jwtCache';


const VoiceRobotVisualizer = dynamic(() => import('./VoiceRobotVisualizer'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, #A855F7 0%, #4C1D95 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
    </div>
  )
});

import MobileNav from '@/components/MobileNav';
import { useMediaQuery, isMobileMQ } from '@/lib/useMediaQuery';

const SESSIONS_KEY = 'voice-tutor-sessions';
const TEXT_SESSIONS_KEY = 'general-tutor-sessions';

function loadSessions() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((s) => ({
      ...s,
      messages: (s.messages || []).map((m) => ({
        ...m,
        sender: m.sender || (m.role === 'ai' ? 'tutor' : 'student'),
        text: m.text || m.content || '',
        timestamp: new Date(m.timestamp || Date.now())
      })),
    }));
  } catch { return []; }
}

function saveSessions(sessions) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch {}
}

function generateLabel(messages, subject) {
  const firstUser = messages.find((m) => m.sender === 'student');
  if (firstUser) return firstUser.text.slice(0, 40) + (firstUser.text.length > 40 ? '...' : '');
  const subjects = { math: 'Mathematics', science: 'Science', languages: 'Languages', all: 'General Tutor' };
  return subjects[subject] || 'Voice Session';
}

const LANGUAGES = [
  { id: 'all', name: 'Auto-Detect', flag: '🌍' },
  { id: 'english', name: 'English', flag: '🇺🇸' },
  { id: 'telugu', name: 'Telugu', flag: '🇮🇳' },
  { id: 'hindi', name: 'Hindi', flag: '🇮🇳' },
];

const SUBJECTS = [
  { id: 'all', name: 'General Tutoring' },
  { id: 'math', name: 'Mathematics' },
  { id: 'science', name: 'Science' },
  { id: 'languages', name: 'Languages / English' },
];

export default function VoiceAgentView({ onClose, initialSession, inline = false, sessionId = null, userId = null, onSessionComplete = null }) {
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [statusMessage, setStatusMessage] = useState('Tap the microphone to start your voice tutoring session');
  const [conversation, setConversation] = useState([]);
  const [currentSentiment, setCurrentSentiment] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sessions, setSessions] = useState(loadSessions);
  const [textSessions, setTextSessions] = useState([]);

  const [localUserId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('lms-user-id');
    if (!id) {
      id = 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem('lms-user-id', id);
    }
    return id;
  });

  const activeUserId = userId || localUserId;

  // Load text sessions for unified history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TEXT_SESSIONS_KEY);
      if (raw) setTextSessions(JSON.parse(raw));
    } catch {}
  }, []);

  // Merge both session types
  const mergedSessions = useMemo(() => {
    const voice = (sessions || []).map(s => ({ ...s, type: 'voice' }));
    const text = (textSessions || []).map(s => ({ ...s, type: 'text' }));
    const all = [...text, ...voice];
    all.sort((a, b) => {
      const ta = new Date(a.timestamp || a.startedAt || 0).getTime();
      const tb = new Date(b.timestamp || b.startedAt || 0).getTime();
      return tb - ta;
    });
    return all;
  }, [sessions, textSessions]);

  // Audio and WebSocket Refs (Full-Duplex Gemini Multimodal Live Streaming)
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const micStreamRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const audioSourcesQueueRef = useRef([]);
  const isMutedRef = useRef(false);
  const wsHadErrorRef = useRef(false);
  const voiceSessionIdRef = useRef(null);
  const conversationRef = useRef([]);


  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  // Restore initial session passed from parent (e.g. clicking a voice session from history)
  useEffect(() => {
    if (initialSession && initialSession.messages) {
      setConversation(initialSession.messages.map((m) => ({
        ...m,
        sender: m.sender || (m.role === 'ai' ? 'tutor' : 'student'),
        text: m.text || m.content || '',
        timestamp: new Date(m.timestamp || Date.now())
      })));
      setCurrentSentiment(null);
      if (initialSession.subject) setSelectedSubject(initialSession.subject);
      if (initialSession.language) setSelectedLanguage(initialSession.language);
      setStatusMessage(`Viewing: ${initialSession.label || 'Saved Session'}`);
    }
  }, [initialSession]);

  // Immediate audio playback cancellation (for interruption / barge-in)
  const stopAllAudioPlaybacks = useCallback(() => {
    audioSourcesQueueRef.current.forEach((source) => {
      try { source.stop(); } catch {}
    });
    audioSourcesQueueRef.current = [];
    nextPlayTimeRef.current = 0;
  }, []);

  // Save current conversation session to local storage and remote memory
  const saveCurrentSession = useCallback(() => {
    const currentMsgs = conversationRef.current;
    if (currentMsgs.length === 0) return;
    const sid = sessionId || voiceSessionIdRef.current || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    if (!voiceSessionIdRef.current) voiceSessionIdRef.current = sid;

    const normalizedMessages = currentMsgs.map(m => ({
      id: m.id || Date.now().toString(36),
      role: m.sender === 'tutor' || m.role === 'ai' ? 'ai' : 'user',
      content: m.text || m.content || '',
      timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
      isVoice: true
    }));

    const session = {
      id: sid,
      label: generateLabel(currentMsgs, selectedSubject),
      subject: selectedSubject,
      language: selectedLanguage,
      timestamp: new Date().toISOString(),
      messages: normalizedMessages,
      type: 'voice'
    };

    setSessions(prev => {
      const updated = [session, ...prev.filter((s) => s.id !== session.id)];
      saveSessions(updated);
      return updated;
    });

    // Notify parent callback so chat state updates
    if (onSessionComplete) {
      onSessionComplete(currentMsgs);
    }

    // Dispatch update event to sidebar / listeners
    try {
      const event = new CustomEvent('tutor-state-update', {
        detail: {
          currentSessionId: sid,
          voiceSessions: [session],
          type: 'voice'
        }
      });
      window.dispatchEvent(event);
    } catch (e) {}

    // Persist to Redis memory asynchronously
    fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save',
        sessionId: sid,
        userId: activeUserId,
        messages: normalizedMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
      }),
    }).catch(() => {});
  }, [selectedSubject, selectedLanguage, activeUserId, sessionId, onSessionComplete]);

  // Clean termination of all Web Audio, media streams, and WebSocket handles
  const terminateSession = useCallback((preserveMessage) => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    stopAllAudioPlaybacks();
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setConnectionStatus('disconnected');
    if (!preserveMessage) {
      setStatusMessage('Lesson completed. Press the mic button to start again!');
    }
  }, [stopAllAudioPlaybacks]);

  useEffect(() => {
    return () => terminateSession(true);
  }, [terminateSession]);

  const handleSelectSession = useCallback((session) => {
    if (connectionStatus !== 'disconnected') return;
    setConversation(session.messages || []);
    setCurrentSentiment(null);
    if (session.subject) setSelectedSubject(session.subject);
    if (session.language) setSelectedLanguage(session.language);
    setStatusMessage(`Viewing: ${session.label || 'Saved Session'}`);
  }, [connectionStatus]);

  // Gapless 24kHz PCM Web Audio playback scheduled via nextPlayTimeRef
  const playPcmAudioChunk = useCallback((base64Data) => {
    if (isMutedRef.current || !audioCtxRef.current) return;
    try {
      const audioCtx = audioCtxRef.current;
      const binaryString = atob(base64Data);
      const buffer = new ArrayBuffer(binaryString.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binaryString.length; i++) {
        view[i] = binaryString.charCodeAt(i);
      }
      const int16Samples = new Int16Array(buffer);
      const audioBuffer = audioCtx.createBuffer(1, int16Samples.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < int16Samples.length; i++) {
        channelData[i] = int16Samples[i] / 32768.0;
      }

      const bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioCtx.destination);
      audioSourcesQueueRef.current.push(bufferSource);

      bufferSource.onended = () => {
        audioSourcesQueueRef.current = audioSourcesQueueRef.current.filter((src) => src !== bufferSource);
        if (audioSourcesQueueRef.current.length === 0) {
          setConnectionStatus('connected');
          setStatusMessage('Tutor is listening... Feel free to talk.');
        }
      };

      const now = audioCtx.currentTime;
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.05;
      }
      setConnectionStatus('tutor-speaking');
      setStatusMessage('Tutor is speaking...');
      bufferSource.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
    } catch (err) {
      console.error('[VoiceAgent] Audio playback error:', err);
    }
  }, []);

  // Handle Mute Microphone Toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      isMutedRef.current = next;
      setStatusMessage(next ? 'Microphone muted. Tap mic to resume.' : 'Tutor is listening... Feel free to talk.');
      return next;
    });
  }, []);

  // Main Toggle: Connect or Disconnect Live Gemini Session
  const handleMicToggle = useCallback(async () => {
    if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      try {
        setConnectionStatus('connecting');
        setStatusMessage('Requesting microphone access and initializing Voice Tutor...');
        stopAllAudioPlaybacks();

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        micStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          try { await audioCtx.resume(); } catch (e) {}
        }

        const voiceSid = sessionId || voiceSessionIdRef.current || ('voice-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
        voiceSessionIdRef.current = voiceSid;

        // WebSocket Target Strategy (Port 5001 primary, Port 5050 and host fallback)
        const primaryWsHost = process.env.NEXT_PUBLIC_VOICE_WS_URL || process.env.NEXT_PUBLIC_WS_URL || (
          typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'ws://localhost:5001'
            : `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost'}`
        );

        const fallbackHosts = [
          primaryWsHost,
          'ws://localhost:5050',
          `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost'}`
        ].filter((host, idx, arr) => arr.indexOf(host) === idx);

        let currentHostIdx = 0;

        const connectToSocket = (targetHost) => {
          const jwtToken = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('jwt')) : null;
          let wsUrl = `${targetHost}/api/ws?language=${encodeURIComponent(selectedLanguage)}&subject=${encodeURIComponent(selectedSubject)}&sessionId=${encodeURIComponent(voiceSid)}&userId=${encodeURIComponent(activeUserId)}`;
          if (jwtToken) {
            wsUrl += `&token=${encodeURIComponent(jwtToken)}`;
          }

          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          const connTimeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
              try { ws.close(); } catch {}
              currentHostIdx++;
              if (currentHostIdx < fallbackHosts.length) {
                console.warn(`[VoiceAgent] WebSocket timeout on ${targetHost}. Trying fallback: ${fallbackHosts[currentHostIdx]}...`);
                connectToSocket(fallbackHosts[currentHostIdx]);
              } else {
                setConnectionStatus('error');
                setStatusMessage('Connection timed out. Verify the voice server is running (npm run dev:voice).');
              }
            }
          }, 4500);

          ws.onopen = () => {
            clearTimeout(connTimeout);
            wsHadErrorRef.current = false;
            setConnectionStatus('connected');
            setStatusMessage('Tutor connected! Start speaking.');

            // Establish 16kHz PCM audio streaming pipeline from microphone
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            // Route through zero-gain node to prevent local feedback/echo
            const silentGain = audioCtx.createGain();
            silentGain.gain.value = 0;
            source.connect(processor);
            processor.connect(silentGain);
            silentGain.connect(audioCtx.destination);

            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN || isMutedRef.current) return;
              const float32Data = e.inputBuffer.getChannelData(0);
              const pcmBuffer = new ArrayBuffer(float32Data.length * 2);
              const dataView = new DataView(pcmBuffer);
              let offset = 0;
              for (let i = 0; i < float32Data.length; i++, offset += 2) {
                let s = Math.max(-1, Math.min(1, float32Data[i]));
                dataView.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
              }
              let binary = '';
              const bytes = new Uint8Array(pcmBuffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
            };
          };

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'status') {
                setStatusMessage(message.message);
              } else if (message.type === 'error') {
                setStatusMessage(message.message);
                setConnectionStatus('error');
              } else if (message.type === 'audio' && message.data) {
                playPcmAudioChunk(message.data);
              } else if (message.type === 'interrupted') {
                stopAllAudioPlaybacks();
                setConnectionStatus('connected');
                setStatusMessage('Tutor was interrupted. Listening now...');
              } else if (message.type === 'agent-transcription') {
                setConversation((prev) => {
                  if (prev.length > 0 && prev[prev.length - 1].sender === 'tutor') {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      text: (updated[updated.length - 1].text ? updated[updated.length - 1].text + ' ' : '') + message.text
                    };
                    return updated;
                  }
                  return [
                    ...prev,
                    {
                      id: Math.random().toString(36).slice(2),
                      sender: 'tutor',
                      text: message.text,
                      timestamp: new Date()
                    }
                  ];
                });
              } else if (message.type === 'user-transcription') {
                setConversation((prev) => [
                  ...prev,
                  {
                    id: Math.random().toString(36).slice(2),
                    sender: 'student',
                    text: message.text,
                    timestamp: new Date(),
                    sentiment: message.sentiment
                  }
                ]);
                if (message.sentiment) {
                  setCurrentSentiment(message.sentiment);
                }
              }
            } catch (e) {
              console.error('[VoiceAgent] WS parse error:', e);
            }
          };

          ws.onerror = () => {
            clearTimeout(connTimeout);
            currentHostIdx++;
            if (currentHostIdx < fallbackHosts.length) {
              console.warn(`[VoiceAgent] WebSocket error on ${targetHost}. Trying fallback: ${fallbackHosts[currentHostIdx]}...`);
              try { ws.close(); } catch {}
              connectToSocket(fallbackHosts[currentHostIdx]);
              return;
            }
            setStatusMessage('Connection failed. Verify the voice server is running (npm run dev:voice).');
            setConnectionStatus('error');
          };

          ws.onclose = () => {
            clearTimeout(connTimeout);
            if (!wsHadErrorRef.current && connectionStatus === 'connected') {
              terminateSession(false);
            }
          };
        };

        connectToSocket(fallbackHosts[0]);
      } catch (err) {
        setConnectionStatus('error');
        setStatusMessage(`Microphone access denied: ${err.message || err}. Please permit microphone permissions.`);
      }
    } else {
      saveCurrentSession();
      terminateSession();
    }
  }, [connectionStatus, selectedLanguage, selectedSubject, stopAllAudioPlaybacks, playPcmAudioChunk, terminateSession, saveCurrentSession, sessionId, activeUserId]);

  const clearTranscriptLog = useCallback(() => {
    setConversation([]);
    setCurrentSentiment(null);
  }, []);

  const isActive = connectionStatus !== 'disconnected' && connectionStatus !== 'error';
  const isMobile = useMediaQuery(isMobileMQ);
  const voiceZ = isMobile ? 1010 : 1000;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
      const handleStorageChange = () => {
        setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
      };
      window.addEventListener('storage', handleStorageChange);
      const interval = setInterval(handleStorageChange, 300);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, []);

  return (
    <div style={inline ? {
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'transparent',
      color: T.text,
      fontFamily: 'var(--font-outfit), "Segoe UI", sans-serif',
      overflow: 'hidden'
    } : {
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: isMobile ? 0 : (sidebarCollapsed ? 70 : 220),
      right: 0,
      zIndex: voiceZ,
      display: 'flex',
      background: T.bg,
      color: T.text,
      fontFamily: 'var(--font-outfit), "Segoe UI", sans-serif',
      transition: 'left 0.2s ease'
    }}>
      {/* Standalone Sidebar for Full Page Modal */}
      {!inline && (
        <UnifiedSidebar
          sessions={mergedSessions}
          currentSessionId={voiceSessionIdRef.current || sessionId}
          onSelectSession={handleSelectSession}
          onBack={onClose}
        />
      )}

      {/* Main Voice Agent Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Navigation & Status Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '0 12px' : '0 24px',
          height: isMobile ? 50 : 56,
          background: inline ? 'rgba(15, 23, 42, 0.65)' : T.s1,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#CBD5E1',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 10,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; e.currentTarget.style.borderColor = '#A855F7'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#CBD5E1'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
                title="Return to Text Chat"
              >
                <ArrowLeft size={15} />
                <span>Back to Chat</span>
              </button>
            )}

            <h2 style={{ fontSize: isMobile ? 13.5 : 15, fontWeight: 700, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{SUBJECTS.find((s) => s.id === selectedSubject)?.name || 'General Tutor'}</span>
            </h2>

            <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

            {/* Live Connection Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 20
            }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: connectionStatus === 'tutor-speaking'
                  ? '#A855F7'
                  : isActive
                  ? T.green
                  : connectionStatus === 'connecting'
                  ? T.amber
                  : T.dim,
                boxShadow: isActive ? `0 0 8px ${connectionStatus === 'tutor-speaking' ? '#A855F7' : T.green}` : 'none',
                animation: connectionStatus === 'connecting' || connectionStatus === 'tutor-speaking' ? 'pulse 1.5s infinite' : 'none'
              }} />
              <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.04em' }}>
                {connectionStatus === 'disconnected' && 'Voice Offline'}
                {connectionStatus === 'connecting' && 'Connecting...'}
                {connectionStatus === 'connected' && 'Voice Mode Active'}
                {connectionStatus === 'tutor-speaking' && 'Tutor Speaking'}
                {connectionStatus === 'error' && 'Error'}
              </span>
            </div>
          </div>

          {/* Subject & Language Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isActive}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#CBD5E1',
                fontSize: 11.5,
                fontWeight: 600,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '5px 8px',
                cursor: isActive ? 'not-allowed' : 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                opacity: isActive ? 0.6 : 1
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} style={{ background: '#0F172A', color: '#F8FAFC' }}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#CBD5E1',
                fontSize: 11.5,
                fontWeight: 600,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '5px 8px',
                cursor: isActive ? 'not-allowed' : 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                opacity: isActive ? 0.6 : 1
              }}
            >
              {SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id} style={{ background: '#0F172A', color: '#F8FAFC' }}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Live Conversation Transcript */}
        {conversation.length > 0 && (
          <VoiceChatMessages conversation={conversation} />
        )}

        {/* Center Robot Visualizer & Real-Time Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: isMobile ? '12px 14px 18px' : '18px 24px 24px',
          flex: conversation.length === 0 ? 1 : undefined,
          justifyContent: conversation.length === 0 ? 'center' : undefined,
          borderTop: conversation.length > 0 ? `1px solid ${T.border}` : 'none',
          background: inline ? 'rgba(10, 15, 28, 0.45)' : T.s1,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}>
          {/* Status Message Text */}
          <p style={{
            fontSize: isMobile ? 12 : 13,
            color: isActive ? '#E2E8F0' : '#94A3B8',
            textAlign: 'center',
            margin: '0 0 12px',
            fontWeight: 500,
            maxWidth: 500,
            lineHeight: 1.5
          }}>
            {statusMessage}
          </p>

          {/* Real-Time Sentiment Badge */}
          {currentSentiment && isActive && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 20,
              marginBottom: 12,
              border: `1px solid ${T.border}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <span style={{ fontSize: 15 }}>{currentSentiment.emoji}</span>
              <span style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600 }}>{currentSentiment.label}</span>
            </div>
          )}

          {/* Interactive 3D Robot Visualizer Container */}
          <div style={{
            position: 'relative',
            width: isMobile ? 80 : 100,
            height: isMobile ? 80 : 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14
          }}>
            {/* Ambient Pulsing Aura */}
            <div style={{
              position: 'absolute',
              inset: -8,
              borderRadius: '50%',
              background: connectionStatus === 'tutor-speaking'
                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(124, 58, 237, 0.1) 70%, transparent 100%)'
                : isActive
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.05) 70%, transparent 100%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
              border: isActive ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              animation: isActive ? 'pulse 2s infinite ease-in-out' : 'none',
              pointerEvents: 'none'
            }} />
            <VoiceRobotVisualizer />
          </div>

          {/* Control Dock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mute Microphone Button */}
            {isActive && (
              <button
                type="button"
                onClick={handleToggleMute}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: isMuted ? '1px solid rgba(239, 68, 68, 0.5)' : `1px solid ${T.border}`,
                  background: isMuted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                  color: isMuted ? '#EF4444' : '#CBD5E1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Main Action Button (Start / End Session) */}
            <button
              type="button"
              onClick={handleMicToggle}
              style={{
                padding: '9px 24px',
                borderRadius: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.04em',
                transition: 'all 0.2s',
                background: isActive
                  ? 'rgba(239, 68, 68, 0.18)'
                  : 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                color: isActive ? '#F87171' : '#FFFFFF',
                border: isActive ? '1px solid rgba(239, 68, 68, 0.45)' : 'none',
                boxShadow: isActive ? 'none' : '0 4px 18px rgba(168, 85, 247, 0.35)'
              }}
            >
              {isActive ? (
                <>
                  <MicOff size={14} />
                  <span>END SESSION</span>
                </>
              ) : (
                <>
                  <Mic size={14} />
                  <span>START SESSION</span>
                </>
              )}
            </button>

            {/* Clear Transcript Button */}
            {conversation.length > 0 && (
              <button
                type="button"
                onClick={clearTranscriptLog}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  border: `1px solid ${T.border}`,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
                title="Clear Live Transcript"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Ambient Subtle Background Light */}
        {!inline && (
          <React.Fragment>
            <div style={{
              position: 'fixed',
              top: 0,
              left: isMobile ? 0 : 260,
              width: isMobile ? 200 : 400,
              height: isMobile ? 200 : 400,
              background: 'rgba(168, 85, 247, 0.08)',
              borderRadius: '50%',
              filter: 'blur(100px)',
              pointerEvents: 'none',
              transform: 'translate(-50%, -50%)',
              zIndex: -1
            }} />
            <div style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: isMobile ? 150 : 300,
              height: isMobile ? 150 : 300,
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: '50%',
              filter: 'blur(80px)',
              pointerEvents: 'none',
              transform: 'translate(30%, 30%)',
              zIndex: -1
            }} />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

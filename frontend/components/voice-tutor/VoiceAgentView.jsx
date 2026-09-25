'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Home, BookOpen, Brain, Code2, BarChart3, Zap, ArrowLeft, Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { T } from '@/lib/lms-data';
import dynamic from 'next/dynamic';
import VoiceChatMessages from './VoiceChatMessages';

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

const SESSIONS_KEY = 'general-tutor-sessions';

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
        timestamp: new Date(m.timestamp)
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

function analyzeSentiment(text) {
  if (!text) return { label: 'Calm / Conversational', score: 0.0, emoji: '😐' };
  const lowercase = text.toLowerCase();
  const confusedWords = [
    "don't understand", "do not understand", "dont understand", "not sure", "confused",
    "cannot get", "cant get", "difficult", "hard", "stuck", "doubt", "explain again",
    "unclear", "lost", "struggling", "help", "confusing", "అర్థం కాలేదు", "కష్టంగా ఉంది",
    "సందేహం", "తెలియదు", "మళ్ళీ చెప్పండి", "కన్ఫ్యూజ్", "ardham raledu", "artham kaledu",
    "kashtanga undi", "malli cheppandi", "samajh nahi", "mushkil", "kathin", "shanka"
  ];
  const positiveWords = [
    "understand", "got it", "easy", "awesome", "perfect", "clear", "great", "wow",
    "fantastic", "amazing", "makes sense", "thank you", "thanks", "excellent", "brilliant",
    "అర్థమైంది", "సులభంగా ఉంది", "చాలా బాగుంది", "థాంక్స్", "సూపర్", "అవును", "ardhamaindi",
    "sulabhanga undi", "chala bagundi", "samajh gaya", "samajh gya", "aasan", "saral", "badhiya"
  ];
  const curiousWords = [
    "what is", "how do", "tell me about", "why is", "curious", "interested", "learn", "know",
    "question", "ఏమిటి", "ఎలా", "ఎందుకు", "తెలుసుకోవాలి", "emiti", "ela", "enduku", "telusukovali"
  ];
  let confusedCount = 0, positiveCount = 0, curiousCount = 0;
  for (const w of confusedWords) { if (lowercase.includes(w)) confusedCount++; }
  for (const w of positiveWords) { if (lowercase.includes(w)) positiveCount++; }
  for (const w of curiousWords) { if (lowercase.includes(w)) curiousCount++; }
  if (confusedCount > positiveCount && confusedCount >= curiousCount)
    return { label: 'Struggling / Confused', score: -0.6, emoji: '😟' };
  if (positiveCount > confusedCount && positiveCount >= curiousCount)
    return { label: 'Happy / Confident', score: 0.8, emoji: '😊' };
  if (curiousCount > confusedCount && curiousCount > positiveCount)
    return { label: 'Curious / Inquisitive', score: 0.4, emoji: '🤔' };
  return { label: 'Calm / Conversational', score: 0.0, emoji: '😐' };
}

function cleanSpokenText(raw) {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, 'Here is a code demonstration.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const LANGUAGES = [
  { id: 'all', name: 'Auto-Detect', flag: '🌍', speechLang: 'en-US' },
  { id: 'english', name: 'English', flag: '🇺🇸', speechLang: 'en-US' },
  { id: 'telugu', name: 'Telugu', flag: '🇮🇳', speechLang: 'te-IN' },
  { id: 'hindi', name: 'Hindi', flag: '🇮🇳', speechLang: 'hi-IN' },
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
  const [engineMode, setEngineMode] = useState('browser-voice'); // 'live-ws' | 'browser-voice'

  const [localUserId] = useState(() => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('lms-user-id');
    if (!id) { id = 'user-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); localStorage.setItem('lms-user-id', id); }
    return id;
  });

  const activeUserId = userId || localUserId;

  // Refs for audio, speech, and WebSocket
  const wsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const micStreamRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const audioSourcesQueueRef = useRef([]);
  const isMutedRef = useRef(false);
  const voiceSessionIdRef = useRef(null);
  const conversationRef = useRef([]);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const isSpeakingTutorRef = useRef(false);
  const isProcessingQueryRef = useRef(false);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { conversationRef.current = conversation; }, [conversation]);

  // Restore initial session passed from parent
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
      setStatusMessage(`Viewing: ${initialSession.label}`);
    }
  }, [initialSession]);

  const stopAllAudioPlaybacks = useCallback(() => {
    // 1. Stop Web Audio PCM sources
    audioSourcesQueueRef.current.forEach((source) => { try { source.stop(); } catch {} });
    audioSourcesQueueRef.current = [];
    nextPlayTimeRef.current = 0;

    // 2. Stop Browser SpeechSynthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    isSpeakingTutorRef.current = false;
  }, []);

  const saveCurrentSession = useCallback(() => {
    const msgs = conversationRef.current;
    if (msgs.length === 0) return;
    const sid = sessionId || voiceSessionIdRef.current || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    if (!voiceSessionIdRef.current) voiceSessionIdRef.current = sid;

    const normalizedMessages = msgs.map(m => ({
      id: m.id || Date.now().toString(36),
      role: m.sender === 'tutor' || m.role === 'ai' ? 'ai' : 'user',
      content: m.text || m.content || '',
      timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
      isVoice: true
    }));

    const session = {
      id: sid,
      label: generateLabel(msgs, selectedSubject),
      subject: selectedSubject,
      language: selectedLanguage,
      timestamp: new Date().toISOString(),
      messages: normalizedMessages,
      type: 'voice'
    };

    const updated = [session, ...sessions.filter((s) => s.id !== session.id)];
    setSessions(updated);
    saveSessions(updated);

    if (onSessionComplete) {
      onSessionComplete(msgs);
    }

    try {
      const event = new CustomEvent('tutor-state-update', {
        detail: {
          currentSessionId: sid,
          textSessions: updated,
          type: 'general-tutor'
        }
      });
      window.dispatchEvent(event);
    } catch (e) {}

    // Persist to memory API
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
  }, [selectedSubject, selectedLanguage, sessions, activeUserId, sessionId, onSessionComplete]);

  const terminateSession = useCallback((preserveMessage) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
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
    isProcessingQueryRef.current = false;
    setConnectionStatus('disconnected');
    if (!preserveMessage) {
      setStatusMessage('Session completed. Tap the mic button to start speaking again!');
    }
  }, [stopAllAudioPlaybacks]);

  useEffect(() => {
    return () => terminateSession();
  }, [terminateSession]);

  const speakWithBrowserTts = useCallback((text, langCode, onComplete) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || isMutedRef.current) {
      if (onComplete) onComplete();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const clean = cleanSpokenText(text);
      if (!clean) {
        if (onComplete) onComplete();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices() || [];

      // Determine matching voice
      let chosenVoice = null;
      if (langCode === 'telugu') {
        chosenVoice = voices.find(v => v.lang.startsWith('te') || v.lang.includes('IN'));
      } else if (langCode === 'hindi') {
        chosenVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('IN'));
      } else {
        chosenVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('India') || v.name.includes('US')));
      }
      if (!chosenVoice && voices.length > 0) {
        chosenVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      if (chosenVoice) utterance.voice = chosenVoice;

      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        isSpeakingTutorRef.current = true;
        setConnectionStatus('tutor-speaking');
        setStatusMessage('Tutor is speaking...');
      };

      utterance.onend = () => {
        isSpeakingTutorRef.current = false;
        setConnectionStatus('connected');
        setStatusMessage('Tutor is listening... Feel free to talk.');
        if (onComplete) onComplete();
      };

      utterance.onerror = () => {
        isSpeakingTutorRef.current = false;
        setConnectionStatus('connected');
        setStatusMessage('Tutor is listening... Feel free to talk.');
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[TTS] Synthesis error:', e);
      if (onComplete) onComplete();
    }
  }, []);

  const buildSystemInstruction = useCallback(() => {
    let instruction =
      'You are Vedika, a friendly, patient, highly expert AI voice tutor for students. ' +
      'Keep answers concise, conversational, and directly spoken (strictly 1 to 3 short sentences maximum) so that listening is effortless. ' +
      'Do not include markdown tables, code fences, or lengthy lists unless explicitly requested. ';

    if (selectedLanguage === 'telugu') {
      instruction += 'You must respond in sweet, natural Telugu (with common English technical words if needed).';
    } else if (selectedLanguage === 'hindi') {
      instruction += 'You must respond in clear, friendly Hindi with a supportive tutoring tone.';
    } else if (selectedLanguage === 'english') {
      instruction += 'Speak in simple, engaging, encouraging English.';
    } else {
      instruction += 'Respond naturally in the language the student speaks to you (supporting English, Telugu, Hindi, or conversational blends).';
    }

    if (selectedSubject === 'math') {
      instruction += ' Currently tutoring Mathematics! Explain concepts with intuitive real-world examples.';
    } else if (selectedSubject === 'science') {
      instruction += ' Currently tutoring Science! Share fascinating, curious facts and explain principles simply.';
    } else if (selectedSubject === 'languages') {
      instruction += ' Currently tutoring Languages & Communication! Encourage clear speaking and vocabulary.';
    }

    return instruction;
  }, [selectedLanguage, selectedSubject]);

  // Query AI Tutor via streaming HTTP API and speak back
  const handleQueryTutor = useCallback(async (userText) => {
    if (!userText || !userText.trim() || isProcessingQueryRef.current) return;
    isProcessingQueryRef.current = true;

    try {
      setConnectionStatus('tutor-thinking');
      setStatusMessage('Vedika is thinking...');

      const tutorMsgId = 'msg-' + Date.now().toString(36);
      const systemPrompt = buildSystemInstruction();
      const currentHistory = conversationRef.current.slice(-6).map(m => ({
        role: m.sender === 'student' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          user: userText,
          maxOutputTokens: 250,
          sessionId: voiceSessionIdRef.current || sessionId || 'voice-general',
          userId: activeUserId
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value, { stream: true });
        const currentText = fullResponse;

        setConversation(prev => {
          const idx = prev.findIndex(m => m.id === tutorMsgId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], text: currentText };
            return next;
          }
          return [...prev, { id: tutorMsgId, sender: 'tutor', text: currentText, timestamp: new Date() }];
        });
      }

      // Speak response aloud via SpeechSynthesis
      speakWithBrowserTts(fullResponse, selectedLanguage, () => {
        // Once speech finishes, resume listening
        if (recognitionRef.current && connectionStatus !== 'disconnected') {
          try { recognitionRef.current.start(); } catch {}
        }
      });
    } catch (err) {
      console.error('[VoiceQuery] Error:', err);
      const fallbackMsg = "I'm here! Could you please ask that again?";
      setConversation(prev => [...prev, { id: 'err-' + Date.now(), sender: 'tutor', text: fallbackMsg, timestamp: new Date() }]);
      speakWithBrowserTts(fallbackMsg, selectedLanguage, () => {
        if (recognitionRef.current) {
          try { recognitionRef.current.start(); } catch {}
        }
      });
    } finally {
      isProcessingQueryRef.current = false;
    }
  }, [buildSystemInstruction, selectedLanguage, speakWithBrowserTts, activeUserId, sessionId, connectionStatus]);

  // Start in-browser Web Speech Recognition
  const startBrowserVoiceEngine = useCallback((stream) => {
    const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRecognition) {
      setConnectionStatus('error');
      setStatusMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;

      const langConfig = LANGUAGES.find(l => l.id === selectedLanguage);
      recognition.lang = langConfig?.speechLang || 'en-US';

      let lastUserMsgId = null;
      let finalTranscriptAccum = '';

      recognition.onstart = () => {
        setEngineMode('browser-voice');
        setConnectionStatus('connected');
        setStatusMessage('Tutor is ready! Ask your academic questions.');
      };

      recognition.onresult = (event) => {
        if (isSpeakingTutorRef.current) {
          // Student interrupted tutor: cancel tutor speech and listen to student!
          stopAllAudioPlaybacks();
        }

        let interim = '';
        let finalSpoken = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcript = res[0]?.transcript || '';
          if (res.isFinal) {
            finalSpoken += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        const displayText = (finalTranscriptAccum + finalSpoken + interim).trim();
        if (displayText) {
          setConnectionStatus('student-speaking');
          setStatusMessage('Listening to you...');

          if (!lastUserMsgId) {
            lastUserMsgId = 'user-' + Date.now().toString(36);
            setConversation(prev => [...prev, {
              id: lastUserMsgId,
              sender: 'student',
              text: displayText,
              timestamp: new Date(),
              sentiment: analyzeSentiment(displayText)
            }]);
          } else {
            setConversation(prev => {
              const idx = prev.findIndex(m => m.id === lastUserMsgId);
              if (idx !== -1) {
                const next = [...prev];
                next[idx] = { ...next[idx], text: displayText, sentiment: analyzeSentiment(displayText) };
                return next;
              }
              return [...prev, { id: lastUserMsgId, sender: 'student', text: displayText, timestamp: new Date() }];
            });
          }
        }

        if (finalSpoken) {
          finalTranscriptAccum += finalSpoken;
        }

        // Silence debounce: trigger query when student stops talking for 1.3 seconds
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const queryText = displayText;
          if (queryText && queryText.length > 1) {
            finalTranscriptAccum = '';
            lastUserMsgId = null;
            try { recognition.stop(); } catch {}
            handleQueryTutor(queryText);
          }
        }, 1300);
      };

      recognition.onerror = (e) => {
        if (e.error === 'no-speech') return;
        console.warn('[SpeechRecognition] warning:', e.error);
      };

      recognition.onend = () => {
        // Auto-restart recognition if still connected and tutor isn't speaking
        if (connectionStatus !== 'disconnected' && !isSpeakingTutorRef.current && !isProcessingQueryRef.current) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
    } catch (err) {
      console.error('[SpeechRecognition] startup failed:', err);
      setConnectionStatus('error');
      setStatusMessage(`Microphone startup error: ${err.message}`);
    }
  }, [selectedLanguage, stopAllAudioPlaybacks, handleQueryTutor, connectionStatus]);

  // Main Toggle: Connect or Disconnect
  const handleMicToggle = useCallback(async () => {
    if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
      try {
        setConnectionStatus('connecting');
        setStatusMessage('Requesting microphone access and initializing tutor...');
        stopAllAudioPlaybacks();

        const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        micStreamRef.current = stream;

        const voiceSid = sessionId || voiceSessionIdRef.current || ('voice-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
        voiceSessionIdRef.current = voiceSid;

        // Try Live WebSocket first with safe 2-second timeout
        const wsHost = process.env.NEXT_PUBLIC_WS_URL || (
          typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? `ws://localhost:5001`
            : `${typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${typeof window !== 'undefined' ? window.location.host : 'localhost'}`
        );

        let wsConnected = false;
        try {
          const wsUrl = `${wsHost}/api/ws?language=${selectedLanguage}&subject=${selectedSubject}&sessionId=${voiceSid}&userId=${activeUserId}`;
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          const wsTimeout = setTimeout(() => {
            if (!wsConnected && ws.readyState !== WebSocket.OPEN) {
              try { ws.close(); } catch {}
              console.log('[VoiceTutor] WebSocket server offline or timed out. Transitioning to Intelligent Browser Voice Engine.');
              startBrowserVoiceEngine(stream);
            }
          }, 2000);

          ws.onopen = () => {
            wsConnected = true;
            clearTimeout(wsTimeout);
            setEngineMode('live-ws');
            setConnectionStatus('connected');
            setStatusMessage('Tutor connected! Start speaking.');

            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            sourceRef.current = source;
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            source.connect(processor);
            processor.connect(audioCtx.destination);

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
              for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
              ws.send(JSON.stringify({ type: 'audio', data: btoa(binary) }));
            };
          };

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'status') setStatusMessage(message.message);
              else if (message.type === 'interrupted') {
                stopAllAudioPlaybacks();
                setConnectionStatus('connected');
                setStatusMessage('Tutor was interrupted. Listening now...');
              } else if (message.type === 'agent-transcription') {
                setConversation(prev => {
                  if (prev.length > 0 && prev[prev.length - 1].sender === 'tutor') {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + ' ' + message.text };
                    return updated;
                  }
                  return [...prev, { id: Math.random().toString(36).slice(2), sender: 'tutor', text: message.text, timestamp: new Date() }];
                });
              } else if (message.type === 'user-transcription') {
                setConversation(prev => [...prev, { id: Math.random().toString(36).slice(2), sender: 'student', text: message.text, timestamp: new Date(), sentiment: message.sentiment }]);
                if (message.sentiment) setCurrentSentiment(message.sentiment);
              }
            } catch (e) {}
          };

          ws.onerror = () => {
            clearTimeout(wsTimeout);
            if (!wsConnected) {
              console.log('[VoiceTutor] Live WebSocket unavailable. Activating Intelligent Browser Voice Engine.');
              startBrowserVoiceEngine(stream);
            }
          };

          ws.onclose = () => {
            clearTimeout(wsTimeout);
            if (!wsConnected) {
              startBrowserVoiceEngine(stream);
            }
          };
        } catch (wsErr) {
          console.warn('[VoiceTutor] Live socket error, activating Browser Voice Engine:', wsErr);
          startBrowserVoiceEngine(stream);
        }
      } catch (micErr) {
        setConnectionStatus('error');
        setStatusMessage(`Microphone access denied: ${micErr.message || micErr}. Please allow microphone permissions.`);
      }
    } else {
      saveCurrentSession();
      terminateSession();
    }
  }, [connectionStatus, selectedLanguage, selectedSubject, stopAllAudioPlaybacks, startBrowserVoiceEngine, terminateSession, saveCurrentSession, sessionId, activeUserId]);

  const clearTranscriptLog = useCallback(() => {
    setConversation([]);
    setCurrentSentiment(null);
  }, []);

  const isActive = connectionStatus !== 'disconnected' && connectionStatus !== 'error';
  const isMobile = useMediaQuery(isMobileMQ);

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
      left: isMobile ? 0 : 220,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      background: T.bg,
      color: T.text,
      fontFamily: 'var(--font-outfit), "Segoe UI", sans-serif'
    }}>
      {/* Top Header Bar when not inline */}
      {!inline && (
        <header style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '0 12px' : '0 24px', height: isMobile ? 48 : 56,
          background: T.s1, borderBottom: `1px solid ${T.border}`, flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: 'none', color: T.muted,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 8px',
                borderRadius: 6, transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={16} />
              {!isMobile && <span>Back to Chat</span>}
            </button>
            <h2 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: T.text, margin: 0 }}>
              {SUBJECTS.find((s) => s.id === selectedSubject)?.name || 'General Tutor'}
            </h2>
          </div>
        </header>
      )}

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Chat Messages */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <VoiceChatMessages conversation={conversation} />
        </div>

        {/* Voice Control Deck */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: isMobile ? '12px 14px 16px' : '16px 28px 22px',
          background: T.s1,
          borderTop: `1px solid ${T.border}`,
          gap: 10
        }}>
          {/* Controls toolbar: Language & Subject */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={isActive}
              style={{
                background: T.s2, color: T.text, fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px',
                cursor: isActive ? 'not-allowed' : 'pointer', outline: 'none', opacity: isActive ? 0.7 : 1
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} style={{ background: T.s1, color: T.text }}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
              style={{
                background: T.s2, color: T.text, fontSize: 11.5, fontWeight: 600,
                border: `1px solid ${T.border}`, borderRadius: 10, padding: '6px 12px',
                cursor: isActive ? 'not-allowed' : 'pointer', outline: 'none', opacity: isActive ? 0.7 : 1
              }}
            >
              {SUBJECTS.map((sub) => (
                <option key={sub.id} value={sub.id} style={{ background: T.s1, color: T.text }}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Message Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 14px',
            background: isActive ? `${T.accent}14` : T.s2,
            border: `1px solid ${isActive ? `${T.accent}40` : T.border}`,
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            color: isActive ? T.accent : T.muted
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: connectionStatus === 'tutor-speaking' ? T.purple : isActive ? T.green : connectionStatus === 'error' ? T.red : T.muted,
              animation: (connectionStatus === 'tutor-speaking' || connectionStatus === 'student-speaking') ? 'pulse 1s infinite' : 'none'
            }} />
            <span>{statusMessage}</span>
          </div>

          {/* Animated Robot Visualizer Orb */}
          <div style={{
            position: 'relative',
            width: isMobile ? 70 : 84,
            height: isMobile ? 70 : 84,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0'
          }}>
            <div style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: connectionStatus === 'tutor-speaking'
                ? `radial-gradient(circle, ${T.purple}40 0%, transparent 70%)`
                : isActive
                  ? `radial-gradient(circle, ${T.accent}30 0%, transparent 70%)`
                  : 'transparent',
              animation: isActive ? 'pulse 2s infinite ease-in-out' : 'none'
            }} />
            <VoiceRobotVisualizer />
          </div>

          {/* Main Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mute Button */}
            {isActive && (
              <button
                onClick={() => {
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  if (nextMute) stopAllAudioPlaybacks();
                }}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: isMuted ? `${T.red}20` : T.s2,
                  color: isMuted ? T.red : T.text,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Primary Start / End Button */}
            <button
              onClick={handleMicToggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 24,
                border: 'none',
                background: isActive ? T.red : `linear-gradient(135deg, ${T.accent} 0%, #3B82F6 100%)`,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 16px rgba(59, 130, 246, 0.35)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isActive ? (
                <>
                  <MicOff size={16} />
                  <span>END VOICE SESSION</span>
                </>
              ) : (
                <>
                  <Mic size={16} />
                  <span>START VOICE SESSION</span>
                </>
              )}
            </button>

            {/* Clear Transcript Button */}
            {conversation.length > 0 && (
              <button
                onClick={clearTranscriptLog}
                style={{
                  width: 38, height: 38, borderRadius: '50%', border: `1px solid ${T.border}`,
                  background: T.s2, color: T.muted,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
                title="Clear Transcript"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

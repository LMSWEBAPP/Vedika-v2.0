'use client';

import { useState } from 'react';
import { 
  Sparkles, Send, Clock, HelpCircle, ChevronDown, ChevronUp, 
  BookOpen, AlertCircle, CheckCircle2, MessageSquare, Loader2
} from 'lucide-react';
import { T } from '@/lib/lms-data';

export default function YouTubeTutorPanel({ videoId, title = 'Video Lesson', getCurrentTime }) {
  const [isOpen, setIsOpen] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explain'); // 'explain' | 'chat'

  const handleExplainCurrentMoment = async () => {
    if (!videoId) return;
    const currentSeconds = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
    setExplaining(true);
    try {
      const res = await fetch('/api/youtube/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title,
          timestamp: currentSeconds
        })
      });
      const data = await res.json();
      setExplanation(data);
      setActiveTab('explain');
    } catch (err) {
      console.error('Explain moment error:', err);
    } finally {
      setExplaining(false);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim() || chatLoading || !videoId) return;

    const userText = chatQuestion.trim();
    const currentSeconds = typeof getCurrentTime === 'function' ? getCurrentTime() : 0;
    const newHistory = [...chatHistory, { role: 'user', text: userText }];
    setChatHistory(newHistory);
    setChatQuestion('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/youtube/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          title,
          question: userText,
          timestamp: currentSeconds,
          history: newHistory
        })
      });
      const data = await res.json();
      setChatHistory([...newHistory, { role: 'model', text: data.answer || 'I am here to help you study this video.' }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory([...newHistory, { role: 'model', text: 'Error connecting to video tutor service.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!videoId) return null;

  return (
    <div style={{
      background: T.s1,
      border: `1px solid ${T.border}`,
      borderRadius: 14,
      marginTop: 20,
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: T.s2,
          borderBottom: isOpen ? `1px solid ${T.border}` : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: `${T.purple}20`,
            border: `1px solid ${T.purple}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={15} color={T.purple} />
          </div>
          <div>
            <h4 style={{ color: T.text, fontSize: 14, fontWeight: 700, margin: 0 }}>
              AI Video Learning Companion
            </h4>
            <span style={{ fontSize: 11.5, color: T.muted }}>
              Instant timestamp explanations and interactive study Q&A
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleExplainCurrentMoment();
            }}
            disabled={explaining}
            style={{
              background: T.purple,
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: explaining ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {explaining ? <Loader2 size={13} className="animate-spin" /> : <Clock size={13} />}
            {explaining ? 'Analyzing...' : 'Explain Current Timestamp'}
          </button>
          {isOpen ? <ChevronUp size={18} color={T.muted} /> : <ChevronDown size={18} color={T.muted} />}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div style={{ padding: 20 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => setActiveTab('explain')}
              style={{
                background: activeTab === 'explain' ? `${T.purple}20` : 'transparent',
                border: `1px solid ${activeTab === 'explain' ? T.purple : T.border}`,
                color: activeTab === 'explain' ? T.purple : T.muted,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Timestamp Explanation
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                background: activeTab === 'chat' ? `${T.purple}20` : 'transparent',
                border: `1px solid ${activeTab === 'chat' ? T.purple : T.border}`,
                color: activeTab === 'chat' ? T.purple : T.muted,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Ask Questions {chatHistory.length > 0 && `(${chatHistory.length})`}
            </button>
          </div>

          {/* Explanation Tab */}
          {activeTab === 'explain' && (
            <div>
              {explanation ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.purple, fontWeight: 700 }}>
                    <Clock size={14} /> Paused Moment: {explanation.timestamp}
                  </div>

                  <div style={{
                    background: T.s2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: 14
                  }}>
                    <h5 style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>Summary</h5>
                    <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                      {explanation.summary}
                    </p>
                  </div>

                  <div>
                    <h5 style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 6px 0' }}>Core Concept</h5>
                    <p style={{ color: T.text, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                      {explanation.coreExplanation}
                    </p>
                  </div>

                  {Array.isArray(explanation.keyTakeaways) && explanation.keyTakeaways.length > 0 && (
                    <div>
                      <h5 style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 6px 0' }}>Key Takeaways</h5>
                      <ul style={{ margin: 0, paddingLeft: 18, color: T.muted, fontSize: 12.5, lineHeight: 1.6 }}>
                        {explanation.keyTakeaways.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {explanation.whyItMatters && (
                    <div style={{ fontSize: 12, color: T.muted, fontStyle: 'italic', borderLeft: `2px solid ${T.purple}`, paddingLeft: 10 }}>
                      <strong>Why this matters:</strong> {explanation.whyItMatters}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: T.muted, fontSize: 13 }}>
                  <BookOpen size={36} color={T.muted} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ margin: 0 }}>
                    Click &ldquo;Explain Current Timestamp&rdquo; while watching the lesson to get an instant AI breakdown of what is being demonstrated.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Q&A Chat Tab */}
          {activeTab === 'chat' && (
            <div>
              <div style={{
                maxHeight: 240,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginBottom: 14,
                paddingRight: 4
              }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 12.5 }}>
                    <MessageSquare size={28} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
                    Ask anything about what is covered in this video lesson.
                  </div>
                ) : (
                  chatHistory.map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? T.purple : T.s2,
                        color: msg.role === 'user' ? '#fff' : T.text,
                        border: msg.role === 'user' ? 'none' : `1px solid ${T.border}`,
                        padding: '8px 14px',
                        borderRadius: 10,
                        maxWidth: '85%',
                        fontSize: 12.5,
                        lineHeight: 1.5
                      }}
                    >
                      {msg.text}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', color: T.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 size={12} className="animate-spin" /> Thinking...
                  </div>
                )}
              </div>

              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Ask a question about this video..."
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  style={{
                    flex: 1,
                    background: T.s2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: T.text,
                    fontSize: 12.5,
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!chatQuestion.trim() || chatLoading}
                  style={{
                    background: T.purple,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: !chatQuestion.trim() || chatLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

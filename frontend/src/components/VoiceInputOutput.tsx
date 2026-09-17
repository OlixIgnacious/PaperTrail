// PaperTrail Voice Input & Output Component (FR-15)
// Speech-to-Text (STT) and Text-to-Speech (TTS) accessibility controls

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square } from 'lucide-react';

interface VoiceProps {
  onTranscript?: (text: string) => void;
  textToRead?: string;
  lang?: string;
  showStt?: boolean;
  showTts?: boolean;
}

const LANGUAGE_LOCALES: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
  or: 'or-IN',
  as: 'as-IN',
  ne: 'ne-NP',
};

export const VoiceInputOutput: React.FC<VoiceProps> = ({
  onTranscript,
  textToRead,
  lang = 'en',
  showStt = true,
  showTts = true,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [unsupportedNotice, setUnsupportedNotice] = useState(false);

  const locale = LANGUAGE_LOCALES[lang] || 'en-IN';
  const isSttSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    // Reset speaking state if window.speechSynthesis ends
    const checkSpeaking = () => {
      if (!window.speechSynthesis) return;
      setIsSpeaking(window.speechSynthesis.speaking);
    };
    const interval = setInterval(checkSpeaking, 300);
    return () => clearInterval(interval);
  }, []);

  function toggleSpeechRecognition() {
    if (!isSttSupported) {
      setUnsupportedNotice(true);
      setTimeout(() => setUnsupportedNotice(false), 4000);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = locale;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  }

  function handleReadAloud() {
    if (!textToRead || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = locale;
    utterance.rate = 0.95; // Clear natural pacing for legal terms
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative' }}>
      {showStt && onTranscript && (
        <>
          <button
            type="button"
            className="btn-secondary"
            onClick={toggleSpeechRecognition}
            title={
              !isSttSupported
                ? 'Voice input is supported in Chrome, Edge, and Safari'
                : isListening
                ? 'Listening... click to stop'
                : `Voice Input STT (${locale})`
            }
            style={{
              padding: '8px 10px',
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : undefined,
              borderColor: isListening ? 'var(--status-unverified)' : undefined,
              animation: isListening ? 'pulseGlow 1.5s infinite' : undefined,
              opacity: !isSttSupported ? 0.75 : 1,
            }}
            aria-label={
              !isSttSupported
                ? 'Voice input is supported in Chrome, Edge, and Safari'
                : isListening
                ? 'Stop listening'
                : 'Start voice input'
            }
          >
            {isListening ? (
              <MicOff size={15} color="var(--status-unverified)" />
            ) : (
              <Mic size={15} />
            )}
          </button>
          {unsupportedNotice && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                zIndex: 50,
                padding: '6px 10px',
                fontSize: '0.72rem',
                color: '#fff',
                background: 'var(--bg-card)',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              Voice input is supported in Chrome, Edge, and Safari
            </div>
          )}
        </>
      )}

      {showTts && textToRead && (
        <button
          type="button"
          className="btn-secondary"
          onClick={handleReadAloud}
          title={isSpeaking ? 'Stop reading' : `Read Aloud TTS (${locale})`}
          style={{
            padding: '6px 10px',
            fontSize: '0.8rem',
            gap: 5,
            background: isSpeaking ? 'rgba(99, 102, 241, 0.18)' : undefined,
            borderColor: isSpeaking ? 'var(--accent-primary)' : undefined,
          }}
          aria-label={isSpeaking ? 'Stop audio' : 'Read aloud'}
        >
          {isSpeaking ? (
            <>
              <Square size={13} color="var(--accent-primary)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Stop</span>
            </>
          ) : (
            <>
              <Volume2 size={14} />
              <span style={{ fontSize: '0.75rem' }}>Listen</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};


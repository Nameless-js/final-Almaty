"use client";

import React, { useState, useRef, useEffect } from "react";
import { BrainCircuit, Send, Mic, TrendingUp, Sparkles, MessageSquare, X, RefreshCw } from "lucide-react";
import { AI_RESPONSES } from "@/lib/data";
import { logChatMessage, getChatHistory, getGesturesLibrary, seedGestures } from "@/app/actions";
import { supabase } from "@/lib/supabase";
import { useAccessibility } from "@/components/AccessibilityProvider";
import SignAvatar from "@/components/SignAvatar";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  isTyping?: boolean;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Привет! Я ваш интеллектуальный помощник Qabilet. Задайте любой вопрос — я помогу с обучением, объясню сложные темы или просто поддержу вас! 💙",
      isUser: false,
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [gestureLibrary, setGestureLibrary] = useState<any[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { ttsEnabled } = useAccessibility();

  // Load Library on Mount
  useEffect(() => {
    const loadLibrary = async () => {
      const res = await getGesturesLibrary();
      if (res.data) setGestureLibrary(res.data);
    };
    loadLibrary();
  }, []);

  // Check for keywords in messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && !lastMsg.isUser) {
      const text = lastMsg.text.toLowerCase();
      const match = gestureLibrary.find(g => text.includes(g.word.toLowerCase()));
      if (match) {
        setActiveWord(match.word);
      }
    }
  }, [messages, gestureLibrary]);

  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedGestures();
    if (res.success) {
      const res2 = await getGesturesLibrary();
      if (res2.data) setGestureLibrary(res2.data);
    }
    setIsSeeding(false);
  };

  useEffect(() => {
    // Initialize Speech API
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSend(transcript);
        };
        recognitionRef.current = recognition;
      }
    }
    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const cleanTextForSpeech = (text: string) => {
    return text
      .replace(/[*_#~`>|]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/ {2,}/g, ' ')
      .trim();
  };

  const speakText = (text: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const cleaned = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "ru-RU";
    utterance.rate = 1.0;
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await getChatHistory(session.user.id);
      if (res.data && res.data.length > 0) {
        const historyMsgs = res.data.map((m: any) => ({
          id: m.id.toString(),
          text: m.content,
          isUser: m.role === 'user'
        }));
        
        setMessages(prev => {
          const existingIds = new Set(prev.map(msg => msg.id));
          const uniqueHistory = historyMsgs.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...uniqueHistory];
        });
      }
    };
    fetchHistory();
  }, []);

  const logToSupabase = async (content: string, role: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await logChatMessage(content, role, 'ai_tutor', session?.user.id);
      if (res.error) console.error("Server Action Failed:", res.error);
    } catch (err) {
      console.error("Failed to log chat:", err);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    logToSupabase(text, 'user');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const aiResponse = data.text || "Извините, я не смог сгенерировать ответ.";
      
      setMessages(prev => [...prev, { id: Date.now().toString(), text: aiResponse, isUser: false }]);
      logToSupabase(aiResponse, 'assistant');
      
      // Auto-speak AI response
      speakText(aiResponse);

    } catch (err: any) {
      console.error(err);
      const errorMsg = "Произошла ошибка при обращении к ИИ. Попробуйте еще раз.";
      setMessages(prev => [...prev, { id: Date.now().toString(), text: errorMsg, isUser: false }]);
      speakText(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Avatar Video Overlay */}
      <div className="fixed top-24 right-8 z-30 w-64 group">
        <SignAvatar 
          currentWord={activeWord} 
          className="shadow-2xl border-4 border-[var(--color-primary)]" 
        />
        {activeWord && (
          <button 
            onClick={() => setActiveWord(null)}
            className="absolute -top-2 -right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-40 border border-white/20"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row gap-6 mb-6 shrink-0">
        <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center text-white shadow-lg">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">ИИ-Тьютор</h2>
              <p className="text-sm text-[var(--text-secondary)]">Ваш персональный помощник</p>
            </div>
          </div>
          
          {gestureLibrary.length === 0 && (
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="p-2 text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} className={isSeeding ? "animate-spin" : ""} />
              {isSeeding ? "Синхронизация..." : "Синхронизировать базу"}
            </button>
          )}
        </div>

        {/* Analytics Widget */}
        <div className="flex-1 bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 border border-[var(--color-primary)]/20 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
            <Sparkles className="text-[var(--color-primary-light)] animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-[var(--color-primary-light)]" />
            <h3 className="font-semibold text-sm uppercase tracking-wider text-[var(--color-primary-light)]">Анализ успеваемости</h3>
          </div>
          
          <div className="flex items-end gap-2 h-12">
            {[40, 65, 45, 80, 55, 90, 75].map((height, i) => (
              <div key={i} className="flex-1 bg-[var(--bg-card2)] rounded-t-sm relative group-hover:bg-[var(--color-primary)]/20 transition-colors">
                <div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-secondary)] rounded-t-sm transition-all duration-1000 ease-out"
                  style={{ height: `${height}%`, animationDelay: `${i * 100}ms` }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 text-right font-medium">+15% продуктивности на этой неделе</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-sm">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 max-w-[85%] ${msg.isUser ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg shadow-sm
                ${msg.isUser ? 'bg-[var(--surface)] border border-[var(--border-color)]' : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white'}
              `}>
                {msg.isUser ? '👤' : '🤖'}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm relative group
                ${msg.isUser 
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tr-sm' 
                  : 'bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 border border-[var(--color-primary)]/20 text-[var(--text-primary)] rounded-tl-sm'
                }
              `}>
                {msg.text}
                {!msg.isUser && (
                  <button 
                    onClick={() => speakText(msg.text)}
                    className="absolute -right-10 top-0 p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MessageSquare size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg shadow-sm bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
                🤖
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 border border-[var(--color-primary)]/20 rounded-tl-sm flex items-center gap-1.5 h-[52px]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--bg-card2)] border-t border-[var(--border-color)]">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {['Объясни мне дроби', 'Что такое фотосинтез?', 'Помоги с алфавитом', 'Расскажи сказку'].map((sug, i) => (
              <button 
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--color-primary-light)] hover:border-[var(--color-primary-light)] transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={toggleListening}
              className={`p-3 border rounded-xl transition-all shrink-0 ${isListening ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--color-primary-light)]'}`}
            >
              <Mic size={20} />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Слушаю..." : "Задайте вопрос..."}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-4 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--text-muted)]"
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="p-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

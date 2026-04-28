"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, Square } from "lucide-react";
import { useAccessibility } from "@/components/AccessibilityProvider";
import { logChatMessage } from "@/app/actions";

export default function VoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Нажмите для начала");
  const [transcript, setTranscript] = useState("Здесь появится ваша речь...");
  const [output, setOutput] = useState("Голосовой ответ появится здесь");
  const [isOutputActive, setIsOutputActive] = useState(false);
  
  const { ttsEnabled } = useAccessibility();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setStatus("Браузер не поддерживает голосовой ввод");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatus("🔴 Слушаю вас...");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += trans;
          else interim += trans;
        }
        
        const display = final || interim;
        setTranscript(display);
        
        if (final) {
          processCommand(final.toLowerCase().trim());
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const msgs: Record<string, string> = {
          "not-allowed": "Разрешите доступ к микрофону",
          "no-speech": "Речь не обнаружена",
          "network": "Ошибка сети",
        };
        setStatus(msgs[event.error] || "Ошибка распознавания");
      };

      recognition.onend = () => {
        setIsListening(false);
        setStatus("Нажмите для начала");
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
      stopSpeech();
    };
  }, []);

  const logToSupabase = async (content: string, role: string) => {
    try {
      const res = await logChatMessage(content, role, 'voice_assistant');
      if (res.error) console.error("Server Action Failed:", res.error);
    } catch (err) {
      console.error("Failed to log chat:", err);
    }
  };

  const processCommand = (text: string) => {
    // Log user command
    logToSupabase(text, 'user');

    // Simple mock commands response
    let reply = `Я слышу вас: "${text}". Как я могу помочь?`;
    
    if (text.includes("открыть обучение")) reply = "Открываю раздел обучения...";
    else if (text.includes("помощь")) reply = "Я ваш голосовой помощник. Вы можете попросить меня открыть разные разделы.";
    
    setVoiceOutput(reply);
    if (ttsEnabled) speakText(reply);

    // Log assistant reply
    logToSupabase(reply, 'assistant');
  };

  const setVoiceOutput = (text: string) => {
    setOutput(text);
    setIsOutputActive(true);
    setTimeout(() => setIsOutputActive(false), 1000);
  };

  const speakText = (text: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ru-RU";
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    
    const voices = synthRef.current.getVoices();
    const ruVoice = voices.find(v => v.lang.startsWith("ru"));
    if (ruVoice) utterance.voice = ruVoice;
    
    synthRef.current.speak(utterance);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
  };

  const startGreeting = () => {
    const text = "Добро пожаловать в Qabilet! Я ваш голосовой помощник. Вы можете говорить команды или нажать на микрофон.";
    setVoiceOutput(text);
    speakText(text);
    logToSupabase(text, 'assistant');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <div className="text-center py-4">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-[var(--bg-card)] rounded-2xl mb-4 border border-[var(--border-color)]">
          <span className="text-4xl animate-bounce">🎙️</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Голосовой помощник</h2>
        <p className="text-[var(--text-secondary)]">Говорите — я слушаю и помогаю</p>
      </div>

      <div className="flex flex-col items-center py-8">
        <button 
          onClick={toggleVoice}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_40px_rgba(108,58,232,0.4)]
            ${isListening ? 'bg-gradient-to-br from-red-500 to-rose-600 scale-105 shadow-[0_0_70px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] hover:scale-105 active:scale-95'}
          `}
        >
          {/* Animated Rings */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-[ping_2s_ease-out_infinite]" />
              <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-[ping_2s_ease-out_infinite_0.5s]" />
            </>
          )}
          <Mic size={48} className="text-white relative z-10" />
        </button>
        <p className={`mt-6 font-medium ${isListening ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
          {status}
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 min-h-[80px] transition-colors">
        <p className={`italic ${transcript !== "Здесь появится ваша речь..." ? "text-[var(--text-primary)] not-italic" : "text-[var(--text-muted)]"}`}>
          {transcript}
        </p>
      </div>

      <div className={`bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 border border-[var(--color-primary)]/30 rounded-2xl p-5 flex items-start gap-4 transition-all duration-500 ${isOutputActive ? 'border-[var(--color-primary)] shadow-[0_0_20px_rgba(108,58,232,0.3)] scale-[1.02]' : ''}`}>
        <Volume2 className="text-[var(--color-primary-light)] shrink-0" size={28} />
        <p className="text-[var(--text-primary)] font-medium leading-relaxed">
          {output}
        </p>
      </div>

      <div className="flex gap-4 w-full pt-4">
        <button 
          onClick={startGreeting}
          className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-[0_0_20px_rgba(108,58,232,0.5)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Volume2 size={20} />
          Приветствие
        </button>
        <button 
          onClick={stopSpeech}
          className="flex-1 bg-[var(--bg-card2)] border border-[var(--border-color)] text-[var(--text-primary)] py-4 rounded-xl font-semibold hover:bg-[var(--surface)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Square size={20} />
          Стоп
        </button>
      </div>
    </div>
  );
}

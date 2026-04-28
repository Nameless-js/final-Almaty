"use client";

import React, { useState, useEffect, useRef } from "react";
import { HandMetal, Camera, Book, Search, Video } from "lucide-react";
import { SIGNS_DATA } from "@/lib/data";

type Tab = "dictionary" | "camera";

export default function SignsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dictionary");
  const [search, setSearch] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filteredSigns = SIGNS_DATA.filter(s => 
    s.word.toLowerCase().includes(search.toLowerCase()) || 
    s.category.includes(search.toLowerCase())
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setIsAnalyzing(true);
      setDetectedGesture(null);

      // Mock ML detection delay (3 seconds)
      setTimeout(() => {
        setIsAnalyzing(false);
        setDetectedGesture("👋 Здравствуйте, я готов учиться");
      }, 3000);

    } catch (err) {
      console.warn("Camera access denied or not available", err);
      // Fallback for demo without real camera
      setIsCameraActive(true);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setDetectedGesture("👋 Здравствуйте, я готов учиться");
      }, 3000);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsAnalyzing(false);
    setDetectedGesture(null);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="text-center py-4">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-[var(--bg-card)] rounded-2xl mb-4 border border-[var(--border-color)]">
          <span className="text-4xl">🤟</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Жестовый язык</h2>
        <p className="text-[var(--text-secondary)]">Переводчик и обучение жестам</p>
      </div>

      <div className="flex p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
        <button
          onClick={() => { setActiveTab("dictionary"); stopCamera(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${activeTab === "dictionary" ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          <Book size={18} /> Словарь
        </button>
        <button
          onClick={() => setActiveTab("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all ${activeTab === "camera" ? "bg-[var(--color-primary)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
        >
          <Camera size={18} /> Камера
        </button>
      </div>

      {activeTab === "dictionary" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={20} />
            <input
              type="text"
              placeholder="Поиск жеста..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--text-muted)]"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSigns.map((sign, idx) => (
              <div 
                key={idx}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--color-primary)] hover:bg-[var(--bg-card2)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{sign.emoji}</span>
                <span className="font-semibold text-sm">{sign.word}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "camera" && (
        <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl border-2 border-[var(--border-color)] relative overflow-hidden shadow-xl">
            {isCameraActive ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                
                {/* Mock Focus Frame */}
                <div className="absolute inset-8 border-2 border-[var(--color-primary-light)]/50 rounded-2xl animate-pulse pointer-events-none">
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[var(--color-primary)] rounded-tl-xl" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[var(--color-primary)] rounded-tr-xl" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[var(--color-primary)] rounded-bl-xl" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[var(--color-primary)] rounded-br-xl" />
                </div>
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-sm transition-all">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-[var(--color-primary)] rounded-full animate-spin mb-4" />
                    <p className="font-display font-bold text-lg text-white tracking-wide">Анализ 3D-модели рук...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center">
                <Video size={48} className="mb-4 opacity-50" />
                <p>Камера выключена. Нажмите кнопку ниже, чтобы начать распознавание жестов.</p>
              </div>
            )}
          </div>

          <div className={`w-full max-w-2xl bg-[var(--bg-card)] border rounded-2xl p-6 transition-all duration-500 ${detectedGesture ? 'border-[var(--success)] bg-[var(--success)]/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-[var(--border-color)]'}`}>
            <p className="text-sm text-[var(--text-secondary)] mb-1">Система распознала:</p>
            <p className={`font-display text-xl md:text-2xl font-bold min-h-[32px] ${detectedGesture ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
              {detectedGesture || "—"}
            </p>
          </div>

          <button
            onClick={isCameraActive ? stopCamera : startCamera}
            className={`w-full max-w-2xl py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3
              ${isCameraActive 
                ? 'bg-[var(--bg-card2)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--surface)]' 
                : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:shadow-[0_8px_25px_rgba(108,58,232,0.4)]'
              }
            `}
          >
            <Camera size={24} />
            {isCameraActive ? "Остановить камеру" : "Начать распознавание"}
          </button>
        </div>
      )}
    </div>
  );
}

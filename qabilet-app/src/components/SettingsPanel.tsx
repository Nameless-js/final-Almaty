"use client";

import React, { useEffect, useState } from "react";
import { X, Type, Contrast, TypeOutline, Volume2, Palette } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    theme,
    setTheme,
    highContrast,
    setHighContrast,
    largeFont,
    setLargeFont,
    dyslexiaFont,
    setDyslexiaFont,
    ttsEnabled,
    setTtsEnabled,
  } = useAccessibility();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-settings", handleOpen);
    return () => window.removeEventListener("open-settings", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border-color)] z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">♿</span>
            <h3 className="font-display font-bold text-xl">Доступность</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[var(--surface)] rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-2">
              <Type size={16} /> Чтение
            </h4>
            
            <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-[var(--bg-card2)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col">
                <span className="font-semibold">Крупный шрифт</span>
                <span className="text-xs text-[var(--text-secondary)]">Увеличение размера текста (x1.25)</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${largeFont ? 'bg-[var(--color-primary)]' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${largeFont ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="sr-only" checked={largeFont} onChange={(e) => setLargeFont(e.target.checked)} />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-[var(--bg-card2)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col">
                <span className="font-semibold">Шрифт для дислексиков</span>
                <span className="text-xs text-[var(--text-secondary)]">Имитация OpenDyslexic</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dyslexiaFont ? 'bg-[var(--color-primary)]' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dyslexiaFont ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="sr-only" checked={dyslexiaFont} onChange={(e) => setDyslexiaFont(e.target.checked)} />
            </label>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-2">
              <Contrast size={16} /> Визуал
            </h4>
            
            <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-[var(--bg-card2)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col">
                <span className="font-semibold">Высокий контраст</span>
                <span className="text-xs text-[var(--text-secondary)]">Черно-белые цвета, жесткие границы</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${highContrast ? 'bg-[var(--color-primary)]' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${highContrast ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="sr-only" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
            </label>

            <div className="p-4 rounded-xl bg-[var(--bg-card2)] border border-[var(--border-color)]">
              <div className="flex items-center gap-2 mb-3">
                <Palette size={16} className="text-[var(--text-secondary)]" />
                <span className="font-semibold">Тема интерфейса</span>
              </div>
              <div className="flex gap-3">
                {[
                  { id: 'default', color: '#6C3AE8', title: 'Фиолетовая (по умолчанию)' },
                  { id: 'blue', color: '#2563EB', title: 'Синяя' },
                  { id: 'green', color: '#059669', title: 'Зеленая' },
                  { id: 'dark', color: '#374151', title: 'Темная' },
                ].map((t) => (
                  <button
                    key={t.id}
                    title={t.title}
                    onClick={() => setTheme(t.id as any)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${theme === t.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                    style={{ backgroundColor: t.color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-2">
              <Volume2 size={16} /> Звук
            </h4>
            
            <label className="flex items-center justify-between cursor-pointer p-4 rounded-xl bg-[var(--bg-card2)] border border-[var(--border-color)] hover:border-[var(--color-primary)] transition-colors">
              <div className="flex flex-col">
                <span className="font-semibold">Озвучивание (TTS)</span>
                <span className="text-xs text-[var(--text-secondary)]">Голосовой помощник говорит</span>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${ttsEnabled ? 'bg-[var(--color-primary)]' : 'bg-gray-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <input type="checkbox" className="sr-only" checked={ttsEnabled} onChange={(e) => setTtsEnabled(e.target.checked)} />
            </label>
          </div>

        </div>
      </div>
    </>
  );
}

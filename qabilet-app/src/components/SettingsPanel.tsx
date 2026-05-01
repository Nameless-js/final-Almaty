"use client";

import React, { useEffect, useState } from "react";
import { X, Type, Contrast, Volume2, Palette, Check } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`toggle-track ${checked ? "toggle-track-on" : "toggle-track-off"}`}
    >
      <span className={`toggle-thumb ${checked ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
    </button>
  );
}

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

  const themes = [
    { id: 'default', color: 'linear-gradient(135deg, #7C3AED, #A78BFA)', title: 'Фиолетовая' },
    { id: 'blue',    color: 'linear-gradient(135deg, #1D4ED8, #60A5FA)', title: 'Синяя' },
    { id: 'green',   color: 'linear-gradient(135deg, #065F46, #34D399)', title: 'Зеленая' },
    { id: 'dark',    color: 'linear-gradient(135deg, #1F2937, #6B7280)', title: 'Тёмная' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] backdrop-blur-md transition-opacity"
        style={{ background: 'rgba(4, 2, 14, 0.7)' }}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm z-[70] flex flex-col settings-panel-enter"
        style={{
          background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg) 100%)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(167,139,250,0.15))',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              ♿
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Доступность</h3>
              <p className="text-xs text-[var(--text-muted)]">Настройки интерфейса</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

          {/* Reading Section */}
          <div className="settings-section space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold flex items-center gap-2 mb-4">
              <Type size={14} />
              Чтение
            </h4>

            <label className="settings-label">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[var(--text-primary)] text-sm">Крупный шрифт</span>
                <span className="text-xs text-[var(--text-muted)]">Увеличение текста × 1.25</span>
              </div>
              <Toggle checked={largeFont} onChange={setLargeFont} />
            </label>

            <label className="settings-label">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[var(--text-primary)] text-sm">Шрифт для дислексиков</span>
                <span className="text-xs text-[var(--text-muted)]">Comic Neue — легче читать</span>
              </div>
              <Toggle checked={dyslexiaFont} onChange={setDyslexiaFont} />
            </label>
          </div>

          {/* Visual Section */}
          <div className="settings-section space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold flex items-center gap-2 mb-4">
              <Contrast size={14} />
              Визуал
            </h4>

            <label className="settings-label">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[var(--text-primary)] text-sm">Высокий контраст</span>
                <span className="text-xs text-[var(--text-muted)]">Чёрно-белые цвета</span>
              </div>
              <Toggle checked={highContrast} onChange={setHighContrast} />
            </label>

            {/* Theme Picker */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-card2)', border: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Palette size={14} className="text-[var(--text-muted)]" />
                <span className="font-semibold text-[var(--text-primary)] text-sm">Тема интерфейса</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    title={t.title}
                    onClick={() => setTheme(t.id as any)}
                    className="relative group flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-10 h-10 rounded-xl transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: t.color,
                        boxShadow: theme === t.id
                          ? '0 0 0 2px white, 0 0 0 4px rgba(124,58,237,0.6), 0 4px 12px rgba(0,0,0,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.3)',
                        transform: theme === t.id ? 'scale(1.12)' : '',
                      }}
                    >
                      {theme === t.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={14} color="white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Section */}
          <div className="settings-section space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold flex items-center gap-2 mb-4">
              <Volume2 size={14} />
              Звук
            </h4>

            <label className="settings-label">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-[var(--text-primary)] text-sm">Озвучивание (TTS)</span>
                <span className="text-xs text-[var(--text-muted)]">Голосовой помощник говорит</span>
              </div>
              <Toggle checked={ttsEnabled} onChange={setTtsEnabled} />
            </label>
          </div>

        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p className="text-center text-xs text-[var(--text-muted)]">
            Qabilet — платформа доступности
          </p>
        </div>
      </div>
    </>
  );
}

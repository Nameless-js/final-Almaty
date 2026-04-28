"use client";

import React from "react";
import { Settings } from "lucide-react";

export function FAB() {
  const openSettings = () => {
    window.dispatchEvent(new CustomEvent("open-settings"));
  };

  return (
    <button
      onClick={openSettings}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-primary-light)] text-white shadow-[0_8px_32px_rgba(108,58,232,0.4)] hover:scale-105 hover:shadow-[0_12px_40px_rgba(108,58,232,0.6)] active:scale-95 transition-all duration-300"
      aria-label="Спец. возможности"
    >
      <Settings size={28} className="animate-[spin_6s_linear_infinite]" />
    </button>
  );
}

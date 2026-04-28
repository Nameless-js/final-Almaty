"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mic, HandMetal, BrainCircuit, Settings, Menu, X, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/learn", label: "Обучение", icon: BookOpen },
  { href: "/voice", label: "Помощник", icon: Mic },
  { href: "/signs", label: "Жесты", icon: HandMetal },
  { href: "/ai", label: "ИИ-Тьютор", icon: BrainCircuit },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)]"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-40
        h-screen w-64 flex flex-col
        bg-[var(--bg-card)] border-r border-[var(--border-color)]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
            <span className="text-3xl">♾️</span>
            <span className="font-display font-black text-2xl bg-gradient-to-r from-[#E879F9] via-[#818CF8] to-[#06B6D4] text-transparent bg-clip-text tracking-tight">
              Qabilet
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary-light)]/10 border border-[var(--color-primary)]/30 text-[var(--text-primary)]" 
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                  }
                `}
              >
                <Icon 
                  size={20} 
                  className={`transition-transform duration-300 group-hover:scale-110 group-hover:text-[var(--color-primary-light)] ${isActive ? "text-[var(--color-primary-light)]" : ""}`} 
                />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

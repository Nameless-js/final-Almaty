"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { COURSES_DATA } from "@/lib/data";

const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "basic", label: "Основы" },
  { id: "language", label: "Язык" },
  { id: "math", label: "Математика" },
  { id: "art", label: "Творчество" },
];

export default function LearnPage() {
  const [filter, setFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCourses = filter === "all" 
    ? COURSES_DATA 
    : COURSES_DATA.filter(c => c.category === filter);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="text-center py-4">
        <div className="inline-flex justify-center items-center w-20 h-20 bg-[var(--bg-card)] rounded-2xl mb-4 border border-[var(--border-color)]">
          <span className="text-4xl">📚</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-2">Образование</h2>
        <p className="text-[var(--text-secondary)]">Адаптивные курсы для всех</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all border ${filter === cat.id ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--color-primary-light)]'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course, idx) => (
            <Link 
              href={`/courses/${course.id}`}
              key={course.id}
              className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_8px_32px_rgba(108,58,232,0.2)] group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: course.iconBg }}
                >
                  {course.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-bold text-xl mb-1">{course.title}</h4>
                  <span className="inline-block bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-[var(--color-primary-light)] px-3 py-1 rounded-full text-xs font-semibold">
                    {course.tag}
                  </span>
                </div>
              </div>
              
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {course.desc}
              </p>
              
              <div className="space-y-3">
                <div className="h-3 w-full bg-[var(--bg-card2)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: mounted ? `${course.progress}%` : "0%" }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--color-primary-light)] transition-colors">
                  <span>📖 {course.completed}/{course.lessons} уроков завершено</span>
                  <span>Перейти к курсу &rarr;</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-[var(--text-muted)]">
            <span className="text-4xl block mb-4">📭</span>
            <p>В этой категории пока нет курсов</p>
          </div>
        )}
      </div>
    </div>
  );
}

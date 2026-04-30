"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCourses, getUserProgress, getLessons } from "@/app/actions";
import { supabase } from "@/lib/supabase";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  iconBg?: string;
  progress?: number;
  completed?: number;
  total?: number;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const userId = session.user.id;

        const [coursesRes, progressRes] = await Promise.all([
          getCourses(),
          getUserProgress(userId)
        ]);

        if (coursesRes.error) throw new Error(coursesRes.error);
        if (!coursesRes.data) throw new Error("No data returned");
        
        const completedLessonIds = new Set((progressRes.data || []).map((p: any) => p.lesson_id));

        // Simplify: just use the course data and progress without sub-fetching lessons in a loop
        // to avoid hitting concurrent Server Action limits which causes "fetch failed"
        const mappedData = coursesRes.data.map((item: any) => {
          return {
            ...item,
            icon: item.category === 'для глухих' ? '🤟' : '📚',
            iconBg: 'linear-gradient(135deg, #6C3AE8, #8B5CF6)',
            progress: 0, // Default for now
            completed: 0,
            total: 0
          };
        });

        setCourses(mappedData);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError("Не удалось загрузить данные: " + (err.message || "Ошибка сети"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Section */}
      <div className="text-center py-6">
        <div className="inline-block bg-gradient-to-r from-[rgba(108,58,232,0.3)] to-[rgba(6,182,212,0.3)] border border-[rgba(108,58,232,0.4)] px-4 py-1.5 rounded-full text-sm text-[var(--color-primary-light)] font-semibold tracking-wide mb-4">
          🌟 Платформа доступности
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-black mb-3">
          Возможности<br className="md:hidden" />
          <span className="bg-gradient-to-r from-[#E879F9] via-[#818CF8] to-[#06B6D4] text-transparent bg-clip-text ml-2">
            без границ
          </span>
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto">
          Технологии на службе каждого человека — независимо от ограничений
        </p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-sm">
        <div className="flex-1 text-center">
          <span className="block font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] text-transparent bg-clip-text">4</span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mt-1 block">Модуля</span>
        </div>
        <div className="w-px h-12 bg-[var(--border-color)]"></div>
        <div className="flex-1 text-center">
          <span className="block font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] text-transparent bg-clip-text">100%</span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mt-1 block">Доступность</span>
        </div>
        <div className="w-px h-12 bg-[var(--border-color)]"></div>
        <div className="flex-1 text-center">
          <span className="block font-display text-3xl md:text-4xl font-black bg-gradient-to-r from-[var(--color-primary-light)] to-[var(--color-secondary)] text-transparent bg-clip-text">∞</span>
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mt-1 block">Возможности</span>
        </div>
      </div>

      {/* Courses Grid */}
      <div>
        <h3 className="font-display text-2xl font-bold mb-4">Популярные курсы</h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)]">Загрузка курсов...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl text-center">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <span className="text-4xl block mb-4">📭</span>
            <p>Нет доступных курсов</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course, idx) => (
              <Link 
                href={`/courses/${course.id}`}
                key={course.id}
                className="block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-primary)] hover:shadow-[0_8px_32px_rgba(108,58,232,0.2)] group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: course.iconBg }}
                  >
                    {course.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-display font-bold text-lg mb-1">{course.title}</h4>
                    <span className="inline-block bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 text-[var(--color-primary-light)] px-2.5 py-0.5 rounded-full text-xs font-semibold">
                      {course.category || "Основы"}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                <div className="space-y-2">
                  <div className="h-2 w-full bg-[var(--bg-card2)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: mounted ? `${course.progress}%` : "0%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--color-primary-light)] transition-colors">
                    <span>{course.completed}/{course.total} уроков пройдено</span>
                    <span>{course.progress}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

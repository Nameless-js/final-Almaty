"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getCourses, getUserProgress } from "@/app/actions";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Layers, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";

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

        const mappedData = coursesRes.data.map((item: any) => {
          return {
            ...item,
            icon: item.category === 'для глухих' ? '🤟' : '📚',
            iconBg: 'linear-gradient(135deg, #7C3AED, #A78BFA)',
            progress: 0,
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

  const stats = [
    { value: "4", label: "Модуля", icon: Layers },
    { value: "100%", label: "Доступность", icon: ShieldCheck },
    { value: "∞", label: "Возможности", icon: InfinityIcon },
  ];

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 relative">

      {/* Ambient background glows */}
      <div
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(ellipse at 80% 10%, rgba(124,58,237,0.12) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute top-32 left-1/3 w-72 h-72 pointer-events-none -z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Hero Section */}
      <div className="text-center py-10 relative z-10">
        <div className="flex justify-center mb-5">
          <span className="hero-badge">
            🌟 Платформа доступности
          </span>
        </div>

        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-[1.1] tracking-tight">
          Возможности
          <br />
          <span className="gradient-text">без границ</span>
        </h2>

        <p className="text-[var(--text-secondary)] text-lg max-w-md mx-auto leading-relaxed">
          Технологии на службе каждого человека —<br className="hidden md:block" />
          <span className="text-[var(--text-muted)]">независимо от ограничений</span>
        </p>
      </div>

      {/* Stats Row */}
      <div
        className="grid grid-cols-3 gap-px relative z-10 overflow-hidden"
        style={{
          background: 'var(--border-color)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {stats.map(({ value, label, icon: Icon }, i) => (
          <div
            key={label}
            className="stat-card flex flex-col items-center justify-center py-7 px-4 gap-2"
            style={{ borderRadius: i === 0 ? '20px 0 0 20px' : i === 2 ? '0 20px 20px 0' : '0' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              <Icon size={18} className="text-[var(--color-primary-light)]" />
            </div>
            <span className="font-display text-3xl md:text-4xl font-black gradient-text-primary">
              {value}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="relative z-10">
        <div className="section-title-line mb-6">
          <h3 className="font-display text-2xl font-bold">Популярные курсы</h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-48 skeleton rounded-2xl" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        ) : error ? (
          <div
            className="p-6 rounded-2xl text-center"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'rgb(252, 165, 165)',
            }}
          >
            <p className="font-semibold">{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <span className="text-5xl block mb-4 opacity-50">📭</span>
            <p className="font-medium">Нет доступных курсов</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course, idx) => (
              <Link
                href={`/courses/${course.id}`}
                key={course.id}
                className="card-premium block p-6 group"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Top row */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: course.iconBg,
                      boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                    }}
                  >
                    {course.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-lg mb-1.5 truncate pr-2">
                      {course.title}
                    </h4>
                    <span className="badge-primary">{course.category || "Основы"}</span>
                  </div>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2"
                    style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.25)',
                    }}
                  >
                    <ArrowRight size={16} className="text-[var(--color-primary-light)]" />
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] mb-5 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: mounted ? `${course.progress}%` : "0%" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold transition-colors duration-200">
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                      {course.completed}/{course.total} уроков пройдено
                    </span>
                    <span className="text-[var(--color-primary-light)]">{course.progress}%</span>
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

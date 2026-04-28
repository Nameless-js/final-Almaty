"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Clock, 
  MessageCircle, 
  ChevronRight, 
  History, 
  TrendingUp, 
  Award 
} from "lucide-react";
import { getCourses, getUserProgress, getLessons, getAIActivityCount, getLastStudiedLesson } from "@/app/actions";
import { supabase } from "@/lib/supabase";

export default function LearnPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [lastLesson, setLastLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const userId = session.user.id;

        const [coursesRes, progressRes, activityRes, lastRes] = await Promise.all([
          getCourses(),
          getUserProgress(userId),
          getAIActivityCount(userId),
          getLastStudiedLesson(userId)
        ]);

        const completedLessonIds = new Set((progressRes.data || []).map((p: any) => p.lesson_id));
        setActivityCount(activityRes.count || 0);
        setLastLesson(lastRes.data);

        // Map and filter courses (only those with progress > 0)
        const allCourses = coursesRes.data || [];
        const mappedData = await Promise.all(allCourses.map(async (item: any) => {
          const lessonsRes = await getLessons(item.id);
          const courseLessons = lessonsRes.data || [];
          const total = courseLessons.length;
          const completed = courseLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            ...item,
            progress: percent,
            completed,
            total
          };
        }));

        // Filter: show only courses where user has at least 1 completed lesson
        setCourses(mappedData.filter(c => c.completed > 0));

      } catch (err) {
        console.error("Error fetching learn dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
        <p className="text-[var(--text-secondary)] font-medium">Загружаем ваш прогресс...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-4xl font-bold mb-2">Обучение</h2>
          <p className="text-[var(--text-secondary)]">Ваш личный кабинет и статистика</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase">Уровень</div>
                <div className="text-lg font-bold">Начинающий</div>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Activity Widget */}
        <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <MessageCircle size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 text-white/80 font-semibold text-sm uppercase">
               <TrendingUp size={16} />
               Активность ИИ
            </div>
            <div className="text-5xl font-bold">{activityCount}</div>
            <p className="text-white/70 text-xs">сообщений отправлено сегодня</p>
          </div>
        </div>

        {/* Last Lesson Widget */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:border-[var(--color-primary)] transition-colors">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] rounded-xl flex items-center justify-center">
                <History size={20} />
             </div>
             <h3 className="font-bold text-lg">Последний изученный материал</h3>
          </div>
          
          {lastLesson ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-xl mb-1">{lastLesson.lessons.title}</h4>
                <p className="text-sm text-[var(--text-secondary)]">Нажмите, чтобы продолжить изучение</p>
              </div>
              <Link 
                href={`/courses/${lastLesson.lessons.course_id}/${lastLesson.lesson_id}`}
                className="bg-[var(--color-primary)] text-white p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                <ChevronRight size={24} />
              </Link>
            </div>
          ) : (
             <p className="text-[var(--text-muted)] italic">Вы еще не завершили ни одного урока. Самое время начать!</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-display text-2xl font-bold flex items-center gap-3">
          <BookOpen className="text-[var(--color-primary-light)]" />
          Мои курсы
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.length > 0 ? (
            courses.map((course) => (
              <Link 
                href={`/courses/${course.id}`}
                key={course.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BookOpen size={100} />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                       <span className="px-3 py-1 bg-[var(--bg-card2)] border border-[var(--border-color)] rounded-full text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          {course.category}
                       </span>
                       <span className="text-xl font-bold text-[var(--color-primary-light)]">{course.progress}%</span>
                    </div>
                    <h4 className="text-2xl font-bold mb-6">{course.title}</h4>
                    
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] mb-1">
                          <span>ПРОГРЕСС</span>
                          <span>{course.completed}/{course.total} УРОКОВ</span>
                       </div>
                       <div className="h-2.5 w-full bg-[var(--bg-card2)] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all duration-1000"
                            style={{ width: mounted ? `${course.progress}%` : "0%" }}
                          />
                       </div>
                    </div>
                 </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4">
               <div className="w-16 h-16 bg-[var(--bg-card2)] rounded-full flex items-center justify-center mx-auto text-3xl">📭</div>
               <h4 className="font-bold text-xl text-[var(--text-secondary)]">У вас пока нет активных курсов</h4>
               <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">Выберите курс на главной странице и завершите свой первый урок, чтобы он появился здесь.</p>
               <Link href="/" className="inline-block mt-4 bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">Найти курс</Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

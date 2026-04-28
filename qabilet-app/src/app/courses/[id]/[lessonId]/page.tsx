"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Play } from "lucide-react";
import { getLessons, completeLesson } from "@/app/actions";
import { useAccessibility } from "@/components/AccessibilityProvider";
import { supabase } from "@/lib/supabase";

export default function LessonPage({ params }: { params: Promise<{ id: string, lessonId: string }> }) {
  const { id, lessonId } = use(params);
  
  const [lessons, setLessons] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { ttsEnabled } = useAccessibility();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user.id;

        const result = await getLessons(id);
        if (result.data) {
          setLessons(result.data);
          const lesson = result.data.find((l: any) => l.id === lessonId);
          setCurrentLesson(lesson);
        }

        // Check if already completed
        if (userId) {
          const { data } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .single();
          if (data?.is_completed) setIsCompleted(true);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await completeLesson(session.user.id, lessonId);
      if (res.success) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
    </div>
  );

  if (!currentLesson) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-4">Урок не найден</h2>
      <Link href={`/courses/${id}`} className="text-[var(--color-primary-light)] underline">Вернуться к курсу</Link>
    </div>
  );

  // Simple YouTube ID extractor
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://www.youtube.com/embed/${id}` : url;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Link href={`/courses/${id}`} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-primary-light)] transition-colors font-semibold">
          <ArrowLeft size={20} />
          Назад к списку уроков
        </Link>
        <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-full shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Онлайн обучение</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-2xl relative group">
            {currentLesson.video_url ? (
              <iframe 
                src={getEmbedUrl(currentLesson.video_url) || ""} 
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] space-y-4">
                <Play size={64} className="opacity-20" />
                <p>Видеоматериал отсутствует</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
            <h1 className="font-display text-3xl font-bold mb-6">{currentLesson.title}</h1>
            <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed space-y-4">
              {currentLesson.content.split('\n').map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--text-muted)]">Статус урока:</span>
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                    <CheckCircle size={14} /> ЗАВЕРШЕНО
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--bg-card2)] text-[var(--text-muted)] rounded-full text-xs font-bold border border-[var(--border-color)]">
                    В ПРОЦЕССЕ
                  </span>
                )}
              </div>

              <button 
                onClick={handleComplete}
                disabled={isCompleted || completing}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95
                  ${isCompleted 
                    ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-default' 
                    : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white hover:shadow-[0_0_30px_rgba(108,58,232,0.4)]'
                  }
                  ${completing ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                {isCompleted ? "Урок завершен" : (completing ? "Загрузка..." : "Завершить урок")}
                <CheckCircle size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar / Playlist */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm sticky top-24">
            <h3 className="font-display font-bold text-xl mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full" />
              Содержание курса
            </h3>
            <div className="space-y-3">
              {lessons.map((lesson, idx) => (
                <Link 
                  key={lesson.id}
                  href={`/courses/${id}/${lesson.id}`}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group
                    ${lesson.id === lessonId 
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary-light)]' 
                      : 'bg-[var(--bg-card2)] border-transparent hover:border-[var(--border-color)] text-[var(--text-secondary)]'
                    }
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                    ${lesson.id === lessonId ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-card)]'}
                  `}>
                    {lesson.order_index || idx + 1}
                  </div>
                  <span className="flex-1 text-sm font-semibold truncate">{lesson.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

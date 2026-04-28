"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { getLessons } from "@/app/actions";

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url: string;
  order_index: number;
}

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true);
      try {
        const result = await getLessons(id);
        if (result.error) throw new Error(result.error);
        if (result.data) {
          setLessons(result.data);
        }
      } catch (err: any) {
        console.error(err);
        setError("Не удалось загрузить уроки. " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [id]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--color-primary-light)] transition-colors mb-6 font-semibold">
          <ArrowLeft size={20} />
          Назад к курсам
        </Link>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-sm">
          <h1 className="font-display text-3xl font-bold mb-4">Уроки курса</h1>
          <p className="text-[var(--text-secondary)] mb-6">
            Изучайте материалы последовательно. Вы всегда можете вернуться к предыдущим урокам.
          </p>
          
          <div className="h-3 w-full bg-[var(--bg-card2)] rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full w-1/4" />
          </div>
          <p className="text-right text-xs font-semibold text-[var(--text-muted)]">Прогресс: 25%</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-2xl font-bold mb-4">Программа</h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
            <p className="text-[var(--text-secondary)]">Загрузка уроков...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-2xl text-center">
            {error}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <span className="text-4xl block mb-4">📭</span>
            <p>В этом курсе пока нет уроков</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, idx) => (
              <Link 
                href={`/courses/${id}/${lesson.id}`}
                key={lesson.id} 
                className="flex items-start gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl hover:border-[var(--color-primary)] transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 bg-[var(--bg-card2)] rounded-xl flex items-center justify-center font-bold text-[var(--color-primary-light)] text-lg shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                  {lesson.order_index || idx + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-bold text-lg mb-2">{lesson.title}</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">{lesson.content}</p>
                  {lesson.video_url && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] rounded-lg font-semibold text-sm group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                      <PlayCircle size={18} />
                      Смотреть видеоурок
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

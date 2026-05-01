"use server";

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = 'https://jtubizlrigutrhwcdmqd.supabase.co';
const supabaseKey = 'sb_secret_cm8cHWAy5Nk3IDyY5HJ35g_eqj3e4tO';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getCourses() {
  try {
    const { data, error } = await supabase.from('courses').select('*');
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getLessons(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .or(`course_id.eq.${courseId},course_id.is.null`)
      .order('order_index');
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function completeLesson(userId: string, lessonId: string) {
  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert({ 
        user_id: userId, 
        lesson_id: lessonId, 
        is_completed: true,
        last_watched: new Date().toISOString()
      }, { onConflict: 'user_id,lesson_id' });
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getUserProgress(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)
      .eq('is_completed', true);
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getProfile(id: string) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function updateProfile(id: string, updates: any) {
  try {
    // Map our state to the actual Supabase DB columns
    const dbPayload: any = { id, updated_at: new Date().toISOString() };
    
    if (updates.high_contrast !== undefined) dbPayload.high_contrast = updates.high_contrast;
    if (updates.dyslexia_font !== undefined) dbPayload.dyslexic_font = updates.dyslexia_font;
    if (updates.large_font !== undefined) dbPayload.font_size = updates.large_font ? 'large' : 'normal';

    const { error } = await supabase.from('profiles').upsert(dbPayload);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function logChatMessage(content: string, role: string, moduleType: string, userId?: string) {
  try {
    const { error } = await supabase.from('chat_history').insert({
      content,
      role,
      module_type: moduleType,
      user_id: userId
    });
    if (error) return { error: error.message };
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getChatHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getAIActivityCount(userId: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count, error } = await supabase
      .from('chat_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());
      
    if (error) return { error: error.message };
    return { count: count || 0 };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function getLastStudiedLesson(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('lesson_id, lessons(title, course_id)')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('last_watched', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.includes('JSON object')) return { data: null }; // No data found
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}
export async function getGesturesLibrary() {
  try {
    const { data, error } = await supabase.from('gestures_library').select('*');
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

export async function seedGestures() {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) return { error: "GEMINI_KEY is not defined in environment variables" };
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const coreWords = [
    { ru: "Привет", kk: "Сәлем", cat: "Базовые фразы" },
    { ru: "Спасибо", kk: "Рақмет", cat: "Базовые фразы" },
    { ru: "Помощь", kk: "Көмек", cat: "Базовые фразы" },
    { ru: "Мама", kk: "Ана", cat: "Семья" },
    { ru: "Папа", kk: "Әке", cat: "Семья" },
    { ru: "Я тебя люблю", kk: "Мен се canі жақсы көремін", cat: "Эмоции" },
    { ru: "Вода", kk: "Су", cat: "Еда и напитки" },
    { ru: "Еда", kk: "Тамақ", cat: "Еда и напитки" },
    { ru: "Да", kk: "Иә", cat: "Базовые фразы" },
    { ru: "Нет", kk: "Жоқ", cat: "Базовые фразы" },
  ];

  const kazakhDactyl = [
    { letter: "Ә", slug: "ae" }, { letter: "Ғ", slug: "gh" }, 
    { letter: "Қ", slug: "q" }, { letter: "Ң", slug: "ng" }, 
    { letter: "Ө", slug: "oe" }, { letter: "Ұ", slug: "u_short" }, 
    { letter: "Ү", slug: "u_long" }, { letter: "Һ", slug: "h" }, { letter: "І", slug: "i_short" }
  ];

  const entries: any[] = [];

  // Process core words
  for (const item of coreWords) {
    // RU version
    entries.push({
      word: item.ru.toLowerCase(),
      language: 'ru',
      category: item.cat,
      video_url: `https://qabilet-storage.s3.amazonaws.com/gestures/ru/${item.ru.toLowerCase()}.mp4`,
    });
    // KK version
    entries.push({
      word: item.kk.toLowerCase(),
      language: 'kk',
      category: item.cat,
      video_url: `https://qabilet-storage.s3.amazonaws.com/gestures/kk/${item.kk.toLowerCase()}.mp4`,
    });
  }

  // Process Kazakh Dactyl
  for (const item of kazakhDactyl) {
    entries.push({
      word: item.letter,
      language: 'kk',
      category: 'Алфавит',
      video_url: `https://qabilet-storage.s3.amazonaws.com/gestures/kk/dactyl/${item.slug}.mp4`,
    });
  }

  try {
    const { error } = await supabase.from('gestures_library').upsert(entries, { onConflict: 'word,language' });
    if (error) throw error;
    return { success: true, count: entries.length };
  } catch (err: any) {
    console.error("Seeding error:", err);
    return { error: err.message };
  }
}

export async function saveGesturePattern(word: string, category: string, pattern_json: any[]) {
  try {
    // Check if word exists
    const { data: existing, error: fetchError } = await supabase
      .from('gestures_library')
      .select('id')
      .eq('word', word)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { error: fetchError.message };
    }

    if (existing) {
      const { error } = await supabase
        .from('gestures_library')
        .update({ pattern_json, category })
        .eq('id', existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('gestures_library')
        .insert({ word, category, pattern_json });
      if (error) return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error" };
  }
}

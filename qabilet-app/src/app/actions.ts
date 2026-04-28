"use server";

import { createClient } from '@supabase/supabase-js';

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

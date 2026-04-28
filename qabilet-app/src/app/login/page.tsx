"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { UserCircle, Mail, Lock, LogIn, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success", text: string } | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = "/"; // redirect to dashboard
      }
    });
  }, []);

  const handleAuth = async (isLogin: boolean) => {
    if (!email || !password) {
      setMessage({ type: "error", text: "Пожалуйста, введите Email и пароль." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: "success", text: "Регистрация успешна! Проверьте email (если включено подтверждение), либо сразу войдите." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Ошибка авторизации" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-xl relative overflow-hidden group">
        
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] opacity-10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:opacity-20 group-hover:scale-150"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[var(--color-primary-light)] to-[#06B6D4] opacity-10 rounded-full blur-3xl -ml-16 -mb-16 transition-all duration-700 group-hover:opacity-20 group-hover:scale-150"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl mb-4 text-white shadow-lg">
              <UserCircle size={32} />
            </div>
            <h1 className="font-display text-2xl font-bold">Вход в систему</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Получите доступ к вашим курсам и прогрессу
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 text-sm font-medium border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-green-500/10 border-green-500/30 text-green-500'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-card2)] border border-[var(--border-color)] rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--text-muted)]"
                  placeholder="ваш@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5 ml-1">Пароль</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-card2)] border border-[var(--border-color)] rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder:text-[var(--text-muted)]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={() => handleAuth(true)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-light)] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(108,58,232,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Загрузка..." : (
                  <>
                    <LogIn size={20} />
                    Войти
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleAuth(false)}
                disabled={loading}
                className="w-full bg-[var(--bg-card2)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold py-3.5 rounded-xl hover:bg-[var(--surface)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Загрузка..." : "Зарегистрироваться"}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

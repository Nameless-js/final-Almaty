"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getProfile, updateProfile } from "@/app/actions";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";

type Theme = "default" | "blue" | "green" | "dark";

interface AccessibilityContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  largeFont: boolean;
  setLargeFont: (val: boolean) => void;
  dyslexiaFont: boolean;
  setDyslexiaFont: (val: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (val: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextProps | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("default");
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isLoaded = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Get session from Supabase
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== '/login') {
        router.push('/login');
        return;
      }
      
      if (session) {
        setProfileId(session.user.id);
      }
      setSessionLoaded(true);
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setProfileId(session.user.id);
      } else if (pathname !== '/login') {
        router.push('/login');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Load accessibility settings from Supabase ONLY when profileId is ready
  useEffect(() => {
    if (!profileId || isLoaded.current) return;

    // Fetch profile from supabase
    const fetchProfile = async () => {
      const res = await getProfile(profileId);
      if (res.data) {
        const data = res.data;
        if (data.high_contrast !== null) setHighContrast(data.high_contrast);
        if (data.font_size === 'large') setLargeFont(true);
        if (data.dyslexic_font !== null) setDyslexiaFont(data.dyslexic_font);
      } else {
        // First time login - Create empty profile to avoid errors later
        updateProfile(profileId, {});
      }
      isLoaded.current = true;
    };

    fetchProfile();
  }, [profileId]);

  // Sync to HTML classes and save to Supabase when settings change
  useEffect(() => {
    if (!isLoaded.current) return;

    const html = document.documentElement;
    html.className = "";
    if (theme !== "default") html.classList.add(`theme-${theme}`);
    if (highContrast) html.classList.add("high-contrast");
    if (largeFont) html.classList.add("large-font");
    if (dyslexiaFont) html.classList.add("dyslexia-font");

    // Save to Supabase
    if (profileId) {
      updateProfile(profileId, {
        theme,
        high_contrast: highContrast,
        large_font: largeFont,
        dyslexia_font: dyslexiaFont,
        tts_enabled: ttsEnabled
      }).then((res) => {
        if (res.error) console.error("Error saving profile:", res.error);
      });
    }

  }, [theme, highContrast, largeFont, dyslexiaFont, ttsEnabled, profileId]);

  if (!sessionLoaded && pathname !== '/login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme,
        highContrast,
        setHighContrast,
        largeFont,
        setLargeFont,
        dyslexiaFont,
        setDyslexiaFont,
        ttsEnabled,
        setTtsEnabled,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}

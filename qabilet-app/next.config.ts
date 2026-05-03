import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean production config
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            // Optimized CSP for Vercel production: allows MediaPipe, Supabase, and PeerJS
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://cdn.jsdelivr.net https://*.peerjs.com wss://*.peerjs.com; worker-src 'self' blob:; frame-src 'self'; media-src 'self' blob: data:;"
          }
        ]
      }
    ];
  }
};

export default nextConfig;

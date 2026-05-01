"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, Results } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import { Video, Info, Hand, AlertCircle } from "lucide-react";

export default function GesturesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState("Инициализация камеры...");
  const [handDetected, setHandDetected] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      const canvasCtx = canvasRef.current!.getContext("2d")!;
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      
      // Draw video frame to canvas first (optional, but good for mirror effect)
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current!.width, canvasRef.current!.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        setHandDetected(true);
        setStatus("Рука обнаружена. Анализирую жест...");
        
        for (const landmarks of results.multiHandLandmarks) {
          drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: "#8B5CF6",
            lineWidth: 4,
          });
          drawLandmarks(canvasCtx, landmarks, {
            color: "#E879F9",
            lineWidth: 1,
            radius: 4,
          });
        }
      } else {
        setHandDetected(false);
        setStatus("Камера не видит рук");
      }
      canvasCtx.restore();
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({ image: videoRef.current! });
      },
      width: 640,
      height: 480,
    });

    camera.start().then(() => {
      setIsCameraActive(true);
      setStatus("Камера активна. Покажите руку.");
    }).catch(err => {
      console.error(err);
      setStatus("Ошибка доступа к камере");
    });

    return () => {
      camera.stop();
      hands.close();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto relative">

      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-80 h-64 pointer-events-none -z-0"
        style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)' }}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10 pt-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold mb-2">AI визия</p>
          <h2 className="font-display text-3xl md:text-4xl font-black mb-1">Переводчик <span className="gradient-text">жестов</span></h2>
          <p className="text-[var(--text-secondary)] text-sm">Интеллектуальная система распознавания жестового языка</p>
        </div>
        <div
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-500 shrink-0"
          style={handDetected ? {
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            boxShadow: '0 0 20px rgba(52,211,153,0.15)',
          } : {
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Hand
            size={18}
            style={{ color: handDetected ? '#34D399' : 'var(--text-muted)' }}
            className={handDetected ? 'animate-bounce' : ''}
          />
          <span
            className="font-bold text-sm uppercase tracking-wider"
            style={{ color: handDetected ? '#34D399' : 'var(--text-secondary)' }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Camera Feed */}
        <div
          className="lg:col-span-2 relative aspect-video rounded-3xl overflow-hidden"
          style={{
            background: '#000',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)',
          }}
        >
          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover mirror" width="640" height="480" />

          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ border: '2px solid rgba(124,58,237,0.3)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}
              />
              <p className="font-display font-bold text-lg text-white tracking-wide">Запуск нейронной сети MediaPipe...</p>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
            <div
              className="px-3 py-1.5 rounded-xl text-[10px] font-mono"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            >
              AI VISION • HAND_LANDMARKS_V2
            </div>
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={isCameraActive ? {
                background: '#22c55e',
                boxShadow: '0 0 10px #22c55e',
              } : { background: '#ef4444' }}
            />
          </div>
        </div>

        {/* Info & Results */}
        <div className="space-y-5">
          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)' }}
            />
            <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
              <Info size={17} className="text-[var(--color-primary-light)]" />
              Инструкция
            </h3>
            <ul className="space-y-3">
              {[
                'Убедитесь, что ваше лицо и руки хорошо освещены.',
                'Поместите ладонь полностью в рамку камеры.',
                'Система автоматически отрисует скелет вашей руки.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs"
                    style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      color: 'var(--color-primary-light)',
                    }}
                  >{i + 1}</span>
                  <span className="text-[var(--text-secondary)] leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative overflow-hidden rounded-3xl p-6"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            }}
          >
            <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none">
              <Hand size={80} color="white" />
            </div>
            <div className="relative z-10">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <Info size={16} color="white" />
              </div>
              <h4 className="font-bold text-base mb-2 text-white">Технология MediaPipe</h4>
              <p className="text-white/75 text-xs leading-relaxed">
                Мы используем передовые алгоритмы Google для отслеживания 21 ключевой точки ладони в 3D пространстве.
              </p>
            </div>
          </div>

          {!isCameraActive && (
            <div
              className="p-4 rounded-2xl flex gap-3 text-sm"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#FCD34D',
              }}
            >
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <p>Разрешите браузеру доступ к камере, чтобы запустить переводчик.</p>
            </div>
          )}
        </div>

      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold mb-2">Переводчик жестов</h2>
          <p className="text-[var(--text-secondary)]">Интеллектуальная система распознавания жестового языка</p>
        </div>
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all duration-300
          ${handDetected ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-secondary)]'}
        `}>
          <Hand className={handDetected ? "animate-bounce" : ""} size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Camera Feed */}
        <div className="lg:col-span-2 relative aspect-video bg-black rounded-3xl overflow-hidden border-2 border-[var(--border-color)] shadow-2xl group">
          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-cover mirror" width="640" height="480" />
          
          {!isCameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-8 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="font-medium">Запуск нейронной сети MediaPipe...</p>
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white text-xs font-mono">
              AI VISION ENABLED: HAND_LANDMARKS_V2
            </div>
            <div className="flex gap-2">
              <div className={`w-3 h-3 rounded-full ${isCameraActive ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
            </div>
          </div>
        </div>

        {/* Info & Results */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Info size={20} className="text-[var(--color-primary-light)]" />
              Инструкция
            </h3>
            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] flex items-center justify-center shrink-0 font-bold">1</span>
                <span>Убедитесь, что ваше лицо и руки хорошо освещены.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] flex items-center justify-center shrink-0 font-bold">2</span>
                <span>Поместите ладонь полностью в рамку камеры.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] flex items-center justify-center shrink-0 font-bold">3</span>
                <span>Система автоматически отрисует скелет вашей руки.</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Hand size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Технология MediaPipe</h4>
              <p className="text-white/80 text-xs leading-relaxed">
                Мы используем передовые алгоритмы машинного зрения Google для отслеживания 21 ключевой точки ладони в 3D пространстве.
              </p>
            </div>
          </div>

          {!isCameraActive && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex gap-3 text-amber-500 text-sm italic">
              <AlertCircle size={18} className="shrink-0" />
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

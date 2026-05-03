"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useFBX, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

interface SignRobotProps {
  currentWord: string | null;
}

const WORD_TO_ANIM_MAP: Record<string, string[]> = {
  "привет": ["robotarmature|robot_wave"],
  "пока": ["robotarmature|robot_wave"],
  "да": ["robotarmature|robot_yes"],
  "нет": ["robotarmature|robot_no"],
  "супер": ["robotarmature|robot_thumbsup"],
  "класс": ["robotarmature|robot_thumbsup"],
  "спасибо": ["robotarmature|robot_thumbsup"],
  "танцуй": ["robotarmature|robot_dance"],
  "прыгай": ["robotarmature|robot_jump"],
  "иди": ["robotarmature|robot_walking"],
  "беги": ["robotarmature|robot_running"],
  "бей": ["robotarmature|robot_punch"],
  "сидеть": ["robotarmature|robot_sitting"],
  "встань": ["robotarmature|robot_standing"],
};

function AvatarModel({ currentWord }: SignRobotProps) {
  const fbx = useFBX("/models/avatar.fbx");
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const actionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({});
  const [activeAction, setActiveAction] = useState<THREE.AnimationAction | null>(null);

  // Suppress annoying Three.js warnings about vertex weights
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Vertex has more than 4 skinning weights')) return;
      originalWarn(...args);
    };
    return () => { console.warn = originalWarn; };
  }, []);

  useEffect(() => {
    if (fbx) {
      mixerRef.current = new THREE.AnimationMixer(fbx);
      
      // Map all animations
      fbx.animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip);
        actionsRef.current[clip.name.toLowerCase()] = action;
        // Also map by index if name is cryptic
      });

      // Default/Idle animation
      const idle = fbx.animations[0] ? mixerRef.current.clipAction(fbx.animations[0]) : null;
      if (idle) {
        idle.play();
        setActiveAction(idle);
      }

      console.log("ВНИМАНИЕ! Доступные анимации в FBX:", Object.keys(actionsRef.current));

      fbx.scale.setScalar(0.0045); 
      fbx.position.y = -1.2;
    }
  }, [fbx]);

  // Logic to switch animations based on word
  useEffect(() => {
    if (!mixerRef.current || !currentWord) return;

    const word = currentWord.toLowerCase().trim();
    const cleanWord = word.replace(/[.,!?]/g, "");

    console.log("🤖 Пытаемся анимировать слово:", cleanWord);

    let targetAnimName = cleanWord;
    
    // Check our map for known Russian words to English animation names
    if (WORD_TO_ANIM_MAP[cleanWord]) {
      const possibleAnims = WORD_TO_ANIM_MAP[cleanWord];
      for (const anim of possibleAnims) {
        if (actionsRef.current[anim]) {
          targetAnimName = anim;
          break;
        }
      }
    }

    // Try to find exact match or fallback
    let targetAction = actionsRef.current[targetAnimName] 
      || actionsRef.current['mixamo.com'] 
      || Object.values(actionsRef.current)[0];

    if (targetAction && targetAction !== activeAction) {
      if (activeAction) activeAction.fadeOut(0.3);
      targetAction.reset().fadeIn(0.3).play();
      setActiveAction(targetAction);

      // Return to idle after animation (if it's not the idle one)
      const duration = targetAction.getClip().duration;
      const timeout = setTimeout(() => {
        const idle = Object.values(actionsRef.current)[0];
        if (idle && idle !== targetAction) {
          targetAction.fadeOut(0.5);
          idle.reset().fadeIn(0.5).play();
          setActiveAction(idle);
        }
      }, duration * 1000 + 500);

      return () => clearTimeout(timeout);
    }
  }, [currentWord, fbx]);

  useFrame((state, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta);
    if (groupRef.current && currentWord) {
      // Subtle head/body movement for "active" state
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={fbx} />
    </group>
  );
}

function PlaceholderRobot({ currentWord }: SignRobotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (currentWord) meshRef.current.scale.setScalar(1.2 + Math.sin(state.clock.elapsedTime * 10) * 0.1);
      else meshRef.current.scale.setScalar(1);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, -0.2, 0]}>
      <boxGeometry args={[1, 1.4, 0.4]} />
      <meshStandardMaterial color="#8B5CF6" emissive="#4C1D95" emissiveIntensity={0.5} />
    </mesh>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

export default function SignRobot({ currentWord }: SignRobotProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[var(--bg-card)]/30 to-black/90 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl relative">
      <Canvas shadows camera={{ position: [0, 0.8, 2.5], fov: 35 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
        
        <ErrorBoundary fallback={<PlaceholderRobot currentWord={currentWord} />}>
          <Suspense fallback={<PlaceholderRobot currentWord={currentWord} />}>
            <AvatarModel currentWord={currentWord} />
          </Suspense>
        </ErrorBoundary>

        <ContactShadows opacity={0.4} scale={5} blur={2} far={4} resolution={256} color="#000000" />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/2.5} maxPolarAngle={Math.PI/2} />
      </Canvas>
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${currentWord ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
          <p className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em]">AI Interpreter Active</p>
        </div>
      </div>

      {currentWord && (
        <div className="absolute bottom-4 inset-x-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="bg-[#6C3AE8]/20 backdrop-blur-2xl border border-[#6C3AE8]/40 p-3 rounded-2xl text-center shadow-[0_0_30px_rgba(108,58,232,0.3)]">
            <p className="text-[10px] text-[#A78BFA] font-black uppercase tracking-widest mb-1">Распознано слово</p>
            <p className="text-xl font-black text-white tracking-tight">{currentWord}</p>
          </div>
        </div>
      )}
    </div>
  );
}

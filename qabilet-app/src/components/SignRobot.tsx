"use client";

import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useFBX, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

interface SignRobotProps {
  currentWord: string | null;
  showStatus?: boolean;
}

const WORD_TO_ANIM_MAP: Record<string, string[]> = {
  // Приветствия
  "привет": ["robotarmature|robot_wave"],
  "пока": ["robotarmature|robot_wave"],
  "hello": ["robotarmature|robot_wave"],
  "hi": ["robotarmature|robot_wave"],
  "hey": ["robotarmature|robot_wave"],
  "goodbye": ["robotarmature|robot_wave"],
  "bye": ["robotarmature|robot_wave"],
  "see you": ["robotarmature|robot_wave"],

  // Согласие/Отказ
  "да": ["robotarmature|robot_yes"],
  "yes": ["robotarmature|robot_yes"],
  "yeah": ["robotarmature|robot_yes"],
  "yep": ["robotarmature|robot_yes"],
  "ok": ["robotarmature|robot_yes"],
  "нет": ["robotarmature|robot_no"],
  "no": ["robotarmature|robot_no"],
  "not": ["robotarmature|robot_no"],
  "nope": ["robotarmature|robot_no"],
  "nah": ["robotarmature|robot_no"],
  "don't know": ["robotarmature|robot_no"],
  "не знаю": ["robotarmature|robot_no"],

  // Одобрение
  "супер": ["robotarmature|robot_thumbsup"],
  "класс": ["robotarmature|robot_thumbsup"],
  "спасибо": ["robotarmature|robot_thumbsup"],
  "хорошо": ["robotarmature|robot_thumbsup"],
  "плохо": ["robotarmature|robot_no"],
  "super": ["robotarmature|robot_thumbsup"],
  "cool": ["robotarmature|robot_thumbsup"],
  "thanks": ["robotarmature|robot_thumbsup"],
  "thank you": ["robotarmature|robot_thumbsup"],
  "good": ["robotarmature|robot_thumbsup"],
  "awesome": ["robotarmature|robot_thumbsup"],
  "great": ["robotarmature|robot_thumbsup"],

  // Действия
  "танцуй": ["robotarmature|robot_dance"],
  "dance": ["robotarmature|robot_dance"],
  "прыгай": ["robotarmature|robot_jump"],
  "jump": ["robotarmature|robot_jump"],
  "иди": ["robotarmature|robot_walking"],
  "walk": ["robotarmature|robot_walking"],
  "беги": ["robotarmature|robot_running"],
  "run": ["robotarmature|robot_running"],
  "бей": ["robotarmature|robot_punch"],
  "punch": ["robotarmature|robot_punch"],
  "сидеть": ["robotarmature|robot_sitting"],
  "sit": ["robotarmature|robot_sitting"],
  "встань": ["robotarmature|robot_standing"],
  "stand": ["robotarmature|robot_standing"],
};

function AvatarModel({ currentWord }: SignRobotProps) {
  const fbx = useFBX("/models/avatar.fbx");
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const actionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({});
  const headRef = useRef<THREE.Object3D | null>(null);
  const leftArmRef = useRef<THREE.Object3D | null>(null);
  const leftForeArmRef = useRef<THREE.Object3D | null>(null);
  const leftHandRef = useRef<THREE.Object3D | null>(null);
  const rightArmRef = useRef<THREE.Object3D | null>(null);
  const rightForeArmRef = useRef<THREE.Object3D | null>(null);
  const rightHandRef = useRef<THREE.Object3D | null>(null);
  
  // Target rotations for procedural signing
  const targetsRef = useRef<{ [key: string]: THREE.Euler }>({
    leftArm: new THREE.Euler(),
    leftForeArm: new THREE.Euler(),
    leftHand: new THREE.Euler(),
    rightArm: new THREE.Euler(),
    rightForeArm: new THREE.Euler(),
    rightHand: new THREE.Euler(),
  });

  const [isSigning, setIsSigning] = useState(false);
  const [activeAction, setActiveAction] = useState<THREE.AnimationAction | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Procedural Rotation State (to avoid mixer override loops)
  const procRotRef = useRef<{ [key: string]: THREE.Euler }>({
    leftArm: new THREE.Euler(),
    leftForeArm: new THREE.Euler(),
    leftHand: new THREE.Euler(),
    rightArm: new THREE.Euler(),
    rightForeArm: new THREE.Euler(),
    rightHand: new THREE.Euler(),
  });

  // Suppress annoying Three.js warnings
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = args[0];
      if (typeof msg === 'string' && (
        msg.includes('Vertex has more than 4 skinning weights') || 
        msg.includes('THREE.Clock: This module has been deprecated')
      )) return;
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
      });

      // Find Bones for procedural rotation
      fbx.traverse((child) => {
        if ((child as any).isSkinnedMesh) {
          child.frustumCulled = false;
        }

        if (child.type === 'Bone') {
          const name = child.name.toLowerCase();
          child.matrixAutoUpdate = true; // Ensure manual control is possible
          
          // Head
          if (name.includes('head')) headRef.current = child;
          else if (!headRef.current && name.includes('neck')) headRef.current = child;

          // Left Arm Chain (Shoulder -> Arm -> ForeArm -> Hand)
          if (name.includes('left')) {
            if (name.includes('shoulder')) leftArmRef.current = child;
            else if (name.includes('arm') && !name.includes('fore')) leftArmRef.current = child;
            else if (name.includes('forearm')) leftForeArmRef.current = child;
            else if (name.includes('hand')) leftHandRef.current = child;
          }

          // Right Arm Chain
          if (name.includes('right')) {
            if (name.includes('shoulder')) rightArmRef.current = child;
            else if (name.includes('arm') && !name.includes('fore')) rightArmRef.current = child;
            else if (name.includes('forearm')) rightForeArmRef.current = child;
            else if (name.includes('hand')) rightHandRef.current = child;
          }
        }
      });

      // Default/Idle animation
      const idle = fbx.animations[0] ? mixerRef.current.clipAction(fbx.animations[0]) : null;
      if (idle) {
        idle.play();
        setActiveAction(idle);
      }

      fbx.scale.setScalar(0.0045); 
      fbx.position.y = -1.2;
    }
  }, [fbx]);

  // Pseudo-Sign Language Generator
  const playRandomSignGesture = () => {
    if (!currentWord) return;
    setIsSigning(true);
    
    let steps = 0;
    const maxSteps = 1000;
    
    const nextStep = () => {
      // Use ref to check if we should still be running
      if (timeoutRef.current === null) return;

      // Wide active ranges
      targetsRef.current.leftArm.set(Math.random() * 1.2 - 0.6, Math.random() * 1.2 - 0.6, -1.0 - Math.random() * 0.8);
      targetsRef.current.leftForeArm.set(0, 0.5 + Math.random() * 1.5, 0);
      targetsRef.current.leftHand.set(Math.random() * 1.5 - 0.7, Math.random() * 1.5 - 0.7, 0);
      
      targetsRef.current.rightArm.set(Math.random() * 1.2 - 0.6, Math.random() * 1.2 - 0.6, 1.0 + Math.random() * 0.8);
      targetsRef.current.rightForeArm.set(0, 0.5 + Math.random() * 1.5, 0);
      targetsRef.current.rightHand.set(Math.random() * 1.5 - 0.7, Math.random() * 1.5 - 0.7, 0);

      steps++;
      timeoutRef.current = setTimeout(nextStep, 300 + Math.random() * 400); 
    };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(nextStep, 10);
  };

  // Logic to switch animations based on word
  useEffect(() => {
    // Cleanup previous procedural loop
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    if (!mixerRef.current || !currentWord) {
        setIsSigning(false);
        return;
    }
    const word = currentWord.toLowerCase().trim();
    const cleanWord = word.replace(/[.,!?]/g, "");

    let targetAnimName = "";
    if (WORD_TO_ANIM_MAP[cleanWord]) {
      targetAnimName = WORD_TO_ANIM_MAP[cleanWord][0];
      setIsSigning(false); 
    } else {
      targetAnimName = "";
      playRandomSignGesture(); 
    }

    const targetAction = targetAnimName ? (actionsRef.current[targetAnimName] 
      || actionsRef.current['mixamo.com'] 
      || Object.values(actionsRef.current)[0]) : null;

    if (targetAction && targetAction !== activeAction) {
      targetAction.timeScale = 1.0;
      targetAction.loop = THREE.LoopRepeat;
      targetAction.clampWhenFinished = false;
      
      if (activeAction) {
        targetAction.reset().play();
        activeAction.crossFadeTo(targetAction, 0.4, true);
      } else {
        targetAction.play();
      }
      setActiveAction(targetAction);
    } else if (!targetAction && activeAction) {
        const idle = Object.values(actionsRef.current)[0];
        if (idle && idle !== activeAction) {
            idle.timeScale = 1.0;
            activeAction.crossFadeTo(idle, 0.6, true);
            idle.reset().play();
            setActiveAction(idle);
        }
    }

    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };
  }, [currentWord, fbx]);

  useFrame((state, delta) => {
    // 1. UPDATE MIXER FIRST (baked animation)
    if (mixerRef.current) mixerRef.current.update(delta);
    
    // 2. REDUCE MIXER WEIGHT DURING SIGNING (Blending)
    if (activeAction) {
      // If signing, make the baked animation subtle (0% weight) so procedural wins
      const targetWeight = isSigning ? 0 : 1.0;
      activeAction.setEffectiveWeight(THREE.MathUtils.lerp(activeAction.getEffectiveWeight(), targetWeight, 0.15));
    }

    const { mouse, clock } = state;
    const time = clock.elapsedTime;

    // 2. Head Rotation
    if (headRef.current) {
      const targetY = THREE.MathUtils.clamp(mouse.x * 0.6, -0.5, 0.5);
      const targetX = THREE.MathUtils.clamp(-mouse.y * 0.4, -0.3, 0.3);
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.1);
    }

    // 3. Procedural Arms (OVERRIDE Animation Mixer ONLY during procedural signing)
    const lerpSpeed = isSigning ? 0.25 : 0.08; 

    const updateProcBone = (key: string, bone: THREE.Object3D | null, target: THREE.Euler, defaultZ: number) => {
      if (!bone) return;
      
      const current = procRotRef.current[key];
      
      if (isSigning) {
        current.x = THREE.MathUtils.lerp(current.x, target.x, lerpSpeed);
        current.y = THREE.MathUtils.lerp(current.y, target.y, lerpSpeed);
        current.z = THREE.MathUtils.lerp(current.z, target.z, lerpSpeed);

        // ONLY override if signing
        bone.rotation.set(current.x, current.y, current.z);
        bone.updateMatrixWorld();
      } else {
        // When using baked animation, we reset the procRotRef but DON'T override bone.rotation
        // This allows the AnimationMixer to control the bones fully
        current.x = THREE.MathUtils.lerp(current.x, 0, 0.1);
        current.y = THREE.MathUtils.lerp(current.y, 0, 0.1);
        current.z = THREE.MathUtils.lerp(current.z, defaultZ, 0.1);
      }
    };

    updateProcBone('leftArm', leftArmRef.current, targetsRef.current.leftArm, -0.1);
    updateProcBone('leftForeArm', leftForeArmRef.current, targetsRef.current.leftForeArm, 0);
    updateProcBone('leftHand', leftHandRef.current, targetsRef.current.leftHand, 0);

    updateProcBone('rightArm', rightArmRef.current, targetsRef.current.rightArm, 0.1);
    updateProcBone('rightForeArm', rightForeArmRef.current, targetsRef.current.rightForeArm, 0);
    updateProcBone('rightHand', rightHandRef.current, targetsRef.current.rightHand, 0);

    if (groupRef.current && currentWord) {
      groupRef.current.rotation.y = Math.sin(time * 2) * 0.03;
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

export default function SignRobot({ currentWord, showStatus = true }: SignRobotProps) {
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
      
      {showStatus && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${currentWord ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
            <p className="text-[7px] font-black text-white/60 uppercase tracking-[0.3em]">AI Interpreter Active</p>
          </div>
        </div>
      )}

      {showStatus && currentWord && (
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


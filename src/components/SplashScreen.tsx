'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [stage, setStage] = useState<'enter' | 'pulse' | 'exit' | 'hidden'>('enter');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Stage 1: Enter & Progress fill
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 70);

    const pulseTimer = setTimeout(() => {
      setStage('pulse');
    }, 800);

    // Stage 2: Exit fade-out animation
    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 2200);

    // Stage 3: Complete & unmount
    const finishTimer = setTimeout(() => {
      setStage('hidden');
      if (onFinish) onFinish();
    }, 2900);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(pulseTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-all duration-700 ease-out ${
        stage === 'exit'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated CMYK Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Cyan Glow (Top Left) */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" />
        {/* Magenta Glow (Top Right) */}
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-pink-500/20 rounded-full blur-[100px] animate-pulse delay-500" />
        {/* Yellow Glow (Bottom) */}
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-amber-400/15 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Main Logo & Animated Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        
        {/* Logo Card with Rotating Gradient Border */}
        <div className="relative group mb-8">
          {/* Animated CMYK Halo Ring */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 opacity-70 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-spin-slow" />

          {/* Logo Frame */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white p-3 shadow-2xl shadow-sky-500/30 flex items-center justify-center transform transition-transform duration-500 hover:scale-105">
            <Image
              src="/logo.png"
              alt="PRINT OPTION Logo"
              width={160}
              height={160}
              priority
              className="object-contain rounded-2xl w-full h-full animate-in zoom-in-75 duration-700"
            />
          </div>
        </div>

        {/* Brand Name with Staggered Fade Up */}
        <div className="space-y-2 max-w-sm">
          <h1 className="text-3xl sm:text-4xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-sm uppercase">
            PRINT OPTION
          </h1>

          <div className="flex items-center justify-center gap-2">
            <div className="h-0.5 w-8 bg-gradient-to-r from-transparent to-cyan-400 rounded-full" />
            <p className="text-xs sm:text-sm tracking-[0.25em] text-slate-300 font-light uppercase">
              We Print. You Shine.
            </p>
            <div className="h-0.5 w-8 bg-gradient-to-l from-transparent to-pink-400 rounded-full" />
          </div>
        </div>

        {/* Sleek Progress Bar */}
        <div className="mt-8 w-60 sm:w-72">
          <div className="h-1.5 w-full bg-slate-900/90 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 transition-all duration-150 ease-out rounded-full shadow-lg shadow-cyan-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[10px] uppercase font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              Loading System...
            </span>
            <span className="font-bold text-slate-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Skip Button (Bottom Right) */}
      <button
        onClick={() => {
          setStage('exit');
          setTimeout(() => {
            setStage('hidden');
            if (onFinish) onFinish();
          }, 300);
        }}
        className="absolute bottom-6 right-6 text-xs text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider font-semibold z-20 py-1 px-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
      >
        Skip &rarr;
      </button>
    </div>
  );
}

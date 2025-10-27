"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particlesPosition = mounted
    ? [...Array(12)].map(() => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 7 + Math.random() * 3,
      }))
    : [];

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center pt-20 pb-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 relative overflow-hidden"
    >
      {/* Animated Blobs Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-10 left-10 w-[250px] h-[250px] bg-emerald-300/20 dark:bg-emerald-500/15 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute top-20 right-20 w-[200px] h-[200px] bg-teal-300/20 dark:bg-teal-500/15 rounded-full blur-3xl animate-blob"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-[280px] h-[280px] bg-cyan-300/20 dark:bg-cyan-500/15 rounded-full blur-3xl animate-blob-reverse"
          style={{ animationDelay: "4s" }}
        />
        <div
          className="absolute bottom-32 right-1/4 w-[220px] h-[220px] bg-emerald-400/15 dark:bg-emerald-400/10 rounded-full blur-3xl animate-blob-reverse"
          style={{ animationDelay: "6s" }}
        />
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[180px] h-[180px] bg-green-300/15 dark:bg-green-500/10 rounded-full blur-2xl animate-blob"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-1/2 right-10 w-[160px] h-[160px] bg-teal-400/15 dark:bg-teal-400/10 rounded-full blur-2xl animate-blob-reverse"
          style={{ animationDelay: "5s" }}
        />
      </div>

      {/* Floating Particles */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particlesPosition.map((pos, i) => (
            <div
              key={i}
              className="absolute animate-particle opacity-30"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                animationDelay: `${pos.delay}s`,
                animationDuration: `${pos.duration}s`,
              }}
            >
              <div className="w-2 h-2 bg-emerald-400 dark:bg-emerald-300 rounded-full blur-sm" />
            </div>
          ))}
        </div>
      )}

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(16 185 129) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Avatar */}
          <div className="inline-block animate-in fade-in zoom-in duration-700">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:to-teal-400 rounded-full flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl shadow-emerald-500/30 animate-float hover:scale-110 transition-transform duration-300 cursor-pointer">
                <span className="drop-shadow-lg">AY</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 sm:space-y-4">
            {/* Greeting */}
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium animate-in fade-in duration-500">
              Hi, I&apos;m
            </p>

            {/* Name & Title */}
            <h1 className="animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-3 drop-shadow-sm px-4">
                Alberth Yaputra
              </span>
              <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-500 animate-pulse drop-shadow-lg px-4">
                Software Engineer
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-300 px-4">
            Crafting modern web applications with cutting-edge technologies
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-in fade-in zoom-in duration-700 delay-500 px-4">
            <a
              href="#experience"
              className="group bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400 dark:hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/50 transform hover:-translate-y-1 hover:scale-105 inline-flex items-center justify-center backdrop-blur-sm text-sm sm:text-base"
            >
              <span className="flex items-center gap-2">
                Experience
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            <a
              href="#contact"
              className="group border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white hover:border-emerald-600 dark:hover:border-emerald-500 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transform hover:-translate-y-1 hover:scale-105 shadow-lg text-sm sm:text-base"
            >
              Contact Me
            </a>
          </div>

          {/* Scroll Indicator - Hidden on mobile, show on tablet+ */}
          <div className="hidden sm:block pt-8 sm:pt-12 animate-in fade-in duration-1000 delay-1000">
            <a
              href="#about"
              className="inline-flex flex-col items-center gap-2 group cursor-pointer"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                Scroll Down
              </span>
              <div className="w-6 h-10 border-2 border-gray-300 dark:border-gray-600 group-hover:border-emerald-500 dark:group-hover:border-emerald-400 rounded-full flex justify-center p-1 transition-colors">
                <div className="w-1.5 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-bounce" />
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

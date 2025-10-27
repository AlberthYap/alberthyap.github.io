"use client";

import { Check, Code2, Zap, Users } from "lucide-react";
import { useEffect, useRef } from "react";

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = sectionRef.current?.querySelectorAll(".scroll-animate");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const highlights = [
    {
      icon: Zap,
      title: "Modern Tech Stack",
      description:
        "Proficient in React, Next.js, Python, Django, FastAPI, and Docker for building modern applications",
    },
    {
      icon: Code2,
      title: "Clean Architecture",
      description:
        "Writing maintainable, testable code following SOLID principles and best practices",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Effective communication and collaboration with cross-functional teams",
    },
  ];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 scroll-animate scroll-fade-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            About Me
          </h2>
          <div className="w-20 h-1 bg-emerald-500 dark:bg-emerald-400 mx-auto rounded-full"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - About Text */}
          <div className="space-y-6 scroll-animate scroll-fade-up">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Fullstack Developer with over 2 years of experience creating
              robust, maintainable web applications using modern frontend and
              backend frameworks. Skilled in JavaScript, TypeScript, Go, PHP and
              Python, alongside backend development using contemporary API
              frameworks and server-side technologies.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Proven ability to build efficient data pipelines that automate
              workflows, reduce manual effort by 60%, and deliver real-time
              business insights.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              I enjoy learning new technologies, writing maintainable code, and
              delivering solutions that balance functionality with performance.
              I value collaboration, code quality, and continuous improvement.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
              {[
                { value: "2+", label: "Years Experience" },
                { value: "4+", label: "Pipelines Built" },
                { value: "8+", label: "Tech Stacks" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-slate-600 px-3 sm:px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer text-center"
                >
                  <p className="text-emerald-500 dark:text-emerald-400 font-bold text-xl sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Highlights */}
          <div className="space-y-6 scroll-animate scroll-fade-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Key Strengths
            </h3>

            {highlights.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-emerald-100 dark:border-slate-600 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

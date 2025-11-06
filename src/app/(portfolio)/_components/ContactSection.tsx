"use client";

import { Mail, Github, Linkedin, Send } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ContactSection() {
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

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12 scroll-animate scroll-fade-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Get In Touch
          </h2>
          <div className="w-20 h-1 bg-emerald-500 dark:bg-emerald-400 mx-auto rounded-full mb-6"></div>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Have a project in mind? Let&apos;s work together to bring your ideas
            to life.
          </p>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center scroll-animate scroll-fade-up mb-12">
          <a
            href="mailto:alberthyap@gmail.com"
            className="group bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-400 dark:hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            Send Email
          </a>
          <a
            href="https://github.com/alberthyap"
            target="_blank"
            rel="noopener noreferrer"
            className="group border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white bg-white dark:bg-slate-800 transition-all duration-300 px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-105"
          >
            <Github className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/alberth-yaputra"
            target="_blank"
            rel="noopener noreferrer"
            className="group border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-400 hover:text-white bg-white dark:bg-slate-800 transition-all duration-300 px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transform hover:-translate-y-1 hover:scale-105"
          >
            <Linkedin className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            LinkedIn
          </a>
        </div>

        {/* Location Info */}
        <p className="text-gray-600 dark:text-gray-400 text-sm scroll-animate scroll-fade-up">
          Based in Indonesia • Open for remote opportunities
        </p>
      </div>
    </section>
  );
}

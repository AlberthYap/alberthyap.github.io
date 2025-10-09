"use client";

import { ShoppingCart, BarChart3, Lock, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

const projects = [
  // {
  //   title: "Inventory Management System",
  //   description:
  //     "Aplikasi manajemen inventory dengan fitur CRUD, role-based access, dan tracking transaksi menggunakan Next.js dan FastAPI.",
  //   icon: ShoppingCart,
  //   tags: ["Next.js", "FastAPI", "MySQL"],
  //   colors: "from-emerald-400 to-emerald-600",
  // },
  {
    title: "Data Automation Pipeline",
    description:
      "Pipeline otomasi untuk pemrosesan data perbankan enterprise yang mengurangi pekerjaan manual hingga 60%.",
    icon: BarChart3,
    tags: ["Python", "Django", "Docker"],
    colors: "from-teal-400 to-cyan-600",
  },
  // {
  //   title: "Authentication System",
  //   description:
  //     "Sistem autentikasi lengkap dengan JWT, role management, dan refresh token menggunakan React dan FastAPI.",
  //   icon: Lock,
  //   tags: ["React", "FastAPI", "Prisma"],
  //   colors: "from-lime-400 to-emerald-600",
  // },
];

export default function ProjectsSection() {
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
      id="projects"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 scroll-animate scroll-fade-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Projects
          </h2>
          <div className="w-20 h-1 bg-emerald-500 dark:bg-emerald-400 mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-200 dark:border-slate-700 scroll-animate scroll-fade-up group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`h-48 bg-gradient-to-br ${project.colors} flex items-center justify-center`}
              >
                <project.icon className="w-20 h-20 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors duration-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href="#"
                  className="text-emerald-500 dark:text-emerald-400 font-semibold hover:text-emerald-600 dark:hover:text-emerald-500 transition-colors inline-flex items-center group/link"
                >
                  View Project
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-2 transition-transform duration-300" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

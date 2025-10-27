"use client";

import { useEffect, useRef } from "react";
import { Briefcase, Calendar, MapPin } from "lucide-react";

const experiences = [
  {
    company: "PT. Kita Indonesia Plus (WE+)",
    position: "Fullstack Developer",
    period: "Nov 2023 - Present",
    location: "Jakarta, Indonesia",
    type: "Full-time",
    description:
      "Designed and developed fullstack web applications with Django backend and React frontend. Built RESTful APIs using FastAPI for seamless frontend-backend communication and managed relational databases for efficient data operations.",
    achievements: [
      "Enhanced application performance through comprehensive debugging, testing, and optimization",
      "Followed software development best practices for clean, modular, and maintainable code",
      "Provided ongoing support and updates for live applications ensuring optimal performance",
    ],
    technologies: ["React", "Django", "FastAPI", "MySQL", "Docker"],
  },
  {
    company: "PT. Bank Artha Graha Internasional",
    position: "Data Engineer",
    period: "Aug 2022 - Nov 2023",
    location: "Jakarta, Indonesia",
    type: "Full-time",
    description:
      "Developed automation scripts for data pipelines and server maintenance, reducing manual work by 60%. Built multiple data pipelines using Python, Apache Spark, and Apache Airflow for reliable enterprise data processing.",
    achievements: [
      "Created Telegram bots for automated data collection and reporting processes",
      "Built Android dashboard app using Dart for real-time data visualization",
      "Developed enterprise data portal using Golang and React centralizing dashboards and reports",
      "Monitored and maintained data pipelines ensuring optimal system performance",
    ],
    technologies: [
      "Python",
      "Apache Spark",
      "Apache Airflow",
      "Golang",
      "React",
      "Dart",
      "Typescript",
    ],
  },
  {
    company: "PT. Angkasa Pura I",
    position: "IT Staff (Internship)",
    period: "Mar 2021 - Sep 2021",
    location: "Badung, Indonesia",
    type: "Internship",
    description:
      "Configured and maintained electronic equipment for corporate events. Developed web-based applications to support guest registration and baggage management, improving operational processes.",
    achievements: [
      "Built web applications for guest registration and baggage management systems",
      "Configured electronic equipment ensuring smooth corporate event operations",
      "Conducted preventive maintenance on computer systems reducing downtime",
    ],
    technologies: ["Web Development", "System Maintenance", "PHP", "MySQL"],
  },
];

export default function ExperienceSection() {
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
      id="experience"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 scroll-animate scroll-fade-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Work Experience
          </h2>
          <div className="w-20 h-1 bg-emerald-500 dark:bg-emerald-400 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            My professional journey in software development
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-emerald-200 dark:bg-emerald-900 hidden md:block"></div>

          {/* Experience Items */}
          <div className="space-y-12">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="relative scroll-animate scroll-fade-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 transform -translate-x-1/2 hidden md:block">
                  <div className="w-4 h-4 bg-emerald-500 dark:bg-emerald-400 rounded-full border-4 border-white dark:border-slate-900"></div>
                </div>

                {/* Content Card */}
                <div className="md:ml-20 bg-gray-50 dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-slate-700 group hover:border-emerald-300 dark:hover:border-emerald-700">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg group-hover:scale-110 transition-transform duration-300">
                          <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {exp.position}
                          </h3>
                          <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                            {exp.company}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{exp.period}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{exp.location}</span>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                          {exp.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* Achievements */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Key Achievements:
                    </h4>
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span className="text-emerald-500 dark:text-emerald-400 mt-1">
                            •
                          </span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technologies */}
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors duration-200"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
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

"use client";

import dynamic from "next/dynamic";
import HeroSection from "./_components/HeroSection";

// Lazy load heavy components
const AboutSection = dynamic(() => import("./_components/AboutSection"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 animate-pulse" />
  ),
  ssr: true, // Enable SSR for SEO
});

const ExperienceSection = dynamic(
  () => import("./_components/ExperienceSection"),
  {
    loading: () => (
      <div className="min-h-screen bg-white dark:bg-slate-900 animate-pulse" />
    ),
    ssr: true,
  }
);

const ProjectsSection = dynamic(() => import("./_components/ProjectSection"), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 animate-pulse" />
  ),
  ssr: true,
});

const ContactSection = dynamic(() => import("./_components/ContactSection"), {
  loading: () => (
    <div className="min-h-screen bg-white dark:bg-slate-900 animate-pulse" />
  ),
  ssr: true,
});

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <ContactSection />
    </>
  );
}

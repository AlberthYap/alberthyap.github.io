"use client";

import dynamic from "next/dynamic";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";

// Lazy load components with loading placeholder
const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  loading: () => <div className="min-h-screen bg-gray-50 dark:bg-slate-800" />,
});

const ExperienceSection = dynamic(
  () => import("@/components/ExperienceSection"),
  {
    loading: () => <div className="min-h-screen bg-white dark:bg-slate-900" />,
  }
);

const ContactSection = dynamic(() => import("@/components/ContactSection"), {
  loading: () => <div className="min-h-screen bg-white dark:bg-slate-900" />,
});

const Footer = dynamic(() => import("@/components/Footer"), {
  loading: () => <div className="h-32 bg-gray-50 dark:bg-slate-800" />,
});

export default function Home() {
  return (
    <>
      <main className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <Navigation />
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ContactSection />
        <Footer />
      </main>
    </>
  );
}

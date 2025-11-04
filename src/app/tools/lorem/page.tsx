"use client";
import { useEffect, useRef } from "react";
import { LoremSidebar } from "./_components/LoremSidebar";
import { LoremEditor } from "./_components/LoremEditor";
import { Toast } from "@/components/ui/Toast";
import { useLoremStore } from "@/lib/store/useLoremStore";
import { useToastStore } from "@/lib/store/useToastStore";

export default function LoremPage() {
  const generate = useLoremStore((state) => state.generate);
  const clearAll = useLoremStore((state) => state.clearAll);
  const outputText = useLoremStore((state) => state.outputText);
  const showToast = useToastStore((state) => state.showToast);

  const hasGeneratedRef = useRef(false);

  // Auto-generate on first load
  useEffect(() => {
    if (!hasGeneratedRef.current && !outputText) {
      generate();
      hasGeneratedRef.current = true;
    }
  }, [generate, outputText]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Generate: Ctrl+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        generate();
        showToast("Generated!", "✨");
      }

      // Clear: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        clearAll();
        showToast("Cleared", "🧹");
      }

      // Copy: Ctrl+Shift+C
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        if (outputText) {
          navigator.clipboard.writeText(outputText);
          showToast("Copied!", "📋");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generate, clearAll, outputText, showToast]);

  return (
    <>
      <Toast />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <LoremSidebar />
          <LoremEditor />
        </div>
      </div>
    </>
  );
}

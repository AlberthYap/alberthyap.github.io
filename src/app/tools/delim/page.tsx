"use client";
import { useEffect } from "react";
import { DelimSidebar } from "./_components/DelimSidebar";
import { DelimEditor } from "./_components/DelimEditor";
import { HistoryPanel } from "./_components/HistoryPanel";
import { Toast } from "@/components/ui/Toast";
import { useDelimStore } from "@/lib/store/useDelimStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

export default function DelimPage() {
  const convert = useDelimStore((state) => state.convert);
  const clearAll = useDelimStore((state) => state.clearAll);
  const outputText = useDelimStore((state) => state.outputText);
  const showToast = useToastStore((state) => state.showToast);
  const showHistory = useSettingsStore((state) => state.showHistory); // 🆕 Get history state

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Convert: Ctrl+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        convert();
        showToast("Converted!", "✨");
      }

      // Clear: Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        clearAll();
        showToast("Cleared", "🧹");
      }

      // Copy: Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (outputText) {
          navigator.clipboard.writeText(outputText);
          showToast("Copied!", "📋");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [convert, clearAll, outputText, showToast]);

  return (
    <>
      <Toast />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <DelimSidebar />

          <main className="space-y-6">
            <DelimEditor />

            {/* 🆕 Conditionally render History Panel */}
            {showHistory && <HistoryPanel />}
          </main>
        </div>
      </div>
    </>
  );
}

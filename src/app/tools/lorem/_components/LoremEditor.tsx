"use client";
import { Copy, Sparkles, Eraser, Download } from "lucide-react";
import { useLoremStore } from "@/lib/store/useLoremStore";
import { useToastStore } from "@/lib/store/useToastStore";

export function LoremEditor() {
  const outputText = useLoremStore((state) => state.outputText);
  const generate = useLoremStore((state) => state.generate);
  const clearAll = useLoremStore((state) => state.clearAll);
  // const generateType = useLoremStore((state) => state.generateType);
  // const count = useLoremStore((state) => state.count);

  const showToast = useToastStore((state) => state.showToast);

  const handleGenerate = () => {
    generate();
    showToast("Generated!", "✨");
  };

  const handleCopy = async () => {
    if (!outputText) {
      showToast("Nothing to copy", "⚠️");
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      showToast("Copied to clipboard!", "📋");
    } catch (e) {
      showToast("Copy failed", "❌");
    }
  };

  const handleClear = () => {
    clearAll();
    showToast("Cleared", "🧹");
  };

  const handleDownload = () => {
    if (!outputText) {
      showToast("Nothing to download", "⚠️");
      return;
    }

    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorem-ipsum-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Downloaded!", "💾");
  };

  // Calculate stats
  const wordCount = outputText
    ? outputText.split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = outputText.length;
  const lineCount = outputText
    ? outputText.split("\n").filter(Boolean).length
    : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[680px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Lorem Ipsum Generator</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generate placeholder text for your designs
          </p>
        </div>
        <span className="px-4 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-semibold">
          Ready
        </span>
      </div>

      {/* Output Area */}
      <div className="flex-1 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Generated Text
          </span>
          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <strong>{wordCount}</strong> words
            </span>
            <span>•</span>
            <span>
              <strong>{charCount}</strong> characters
            </span>
            <span>•</span>
            <span>
              <strong>{lineCount}</strong> lines
            </span>
          </div>
        </div>
        <textarea
          value={outputText}
          readOnly
          placeholder="Click 'Generate' to create lorem ipsum text...&#10;&#10;Try different types and counts! ✨"
          className="w-full h-full min-h-[400px] p-5 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-base bg-slate-50 dark:bg-slate-900 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {wordCount}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Words
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {charCount}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Characters
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {lineCount}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Lines
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={handleClear}
          className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
        >
          <Eraser size={20} />
          Clear
        </button>
        <button
          onClick={handleGenerate}
          className="col-span-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          Generate
        </button>
        <button
          onClick={handleCopy}
          className="px-6 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
        >
          <Copy size={20} />
          Copy
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="mt-4">
        <button
          onClick={handleDownload}
          className="w-full px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Download as TXT
        </button>
      </div>
    </div>
  );
}

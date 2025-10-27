"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, History, Info } from "lucide-react";
import Link from "next/link";
import { useSettingsStore } from "@/lib/store/useSettingsStore";

export function ToolsHeader() {
  const [mounted, setMounted] = useState(false); // 🆕 Add mounted state
  const { theme, setTheme } = useTheme();
  const toggleHistory = useSettingsStore((state) => state.toggleHistory);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // 🆕 Wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/tools"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-3xl">🔗</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
              Delim.X
            </h1>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Shortcuts Info */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowShortcuts(true)}
                onMouseLeave={() => setShowShortcuts(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Keyboard shortcuts"
              >
                <Info size={20} />
              </button>

              {showShortcuts && (
                <div className="absolute right-0 top-12 z-50 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
                    Keyboard Shortcuts
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Convert
                      </span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600">
                        Ctrl+Enter
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Clear
                      </span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600">
                        Ctrl+K
                      </kbd>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        Copy
                      </span>
                      <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600">
                        Ctrl+Shift+S
                      </kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tools Menu */}
            <div className="relative">
              <button
                onClick={() => setShowToolsMenu(!showToolsMenu)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                title="Switch tools"
              >
                <span>Tools</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showToolsMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showToolsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowToolsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 py-2">
                    <Link
                      href="/tools/delim"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                    >
                      <span className="text-xl">🔗</span>
                      <div>
                        <div className="font-semibold text-sm">Delim.X</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Text delimiter tool
                        </div>
                      </div>
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                    <Link
                      href="/tools"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                    >
                      <span className="text-xl">🏠</span>
                      <div className="font-semibold text-sm">All Tools</div>
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                    >
                      <span className="text-xl">👤</span>
                      <div className="font-semibold text-sm">Portfolio</div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Theme Toggle - 🔧 FIXED */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle theme"
              suppressHydrationWarning
            >
              {mounted ? (
                theme === "dark" ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )
              ) : (
                // Placeholder during SSR to prevent layout shift
                <div className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={toggleHistory}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Toggle history"
            >
              <History size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

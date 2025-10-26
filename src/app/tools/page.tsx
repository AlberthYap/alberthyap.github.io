"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "next-themes";
import {
  Moon,
  Sun,
  History,
  Copy,
  Sparkles,
  Eraser,
  ArrowUpDown,
  Hash,
  Info,
} from "lucide-react";
import Link from "next/link";

type Mode = "join" | "split";
type QuoteMode = "none" | "add" | "remove";

interface HistoryEntry {
  id: number;
  mode: Mode;
  delimiter: string;
  input: string;
  output: string;
  timestamp: string;
}

const DELIMITERS = [
  { value: ",", label: "Comma", display: "," },
  { value: ";", label: "Semi", display: ";" },
  { value: "|", label: "Pipe", display: "|" },
];

export default function DelimXSymmetric() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("join");
  const [delimiter, setDelimiter] = useState(",");
  const [customDelimiter, setCustomDelimiter] = useState("");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [autoConvert, setAutoConvert] = useState(false);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("none");
  const [quoteChar, setQuoteChar] = useState<'"' | "'" | "`">('"');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [sort, setSort] = useState(false);
  const [trim, setTrim] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", icon: "✓" });
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const convertTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Load from localStorage
  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem("delimxHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Toast helper
  const showToast = useCallback((message: string, icon = "✓") => {
    setToast({ show: true, message, icon });
    setTimeout(() => setToast({ show: false, message: "", icon: "" }), 2000);
  }, []);

  // Convert function
  const convert = useCallback(() => {
    if (!inputText.trim()) {
      setOutputText("");
      return;
    }

    let items: string[] = [];
    const activeDelimiter = customDelimiter || delimiter;

    if (mode === "join") {
      items = inputText.split("\n");
    } else {
      const escapedDelim = activeDelimiter.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      items = inputText.split(new RegExp(escapedDelim));
    }

    if (trim) items = items.map((x) => x.trim());
    items = items.filter(Boolean);

    if (removeDuplicates) items = [...new Set(items)];
    if (sort) items.sort((a, b) => a.localeCompare(b));

    // Handle quote mode
    if (quoteMode === "add") {
      items = items.map((x) => `${quoteChar}${x}${quoteChar}`);
    } else if (quoteMode === "remove") {
      items = items.map((x) => {
        const quoteChars = ['"', "'", "`"];
        for (const q of quoteChars) {
          if (x.startsWith(q) && x.endsWith(q) && x.length >= 2) {
            return x.slice(1, -1);
          }
        }
        return x;
      });
    }

    const result =
      mode === "join" ? items.join(activeDelimiter + " ") : items.join("\n");

    setOutputText(result);
  }, [
    inputText,
    mode,
    delimiter,
    customDelimiter,
    trim,
    removeDuplicates,
    sort,
    quoteMode,
    quoteChar,
  ]);

  // Auto convert with debounce
  useEffect(() => {
    if (autoConvert && inputText) {
      if (convertTimeoutRef.current) clearTimeout(convertTimeoutRef.current);
      convertTimeoutRef.current = setTimeout(() => {
        convert();
      }, 800);
    }
    return () => {
      if (convertTimeoutRef.current) clearTimeout(convertTimeoutRef.current);
    };
  }, [inputText, autoConvert, convert]);

  // Save to history
  const saveToHistory = useCallback(() => {
    if (!outputText) return;

    const entry: HistoryEntry = {
      id: Date.now(),
      mode,
      delimiter: customDelimiter || delimiter,
      input: inputText.substring(0, 100),
      output: outputText.substring(0, 100),
      timestamp: new Date().toLocaleString(),
    };

    const newHistory = [entry, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("delimxHistory", JSON.stringify(newHistory));
  }, [outputText, mode, delimiter, customDelimiter, inputText, history]);

  // ALL HANDLERS WRAPPED IN useCallback
  const handleConvert = useCallback(() => {
    convert();
    showToast("Converted successfully!", "✨");
    saveToHistory();
  }, [convert, showToast, saveToHistory]);

  const handleCopy = useCallback(async () => {
    if (!outputText) {
      showToast("Nothing to copy", "⚠️");
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      showToast("Copied to clipboard!", "📋");
      saveToHistory();
    } catch (e) {
      console.log(e);
      showToast("Copy failed", "❌");
    }
  }, [outputText, showToast, saveToHistory]);

  const handleClear = useCallback(() => {
    setInputText("");
    setOutputText("");
    showToast("Cleared", "🧹");
  }, [showToast]);

  const handleReverse = useCallback(() => {
    if (!outputText) return;
    const activeDelimiter = customDelimiter || delimiter;
    const items = outputText
      .split(mode === "split" ? "\n" : activeDelimiter)
      .filter(Boolean);
    const result =
      mode === "split"
        ? items.reverse().join("\n")
        : items.reverse().join(activeDelimiter + " ");
    setOutputText(result);
    showToast("Reversed", "↕️");
  }, [outputText, mode, customDelimiter, delimiter, showToast]);

  const handleShuffle = useCallback(() => {
    if (!outputText) return;
    const activeDelimiter = customDelimiter || delimiter;
    const items = outputText
      .split(mode === "split" ? "\n" : activeDelimiter)
      .filter(Boolean);
    const shuffled = items.sort(() => Math.random() - 0.5);
    const result =
      mode === "split"
        ? shuffled.join("\n")
        : shuffled.join(activeDelimiter + " ");
    setOutputText(result);
    showToast("Shuffled", "🎲");
  }, [outputText, mode, customDelimiter, delimiter, showToast]);

  const handleNumber = useCallback(() => {
    if (!outputText) return;
    const activeDelimiter = customDelimiter || delimiter;
    const items = outputText
      .split(mode === "split" ? "\n" : activeDelimiter)
      .filter(Boolean);
    const numbered = items.map((item, idx) => `${idx + 1}. ${item}`);
    const result =
      mode === "split"
        ? numbered.join("\n")
        : numbered.join(activeDelimiter + " ");
    setOutputText(result);
    showToast("Numbered", "🔢");
  }, [outputText, mode, customDelimiter, delimiter, showToast]);

  const handleUppercase = useCallback(() => {
    if (!outputText) return;
    setOutputText(outputText.toUpperCase());
    showToast("UPPERCASE", "🔠");
  }, [outputText, showToast]);

  const handleLowercase = useCallback(() => {
    if (!outputText) return;
    setOutputText(outputText.toLowerCase());
    showToast("lowercase", "🔡");
  }, [outputText, showToast]);

  const handleCount = useCallback(() => {
    if (!outputText) return;
    const activeDelimiter = customDelimiter || delimiter;
    const items = outputText
      .split(mode === "split" ? "\n" : activeDelimiter)
      .filter(Boolean);
    showToast(`Total: ${items.length} items`, "📊");
  }, [outputText, mode, customDelimiter, delimiter, showToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleConvert();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleConvert, handleClear]);

  // Counts
  const inputCount = inputText.split("\n").filter(Boolean).length;
  const outputCount = outputText
    ? outputText
        .split(mode === "split" ? "\n" : customDelimiter || delimiter)
        .filter(Boolean).length
    : 0;

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors">
      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span className="text-xl">{toast.icon}</span>
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔗</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">
                Delim.X
              </h1>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Keyboard Shortcuts Info Button */}
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Convert
                        </span>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600">
                          Ctrl+Enter
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Clear
                        </span>
                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600">
                          Ctrl+K
                        </kbd>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tools Dropdown */}
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
                        href="/delim"
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
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-400"
                      >
                        <span className="text-xl">🏠</span>
                        <div className="font-semibold text-sm">Home</div>
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="History"
              >
                <History size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            {/* Mode Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-[120px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Mode
              </h3>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <button
                  onClick={() => setMode("join")}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${
                    mode === "join"
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  📝 Join
                </button>
                <button
                  onClick={() => setMode("split")}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition-all ${
                    mode === "split"
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  ✂️ Split
                </button>
              </div>
            </div>

            {/* Delimiter Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-[180px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Delimiter
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {DELIMITERS.map((delim) => (
                  <button
                    key={delim.value}
                    onClick={() => {
                      setDelimiter(delim.value);
                      setCustomDelimiter("");
                    }}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      delimiter === delim.value && !customDelimiter
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                        : "border-slate-200 dark:border-slate-600 hover:border-emerald-300"
                    }`}
                  >
                    <div className="font-semibold text-xs">{delim.label}</div>
                    <div className="text-base">{delim.display}</div>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                placeholder="Custom..."
                maxLength={5}
                className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:border-emerald-500 transition-colors mt-auto"
              />
            </div>

            {/* Quote Options Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Quotes
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => setQuoteMode("none")}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    quoteMode === "none"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => setQuoteMode("add")}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    quoteMode === "add"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  Add
                </button>
                <button
                  onClick={() => setQuoteMode("remove")}
                  className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                    quoteMode === "remove"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  Remove
                </button>
              </div>
              {quoteMode === "add" && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => setQuoteChar('"')}
                      className={`py-2 rounded-lg font-mono text-base transition-all ${
                        quoteChar === '"'
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      &quot; &quot;
                    </button>
                    <button
                      onClick={() => setQuoteChar("'")}
                      className={`py-2 rounded-lg font-mono text-base transition-all ${
                        quoteChar === "'"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      &apos; &apos;
                    </button>
                    <button
                      onClick={() => setQuoteChar("`")}
                      className={`py-2 rounded-lg font-mono text-base transition-all ${
                        quoteChar === "`"
                          ? "bg-blue-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      ` `
                    </button>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      Preview:
                    </div>
                    <div className="font-mono text-xs text-emerald-900 dark:text-emerald-300">
                      {quoteChar}example{quoteChar}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Options Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-[200px] flex flex-col">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Options
              </h3>
              <div className="space-y-2 flex-1">
                <ToggleOption
                  label="Auto Convert"
                  checked={autoConvert}
                  onChange={(v) => setAutoConvert(v)}
                />
                <ToggleOption
                  label="Remove Duplicates"
                  checked={removeDuplicates}
                  onChange={setRemoveDuplicates}
                />
                <ToggleOption
                  label="Sort A-Z"
                  checked={sort}
                  onChange={setSort}
                />
                <ToggleOption
                  label="Trim Spaces"
                  checked={trim}
                  onChange={setTrim}
                />
              </div>
            </div>
          </aside>

          {/* Main Editor Area */}
          <main className="space-y-6">
            {/* Editor Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[680px] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Text Editor</h2>
                <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-semibold">
                  Ready
                </span>
              </div>

              {/* Text Areas */}
              <div className="grid md:grid-cols-2 gap-6 mb-6 flex-1">
                {/* Input */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Input
                    </span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-medium">
                      {inputCount} lines
                    </span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste or type your text here...&#10;&#10;Try typing some lines! ✨"
                    className="flex-1 p-5 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-mono text-base bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 resize-none leading-relaxed"
                  />
                </div>

                {/* Output */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Output
                    </span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-medium">
                      {outputCount} items
                    </span>
                  </div>
                  <textarea
                    value={outputText}
                    readOnly
                    placeholder="Result will appear here..."
                    className="flex-1 p-5 border-2 border-slate-200 dark:border-slate-600 rounded-xl font-mono text-base bg-slate-50 dark:bg-slate-900 focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-6 justify-center">
                <QuickButton
                  onClick={handleReverse}
                  icon={<ArrowUpDown size={16} />}
                  label="Reverse"
                />
                <QuickButton
                  onClick={handleShuffle}
                  icon="🎲"
                  label="Shuffle"
                />
                <QuickButton
                  onClick={handleNumber}
                  icon={<Hash size={16} />}
                  label="Number"
                />
                <QuickButton
                  onClick={handleUppercase}
                  icon="🔠"
                  label="UPPERCASE"
                />
                <QuickButton
                  onClick={handleLowercase}
                  icon="🔡"
                  label="lowercase"
                />
                <QuickButton onClick={handleCount} icon="📊" label="Count" />
              </div>

              {/* Main Action Buttons */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={handleClear}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
                >
                  <Eraser size={20} />
                  Clear
                </button>
                <button
                  onClick={handleConvert}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Convert
                </button>
                <button
                  onClick={handleCopy}
                  className="px-8 py-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={20} />
                  Copy
                </button>
              </div>
            </div>

            {/* History */}
            {showHistory && history.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <History size={20} />
                  Recent History
                </h3>
                <div className="space-y-2">
                  {history.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm font-mono cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      onClick={() => setOutputText(entry.output)}
                    >
                      <div className="text-xs text-slate-500 mb-1">
                        {entry.mode === "join" ? "📝 Join" : "✂️ Split"} •{" "}
                        {entry.timestamp}
                      </div>
                      <div className="truncate">{entry.output}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// Toggle Option Component
function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer">
      <span className="text-xs font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-emerald-500 rounded"
      />
    </label>
  );
}

// Quick Button Component
function QuickButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
    >
      {typeof icon === "string" ? <span>{icon}</span> : icon}
      {label}
    </button>
  );
}

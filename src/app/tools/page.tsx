"use client";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Home, Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";

type QuoteMode = "none" | "add" | "remove";
type CaseMode = "none" | "upper" | "lower" | "title";
type Mode = "join" | "split";

export default function DelimVerticalLayout() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [delimiter, setDelimiter] = useState(",");
  const [mode, setMode] = useState<Mode>("join");
  const [quoteMode, setQuoteMode] = useState<QuoteMode>("none");
  const [quoteChar, setQuoteChar] = useState('"');
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [sortItems, setSortItems] = useState(false);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [caseMode, setCaseMode] = useState<CaseMode>("none");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [autoConvert, setAutoConvert] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setResult("");
      return;
    }

    let items: string[] = [];

    if (mode === "join") {
      items = input.split("\n");
    } else {
      const regex = new RegExp(
        `(?:^|${delimiter.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )})(?:"([^"]*)"|([^${delimiter.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}]*))`,
        "g"
      );
      const matches = [...input.matchAll(regex)];
      items = matches.map((match) =>
        match[1] !== undefined ? match[1] : match[2] || ""
      );
    }

    if (trimSpaces) {
      items = items.map((x) => x.trim());
    }

    if (removeEmpty) {
      items = items.filter(Boolean);
    }

    if (quoteMode === "remove") {
      items = items.map((x) => x.replace(/^["'`]|["'`]$/g, "").trim());
    }

    if (removeDuplicates) {
      items = Array.from(new Set(items));
    }

    if (caseMode === "upper") {
      items = items.map((x) => x.toUpperCase());
    } else if (caseMode === "lower") {
      items = items.map((x) => x.toLowerCase());
    } else if (caseMode === "title") {
      items = items.map((x) =>
        x.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
      );
    }

    if (sortItems) {
      items = items.sort((a, b) => a.localeCompare(b));
    }

    if (quoteMode === "add") {
      items = items.map((x) => `${quoteChar}${x}${quoteChar}`);
    }

    const output =
      mode === "join" ? items.join(delimiter + " ") : items.join("\n");
    setResult(output);
  }, [
    input,
    mode,
    delimiter,
    quoteMode,
    quoteChar,
    removeDuplicates,
    sortItems,
    trimSpaces,
    removeEmpty,
    caseMode,
  ]);

  const handleClear = useCallback(() => {
    setInput("");
    setResult("");
    showToast("✨ Cleared!");
  }, [showToast]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopySuccess(true);
    showToast("📋 Copied to clipboard!");
    setTimeout(() => setCopySuccess(false), 1500);
  }, [result, showToast]);

  const handleSwap = useCallback(() => {
    setInput(result);
    setResult(input);
    setMode(mode === "join" ? "split" : "join");
    showToast("⇄ Swapped!");
  }, [input, result, mode, showToast]);

  useEffect(() => {
    if (autoConvert && input) {
      const timer = setTimeout(() => {
        handleConvert();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [input, autoConvert, handleConvert]);

  const handleCount = () => {
    if (!result) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const uniqueItems = Array.from(new Set(items));
    const message = `📊 Statistics:\n\nTotal items: ${
      items.length
    }\nUnique items: ${uniqueItems.length}\nDuplicates: ${
      items.length - uniqueItems.length
    }\nTotal characters: ${result.length}`;
    alert(message);
  };

  const handleAddPrefix = () => {
    const prefix = prompt("Enter prefix to add:");
    if (prefix === null) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const newItems = items.map((item) => prefix + item.trim());
    setResult(
      mode === "split" ? newItems.join("\n") : newItems.join(delimiter + " ")
    );
    showToast("✓ Prefix added!");
  };

  const handleAddSuffix = () => {
    const suffix = prompt("Enter suffix to add:");
    if (suffix === null) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const newItems = items.map((item) => item.trim() + suffix);
    setResult(
      mode === "split" ? newItems.join("\n") : newItems.join(delimiter + " ")
    );
    showToast("✓ Suffix added!");
  };

  const handleReverse = () => {
    if (!result) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const reversed = items.reverse();
    setResult(
      mode === "split" ? reversed.join("\n") : reversed.join(delimiter + " ")
    );
    showToast("↕ Reversed!");
  };

  const handleShuffle = () => {
    if (!result) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const shuffled = items.sort(() => Math.random() - 0.5);
    setResult(
      mode === "split" ? shuffled.join("\n") : shuffled.join(delimiter + " ")
    );
    showToast("🎲 Shuffled!");
  };

  const handleNumberLines = () => {
    if (!result) return;
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const numbered = items.map((item, idx) => `${idx + 1}. ${item.trim()}`);
    setResult(
      mode === "split" ? numbered.join("\n") : numbered.join(delimiter + " ")
    );
    showToast("✓ Numbered!");
  };

  const handleWrapText = () => {
    const wrapper = prompt("Enter wrapper (e.g., [], (), {}):");
    if (!wrapper || wrapper.length < 2) return;
    const left = wrapper[0];
    const right = wrapper[wrapper.length - 1];
    const items = result
      .split(mode === "split" ? "\n" : delimiter)
      .filter(Boolean);
    const wrapped = items.map((item) => `${left}${item.trim()}${right}`);
    setResult(
      mode === "split" ? wrapped.join("\n") : wrapped.join(delimiter + " ")
    );
    showToast("✓ Wrapped!");
  };

  const handleFindReplace = () => {
    const find = prompt("Find text:");
    if (!find) return;
    const replace = prompt("Replace with:");
    if (replace === null) return;
    const newResult = result.replace(
      new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      replace
    );
    setResult(newResult);
    showToast("✓ Replaced!");
  };

  const handleExtractNumbers = () => {
    if (!result) return;
    const numbers = result.match(/\d+/g);
    if (numbers) {
      setResult(
        mode === "split" ? numbers.join("\n") : numbers.join(delimiter + " ")
      );
      showToast("✓ Numbers extracted!");
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleConvert();
        showToast("✨ Converted!");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleClear();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        if (result) handleCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (result) handleSwap();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    handleConvert,
    handleClear,
    handleCopy,
    handleSwap,
    result,
    showShortcuts,
    showToast,
  ]);

  const tools = [
    {
      name: "Delim.X",
      href: "/tools/delim",
      icon: "🔗",
      description: "Text delimiter converter",
    },
    {
      name: "JSON Format",
      href: "/tools/json",
      icon: "{ }",
      description: "Format & validate JSON",
    },
    {
      name: "Base64",
      href: "/tools/base64",
      icon: "🔐",
      description: "Encode/Decode Base64",
    },
    {
      name: "Color Picker",
      href: "/tools/color",
      icon: "🎨",
      description: "Color converter",
    },
    {
      name: "Hash Generator",
      href: "/tools/hash",
      icon: "#️⃣",
      description: "MD5, SHA256, etc",
    },
    {
      name: "URL Encoder",
      href: "/tools/url",
      icon: "🔗",
      description: "Encode/Decode URLs",
    },
  ];

  if (!mounted) return null;

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-lg shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                ⌨️ Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Convert
                </span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Clear</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Copy Result
                </span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                  Ctrl + Shift + C
                </kbd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">
                  Swap Input/Output
                </span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                  Ctrl + Shift + S
                </kbd>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Show Shortcuts
                </span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs">
                  Ctrl + /
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tools Header */}
      <header className="sticky top-0 w-full z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            {/* Left: Back & Current Tool */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Back to Portfolio"
              >
                <Home className="w-5 h-5" />
              </Link>

              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Delim.X
                </h1>
              </div>
            </div>

            {/* Center: Tool Switcher (Desktop) */}
            <div className="hidden md:flex items-center">
              <div
                className="relative"
                onMouseEnter={() => setShowToolsDropdown(true)}
                onMouseLeave={() => setShowToolsDropdown(false)}
              >
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all">
                  Switch Tool
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showToolsDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showToolsDropdown && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1">
                        {tools.map((tool) => (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            className={`group p-3 rounded-lg transition-all ${
                              tool.name === "Delim.X"
                                ? "bg-emerald-50 dark:bg-emerald-900/30"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                {tool.icon}
                              </div>
                              <div className="flex-1">
                                <div
                                  className={`font-semibold text-sm ${
                                    tool.name === "Delim.X"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                  } transition-colors`}
                                >
                                  {tool.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {tool.description}
                                </div>
                              </div>
                              {tool.name === "Delim.X" && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Auto Convert */}
              <label
                className="hidden sm:flex items-center gap-2 cursor-pointer group"
                title="Auto-convert as you type"
              >
                <input
                  type="checkbox"
                  checked={autoConvert}
                  onChange={(e) => {
                    setAutoConvert(e.target.checked);
                    showToast(
                      e.target.checked
                        ? "⚡ Auto-convert enabled"
                        : "⚡ Auto-convert disabled"
                    );
                  }}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Auto
                </span>
              </label>

              {/* Shortcuts */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden sm:block p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
                title="Keyboard Shortcuts (Ctrl + /)"
              >
                ⌨️
              </button>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button
                  onClick={() => setMode("join")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    mode === "join"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title="Join lines"
                >
                  Join
                </button>
                <button
                  onClick={() => setMode("split")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    mode === "split"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                  title="Split text"
                >
                  Split
                </button>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                title="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              {/* Mobile Menu */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Home className="w-4 h-4" />
                  Back to Portfolio
                </Link>

                <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Switch Tool
                  </div>
                  <div className="space-y-1">
                    {tools.map((tool) => (
                      <Link
                        key={tool.name}
                        href={tool.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          tool.name === "Delim.X"
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="text-xl">{tool.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm font-semibold">
                            {tool.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {tool.description}
                          </div>
                        </div>
                        {tool.name === "Delim.X" && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Sisanya sama, saya potong untuk menghemat space */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">
          {/* Controls */}
          <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border border-emerald-200/50 dark:border-gray-700/50 rounded-xl p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Delimiter:
                </span>
                {[
                  { label: ",", value: ",", title: "Comma" },
                  { label: ";", value: ";", title: "Semicolon" },
                  { label: "|", value: "|", title: "Pipe" },
                  { label: "Tab", value: "\t", title: "Tab" },
                  { label: "Space", value: " ", title: "Space" },
                ].map(({ label, value, title }) => (
                  <button
                    key={value}
                    onClick={() => setDelimiter(value)}
                    title={title}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs transition ${
                      delimiter === value
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <input
                  type="text"
                  maxLength={3}
                  value={
                    [",", ";", "|", "\t", " "].includes(delimiter)
                      ? ""
                      : delimiter
                  }
                  onChange={(e) => setDelimiter(e.target.value)}
                  placeholder="Custom"
                  title="Custom delimiter"
                  className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono focus:ring-2 focus:ring-emerald-400 outline-none transition"
                />
              </div>

              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Quotes:
                </span>
                {[
                  { label: "None", value: "none" as QuoteMode },
                  { label: "Add", value: "add" as QuoteMode },
                  { label: "Remove", value: "remove" as QuoteMode },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setQuoteMode(value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      quoteMode === value
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {quoteMode === "add" && (
                  <select
                    value={quoteChar}
                    onChange={(e) => setQuoteChar(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono focus:ring-2 focus:ring-emerald-400 outline-none transition"
                  >
                    <option value='"'>&quot; Double</option>
                    <option value="'">&apos; Single</option>
                    <option value="`">` Backtick</option>
                  </select>
                )}
              </div>

              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Case:
                </span>
                {[
                  { label: "None", value: "none" as CaseMode },
                  { label: "UPPER", value: "upper" as CaseMode },
                  { label: "lower", value: "lower" as CaseMode },
                  { label: "Title", value: "title" as CaseMode },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setCaseMode(value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition ${
                      caseMode === value
                        ? "bg-purple-500 text-white shadow-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>

              <label
                className="flex items-center gap-1.5 cursor-pointer group"
                title="Remove duplicate items"
              >
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Remove Duplicates
                </span>
              </label>
              <label
                className="flex items-center gap-1.5 cursor-pointer group"
                title="Sort items alphabetically"
              >
                <input
                  type="checkbox"
                  checked={sortItems}
                  onChange={(e) => setSortItems(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                  Sort A-Z
                </span>
              </label>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="ml-auto text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition"
              >
                {showAdvanced ? "▼ Less" : "▶ More Options"}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 text-sm">
                <label
                  className="flex items-center gap-1.5 cursor-pointer group"
                  title="Remove leading/trailing spaces"
                >
                  <input
                    type="checkbox"
                    checked={trimSpaces}
                    onChange={(e) => setTrimSpaces(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Trim whitespace
                  </span>
                </label>
                <label
                  className="flex items-center gap-1.5 cursor-pointer group"
                  title="Remove empty lines"
                >
                  <input
                    type="checkbox"
                    checked={removeEmpty}
                    onChange={(e) => setRemoveEmpty(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                    Remove empty lines
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Input & Output */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Input
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {input.split("\n").filter(Boolean).length} lines
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "join"
                    ? "One item per line...\nExample:\nApple\nBanana\nCherry"
                    : `Items separated by delimiter...\nExample: Apple${
                        delimiter === "\t" ? "[TAB]" : delimiter
                      }Banana${delimiter === "\t" ? "[TAB]" : delimiter}Cherry`
                }
                className="flex-1 border-2 border-emerald-300/50 dark:border-emerald-700/50 rounded-xl p-3 font-mono text-sm resize-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 dark:bg-gray-800/50 dark:text-green-200 outline-none transition"
              />
            </div>

            <div className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Output
                </label>
                {result && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {
                      result
                        .split(mode === "split" ? "\n" : delimiter)
                        .filter(Boolean).length
                    }{" "}
                    items
                  </span>
                )}
              </div>
              <textarea
                readOnly
                value={result}
                placeholder="Result will appear here..."
                className="flex-1 border-2 border-emerald-300/50 dark:border-emerald-700/50 rounded-xl p-3 font-mono text-sm bg-gray-50 dark:bg-gray-800/50 text-gray-800 dark:text-green-200 resize-none outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gradient-to-r from-gray-50 to-emerald-50/30 dark:from-gray-900/50 dark:to-emerald-900/10 rounded-2xl p-4 border border-emerald-200/30 dark:border-gray-700/30">
            <div className="flex flex-wrap justify-center gap-3 mb-3">
              <button
                onClick={handleConvert}
                className="group relative bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white rounded-xl py-3 px-8 font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all duration-200"
                title="Convert (Ctrl + Enter)"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span>Convert</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity"></div>
              </button>

              <button
                onClick={handleClear}
                className="bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-xl py-3 px-6 font-bold shadow-lg hover:shadow-xl hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 active:scale-95 transition-all duration-200"
                title="Clear all (Ctrl + K)"
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">🧹</span>
                  <span>Clear</span>
                </span>
              </button>
            </div>

            {result && (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`${
                      copySuccess
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : "bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600"
                    } text-white rounded-lg py-2 px-5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95`}
                    title="Copy to Clipboard (Ctrl + Shift + C)"
                  >
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>{copySuccess ? "✓" : "📋"}</span>
                      <span>{copySuccess ? "Copied!" : "Copy"}</span>
                    </span>
                  </button>

                  <button
                    onClick={handleSwap}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg py-2 px-5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                    title="Swap Input/Output (Ctrl + Shift + S)"
                  >
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>⇄</span>
                      <span>Swap</span>
                    </span>
                  </button>

                  <button
                    onClick={handleCount}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg py-2 px-5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                    title="Show statistics"
                  >
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>#</span>
                      <span>Count</span>
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Transform
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={handleReverse}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Reverse order"
                    >
                      ↕ Reverse
                    </button>
                    <button
                      onClick={handleShuffle}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Random shuffle"
                    >
                      🎲 Shuffle
                    </button>
                    <button
                      onClick={handleNumberLines}
                      className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Add line numbers"
                    >
                      1-2-3 Number
                    </button>
                    <button
                      onClick={handleAddPrefix}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Add prefix"
                    >
                      + Prefix
                    </button>
                    <button
                      onClick={handleAddSuffix}
                      className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Add suffix"
                    >
                      + Suffix
                    </button>
                    <button
                      onClick={handleWrapText}
                      className="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Wrap items"
                    >
                      [ ] Wrap
                    </button>
                    <button
                      onClick={handleFindReplace}
                      className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Find and replace"
                    >
                      🔍 Replace
                    </button>
                    <button
                      onClick={handleExtractNumbers}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg py-2 px-4 font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
                      title="Extract numbers only"
                    >
                      # Extract
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

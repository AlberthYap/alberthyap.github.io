"use client";
import { ArrowUpDown, Hash, Copy, Sparkles, Eraser } from "lucide-react";
import { useDelimStore } from "@/lib/store/useDelimStore";
import { useToastStore } from "@/lib/store/useToastStore";
import { useHistoryStore } from "@/lib/store/useHistoryStore";

export function DelimEditor() {
  const inputText = useDelimStore((state) => state.inputText);
  const setInputText = useDelimStore((state) => state.setInputText);
  const outputText = useDelimStore((state) => state.outputText);
  const setOutputText = useDelimStore((state) => state.setOutputText);
  const mode = useDelimStore((state) => state.mode);
  const delimiter = useDelimStore((state) => state.delimiter);
  const customDelimiter = useDelimStore((state) => state.customDelimiter);
  const convert = useDelimStore((state) => state.convert);
  const clearAll = useDelimStore((state) => state.clearAll);
  const getInputCount = useDelimStore((state) => state.getInputCount);
  const getOutputCount = useDelimStore((state) => state.getOutputCount);

  const showToast = useToastStore((state) => state.showToast);
  const addHistory = useHistoryStore((state) => state.addEntry);

  const inputCount = getInputCount();
  const outputCount = getOutputCount();

  const handleConvert = () => {
    convert();
    showToast("Converted successfully!", "✨");

    // Save to history
    if (outputText) {
      addHistory({
        tool: "delim",
        mode,
        delimiter: customDelimiter || delimiter,
        input: inputText.substring(0, 100),
        output: outputText.substring(0, 100),
      });
    }
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
      console.log(e);
      showToast("Copy failed", "❌");
    }
  };

  const handleClear = () => {
    clearAll();
    showToast("Cleared", "🧹");
  };

  const handleReverse = () => {
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
  };

  const handleShuffle = () => {
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
  };

  const handleNumber = () => {
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
  };

  const handleUppercase = () => {
    if (!outputText) return;
    setOutputText(outputText.toUpperCase());
    showToast("UPPERCASE", "🔠");
  };

  const handleLowercase = () => {
    if (!outputText) return;
    setOutputText(outputText.toLowerCase());
    showToast("lowercase", "🔡");
  };

  const handleCount = () => {
    if (!outputText) return;
    showToast(`Total: ${outputCount} items`, "📊");
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 min-h-[655px] flex flex-col">
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
        <QuickButton onClick={handleShuffle} icon="🎲" label="Shuffle" />
        <QuickButton
          onClick={handleNumber}
          icon={<Hash size={16} />}
          label="Number"
        />
        <QuickButton onClick={handleUppercase} icon="🔠" label="UPPERCASE" />
        <QuickButton onClick={handleLowercase} icon="🔡" label="lowercase" />
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
  );
}

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

"use client";
import { useLoremStore } from "@/lib/store/useLoremStore";

const TYPES = [
  { value: "paragraphs", label: "Paragraphs", icon: "📝" },
  { value: "words", label: "Words", icon: "📄" },
  { value: "sentences", label: "Sentences", icon: "📋" },
  { value: "list", label: "List", icon: "🔢" },
] as const;

export function LoremSidebar() {
  const generateType = useLoremStore((state) => state.generateType);
  const setGenerateType = useLoremStore((state) => state.setGenerateType);
  const count = useLoremStore((state) => state.count);
  const setCount = useLoremStore((state) => state.setCount);
  const startWithLorem = useLoremStore((state) => state.startWithLorem);
  const toggleStartWithLorem = useLoremStore(
    (state) => state.toggleStartWithLorem
  );

  return (
    <aside className="lg:sticky lg:top-24 h-fit space-y-4">
      {/* Type Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Generate Type
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setGenerateType(type.value)}
              className={`py-3 px-3 rounded-xl font-semibold text-sm transition-all ${
                generateType === type.value
                  ? "bg-purple-500 text-white shadow-lg"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count Control */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Count
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCount(count - 1)}
            disabled={count <= 1}
            className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors"
          >
            −
          </button>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            min="1"
            max="100"
            className="flex-1 px-4 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-center text-xl font-bold focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={() => setCount(count + 1)}
            disabled={count >= 100}
            className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-colors"
          >
            +
          </button>
        </div>
        <div className="mt-2 text-xs text-center text-slate-500 dark:text-slate-400">
          {count} {generateType}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Options
        </h3>
        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer">
          <span className="text-sm font-medium">
            Start with &quot;Lorem ipsum...&quot;
          </span>
          <input
            type="checkbox"
            checked={startWithLorem}
            onChange={toggleStartWithLorem}
            className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Quick Presets */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Quick Presets
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              setGenerateType("paragraphs");
              setCount(3);
            }}
            className="w-full p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            📝 3 Paragraphs
          </button>
          <button
            onClick={() => {
              setGenerateType("words");
              setCount(50);
            }}
            className="w-full p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            📄 50 Words
          </button>
          <button
            onClick={() => {
              setGenerateType("sentences");
              setCount(5);
            }}
            className="w-full p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            📋 5 Sentences
          </button>
          <button
            onClick={() => {
              setGenerateType("list");
              setCount(10);
            }}
            className="w-full p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            🔢 10 List Items
          </button>
        </div>
      </div>
    </aside>
  );
}

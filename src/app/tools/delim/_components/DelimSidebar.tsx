"use client";
import { useDelimStore } from "@/lib/store/useDelimStore";

const DELIMITERS = [
  { value: ",", label: "Comma", display: "," },
  { value: ";", label: "Semi", display: ";" },
  { value: "|", label: "Pipe", display: "|" },
];

export function DelimSidebar() {
  const mode = useDelimStore((state) => state.mode);
  const setMode = useDelimStore((state) => state.setMode);
  const delimiter = useDelimStore((state) => state.delimiter);
  const setDelimiter = useDelimStore((state) => state.setDelimiter);
  const customDelimiter = useDelimStore((state) => state.customDelimiter);
  const setCustomDelimiter = useDelimStore((state) => state.setCustomDelimiter);
  const quoteMode = useDelimStore((state) => state.quoteMode);
  const setQuoteMode = useDelimStore((state) => state.setQuoteMode);
  const quoteChar = useDelimStore((state) => state.quoteChar);
  const setQuoteChar = useDelimStore((state) => state.setQuoteChar);
  const autoConvert = useDelimStore((state) => state.autoConvert);
  const toggleAutoConvert = useDelimStore((state) => state.toggleAutoConvert);
  const removeDuplicates = useDelimStore((state) => state.removeDuplicates);
  const toggleRemoveDuplicates = useDelimStore(
    (state) => state.toggleRemoveDuplicates
  );
  const sort = useDelimStore((state) => state.sort);
  const toggleSort = useDelimStore((state) => state.toggleSort);
  const trim = useDelimStore((state) => state.trim);
  const toggleTrim = useDelimStore((state) => state.toggleTrim);

  return (
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
            onChange={toggleAutoConvert}
          />
          <ToggleOption
            label="Remove Duplicates"
            checked={removeDuplicates}
            onChange={toggleRemoveDuplicates}
          />
          <ToggleOption label="Sort A-Z" checked={sort} onChange={toggleSort} />
          <ToggleOption
            label="Trim Spaces"
            checked={trim}
            onChange={toggleTrim}
          />
        </div>
      </div>
    </aside>
  );
}

function ToggleOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg cursor-pointer">
      <span className="text-xs font-medium">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
      />
    </label>
  );
}

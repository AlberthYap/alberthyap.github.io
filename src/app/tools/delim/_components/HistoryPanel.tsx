"use client";
import { History, X, Trash2 } from "lucide-react";
import { useHistoryStore } from "@/lib/store/useHistoryStore";
import { useDelimStore } from "@/lib/store/useDelimStore";
import { useToastStore } from "@/lib/store/useToastStore";

export function HistoryPanel() {
  // 🔧 FIX: Get all entries first, then filter in component
  const allEntries = useHistoryStore((state) => state.entries);
  const removeEntry = useHistoryStore((state) => state.removeEntry);
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  const setOutputText = useDelimStore((state) => state.setOutputText);
  const showToast = useToastStore((state) => state.showToast);

  // Filter entries for 'delim' tool in component
  const entries = allEntries.filter((entry) => entry.tool === "delim");

  const handleLoadEntry = (output: string) => {
    setOutputText(output);
    showToast("History loaded", "📜");
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeEntry(id);
    showToast("Removed from history", "🗑️");
  };

  const handleClearAll = () => {
    clearHistory();
    showToast("History cleared", "🧹");
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History size={20} />
          Recent History
        </h3>
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <div className="text-5xl mb-4">📭</div>
          <div className="font-medium">No history yet</div>
          <div className="text-sm mt-2">
            Start converting to see your history here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History size={20} />
          Recent History
        </h3>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        {entries.slice(0, 10).map((entry) => (
          <div
            key={entry.id}
            className="group relative p-3 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            onClick={() => handleLoadEntry(entry.output)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span className="font-medium">
                    {entry.mode === "join" ? "📝 Join" : "✂️ Split"}
                  </span>
                  <span>•</span>
                  <span>Delimiter: {entry.delimiter}</span>
                  <span>•</span>
                  <span>{entry.timestamp}</span>
                </div>
                <div className="font-mono text-sm truncate">{entry.output}</div>
              </div>

              <button
                onClick={(e) => handleRemove(entry.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all"
                title="Remove"
              >
                <X size={16} className="text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {entries.length > 10 && (
        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Showing 10 of {entries.length} entries
        </div>
      )}
    </div>
  );
}

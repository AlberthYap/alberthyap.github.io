import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  tool: string;
  mode: "join" | "split";
  delimiter: string;
  input: string;
  output: string;
  timestamp: string;
}

interface HistoryState {
  entries: HistoryEntry[];

  addEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getToolHistory: (tool: string) => HistoryEntry[];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: Date.now().toString(),
              timestamp: new Date().toLocaleString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            ...state.entries,
          ].slice(0, 50), // Keep last 50 entries
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      clearHistory: () => set({ entries: [] }),

      getToolHistory: (tool) => {
        return get().entries.filter((e) => e.tool === tool);
      },
    }),
    {
      name: "tools-history", // localStorage key
    }
  )
);

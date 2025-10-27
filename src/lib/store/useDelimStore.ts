import { create } from "zustand";

type Mode = "join" | "split";
type QuoteMode = "none" | "add" | "remove";

interface DelimState {
  // Data
  inputText: string;
  outputText: string;

  // Settings
  mode: Mode;
  delimiter: string;
  customDelimiter: string;
  quoteMode: QuoteMode;
  quoteChar: '"' | "'" | "`";

  // Options
  autoConvert: boolean;
  removeDuplicates: boolean;
  sort: boolean;
  trim: boolean;

  // Actions
  setInputText: (text: string) => void;
  setOutputText: (text: string) => void;
  setMode: (mode: Mode) => void;
  setDelimiter: (delimiter: string) => void;
  setCustomDelimiter: (delimiter: string) => void;
  setQuoteMode: (mode: QuoteMode) => void;
  setQuoteChar: (char: '"' | "'" | "`") => void;
  toggleAutoConvert: () => void;
  toggleRemoveDuplicates: () => void;
  toggleSort: () => void;
  toggleTrim: () => void;
  clearAll: () => void;
  convert: () => void;

  // Computed values
  getInputCount: () => number;
  getOutputCount: () => number;
}

export const useDelimStore = create<DelimState>((set, get) => ({
  // Initial state
  inputText: "",
  outputText: "",
  mode: "join",
  delimiter: ",",
  customDelimiter: "",
  quoteMode: "none",
  quoteChar: '"',
  autoConvert: false,
  removeDuplicates: false,
  sort: false,
  trim: true,

  // Setters
  setInputText: (text) => {
    set({ inputText: text });
    // Auto convert with debounce
    if (get().autoConvert && text.trim()) {
      setTimeout(() => get().convert(), 500);
    }
  },

  setOutputText: (text) => set({ outputText: text }),
  setMode: (mode) => set({ mode }),
  setDelimiter: (delimiter) => set({ delimiter }),
  setCustomDelimiter: (delimiter) => set({ customDelimiter: delimiter }),
  setQuoteMode: (mode) => set({ quoteMode: mode }),
  setQuoteChar: (char) => set({ quoteChar: char }),

  // Toggles
  toggleAutoConvert: () =>
    set((state) => ({ autoConvert: !state.autoConvert })),
  toggleRemoveDuplicates: () =>
    set((state) => ({ removeDuplicates: !state.removeDuplicates })),
  toggleSort: () => set((state) => ({ sort: !state.sort })),
  toggleTrim: () => set((state) => ({ trim: !state.trim })),

  // Clear
  clearAll: () => set({ inputText: "", outputText: "" }),

  // Computed values
  getInputCount: () => {
    const { inputText } = get();
    return inputText.split("\n").filter(Boolean).length;
  },

  getOutputCount: () => {
    const { outputText, mode, delimiter, customDelimiter } = get();
    if (!outputText) return 0;
    const delim = customDelimiter || delimiter;
    return outputText.split(mode === "split" ? "\n" : delim).filter(Boolean)
      .length;
  },

  // Convert logic
  convert: () => {
    const state = get();
    const {
      inputText,
      mode,
      delimiter,
      customDelimiter,
      trim,
      removeDuplicates,
      sort,
      quoteMode,
      quoteChar,
    } = state;

    if (!inputText.trim()) {
      set({ outputText: "" });
      return;
    }

    let items: string[] = [];
    const activeDelimiter = customDelimiter || delimiter;

    // Split based on mode
    if (mode === "join") {
      items = inputText.split("\n");
    } else {
      const escapedDelim = activeDelimiter.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      items = inputText.split(new RegExp(escapedDelim));
    }

    // Processing
    if (trim) items = items.map((x) => x.trim());
    items = items.filter(Boolean);
    if (removeDuplicates) items = [...new Set(items)];
    if (sort) items.sort((a, b) => a.localeCompare(b));

    // Quote handling
    if (quoteMode === "add") {
      items = items.map((x) => `${quoteChar}${x}${quoteChar}`);
    } else if (quoteMode === "remove") {
      items = items.map((x) => {
        const quotes = ['"', "'", "`"];
        for (const q of quotes) {
          if (x.startsWith(q) && x.endsWith(q) && x.length >= 2) {
            return x.slice(1, -1);
          }
        }
        return x;
      });
    }

    // Join result
    const result =
      mode === "join" ? items.join(activeDelimiter + " ") : items.join("\n");

    set({ outputText: result });
  },
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  showHistory: boolean;
  keyboardShortcutsEnabled: boolean;

  toggleHistory: () => void;
  setShowHistory: (show: boolean) => void;
  toggleKeyboardShortcuts: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showHistory: false,
      keyboardShortcutsEnabled: true,

      toggleHistory: () =>
        set((state) => ({ showHistory: !state.showHistory })),
      setShowHistory: (show) => set({ showHistory: show }),
      toggleKeyboardShortcuts: () =>
        set((state) => ({
          keyboardShortcutsEnabled: !state.keyboardShortcutsEnabled,
        })),
    }),
    {
      name: "delim-settings", // localStorage key
    }
  )
);

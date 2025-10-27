import { create } from "zustand";

interface ToastState {
  show: boolean;
  message: string;
  icon: string;

  showToast: (message: string, icon?: string) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  show: false,
  message: "",
  icon: "✓",

  showToast: (message, icon = "✓") => {
    set({ show: true, message, icon });
    setTimeout(() => set({ show: false }), 2000);
  },

  hideToast: () => set({ show: false }),
}));

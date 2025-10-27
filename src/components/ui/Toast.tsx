"use client";
import { useToastStore } from "@/lib/store/useToastStore";

export function Toast() {
  const { show, message, icon } = useToastStore();

  if (!show) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{message}</span>
    </div>
  );
}

import { create } from "zustand";
import type { Toast, SaveStatus } from "../types";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  cmdOpen: boolean;
  toasts: Toast[];
  saveStatus: SaveStatus;
  filterText: string;
  searchQuery: string;
  showOnboarding: boolean;
  onboardingStep: number;

  setDarkMode: (v: boolean) => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (v: boolean) => void;
  setCmdOpen: (v: boolean) => void;
  toast: (message: string, type?: Toast["type"]) => void;
  setSaveStatus: (s: SaveStatus) => void;
  setFilterText: (v: string) => void;
  setSearchQuery: (v: string) => void;
  setShowOnboarding: (v: boolean) => void;
  setOnboardingStep: (v: number) => void;

  withSave: <T>(fn: () => Promise<T>) => Promise<T>;
}

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: safeGetItem("sa_darkMode") !== "false",
  sidebarOpen: true,
  cmdOpen: false,
  toasts: [],
  saveStatus: "idle",
  filterText: "",
  searchQuery: "",
  showOnboarding: false,
  onboardingStep: 0,

  setDarkMode: (v) => {
    safeSetItem("sa_darkMode", String(v));
    set({ darkMode: v });
  },
  toggleDarkMode: () => {
    const next = !get().darkMode;
    safeSetItem("sa_darkMode", String(next));
    set({ darkMode: next });
  },
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setCmdOpen: (v) => set({ cmdOpen: v }),
  toast: (message, type = "info") => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Phase 1: mark as exiting (triggers exit animation)
    setTimeout(
      () => set((state) => ({ toasts: state.toasts.map((t) => t.id === id ? { ...t, exiting: true } : t) })),
      2700
    );
    // Phase 2: remove from DOM
    setTimeout(
      () => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      3000
    );
  },
  setSaveStatus: (s) => set({ saveStatus: s }),
  setFilterText: (v) => set({ filterText: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setShowOnboarding: (v) => set({ showOnboarding: v }),
  setOnboardingStep: (v) => set({ onboardingStep: v }),

  withSave: async (fn) => {
    set({ saveStatus: "saving" });
    try {
      const result = await fn();
      set({ saveStatus: "saved" });
      setTimeout(
        () => set((s) => ({ saveStatus: s.saveStatus === "saved" ? "idle" : s.saveStatus })),
        2000
      );
      return result;
    } catch (err) {
      set({ saveStatus: "error" });
      const msg = err instanceof Error ? err.message : "Save failed";
      get().toast(msg, "error");
      console.error("Save error:", err);
      throw err;
    }
  },
}));

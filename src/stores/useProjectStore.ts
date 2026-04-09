import { create } from "zustand";
import type { ProjectMeta } from "../types";
import * as api from "../api";
import { saveMetaToLocal } from "./useDataStore";

interface ProjectState {
  meta: ProjectMeta;
  scratchpadText: string;
  promptIndex: number;

  setMeta: (meta: Partial<ProjectMeta>) => void;
  updateMeta: (updates: Partial<ProjectMeta>) => Promise<void>;
  setScratchpadText: (text: string) => void;
  nextPrompt: () => void;
}

const DEFAULT_META: ProjectMeta = {
  projectName: "",
  genre: "",
  format: "novel",
  description: "",
  author: "",
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  meta: DEFAULT_META,
  scratchpadText: "",
  promptIndex: Math.floor(Math.random() * 10),

  setMeta: (updates) =>
    set((state) => {
      const merged = { ...state.meta, ...updates };
      saveMetaToLocal(merged as Record<string, unknown>);
      return { meta: merged };
    }),

  updateMeta: async (updates) => {
    const merged = { ...get().meta, ...updates };
    set({ meta: merged });
    saveMetaToLocal(merged as Record<string, unknown>);
    try {
      await api.updateMeta(updates);
    } catch (err) {
      console.error("Failed to sync meta to backend:", err);
    }
  },

  setScratchpadText: (text) => {
    set({ scratchpadText: text });
    localStorage.setItem("sa_scratchpad_local", text);
  },

  nextPrompt: () => set((s) => ({ promptIndex: s.promptIndex + 1 })),
}));

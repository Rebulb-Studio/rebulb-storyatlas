import { create } from "zustand";
import type { ProjectMeta } from "../types";
import * as api from "../api";

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
    set((state) => ({ meta: { ...state.meta, ...updates } })),

  updateMeta: async (updates) => {
    const merged = { ...get().meta, ...updates };
    set({ meta: merged });
    try {
      await api.updateMeta(updates);
    } catch (err) {
      console.error("Failed to update meta:", err);
    }
  },

  setScratchpadText: (text) => set({ scratchpadText: text }),
  nextPrompt: () => set((s) => ({ promptIndex: s.promptIndex + 1 })),
}));

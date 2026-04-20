import { create } from "zustand";
import type { ProjectMeta } from "../types";
import * as api from "../api";
import { saveMetaToLocal, loadMetaFromLocal } from "./useDataStore";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";
import { enqueueWrite, notifyQueueChanged } from "../api/writeQueue";
import { useUIStore } from "./useUIStore";

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

// ─── Synchronous initialization from localStorage ──────────
const cachedMeta = loadMetaFromLocal();
const initialMeta: ProjectMeta = cachedMeta
  ? { ...DEFAULT_META, ...(cachedMeta as Partial<ProjectMeta>) }
  : DEFAULT_META;

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof Error) {
    const msg = err.message || "";
    if (/Failed to fetch|NetworkError|ERR_NETWORK|timeout|TypeError/i.test(msg)) return true;
    if (/HTTP 5\d\d|Request failed: 5\d\d/.test(msg)) return true;
  }
  return false;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  meta: initialMeta,
  scratchpadText: safeGetItem("sa_scratchpad_local") || "",
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
      if (isNetworkError(err)) {
        await enqueueWrite({
          method: "PUT",
          url: `${API_BASE}/meta`,
          body: updates,
          groupKey: "meta",
        });
        notifyQueueChanged();
        useUIStore.getState().toast("Meta saved offline — will sync", "warning");
      } else {
        useUIStore.getState().toast(
          err instanceof Error ? err.message : "Meta save failed",
          "error",
        );
      }
      console.error("Failed to sync meta to backend:", err);
    }
  },

  setScratchpadText: (text) => {
    set({ scratchpadText: text });
    const res = safeSetItem("sa_scratchpad_local", text);
    if (!res.ok && res.reason === "quota") {
      useUIStore.getState().toast("Storage full — scratchpad not cached locally", "warning");
    }
  },

  nextPrompt: () => set((s) => ({ promptIndex: s.promptIndex + 1 })),
}));

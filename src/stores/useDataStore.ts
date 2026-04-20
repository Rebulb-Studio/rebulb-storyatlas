import { create } from "zustand";
import type { Entry, CollectionData } from "../types";
import * as api from "../api";
import { safeGetJSON, safeSetJSON } from "../utils/safeStorage";
import { enqueueWrite, notifyQueueChanged, drainQueue } from "../api/writeQueue";
import { useUIStore } from "./useUIStore";

const STORAGE_KEY = "sa_data_cache";
const META_STORAGE_KEY = "sa_meta_cache";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function quotaToast(key: string) {
  useUIStore.getState().toast(
    `Storage full — ${key === STORAGE_KEY ? "recent work" : "project metadata"} may not be cached locally.`,
    "warning",
  );
}

function saveToLocal(data: CollectionData) {
  const res = safeSetJSON(STORAGE_KEY, data);
  if (!res.ok && res.reason === "quota") quotaToast(STORAGE_KEY);
}

function loadFromLocal(): CollectionData | null {
  return safeGetJSON<CollectionData>(STORAGE_KEY);
}

export function saveMetaToLocal(meta: Record<string, unknown>) {
  const res = safeSetJSON(META_STORAGE_KEY, meta);
  if (!res.ok && res.reason === "quota") quotaToast(META_STORAGE_KEY);
}

export function loadMetaFromLocal(): Record<string, unknown> | null {
  return safeGetJSON<Record<string, unknown>>(META_STORAGE_KEY);
}

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof Error) {
    const msg = err.message || "";
    if (/Failed to fetch|NetworkError|ERR_NETWORK|timeout|TypeError/i.test(msg)) return true;
    // 5xx from our API layer surfaces as "HTTP 5xx" — treat as retryable
    if (/HTTP 5\d\d|Request failed: 5\d\d/.test(msg)) return true;
  }
  return false;
}

// ─── Synchronous initialization from localStorage ──────────
// This runs BEFORE React renders, so the app has data immediately.
const initialData = loadFromLocal() || {};
const hasCache = Object.keys(initialData).length > 0;

interface DataState {
  data: CollectionData;
  loaded: boolean;
  backendOnline: boolean;
  syncWithBackend: () => Promise<unknown>;
  addEntry: (collection: string, entry: Partial<Entry>) => Promise<Entry>;
  updateEntry: (collection: string, id: string, updates: Partial<Entry>) => Promise<Entry>;
  deleteEntry: (collection: string, id: string) => Promise<void>;
  setData: (data: CollectionData) => void;
}

function reportSaveSuccess(collection: string, op: string, latencyMs: number) {
  if (import.meta.env.DEV) {
    console.info("[save]", op, collection, `${latencyMs}ms`);
  }
}

export const useDataStore = create<DataState>((set, get) => ({
  data: initialData,
  loaded: hasCache || false,
  backendOnline: false,

  syncWithBackend: async () => {
    try {
      const payload = await api.loadAll();
      const { meta, ...collections } = payload;
      const data = collections as CollectionData;
      set({ data, loaded: true, backendOnline: true });
      saveToLocal(data);
      if (meta) saveMetaToLocal(meta as Record<string, unknown>);
      // Backend reachable — drain any queued offline writes.
      void drainQueue({
        onFlushed: () => {
          useUIStore.getState().toast("Synced offline changes", "success");
        },
        onParked: (item) => {
          useUIStore.getState().toast(
            `Could not sync one change after multiple tries (${item.method} ${item.url})`,
            "error",
          );
        },
      });
      return meta;
    } catch {
      set({ loaded: true, backendOnline: false });
      return loadMetaFromLocal();
    }
  },

  addEntry: async (collection, entry) => {
    const tempId = entry.id || Math.random().toString(36).slice(2, 14);
    const ts = new Date().toISOString();
    const tempEntry = { ...entry, id: tempId, createdAt: ts, updatedAt: ts } as Entry;

    // Optimistic: update state immediately (subscribe auto-saves to localStorage).
    set((state) => ({
      data: {
        ...state.data,
        [collection]: [tempEntry, ...(state.data[collection] || [])],
      },
    }));

    const started = performance.now();
    try {
      const created = await api.createEntry(collection, entry);
      set((state) => ({
        data: {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === tempId ? created : e
          ),
        },
        backendOnline: true,
      }));
      reportSaveSuccess(collection, "create", performance.now() - started);
      return created;
    } catch (err) {
      set({ backendOnline: false });
      if (isNetworkError(err)) {
        await enqueueWrite({
          method: "POST",
          url: `${API_BASE}/${collection}`,
          body: entry,
          groupKey: `${collection}:new`,
        });
        notifyQueueChanged();
        useUIStore.getState().toast("Saved offline — will sync when backend returns", "warning");
      } else {
        useUIStore.getState().toast(
          err instanceof Error ? err.message : "Create failed",
          "error",
        );
        // Rollback the optimistic insert for non-retryable errors
        set((state) => ({
          data: {
            ...state.data,
            [collection]: (state.data[collection] || []).filter((e) => e.id !== tempId),
          },
        }));
      }
      console.error("Failed to sync entry to backend:", err);
      return tempEntry;
    }
  },

  updateEntry: async (collection, id, updates) => {
    // Capture previous state for rollback on permanent failure.
    const prev = (get().data[collection] || []).find((e) => e.id === id);

    // Optimistic: update state immediately
    set((state) => {
      const existing = (state.data[collection] || []).find((e) => e.id === id);
      const merged = { ...existing, ...updates, id, updatedAt: new Date().toISOString() } as Entry;
      return {
        data: {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === id ? merged : e
          ),
        },
      };
    });

    const started = performance.now();
    try {
      const updated = await api.updateEntry(collection, id, updates);
      set((state) => ({
        data: {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === id ? updated : e
          ),
        },
        backendOnline: true,
      }));
      reportSaveSuccess(collection, "update", performance.now() - started);
      return updated;
    } catch (err) {
      set({ backendOnline: false });
      if (isNetworkError(err)) {
        await enqueueWrite({
          method: "PUT",
          url: `${API_BASE}/${collection}/${id}`,
          body: updates,
          groupKey: `${collection}:${id}`,
        });
        notifyQueueChanged();
        useUIStore.getState().toast("Saved offline — will sync when backend returns", "warning");
      } else {
        useUIStore.getState().toast(
          err instanceof Error ? err.message : "Update failed",
          "error",
        );
        // Rollback optimistic update on permanent failure
        if (prev) {
          set((state) => ({
            data: {
              ...state.data,
              [collection]: (state.data[collection] || []).map((e) =>
                e.id === id ? prev : e
              ),
            },
          }));
        }
      }
      console.error("Failed to sync update to backend:", err);
      const current = (get().data[collection] || []).find((e) => e.id === id);
      return current || ({ id, ...updates } as Entry);
    }
  },

  deleteEntry: async (collection, id) => {
    const prev = (get().data[collection] || []).find((e) => e.id === id);
    // Optimistic: remove immediately
    set((state) => ({
      data: {
        ...state.data,
        [collection]: (state.data[collection] || []).filter((e) => e.id !== id),
      },
    }));

    try {
      await api.deleteEntry(collection, id);
      set({ backendOnline: true });
    } catch (err) {
      set({ backendOnline: false });
      if (isNetworkError(err)) {
        await enqueueWrite({
          method: "DELETE",
          url: `${API_BASE}/${collection}/${id}`,
          groupKey: `${collection}:${id}`,
        });
        notifyQueueChanged();
        useUIStore.getState().toast("Deletion queued — will sync when backend returns", "warning");
      } else {
        useUIStore.getState().toast(
          err instanceof Error ? err.message : "Delete failed",
          "error",
        );
        // Rollback: put it back
        if (prev) {
          set((state) => ({
            data: {
              ...state.data,
              [collection]: [prev, ...(state.data[collection] || [])],
            },
          }));
        }
      }
      console.error("Failed to sync delete to backend:", err);
    }
  },

  setData: (data) => set({ data }),
}));

// ─── Auto-save to localStorage on every state change ────────
useDataStore.subscribe((state, prev) => {
  if (state.data !== prev.data) {
    saveToLocal(state.data);
  }
});

// ─── Cross-tab sync ────────────────────────────────────────
// When another tab writes to sa_data_cache, rehydrate from it so this tab
// doesn't show stale data. Skip if the change came from this tab (no key).
if (typeof window !== "undefined") {
  window.addEventListener("storage", (ev) => {
    if (ev.key !== STORAGE_KEY || !ev.newValue) return;
    try {
      const next = JSON.parse(ev.newValue) as CollectionData;
      useDataStore.setState({ data: next });
    } catch { /* ignore malformed */ }
  });
}

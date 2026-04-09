import { create } from "zustand";
import type { Entry, CollectionData } from "../types";
import * as api from "../api";

const STORAGE_KEY = "sa_data_cache";
const META_STORAGE_KEY = "sa_meta_cache";

function saveToLocal(data: CollectionData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded, ignore */ }
}

function loadFromLocal(): CollectionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveMetaToLocal(meta: Record<string, unknown>) {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch { /* ignore */ }
}

export function loadMetaFromLocal(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ─── Synchronous initialization from localStorage ──────────
// This runs BEFORE React renders, so the app has data immediately
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

export const useDataStore = create<DataState>((set, get) => ({
  data: initialData,
  loaded: hasCache || false,
  backendOnline: false,

  // This is a BACKGROUND SYNC — not the primary data source
  syncWithBackend: async () => {
    try {
      const payload = await api.loadAll();
      const { meta, ...collections } = payload;
      const data = collections as CollectionData;
      set({ data, loaded: true, backendOnline: true });
      saveToLocal(data);
      if (meta) saveMetaToLocal(meta as Record<string, unknown>);
      return meta;
    } catch {
      // Backend is down — we already have cached data from init
      set({ loaded: true, backendOnline: false });
      return loadMetaFromLocal();
    }
  },

  addEntry: async (collection, entry) => {
    const tempId = entry.id || Math.random().toString(36).slice(2, 14);
    const ts = new Date().toISOString();
    const tempEntry = { ...entry, id: tempId, createdAt: ts, updatedAt: ts } as Entry;

    // Optimistic: update state immediately (subscribe auto-saves to localStorage)
    set((state) => ({
      data: {
        ...state.data,
        [collection]: [tempEntry, ...(state.data[collection] || [])],
      },
    }));

    // Try to sync with backend
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
      return created;
    } catch (err) {
      set({ backendOnline: false });
      console.error("Failed to sync entry to backend:", err);
      return tempEntry;
    }
  },

  updateEntry: async (collection, id, updates) => {
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
      return updated;
    } catch (err) {
      set({ backendOnline: false });
      console.error("Failed to sync update to backend:", err);
      const current = (get().data[collection] || []).find((e) => e.id === id);
      return current || ({ id, ...updates } as Entry);
    }
  },

  deleteEntry: async (collection, id) => {
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

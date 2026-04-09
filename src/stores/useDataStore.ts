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

interface DataState {
  data: CollectionData;
  loaded: boolean;
  backendOnline: boolean;
  loadAll: () => Promise<unknown>;
  addEntry: (collection: string, entry: Partial<Entry>) => Promise<Entry>;
  updateEntry: (collection: string, id: string, updates: Partial<Entry>) => Promise<Entry>;
  deleteEntry: (collection: string, id: string) => Promise<void>;
  setData: (data: CollectionData) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  data: {},
  loaded: false,
  backendOnline: false,

  loadAll: async () => {
    // Try backend first
    try {
      const payload = await api.loadAll();
      const { meta, ...collections } = payload;
      const data = collections as CollectionData;
      set({ data, loaded: true, backendOnline: true });
      // Cache to localStorage
      saveToLocal(data);
      if (meta) saveMetaToLocal(meta as Record<string, unknown>);
      return meta;
    } catch {
      // Fall back to localStorage
      const cached = loadFromLocal();
      if (cached) {
        set({ data: cached, loaded: true, backendOnline: false });
        return loadMetaFromLocal();
      }
      set({ loaded: true, backendOnline: false });
      return null;
    }
  },

  addEntry: async (collection, entry) => {
    // Optimistic: add to state immediately
    const tempId = entry.id || Math.random().toString(36).slice(2, 14);
    const tempEntry = { ...entry, id: tempId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Entry;

    set((state) => {
      const newData = {
        ...state.data,
        [collection]: [tempEntry, ...(state.data[collection] || [])],
      };
      saveToLocal(newData);
      return { data: newData };
    });

    // Try to sync with backend
    try {
      const created = await api.createEntry(collection, entry);
      // Replace temp entry with server response
      set((state) => {
        const newData = {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === tempId ? created : e
          ),
        };
        saveToLocal(newData);
        return { data: newData, backendOnline: true };
      });
      return created;
    } catch (err) {
      // Keep the local entry — it's saved in localStorage
      set({ backendOnline: false });
      console.error("Failed to sync entry to backend:", err);
      return tempEntry;
    }
  },

  updateEntry: async (collection, id, updates) => {
    // Optimistic: update state immediately
    const optimistic = { ...updates, id, updatedAt: new Date().toISOString() } as Entry;

    set((state) => {
      const existing = (state.data[collection] || []).find((e) => e.id === id);
      const merged = { ...existing, ...optimistic };
      const newData = {
        ...state.data,
        [collection]: (state.data[collection] || []).map((e) =>
          e.id === id ? merged : e
        ),
      };
      saveToLocal(newData);
      return { data: newData };
    });

    // Try to sync with backend
    try {
      const updated = await api.updateEntry(collection, id, updates);
      set((state) => {
        const newData = {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === id ? updated : e
          ),
        };
        saveToLocal(newData);
        return { data: newData, backendOnline: true };
      });
      return updated;
    } catch (err) {
      set({ backendOnline: false });
      console.error("Failed to sync update to backend:", err);
      // Return the optimistic version — it's in localStorage
      const current = (get().data[collection] || []).find((e) => e.id === id);
      return current || optimistic;
    }
  },

  deleteEntry: async (collection, id) => {
    // Optimistic: remove from state immediately
    set((state) => {
      const newData = {
        ...state.data,
        [collection]: (state.data[collection] || []).filter((e) => e.id !== id),
      };
      saveToLocal(newData);
      return { data: newData };
    });

    // Try to sync with backend
    try {
      await api.deleteEntry(collection, id);
      set({ backendOnline: true });
    } catch (err) {
      set({ backendOnline: false });
      console.error("Failed to sync delete to backend:", err);
    }
  },

  setData: (data) => {
    saveToLocal(data);
    set({ data });
  },
}));

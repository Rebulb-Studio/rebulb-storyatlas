import { create } from "zustand";
import type { Entry, CollectionData } from "../types";
import * as api from "../api";

interface DataState {
  data: CollectionData;
  loaded: boolean;
  loadAll: () => Promise<unknown>;
  addEntry: (collection: string, entry: Partial<Entry>) => Promise<Entry | null>;
  updateEntry: (collection: string, id: string, updates: Partial<Entry>) => Promise<Entry | null>;
  deleteEntry: (collection: string, id: string) => Promise<boolean>;
  setData: (data: CollectionData) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  data: {},
  loaded: false,

  loadAll: async () => {
    const payload = await api.loadAll();
    const { meta, ...collections } = payload;
    set({ data: collections as CollectionData, loaded: true });
    return meta;
  },

  addEntry: async (collection, entry) => {
    try {
      const created = await api.createEntry(collection, entry);
      set((state) => ({
        data: {
          ...state.data,
          [collection]: [created, ...(state.data[collection] || [])],
        },
      }));
      return created;
    } catch (err) {
      console.error("Failed to create entry:", err);
      return null;
    }
  },

  updateEntry: async (collection, id, updates) => {
    try {
      const updated = await api.updateEntry(collection, id, updates);
      set((state) => ({
        data: {
          ...state.data,
          [collection]: (state.data[collection] || []).map((e) =>
            e.id === id ? updated : e
          ),
        },
      }));
      return updated;
    } catch (err) {
      console.error("Failed to update entry:", err);
      return null;
    }
  },

  deleteEntry: async (collection, id) => {
    try {
      await api.deleteEntry(collection, id);
      set((state) => ({
        data: {
          ...state.data,
          [collection]: (state.data[collection] || []).filter(
            (e) => e.id !== id
          ),
        },
      }));
      return true;
    } catch (err) {
      console.error("Failed to delete entry:", err);
      return false;
    }
  },

  setData: (data) => set({ data }),
}));

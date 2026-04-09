import { create } from "zustand";

interface ProState {
  isPro: boolean;
  proKey: string | null;
  activateKey: (key: string) => boolean;
  deactivate: () => void;
}

export const useProStore = create<ProState>((set) => ({
  isPro: localStorage.getItem("sa_pro_key") !== null,
  proKey: localStorage.getItem("sa_pro_key"),

  activateKey: (key: string) => {
    const trimmed = key.trim();
    if (!trimmed || trimmed.length < 8) return false;
    localStorage.setItem("sa_pro_key", trimmed);
    set({ isPro: true, proKey: trimmed });
    return true;
  },

  deactivate: () => {
    localStorage.removeItem("sa_pro_key");
    set({ isPro: false, proKey: null });
  },
}));

export const PRO_FEATURES: Record<string, { label: string; free: boolean }> = {
  exportZIP: { label: "ZIP Export", free: false },
  shareLinks: { label: "Share Links", free: false },
  versionHistory: { label: "Version History", free: false },
  pitchBible: { label: "Pitch Bible Generator", free: false },
  forceGraph: { label: "Relationship Graph", free: false },
  csvExport: { label: "CSV Export", free: false },
  // Everything else is free
  crud: { label: "Create & Edit Entries", free: true },
  richText: { label: "Rich Text Editor", free: true },
  search: { label: "Advanced Search", free: true },
  exportJSON: { label: "JSON Backup", free: true },
  worldBible: { label: "World Bible", free: true },
  storyCanvas: { label: "Story Canvas", free: true },
  scratchpad: { label: "Scratchpad", free: true },
  writingTools: { label: "Writing Tools", free: true },
};

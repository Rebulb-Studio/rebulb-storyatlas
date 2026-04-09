import { useState } from "react";
import { COLLECTION_DEFS } from "../constants";
import { getCompleteness } from "../workspace/WorkspaceViews";
import * as api from "../api";
import { useUIStore } from "../stores/useUIStore";
import { useDataStore } from "../stores/useDataStore";
import type { Entry, Theme } from "../types";

interface Props {
  collection: string;
  items: Entry[];
  filterText: string;
  onFilterChange: (v: string) => void;
  onView: (item: Entry) => void;
  onCreate: () => void;
  theme: Theme;
}

export default function CollectionList({ collection, items, filterText, onFilterChange, onView, onCreate, theme: t }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const toast = useUIStore((s) => s.toast);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const filtered = items.filter((e) => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return ((e.name as string) || (e.title as string) || "").toLowerCase().includes(q);
    });
    setSelected(new Set(filtered.map((e) => e.id)));
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} entries?`)) return;
    const bulkItems = [...selected].map((id) => ({ collection, id }));
    const result = await api.bulkDelete(bulkItems);
    toast(`Deleted ${result.deleted} entries`, "info");
    // Reload data
    const payload = await api.loadAll();
    const { meta, ...collections } = payload;
    useDataStore.getState().setData(collections as Record<string, Entry[]>);
    setSelected(new Set());
    setBulkMode(false);
  };

  const bulkTag = async () => {
    const tag = prompt("Enter tag to add:");
    if (!tag?.trim() || !selected.size) return;
    const bulkItems = [...selected].map((id) => ({ collection, id }));
    const result = await api.bulkTag(bulkItems, tag.trim());
    toast(`Tagged ${result.updated} entries with "${tag.trim()}"`, "success");
    setSelected(new Set());
  };
  const cfg = COLLECTION_DEFS[collection];
  if (!cfg) return null;

  const filtered = items.filter((e) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return ((e.name as string) || (e.title as string) || "").toLowerCase().includes(q) ||
      Object.values(e).some((v) => typeof v === "string" && v.toLowerCase().includes(q));
  });

  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.55rem 0.7rem", color: t.text, fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
  };

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer" as const,
    fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
  });

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, margin: 0 }}>
          <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label}
          <span style={{ fontSize: "0.8rem", color: t.textDim, fontWeight: 400, marginLeft: "0.5rem" }}>({filtered.length})</span>
        </h2>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }} style={pillBtn(bulkMode ? t.accent : t.textDim)}>
            {bulkMode ? "Cancel" : "Select"}
          </button>
          <button onClick={onCreate} style={pillBtn(cfg.color)}>+ New</button>
        </div>
      </div>

      {/* Bulk toolbar */}
      {bulkMode && (
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={selectAll} style={pillBtn(t.info)}>Select All</button>
          <button onClick={() => setSelected(new Set())} style={pillBtn(t.textDim)}>Clear</button>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: "0.72rem", color: t.accent, fontWeight: 600 }}>{selected.size} selected</span>
              <button onClick={bulkDelete} style={pillBtn(t.danger)}>Delete Selected</button>
              <button onClick={bulkTag} style={pillBtn(t.success)}>Tag Selected</button>
            </>
          )}
        </div>
      )}

      <input placeholder={`Filter ${cfg.label.toLowerCase()}...`} value={filterText} onChange={(e) => onFilterChange(e.target.value)} style={inputStyle} />
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: t.textDim }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cfg.icon}</div>
          <div>No {cfg.label.toLowerCase()} yet. Create your first one!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
          {filtered.map((item, index) => {
            const comp = getCompleteness(collection, item);
            const snippet = cfg.fields?.filter((f) => f.t === "textarea" && item[f.k]).map((f) => item[f.k] as string)[0] || "";
            return (
              <button key={item.id} onClick={() => bulkMode ? toggleSelect(item.id) : onView(item)}
                className="hover-lift animate-slide-up"
                style={{ background: selected.has(item.id) ? t.accentDim : t.surface, border: `1px solid ${selected.has(item.id) ? t.accent + "40" : t.border}`, borderRadius: "8px", padding: "0.85rem 1rem", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "inherit", color: "inherit", animationDelay: `${index * 30}ms` }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.surfaceHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = t.surface)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem" }}>{(item.name as string) || (item.title as string) || "Untitled"}</div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "2px" }}>
                    {item.status && <span style={{ fontSize: "0.7rem", color: cfg.color }}>{String(item.status)}</span>}
                    {item.role ? <span style={{ fontSize: "0.7rem", color: t.textDim }}>{String(item.role)}</span> : null}
                    {item.type ? <span style={{ fontSize: "0.7rem", color: t.textDim }}>{String(item.type)}</span> : null}
                  </div>
                  {snippet && <div style={{ fontSize: "0.75rem", color: t.textDim, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{snippet.slice(0, 120)}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <div style={{ width: "40px", height: "4px", background: t.inputBorder, borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${comp}%`, background: comp > 60 ? t.success : comp > 30 ? "#f59e0b" : t.danger, borderRadius: "2px" }} />
                  </div>
                  <span style={{ color: t.textDim, fontSize: "0.65rem" }}>{comp}%</span>
                  <span style={{ color: t.textDim, fontSize: "0.9rem" }}>{"→"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

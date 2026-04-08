import { useState } from "react";
import { COLLECTION_DEFS } from "../constants";
import { getCompleteness } from "../workspace/WorkspaceViews";
import VersionHistory from "./VersionHistory";
import Comments from "./Comments";
import type { Entry, Theme } from "../types";

interface Props {
  collection: string;
  item: Entry;
  allEntries: (Entry & { _collection: string })[];
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onViewEntry: (col: string, entry: Entry) => void;
  theme: Theme;
}

export default function EntryDetail({ collection, item, allEntries, onEdit, onDelete, onBack, onViewEntry, theme: t }: Props) {
  const [showHistory, setShowHistory] = useState(false);
  const cfg = COLLECTION_DEFS[collection];
  if (!cfg || !item) return null;

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer" as const,
    fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
  });

  const backlinks = allEntries.filter((e) => {
    if (e.id === item.id && e._collection === collection) return false;
    const name = ((item.name as string) || (item.title as string) || "").toLowerCase();
    if (!name) return false;
    return Object.values(e).some((v) => typeof v === "string" && v.toLowerCase().includes(name));
  }).slice(0, 10);

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, margin: 0 }}>
          <span style={{ color: cfg.color, marginRight: "0.5rem" }}>{cfg.icon}</span>
          {(item.name as string) || (item.title as string) || "Untitled"}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={() => setShowHistory(true)} style={pillBtn(t.info)}>History</button>
          <button onClick={onEdit} style={pillBtn(cfg.color)}>Edit</button>
          <button onClick={onDelete} style={pillBtn("#ef4444")}>Delete</button>
          <button onClick={onBack} style={pillBtn("#475569")}>{"\u2190"} Back</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
        {cfg.fields?.filter((f) => f.t === "select" && item[f.k]).map((f) => (
          <span key={f.k} style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>
            {f.l}: {item[f.k] as string}
          </span>
        ))}
        {item._status ? (
          <span style={{ background: item._status === "published" ? t.success + "20" : item._status === "archived" ? t.textDim + "20" : t.accent + "15", border: `1px solid ${item._status === "published" ? t.success : item._status === "archived" ? t.textDim : t.accent}40`, color: item._status === "published" ? t.success : item._status === "archived" ? t.textDim : t.accent, fontSize: "0.68rem", padding: "3px 8px", borderRadius: "20px", fontWeight: 600 }}>
            {String(item._status).charAt(0).toUpperCase() + String(item._status).slice(1)}
          </span>
        ) : null}
        <span style={{ background: t.accentDim, border: `1px solid ${t.accent}30`, color: t.accent, fontSize: "0.68rem", padding: "3px 8px", borderRadius: "20px" }}>
          {getCompleteness(collection, item)}% complete
        </span>
      </div>
      {cfg.fields?.filter((f) => item[f.k] && f.t !== "select").map((f) => (
        <div key={f.k} style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.7rem", color: cfg.color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>{f.l}</div>
          <div style={{ fontSize: "0.9rem", color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {f.t === "tags" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {(Array.isArray(item[f.k]) ? item[f.k] as string[] : typeof item[f.k] === "string" ? (item[f.k] as string).split(",") : []).map((tag, i) => (
                  <span key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>{String(tag).trim()}</span>
                ))}
              </div>
            ) : item[f.k] as string}
          </div>
        </div>
      ))}
      {backlinks.length > 0 && (
        <div style={{ marginTop: "1.5rem", padding: "1rem", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
          <div style={{ fontSize: "0.75rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Referenced By</div>
          {backlinks.map((bl) => {
            const blCfg = COLLECTION_DEFS[bl._collection];
            return (
              <button key={bl.id} onClick={() => onViewEntry(bl._collection, bl)}
                style={{ display: "flex", gap: "0.5rem", alignItems: "center", width: "100%", background: "transparent", border: "none", padding: "0.3rem 0", cursor: "pointer", fontFamily: "inherit", color: t.text, fontSize: "0.82rem", textAlign: "left" }}>
                <span style={{ color: blCfg?.color }}>{blCfg?.icon}</span>
                <span>{(bl.name as string) || (bl.title as string) || "Untitled"}</span>
                <span style={{ fontSize: "0.65rem", color: t.textDim }}>{blCfg?.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {/* User Tags */}
      {item._tags ? (
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {String(item._tags).split(",").filter(Boolean).map((tag, i) => (
            <span key={i} style={{ background: t.accentDim, border: `1px solid ${t.accent}30`, color: t.accent, fontSize: "0.72rem", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 }}>{tag.trim()}</span>
          ))}
        </div>
      ) : null}

      {/* Comments */}
      <Comments collection={collection} entryId={item.id} theme={t} />

      {/* Version History Modal */}
      {showHistory && (
        <VersionHistory
          collection={collection}
          entryId={item.id}
          onRestore={(restored) => { setShowHistory(false); window.location.reload(); }}
          onClose={() => setShowHistory(false)}
          theme={t}
        />
      )}
    </div>
  );
}

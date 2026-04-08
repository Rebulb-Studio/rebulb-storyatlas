import { useState, useEffect } from "react";
import type { Theme, Entry } from "../types";

interface Version {
  versionId: number;
  data: Entry;
  createdAt: string;
}

interface Props {
  collection: string;
  entryId: string;
  onRestore: (entry: Entry) => void;
  onClose: () => void;
  theme: Theme;
}

export default function VersionHistory({ collection, entryId, onRestore, onClose, theme: t }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Version | null>(null);

  useEffect(() => {
    fetch(`/api/${collection}/${entryId}/history`)
      .then((r) => r.json())
      .then((data) => { setVersions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [collection, entryId]);

  const restore = async (v: Version) => {
    if (!confirm(`Restore to version from ${v.createdAt}? Current state will be saved as a version.`)) return;
    const res = await fetch(`/api/${collection}/${entryId}/restore/${v.versionId}`, { method: "POST" });
    if (res.ok) {
      const restored = await res.json();
      onRestore(restored);
    }
  };

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.3rem 0.7rem", borderRadius: "16px", cursor: "pointer" as const,
    fontSize: "0.72rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 6000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: "12px", width: "90%", maxWidth: "700px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, margin: 0 }}>Version History</h3>
          <button onClick={onClose} style={pillBtn(t.textDim)}>Close</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", display: "flex" }}>
          {/* Version List */}
          <div style={{ width: "240px", borderRight: `1px solid ${t.border}`, overflowY: "auto", flexShrink: 0 }}>
            {loading && <div style={{ padding: "1rem", color: t.textDim, fontSize: "0.82rem" }}>Loading...</div>}
            {!loading && versions.length === 0 && <div style={{ padding: "1rem", color: t.textDim, fontSize: "0.82rem" }}>No previous versions</div>}
            {versions.map((v) => (
              <button key={v.versionId} onClick={() => setSelected(v)}
                style={{
                  display: "block", width: "100%", padding: "0.6rem 0.75rem", border: "none", borderBottom: `1px solid ${t.border}`,
                  background: selected?.versionId === v.versionId ? t.accentDim : "transparent",
                  color: t.text, textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem",
                }}>
                <div style={{ fontWeight: 600, color: t.textBright }}>{new Date(v.createdAt).toLocaleDateString()}</div>
                <div style={{ fontSize: "0.68rem", color: t.textDim }}>{new Date(v.createdAt).toLocaleTimeString()}</div>
                <div style={{ fontSize: "0.68rem", color: t.textMuted, marginTop: "2px" }}>{(v.data.name as string) || (v.data.title as string) || "Untitled"}</div>
              </button>
            ))}
          </div>
          {/* Version Preview */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
            {!selected ? (
              <div style={{ color: t.textDim, fontSize: "0.85rem", textAlign: "center", paddingTop: "2rem" }}>Select a version to preview</div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: t.textDim }}>Version from {selected.createdAt}</div>
                  <button onClick={() => restore(selected)} style={pillBtn(t.accent)}>Restore This Version</button>
                </div>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {Object.entries(selected.data).filter(([k]) => !["id", "createdAt", "updatedAt", "_collection"].includes(k)).map(([key, val]) => {
                    if (!val) return null;
                    return (
                      <div key={key} style={{ fontSize: "0.82rem" }}>
                        <div style={{ fontSize: "0.68rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.15rem" }}>{key}</div>
                        <div style={{ color: t.textMuted, whiteSpace: "pre-wrap", maxHeight: "200px", overflow: "auto" }}>{String(val)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { useDataStore } from "../stores/useDataStore";
import { useUIStore } from "../stores/useUIStore";
import { useProjectStore } from "../stores/useProjectStore";
import { estimateTotalWords } from "../workspace/WorkspaceViews";
import type { Theme } from "../types";

export default function StatusBar({ theme: t }: { theme: Theme }) {
  const data = useDataStore((s) => s.data);
  const backendOnline = useDataStore((s) => s.backendOnline);
  const saveStatus = useUIStore((s) => s.saveStatus);
  const setCmdOpen = useUIStore((s) => s.setCmdOpen);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);

  const totalEntries = useMemo(
    () => Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0),
    [data]
  );

  return (
    <div style={{
      height: "32px", background: t.surface, borderTop: `1px solid ${t.border}`,
      display: "flex", alignItems: "center", padding: "0 1rem", gap: "1.5rem",
      fontSize: "0.68rem", color: t.textDim, flexShrink: 0,
    }}>
      <span>{meta.projectName || "Untitled Project"}</span>
      <span>{totalEntries} entries</span>
      <span>{estimateTotalWords(data, scratchpadText).toLocaleString()} words</span>
      <span style={{
        marginLeft: "auto",
        display: "flex", alignItems: "center", gap: "0.5rem",
      }}>
        {!backendOnline && (
          <span style={{ color: t.danger, display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: t.danger, display: "inline-block" }} />
            Offline
          </span>
        )}
        <span style={{
          color: saveStatus === "error" ? t.danger : saveStatus === "saving" ? t.accent : saveStatus === "saved" ? t.success : t.textDim,
        }}>
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : backendOnline ? "Ready" : "Local"}
        </span>
      </span>
      <span style={{ cursor: "pointer" }} onClick={() => setCmdOpen(true)} title="Ctrl+K">{"\u{2318}"}K</span>
    </div>
  );
}

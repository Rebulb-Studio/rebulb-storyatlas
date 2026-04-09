import { useState } from "react";
import type { Theme } from "../types";
import { COLLECTION_DEFS } from "../constants";
import { exportJSON, exportZIP, exportSelective } from "../api";
import { useDataStore } from "../stores/useDataStore";
import AIExportModal from "./AIExportModal";

type ExportFormat = "json" | "zip" | "selective" | "csv" | "ai";

interface Props {
  theme: Theme;
  toast: (msg: string, type?: "info" | "success" | "error") => void;
}

export default function ExportPanel({ theme: t, toast }: Props) {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [showAIModal, setShowAIModal] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(Object.keys(COLLECTION_DEFS)));
  const [exporting, setExporting] = useState(false);
  const data = useDataStore((s) => s.data);

  const collectionKeys = Object.keys(COLLECTION_DEFS);
  const needsSelection = format === "selective" || format === "csv";

  const toggleCollection = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(collectionKeys));
  const deselectAll = () => setSelected(new Set());

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      switch (format) {
        case "json":
          await exportJSON();
          toast("JSON backup downloaded", "success");
          break;
        case "zip":
          await exportZIP();
          toast("ZIP package downloaded", "success");
          break;
        case "selective":
          if (selected.size === 0) { toast("Select at least one collection", "error"); setExporting(false); return; }
          await exportSelective(Array.from(selected), "json");
          toast("Selective JSON downloaded", "success");
          break;
        case "csv":
          if (selected.size === 0) { toast("Select at least one collection", "error"); setExporting(false); return; }
          await exportSelective(Array.from(selected), "csv");
          toast("CSV export downloaded", "success");
          break;
      }
    } catch {
      toast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  const pillBtn = (color: string, active = false): React.CSSProperties => ({
    background: active ? color + "30" : color + "18",
    border: `1px solid ${active ? color : color + "40"}`,
    color,
    padding: "0.3rem 0.7rem",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };

  const formats: { value: ExportFormat; label: string }[] = [
    { value: "json", label: "JSON Backup" },
    { value: "zip", label: "ZIP Package" },
    { value: "selective", label: "Selective JSON" },
    { value: "csv", label: "CSV Export" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, margin: 0 }}>
        Export Your World
      </h3>

      {/* Format Selector */}
      <div>
        <div style={{ fontSize: "0.72rem", color: t.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
          Format
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {formats.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              style={pillBtn(t.accent, format === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Checkboxes */}
      {needsSelection && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <div style={{ fontSize: "0.72rem", color: t.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Collections
            </div>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              <button onClick={selectAll} style={pillBtn(t.accent)}>Select All</button>
              <button onClick={deselectAll} style={pillBtn(t.textDim)}>Deselect All</button>
            </div>
          </div>
          <div
            style={{
              ...inputStyle,
              padding: "0.5rem 0.7rem",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.35rem",
            }}
          >
            {collectionKeys.map((key) => {
              const def = COLLECTION_DEFS[key];
              const count = (data[key] || []).length;
              return (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    color: t.text,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() => toggleCollection(key)}
                    style={{ accentColor: t.accent }}
                  />
                  <span>{def.icon} {def.label}</span>
                  <span style={{ color: t.textDim, fontSize: "0.68rem", marginLeft: "auto" }}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            ...pillBtn(t.accent),
            padding: "0.45rem 1.2rem",
            fontSize: "0.82rem",
            opacity: exporting ? 0.5 : 1,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          {exporting ? "Exporting..." : "Export"}
        </button>
      </div>
    </div>
  );
}

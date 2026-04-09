import { useState, useEffect } from "react";
import type { Theme } from "../types";
import { useDataStore } from "../stores/useDataStore";
import { useProjectStore } from "../stores/useProjectStore";
import { exportAIContext, generateAIContextLocal } from "../api";
import { Z_INDEX } from "../constants";

interface Props {
  onClose: () => void;
  theme: Theme;
  toast: (msg: string, type?: "info" | "success" | "error") => void;
}

interface SectionToggle {
  key: string;
  label: string;
  dataKey: string;
}

const SECTIONS: SectionToggle[] = [
  { key: "characters", label: "Characters", dataKey: "characters" },
  { key: "locations", label: "Locations", dataKey: "locations" },
  { key: "factions", label: "Factions", dataKey: "factions" },
  { key: "plots", label: "Plots", dataKey: "plots" },
  { key: "lore", label: "Lore", dataKey: "lore" },
  { key: "systems", label: "Systems", dataKey: "systems" },
  { key: "timelineEvents", label: "Timeline", dataKey: "timelineEvents" },
];

export default function AIExportModal({ onClose, theme: t, toast }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.key, true]))
  );

  const pillBtn = (color: string): React.CSSProperties => ({
    background: color + "18",
    border: `1px solid ${color}40`,
    color,
    padding: "0.3rem 0.7rem",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  });

  const generateContent = async (sections: string[]) => {
    setLoading(true);
    try {
      const backendOnline = useDataStore.getState().backendOnline;
      if (backendOnline) {
        const result = await exportAIContext(sections);
        setContent(result.content);
      } else {
        const data = useDataStore.getState().data as Record<string, unknown[]>;
        const meta = useProjectStore.getState().meta as Record<string, unknown>;
        // Filter data to only enabled sections
        const filtered: Record<string, unknown[]> = {};
        for (const key of sections) {
          if (data[key]) filtered[key] = data[key];
        }
        const text = generateAIContextLocal(filtered, meta);
        setContent(text);
      }
    } catch {
      setContent("");
      toast("Failed to generate AI context", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const activeSections = SECTIONS.filter((s) => enabled[s.key]).map(
      (s) => s.key
    );
    generateContent(activeSections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const toggleSection = (key: string) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast("Copied to clipboard", "success");
    } catch {
      toast("Failed to copy to clipboard", "error");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storyatlas_ai_context.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    toast("Downloaded storyatlas_ai_context.md", "success");
  };

  const isEmpty = !loading && !content.trim();

  return (
    <div
      onClick={onClose}
      className="animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: Z_INDEX.commandPalette,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-scale-in"
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          width: "90%",
          maxWidth: "720px",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              color: t.textBright,
              margin: 0,
            }}
          >
            Export for AI Brainstorming
          </h3>
          <button onClick={onClose} style={pillBtn(t.textDim)}>
            Close
          </button>
        </div>

        {/* Section Toggles */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: t.textDim,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "0.4rem",
            }}
          >
            Include Sections
          </div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {SECTIONS.map((s) => (
              <label
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  color: enabled[s.key] ? t.text : t.textDim,
                  background: enabled[s.key] ? t.accent + "18" : t.surface,
                  border: `1px solid ${enabled[s.key] ? t.accent + "40" : t.border}`,
                  borderRadius: "16px",
                  padding: "0.25rem 0.6rem",
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={enabled[s.key]}
                  onChange={() => toggleSection(s.key)}
                  style={{
                    accentColor: t.accent,
                    width: "13px",
                    height: "13px",
                  }}
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>

        {/* Content Preview */}
        <div style={{ flex: 1, overflow: "auto", padding: "1rem 1.25rem" }}>
          {loading ? (
            <div
              style={{
                color: t.textDim,
                fontSize: "0.85rem",
                textAlign: "center",
                paddingTop: "2rem",
              }}
            >
              Generating...
            </div>
          ) : isEmpty ? (
            <div
              style={{
                color: t.textDim,
                fontSize: "0.85rem",
                textAlign: "center",
                paddingTop: "2rem",
              }}
            >
              No content to export. Create some entries first.
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                color: t.textMuted,
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                padding: "1rem",
                maxHeight: "100%",
                overflow: "auto",
              }}
            >
              {content}
            </pre>
          )}
        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderTop: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={handleCopy}
            disabled={loading || isEmpty}
            style={{
              ...pillBtn(t.accent),
              padding: "0.4rem 1rem",
              fontSize: "0.78rem",
              opacity: loading || isEmpty ? 0.4 : 1,
              cursor: loading || isEmpty ? "not-allowed" : "pointer",
            }}
          >
            Copy All
          </button>
          <button
            onClick={handleDownload}
            disabled={loading || isEmpty}
            style={{
              ...pillBtn(t.info),
              padding: "0.4rem 1rem",
              fontSize: "0.78rem",
              opacity: loading || isEmpty ? 0.4 : 1,
              cursor: loading || isEmpty ? "not-allowed" : "pointer",
            }}
          >
            Download .md
          </button>
          <button
            onClick={onClose}
            style={{
              ...pillBtn(t.textDim),
              padding: "0.4rem 1rem",
              fontSize: "0.78rem",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useRef } from "react";
import { useDataStore } from "../stores/useDataStore";
import { useUIStore } from "../stores/useUIStore";
import { useProjectStore } from "../stores/useProjectStore";
import { COLLECTION_DEFS, FORMAT_PRESETS, OUTLINE_METHODS, WRITING_PROMPTS } from "../constants";
import { estimateTotalWords } from "../workspace/WorkspaceViews";
import type { Theme } from "../types";
import * as api from "../api";

interface Props {
  navigate: (path: string) => void;
  theme: Theme;
}

const pillBtn = (color: string) => ({
  background: color + "18",
  border: `1px solid ${color}40`,
  color,
  padding: "0.35rem 0.9rem",
  borderRadius: "20px",
  cursor: "pointer" as const,
  fontSize: "0.78rem",
  fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif",
});

export default function Dashboard({ navigate, theme: t }: Props) {
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);
  const promptIndex = useProjectStore((s) => s.promptIndex);
  const toast = useUIStore((s) => s.toast);
  const withSave = useUIStore((s) => s.withSave);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalEntries = useMemo(
    () => Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0),
    [data],
  );

  const allEntries = useMemo(
    () =>
      Object.entries(data).flatMap(([col, items]) =>
        (Array.isArray(items) ? items : []).map((item) => ({ ...item, _collection: col })),
      ),
    [data],
  );

  const recentItems = useMemo(
    () =>
      [...allEntries]
        .sort((a, b) => ((b.updatedAt as string) || "").localeCompare((a.updatedAt as string) || ""))
        .slice(0, 8),
    [allEntries],
  );

  const formatInfo = FORMAT_PRESETS[meta.format] || FORMAT_PRESETS.novel;
  const prompt = WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length];

  const doUpdateMeta = (updates: Record<string, unknown>) => {
    useProjectStore.getState().updateMeta(updates);
  };

  const doExportJSON = () => {
    api.exportJSON();
    toast("JSON backup downloading", "info");
  };

  const doExportZIP = () => {
    api.exportZIP();
    toast("ZIP export downloading", "info");
  };

  const doImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.zip";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        await withSave(() => api.importFile(file).then(() => undefined));
        const payload = await api.loadAll();
        const { meta: loadedMeta, ...collections } = payload;
        useDataStore.getState().setData(collections as Record<string, never[]>);
        if (loadedMeta) useProjectStore.getState().setMeta(loadedMeta as Record<string, unknown>);
        toast("Import complete!", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Import failed", "error");
      }
    };
    input.click();
  };

  const doReset = async () => {
    if (!confirm("Reset ALL data? This cannot be undone.")) return;
    try {
      await withSave(() => api.importJSON({ meta: {}, data: {} }).then(() => undefined));
      useDataStore.getState().setData({});
      useProjectStore.getState().setMeta({ projectName: "", genre: "", format: "novel", description: "", author: "" });
      toast("All data reset", "info");
    } catch (err) {
      console.error("Failed to reset data:", err);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
  };

  const smallInput: React.CSSProperties = {
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.4rem 0.6rem",
    color: t.text,
    fontSize: "0.8rem",
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".json,.zip" style={{ display: "none" }} />

      {/* Project Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
          {"Rebulb Studio \· Creative Workspace"}
        </div>
        <input
          value={meta.projectName}
          onChange={(e) => doUpdateMeta({ projectName: e.target.value })}
          placeholder="Your Project Name"
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.6rem,4vw,2.4rem)",
            background: "transparent",
            border: "none",
            color: t.textBright,
            width: "100%",
            outline: "none",
            padding: 0,
          }}
        />
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <input
            value={meta.author}
            onChange={(e) => doUpdateMeta({ author: e.target.value })}
            placeholder="Author"
            style={{ ...smallInput, width: "160px" }}
          />
          <input
            value={meta.genre}
            onChange={(e) => doUpdateMeta({ genre: e.target.value })}
            placeholder="Genre"
            style={{ ...smallInput, width: "160px" }}
          />
          <select
            value={meta.format}
            onChange={(e) => doUpdateMeta({ format: e.target.value })}
            style={{ ...smallInput, width: "180px" }}
          >
            {Object.entries(FORMAT_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={meta.description}
          onChange={(e) => doUpdateMeta({ description: e.target.value })}
          placeholder="Project description / logline..."
          style={{ ...inputStyle, marginTop: "0.75rem", height: "60px", resize: "vertical" }}
        />
      </div>

      {/* Quick Start */}
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {["characters", "plots", "locations", "factions", "chapters"].map((col) => {
          const cfg = COLLECTION_DEFS[col];
          return (
            <button key={col} onClick={() => navigate(`/${col}/new`)} style={pillBtn(cfg.color)}>
              + {cfg.label.replace(/s$/, "")}
            </button>
          );
        })}
      </div>

      {/* Writing Prompt */}
      <div
        style={{
          background: `linear-gradient(135deg, ${t.accent}12, ${t.info}08)`,
          border: `2px solid ${t.accent}30`,
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.72rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {"\u270E"} Writing Prompt
          </div>
          <div style={{ fontSize: "0.68rem", color: t.textDim }}>
            Prompt {(promptIndex % WRITING_PROMPTS.length) + 1} of {WRITING_PROMPTS.length}
          </div>
        </div>
        <div
          style={{
            fontSize: "1rem",
            color: t.textBright,
            lineHeight: 1.7,
            marginBottom: "1rem",
            fontFamily: "'Playfair Display',serif",
            fontStyle: "italic",
          }}
        >
          {prompt}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button onClick={() => useProjectStore.getState().nextPrompt()} style={pillBtn(t.accent)}>
            Next Prompt
          </button>
          <button
            onClick={() => {
              useProjectStore.getState().setScratchpadText(scratchpadText + (scratchpadText ? "\n\n" : "") + prompt);
              toast("Prompt captured", "success");
            }}
            style={pillBtn(t.info)}
          >
            Capture
          </button>
          <button
            onClick={() => {
              useProjectStore
                .getState()
                .setScratchpadText(scratchpadText + (scratchpadText ? "\n\n---\n\n" : "") + `PROMPT: ${prompt}\n\n`);
              navigate("/workspace/scratchpad");
            }}
            style={pillBtn(t.success)}
          >
            Write Now
          </button>
        </div>
      </div>

      {/* Format Guide Card */}
      <div
        style={{
          background: `linear-gradient(135deg, ${t.accent}10, ${t.info}08)`,
          border: `1px solid ${t.accent}25`,
          borderRadius: "10px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ fontWeight: 700, color: t.accent, fontSize: "0.85rem", marginBottom: "0.5rem" }}>
          {formatInfo.icon} {formatInfo.label} Format Guide
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
            gap: "0.75rem",
            fontSize: "0.82rem",
            color: t.textMuted,
          }}
        >
          <div>
            <span style={{ color: t.textDim }}>Chapter Size:</span> {formatInfo.chapterWords}
          </div>
          <div>
            <span style={{ color: t.textDim }}>Volume:</span> {formatInfo.volumeChapters}
          </div>
          <div>
            <span style={{ color: t.textDim }}>POV:</span> {formatInfo.pov}
          </div>
          <div>
            <span style={{ color: t.textDim }}>Tense:</span> {formatInfo.tense}
          </div>
        </div>
        <div style={{ fontSize: "0.78rem", color: t.textDim, marginTop: "0.5rem", lineHeight: 1.5 }}>
          {formatInfo.notes}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ fontSize: "0.78rem", color: t.textDim, marginBottom: "0.5rem" }}>
        {totalEntries} total {totalEntries === 1 ? "entry" : "entries"} across all collections
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))",
          gap: "0.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {Object.entries(COLLECTION_DEFS).map(([key, cfg]) => {
          const count = (data[key] || []).length;
          return (
            <button
              key={key}
              onClick={() => navigate(`/${key}`)}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                padding: "0.75rem",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                color: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = cfg.color + "60")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = t.border)}
            >
              <div style={{ fontSize: "1.3rem", color: cfg.color, fontWeight: 700 }}>{count}</div>
              <div style={{ fontSize: "0.72rem", color: t.textDim }}>{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Outline Methods */}
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
          padding: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: t.textBright,
            fontSize: "0.95rem",
            marginBottom: "0.75rem",
            fontFamily: "'Playfair Display',serif",
          }}
        >
          Outline Method Reference
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {OUTLINE_METHODS.map((m) => (
            <details
              key={m.id}
              style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: "6px",
                padding: "0.6rem 0.75rem",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600, color: t.text, fontSize: "0.85rem" }}>
                {m.label}{" "}
                <span style={{ color: t.textDim, fontWeight: 400 }}>
                  {"\—"} {m.desc}
                </span>
              </summary>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                {m.beats.map((b, i) => (
                  <span
                    key={i}
                    style={{
                      background: t.accentDim,
                      border: `1px solid ${t.accent}20`,
                      color: t.accent,
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {i + 1}. {b}
                  </span>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentItems.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontWeight: 700,
              color: t.textBright,
              fontSize: "0.95rem",
              marginBottom: "0.75rem",
              fontFamily: "'Playfair Display',serif",
            }}
          >
            Recent Activity
          </div>
          <div style={{ display: "grid", gap: "0.4rem" }}>
            {recentItems.map((item) => {
              const cfg = COLLECTION_DEFS[item._collection as string];
              return cfg ? (
                <button
                  key={item.id}
                  onClick={() => navigate(`/${item._collection}/${item.id}`)}
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: "6px",
                    padding: "0.6rem 0.75rem",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    fontFamily: "inherit",
                    color: "inherit",
                  }}
                >
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                  <span style={{ fontWeight: 600, color: t.text, fontSize: "0.85rem", flex: 1 }}>
                    {(item.name as string) || (item.title as string) || "Untitled"}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: t.textDim }}>{cfg.label.replace(/s$/, "")}</span>
                </button>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Import / Export */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={doExportJSON} style={pillBtn(t.info)}>
          Export JSON
        </button>
        <button onClick={doExportZIP} style={pillBtn("#6366f1")}>
          Export ZIP
        </button>
        <button onClick={doImport} style={pillBtn(t.success)}>
          Import
        </button>
        <button onClick={doReset} style={pillBtn(t.danger)}>
          Reset All
        </button>
      </div>
    </div>
  );
}

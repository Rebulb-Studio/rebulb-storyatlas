import { useState } from "react";
import type { Theme } from "../types";
import { useProjectStore } from "../stores/useProjectStore";
import { useUIStore } from "../stores/useUIStore";
import { useProStore, PRO_FEATURES } from "../stores/useProStore";
import { FORMAT_PRESETS } from "../constants";
import { exportJSON, exportZIP, importFile, importJSON } from "../api";
import { useDataStore } from "../stores/useDataStore";

interface Props {
  theme: Theme;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const pillBtn = (color: string): React.CSSProperties => ({
  background: color + "18",
  border: `1px solid ${color}40`,
  color,
  padding: "0.35rem 0.9rem",
  borderRadius: "20px",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif",
});

const inputStyle = (t: Theme): React.CSSProperties => ({
  background: t.input,
  border: `1px solid ${t.inputBorder}`,
  color: t.text,
  borderRadius: "6px",
  padding: "0.5rem 0.75rem",
  fontSize: "0.85rem",
  fontFamily: "'DM Sans', sans-serif",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
});

const sectionCard = (t: Theme, delay: number): React.CSSProperties => ({
  background: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: "10px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  animationDelay: `${delay}ms`,
});

const sectionTitle = (t: Theme): React.CSSProperties => ({
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.15rem",
  fontWeight: 700,
  color: t.textBright,
  marginBottom: "1rem",
  marginTop: 0,
});

const labelStyle = (t: Theme): React.CSSProperties => ({
  display: "block",
  color: t.textMuted,
  fontSize: "0.75rem",
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  marginBottom: "0.3rem",
});

const fieldGroup: React.CSSProperties = {
  marginBottom: "0.85rem",
};

// ─── Component ────────────────────────────────────────────────────────

export default function SettingsPage({ theme: t }: Props) {
  const meta = useProjectStore((s) => s.meta);
  const updateMeta = useProjectStore((s) => s.updateMeta);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const toast = useUIStore((s) => s.toast);
  const isPro = useProStore((s) => s.isPro);
  const activateKey = useProStore((s) => s.activateKey);
  const deactivate = useProStore((s) => s.deactivate);
  const loadAll = useDataStore((s) => s.loadAll);

  const [proKeyInput, setProKeyInput] = useState("");
  const dailyWordGoal =
    ((meta as Record<string, unknown>).dailyWordGoal as number) || 500;

  return (
    <div style={{ padding: "1.5rem", maxWidth: "720px", margin: "0 auto" }}>
      {/* ─── Page Title ──────────────────────────────────────────────── */}
      <h1
        className="animate-slide-up"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          color: t.textBright,
          fontWeight: 700,
          marginBottom: "1.5rem",
          animationDelay: "0ms",
        }}
      >
        Settings
      </h1>

      {/* ─── 1. Profile & Project ────────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 60)}>
        <h2 style={sectionTitle(t)}>Profile &amp; Project</h2>

        <div style={fieldGroup}>
          <label style={labelStyle(t)}>Project Name</label>
          <input
            style={inputStyle(t)}
            value={meta.projectName}
            onChange={(e) => updateMeta({ projectName: e.target.value })}
            placeholder="My Novel"
          />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle(t)}>Author Name</label>
          <input
            style={inputStyle(t)}
            value={meta.author}
            onChange={(e) => updateMeta({ author: e.target.value })}
            placeholder="Your name"
          />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle(t)}>Genre</label>
          <input
            style={inputStyle(t)}
            value={meta.genre}
            onChange={(e) => updateMeta({ genre: e.target.value })}
            placeholder="Fantasy, Sci-Fi, etc."
          />
        </div>

        <div style={fieldGroup}>
          <label style={labelStyle(t)}>Format</label>
          <select
            style={{
              ...inputStyle(t),
              cursor: "pointer",
            }}
            value={meta.format}
            onChange={(e) => updateMeta({ format: e.target.value })}
          >
            {Object.entries(FORMAT_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.icon} {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...fieldGroup, marginBottom: 0 }}>
          <label style={labelStyle(t)}>Description</label>
          <textarea
            style={{
              ...inputStyle(t),
              minHeight: "80px",
              resize: "vertical",
            }}
            value={meta.description}
            onChange={(e) => updateMeta({ description: e.target.value })}
            placeholder="A brief description of your project..."
          />
        </div>
      </div>

      {/* ─── 2. Appearance ───────────────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 120)}>
        <h2 style={sectionTitle(t)}>Appearance</h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={toggleDarkMode}
            style={pillBtn(t.accent)}
          >
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.78rem",
              color: t.textMuted,
            }}
          >
            <span>Current theme:</span>
            <div
              style={{
                display: "flex",
                gap: "3px",
              }}
            >
              {[t.bg, t.surface, t.accent, t.text, t.border].map(
                (color, i) => (
                  <div
                    key={i}
                    title={color}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "4px",
                      background: color,
                      border: `1px solid ${t.border}`,
                    }}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Writing Preferences ──────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 180)}>
        <h2 style={sectionTitle(t)}>Writing Preferences</h2>

        <div style={fieldGroup}>
          <label style={labelStyle(t)}>Daily Word Goal</label>
          <input
            type="number"
            min={0}
            style={{ ...inputStyle(t), maxWidth: "180px" }}
            value={dailyWordGoal}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0) {
                updateMeta({ dailyWordGoal: val } as Record<string, unknown>);
              }
            }}
          />
          <span
            style={{
              color: t.textDim,
              fontSize: "0.72rem",
              fontFamily: "'DM Sans', sans-serif",
              marginTop: "0.3rem",
              display: "block",
            }}
          >
            Track your daily progress on the Home page.
          </span>
        </div>
      </div>

      {/* ─── 4. Data Management ──────────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 240)}>
        <h2 style={sectionTitle(t)}>Data Management</h2>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <button
            style={pillBtn(t.accent)}
            onClick={() => {
              exportJSON().then(() => toast("JSON exported", "success")).catch(() => toast("Export failed", "error"));
            }}
          >
            Export JSON
          </button>
          <button
            style={pillBtn(t.accent)}
            onClick={() => {
              exportZIP().then(() => toast("ZIP exported", "success")).catch(() => toast("Export failed", "error"));
            }}
          >
            Export ZIP
          </button>
          <button
            style={pillBtn(t.info)}
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = ".json,.zip";
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  await importFile(file);
                  await loadAll();
                  toast("File imported successfully", "success");
                } catch {
                  toast("Import failed", "error");
                }
              };
              input.click();
            }}
          >
            Import
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button
            style={pillBtn(t.danger)}
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to reset ALL data? This cannot be undone.",
                )
              ) {
                importJSON({})
                  .then(() => loadAll())
                  .then(() => toast("All data has been reset", "success"))
                  .catch(() => toast("Reset failed", "error"));
              }
            }}
          >
            Reset All
          </button>
          <button
            style={pillBtn(t.textMuted)}
            onClick={() => {
              localStorage.removeItem("sa_data_cache");
              localStorage.removeItem("sa_meta_cache");
              toast("Local cache cleared", "success");
            }}
          >
            Clear Local Cache
          </button>
        </div>
      </div>

      {/* ─── 5. Pro License ──────────────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 300)}>
        <h2 style={sectionTitle(t)}>Pro License</h2>

        {isPro ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.92rem",
                fontWeight: 700,
                color: t.success,
              }}
            >
              Pro Active &#x2705;
            </span>
            <button
              style={pillBtn(t.danger)}
              onClick={() => {
                deactivate();
                toast("Pro license deactivated", "info");
              }}
            >
              Deactivate
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <input
              style={{ ...inputStyle(t), maxWidth: "260px" }}
              value={proKeyInput}
              onChange={(e) => setProKeyInput(e.target.value)}
              placeholder="Enter your Pro key"
            />
            <button
              style={pillBtn(t.accent)}
              onClick={() => {
                const ok = activateKey(proKeyInput);
                if (ok) {
                  toast("Pro activated!", "success");
                  setProKeyInput("");
                } else {
                  toast("Invalid key (must be 8+ chars)", "error");
                }
              }}
            >
              Activate
            </button>
          </div>
        )}

        {/* Feature list */}
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "0.3rem",
          }}
        >
          {Object.values(PRO_FEATURES).map((feat) => (
            <span
              key={feat.label}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                color: feat.free ? t.textMuted : t.accent,
              }}
            >
              {feat.free ? "Free" : "Pro"} &mdash; {feat.label}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 6. About ────────────────────────────────────────────────── */}
      <div className="animate-slide-up" style={sectionCard(t, 360)}>
        <h2 style={sectionTitle(t)}>About</h2>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.92rem",
            color: t.textBright,
            fontWeight: 700,
            margin: "0 0 0.3rem 0",
          }}
        >
          StoryAtlas v2.0
        </p>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            color: t.textMuted,
            margin: "0 0 0.75rem 0",
          }}
        >
          Built for indie authors who dream big.
        </p>
        <a
          href="https://github.com/jdrines/rebulb-storyatlas"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...pillBtn(t.accent),
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          GitHub Repository
        </a>
      </div>
    </div>
  );
}

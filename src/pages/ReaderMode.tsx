import { useState } from "react";
import { READER_THEMES, READER_FONTS } from "../constants";
import type { CollectionData, Entry, Theme } from "../types";

interface Props {
  data: CollectionData;
  theme: Theme;
}

type ReaderThemeKey = keyof typeof READER_THEMES;
type ReaderFontKey = keyof typeof READER_FONTS;

export default function ReaderMode({ data, theme: t }: Props) {
  const manuscripts: Entry[] = data.manuscripts || [];

  const [selectedId, setSelectedId] = useState<string>("");
  const [readerTheme, setReaderTheme] = useState<ReaderThemeKey>("dark");
  const [readerFont, setReaderFont] = useState<ReaderFontKey>("serif");
  const [fontSize, setFontSize] = useState<number>(18);

  const selected = manuscripts.find((m) => m.id === selectedId);
  const content = (selected?.content as string) || "";
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 250));

  const rTheme = READER_THEMES[readerTheme];
  const rFont = READER_FONTS[readerFont];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
    transition: "border-color 0.15s",
  };

  const pillBtn = (color: string, active?: boolean): React.CSSProperties => ({
    background: active ? color + "30" : color + "18",
    border: `1px solid ${active ? color : color + "40"}`,
    color,
    padding: "0.35rem 0.9rem",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.78rem",
    fontWeight: 600,
    fontFamily: "'DM Sans',sans-serif",
  });

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, marginBottom: "0.5rem" }}>
        Reader Mode
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Preview your manuscripts in a distraction-free reading experience.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        {/* Manuscript selector */}
        <div style={{ flex: "1 1 220px", minWidth: "200px" }}>
          <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Manuscript</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={inputStyle}
          >
            <option value="">-- Select a manuscript --</option>
            {manuscripts.map((m) => (
              <option key={m.id} value={m.id}>{(m.title as string) || (m.name as string) || m.id}</option>
            ))}
          </select>
        </div>

        {/* Theme selector */}
        <div>
          <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Theme</label>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(Object.keys(READER_THEMES) as ReaderThemeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setReaderTheme(key)}
                style={pillBtn(t.accent, readerTheme === key)}
              >
                {READER_THEMES[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Font selector */}
        <div>
          <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Font</label>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {(Object.keys(READER_FONTS) as ReaderFontKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setReaderFont(key)}
                style={pillBtn(t.accent, readerFont === key)}
              >
                {READER_FONTS[key].label}
              </button>
            ))}
          </div>
        </div>

        {/* Font size slider */}
        <div style={{ minWidth: "140px" }}>
          <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>
            Size: {fontSize}px
          </label>
          <input
            type="range"
            min={14}
            max={24}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={{ width: "100%", accentColor: t.accent }}
          />
        </div>
      </div>

      {/* Reading Panel */}
      {selected ? (
        <div style={{
          background: rTheme.bg,
          color: rTheme.text,
          borderRadius: "10px",
          border: `1px solid ${t.border}`,
          padding: "2.5rem 2rem",
          maxWidth: "720px",
          margin: "0 auto",
          minHeight: "400px",
        }}>
          {/* Title */}
          <h3 style={{
            fontFamily: rFont.family,
            fontSize: `${fontSize + 4}px`,
            fontWeight: 700,
            marginBottom: "0.5rem",
            textAlign: "center",
          }}>
            {(selected.title as string) || (selected.name as string) || "Untitled"}
          </h3>

          {/* Stats */}
          <div style={{
            textAlign: "center",
            fontSize: "0.78rem",
            opacity: 0.6,
            marginBottom: "2rem",
            borderBottom: `1px solid ${rTheme.text}20`,
            paddingBottom: "1rem",
          }}>
            {wordCount.toLocaleString()} words &middot; ~{readTime} min read
          </div>

          {/* Content */}
          <div style={{
            fontFamily: rFont.family,
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {content || "No content yet."}
          </div>
        </div>
      ) : (
        <div style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "10px",
          padding: "3rem",
          textAlign: "center",
          color: t.textDim,
        }}>
          {manuscripts.length === 0
            ? "No manuscripts found. Create a manuscript in the Writing section first."
            : "Select a manuscript above to begin reading."
          }
        </div>
      )}
    </div>
  );
}

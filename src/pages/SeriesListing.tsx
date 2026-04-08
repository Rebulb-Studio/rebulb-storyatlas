import { useState } from "react";
import { SERIES_FORMATS, SERIES_STATUSES } from "../constants";
import type { ProjectMeta, SeriesEntry, Theme } from "../types";

interface Props {
  meta: ProjectMeta;
  updateMeta: (updates: Partial<ProjectMeta>) => Promise<void>;
  toast: (msg: string, type?: "info" | "success" | "error") => void;
  theme: Theme;
}

interface SeriesForm {
  title: string;
  genre: string;
  format: string;
  status: string;
  targetAudience: string;
  chapterCount: number | string;
  synopsis: string;
  tags: string;
  coverConcept: string;
}

const emptyForm: SeriesForm = {
  title: "",
  genre: "",
  format: SERIES_FORMATS[0],
  status: SERIES_STATUSES[0],
  targetAudience: "",
  chapterCount: 0,
  synopsis: "",
  tags: "",
  coverConcept: "",
};

export default function SeriesListing({ meta, updateMeta, toast, theme: t }: Props) {
  const [editingSeries, setEditingSeries] = useState<number | null>(null);
  const [seriesForm, setSeriesForm] = useState<SeriesForm>(emptyForm);

  const series: SeriesEntry[] = meta.series || [];

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

  const openCreate = () => {
    setSeriesForm(emptyForm);
    setEditingSeries(-1);
  };

  const openEdit = (idx: number) => {
    const s = series[idx];
    setSeriesForm({
      title: s.title || "",
      genre: s.genre || "",
      format: s.format || SERIES_FORMATS[0],
      status: s.status || SERIES_STATUSES[0],
      targetAudience: s.targetAudience || "",
      chapterCount: s.chapterCount ?? 0,
      synopsis: s.synopsis || "",
      tags: s.tags || "",
      coverConcept: s.coverConcept || "",
    });
    setEditingSeries(idx);
  };

  const saveSeries = async () => {
    if (!seriesForm.title.trim()) {
      toast("Series title is required", "error");
      return;
    }
    const updated = [...series];
    const entry: SeriesEntry = {
      id: editingSeries !== null && editingSeries >= 0 ? series[editingSeries].id : crypto.randomUUID(),
      title: seriesForm.title.trim(),
      genre: seriesForm.genre.trim(),
      format: seriesForm.format,
      status: seriesForm.status,
      targetAudience: seriesForm.targetAudience.trim(),
      chapterCount: seriesForm.chapterCount,
      synopsis: seriesForm.synopsis.trim(),
      tags: seriesForm.tags.trim(),
      coverConcept: seriesForm.coverConcept.trim(),
      createdAt: editingSeries !== null && editingSeries >= 0 ? series[editingSeries].createdAt : new Date().toISOString(),
    };
    if (editingSeries !== null && editingSeries >= 0) {
      updated[editingSeries] = entry;
    } else {
      updated.push(entry);
    }
    await updateMeta({ series: updated });
    toast(editingSeries !== null && editingSeries >= 0 ? "Series updated" : "Series created", "success");
    setEditingSeries(null);
  };

  const deleteSeries = async (idx: number) => {
    if (!confirm(`Delete "${series[idx].title}"?`)) return;
    const updated = series.filter((_, i) => i !== idx);
    await updateMeta({ series: updated });
    toast("Series deleted", "info");
  };

  const statusColor = (status: string): string => {
    switch (status) {
      case "Ongoing": return t.success;
      case "Complete": return t.info;
      case "Hiatus": return t.danger;
      default: return t.textMuted;
    }
  };

  // ─── Edit / Create Form ──────────────────────────────────────────────
  if (editingSeries !== null) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, margin: 0 }}>
            {editingSeries >= 0 ? "Edit Series" : "New Series"}
          </h2>
          <button onClick={() => setEditingSeries(null)} style={pillBtn("#475569")}>{"\u2190"} Back</button>
        </div>

        <div style={{ display: "grid", gap: "1rem", maxWidth: "600px" }}>
          {/* Title */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Title</label>
            <input
              value={seriesForm.title}
              onChange={(e) => setSeriesForm((f) => ({ ...f, title: e.target.value }))}
              style={inputStyle}
              placeholder="Series title"
            />
          </div>

          {/* Genre */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Genre</label>
            <input
              value={seriesForm.genre}
              onChange={(e) => setSeriesForm((f) => ({ ...f, genre: e.target.value }))}
              style={inputStyle}
              placeholder="e.g. Fantasy, Sci-Fi, Drama"
            />
          </div>

          {/* Format */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Format</label>
            <select
              value={seriesForm.format}
              onChange={(e) => setSeriesForm((f) => ({ ...f, format: e.target.value }))}
              style={inputStyle}
            >
              {SERIES_FORMATS.map((fmt) => (
                <option key={fmt} value={fmt}>{fmt}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Status</label>
            <select
              value={seriesForm.status}
              onChange={(e) => setSeriesForm((f) => ({ ...f, status: e.target.value }))}
              style={inputStyle}
            >
              {SERIES_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Target Audience */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Target Audience</label>
            <input
              value={seriesForm.targetAudience}
              onChange={(e) => setSeriesForm((f) => ({ ...f, targetAudience: e.target.value }))}
              style={inputStyle}
              placeholder="e.g. Young Adult, Seinen"
            />
          </div>

          {/* Chapter Count */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Chapter Count</label>
            <input
              type="number"
              value={seriesForm.chapterCount}
              onChange={(e) => setSeriesForm((f) => ({ ...f, chapterCount: parseInt(e.target.value) || 0 }))}
              style={inputStyle}
              min={0}
            />
          </div>

          {/* Synopsis */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Synopsis</label>
            <textarea
              value={seriesForm.synopsis}
              onChange={(e) => setSeriesForm((f) => ({ ...f, synopsis: e.target.value }))}
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              placeholder="Brief synopsis of the series..."
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem", display: "block" }}>Tags</label>
            <input
              value={seriesForm.tags}
              onChange={(e) => setSeriesForm((f) => ({ ...f, tags: e.target.value }))}
              style={inputStyle}
              placeholder="Comma-separated tags"
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button onClick={saveSeries} style={pillBtn(t.accent)}>
              {editingSeries >= 0 ? "Save Changes" : "Create Series"}
            </button>
            <button onClick={() => setEditingSeries(null)} style={pillBtn("#475569")}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Series Cards ────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, marginBottom: "0.5rem" }}>
        Series Listing
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        {series.length} series {series.length === 1 ? "entry" : "entries"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
        {series.map((s, idx) => (
          <div
            key={s.id}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: "10px",
              padding: "1.2rem",
              transition: "border-color 0.15s",
            }}
          >
            {/* Header: Title + Status Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: t.textBright, margin: 0 }}>
                {s.title}
              </h3>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                padding: "0.2rem 0.55rem",
                borderRadius: "12px",
                background: statusColor(s.status) + "18",
                color: statusColor(s.status),
                border: `1px solid ${statusColor(s.status)}40`,
                whiteSpace: "nowrap",
              }}>
                {s.status}
              </span>
            </div>

            {/* Format / Genre tags */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              {s.format && (
                <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: t.accentDim, color: t.accent, fontWeight: 500 }}>
                  {s.format}
                </span>
              )}
              {s.genre && (
                <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: "10px", background: t.accentDim, color: t.accent, fontWeight: 500 }}>
                  {s.genre}
                </span>
              )}
            </div>

            {/* Synopsis preview */}
            {s.synopsis && (
              <p style={{ fontSize: "0.82rem", color: t.textMuted, lineHeight: 1.5, marginBottom: "0.6rem", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                {s.synopsis}
              </p>
            )}

            {/* Chapter count */}
            <div style={{ fontSize: "0.75rem", color: t.textDim, marginBottom: "0.8rem" }}>
              {s.chapterCount ? `${s.chapterCount} chapter${Number(s.chapterCount) === 1 ? "" : "s"}` : "No chapters yet"}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button onClick={() => openEdit(idx)} style={pillBtn(t.accent)}>Edit</button>
              <button onClick={() => deleteSeries(idx)} style={pillBtn(t.danger)}>Delete</button>
            </div>
          </div>
        ))}

        {/* Create New Series button */}
        <button
          onClick={openCreate}
          style={{
            background: "transparent",
            border: `2px dashed ${t.border}`,
            borderRadius: "10px",
            padding: "2rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            color: t.textDim,
            fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.9rem",
            minHeight: "180px",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>+</span>
          Create New Series
        </button>
      </div>
    </div>
  );
}

import type { CollectionData, ProjectMeta, Entry, Theme } from "../types";
import { estimateTotalWords } from "../workspace/WorkspaceViews";

interface Props {
  data: CollectionData;
  meta: ProjectMeta;
  scratchpadText: string;
  theme: Theme;
}

export default function SeriesDashboard({ data, meta, scratchpadText, theme: t }: Props) {
  const series = meta.series || [];
  const chapters: Entry[] = data.chapters || [];
  const manuscripts: Entry[] = data.manuscripts || [];
  const totalWords = estimateTotalWords(data, scratchpadText);

  // Chapter status breakdown
  const chapterStatuses: Record<string, number> = {};
  chapters.forEach((ch) => {
    const status = (ch.status as string) || "Unknown";
    chapterStatuses[status] = (chapterStatuses[status] || 0) + 1;
  });

  // Word count per chapter (up to 30)
  const chapterWordData = chapters.slice(0, 30).map((ch) => {
    const wc = parseInt(String(ch.wordCount ?? 0), 10) || 0;
    return { name: (ch.name as string) || (ch.number as string) || ch.id, words: wc };
  });
  const maxWords = Math.max(...chapterWordData.map((c) => c.words), 1);

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

  const statCard = (label: string, value: string | number, color: string) => (
    <div style={{
      background: t.surface,
      border: `1px solid ${t.border}`,
      borderRadius: "10px",
      padding: "1.2rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, color, marginBottom: "0.3rem" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <div style={{ fontSize: "0.75rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );

  const statusColor = (status: string): string => {
    switch (status) {
      case "Final":
      case "Polished": return t.success;
      case "Revised": return t.info;
      case "First Draft": return t.accent;
      case "Outline": return t.textMuted;
      case "Cut": return t.danger;
      default: return t.textDim;
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, marginBottom: "0.5rem" }}>
        Series Dashboard
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Production overview for {meta.projectName || "your project"}.
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
        {statCard("Series", series.length, t.accent)}
        {statCard("Chapters", chapters.length, t.info)}
        {statCard("Manuscripts", manuscripts.length, t.success)}
        {statCard("Total Words", totalWords, "#f59e0b")}
      </div>

      {/* Chapter Status Breakdown */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: t.textBright, marginBottom: "0.8rem" }}>
          Chapter Status Breakdown
        </h3>
        {Object.keys(chapterStatuses).length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {Object.entries(chapterStatuses).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} style={{
                ...pillBtn(statusColor(status)),
                cursor: "default",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}>
                <span style={{ fontWeight: 700 }}>{count}</span>
                <span>{status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: t.textDim, fontSize: "0.85rem" }}>No chapters created yet.</p>
        )}
      </div>

      {/* Word Count per Chapter Bar Chart */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: t.textBright, marginBottom: "0.8rem" }}>
          Word Count per Chapter
        </h3>
        {chapterWordData.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {chapterWordData.map((ch, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "120px",
                  fontSize: "0.75rem",
                  color: t.textMuted,
                  textAlign: "right",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {ch.name}
                </div>
                <div style={{
                  flex: 1,
                  height: "18px",
                  background: t.surface,
                  borderRadius: "4px",
                  overflow: "hidden",
                  border: `1px solid ${t.border}`,
                }}>
                  <div style={{
                    height: "100%",
                    width: `${(ch.words / maxWords) * 100}%`,
                    background: t.accent,
                    borderRadius: "4px",
                    transition: "width 0.3s",
                    minWidth: ch.words > 0 ? "2px" : "0",
                  }} />
                </div>
                <div style={{
                  width: "60px",
                  fontSize: "0.72rem",
                  color: t.textDim,
                  textAlign: "right",
                  flexShrink: 0,
                }}>
                  {ch.words.toLocaleString()}
                </div>
              </div>
            ))}
            {chapters.length > 30 && (
              <p style={{ fontSize: "0.72rem", color: t.textDim, marginTop: "0.3rem" }}>
                Showing first 30 of {chapters.length} chapters.
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: t.textDim, fontSize: "0.85rem" }}>No chapter word counts recorded yet.</p>
        )}
      </div>

      {/* Audience Analytics Placeholder */}
      <div style={{
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: "10px",
        padding: "2rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{"\uD83D\uDCCA"}</div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", color: t.textBright, marginBottom: "0.4rem" }}>
          Audience Analytics
        </h3>
        <p style={{ color: t.textDim, fontSize: "0.85rem" }}>
          Audience tracking will be available here once your series is published.
        </p>
      </div>
    </div>
  );
}

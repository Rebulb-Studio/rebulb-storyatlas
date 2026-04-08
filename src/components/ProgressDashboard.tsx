import { useState, useMemo } from "react";
import type { Theme, Entry, CollectionData } from "../types";
import { COLLECTION_DEFS } from "../constants";
import { useDataStore } from "../stores/useDataStore";
import { useProjectStore } from "../stores/useProjectStore";
import { getCompleteness, estimateTotalWords } from "../workspace/WorkspaceViews";

interface Props {
  navigate: (path: string) => void;
  theme: Theme;
}

interface Milestone {
  id: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  completed: boolean;
}

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

export default function ProgressDashboard({ navigate, theme: t }: Props) {
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);

  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const milestones: Milestone[] = useMemo(
    () => (Array.isArray((meta as Record<string, unknown>).milestones) ? (meta as Record<string, unknown>).milestones as Milestone[] : []),
    [meta],
  );

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

  // ─── Computed Stats ──────────────────────────────────────────────────
  const totalEntries = useMemo(
    () => Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0),
    [data],
  );

  const totalWords = useMemo(
    () => estimateTotalWords(data, scratchpadText || ""),
    [data, scratchpadText],
  );

  const allEntriesWithCollection = useMemo(
    () =>
      Object.entries(data).flatMap(([col, items]) =>
        (Array.isArray(items) ? items : []).map((item) => ({ entry: item, collection: col })),
      ),
    [data],
  );

  const avgCompleteness = useMemo(() => {
    if (allEntriesWithCollection.length === 0) return 0;
    const sum = allEntriesWithCollection.reduce(
      (acc, { entry, collection }) => acc + getCompleteness(collection, entry),
      0,
    );
    return Math.round(sum / allEntriesWithCollection.length);
  }, [allEntriesWithCollection]);

  const activeCollections = useMemo(
    () =>
      Object.entries(data).filter(
        ([, items]) => Array.isArray(items) && items.length > 0,
      ).length,
    [data],
  );

  // ─── Collection Progress ─────────────────────────────────────────────
  const collectionRows = useMemo(
    () =>
      Object.entries(COLLECTION_DEFS)
        .map(([key, cfg]) => {
          const items = data[key] || [];
          if (!Array.isArray(items) || items.length === 0) return null;
          const avgComp = Math.round(
            items.reduce((s, it) => s + getCompleteness(key, it), 0) / items.length,
          );
          return { key, cfg, count: items.length, avgComp };
        })
        .filter(Boolean) as { key: string; cfg: (typeof COLLECTION_DEFS)[string]; count: number; avgComp: number }[],
    [data],
  );

  // ─── Weakest Entries ─────────────────────────────────────────────────
  const weakestEntries = useMemo(
    () =>
      [...allEntriesWithCollection]
        .map(({ entry, collection }) => ({
          entry,
          collection,
          completeness: getCompleteness(collection, entry),
        }))
        .sort((a, b) => a.completeness - b.completeness)
        .slice(0, 5),
    [allEntriesWithCollection],
  );

  // ─── Daily Word Goal ─────────────────────────────────────────────────
  const dailyWordGoal = ((meta as Record<string, unknown>).dailyWordGoal as number) || 0;

  // ─── Milestone Handlers ──────────────────────────────────────────────
  const saveMilestones = (updated: Milestone[]) => {
    useProjectStore.getState().updateMeta({ milestones: updated } as Record<string, unknown>);
  };

  const addMilestone = () => {
    const title = newTitle.trim();
    const target = parseInt(newTarget, 10);
    if (!title || isNaN(target) || target <= 0) return;
    const ms: Milestone = {
      id: Date.now().toString(36),
      title,
      target,
      current: 0,
      deadline: newDeadline,
      completed: false,
    };
    saveMilestones([...milestones, ms]);
    setNewTitle("");
    setNewTarget("");
    setNewDeadline("");
  };

  const toggleComplete = (id: string) => {
    saveMilestones(
      milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m)),
    );
  };

  const incrementMilestone = (id: string) => {
    saveMilestones(
      milestones.map((m) =>
        m.id === id ? { ...m, current: Math.min(m.current + 1, m.target) } : m,
      ),
    );
  };

  const removeMilestone = (id: string) => {
    saveMilestones(milestones.filter((m) => m.id !== id));
  };

  // ─── Helpers ─────────────────────────────────────────────────────────
  const compColor = (pct: number): string => {
    if (pct >= 75) return t.success;
    if (pct >= 40) return t.info;
    return t.danger;
  };

  const cardStyle: React.CSSProperties = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: "10px",
    padding: "1.2rem",
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Title */}
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.6rem",
          color: t.textBright,
          marginBottom: "0.3rem",
          marginTop: 0,
        }}
      >
        Progress Dashboard
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.82rem", marginBottom: "1.5rem", marginTop: 0 }}>
        Track your creative progress across all collections.
      </p>

      {/* ── Overview Cards ─────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        {/* Total Entries */}
        <div style={cardStyle}>
          <div style={{ fontSize: "0.68rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Total Entries
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.accent }}>{totalEntries}</div>
        </div>

        {/* Total Words */}
        <div style={cardStyle}>
          <div style={{ fontSize: "0.68rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Total Words
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.info }}>{totalWords.toLocaleString()}</div>
        </div>

        {/* Avg Completeness */}
        <div style={cardStyle}>
          <div style={{ fontSize: "0.68rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Avg Completeness
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: compColor(avgCompleteness) }}>{avgCompleteness}%</div>
        </div>

        {/* Active Collections */}
        <div style={cardStyle}>
          <div style={{ fontSize: "0.68rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
            Active Collections
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.success }}>{activeCollections}</div>
        </div>
      </div>

      {/* ── Milestones ─────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: "2rem" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.15rem",
            color: t.textBright,
            marginTop: 0,
            marginBottom: "1rem",
          }}
        >
          Milestones
        </h3>

        {/* Add Milestone Form */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 140px" }}>
            <label style={{ fontSize: "0.7rem", color: t.textDim, display: "block", marginBottom: "0.2rem" }}>Title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Milestone title"
              style={{ ...inputStyle }}
            />
          </div>
          <div style={{ flex: "1 1 80px" }}>
            <label style={{ fontSize: "0.7rem", color: t.textDim, display: "block", marginBottom: "0.2rem" }}>Target</label>
            <input
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="e.g. 10"
              style={{ ...inputStyle }}
            />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <label style={{ fontSize: "0.7rem", color: t.textDim, display: "block", marginBottom: "0.2rem" }}>Deadline</label>
            <input
              type="date"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              style={{ ...inputStyle }}
            />
          </div>
          <button onClick={addMilestone} style={pillBtn(t.accent)}>
            + Add
          </button>
        </div>

        {/* Milestone List */}
        {milestones.length === 0 && (
          <p style={{ color: t.textDim, fontSize: "0.82rem", fontStyle: "italic" }}>
            No milestones yet. Add one above to track your goals.
          </p>
        )}
        {milestones.map((ms) => {
          const pct = ms.target > 0 ? Math.round((ms.current / ms.target) * 100) : 0;
          return (
            <div
              key={ms.id}
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                background: ms.completed ? t.success + "10" : t.bg,
                border: `1px solid ${ms.completed ? t.success + "40" : t.border}`,
                marginBottom: "0.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <span
                  style={{
                    fontWeight: 600,
                    color: ms.completed ? t.success : t.textBright,
                    fontSize: "0.9rem",
                    textDecoration: ms.completed ? "line-through" : undefined,
                  }}
                >
                  {ms.title}
                </span>
                <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                  {ms.deadline && (
                    <span style={{ fontSize: "0.7rem", color: t.textDim }}>
                      Due: {ms.deadline}
                    </span>
                  )}
                  <button
                    onClick={() => incrementMilestone(ms.id)}
                    style={pillBtn(t.info)}
                    title="Increment progress"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => toggleComplete(ms.id)}
                    style={pillBtn(ms.completed ? t.textMuted : t.success)}
                  >
                    {ms.completed ? "Undo" : "Complete"}
                  </button>
                  <button
                    onClick={() => removeMilestone(ms.id)}
                    style={pillBtn(t.danger)}
                    title="Remove milestone"
                  >
                    x
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    background: t.inputBorder,
                    borderRadius: "3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(pct, 100)}%`,
                      background: ms.completed ? t.success : t.accent,
                      borderRadius: "3px",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <span style={{ fontSize: "0.72rem", color: t.textMuted, minWidth: "60px", textAlign: "right" }}>
                  {ms.current} / {ms.target}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Collection Progress ────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: "2rem" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.15rem",
            color: t.textBright,
            marginTop: 0,
            marginBottom: "1rem",
          }}
        >
          Collection Progress
        </h3>
        {collectionRows.length === 0 && (
          <p style={{ color: t.textDim, fontSize: "0.82rem", fontStyle: "italic" }}>
            No entries yet. Start adding content to see progress.
          </p>
        )}
        {collectionRows.map((row) => (
          <div
            key={row.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.6rem",
              cursor: "pointer",
            }}
            onClick={() => navigate(`/${row.key}`)}
          >
            <span
              style={{
                minWidth: "120px",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: row.cfg.color,
              }}
            >
              {row.cfg.icon} {row.cfg.label}
            </span>
            <div
              style={{
                flex: 1,
                height: "8px",
                background: t.inputBorder,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${row.avgComp}%`,
                  background: compColor(row.avgComp),
                  borderRadius: "4px",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <span style={{ fontSize: "0.72rem", color: t.textMuted, minWidth: "80px", textAlign: "right" }}>
              {row.avgComp}% ({row.count})
            </span>
          </div>
        ))}
      </div>

      {/* ── Bottom Row: Weakest Areas + Word Count ─────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {/* Weakest Areas */}
        <div style={cardStyle}>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.15rem",
              color: t.textBright,
              marginTop: 0,
              marginBottom: "1rem",
            }}
          >
            Weakest Areas
          </h3>
          {weakestEntries.length === 0 && (
            <p style={{ color: t.textDim, fontSize: "0.82rem", fontStyle: "italic" }}>
              No entries to evaluate.
            </p>
          )}
          {weakestEntries.map(({ entry, collection, completeness }) => {
            const cfg = COLLECTION_DEFS[collection];
            return (
              <div
                key={entry.id}
                onClick={() => navigate(`/${collection}/${entry.id}`)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0.6rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginBottom: "0.3rem",
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                }}
              >
                <div>
                  <span style={{ color: cfg?.color || t.textMuted, fontSize: "0.72rem", marginRight: "0.4rem" }}>
                    {cfg?.icon}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: t.text }}>
                    {(entry.name as string) || (entry.title as string) || entry.id}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: compColor(completeness),
                  }}
                >
                  {completeness}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Word Count Goal */}
        <div style={cardStyle}>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.15rem",
              color: t.textBright,
              marginTop: 0,
              marginBottom: "1rem",
            }}
          >
            Word Count
          </h3>
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2.4rem", fontWeight: 700, color: t.accent }}>
              {totalWords.toLocaleString()}
            </div>
            <div style={{ fontSize: "0.78rem", color: t.textDim, marginTop: "0.3rem" }}>
              total words written
            </div>
          </div>
          {dailyWordGoal > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: t.textMuted,
                  marginBottom: "0.3rem",
                }}
              >
                <span>Daily Goal</span>
                <span>{dailyWordGoal.toLocaleString()} words</span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: t.inputBorder,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, Math.round((totalWords / dailyWordGoal) * 100))}%`,
                    background: totalWords >= dailyWordGoal ? t.success : t.accent,
                    borderRadius: "4px",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
          )}
          {dailyWordGoal === 0 && (
            <p style={{ color: t.textDim, fontSize: "0.78rem", fontStyle: "italic", textAlign: "center" }}>
              Set a dailyWordGoal in project meta to track daily progress.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

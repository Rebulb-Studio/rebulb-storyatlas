import { useMemo } from "react";
import { useDataStore } from "../stores/useDataStore";
import { useProjectStore } from "../stores/useProjectStore";
import { COLLECTION_DEFS, FORMAT_PRESETS, WRITING_PROMPTS } from "../constants";
import { estimateTotalWords } from "../workspace/WorkspaceViews";
import type { Theme } from "../types";

interface Props {
  navigate: (path: string) => void;
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "";
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

interface DailyWords {
  [date: string]: number;
}

function getDailyWords(): DailyWords {
  try {
    const raw = localStorage.getItem("sa_daily_words");
    if (!raw) return {};
    return JSON.parse(raw) as DailyWords;
  } catch {
    return {};
  }
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeStreak(dailyWords: DailyWords): number {
  let streak = 0;
  const today = new Date();
  // Start from today, walk backwards
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    if ((dailyWords[key] || 0) > 0) {
      streak++;
    } else {
      // Allow today to be 0 (day not over yet) - check if streak started yesterday
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

function getLast7Days(dailyWords: DailyWords): { date: string; words: number }[] {
  const result: { date: string; words: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = formatDate(d);
    result.push({
      date: key,
      words: dailyWords[key] || 0,
    });
  }
  return result;
}

// ─── Quick Action Card Data ───────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    icon: "\uD83D\uDCDD",
    title: "Start Writing",
    desc: "Open your scratchpad and start putting words down.",
    path: "/workspace/scratchpad",
    color: "#a855f7",
  },
  {
    icon: "\uD83D\uDCD6",
    title: "World Bible",
    desc: "Review and build out your world's lore and canon.",
    path: "/workspace/worldBible",
    color: "#3b82f6",
  },
  {
    icon: "\uD83D\uDCCB",
    title: "Story Canvas",
    desc: "Organize your plot with sticky notes and cards.",
    path: "/workspace/storyCanvas",
    color: "#22c55e",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────

export default function HomePage({ navigate, theme: t }: Props) {
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);
  const promptIndex = useProjectStore((s) => s.promptIndex);

  const totalEntries = useMemo(
    () => Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0),
    [data],
  );

  const totalWords = useMemo(
    () => estimateTotalWords(data, scratchpadText || ""),
    [data, scratchpadText],
  );

  const activeCollections = useMemo(
    () => Object.entries(COLLECTION_DEFS).filter(([key]) => {
      const items = data[key];
      return Array.isArray(items) && items.length > 0;
    }).length,
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

  const collectionCounts = useMemo(
    () =>
      Object.entries(COLLECTION_DEFS)
        .map(([key, def]) => ({
          key,
          def,
          count: Array.isArray(data[key]) ? data[key].length : 0,
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count),
    [data],
  );

  const formatInfo = FORMAT_PRESETS[meta.format] || FORMAT_PRESETS.novel;
  const prompt = WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length];

  // Writing streak data
  const dailyWords = getDailyWords();
  const todayKey = formatDate(new Date());
  const todayWords = dailyWords[todayKey] || 0;
  const streak = computeStreak(dailyWords);
  const last7 = getLast7Days(dailyWords);
  const maxWords7 = Math.max(...last7.map((d) => d.words), 1);
  const dailyGoal = ((meta as Record<string, unknown>).dailyWordGoal as number) || 500;
  const goalProgress = Math.min(100, Math.round((todayWords / dailyGoal) * 100));

  // Section card style
  const sectionCard = (delay: number): React.CSSProperties => ({
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    padding: "1.5rem",
    animationDelay: `${delay}ms`,
  });

  return (
    <div style={{ padding: "1.5rem", maxWidth: "960px", margin: "0 auto" }}>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <div
        className="animate-slide-up"
        style={{
          ...sectionCard(0),
          textAlign: "center",
          marginBottom: "1.5rem",
          padding: "2rem 1.5rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.4rem",
            color: t.textBright,
            marginBottom: "0.5rem",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {meta.projectName || "Welcome to StoryAtlas"}
        </h1>
        {!meta.projectName && (
          <p style={{ color: t.textMuted, fontSize: "0.92rem", marginBottom: "1rem", fontFamily: "'DM Sans', sans-serif" }}>
            Your creative universe, organized and alive.
          </p>
        )}
        {meta.genre && (
          <span style={pillBtn(t.accent)}>
            {formatInfo.icon} {meta.genre}
          </span>
        )}
        <p
          style={{
            color: t.textDim,
            fontSize: "0.82rem",
            marginTop: "0.75rem",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {totalEntries.toLocaleString()} entries &middot; {totalWords.toLocaleString()} words &middot; {activeCollections} collections active
        </p>
      </div>

      {/* ─── Quick Actions ────────────────────────────────────────────── */}
      <div
        className="animate-slide-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
          animationDelay: "60ms",
        }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.path}
            className="hover-lift"
            onClick={() => navigate(action.path)}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: "12px",
              padding: "1.25rem",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              color: "inherit",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = action.color; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = t.border; }}
          >
            <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{action.icon}</div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: t.textBright,
                marginBottom: "0.3rem",
              }}
            >
              {action.title}
            </div>
            <div style={{ color: t.textMuted, fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>
              {action.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ─── Writing Streak Widget ─────────────────────────────────────── */}
      <div
        className="animate-slide-up"
        style={{ ...sectionCard(120), marginBottom: "1.5rem" }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            color: t.textBright,
            marginBottom: "1rem",
          }}
        >
          Writing Streak
        </h3>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            alignItems: "flex-start",
            marginBottom: "1rem",
          }}
        >
          {/* Streak counter */}
          <div style={{ textAlign: "center", minWidth: "80px" }}>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: streak > 0 ? t.accent : t.textDim,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1,
              }}
            >
              {streak}
            </div>
            <div style={{ color: t.textMuted, fontSize: "0.72rem", marginTop: "0.2rem" }}>
              day{streak !== 1 ? "s" : ""} streak
            </div>
          </div>
          {/* Today's count */}
          <div style={{ textAlign: "center", minWidth: "80px" }}>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: todayWords > 0 ? t.success : t.textDim,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1,
              }}
            >
              {todayWords.toLocaleString()}
            </div>
            <div style={{ color: t.textMuted, fontSize: "0.72rem", marginTop: "0.2rem" }}>
              words today
            </div>
          </div>
          {/* 7-day mini bar chart */}
          <div style={{ flex: 1, minWidth: "180px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "3px",
                height: "48px",
              }}
            >
              {last7.map((day) => {
                const barHeight = maxWords7 > 0 ? Math.max(3, (day.words / maxWords7) * 48) : 3;
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.words} words`}
                    style={{
                      flex: 1,
                      height: `${barHeight}px`,
                      background: day.words > 0 ? t.accent : t.border,
                      borderRadius: "2px 2px 0 0",
                      transition: "height 0.3s",
                      minWidth: "8px",
                    }}
                  />
                );
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.6rem",
                color: t.textDim,
                marginTop: "2px",
              }}
            >
              {last7.map((day) => (
                <span key={day.date} style={{ flex: 1, textAlign: "center" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(day.date + "T00:00:00").getDay()]}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Daily goal progress bar */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              color: t.textMuted,
              marginBottom: "4px",
            }}
          >
            <span>Daily Goal</span>
            <span>
              {todayWords.toLocaleString()} / {dailyGoal.toLocaleString()} words ({goalProgress}%)
            </span>
          </div>
          <div
            style={{
              height: "6px",
              background: t.border,
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${goalProgress}%`,
                background: goalProgress >= 100 ? t.success : t.accent,
                borderRadius: "3px",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Recent Activity ──────────────────────────────────────────── */}
      {recentItems.length > 0 && (
        <div
          className="animate-slide-up"
          style={{ ...sectionCard(180), marginBottom: "1.5rem" }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              color: t.textBright,
              marginBottom: "1rem",
            }}
          >
            Recent Activity
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {recentItems.map((item, i) => {
              const col = item._collection || "";
              const def = COLLECTION_DEFS[col];
              if (!def) return null;
              const name = (item.name || item.title || "Untitled") as string;
              const time = item.updatedAt ? timeAgo(item.updatedAt as string) : "";

              return (
                <button
                  key={item.id}
                  className="animate-slide-up"
                  onClick={() => navigate(`/${col}/${item.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    background: "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontFamily: "'DM Sans', sans-serif",
                    color: "inherit",
                    textAlign: "left",
                    width: "100%",
                    transition: "background 0.15s",
                    animationDelay: `${200 + i * 40}ms`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = t.surfaceHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Collection icon */}
                  <span
                    style={{
                      fontSize: "1.1rem",
                      width: "28px",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      background: def.color + "18",
                      flexShrink: 0,
                    }}
                  >
                    {def.icon}
                  </span>
                  {/* Name + collection */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: t.textBright,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {name}
                    </div>
                    <div style={{ color: t.textDim, fontSize: "0.7rem" }}>
                      {def.label}
                    </div>
                  </div>
                  {/* Time ago */}
                  {time && (
                    <span style={{ color: t.textDim, fontSize: "0.7rem", flexShrink: 0 }}>
                      {time}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Daily Writing Prompt ──────────────────────────────────────── */}
      <div
        className="animate-slide-up"
        style={{ ...sectionCard(240), marginBottom: "1.5rem" }}
      >
        <h3
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            color: t.textBright,
            marginBottom: "0.75rem",
          }}
        >
          Daily Writing Prompt
        </h3>
        <p
          style={{
            color: t.text,
            fontSize: "0.92rem",
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.6,
            fontStyle: "italic",
            marginBottom: "1rem",
          }}
        >
          &ldquo;{prompt}&rdquo;
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => useProjectStore.getState().nextPrompt()}
            style={pillBtn(t.textMuted)}
          >
            Next Prompt
          </button>
          <button
            onClick={() => navigate("/workspace/scratchpad")}
            style={pillBtn(t.accent)}
          >
            Write Now
          </button>
        </div>
      </div>

      {/* ─── Collection Overview Grid ──────────────────────────────────── */}
      {collectionCounts.length > 0 && (
        <div
          className="animate-slide-up"
          style={{ ...sectionCard(300), marginBottom: "1.5rem" }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.1rem",
              color: t.textBright,
              marginBottom: "1rem",
            }}
          >
            Collections
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.6rem",
            }}
          >
            {collectionCounts.map(({ key, def, count }) => (
              <button
                key={key}
                className="hover-lift"
                onClick={() => navigate(`/${key}`)}
                style={{
                  background: def.color + "0a",
                  border: `1px solid ${def.color}30`,
                  borderRadius: "8px",
                  padding: "0.75rem",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "'DM Sans', sans-serif",
                  color: "inherit",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = def.color; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = def.color + "30"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1rem" }}>{def.icon}</span>
                  <span
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      color: def.color,
                    }}
                  >
                    {count}
                  </span>
                </div>
                <div
                  style={{
                    color: t.textMuted,
                    fontSize: "0.72rem",
                    marginTop: "0.3rem",
                    fontWeight: 600,
                  }}
                >
                  {def.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import type { Theme } from "../types";
import { useProjectStore } from "../stores/useProjectStore";
import { useDataStore } from "../stores/useDataStore";
import { estimateTotalWords, getCompleteness } from "../workspace/WorkspaceViews";
import { COLLECTION_DEFS } from "../constants";

interface Props {
  theme: Theme;
}

// --- Helpers ---

const LS_KEY = "sa_pomodoro_today";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadPomodoroCount(): number {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date: string; count: number };
    if (parsed.date === getTodayKey()) return parsed.count;
    return 0;
  } catch {
    return 0;
  }
}

function savePomodoroCount(count: number): void {
  localStorage.setItem(LS_KEY, JSON.stringify({ date: getTodayKey(), count }));
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function playBeep(): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio not available
  }
}

function countWordsInText(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const TEXT_FIELDS = [
  "overview", "synopsis", "description", "content", "background",
  "personality", "motivations", "fears", "abilities", "history",
  "ideology", "goals", "mechanics", "details", "phases",
  "choreography", "notes",
];

// ---- Styles ----

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

const sectionCard = (t: Theme): React.CSSProperties => ({
  background: t.surface,
  border: `1px solid ${t.border}`,
  borderRadius: "8px",
  padding: "1.25rem",
  marginBottom: "1.25rem",
});

const sectionTitle = (t: Theme): React.CSSProperties => ({
  fontWeight: 700,
  fontSize: "1rem",
  color: t.textBright,
  marginBottom: "0.75rem",
  fontFamily: "'Playfair Display',serif",
});

const inputStyle = (t: Theme): React.CSSProperties => ({
  background: t.input,
  border: `1px solid ${t.inputBorder}`,
  borderRadius: "6px",
  padding: "0.4rem 0.6rem",
  color: t.text,
  fontFamily: "'DM Sans',sans-serif",
  fontSize: "0.82rem",
  width: "80px",
  textAlign: "center",
});

// ===========================================================================
// WritingTools Component
// ===========================================================================

export default function WritingTools({ theme: t }: Props) {
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const updateMeta = useProjectStore((s) => s.updateMeta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);

  const totalWords = estimateTotalWords(data, scratchpadText || "");
  const dailyGoal = (meta.dailyWordGoal as number) || 500;

  // ---- Word Count Goal ----

  const [goalInput, setGoalInput] = useState<string>(String(dailyGoal));

  useEffect(() => {
    setGoalInput(String((meta.dailyWordGoal as number) || 500));
  }, [meta.dailyWordGoal]);

  const handleGoalChange = useCallback(() => {
    const parsed = parseInt(goalInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateMeta({ dailyWordGoal: parsed });
    } else {
      setGoalInput(String(dailyGoal));
    }
  }, [goalInput, dailyGoal, updateMeta]);

  const progressPct = Math.min(100, Math.round((totalWords / dailyGoal) * 100));

  // ---- Pomodoro Timer ----

  const [workMinutes, setWorkMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);
  const [isWork, setIsWork] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [running, setRunning] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(loadPomodoroCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick the timer
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Phase complete
          playBeep();
          if (isWork) {
            const newCount = pomodoroCount + 1;
            setPomodoroCount(newCount);
            savePomodoroCount(newCount);
            setIsWork(false);
            return breakMinutes * 60;
          } else {
            setIsWork(true);
            return workMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, isWork, workMinutes, breakMinutes, pomodoroCount]);

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setIsWork(true);
    setTimeLeft(workMinutes * 60);
  };

  const handleWorkMinChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0 && n <= 120) {
      setWorkMinutes(n);
      if (!running && isWork) setTimeLeft(n * 60);
    }
  };

  const handleBreakMinChange = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0 && n <= 60) {
      setBreakMinutes(n);
      if (!running && !isWork) setTimeLeft(n * 60);
    }
  };

  // ---- Writing Statistics ----

  const collectionWordCounts = Object.entries(data)
    .map(([key, items]) => {
      if (!Array.isArray(items)) return { key, words: 0 };
      let words = 0;
      items.forEach((item) => {
        TEXT_FIELDS.forEach((f) => {
          if (item[f]) words += countWordsInText(item[f] as string);
        });
      });
      return { key, words };
    })
    .filter((c) => c.words > 0)
    .sort((a, b) => b.words - a.words);

  const top5Collections = collectionWordCounts.slice(0, 5);

  const totalEntries = Object.values(data).reduce(
    (s, arr) => s + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  // Average completeness
  const allWithCompleteness = Object.entries(COLLECTION_DEFS).flatMap(([col]) =>
    (data[col] || []).map((item) => ({
      name: (item.name as string) || (item.title as string) || "Untitled",
      collection: col,
      completeness: getCompleteness(col, item),
    })),
  );

  const avgCompleteness =
    allWithCompleteness.length > 0
      ? Math.round(
          allWithCompleteness.reduce((s, e) => s + e.completeness, 0) /
            allWithCompleteness.length,
        )
      : 0;

  const sorted = [...allWithCompleteness].sort(
    (a, b) => b.completeness - a.completeness,
  );
  const mostComplete = sorted.slice(0, 3);
  const leastComplete = sorted
    .filter((e) => e.completeness > 0)
    .reverse()
    .slice(0, 3);

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div style={{ padding: "1.5rem", maxWidth: "720px", margin: "0 auto" }}>
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.6rem",
          color: t.textBright,
          marginBottom: "1.25rem",
        }}
      >
        Writing Tools
      </h2>

      {/* ---- Word Count Goals ---- */}
      <div style={sectionCard(t)}>
        <div style={sectionTitle(t)}>Word Count Goals</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "1.6rem",
                fontWeight: 700,
                color: t.accent,
              }}
            >
              {totalWords.toLocaleString()}
            </span>
            <span style={{ color: t.textDim, fontSize: "0.82rem", marginLeft: "0.4rem" }}>
              / {dailyGoal.toLocaleString()} goal
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.75rem", color: t.textMuted }}>Daily goal:</label>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onBlur={handleGoalChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoalChange();
              }}
              style={inputStyle(t)}
              min={1}
            />
          </div>
        </div>
        <div
          style={{
            height: "10px",
            background: t.inputBorder,
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressPct >= 100 ? t.success : t.accent,
              borderRadius: "5px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: t.textDim,
            marginTop: "0.4rem",
            textAlign: "right",
          }}
        >
          {progressPct}% of daily goal
        </div>
      </div>

      {/* ---- Pomodoro Timer ---- */}
      <div style={sectionCard(t)}>
        <div style={sectionTitle(t)}>Pomodoro Timer</div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: isWork ? t.accent : t.success,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {isWork ? "Work" : "Break"}
          </div>
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 700,
              color: t.textBright,
              fontFamily: "'DM Sans',monospace",
              letterSpacing: "0.05em",
            }}
          >
            {formatTime(timeLeft)}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {!running ? (
              <button onClick={handleStart} style={pillBtn(t.accent)}>
                Start
              </button>
            ) : (
              <button onClick={handlePause} style={pillBtn("#f59e0b")}>
                Pause
              </button>
            )}
            <button onClick={handleReset} style={pillBtn(t.danger)}>
              Reset
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              marginTop: "0.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.72rem", color: t.textDim }}>Work:</label>
              <input
                type="number"
                value={workMinutes}
                onChange={(e) => handleWorkMinChange(e.target.value)}
                style={inputStyle(t)}
                min={1}
                max={120}
              />
              <span style={{ fontSize: "0.72rem", color: t.textDim }}>min</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.72rem", color: t.textDim }}>Break:</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => handleBreakMinChange(e.target.value)}
                style={inputStyle(t)}
                min={1}
                max={60}
              />
              <span style={{ fontSize: "0.72rem", color: t.textDim }}>min</span>
            </div>
          </div>
          <div style={{ fontSize: "0.78rem", color: t.textMuted, marginTop: "0.25rem" }}>
            Sessions today:{" "}
            <span style={{ fontWeight: 700, color: t.accent }}>{pomodoroCount}</span>
          </div>
        </div>
      </div>

      {/* ---- Writing Statistics ---- */}
      <div style={sectionCard(t)}>
        <div style={sectionTitle(t)}>Writing Statistics</div>

        {/* Summary row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {[
            { label: "Total Words", value: totalWords.toLocaleString() },
            { label: "Total Entries", value: totalEntries },
            { label: "Avg Completeness", value: `${avgCompleteness}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: t.surfaceHover,
                border: `1px solid ${t.border}`,
                borderRadius: "6px",
                padding: "0.75rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: t.accent }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.68rem", color: t.textDim }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Words per collection */}
        {top5Collections.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: t.textBright,
                marginBottom: "0.5rem",
              }}
            >
              Words by Collection (Top 5)
            </div>
            {top5Collections.map((c) => {
              const cfg = COLLECTION_DEFS[c.key];
              const maxWords = top5Collections[0]?.words || 1;
              const barPct = Math.round((c.words / maxWords) * 100);
              return (
                <div
                  key={c.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  <span
                    style={{
                      width: "110px",
                      fontSize: "0.75rem",
                      color: cfg?.color || t.textMuted,
                    }}
                  >
                    {cfg?.icon || ""} {cfg?.label || c.key}
                  </span>
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
                        width: `${barPct}%`,
                        background: cfg?.color || t.accent,
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: t.textDim,
                      width: "55px",
                      textAlign: "right",
                    }}
                  >
                    {c.words.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Most / Least complete */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {mostComplete.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: t.textBright,
                  marginBottom: "0.4rem",
                }}
              >
                Most Complete
              </div>
              {mostComplete.map((e, i) => (
                <div
                  key={`most-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: t.text,
                    padding: "0.2rem 0",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>
                    {e.name}
                  </span>
                  <span style={{ color: t.success, fontWeight: 600 }}>{e.completeness}%</span>
                </div>
              ))}
            </div>
          )}
          {leastComplete.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: t.textBright,
                  marginBottom: "0.4rem",
                }}
              >
                Least Complete
              </div>
              {leastComplete.map((e, i) => (
                <div
                  key={`least-${i}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: t.text,
                    padding: "0.2rem 0",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>
                    {e.name}
                  </span>
                  <span style={{ color: t.danger, fontWeight: 600 }}>{e.completeness}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

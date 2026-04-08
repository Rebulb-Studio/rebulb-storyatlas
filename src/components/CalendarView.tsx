import { useState, useMemo } from "react";
import type { Theme } from "../types";
import { useDataStore } from "../stores/useDataStore";
import { useProjectStore } from "../stores/useProjectStore";

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

interface TimelineEvent {
  id: string;
  name?: string;
  title?: string;
  date?: string;
  type?: string;
  _collection?: string;
  [key: string]: unknown;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: TimelineEvent[];
  milestones: Milestone[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_COLORS: Record<string, string> = {
  War: "#dc2626",
  Birth: "#10b981",
  Death: "#6b7280",
  Discovery: "#3b82f6",
  Catastrophe: "#ef4444",
  Political: "#8b5cf6",
  Cultural: "#ec4899",
  Personal: "#f59e0b",
  Founding: "#06b6d4",
  Other: "#64748b",
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

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarView({ navigate, theme: t }: Props) {
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);

  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const milestones: Milestone[] = useMemo(
    () =>
      Array.isArray((meta as Record<string, unknown>).milestones)
        ? ((meta as Record<string, unknown>).milestones as Milestone[])
        : [],
    [meta],
  );

  // ─── Extract Timeline Events ─────────────────────────────────────────
  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const events = data.timelineEvents;
    if (!Array.isArray(events)) return [];
    return events.map((e) => ({ ...e, _collection: "timelineEvents" }));
  }, [data]);

  // ─── Build Calendar Grid ─────────────────────────────────────────────
  const calendarDays: CalendarDay[] = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startDay = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = lastOfMonth.getDate();

    const days: CalendarDay[] = [];

    // Fill leading days from previous month
    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLast - i);
      days.push({ date: d, inMonth: false, isToday: isSameDay(d, today), events: [], milestones: [] });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      days.push({ date: d, inMonth: true, isToday: isSameDay(d, today), events: [], milestones: [] });
    }

    // Fill trailing days to complete last week
    const trailing = 7 - (days.length % 7);
    if (trailing < 7) {
      for (let i = 1; i <= trailing; i++) {
        const d = new Date(viewYear, viewMonth + 1, i);
        days.push({ date: d, inMonth: false, isToday: isSameDay(d, today), events: [], milestones: [] });
      }
    }

    // Place timeline events onto days
    timelineEvents.forEach((ev) => {
      const parsed = parseDate((ev.date as string) || "");
      if (!parsed) return;
      const match = days.find((d) => isSameDay(d.date, parsed));
      if (match) match.events.push(ev);
    });

    // Place milestones onto days by deadline
    milestones.forEach((ms) => {
      const parsed = parseDate(ms.deadline);
      if (!parsed) return;
      const match = days.find((d) => isSameDay(d.date, parsed));
      if (match) match.milestones.push(ms);
    });

    return days;
  }, [viewYear, viewMonth, today, timelineEvents, milestones]);

  // ─── Month Navigation ────────────────────────────────────────────────
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // ─── Render ──────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: "10px",
    padding: "1.2rem",
  };

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
        Calendar
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.82rem", marginBottom: "1.5rem", marginTop: 0 }}>
        View timeline events and milestone deadlines at a glance.
      </p>

      {/* ── Month Navigation ──────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <button onClick={goToPrevMonth} style={pillBtn(t.accent)}>
          {"< Prev"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: t.textBright,
            }}
          >
            {monthLabel}
          </span>
          <button onClick={goToToday} style={pillBtn(t.info)}>
            Today
          </button>
        </div>
        <button onClick={goToNextMonth} style={pillBtn(t.accent)}>
          {"Next >"}
        </button>
      </div>

      {/* ── Calendar Grid ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        {/* Day-of-week headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1px",
            marginBottom: "0.5rem",
          }}
        >
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: "0.72rem",
                color: t.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "0.4rem 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "1px",
          }}
        >
          {calendarDays.map((day, idx) => {
            const hasContent = day.events.length > 0 || day.milestones.length > 0;
            return (
              <div
                key={idx}
                style={{
                  minHeight: "80px",
                  padding: "0.35rem",
                  background: day.isToday
                    ? t.accent + "12"
                    : day.inMonth
                      ? t.bg
                      : t.surface,
                  border: day.isToday
                    ? `2px solid ${t.accent}`
                    : `1px solid ${t.border}`,
                  borderRadius: "6px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: day.isToday ? 700 : 500,
                    color: day.inMonth
                      ? day.isToday
                        ? t.accent
                        : t.text
                      : t.textDim,
                    marginBottom: "0.2rem",
                  }}
                >
                  {day.date.getDate()}
                </div>

                {/* Events */}
                {day.events.slice(0, 3).map((ev) => {
                  const evType = (ev.type as string) || "Other";
                  const evColor = EVENT_TYPE_COLORS[evType] || EVENT_TYPE_COLORS.Other;
                  const label = (ev.name as string) || (ev.title as string) || "Event";
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/timelineEvents/${ev.id}`);
                      }}
                      title={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.2rem",
                        cursor: "pointer",
                        marginBottom: "0.15rem",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: evColor,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.62rem",
                          color: t.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}

                {/* Milestones */}
                {day.milestones.slice(0, 2).map((ms) => (
                  <div
                    key={ms.id}
                    title={`Milestone: ${ms.title}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      marginBottom: "0.15rem",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "2px",
                        background: ms.completed ? t.success : t.danger,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.62rem",
                        color: ms.completed ? t.success : t.danger,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ms.title}
                    </span>
                  </div>
                ))}

                {/* Overflow indicator */}
                {(day.events.length > 3 || day.milestones.length > 2) && (
                  <div style={{ fontSize: "0.58rem", color: t.textDim, fontStyle: "italic" }}>
                    +{day.events.length - 3 + Math.max(0, day.milestones.length - 2)} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: "1rem" }}>
        <h3
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1rem",
            color: t.textBright,
            marginTop: 0,
            marginBottom: "0.75rem",
          }}
        >
          Legend
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {Object.entries(EVENT_TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                }}
              />
              <span style={{ fontSize: "0.72rem", color: t.textMuted }}>{type}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: t.danger,
              }}
            />
            <span style={{ fontSize: "0.72rem", color: t.textMuted }}>Milestone (pending)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "2px",
                background: t.success,
              }}
            />
            <span style={{ fontSize: "0.72rem", color: t.textMuted }}>Milestone (done)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

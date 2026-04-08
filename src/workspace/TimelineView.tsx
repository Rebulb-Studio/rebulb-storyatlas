import { useState, useMemo } from "react";
import type { CollectionData, Entry, Theme } from "../types";

interface TimelineEvent {
  id: string;
  name: string;
  date: string;
  dateValue: number;
  type: string;
  scale: string;
  overview: string;
}

function parseEvents(data: CollectionData): TimelineEvent[] {
  return (data.timelineEvents || []).map((e) => ({
    id: e.id,
    name: (e.name as string) || "Untitled",
    date: (e.date as string) || "",
    dateValue: parseFloat((e.dateValue as string) || "0") || 0,
    type: (e.type as string) || "",
    scale: (e.scale as string) || "",
    overview: (e.overview as string) || "",
  })).sort((a, b) => a.dateValue - b.dateValue);
}

const TYPE_COLORS: Record<string, string> = {
  "Political": "#3b82f6", "Military": "#ef4444", "Cultural": "#a855f7",
  "Natural": "#10b981", "Economic": "#f59e0b", "Religious": "#ec4899",
  "Technological": "#06b6d4", "Personal": "#8b5cf6",
};

export default function TimelineView({ data, onView, theme: t }: {
  data: CollectionData; onView: (col: string, item: Entry) => void; theme: Theme;
}) {
  const events = useMemo(() => parseEvents(data), [data]);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const types = useMemo(() => [...new Set(events.map((e) => e.type).filter(Boolean))], [events]);
  const filtered = typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter);

  if (events.length === 0) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.5rem" }}>Timeline</h2>
        <p style={{ color: t.textDim }}>Add timeline events with date values to see the visual timeline.</p>
      </div>
    );
  }

  const minVal = Math.min(...filtered.map((e) => e.dateValue));
  const maxVal = Math.max(...filtered.map((e) => e.dateValue));
  const range = maxVal - minVal || 1;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.75rem" }}>Timeline</h2>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button onClick={() => setTypeFilter("all")} style={{
          background: typeFilter === "all" ? t.accent + "20" : "transparent",
          border: `1px solid ${typeFilter === "all" ? t.accent + "50" : t.border}`,
          color: typeFilter === "all" ? t.accent : t.textDim,
          padding: "0.2rem 0.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
        }}>All ({events.length})</button>
        {types.map((type) => {
          const color = TYPE_COLORS[type] || t.accent;
          const active = typeFilter === type;
          return (
            <button key={type} onClick={() => setTypeFilter(type)} style={{
              background: active ? color + "20" : "transparent",
              border: `1px solid ${active ? color + "50" : t.border}`,
              color: active ? color : t.textDim,
              padding: "0.2rem 0.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}>{type}</button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1.5rem 1rem", position: "relative" }}>
        {/* Center line */}
        <div style={{ position: "absolute", left: "50%", top: "1.5rem", bottom: "1.5rem", width: "2px", background: t.border, transform: "translateX(-50%)" }} />

        {filtered.map((event, i) => {
          const pct = ((event.dateValue - minVal) / range) * 100;
          const isLeft = i % 2 === 0;
          const color = TYPE_COLORS[event.type] || t.accent;

          return (
            <div key={event.id} style={{ display: "flex", alignItems: "flex-start", marginBottom: "1.5rem", position: "relative" }}>
              {isLeft ? (
                <>
                  <div style={{ flex: 1, textAlign: "right", paddingRight: "1.5rem" }}>
                    <button onClick={() => { setSelected(event); const item = (data.timelineEvents || []).find((e) => e.id === event.id); if (item) onView("timelineEvents", item); }}
                      style={{ background: t.surfaceHover, border: `1px solid ${color}30`, borderRadius: "8px", padding: "0.75rem", cursor: "pointer", textAlign: "right", fontFamily: "inherit", color: "inherit", maxWidth: "320px", marginLeft: "auto", display: "block" }}>
                      <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.88rem" }}>{event.name}</div>
                      <div style={{ fontSize: "0.72rem", color, marginTop: "2px" }}>{event.date}</div>
                      {event.type && <span style={{ fontSize: "0.65rem", background: color + "15", color, padding: "1px 6px", borderRadius: "8px" }}>{event.type}</span>}
                      {event.overview && <div style={{ fontSize: "0.75rem", color: t.textMuted, marginTop: "4px" }}>{event.overview.slice(0, 100)}{event.overview.length > 100 ? "..." : ""}</div>}
                    </button>
                  </div>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: color, border: `2px solid ${t.bg}`, flexShrink: 0, position: "relative", zIndex: 1 }} />
                  <div style={{ flex: 1, paddingLeft: "1.5rem" }} />
                </>
              ) : (
                <>
                  <div style={{ flex: 1, paddingRight: "1.5rem" }} />
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: color, border: `2px solid ${t.bg}`, flexShrink: 0, position: "relative", zIndex: 1 }} />
                  <div style={{ flex: 1, paddingLeft: "1.5rem" }}>
                    <button onClick={() => { const item = (data.timelineEvents || []).find((e) => e.id === event.id); if (item) onView("timelineEvents", item); }}
                      style={{ background: t.surfaceHover, border: `1px solid ${color}30`, borderRadius: "8px", padding: "0.75rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "inherit", maxWidth: "320px" }}>
                      <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.88rem" }}>{event.name}</div>
                      <div style={{ fontSize: "0.72rem", color, marginTop: "2px" }}>{event.date}</div>
                      {event.type && <span style={{ fontSize: "0.65rem", background: color + "15", color, padding: "1px 6px", borderRadius: "8px" }}>{event.type}</span>}
                      {event.overview && <div style={{ fontSize: "0.75rem", color: t.textMuted, marginTop: "4px" }}>{event.overview.slice(0, 100)}{event.overview.length > 100 ? "..." : ""}</div>}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

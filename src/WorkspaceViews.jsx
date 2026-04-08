import { useState, useRef, useCallback } from "react";
import { COLLECTION_DEFS, WORKSPACE_SECTIONS } from "./constants.js";

// ─── Helpers ──────────────────────────────────────────────────────────
function getCompleteness(collection, item) {
  const cfg = COLLECTION_DEFS[collection];
  if (!cfg) return 0;
  const total = cfg.fields.length;
  if (total === 0) return 100;
  const filled = cfg.fields.filter(f => {
    const v = item[f.k];
    return v !== undefined && v !== null && v !== "";
  }).length;
  return Math.round((filled / total) * 100);
}

function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateTotalWords(data, scratchpad) {
  let total = 0;
  const textFields = ["overview","synopsis","description","content","background","personality","motivations","fears","abilities","history","ideology","goals","mechanics","details","phases","choreography","notes"];
  Object.values(data).forEach(items => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      textFields.forEach(f => { if (item[f]) total += countWords(item[f]); });
    });
  });
  if (scratchpad) total += countWords(scratchpad);
  return total;
}

// ─── World Bible ──────────────────────────────────────────────────────
export function WorldBible({ data, projectMeta, onNavigate, theme: t }) {
  const coverageRows = Object.entries(COLLECTION_DEFS).map(([key, cfg]) => {
    const items = data[key] || [];
    const avgComp = items.length ? Math.round(items.reduce((s, it) => s + getCompleteness(key, it), 0) / items.length) : 0;
    return { key, cfg, count: items.length, avgComp };
  }).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, marginBottom: "0.5rem" }}>
        {projectMeta.projectName || "StoryAtlas"} \u2014 World Bible
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        {projectMeta.genre && `${projectMeta.genre} \u00B7 `}{estimateTotalWords(data, projectMeta.scratchpad).toLocaleString()} words estimated
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "0.75rem" }}>
        {coverageRows.map(row => (
          <button key={row.key} onClick={() => onNavigate(row.key)}
            style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "inherit" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ color: row.cfg.color, fontWeight: 700 }}>{row.cfg.icon} {row.cfg.label}</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: row.cfg.color }}>{row.count}</span>
            </div>
            <div style={{ height: "4px", background: t.inputBorder, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${row.avgComp}%`, background: row.cfg.color, borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: "0.7rem", color: t.textDim, marginTop: "0.3rem" }}>{row.avgComp}% avg completeness</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Story Canvas (Kanban) ────────────────────────────────────────────
const KANBAN_COLS = [
  { id: "ideas", label: "Ideas", statuses: ["Planned","Outline","Researching","Preparing"] },
  { id: "building", label: "Building", statuses: ["In Progress","First Draft","Outlining","Draft 1","Draft 2"] },
  { id: "drafting", label: "Drafting", statuses: ["Revised","Polished","Draft 3","Revising","Revise & Resubmit"] },
  { id: "done", label: "Complete", statuses: ["Complete","Final","Published","Submitted","Accepted"] },
];

function getKanbanColumn(item) {
  const status = item.status || "";
  for (const col of KANBAN_COLS) {
    if (col.statuses.some(s => status.toLowerCase().includes(s.toLowerCase()))) return col.id;
  }
  return "ideas";
}

export function StoryCanvas({ data, projectMeta, onView, onUpdateMeta, theme: t }) {
  const storyCollections = ["plots", "chapters", "scenes", "volumes", "manuscripts"];
  const allItems = storyCollections.flatMap(col =>
    (data[col] || []).map(item => ({ ...item, _collection: col }))
  );
  const canvasNotes = projectMeta.canvasNotes || [];
  const [noteText, setNoteText] = useState("");
  const [noteCol, setNoteCol] = useState("ideas");

  const addNote = () => {
    if (!noteText.trim()) return;
    const notes = [...canvasNotes, { id: Date.now().toString(), text: noteText, column: noteCol }];
    onUpdateMeta({ canvasNotes: notes });
    setNoteText("");
  };

  const removeNote = (id) => {
    onUpdateMeta({ canvasNotes: canvasNotes.filter(n => n.id !== id) });
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, marginBottom: "1rem" }}>Story Canvas</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a sticky note..."
          style={{ flex: 1, minWidth: "200px", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "6px", padding: "0.45rem 0.6rem", color: t.text, fontFamily: "inherit", fontSize: "0.82rem" }} />
        <select value={noteCol} onChange={e => setNoteCol(e.target.value)}
          style={{ background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "6px", padding: "0.45rem", color: t.text, fontFamily: "inherit", fontSize: "0.82rem" }}>
          {KANBAN_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={addNote} style={{ background: t.accentDim, border: `1px solid ${t.accent}40`, color: t.accent, padding: "0.45rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 600 }}>Add</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", minHeight: "400px" }}>
        {KANBAN_COLS.map(col => {
          const colItems = allItems.filter(it => getKanbanColumn(it) === col.id);
          const colNotes = canvasNotes.filter(n => n.column === col.id);
          return (
            <div key={col.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.75rem" }}>
              <div style={{ fontWeight: 700, fontSize: "0.8rem", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                {col.label} <span style={{ color: t.textDim }}>({colItems.length + colNotes.length})</span>
              </div>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                {colItems.map(item => {
                  const cfg = COLLECTION_DEFS[item._collection];
                  return (
                    <button key={item.id} onClick={() => onView(item._collection, item)}
                      style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderLeft: `3px solid ${cfg?.color || t.accent}`, borderRadius: "4px", padding: "0.5rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: t.text, fontSize: "0.78rem" }}>
                      <div style={{ fontWeight: 600, marginBottom: "2px" }}>{item.name || item.title || "Untitled"}</div>
                      <div style={{ fontSize: "0.65rem", color: t.textDim }}>{cfg?.label}</div>
                    </button>
                  );
                })}
                {colNotes.map(note => (
                  <div key={note.id} style={{ background: "#fef08a18", border: "1px solid #fef08a30", borderRadius: "4px", padding: "0.5rem", fontSize: "0.78rem", color: "#fef08a", display: "flex", justifyContent: "space-between" }}>
                    <span>{note.text}</span>
                    <button onClick={() => removeNote(note.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.7rem", padding: 0 }}>{"\u00D7"}</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Canon Graph ──────────────────────────────────────────────────────
export function CanonGraph({ data, onView, theme: t }) {
  const nodes = [];
  const edges = [];
  const nodeMap = {};

  const addNode = (id, label, type, color) => {
    if (!nodeMap[id]) {
      nodeMap[id] = { id, label, type, color };
      nodes.push(nodeMap[id]);
    }
  };

  (data.characters || []).forEach(ch => {
    const id = `char:${ch.id}`;
    addNode(id, ch.name || "?", "character", "#8b5cf6");
    if (ch.affiliation) {
      const fac = (data.factions || []).find(f => (f.name || "").toLowerCase() === ch.affiliation.toLowerCase());
      if (fac) {
        addNode(`fac:${fac.id}`, fac.name, "faction", "#ef4444");
        edges.push({ from: id, to: `fac:${fac.id}`, label: "member of" });
      }
    }
  });

  (data.factions || []).forEach(fac => {
    const id = `fac:${fac.id}`;
    addNode(id, fac.name || "?", "faction", "#ef4444");
    if (fac.leader) {
      const ch = (data.characters || []).find(c => (c.name || "").toLowerCase() === fac.leader.toLowerCase());
      if (ch) {
        addNode(`char:${ch.id}`, ch.name, "character", "#8b5cf6");
        edges.push({ from: `char:${ch.id}`, to: id, label: "leads" });
      }
    }
    (typeof fac.allies === "string" ? fac.allies.split(",") : fac.allies || []).forEach(a => {
      const ally = (data.factions || []).find(f => (f.name || "").toLowerCase().trim() === a.toLowerCase().trim());
      if (ally) {
        addNode(`fac:${ally.id}`, ally.name, "faction", "#ef4444");
        edges.push({ from: id, to: `fac:${ally.id}`, label: "ally" });
      }
    });
    (typeof fac.enemies === "string" ? fac.enemies.split(",") : fac.enemies || []).forEach(e => {
      const enemy = (data.factions || []).find(f => (f.name || "").toLowerCase().trim() === e.toLowerCase().trim());
      if (enemy) {
        addNode(`fac:${enemy.id}`, enemy.name, "faction", "#ef4444");
        edges.push({ from: id, to: `fac:${enemy.id}`, label: "enemy" });
      }
    });
  });

  // Radial layout
  const cx = 400, cy = 300, radius = 220;
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / (nodes.length || 1);
    n.x = cx + radius * Math.cos(angle);
    n.y = cy + radius * Math.sin(angle);
  });

  if (nodes.length === 0) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.5rem" }}>Canon Graph</h2>
        <p style={{ color: t.textDim }}>Add characters and factions with affiliations to see the relationship graph.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem" }}>Canon Graph</h2>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <svg viewBox="0 0 800 600" style={{ width: "100%", height: "auto" }}>
          {edges.map((e, i) => {
            const from = nodeMap[e.from], to = nodeMap[e.to];
            if (!from || !to) return null;
            const color = e.label === "enemy" ? "#ef4444" : e.label === "ally" ? "#22c55e" : "#64748b";
            return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="1" opacity="0.5" />;
          })}
          {nodes.map(n => (
            <g key={n.id} style={{ cursor: "pointer" }} onClick={() => {
              const [type, id] = n.id.split(":");
              const col = type === "char" ? "characters" : "factions";
              const item = (data[col] || []).find(it => it.id === id);
              if (item) onView(col, item);
            }}>
              <circle cx={n.x} cy={n.y} r="18" fill={n.color} opacity="0.2" stroke={n.color} strokeWidth="1.5" />
              <circle cx={n.x} cy={n.y} r="5" fill={n.color} />
              <text x={n.x} y={n.y + 28} textAnchor="middle" fill={t.textMuted} fontSize="9" fontFamily="'DM Sans',sans-serif">{n.label.slice(0, 16)}</text>
            </g>
          ))}
        </svg>
      </div>
      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.85rem", marginBottom: "0.5rem" }}>Edges ({edges.length})</div>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          {edges.slice(0, 24).map((e, i) => {
            const from = nodeMap[e.from], to = nodeMap[e.to];
            return (
              <div key={i} style={{ fontSize: "0.75rem", color: t.textMuted, padding: "0.3rem 0.5rem", background: t.surface, borderRadius: "4px" }}>
                <strong>{from?.label}</strong> {"\u2192"} <strong>{to?.label}</strong> <span style={{ color: t.textDim }}>({e.label})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Project Stats ────────────────────────────────────────────────────
export function ProjectStats({ data, theme: t }) {
  const rows = Object.entries(COLLECTION_DEFS).map(([key, cfg]) => {
    const items = data[key] || [];
    const avgComp = items.length ? Math.round(items.reduce((s, it) => s + getCompleteness(key, it), 0) / items.length) : 0;
    return { key, cfg, count: items.length, avgComp };
  }).sort((a, b) => b.count - a.count);

  const weakEntries = Object.entries(COLLECTION_DEFS).flatMap(([col, cfg]) =>
    (data[col] || []).map(it => ({ ...it, _collection: col, _cfg: cfg, _comp: getCompleteness(col, it) }))
  ).filter(e => e._comp < 40 && e._comp > 0).sort((a, b) => a._comp - b._comp).slice(0, 10);

  const totalEntries = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem" }}>Project Stats</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.accent }}>{totalEntries}</div>
          <div style={{ fontSize: "0.75rem", color: t.textDim }}>Total Entries</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.accent }}>{rows.filter(r => r.count > 0).length}</div>
          <div style={{ fontSize: "0.75rem", color: t.textDim }}>Active Collections</div>
        </div>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: t.accent }}>{estimateTotalWords(data, "").toLocaleString()}</div>
          <div style={{ fontSize: "0.75rem", color: t.textDim }}>Est. Words</div>
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Coverage by Collection</div>
        {rows.filter(r => r.count > 0).map(row => (
          <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{ width: "120px", fontSize: "0.78rem", color: row.cfg.color }}>{row.cfg.icon} {row.cfg.label}</span>
            <div style={{ flex: 1, height: "6px", background: t.inputBorder, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${row.avgComp}%`, background: row.cfg.color, borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "0.7rem", color: t.textDim, width: "60px", textAlign: "right" }}>{row.count} ({row.avgComp}%)</span>
          </div>
        ))}
      </div>

      {weakEntries.length > 0 && (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "1rem" }}>
          <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Entries That Need Love</div>
          {weakEntries.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem", fontSize: "0.78rem" }}>
              <span style={{ color: e._cfg.color }}>{e._cfg.icon}</span>
              <span style={{ flex: 1, color: t.text }}>{e.name || e.title || "Untitled"}</span>
              <span style={{ color: e._comp < 20 ? t.danger : "#f59e0b", fontSize: "0.7rem" }}>{e._comp}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Atlas Map ────────────────────────────────────────────────────────
export function AtlasMap({ data, onView, theme: t }) {
  const locations = (data.locations || []).filter(l => l.mapX || l.mapY);
  const allLocations = data.locations || [];

  if (allLocations.length === 0) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.5rem" }}>Atlas Map</h2>
        <p style={{ color: t.textDim }}>Add locations with Map X/Y coordinates to see them on the atlas.</p>
      </div>
    );
  }

  // Generate pseudo-positions for locations without coordinates
  const pins = allLocations.map((loc, i) => {
    const x = loc.mapX ? parseFloat(loc.mapX) : 100 + ((i * 137) % 600);
    const y = loc.mapY ? parseFloat(loc.mapY) : 80 + ((i * 89) % 400);
    return { ...loc, px: Math.max(30, Math.min(770, x)), py: Math.max(30, Math.min(570, y)) };
  });

  const regions = [...new Set(allLocations.map(l => l.region).filter(Boolean))];

  return (
    <div style={{ padding: "1.5rem" }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem" }}>Atlas Map</h2>
      {regions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
          {regions.map(r => <span key={r} style={{ fontSize: "0.7rem", background: t.accentDim, border: `1px solid ${t.accent}30`, color: t.accent, padding: "2px 8px", borderRadius: "4px" }}>{r}</span>)}
        </div>
      )}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", overflow: "hidden" }}>
        <svg viewBox="0 0 800 600" style={{ width: "100%", height: "auto", background: `radial-gradient(circle at 50% 50%, ${t.surface}, ${t.bg})` }}>
          {/* Grid */}
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={(i + 1) * 80} y1="0" x2={(i + 1) * 80} y2="600" stroke={t.border} strokeWidth="0.5" />)}
          {Array.from({ length: 7 }, (_, i) => <line key={`h${i}`} x1="0" y1={(i + 1) * 75} x2="800" y2={(i + 1) * 75} stroke={t.border} strokeWidth="0.5" />)}
          {pins.map(pin => (
            <g key={pin.id} style={{ cursor: "pointer" }} onClick={() => onView("locations", pin)}>
              <circle cx={pin.px} cy={pin.py} r="12" fill="#10b981" opacity="0.2" stroke="#10b981" strokeWidth="1.5" />
              <circle cx={pin.px} cy={pin.py} r="4" fill="#10b981" />
              <text x={pin.px} y={pin.py + 20} textAnchor="middle" fill={t.textMuted} fontSize="8" fontFamily="'DM Sans',sans-serif">{(pin.name || "").slice(0, 14)}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Scratchpad ───────────────────────────────────────────────────────
export function Scratchpad({ text, onChange, onSave, theme: t }) {
  const words = countWords(text);
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, margin: 0 }}>Scratchpad</h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: t.textDim }}>{words} words</span>
          <button onClick={onSave} style={{ background: t.accentDim, border: `1px solid ${t.accent}40`, color: t.accent, padding: "0.35rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 600 }}>Save Now</button>
          <button onClick={() => onChange("")} style={{ background: `${t.danger}18`, border: `1px solid ${t.danger}40`, color: t.danger, padding: "0.35rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", fontWeight: 600 }}>Clear</button>
        </div>
      </div>
      <textarea value={text} onChange={e => onChange(e.target.value)} placeholder="Quick notes, ideas, fragments... Autosaves after 700ms."
        style={{ width: "100%", minHeight: "calc(100vh - 200px)", background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "8px", padding: "1rem", color: t.text, fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7, resize: "vertical" }} />
    </div>
  );
}

export { getCompleteness, estimateTotalWords };

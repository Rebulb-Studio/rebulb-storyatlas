import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./api.js";
import CommandPalette from "./CommandPalette.jsx";
import { WorldBible, StoryCanvas, CanonGraph, ProjectStats, AtlasMap, Scratchpad, getCompleteness, estimateTotalWords } from "./WorkspaceViews.jsx";
import {
  COLLECTION_DEFS, FORMAT_PRESETS, OUTLINE_METHODS, NAV_GROUPS, WORKSPACE_SECTIONS,
  FIELD_HELP, WRITING_PROMPTS, STARTER_KITS, DARK_THEME, LIGHT_THEME,
  PUBLISH_SECTIONS, SERIES_FORMATS, SERIES_STATUSES, READER_THEMES, READER_FONTS,
} from "./constants.js";

// ─── Component ─────────────────────────────────────────────────────────
export default function StoryAtlasWorkspace() {
  const [data, setData] = useState({});
  const [section, setSection] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectMeta, setProjectMeta] = useState({ projectName: "", genre: "", format: "novel", description: "", author: "" });
  const [loaded, setLoaded] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("sa_darkMode") !== "false");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [toasts, setToasts] = useState([]);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState("");
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * WRITING_PROMPTS.length));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const scratchTimer = useRef(null);

  const theme = darkMode ? DARK_THEME : LIGHT_THEME;

  // Persist dark mode preference
  useEffect(() => { localStorage.setItem("sa_darkMode", darkMode); }, [darkMode]);

  // Toast helper
  const toast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  // Save status wrapper
  const withSave = useCallback(async (fn) => {
    setSaveStatus("saving");
    try {
      const result = await fn();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(s => s === "saved" ? "idle" : s), 2000);
      return result;
    } catch (err) {
      setSaveStatus("error");
      toast(err.message || "Save failed", "error");
      console.warn("StoryAtlas save error:", err);
      throw err;
    }
  }, [toast]);

  // ─── Load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const payload = await api.loadAll();
        const { meta, ...collections } = payload;
        setData(collections);
        if (meta) setProjectMeta(prev => ({ ...prev, ...meta }));
        if (meta?.scratchpad) setScratchpadText(meta.scratchpad);
        // Show onboarding if brand new project
        if (!meta?.projectName && !localStorage.getItem("sa_onboarding_done")) {
          const totalEntries = Object.values(collections).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
          if (totalEntries === 0) setShowOnboarding(true);
        }
      } catch (err) {
        console.warn("StoryAtlas: failed to load data, falling back to empty state", err);
        toast("Could not connect to backend. Running in offline mode.", "error");
      }
      setLoaded(true);
    })();
  }, [toast]);

  // ─── CRUD ──────────────────────────────────────────────────────────
  const addEntry = async (collection, entry) => {
    try {
      const created = await withSave(() => api.createEntry(collection, entry));
      setData(prev => ({ ...prev, [collection]: [created, ...(prev[collection] || [])] }));
      setEditing(null);
      toast(`Created ${COLLECTION_DEFS[collection]?.label?.replace(/s$/, "") || "entry"}`, "success");
      return created;
    } catch { return null; }
  };

  const updateEntry = async (collection, id, updates) => {
    try {
      const updated = await withSave(() => api.updateEntry(collection, id, updates));
      setData(prev => ({ ...prev, [collection]: (prev[collection] || []).map(e => e.id === id ? updated : e) }));
      setEditing(null);
      return updated;
    } catch { return null; }
  };

  const deleteEntry = async (collection, id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await withSave(() => api.deleteEntry(collection, id));
      setData(prev => ({ ...prev, [collection]: (prev[collection] || []).filter(e => e.id !== id) }));
      setViewing(null);
      toast("Entry deleted", "info");
    } catch {}
  };

  const doUpdateMeta = async (updates) => {
    const merged = { ...projectMeta, ...updates };
    setProjectMeta(merged);
    try { await withSave(() => api.updateMeta(updates)); } catch {}
  };

  // ─── Scratchpad autosave ──────────────────────────────────────────
  const onScratchChange = (text) => {
    setScratchpadText(text);
    localStorage.setItem("sa_scratchpad_local", text);
    clearTimeout(scratchTimer.current);
    scratchTimer.current = setTimeout(() => {
      api.updateMeta({ scratchpad: text }).catch(() => {});
    }, 700);
  };

  const saveScratchNow = () => {
    clearTimeout(scratchTimer.current);
    withSave(() => api.updateMeta({ scratchpad: scratchpadText }));
  };

  // ─── Computed ─────────────────────────────────────────────────────
  const totalEntries = Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
  const allEntries = Object.entries(data).flatMap(([col, items]) =>
    (Array.isArray(items) ? items : []).map(item => ({ ...item, _collection: col }))
  );
  const searchResults = searchQuery.trim()
    ? allEntries.filter(e => {
        const q = searchQuery.toLowerCase();
        return (e.name || e.title || "").toLowerCase().includes(q) ||
          Object.values(e).some(v => typeof v === "string" && v.toLowerCase().includes(q));
      }).slice(0, 15)
    : [];

  // ─── Command palette commands ─────────────────────────────────────
  const cmdCommands = [
    ...Object.entries(COLLECTION_DEFS).map(([key, cfg]) => ({
      id: `nav:${key}`, label: cfg.label, icon: cfg.icon, group: cfg.group,
      action: () => { setSection(key); setEditing(null); setViewing(null); setFilterText(""); },
    })),
    ...Object.entries(WORKSPACE_SECTIONS).map(([key, ws]) => ({
      id: `ws:${key}`, label: ws.label, icon: ws.icon, group: "WORKSPACE",
      action: () => { setSection(key); setEditing(null); setViewing(null); },
    })),
    { id: "nav:dashboard", label: "Dashboard", icon: "\u2302", group: "NAV", action: () => { setSection("dashboard"); setEditing(null); setViewing(null); } },
    ...Object.entries(COLLECTION_DEFS).map(([key, cfg]) => ({
      id: `create:${key}`, label: `New ${cfg.label.replace(/s$/, "")}`, icon: "+", group: "CREATE",
      action: () => { setSection(key); setEditing({ collection: key, item: null }); setViewing(null); },
    })),
    { id: "export:json", label: "Export JSON Backup", icon: "\u2913", group: "EXPORT", action: () => { api.exportJSON(); toast("JSON export started", "info"); } },
    { id: "export:zip", label: "Export ZIP Package", icon: "\u2913", group: "EXPORT", action: () => { api.exportZIP(); toast("ZIP export started", "info"); } },
    { id: "toggle:dark", label: darkMode ? "Switch to Light Mode" : "Switch to Dark Mode", icon: darkMode ? "\u2600" : "\u263E", group: "SETTINGS", action: () => setDarkMode(!darkMode) },
  ];

  // ─── Keyboard shortcut ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── Export/Import ────────────────────────────────────────────────
  const doExportJSON = () => { api.exportJSON(); toast("JSON backup downloading", "info"); };
  const doExportZIP = () => { api.exportZIP(); toast("ZIP export downloading", "info"); };

  const doImport = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json,.zip";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try {
        await withSave(() => api.importFile(file));
        const payload = await api.loadAll();
        const { meta, ...collections } = payload;
        setData(collections);
        if (meta) setProjectMeta(prev => ({ ...prev, ...meta }));
        toast("Import complete!", "success");
      } catch (err) { toast(err.message || "Import failed", "error"); }
    };
    input.click();
  };

  const doReset = async () => {
    if (!confirm("Reset ALL data? This cannot be undone.")) return;
    try {
      await withSave(() => api.importJSON({ meta: {}, data: {} }));
      setData({});
      setProjectMeta({ projectName: "", genre: "", format: "novel", description: "", author: "" });
      toast("All data reset", "info");
    } catch {}
  };

  // ─── Style helpers ────────────────────────────────────────────────
  const t = theme;
  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.55rem 0.7rem", color: t.text, fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.15s",
  };
  const smallInput = {
    background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.4rem 0.6rem", color: t.text, fontSize: "0.8rem",
    fontFamily: "'DM Sans',sans-serif",
  };
  const pillBtn = (color) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer",
    fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
    transition: "all 0.15s",
  });

  if (!loaded) return <div style={{ background: t.bg, color: t.textMuted, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>Loading workspace...</div>;

  // ─── Render Helpers ──────────────────────────────────────────────
  const renderForm = (collection, existing) => {
    const cfg = COLLECTION_DEFS[collection];
    if (!cfg) return null;
    const isEdit = !!existing;
    const formData = { ...(existing || {}) };
    const kits = STARTER_KITS[collection];

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, margin: 0 }}>
            {isEdit ? `Edit ${cfg.label.replace(/s$/, "")}` : `New ${cfg.label.replace(/s$/, "")}`}
          </h2>
          <button onClick={() => { setEditing(null); setViewing(null); }} style={pillBtn("#475569")}>{"\u2190"} Back</button>
        </div>
        {!isEdit && kits && kits.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: t.textDim, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Start from template</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {kits.map((kit, i) => (
                <button key={i} onClick={() => setEditing({ collection, item: null, seed: kit.values })}
                  style={{ ...pillBtn(cfg.color), fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>{kit.label}</button>
              ))}
            </div>
          </div>
        )}
        <FormFields
          fields={cfg.fields}
          initial={{ ...formData, ...(editing?.seed || {}) }}
          onSubmit={(values) => {
            if (isEdit) updateEntry(collection, existing.id, values);
            else addEntry(collection, values);
          }}
          accent={cfg.color}
          theme={t}
          inputStyle={inputStyle}
        />
      </div>
    );
  };

  const renderDetail = (collection, item) => {
    const cfg = COLLECTION_DEFS[collection];
    if (!cfg || !item) return null;

    // Find backlinks
    const backlinks = allEntries.filter(e => {
      if (e.id === item.id && e._collection === collection) return false;
      const name = (item.name || item.title || "").toLowerCase();
      if (!name) return false;
      return Object.values(e).some(v => typeof v === "string" && v.toLowerCase().includes(name));
    }).slice(0, 10);

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, margin: 0 }}>
            <span style={{ color: cfg.color, marginRight: "0.5rem" }}>{cfg.icon}</span>
            {item.name || item.title || "Untitled"}
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => { setViewing(null); setEditing({ collection, item }); }} style={pillBtn(cfg.color)}>Edit</button>
            <button onClick={() => deleteEntry(collection, item.id)} style={pillBtn("#ef4444")}>Delete</button>
            <button onClick={() => setViewing(null)} style={pillBtn("#475569")}>{"\u2190"} Back</button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
          {cfg.fields.filter(f => f.t === "select" && item[f.k]).map(f => (
            <span key={f.k} style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}40`, color: cfg.color, fontSize: "0.72rem", padding: "3px 10px", borderRadius: "20px", fontWeight: 600 }}>
              {f.l}: {item[f.k]}
            </span>
          ))}
          <span style={{ background: t.accentDim, border: `1px solid ${t.accent}30`, color: t.accent, fontSize: "0.68rem", padding: "3px 8px", borderRadius: "20px" }}>
            {getCompleteness(collection, item)}% complete
          </span>
        </div>
        {cfg.fields.filter(f => item[f.k] && f.t !== "select").map(f => (
          <div key={f.k} style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.7rem", color: cfg.color, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>{f.l}</div>
            <div style={{ fontSize: "0.9rem", color: t.textMuted, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {f.t === "tags" ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {(typeof item[f.k] === "string" ? item[f.k].split(",") : item[f.k] || []).map((tag, i) => (
                    <span key={i} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${t.border}`, padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>{tag.trim()}</span>
                  ))}
                </div>
              ) : item[f.k]}
            </div>
          </div>
        ))}
        {backlinks.length > 0 && (
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px" }}>
            <div style={{ fontSize: "0.75rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Referenced By</div>
            {backlinks.map(bl => {
              const blCfg = COLLECTION_DEFS[bl._collection];
              return (
                <button key={bl.id} onClick={() => setViewing({ collection: bl._collection, item: bl })}
                  style={{ display: "flex", gap: "0.5rem", alignItems: "center", width: "100%", background: "transparent", border: "none", padding: "0.3rem 0", cursor: "pointer", fontFamily: "inherit", color: t.text, fontSize: "0.82rem", textAlign: "left" }}>
                  <span style={{ color: blCfg?.color }}>{blCfg?.icon}</span>
                  <span>{bl.name || bl.title || "Untitled"}</span>
                  <span style={{ fontSize: "0.65rem", color: t.textDim }}>{blCfg?.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderList = (collection) => {
    const cfg = COLLECTION_DEFS[collection];
    const items = (data[collection] || []).filter(e => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return (e.name || e.title || "").toLowerCase().includes(q) ||
        Object.values(e).some(v => typeof v === "string" && v.toLowerCase().includes(q));
    });

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, margin: 0 }}>
            <span style={{ color: cfg.color }}>{cfg.icon}</span> {cfg.label}
            <span style={{ fontSize: "0.8rem", color: t.textDim, fontWeight: 400, marginLeft: "0.5rem" }}>({items.length})</span>
          </h2>
          <button onClick={() => setEditing({ collection, item: null })} style={pillBtn(cfg.color)}>+ New</button>
        </div>
        <input placeholder={`Filter ${cfg.label.toLowerCase()}...`} value={filterText} onChange={e => setFilterText(e.target.value)} style={inputStyle} />
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: t.textDim }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{cfg.icon}</div>
            <div>No {cfg.label.toLowerCase()} yet. Create your first one!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
            {items.map(item => {
              const comp = getCompleteness(collection, item);
              const snippet = cfg.fields.filter(f => f.t === "textarea" && item[f.k]).map(f => item[f.k])[0] || "";
              return (
                <button key={item.id} onClick={() => setViewing({ collection, item })}
                  style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.85rem 1rem", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s", fontFamily: "inherit", color: "inherit" }}
                  onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
                  onMouseLeave={e => e.currentTarget.style.background = t.surface}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem" }}>{item.name || item.title || "Untitled"}</div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "2px" }}>
                      {item.status && <span style={{ fontSize: "0.7rem", color: cfg.color }}>{item.status}</span>}
                      {item.role && <span style={{ fontSize: "0.7rem", color: t.textDim }}>{item.role}</span>}
                      {item.type && <span style={{ fontSize: "0.7rem", color: t.textDim }}>{item.type}</span>}
                    </div>
                    {snippet && <div style={{ fontSize: "0.75rem", color: t.textDim, marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "400px" }}>{snippet.slice(0, 120)}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <div style={{ width: "40px", height: "4px", background: t.inputBorder, borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${comp}%`, background: comp > 60 ? t.success : comp > 30 ? "#f59e0b" : t.danger, borderRadius: "2px" }} />
                    </div>
                    <span style={{ color: t.textDim, fontSize: "0.65rem" }}>{comp}%</span>
                    <span style={{ color: t.textDim, fontSize: "0.9rem" }}>{"\u2192"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── Dashboard ───────────────────────────────────────────────────
  const renderDashboard = () => {
    const formatInfo = FORMAT_PRESETS[projectMeta.format] || FORMAT_PRESETS.novel;
    const recentItems = [...allEntries].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 8);
    const prompt = WRITING_PROMPTS[promptIndex % WRITING_PROMPTS.length];

    return (
      <div style={{ padding: "1.5rem" }}>
        {/* Project Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>{"Rebulb Studio \u00B7 Creative Workspace"}</div>
          <input value={projectMeta.projectName} onChange={e => doUpdateMeta({ projectName: e.target.value })} placeholder="Your Project Name"
            style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.6rem,4vw,2.4rem)", background: "transparent", border: "none", color: t.textBright, width: "100%", outline: "none", padding: 0 }} />
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <input value={projectMeta.author} onChange={e => doUpdateMeta({ author: e.target.value })} placeholder="Author" style={{ ...smallInput, width: "160px" }} />
            <input value={projectMeta.genre} onChange={e => doUpdateMeta({ genre: e.target.value })} placeholder="Genre" style={{ ...smallInput, width: "160px" }} />
            <select value={projectMeta.format} onChange={e => doUpdateMeta({ format: e.target.value })} style={{ ...smallInput, width: "180px" }}>
              {Object.entries(FORMAT_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <textarea value={projectMeta.description} onChange={e => doUpdateMeta({ description: e.target.value })} placeholder="Project description / logline..."
            style={{ ...inputStyle, marginTop: "0.75rem", height: "60px", resize: "vertical" }} />
        </div>

        {/* Quick Start */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {["characters", "plots", "locations", "factions", "chapters"].map(col => {
            const cfg = COLLECTION_DEFS[col];
            return (
              <button key={col} onClick={() => { setSection(col); setEditing({ collection: col, item: null }); }}
                style={pillBtn(cfg.color)}>+ {cfg.label.replace(/s$/, "")}</button>
            );
          })}
        </div>

        {/* Writing Prompt — Expanded */}
        <div style={{ background: `linear-gradient(135deg, ${t.accent}12, ${t.info}08)`, border: `2px solid ${t.accent}30`, borderRadius: "12px", padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.72rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>{"\u270E"} Writing Prompt</div>
            <div style={{ fontSize: "0.68rem", color: t.textDim }}>Prompt {(promptIndex % WRITING_PROMPTS.length) + 1} of {WRITING_PROMPTS.length}</div>
          </div>
          <div style={{ fontSize: "1rem", color: t.textBright, lineHeight: 1.7, marginBottom: "1rem", fontFamily: "'Playfair Display',serif", fontStyle: "italic" }}>{prompt}</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button onClick={() => setPromptIndex(i => i + 1)} style={pillBtn(t.accent)}>Next Prompt</button>
            <button onClick={() => { setScratchpadText(prev => prev + (prev ? "\n\n" : "") + prompt); toast("Prompt captured", "success"); }} style={pillBtn(t.info)}>Capture</button>
            <button onClick={() => { setScratchpadText(prev => prev + (prev ? "\n\n---\n\n" : "") + `PROMPT: ${prompt}\n\n`); setSection("scratchpad"); }} style={pillBtn(t.success)}>Write Now</button>
          </div>
        </div>

        {/* Format Card */}
        <div style={{ background: `linear-gradient(135deg, ${t.accent}10, ${t.info}08)`, border: `1px solid ${t.accent}25`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, color: t.accent, fontSize: "0.85rem", marginBottom: "0.5rem" }}>{formatInfo.icon} {formatInfo.label} Format Guide</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: "0.75rem", fontSize: "0.82rem", color: t.textMuted }}>
            <div><span style={{ color: t.textDim }}>Chapter Size:</span> {formatInfo.chapterWords}</div>
            <div><span style={{ color: t.textDim }}>Volume:</span> {formatInfo.volumeChapters}</div>
            <div><span style={{ color: t.textDim }}>POV:</span> {formatInfo.pov}</div>
            <div><span style={{ color: t.textDim }}>Tense:</span> {formatInfo.tense}</div>
          </div>
          <div style={{ fontSize: "0.78rem", color: t.textDim, marginTop: "0.5rem", lineHeight: 1.5 }}>{formatInfo.notes}</div>
        </div>

        {/* Stats Grid */}
        <div style={{ fontSize: "0.78rem", color: t.textDim, marginBottom: "0.5rem" }}>
          {totalEntries} total {totalEntries === 1 ? "entry" : "entries"} across all collections
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {Object.entries(COLLECTION_DEFS).map(([key, cfg]) => {
            const count = (data[key] || []).length;
            return (
              <button key={key} onClick={() => { setSection(key); setViewing(null); setEditing(null); setFilterText(""); }}
                style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "0.75rem", cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color + "60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                <div style={{ fontSize: "1.3rem", color: cfg.color, fontWeight: 700 }}>{count}</div>
                <div style={{ fontSize: "0.72rem", color: t.textDim }}>{cfg.label}</div>
              </button>
            );
          })}
        </div>

        {/* Outline Methods */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem", marginBottom: "0.75rem", fontFamily: "'Playfair Display',serif" }}>Outline Method Reference</div>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {OUTLINE_METHODS.map(m => (
              <details key={m.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "0.6rem 0.75rem" }}>
                <summary style={{ cursor: "pointer", fontWeight: 600, color: t.text, fontSize: "0.85rem" }}>
                  {m.label} <span style={{ color: t.textDim, fontWeight: 400 }}>{"\u2014"} {m.desc}</span>
                </summary>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}>
                  {m.beats.map((b, i) => (
                    <span key={i} style={{ background: t.accentDim, border: `1px solid ${t.accent}20`, color: t.accent, fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px" }}>
                      {i + 1}. {b}
                    </span>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentItems.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem", marginBottom: "0.75rem", fontFamily: "'Playfair Display',serif" }}>Recent Activity</div>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              {recentItems.map(item => {
                const cfg = COLLECTION_DEFS[item._collection];
                return cfg ? (
                  <button key={item.id} onClick={() => setViewing({ collection: item._collection, item })}
                    style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "0.6rem 0.75rem", cursor: "pointer", textAlign: "left", display: "flex", gap: "0.75rem", alignItems: "center", fontFamily: "inherit", color: "inherit" }}>
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span style={{ fontWeight: 600, color: t.text, fontSize: "0.85rem", flex: 1 }}>{item.name || item.title || "Untitled"}</span>
                    <span style={{ fontSize: "0.65rem", color: t.textDim }}>{cfg.label.replace(/s$/, "")}</span>
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Import / Export */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={doExportJSON} style={pillBtn(t.info)}>Export JSON</button>
          <button onClick={doExportZIP} style={pillBtn("#6366f1")}>Export ZIP</button>
          <button onClick={doImport} style={pillBtn(t.success)}>Import</button>
          <button onClick={doReset} style={pillBtn(t.danger)}>Reset All</button>
        </div>
      </div>
    );
  };

  // ─── Publish: Series Listing ─────────────────────────────────────
  const renderSeriesListing = () => {
    const series = projectMeta.series || [];
    const [editingSeries, setEditingSeries] = useState(null);
    const [seriesForm, setSeriesForm] = useState({ title: "", genre: "", format: "Manga", status: "Planned", synopsis: "", targetAudience: "", chapterCount: "", tags: "", coverConcept: "" });

    const saveSeries = async () => {
      const updated = editingSeries !== null
        ? series.map((s, i) => i === editingSeries ? seriesForm : s)
        : [...series, { ...seriesForm, id: Date.now().toString(36), createdAt: new Date().toISOString() }];
      await doUpdateMeta({ series: updated });
      setEditingSeries(null);
      setSeriesForm({ title: "", genre: "", format: "Manga", status: "Planned", synopsis: "", targetAudience: "", chapterCount: "", tags: "", coverConcept: "" });
      toast("Series saved", "success");
    };

    const deleteSeries = async (idx) => {
      const updated = series.filter((_, i) => i !== idx);
      await doUpdateMeta({ series: updated });
      toast("Series deleted", "info");
    };

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>{"Publish \u00B7 Series Listing"}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem", fontSize: "1.5rem" }}>Your Series</h2>

        {/* Series Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {series.map((s, i) => (
            <div key={s.id || i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, fontSize: "1.1rem" }}>{s.title || "Untitled"}</h3>
                <span style={{ background: s.status === "Ongoing" ? t.success + "20" : s.status === "Complete" ? t.info + "20" : t.accent + "15", color: s.status === "Ongoing" ? t.success : s.status === "Complete" ? t.info : t.accent, fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>{s.status}</span>
              </div>
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {s.format && <span style={{ fontSize: "0.65rem", background: t.accentDim, color: t.accent, padding: "2px 6px", borderRadius: "4px" }}>{s.format}</span>}
                {s.genre && <span style={{ fontSize: "0.65rem", background: t.accentDim, color: t.accent, padding: "2px 6px", borderRadius: "4px" }}>{s.genre}</span>}
              </div>
              {s.synopsis && <p style={{ fontSize: "0.82rem", color: t.textMuted, lineHeight: 1.5, marginBottom: "0.5rem" }}>{s.synopsis.slice(0, 150)}{s.synopsis.length > 150 ? "..." : ""}</p>}
              {s.chapterCount && <div style={{ fontSize: "0.72rem", color: t.textDim }}>{s.chapterCount} chapters planned</div>}
              <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.75rem" }}>
                <button onClick={() => { setEditingSeries(i); setSeriesForm(s); }} style={pillBtn(t.accent)}>Edit</button>
                <button onClick={() => deleteSeries(i)} style={pillBtn(t.danger)}>Delete</button>
              </div>
            </div>
          ))}

          {/* New Series Button */}
          <button onClick={() => { setEditingSeries(-1); setSeriesForm({ title: "", genre: projectMeta.genre || "", format: "Manga", status: "Planned", synopsis: "", targetAudience: "", chapterCount: "", tags: "", coverConcept: "" }); }}
            style={{ background: t.surface, border: `2px dashed ${t.border}`, borderRadius: "10px", padding: "2rem", cursor: "pointer", color: t.textDim, fontFamily: "inherit", fontSize: "0.9rem", textAlign: "center" }}>
            + Create New Series
          </button>
        </div>

        {/* Edit Form */}
        {editingSeries !== null && (
          <div style={{ background: t.surface, border: `1px solid ${t.accent}40`, borderRadius: "10px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ color: t.textBright, marginBottom: "1rem" }}>{editingSeries === -1 ? "New Series" : "Edit Series"}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Title</label><input value={seriesForm.title} onChange={e => setSeriesForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Genre</label><input value={seriesForm.genre} onChange={e => setSeriesForm(p => ({ ...p, genre: e.target.value }))} style={inputStyle} /></div>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Format</label><select value={seriesForm.format} onChange={e => setSeriesForm(p => ({ ...p, format: e.target.value }))} style={inputStyle}>{SERIES_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Status</label><select value={seriesForm.status} onChange={e => setSeriesForm(p => ({ ...p, status: e.target.value }))} style={inputStyle}>{SERIES_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Target Audience</label><input value={seriesForm.targetAudience} onChange={e => setSeriesForm(p => ({ ...p, targetAudience: e.target.value }))} style={inputStyle} placeholder="Teens, Young Adult, All Ages..." /></div>
              <div><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Chapter Count</label><input type="number" value={seriesForm.chapterCount} onChange={e => setSeriesForm(p => ({ ...p, chapterCount: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ marginTop: "0.75rem" }}><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Synopsis</label><textarea value={seriesForm.synopsis} onChange={e => setSeriesForm(p => ({ ...p, synopsis: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical" }} /></div>
            <div style={{ marginTop: "0.75rem" }}><label style={{ display: "block", fontSize: "0.7rem", color: t.accent, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Tags</label><input value={seriesForm.tags} onChange={e => setSeriesForm(p => ({ ...p, tags: e.target.value }))} style={inputStyle} placeholder="Comma-separated tags" /></div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button onClick={saveSeries} style={pillBtn(t.accent)}>Save Series</button>
              <button onClick={() => setEditingSeries(null)} style={pillBtn(t.textDim)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Publish: Reader Mode ──────────────────────────────────────
  const renderReaderMode = () => {
    const manuscripts = data.manuscripts || [];
    const [selectedMs, setSelectedMs] = useState(null);
    const [readerTheme, setReaderTheme] = useState("dark");
    const [readerFont, setReaderFont] = useState("serif");
    const [fontSize, setFontSize] = useState(18);
    const [lineHeight, setLineHeight] = useState(1.8);

    const current = manuscripts.find(m => m.id === selectedMs);
    const rTheme = READER_THEMES[readerTheme];
    const rFont = READER_FONTS[readerFont];
    const wordCount = current?.content ? current.content.split(/\s+/).filter(Boolean).length : 0;
    const readTime = Math.ceil(wordCount / 250);

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>{"Publish \u00B7 Reader Mode"}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem", fontSize: "1.5rem" }}>Reader Mode</h2>

        {/* Manuscript selector */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <select value={selectedMs || ""} onChange={e => setSelectedMs(e.target.value || null)} style={{ ...inputStyle, width: "280px" }}>
            <option value="">{"\u2014 Select Manuscript \u2014"}</option>
            {manuscripts.map(m => <option key={m.id} value={m.id}>{m.title || "Untitled"}</option>)}
          </select>
          {/* Reader controls */}
          <select value={readerTheme} onChange={e => setReaderTheme(e.target.value)} style={{ ...inputStyle, width: "100px" }}>
            {Object.entries(READER_THEMES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
          <select value={readerFont} onChange={e => setReaderFont(e.target.value)} style={{ ...inputStyle, width: "100px" }}>
            {Object.entries(READER_FONTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: t.textDim }}>
            <span>A</span>
            <input type="range" min={14} max={24} value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width: "80px" }} />
            <span style={{ fontSize: "1.1rem" }}>A</span>
          </div>
        </div>

        {!current ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: t.textDim }}>
            <div style={{ fontSize: "3rem", opacity: 0.3, marginBottom: "1rem" }}>{"\u{1F4D6}"}</div>
            <h3 style={{ color: t.textMuted, marginBottom: "0.5rem" }}>Select a manuscript to read</h3>
            <p style={{ fontSize: "0.85rem" }}>Create manuscripts in the Writing section, then read them here with custom formatting.</p>
          </div>
        ) : (
          <div style={{ background: rTheme.bg, color: rTheme.text, borderRadius: "12px", padding: "3rem", maxWidth: "720px", margin: "0 auto", minHeight: "60vh", transition: "all 0.3s", boxShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: `1px solid ${rTheme.text}15` }}>
              <h1 style={{ fontFamily: rFont.family, fontSize: `${fontSize + 8}px`, marginBottom: "0.5rem" }}>{current.title || "Untitled"}</h1>
              {current.pov && <div style={{ fontSize: "0.8rem", opacity: 0.5 }}>POV: {current.pov}</div>}
              <div style={{ fontSize: "0.75rem", opacity: 0.4, marginTop: "0.5rem" }}>{wordCount.toLocaleString()} words {"\u00B7"} ~{readTime} min read</div>
            </div>
            {/* Content */}
            <div style={{ fontFamily: rFont.family, fontSize: `${fontSize}px`, lineHeight, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {current.content || "No content yet. Write your manuscript in the Writing section."}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── Publish: Series Dashboard ─────────────────────────────────
  const renderSeriesDashboard = () => {
    const series = projectMeta.series || [];
    const chapters = data.chapters || [];
    const manuscripts = data.manuscripts || [];
    const totalChapters = chapters.length;
    const totalManuscripts = manuscripts.length;
    const totalWords = estimateTotalWords(data, scratchpadText);

    const chaptersByStatus = {};
    chapters.forEach(c => {
      const s = c.status || "Unknown";
      chaptersByStatus[s] = (chaptersByStatus[s] || 0) + 1;
    });

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>{"Publish \u00B7 Series Dashboard"}</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "1rem", fontSize: "1.5rem" }}>Production Overview</h2>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Series", value: series.length, color: t.accent },
            { label: "Chapters", value: totalChapters, color: t.info },
            { label: "Manuscripts", value: totalManuscripts, color: t.success },
            { label: "Total Words", value: totalWords.toLocaleString(), color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1rem", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: s.color, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: t.textDim, marginTop: "0.2rem" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chapter Status Breakdown */}
        {totalChapters > 0 && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem", marginBottom: "0.75rem" }}>Chapter Status</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {Object.entries(chaptersByStatus).map(([status, count]) => (
                <div key={status} style={{ background: t.accentDim, border: `1px solid ${t.accent}20`, borderRadius: "6px", padding: "0.5rem 0.75rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: t.accent }}>{count}</div>
                  <div style={{ fontSize: "0.68rem", color: t.textDim }}>{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Word Count per Chapter */}
        {chapters.filter(c => c.wordCount).length > 0 && (
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontWeight: 700, color: t.textBright, fontSize: "0.95rem", marginBottom: "0.75rem" }}>Words per Chapter</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px" }}>
              {(() => {
                const withWc = chapters.filter(c => c.wordCount).slice(0, 30);
                const max = Math.max(...withWc.map(ch => parseInt(ch.wordCount) || 0), 1);
                return withWc.map((c, i) => {
                  const pct = ((parseInt(c.wordCount) || 0) / max) * 100;
                  return (
                    <div key={c.id || i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }} title={`${c.name || `Ch ${c.number || i + 1}`}: ${c.wordCount} words`}>
                      <div style={{ width: "100%", height: `${pct}%`, minHeight: "2px", background: t.accent, borderRadius: "2px 2px 0 0" }} />
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Audience Analytics placeholder */}
        <div style={{ background: `linear-gradient(135deg, ${t.accent}08, ${t.info}05)`, border: `1px dashed ${t.accent}30`, borderRadius: "10px", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", opacity: 0.4, marginBottom: "0.5rem" }}>{"\u{1F4CA}"}</div>
          <h3 style={{ color: t.textMuted, fontSize: "0.95rem", marginBottom: "0.3rem" }}>Audience Analytics</h3>
          <p style={{ fontSize: "0.82rem", color: t.textDim }}>Coming soon {"\u2014"} connect to audience tracking when you publish on Rebulb.</p>
        </div>
      </div>
    );
  };

  // ─── Publish: Pitch Bible ──────────────────────────────────────
  const renderPitchBible = () => {
    const characters = data.characters || [];
    const locations = data.locations || [];
    const plots = data.plots || [];
    const lore = data.lore || [];
    const bibliography = data.bibliography || [];
    const formatInfo = FORMAT_PRESETS[projectMeta.format] || FORMAT_PRESETS.novel;

    const generateMarkdown = () => {
      let md = `# ${projectMeta.projectName || "Untitled Project"}\n`;
      md += `**Author:** ${projectMeta.author || "Unknown"}\n`;
      md += `**Genre:** ${projectMeta.genre || "Unspecified"}\n`;
      md += `**Format:** ${formatInfo.label}\n\n`;
      if (projectMeta.description) md += `## Logline\n${projectMeta.description}\n\n`;
      if (lore.length) { md += `## World Overview\n`; lore.forEach(l => { md += `### ${l.name}\n${(l.overview || "").slice(0, 300)}\n\n`; }); }
      if (characters.length) { md += `## Characters\n`; characters.forEach(c => { md += `### ${c.name}\n- **Role:** ${c.role || "N/A"}\n- **Archetype:** ${c.archetype || "N/A"}\n- **Arc:** ${(c.arcSummary || "").slice(0, 200)}\n\n`; }); }
      if (locations.length) { md += `## Locations\n`; locations.forEach(l => { md += `### ${l.name}\n- **Type:** ${l.type || "N/A"}\n- **Region:** ${l.region || "N/A"}\n- **Overview:** ${(l.overview || "").slice(0, 200)}\n\n`; }); }
      if (plots.length) { md += `## Plot Arcs\n`; plots.forEach(p => { md += `### ${p.name}\n- **Method:** ${p.method || "N/A"}\n- **Synopsis:** ${(p.synopsis || "").slice(0, 300)}\n\n`; }); }
      if (bibliography.length) { md += `## Comparable Titles\n`; bibliography.forEach(b => { md += `- **${b.name}** (${b.type || "N/A"}) \u2014 ${b.influence || ""}\n`; }); md += "\n"; }
      md += `## Format Specification\n- **Format:** ${formatInfo.label}\n- **Chapter Length:** ${formatInfo.chapterWords}\n- **Structure:** ${formatInfo.volumeChapters}\n- **POV:** ${formatInfo.pov}\n- **Notes:** ${formatInfo.notes}\n`;
      return md;
    };

    const generateHTML = () => {
      const md = generateMarkdown();
      const lines = md.split("\n");
      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${projectMeta.projectName || "Pitch Bible"}</title><style>body{font-family:'Georgia',serif;max-width:720px;margin:2rem auto;padding:0 1.5rem;color:#1a1a1a;line-height:1.7}h1{font-size:2rem;border-bottom:2px solid #8b5cf6;padding-bottom:0.5rem}h2{color:#8b5cf6;margin-top:2rem;border-bottom:1px solid #e5e7eb;padding-bottom:0.3rem}h3{color:#374151;margin-top:1rem}ul{padding-left:1.5rem}li{margin:0.3rem 0}</style></head><body>`;
      lines.forEach(line => {
        if (line.startsWith("# ")) html += `<h1>${line.slice(2)}</h1>`;
        else if (line.startsWith("## ")) html += `<h2>${line.slice(3)}</h2>`;
        else if (line.startsWith("### ")) html += `<h3>${line.slice(4)}</h3>`;
        else if (line.startsWith("- ")) html += `<li>${line.slice(2)}</li>`;
        else if (line.startsWith("**")) html += `<p>${line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</p>`;
        else if (line.trim()) html += `<p>${line}</p>`;
      });
      html += "</body></html>";
      return html;
    };

    const exportHTML = () => {
      const html = generateHTML();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(projectMeta.projectName || "pitch_bible").replace(/\s+/g, "_")}_PitchBible.html`;
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 100);
      toast("Pitch Bible exported as HTML", "success");
    };

    const copyMarkdown = async () => {
      try { await navigator.clipboard.writeText(generateMarkdown()); toast("Copied to clipboard", "success"); }
      catch { toast("Copy failed", "error"); }
    };

    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "0.7rem", color: t.accent, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>{"Publish \u00B7 Pitch Bible"}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, fontSize: "1.5rem" }}>Pitch Bible</h2>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button onClick={exportHTML} style={pillBtn(t.accent)}>Export HTML</button>
            <button onClick={copyMarkdown} style={pillBtn(t.info)}>Copy Markdown</button>
          </div>
        </div>

        {/* Live Preview */}
        <div style={{ background: "#fefefe", color: "#1a1a1a", borderRadius: "12px", padding: "2.5rem", maxWidth: "720px", boxShadow: "0 4px 30px rgba(0,0,0,0.15)", fontFamily: "Georgia, serif", lineHeight: 1.7 }}>
          <h1 style={{ fontSize: "2rem", borderBottom: "2px solid #8b5cf6", paddingBottom: "0.5rem", marginBottom: "1rem" }}>{projectMeta.projectName || "Untitled Project"}</h1>
          <p><strong>Author:</strong> {projectMeta.author || "Unknown"} &nbsp;|&nbsp; <strong>Genre:</strong> {projectMeta.genre || "Unspecified"} &nbsp;|&nbsp; <strong>Format:</strong> {formatInfo.label}</p>
          {projectMeta.description && <><h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Logline</h2><p>{projectMeta.description}</p></>}

          {lore.length > 0 && <>
            <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>World Overview</h2>
            {lore.slice(0, 5).map(l => <div key={l.id}><h3>{l.name}</h3><p>{(l.overview || "").slice(0, 300)}</p></div>)}
          </>}

          {characters.length > 0 && <>
            <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Characters ({characters.length})</h2>
            {characters.slice(0, 8).map(c => <div key={c.id} style={{ marginBottom: "0.75rem" }}><h3>{c.name}</h3><p><strong>Role:</strong> {c.role || "N/A"} &middot; <strong>Archetype:</strong> {c.archetype || "N/A"}</p>{c.arcSummary && <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>{c.arcSummary.slice(0, 200)}</p>}</div>)}
          </>}

          {locations.length > 0 && <>
            <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Locations ({locations.length})</h2>
            {locations.slice(0, 6).map(l => <div key={l.id}><h3>{l.name}</h3><p>{l.type || ""} {l.region ? `in ${l.region}` : ""} {"\u2014"} {(l.overview || "").slice(0, 200)}</p></div>)}
          </>}

          {plots.length > 0 && <>
            <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Plot Arcs ({plots.length})</h2>
            {plots.slice(0, 5).map(p => <div key={p.id}><h3>{p.name}</h3><p>{(p.synopsis || "").slice(0, 300)}</p></div>)}
          </>}

          {bibliography.length > 0 && <>
            <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Comparable Titles</h2>
            <ul>{bibliography.slice(0, 6).map(b => <li key={b.id}><strong>{b.name}</strong> ({b.type || "N/A"}) {"\u2014"} {b.influence || ""}</li>)}</ul>
          </>}

          <h2 style={{ color: "#8b5cf6", borderBottom: "1px solid #e5e7eb", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Format Specification</h2>
          <p><strong>Format:</strong> {formatInfo.label} &middot; <strong>Chapter Length:</strong> {formatInfo.chapterWords} &middot; <strong>Structure:</strong> {formatInfo.volumeChapters}</p>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>{formatInfo.notes}</p>
        </div>
      </div>
    );
  };

  // ─── Content Router ──────────────────────────────────────────────
  const renderContent = () => {
    if (editing) return renderForm(editing.collection, editing.item);
    if (viewing) return renderDetail(viewing.collection, viewing.item);
    if (section === "dashboard") return renderDashboard();
    if (COLLECTION_DEFS[section]) return renderList(section);
    if (section === "worldBible") return <WorldBible data={data} projectMeta={projectMeta} onNavigate={s => { setSection(s); setEditing(null); setViewing(null); setFilterText(""); }} theme={t} />;
    if (section === "storyCanvas") return <StoryCanvas data={data} projectMeta={projectMeta} onView={(col, item) => setViewing({ collection: col, item })} onUpdateMeta={doUpdateMeta} theme={t} />;
    if (section === "canonGraph") return <CanonGraph data={data} onView={(col, item) => setViewing({ collection: col, item })} theme={t} />;
    if (section === "stats") return <ProjectStats data={data} theme={t} />;
    if (section === "atlasMap") return <AtlasMap data={data} onView={(col, item) => setViewing({ collection: col, item })} theme={t} />;
    if (section === "scratchpad") return <Scratchpad text={scratchpadText} onChange={onScratchChange} onSave={saveScratchNow} theme={t} />;
    if (section === "seriesListing") return renderSeriesListing();
    if (section === "readerMode") return renderReaderMode();
    if (section === "seriesDashboard") return renderSeriesDashboard();
    if (section === "pitchBible") return renderPitchBible();
    return <div style={{ padding: "2rem", color: t.textDim, textAlign: "center" }}>Select a section from the sidebar</div>;
  };

  // ─── Onboarding ──────────────────────────────────────────────────
  const renderOnboarding = () => {
    if (!showOnboarding) return null;
    const steps = [
      { title: "Welcome to Rebulb Studio", body: "Your creative worldbuilding workspace. Track characters, locations, magic systems, plot outlines, and more \u2014 all in one place." },
      { title: "Name Your Project", body: "Give your project a name to get started.", hasInput: true },
      { title: "You're All Set!", body: "Start creating entries, explore the workspace views, or press Ctrl+K for the command palette." },
    ];
    const step = steps[Math.min(onboardingStep, steps.length - 1)];
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "2rem", maxWidth: "440px", width: "90%" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: t.textBright, marginBottom: "0.75rem" }}>{step.title}</h2>
          <p style={{ color: t.textMuted, lineHeight: 1.6, marginBottom: "1rem" }}>{step.body}</p>
          {step.hasInput && (
            <input placeholder="My Epic Story" value={projectMeta.projectName} onChange={e => doUpdateMeta({ projectName: e.target.value })}
              style={{ ...inputStyle, marginBottom: "1rem" }} autoFocus />
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {onboardingStep > 0 && <button onClick={() => setOnboardingStep(s => s - 1)} style={pillBtn(t.textDim)}>Back</button>}
            <div style={{ flex: 1 }} />
            {onboardingStep < steps.length - 1
              ? <button onClick={() => setOnboardingStep(s => s + 1)} style={pillBtn(t.accent)}>Next</button>
              : <button onClick={() => { setShowOnboarding(false); localStorage.setItem("sa_onboarding_done", "1"); }} style={pillBtn(t.accent)}>Get Started</button>
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing:border-box; margin:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:${t.accent}; border-radius:3px; }
        ::selection { background:${t.accent}30; }
        details > summary { list-style:none; } details > summary::-webkit-details-marker { display:none; }
        textarea:focus, input:focus, select:focus { outline:none; border-color:${t.accent}80 !important; box-shadow: 0 0 0 3px ${t.accent}20; }
        select { -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.6rem center; padding-right: 2rem; }
        @media (max-width: 768px) {
          .studio-sidebar { position: fixed !important; left: 0; top: 0; z-index: 100; height: 100vh; box-shadow: 4px 0 20px rgba(0,0,0,0.5); }
          .studio-sidebar.closed { transform: translateX(-100%); width: 0 !important; }
          .studio-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
          .studio-main { width: 100% !important; }
        }
        @media (max-width: 480px) {
          .studio-main { padding: 0.75rem !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="studio-overlay" onClick={() => setSidebarOpen(false)} style={{ display: "none" }} />}

      {/* Sidebar */}
      <div className={`studio-sidebar ${sidebarOpen ? "" : "closed"}`} style={{
        width: sidebarOpen ? "240px" : "50px", minHeight: "100vh",
        background: t.surface, borderRight: `1px solid ${t.border}`,
        transition: "width 0.25s ease, transform 0.25s ease", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "transparent", border: "none", color: t.textDim, padding: "1rem", cursor: "pointer", fontSize: "1.1rem", fontFamily: "inherit" }}>
            {sidebarOpen ? "\u25C1" : "\u25B7"}
          </button>
          {sidebarOpen && (
            <button onClick={() => setDarkMode(!darkMode)}
              style={{ background: "transparent", border: "none", color: t.textDim, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem" }}
              title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? "\u2600\uFE0F" : "\u{1F319}"}
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div style={{ padding: "0 0.5rem", flex: 1, overflowY: "auto" }}>
            <input placeholder="Search... (Ctrl+K)" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={e => { if (e.target.value === "") setCmdOpen(true); }}
              style={{ ...inputStyle, fontSize: "0.78rem", marginBottom: "0.75rem", padding: "0.5rem 0.6rem" }} />
            {searchQuery && searchResults.length > 0 && (
              <div style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto" }}>
                {searchResults.map(item => {
                  const cfg = COLLECTION_DEFS[item._collection];
                  return (
                    <button key={item.id} onClick={() => { setViewing({ collection: item._collection, item }); setSearchQuery(""); }}
                      style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: "0.4rem 0.5rem", cursor: "pointer", textAlign: "left", color: t.textMuted, fontSize: "0.78rem", fontFamily: "inherit", borderRadius: "4px" }}>
                      <span style={{ color: cfg?.color }}>{cfg?.icon}</span> {item.name || item.title || "Untitled"}
                    </button>
                  );
                })}
              </div>
            )}

            <NavItem label="Dashboard" icon="\u2302" active={section === "dashboard" && !editing && !viewing} onClick={() => { setSection("dashboard"); setEditing(null); setViewing(null); setFilterText(""); }} theme={t} />

            {NAV_GROUPS.filter(g => g !== "WORKSPACE").map(group => {
              const items = Object.entries(COLLECTION_DEFS).filter(([, v]) => v.group === group);
              if (!items.length) return null;
              return (
                <div key={group} style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>{group}</div>
                  {items.map(([key, cfg]) => (
                    <NavItem key={key} label={cfg.label} icon={cfg.icon} color={cfg.color}
                      count={(data[key] || []).length}
                      active={section === key && !editing && !viewing}
                      onClick={() => { setSection(key); setEditing(null); setViewing(null); setFilterText(""); }}
                      theme={t} />
                  ))}
                </div>
              );
            })}

            {/* Publish */}
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>PUBLISH</div>
              {Object.entries(PUBLISH_SECTIONS).map(([key, ps]) => (
                <NavItem key={key} label={ps.label} icon={ps.icon} color={ps.color}
                  active={section === key && !editing && !viewing}
                  onClick={() => { setSection(key); setEditing(null); setViewing(null); }}
                  theme={t} />
              ))}
            </div>

            {/* Workspace */}
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>WORKSPACE</div>
              {Object.entries(WORKSPACE_SECTIONS).map(([key, ws]) => (
                <NavItem key={key} label={ws.label} icon={ws.icon} color={ws.color}
                  active={section === key && !editing && !viewing}
                  onClick={() => { setSection(key); setEditing(null); setViewing(null); }}
                  theme={t} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 32px)" }}>
          {renderContent()}
        </div>

        {/* Status Bar */}
        <div style={{
          height: "32px", background: t.surface, borderTop: `1px solid ${t.border}`,
          display: "flex", alignItems: "center", padding: "0 1rem", gap: "1.5rem",
          fontSize: "0.68rem", color: t.textDim, flexShrink: 0,
        }}>
          <span>{projectMeta.projectName || "Untitled Project"}</span>
          <span>{totalEntries} entries</span>
          <span>{estimateTotalWords(data, scratchpadText).toLocaleString()} words</span>
          <span style={{ marginLeft: "auto", color: saveStatus === "error" ? t.danger : saveStatus === "saving" ? t.accent : saveStatus === "saved" ? t.success : t.textDim }}>
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Ready"}
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => setCmdOpen(true)} title="Ctrl+K">{"\u2318"}K</span>
        </div>
      </div>

      {/* Overlays */}
      {cmdOpen && <CommandPalette commands={cmdCommands} onClose={() => setCmdOpen(false)} theme={t} />}
      {renderOnboarding()}

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: "48px", right: "16px", display: "grid", gap: "0.4rem", zIndex: 9998 }}>
          {toasts.map(toast => (
            <div key={toast.id} style={{
              background: toast.type === "error" ? `${t.danger}20` : toast.type === "success" ? `${t.success}20` : t.surface,
              border: `1px solid ${toast.type === "error" ? t.danger : toast.type === "success" ? t.success : t.border}40`,
              color: toast.type === "error" ? t.danger : toast.type === "success" ? t.success : t.text,
              padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", maxWidth: "320px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────
function NavItem({ label, icon, color, count, active, onClick, theme: t }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "0.5rem", width: "100%",
      padding: "0.45rem 0.5rem", borderRadius: "6px", cursor: "pointer",
      background: active ? t.accentDim : "transparent",
      border: active ? `1px solid ${t.accent}25` : "1px solid transparent",
      color: active ? t.text : t.textMuted,
      fontSize: "0.82rem", fontFamily: "inherit", textAlign: "left",
      transition: "all 0.15s", marginBottom: "2px",
    }}>
      <span style={{ color: color || t.accent, flexShrink: 0, width: "16px", textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {count > 0 && <span style={{ fontSize: "0.65rem", color: t.textDim, background: t.surface, padding: "1px 5px", borderRadius: "3px" }}>{count}</span>}
    </button>
  );
}

function FormFields({ fields, initial, onSubmit, accent, theme: t, inputStyle }) {
  const [values, setValues] = useState(initial || {});
  const set = (k, v) => setValues(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      {fields.map(f => (
        <div key={f.k} style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", color: accent || t.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{f.l}</label>
          {FIELD_HELP[f.k] && (
            <div style={{ fontSize: "0.68rem", color: t.textDim, marginBottom: "0.3rem", lineHeight: 1.4, fontStyle: "italic" }}>{FIELD_HELP[f.k]}</div>
          )}
          {f.t === "select" ? (
            <select value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} style={inputStyle}>
              <option value="">{"\u2014 Select \u2014"}</option>
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.t === "textarea" ? (
            <textarea value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} rows={4} style={{ ...inputStyle, minHeight: "80px", resize: "vertical", lineHeight: 1.6 }} />
          ) : f.t === "tags" ? (
            <input value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} placeholder="Comma-separated" style={inputStyle} />
          ) : (
            <input value={values[f.k] || ""} onChange={e => set(f.k, e.target.value)} style={inputStyle} />
          )}
        </div>
      ))}
      <button onClick={() => onSubmit(values)} style={{
        background: (accent || t.accent) + "18", border: `1px solid ${accent || t.accent}40`, color: accent || t.accent,
        padding: "0.6rem 1.5rem", borderRadius: "20px", cursor: "pointer",
        fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", marginTop: "0.5rem",
      }}>
        {initial?.id ? "Save Changes" : "Create Entry"}
      </button>
    </div>
  );
}

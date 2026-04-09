import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import { useDataStore } from "./stores/useDataStore";
import { useUIStore } from "./stores/useUIStore";
import { useProjectStore } from "./stores/useProjectStore";
import * as api from "./api";
import {
  COLLECTION_DEFS, FORMAT_PRESETS, OUTLINE_METHODS, NAV_GROUPS,
  WORKSPACE_SECTIONS, WRITING_PROMPTS, STARTER_KITS, DARK_THEME, LIGHT_THEME,
  PUBLISH_SECTIONS, SERIES_FORMATS, SERIES_STATUSES, READER_THEMES, READER_FONTS,
  FIELD_HELP, Z_INDEX,
} from "./constants";
import type { Entry, Theme } from "./types";

import Sidebar from "./layouts/Sidebar";
import StatusBar from "./components/StatusBar";
import CommandPalette from "./components/CommandPalette";
import Onboarding from "./components/Onboarding";
import ToastStack from "./components/ToastStack";
import PageTransition from "./components/PageTransition";
import Breadcrumb from "./components/Breadcrumb";
import LoadingSpinner from "./components/LoadingSpinner";
import Dashboard from "./components/Dashboard";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { useScrollToTop } from "./hooks/useScrollToTop";
import CollectionList from "./components/CollectionList";
import EntryDetail from "./components/EntryDetail";
import EntryForm from "./components/EntryForm";
import { WorldBible, StoryCanvas, CanonGraph, ProjectStats, AtlasMap, Scratchpad } from "./workspace/WorkspaceViews";
import ForceGraph from "./workspace/ForceGraph";
import TimelineView from "./workspace/TimelineView";
import SearchPage from "./components/SearchPage";
import WritingTools from "./components/WritingTools";
import ExportPanel from "./components/ExportPanel";
import SharePanel from "./components/SharePanel";
import ProgressDashboard from "./components/ProgressDashboard";
import CalendarView from "./components/CalendarView";
import ProUpgrade from "./components/ProUpgrade";
import ProGate from "./components/ProGate";
import HomePage from "./pages/HomePage";
import SeriesListing from "./pages/SeriesListing";
import ReaderMode from "./pages/ReaderMode";
import SeriesDashboard from "./pages/SeriesDashboard";
import PitchBible from "./pages/PitchBible";

// ─── Collection Page Wrapper ─────────────────────────────────────────
function CollectionPage() {
  const { collection } = useParams<{ collection: string }>();
  const navigate = useNavigate();
  const data = useDataStore((s) => s.data);
  const theme = useUIStore((s) => s.darkMode ? DARK_THEME : LIGHT_THEME);
  const filterText = useUIStore((s) => s.filterText);

  if (!collection || !COLLECTION_DEFS[collection]) {
    return <div className="p-8 text-text-dim text-center">Unknown collection</div>;
  }

  return (
    <CollectionList
      collection={collection}
      items={data[collection] || []}
      filterText={filterText}
      onFilterChange={(v) => useUIStore.getState().setFilterText(v)}
      onView={(item) => navigate(`/${collection}/${item.id}`)}
      onCreate={() => navigate(`/${collection}/new`)}
      theme={theme}
    />
  );
}

function EntryDetailPage() {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const navigate = useNavigate();
  const data = useDataStore((s) => s.data);
  const deleteEntry = useDataStore((s) => s.deleteEntry);
  const withSave = useUIStore((s) => s.withSave);
  const toast = useUIStore((s) => s.toast);
  const theme = useUIStore((s) => s.darkMode ? DARK_THEME : LIGHT_THEME);

  if (!collection || !id) return null;
  const items = data[collection] || [];
  const item = items.find((e) => e.id === id);
  if (!item) return <div className="p-8 text-text-dim text-center">Entry not found</div>;

  const allEntries = Object.entries(data).flatMap(([col, items]) =>
    (Array.isArray(items) ? items : []).map((it) => ({ ...it, _collection: col }))
  );

  return (
    <EntryDetail
      collection={collection}
      item={item}
      allEntries={allEntries}
      onEdit={() => navigate(`/${collection}/${id}/edit`)}
      onDelete={async () => {
        if (!confirm("Delete this entry?")) return;
        await withSave(() => deleteEntry(collection, id).then(() => undefined));
        toast("Entry deleted", "info");
        navigate(`/${collection}`);
      }}
      onBack={() => navigate(`/${collection}`)}
      onViewEntry={(col, entry) => navigate(`/${col}/${entry.id}`)}
      theme={theme}
    />
  );
}

function EntryFormPage() {
  const { collection, id } = useParams<{ collection: string; id?: string }>();
  const navigate = useNavigate();
  const data = useDataStore((s) => s.data);
  const addEntry = useDataStore((s) => s.addEntry);
  const updateEntry = useDataStore((s) => s.updateEntry);
  const withSave = useUIStore((s) => s.withSave);
  const toast = useUIStore((s) => s.toast);
  const theme = useUIStore((s) => s.darkMode ? DARK_THEME : LIGHT_THEME);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    api.getAllTags().then(setAllTags).catch(() => {});
  }, []);

  if (!collection) return null;
  const existing = id ? (data[collection] || []).find((e) => e.id === id) : undefined;

  return (
    <EntryForm
      collection={collection}
      existing={existing}
      allTags={allTags}
      onSubmit={async (values) => {
        if (existing) {
          await withSave(() => updateEntry(collection, existing.id, values).then(() => undefined));
        } else {
          const created = await withSave(() => addEntry(collection, values));
          if (created) toast(`Created ${COLLECTION_DEFS[collection]?.label?.replace(/s$/, "") || "entry"}`, "success");
        }
        navigate(`/${collection}`);
      }}
      onCancel={() => navigate(existing ? `/${collection}/${id}` : `/${collection}`)}
      theme={theme}
    />
  );
}

// ─── Workspace Wrapper ───────────────────────────────────────────────
function WorkspacePage() {
  const { view } = useParams<{ view: string }>();
  const navigate = useNavigate();
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);
  const updateMeta = useProjectStore((s) => s.updateMeta);
  const theme = useUIStore((s) => s.darkMode ? DARK_THEME : LIGHT_THEME);

  const scratchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const scratchAbort = useRef<AbortController>(null);

  const onScratchChange = useCallback((text: string) => {
    useProjectStore.getState().setScratchpadText(text);
    localStorage.setItem("sa_scratchpad_local", text);
    if (scratchTimer.current) clearTimeout(scratchTimer.current);
    if (scratchAbort.current) scratchAbort.current.abort();
    scratchTimer.current = setTimeout(() => {
      const controller = new AbortController();
      scratchAbort.current = controller;
      api.updateMeta({ scratchpad: text }, { signal: controller.signal }).catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Scratchpad autosave failed:", err);
      });
    }, 700);
  }, []);

  const viewNav = (col: string, item: Entry) => navigate(`/${col}/${item.id}`);

  try {
    switch (view) {
      case "worldBible":
        return <WorldBible data={data} projectMeta={meta} onNavigate={(s) => navigate(`/${s}`)} theme={theme} />;
      case "storyCanvas":
        return <StoryCanvas data={data} projectMeta={meta} onView={viewNav} onUpdateMeta={updateMeta} theme={theme} />;
      case "canonGraph":
        return <CanonGraph data={data} onView={viewNav} theme={theme} />;
      case "forceGraph":
        return <ForceGraph data={data} onView={viewNav} theme={theme} />;
      case "timeline":
        return <TimelineView data={data} onView={viewNav} theme={theme} />;
      case "stats":
        return <ProjectStats data={data} theme={theme} />;
      case "atlasMap":
        return <AtlasMap data={data} onView={viewNav} theme={theme} />;
      case "scratchpad":
        return <Scratchpad text={scratchpadText} onChange={onScratchChange} onSave={() => {
          if (scratchTimer.current) clearTimeout(scratchTimer.current);
          useUIStore.getState().withSave(() => api.updateMeta({ scratchpad: scratchpadText }));
        }} theme={theme} />;
      default:
        return (
          <div style={{ padding: "2rem", textAlign: "center", color: theme.textDim }}>
            <p>Unknown workspace view: {view}</p>
            <button onClick={() => navigate("/")} style={{ marginTop: "1rem", color: theme.accent, background: "none", border: `1px solid ${theme.accent}40`, padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
              Back to Dashboard
            </button>
          </div>
        );
    }
  } catch (err) {
    console.error("Workspace render error:", err);
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: theme.danger }}>
        <p>Failed to load workspace view: {view}</p>
        <p style={{ fontSize: "0.8rem", color: theme.textDim }}>{err instanceof Error ? err.message : "Unknown error"}</p>
        <button onClick={() => navigate("/")} style={{ marginTop: "1rem", color: theme.accent, background: "none", border: `1px solid ${theme.accent}40`, padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }
}

function PublishPage() {
  const { view } = useParams<{ view: string }>();
  const data = useDataStore((s) => s.data);
  const meta = useProjectStore((s) => s.meta);
  const scratchpadText = useProjectStore((s) => s.scratchpadText);
  const updateMeta = useProjectStore((s) => s.updateMeta);
  const theme = useUIStore((s) => s.darkMode ? DARK_THEME : LIGHT_THEME);
  const toast = useUIStore((s) => s.toast);

  switch (view) {
    case "seriesListing":
      return <SeriesListing meta={meta} updateMeta={updateMeta} toast={toast} theme={theme} />;
    case "readerMode":
      return <ReaderMode data={data} theme={theme} />;
    case "seriesDashboard":
      return <SeriesDashboard data={data} meta={meta} scratchpadText={scratchpadText} theme={theme} />;
    case "pitchBible":
      return <PitchBible data={data} meta={meta} toast={toast} theme={theme} />;
    default:
      return <div className="p-8 text-text-dim text-center">Unknown publish view</div>;
  }
}

// ─── Main App ────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const { data, loaded, loadAll, setData } = useDataStore();
  const { darkMode, cmdOpen, setCmdOpen, toast, showOnboarding } = useUIStore();
  const { meta, setMeta, setScratchpadText } = useProjectStore();
  const theme: Theme = darkMode ? DARK_THEME : LIGHT_THEME;

  // ─── Load data on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const payload = await api.loadAll();
        const { meta: loadedMeta, ...collections } = payload;
        setData(collections as Record<string, Entry[]>);
        useDataStore.setState({ loaded: true });
        if (loadedMeta) {
          setMeta(loadedMeta as Record<string, unknown>);
          if ((loadedMeta as Record<string, unknown>).scratchpad) {
            setScratchpadText((loadedMeta as Record<string, unknown>).scratchpad as string);
          }
        }
        const totalEntries = Object.values(collections).reduce(
          (s: number, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0
        );
        if (!(loadedMeta as Record<string, unknown>)?.projectName && !localStorage.getItem("sa_onboarding_done") && totalEntries === 0) {
          useUIStore.setState({ showOnboarding: true });
        }
      } catch (err) {
        console.error("StoryAtlas: failed to load data", err);
        toast("Could not connect to backend. Running in offline mode.", "error");
        useDataStore.setState({ loaded: true });
      }
    })();
  }, []);

  // ─── Keyboard shortcut: Ctrl+K ─────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(!cmdOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cmdOpen, setCmdOpen]);

  // ─── Command palette commands ────────────────────────────────
  const cmdCommands = useMemo(() => [
    ...Object.entries(COLLECTION_DEFS).map(([key, cfg]) => ({
      id: `nav:${key}`, label: cfg.label, icon: cfg.icon, group: cfg.group || "",
      action: () => navigate(`/${key}`),
    })),
    ...Object.entries(WORKSPACE_SECTIONS).map(([key, ws]) => ({
      id: `ws:${key}`, label: ws.label, icon: ws.icon, group: "WORKSPACE",
      action: () => navigate(`/workspace/${key}`),
    })),
    { id: "nav:dashboard", label: "Dashboard", icon: "\u{1F3E0}", group: "NAV", action: () => navigate("/") },
    { id: "nav:search", label: "Advanced Search", icon: "\u{1F50D}", group: "NAV", action: () => navigate("/search") },
    { id: "nav:writing", label: "Writing Tools", icon: "\u270E", group: "NAV", action: () => navigate("/writing-tools") },
    { id: "nav:export", label: "Export Panel", icon: "\u{1F4E6}", group: "NAV", action: () => navigate("/export") },
    { id: "nav:share", label: "Share Project", icon: "\u{1F517}", group: "NAV", action: () => navigate("/share") },
    { id: "nav:progress", label: "Progress Dashboard", icon: "\u{1F4CA}", group: "NAV", action: () => navigate("/progress") },
    { id: "nav:calendar", label: "Calendar View", icon: "\u{1F4C5}", group: "NAV", action: () => navigate("/calendar") },
    ...Object.entries(COLLECTION_DEFS).map(([key, cfg]) => ({
      id: `create:${key}`, label: `New ${cfg.label.replace(/s$/, "")}`, icon: "+", group: "CREATE",
      action: () => navigate(`/${key}/new`),
    })),
    { id: "export:json", label: "Export JSON Backup", icon: "\u{2B07}\uFE0F", group: "EXPORT", action: () => { api.exportJSON(); toast("JSON export started", "info"); } },
    { id: "export:zip", label: "Export ZIP Package", icon: "\u{2B07}\uFE0F", group: "EXPORT", action: () => { api.exportZIP(); toast("ZIP export started", "info"); } },
    { id: "toggle:dark", label: darkMode ? "Switch to Light Mode" : "Switch to Dark Mode", icon: darkMode ? "\u{2600}\uFE0F" : "\u{1F319}", group: "SETTINGS", action: () => useUIStore.getState().toggleDarkMode() },
  ], [darkMode, navigate, toast]);

  const contentRef = useRef<HTMLDivElement>(null);
  useDocumentTitle();
  useScrollToTop(contentRef);

  if (!loaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`flex min-h-screen font-sans ${darkMode ? "" : "light"}`} style={{ background: theme.bg, color: theme.text }}>
      <Sidebar navigate={navigate} theme={theme} />

      <div className="flex-1 min-w-0 flex flex-col">
        <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 32px)" }}>
          <Breadcrumb theme={theme} />
          <PageTransition>
          <Routes>
            <Route path="/" element={<HomePage navigate={navigate} theme={theme} />} />
            <Route path="/dashboard" element={<Dashboard navigate={navigate} theme={theme} />} />
            <Route path="/search" element={<SearchPage navigate={navigate} theme={theme} />} />
            <Route path="/writing-tools" element={<WritingTools theme={theme} />} />
            <Route path="/export" element={<ExportPanel theme={theme} toast={toast} />} />
            <Route path="/share" element={<ProGate feature="shareLinks" theme={theme}><SharePanel theme={theme} toast={toast} /></ProGate>} />
            <Route path="/upgrade" element={<ProUpgrade theme={theme} />} />
            <Route path="/progress" element={<ProgressDashboard navigate={navigate} theme={theme} />} />
            <Route path="/calendar" element={<CalendarView navigate={navigate} theme={theme} />} />
            <Route path="/workspace/:view" element={<WorkspacePage />} />
            <Route path="/publish/:view" element={<PublishPage />} />
            <Route path="/:collection" element={<CollectionPage />} />
            <Route path="/:collection/new" element={<EntryFormPage />} />
            <Route path="/:collection/:id" element={<EntryDetailPage />} />
            <Route path="/:collection/:id/edit" element={<EntryFormPage />} />
          </Routes>
          </PageTransition>
        </div>
        <StatusBar theme={theme} />
      </div>

      {cmdOpen && <CommandPalette commands={cmdCommands} onClose={() => setCmdOpen(false)} theme={theme} />}
      <Onboarding theme={theme} />
      <ToastStack theme={theme} />
    </div>
  );
}

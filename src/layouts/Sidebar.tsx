import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useDataStore } from "../stores/useDataStore";
import { useUIStore } from "../stores/useUIStore";
import { useProjectStore } from "../stores/useProjectStore";
import { COLLECTION_DEFS, NAV_GROUPS, WORKSPACE_SECTIONS, PUBLISH_SECTIONS, Z_INDEX } from "../constants";
import { useProStore } from "../stores/useProStore";
import SupportBanner from "../components/SupportBanner";
import type { Theme, Entry } from "../types";

function NavItem({ label, icon, color, count, active, onClick, theme: t }: {
  label: string; icon: string; color?: string; count?: number; active: boolean;
  onClick: () => void; theme: Theme;
}) {
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
      {count !== undefined && count > 0 && <span style={{ fontSize: "0.65rem", color: t.textDim, background: t.surface, padding: "1px 5px", borderRadius: "3px" }}>{count}</span>}
    </button>
  );
}

export default function Sidebar({ navigate, theme: t }: { navigate: (path: string) => void; theme: Theme }) {
  const { sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery, setCmdOpen } = useUIStore();
  const { darkMode, toggleDarkMode, setFilterText } = useUIStore();
  const data = useDataStore((s) => s.data);
  const location = useLocation();
  const currentPath = location.pathname;

  const allEntries = useMemo(() =>
    Object.entries(data).flatMap(([col, items]) =>
      (Array.isArray(items) ? items : []).map((item) => ({ ...item, _collection: col }))
    ), [data]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allEntries.filter((e) =>
      ((e.name as string) || (e.title as string) || "").toLowerCase().includes(q) ||
      Object.values(e).some((v) => typeof v === "string" && v.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [allEntries, searchQuery]);

  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.5rem 0.6rem", color: t.text, fontSize: "0.78rem",
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div className={`studio-sidebar ${sidebarOpen ? "" : "closed"}`} style={{
      width: sidebarOpen ? "240px" : "50px", minHeight: "100vh",
      background: t.surface, borderRight: `1px solid ${t.border}`,
      transition: "width 0.25s ease, transform 0.25s ease", flexShrink: 0,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "transparent", border: "none", color: t.textDim, padding: "1rem", cursor: "pointer", fontSize: "1.1rem", fontFamily: "inherit" }}>
          {sidebarOpen ? "<" : ">"}
        </button>
        {sidebarOpen && (
          <button onClick={toggleDarkMode}
            style={{ background: "transparent", border: "none", color: t.textDim, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem" }}
            title={darkMode ? "Light mode" : "Dark mode"}>
            {darkMode ? "\u{2600}\uFE0F" : "\u{1F319}"}
          </button>
        )}
      </div>

      {sidebarOpen && (
        <div className="animate-fade-in" style={{ padding: "0 0.5rem", flex: 1, overflowY: "auto" }}>
          <input placeholder="Search... (Ctrl+K)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => { if (e.target.value === "") setCmdOpen(true); }}
            onKeyDown={(e) => { if (e.key === "Escape") { setSearchQuery(""); (e.target as HTMLInputElement).blur(); } }}
            style={{ ...inputStyle, marginBottom: "0.75rem" }} />

          {searchQuery && searchResults.length > 0 && (
            <div style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto" }}>
              {searchResults.map((item) => {
                const cfg = COLLECTION_DEFS[item._collection as string];
                return (
                  <button key={item.id} onClick={() => { navigate(`/${item._collection}/${item.id}`); setSearchQuery(""); }}
                    style={{ display: "block", width: "100%", background: "transparent", border: "none", padding: "0.4rem 0.5rem", cursor: "pointer", textAlign: "left", color: t.textMuted, fontSize: "0.78rem", fontFamily: "inherit", borderRadius: "4px" }}>
                    <span style={{ color: cfg?.color }}>{cfg?.icon}</span> {(item.name as string) || (item.title as string) || "Untitled"}
                  </button>
                );
              })}
            </div>
          )}

          <NavItem label="Dashboard" icon={"\u{1F3E0}"} active={currentPath === "/"} onClick={() => { navigate("/"); setFilterText(""); }} theme={t} />

          {NAV_GROUPS.filter((g: string) => g !== "WORKSPACE").map((group: string) => {
            const items = Object.entries(COLLECTION_DEFS).filter(([, v]) => v.group === group);
            if (!items.length) return null;
            return (
              <div key={group} style={{ marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>{group}</div>
                {items.map(([key, cfg]) => (
                  <NavItem key={key} label={cfg.label} icon={cfg.icon} color={cfg.color}
                    count={(data[key] || []).length}
                    active={currentPath === `/${key}` || currentPath.startsWith(`/${key}/`)}
                    onClick={() => { navigate(`/${key}`); setFilterText(""); }}
                    theme={t} />
                ))}
              </div>
            );
          })}

          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>PUBLISH</div>
            {Object.entries(PUBLISH_SECTIONS).map(([key, ps]) => (
              <NavItem key={key} label={ps.label} icon={ps.icon} color={ps.color}
                active={currentPath === `/publish/${key}`}
                onClick={() => navigate(`/publish/${key}`)}
                theme={t} />
            ))}
          </div>

          <div style={{ marginTop: "0.75rem" }}>
            <div style={{ fontSize: "0.6rem", color: t.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, padding: "0.3rem 0.5rem" }}>WORKSPACE</div>
            {Object.entries(WORKSPACE_SECTIONS).map(([key, ws]) => (
              <NavItem key={key} label={ws.label} icon={ws.icon} color={ws.color}
                active={currentPath === `/workspace/${key}`}
                onClick={() => navigate(`/workspace/${key}`)}
                theme={t} />
            ))}
          </div>

          {/* Pro Upgrade */}
          {!useProStore.getState().isPro && (
            <div style={{ marginTop: "0.75rem" }}>
              <NavItem label="Upgrade to Pro" icon={"\u{2B50}"} color="#f59e0b"
                active={currentPath === "/upgrade"}
                onClick={() => navigate("/upgrade")}
                theme={t} />
            </div>
          )}

          {/* Support Banner */}
          <SupportBanner theme={t} />
        </div>
      )}
    </div>
  );
}

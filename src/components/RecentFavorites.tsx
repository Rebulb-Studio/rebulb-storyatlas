import { useState, useEffect, useCallback } from "react";
import type { Theme } from "../types";
import { COLLECTION_DEFS } from "../constants";

// ─── Types ──────────────────────────────────────────────────────────

interface RecentViewItem {
  collection: string;
  id: string;
  name: string;
  icon: string;
  color: string;
  viewedAt: string;
}

interface FavoriteItem {
  collection: string;
  id: string;
  name: string;
  icon: string;
  color: string;
}

// ─── LocalStorage Keys ──────────────────────────────────────────────

const RECENT_KEY = "sa_recent_viewed";
const FAVORITES_KEY = "sa_favorites";
const MAX_RECENT = 20;

// ─── Exported Helpers ───────────────────────────────────────────────

function loadRecent(): RecentViewItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecentViewItem[];
  } catch {
    return [];
  }
}

function saveRecent(items: RecentViewItem[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(items));
}

function loadFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FavoriteItem[];
  } catch {
    return [];
  }
}

function saveFavorites(items: FavoriteItem[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

export function addRecentView(collection: string, id: string, name: string): void {
  const cfg = COLLECTION_DEFS[collection];
  const icon = cfg?.icon || "";
  const color = cfg?.color || "#888";
  const item: RecentViewItem = {
    collection,
    id,
    name,
    icon,
    color,
    viewedAt: new Date().toISOString(),
  };

  let recent = loadRecent();
  // Remove existing entry for this collection+id to avoid duplicates
  recent = recent.filter((r) => !(r.collection === collection && r.id === id));
  // Prepend new item and cap at MAX_RECENT
  recent = [item, ...recent].slice(0, MAX_RECENT);
  saveRecent(recent);
}

export function toggleFavorite(collection: string, id: string, name: string): boolean {
  const cfg = COLLECTION_DEFS[collection];
  const icon = cfg?.icon || "";
  const color = cfg?.color || "#888";

  let favorites = loadFavorites();
  const existingIndex = favorites.findIndex(
    (f) => f.collection === collection && f.id === id
  );

  if (existingIndex >= 0) {
    // Remove from favorites
    favorites.splice(existingIndex, 1);
    saveFavorites(favorites);
    return false; // now un-favorited
  } else {
    // Add to favorites
    favorites = [{ collection, id, name, icon, color }, ...favorites];
    saveFavorites(favorites);
    return true; // now favorited
  }
}

export function isFavorite(collection: string, id: string): boolean {
  const favorites = loadFavorites();
  return favorites.some((f) => f.collection === collection && f.id === id);
}

// ─── Component ──────────────────────────────────────────────────────

interface Props {
  navigate: (path: string) => void;
  theme: Theme;
}

export default function RecentFavorites({ navigate, theme: t }: Props) {
  const [recent, setRecent] = useState<RecentViewItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load data from localStorage on mount and listen for storage events
  const reload = useCallback(() => {
    setRecent(loadRecent());
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    reload();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === RECENT_KEY || e.key === FAVORITES_KEY) {
        reload();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [reload]);

  const handleToggleFavorite = useCallback(
    (collection: string, id: string, name: string) => {
      toggleFavorite(collection, id, name);
      setFavorites(loadFavorites());
    },
    []
  );

  const clearRecent = useCallback(() => {
    localStorage.removeItem(RECENT_KEY);
    setRecent([]);
  }, []);

  const clearFavorites = useCallback(() => {
    localStorage.removeItem(FAVORITES_KEY);
    setFavorites([]);
  }, []);

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const now = Date.now();
      const diff = now - d.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  // ─── Styles ────────────────────────────────────────────────────────

  const pillBtn = (color: string): React.CSSProperties => ({
    background: color + "18",
    border: `1px solid ${color}40`,
    color,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: "'DM Sans',sans-serif",
  });

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display',serif",
    fontSize: "1rem",
    color: t.textBright,
    margin: 0,
  };

  const itemBtnStyle: React.CSSProperties = {
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: "8px",
    padding: "0.6rem 0.75rem",
    cursor: "pointer",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.15s",
    fontFamily: "inherit",
    color: "inherit",
    width: "100%",
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "1.5rem 0.5rem",
    color: t.textDim,
    fontSize: "0.82rem",
  };

  return (
    <div style={{ padding: "1.25rem" }}>
      {/* Recently Viewed */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>Recently Viewed</h3>
          {recent.length > 0 && (
            <button onClick={clearRecent} style={pillBtn(t.textDim)}>
              Clear all
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <div style={emptyStyle}>No recently viewed entries</div>
        ) : (
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {recent.map((item) => (
              <button
                key={`${item.collection}-${item.id}`}
                onClick={() => navigate(`/${item.collection}/${item.id}`)}
                style={itemBtnStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = t.surfaceHover;
                  e.currentTarget.style.borderColor = t.borderHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = t.surface;
                  e.currentTarget.style.borderColor = t.border;
                }}
              >
                <span style={{ color: item.color, fontSize: "0.95rem", flexShrink: 0 }}>
                  {item.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: t.textBright,
                      fontSize: "0.85rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name || "Untitled"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: t.textDim }}>
                    {COLLECTION_DEFS[item.collection]?.label || item.collection}
                  </div>
                </div>
                <span style={{ fontSize: "0.68rem", color: t.textDim, flexShrink: 0 }}>
                  {formatTimeAgo(item.viewedAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Favorites */}
      <div>
        <div style={sectionHeaderStyle}>
          <h3 style={sectionTitleStyle}>
            {"\u2605"} Favorites
          </h3>
          {favorites.length > 0 && (
            <button onClick={clearFavorites} style={pillBtn(t.textDim)}>
              Clear all
            </button>
          )}
        </div>

        {favorites.length === 0 ? (
          <div style={emptyStyle}>No favorites yet. Star entries to save them here.</div>
        ) : (
          <div style={{ display: "grid", gap: "0.35rem" }}>
            {favorites.map((item) => (
              <div
                key={`${item.collection}-${item.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <button
                  onClick={() => navigate(`/${item.collection}/${item.id}`)}
                  style={{
                    ...itemBtnStyle,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderRight: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.surfaceHover;
                    e.currentTarget.style.borderColor = t.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.surface;
                    e.currentTarget.style.borderColor = t.border;
                  }}
                >
                  <span style={{ color: item.color, fontSize: "0.95rem", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: t.textBright,
                        fontSize: "0.85rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name || "Untitled"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: t.textDim }}>
                      {COLLECTION_DEFS[item.collection]?.label || item.collection}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleToggleFavorite(item.collection, item.id, item.name)}
                  title="Remove from favorites"
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderTopRightRadius: "8px",
                    borderBottomRightRadius: "8px",
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    padding: "0.6rem 0.6rem",
                    cursor: "pointer",
                    color: "#f59e0b",
                    fontSize: "1rem",
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "stretch",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = t.surfaceHover;
                    e.currentTarget.style.borderColor = t.borderHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = t.surface;
                    e.currentTarget.style.borderColor = t.border;
                  }}
                >
                  {"\u2605"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

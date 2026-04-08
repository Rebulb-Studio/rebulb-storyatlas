import { useState, useEffect, useMemo, useCallback } from "react";
import type { Theme, Entry, CollectionData } from "../types";
import { COLLECTION_DEFS } from "../constants";
import { searchEntries } from "../api";
import { useUIStore } from "../stores/useUIStore";
import { getCompleteness } from "../workspace/WorkspaceViews";

interface Props {
  navigate: (path: string) => void;
  theme: Theme;
}

type SortOption = "updatedAt" | "name" | "createdAt";
type StatusFilter = "all" | "draft" | "published" | "archived";

interface ActiveFilters {
  collection: string;
  status: StatusFilter;
  tag: string;
  sort: SortOption;
}

const SORT_LABELS: Record<SortOption, string> = {
  updatedAt: "Last Updated",
  name: "Name",
  createdAt: "Date Created",
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default function SearchPage({ navigate, theme: t }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<(Entry & { _collection?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    collection: "all",
    status: "all",
    tag: "",
    sort: "updatedAt",
  });
  const [tagInput, setTagInput] = useState("");
  const toast = useUIStore((s) => s.toast);

  // Debounce the query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results when debounced query or filters change
  useEffect(() => {
    if (!debouncedQuery.trim() && filters.collection === "all" && filters.status === "all" && !filters.tag) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    let cancelled = false;
    const doSearch = async () => {
      setLoading(true);
      try {
        const data = await searchEntries({
          q: debouncedQuery || undefined,
          collection: filters.collection !== "all" ? filters.collection : undefined,
          status: filters.status !== "all" ? filters.status : undefined,
          tag: filters.tag || undefined,
          sort: filters.sort,
        });
        if (!cancelled) {
          setResults(data);
          setHasSearched(true);
        }
      } catch (err) {
        if (!cancelled) {
          toast(err instanceof Error ? err.message : "Search failed", "error");
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedQuery, filters, toast]);

  const collectionOptions = useMemo(() => {
    const entries = Object.entries(COLLECTION_DEFS).map(([key, def]) => ({
      value: key,
      label: def.label,
      icon: def.icon,
      color: def.color,
    }));
    return [{ value: "all", label: "All Collections", icon: "", color: "" }, ...entries];
  }, []);

  const activeFilterPills = useMemo(() => {
    const pills: { label: string; key: string }[] = [];
    if (filters.collection !== "all") {
      const def = COLLECTION_DEFS[filters.collection];
      pills.push({ label: `${def?.icon || ""} ${def?.label || filters.collection}`, key: "collection" });
    }
    if (filters.status !== "all") {
      pills.push({ label: `Status: ${filters.status}`, key: "status" });
    }
    if (filters.tag) {
      pills.push({ label: `Tag: ${filters.tag}`, key: "tag" });
    }
    return pills;
  }, [filters]);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      if (key === "collection") return { ...prev, collection: "all" };
      if (key === "status") return { ...prev, status: "all" };
      if (key === "tag") return { ...prev, tag: "" };
      return prev;
    });
    if (key === "tag") setTagInput("");
  }, []);

  const handleTagSubmit = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed) {
      setFilters((prev) => ({ ...prev, tag: trimmed }));
    }
  }, [tagInput]);

  const sortedResults = useMemo(() => {
    const sorted = [...results];
    if (filters.sort === "name") {
      sorted.sort((a, b) => {
        const na = ((a.name as string) || (a.title as string) || "").toLowerCase();
        const nb = ((b.name as string) || (b.title as string) || "").toLowerCase();
        return na.localeCompare(nb);
      });
    } else if (filters.sort === "createdAt") {
      sorted.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    } else {
      sorted.sort((a, b) => {
        const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return db - da;
      });
    }
    return sorted;
  }, [results, filters.sort]);

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "";
    }
  };

  // ─── Styles ──────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    width: "auto",
    minWidth: "140px",
    cursor: "pointer",
    appearance: "none" as const,
    paddingRight: "1.5rem",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(t.textDim)}'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.5rem center",
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

  const filterPillStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    background: t.accentDim,
    border: `1px solid ${t.accent}40`,
    color: t.accent,
    padding: "0.25rem 0.65rem",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "'DM Sans',sans-serif",
  };

  const removeBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: t.accent,
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "0 0 0 0.15rem",
    lineHeight: 1,
    fontFamily: "'DM Sans',sans-serif",
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <h2
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: "1.4rem",
          color: t.textBright,
          margin: "0 0 1rem 0",
        }}
      >
        Search
      </h2>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search entries across all collections..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            ...inputStyle,
            fontSize: "1rem",
            padding: "0.75rem 0.9rem 0.75rem 2.2rem",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "0.7rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: t.textDim,
            fontSize: "1rem",
            pointerEvents: "none",
          }}
        >
          {"\u2315"}
        </span>
        {loading && (
          <span
            style={{
              position: "absolute",
              right: "0.7rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: t.textDim,
              fontSize: "0.75rem",
            }}
          >
            Searching...
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Collection dropdown */}
        <select
          value={filters.collection}
          onChange={(e) => setFilters((prev) => ({ ...prev, collection: e.target.value }))}
          style={selectStyle}
        >
          {collectionOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon ? `${opt.icon} ` : ""}{opt.label}
            </option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as StatusFilter }))}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Tag filter */}
        <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Filter by tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTagSubmit();
            }}
            style={{ ...inputStyle, width: "140px" }}
          />
          {tagInput.trim() && (
            <button
              onClick={handleTagSubmit}
              style={pillBtn(t.accent)}
            >
              Apply
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sort}
          onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as SortOption }))}
          style={selectStyle}
        >
          {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
            <option key={val} value={val}>
              Sort: {label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filter Pills */}
      {activeFilterPills.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            marginBottom: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: t.textDim, marginRight: "0.2rem" }}>
            Active filters:
          </span>
          {activeFilterPills.map((pill) => (
            <span key={pill.key} style={filterPillStyle}>
              {pill.label}
              <button
                onClick={() => removeFilter(pill.key)}
                style={removeBtnStyle}
                title="Remove filter"
              >
                {"\u00D7"}
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              setFilters({ collection: "all", status: "all", tag: "", sort: "updatedAt" });
              setTagInput("");
            }}
            style={{
              ...removeBtnStyle,
              fontSize: "0.72rem",
              color: t.textDim,
              padding: "0.2rem 0.4rem",
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Result Count */}
      {hasSearched && !loading && (
        <div
          style={{
            fontSize: "0.78rem",
            color: t.textDim,
            marginBottom: "0.75rem",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          {sortedResults.length} result{sortedResults.length !== 1 ? "s" : ""} found
        </div>
      )}

      {/* Results / Empty States */}
      {!hasSearched && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            color: t.textDim,
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\u2315"}</div>
          <div style={{ fontSize: "1rem", fontWeight: 500 }}>Start typing to search</div>
          <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
            Search across all collections by name, content, or tags
          </div>
        </div>
      )}

      {hasSearched && !loading && sortedResults.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 1rem",
            color: t.textDim,
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\u2205"}</div>
          <div style={{ fontSize: "1rem", fontWeight: 500 }}>No results found</div>
          <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>
            Try adjusting your search query or filters
          </div>
        </div>
      )}

      {/* Results List */}
      {sortedResults.length > 0 && (
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {sortedResults.map((item) => {
            const col = item._collection || "";
            const cfg = COLLECTION_DEFS[col];
            const comp = cfg ? getCompleteness(col, item) : 0;

            return (
              <button
                key={`${col}-${item.id}`}
                onClick={() => navigate(`/${col}/${item.id}`)}
                style={{
                  background: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: "8px",
                  padding: "0.85rem 1rem",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  color: "inherit",
                  width: "100%",
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {/* Collection icon */}
                    {cfg && (
                      <span
                        style={{
                          color: cfg.color,
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {cfg.icon}
                      </span>
                    )}
                    {/* Entry name */}
                    <span
                      style={{
                        fontWeight: 700,
                        color: t.textBright,
                        fontSize: "0.95rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(item.name as string) || (item.title as string) || "Untitled"}
                    </span>
                    {/* Status badge */}
                    {item.status && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          padding: "0.1rem 0.45rem",
                          borderRadius: "10px",
                          background:
                            item.status === "published" || item.status === "Published"
                              ? t.success + "20"
                              : item.status === "archived" || item.status === "Archived"
                              ? t.textDim + "20"
                              : t.accent + "20",
                          color:
                            item.status === "published" || item.status === "Published"
                              ? t.success
                              : item.status === "archived" || item.status === "Archived"
                              ? t.textDim
                              : t.accent,
                          flexShrink: 0,
                        }}
                      >
                        {String(item.status)}
                      </span>
                    )}
                  </div>
                  {/* Second row: collection label + updated date */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      marginTop: "4px",
                    }}
                  >
                    {cfg && (
                      <span style={{ fontSize: "0.72rem", color: cfg.color, fontWeight: 500 }}>
                        {cfg.label}
                      </span>
                    )}
                    {item.updatedAt && (
                      <span style={{ fontSize: "0.7rem", color: t.textDim }}>
                        Updated {formatDate(item.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: completeness bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    flexShrink: 0,
                    marginLeft: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "4px",
                      background: t.inputBorder,
                      borderRadius: "2px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${comp}%`,
                        background:
                          comp > 60 ? t.success : comp > 30 ? "#f59e0b" : t.danger,
                        borderRadius: "2px",
                      }}
                    />
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
}

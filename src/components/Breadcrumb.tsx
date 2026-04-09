import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDataStore } from "../stores/useDataStore";
import { COLLECTION_DEFS, WORKSPACE_SECTIONS } from "../constants";
import type { Theme } from "../types";

interface Props {
  theme: Theme;
}

interface BreadcrumbSegment {
  label: string;
  path: string;
}

const PUBLISH_LABELS: Record<string, string> = {
  seriesListing: "Series Listing",
  readerMode: "Reader Mode",
  seriesDashboard: "Series Dashboard",
  pitchBible: "Pitch Bible",
};

const STATIC_ROUTES: Record<string, string> = {
  search: "Search",
  "writing-tools": "Writing Tools",
  upgrade: "Upgrade",
  export: "Export",
  share: "Share",
  progress: "Progress",
  calendar: "Calendar",
};

export default function Breadcrumb({ theme: t }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useDataStore((s) => s.data);

  const segments = useMemo((): BreadcrumbSegment[] => {
    const pathname = location.pathname;
    if (pathname === "/") return [];

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [];

    const result: BreadcrumbSegment[] = [];

    const first = parts[0];

    // /workspace/:view
    if (first === "workspace" && parts[1]) {
      const ws = WORKSPACE_SECTIONS[parts[1]];
      if (ws) {
        result.push({ label: ws.label, path: `/workspace/${parts[1]}` });
      } else {
        result.push({ label: parts[1], path: `/workspace/${parts[1]}` });
      }
      return result;
    }

    // /publish/:view
    if (first === "publish" && parts[1]) {
      const label = PUBLISH_LABELS[parts[1]] || parts[1];
      result.push({ label, path: `/publish/${parts[1]}` });
      return result;
    }

    // Static routes
    if (STATIC_ROUTES[first]) {
      result.push({ label: STATIC_ROUTES[first], path: `/${first}` });
      return result;
    }

    // Collection routes: /:collection, /:collection/new, /:collection/:id, /:collection/:id/edit
    const colDef = COLLECTION_DEFS[first];
    if (colDef) {
      result.push({ label: colDef.label, path: `/${first}` });

      if (parts.length >= 2) {
        const second = parts[1];

        if (second === "new") {
          result.push({ label: "New", path: `/${first}/new` });
        } else {
          // It's an entry ID - look up entry name
          const entries = data[first] || [];
          const entry = entries.find((e) => e.id === second);
          const entryName = entry?.name || entry?.title || second;
          result.push({
            label: entryName as string,
            path: `/${first}/${second}`,
          });

          if (parts.length >= 3 && parts[2] === "edit") {
            result.push({
              label: "Edit",
              path: `/${first}/${second}/edit`,
            });
          }
        }
      }

      return result;
    }

    // Fallback: use raw path segments
    let accumulated = "";
    for (const part of parts) {
      accumulated += `/${part}`;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      result.push({ label, path: accumulated });
    }
    return result;
  }, [location.pathname, data]);

  if (segments.length === 0) return null;

  return (
    <nav
      className="animate-fade-in"
      style={{
        fontSize: "0.72rem",
        color: t.textDim,
        fontFamily: "'DM Sans', sans-serif",
        padding: "0.5rem 1.5rem 0",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.25rem",
      }}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={() => navigate("/")}
        onKeyDown={(e) => { if (e.key === "Enter") navigate("/"); }}
        style={{
          cursor: "pointer",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = t.accent; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = t.textDim; }}
      >
        Home
      </span>
      {segments.map((seg, i) => (
        <span key={seg.path} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
          <span style={{ color: t.textDim, opacity: 0.5 }}>{" > "}</span>
          {i < segments.length - 1 ? (
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate(seg.path)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate(seg.path); }}
              style={{
                cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = t.accent; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = t.textDim; }}
            >
              {seg.label}
            </span>
          ) : (
            <span style={{ color: t.textMuted, fontWeight: 600 }}>
              {seg.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

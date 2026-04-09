import type { Theme } from "../types";

export default function SkeletonCard({ count = 5, theme: t }: { count?: number; theme: Theme }) {
  return (
    <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-shimmer" style={{
          background: t.surface, border: `1px solid ${t.border}`, borderRadius: "8px",
          padding: "0.85rem 1rem", display: "flex", gap: "0.75rem", alignItems: "center",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: "14px", width: `${60 + (i * 7) % 30}%`, background: t.border, borderRadius: "4px", marginBottom: "6px" }} />
            <div style={{ height: "10px", width: `${30 + (i * 13) % 40}%`, background: t.border, borderRadius: "3px", opacity: 0.5 }} />
          </div>
          <div style={{ width: "40px", height: "4px", background: t.border, borderRadius: "2px" }} />
        </div>
      ))}
    </div>
  );
}

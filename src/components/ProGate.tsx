import type { ReactNode } from "react";
import { useProStore, PRO_FEATURES } from "../stores/useProStore";
import type { Theme } from "../types";

interface Props {
  feature: string;
  theme: Theme;
  children: ReactNode;
}

export default function ProGate({ feature, theme: t, children }: Props) {
  const isPro = useProStore((s) => s.isPro);
  const featureDef = PRO_FEATURES[feature];

  if (!featureDef || featureDef.free || isPro) {
    return <>{children}</>;
  }

  return (
    <div style={{ padding: "3rem 2rem", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>
        {"\u{1F512}"}
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, marginBottom: "0.5rem" }}>
        Pro Feature
      </h2>
      <p style={{ color: t.textMuted, fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
        <strong style={{ color: t.accent }}>{featureDef.label}</strong> is available
        with StoryAtlas Pro. Upgrade to unlock this and other premium features.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/upgrade" style={{
          background: t.accent + "18", border: `1px solid ${t.accent}40`, color: t.accent,
          padding: "0.6rem 1.5rem", borderRadius: "20px", cursor: "pointer",
          fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          textDecoration: "none",
        }}>
          Upgrade to Pro
        </a>
      </div>
      <div style={{ marginTop: "2rem", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem", textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: t.textBright, fontSize: "0.85rem", marginBottom: "0.75rem" }}>Pro includes:</div>
        {Object.entries(PRO_FEATURES).filter(([, v]) => !v.free).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: t.textMuted, marginBottom: "0.3rem" }}>
            <span style={{ color: t.accent }}>{"\u{2713}"}</span>
            <span>{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

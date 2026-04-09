import { useState } from "react";
import type { Theme } from "../types";
import { useProStore } from "../stores/useProStore";

export default function SupportBanner({ theme: t }: { theme: Theme }) {
  const isPro = useProStore((s) => s.isPro);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("sa_support_dismissed") === "1"
  );

  if (dismissed || isPro) return null;

  const dismiss = () => {
    localStorage.setItem("sa_support_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div style={{
      margin: "0.75rem 0.5rem 0.5rem",
      padding: "0.75rem",
      background: `linear-gradient(135deg, ${t.accent}10, ${t.info}08)`,
      border: `1px solid ${t.accent}25`,
      borderRadius: "8px",
      position: "relative",
    }}>
      <button onClick={dismiss} style={{
        position: "absolute", top: "4px", right: "6px",
        background: "none", border: "none", color: t.textDim,
        cursor: "pointer", fontSize: "0.7rem", padding: "2px",
      }}>{"×"}</button>
      <div style={{ fontSize: "0.78rem", color: t.textBright, fontWeight: 600, marginBottom: "0.3rem" }}>
        {"\u{2615}"} Support StoryAtlas
      </div>
      <p style={{ fontSize: "0.68rem", color: t.textMuted, lineHeight: 1.4, marginBottom: "0.5rem" }}>
        Love worldbuilding with StoryAtlas? Help keep it growing!
      </p>
      <div style={{ display: "flex", gap: "0.3rem" }}>
        <a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" style={{
          background: t.accent + "18", border: `1px solid ${t.accent}40`, color: t.accent,
          padding: "0.2rem 0.6rem", borderRadius: "12px", cursor: "pointer",
          fontSize: "0.68rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          textDecoration: "none",
        }}>
          Buy Me a Coffee
        </a>
        <a href="/upgrade" style={{
          background: "transparent", border: `1px solid ${t.border}`, color: t.textMuted,
          padding: "0.2rem 0.6rem", borderRadius: "12px", cursor: "pointer",
          fontSize: "0.68rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          textDecoration: "none",
        }}>
          Go Pro {"\u{2B50}"}
        </a>
      </div>
    </div>
  );
}

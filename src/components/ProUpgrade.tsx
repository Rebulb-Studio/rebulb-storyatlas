import { useState } from "react";
import { useProStore, PRO_FEATURES } from "../stores/useProStore";
import type { Theme } from "../types";

export default function ProUpgrade({ theme: t }: { theme: Theme }) {
  const { isPro, activateKey, deactivate } = useProStore();
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  const handleActivate = () => {
    if (activateKey(keyInput)) {
      setError("");
      setKeyInput("");
    } else {
      setError("Invalid license key. Keys must be at least 8 characters.");
    }
  };

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.5rem 1.2rem", borderRadius: "20px", cursor: "pointer" as const,
    fontSize: "0.85rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
  });

  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.6rem 0.75rem", color: t.text, fontSize: "0.9rem",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{"\u{2B50}"}</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, fontSize: "2rem", marginBottom: "0.5rem" }}>
          StoryAtlas Pro
        </h1>
        <p style={{ color: t.textMuted, fontSize: "0.95rem", lineHeight: 1.6 }}>
          Unlock premium features to supercharge your worldbuilding workflow.
        </p>
      </div>

      {isPro ? (
        <div style={{ background: t.success + "15", border: `1px solid ${t.success}40`, borderRadius: "12px", padding: "1.5rem", textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{"\u{2705}"}</div>
          <h3 style={{ color: t.success, marginBottom: "0.5rem" }}>Pro Active</h3>
          <p style={{ color: t.textMuted, fontSize: "0.85rem" }}>You have access to all premium features.</p>
          <button onClick={deactivate} style={{ ...pillBtn(t.danger), marginTop: "1rem" }}>Deactivate License</button>
        </div>
      ) : (
        <>
          {/* Pricing */}
          <div style={{ background: `linear-gradient(135deg, ${t.accent}12, ${t.info}08)`, border: `2px solid ${t.accent}30`, borderRadius: "16px", padding: "2rem", textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.7rem", color: t.accent, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: "0.5rem" }}>One-time purchase</div>
            <div style={{ fontSize: "2.5rem", fontWeight: 700, color: t.textBright, fontFamily: "'Playfair Display', serif" }}>
              $9.99
            </div>
            <p style={{ color: t.textMuted, fontSize: "0.82rem", margin: "0.5rem 0 1.25rem" }}>Lifetime access. No subscription. All future updates included.</p>
            <a href="https://ko-fi.com" target="_blank" rel="noopener noreferrer" style={{
              ...pillBtn(t.accent),
              display: "inline-block", textDecoration: "none", padding: "0.7rem 2rem", fontSize: "1rem",
            }}>
              Purchase Pro License
            </a>
          </div>

          {/* Key entry */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
            <h3 style={{ color: t.textBright, fontSize: "0.95rem", marginBottom: "0.75rem" }}>Already have a license key?</h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="Enter your license key..." style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => { if (e.key === "Enter") handleActivate(); }} />
              <button onClick={handleActivate} style={pillBtn(t.accent)}>Activate</button>
            </div>
            {error && <div style={{ color: t.danger, fontSize: "0.78rem", marginTop: "0.5rem" }}>{error}</div>}
          </div>
        </>
      )}

      {/* Feature list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "1.25rem" }}>
          <h3 style={{ color: t.textBright, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Free Features</h3>
          {Object.entries(PRO_FEATURES).filter(([, v]) => v.free).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: t.textMuted, marginBottom: "0.35rem" }}>
              <span style={{ color: t.success }}>{"\u{2713}"}</span> {v.label}
            </div>
          ))}
        </div>
        <div style={{ background: `linear-gradient(135deg, ${t.accent}08, ${t.info}05)`, border: `1px solid ${t.accent}20`, borderRadius: "10px", padding: "1.25rem" }}>
          <h3 style={{ color: t.accent, fontSize: "0.9rem", marginBottom: "0.75rem" }}>Pro Features {"\u{2B50}"}</h3>
          {Object.entries(PRO_FEATURES).filter(([, v]) => !v.free).map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: t.textMuted, marginBottom: "0.35rem" }}>
              <span style={{ color: t.accent }}>{"\u{2713}"}</span> {v.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

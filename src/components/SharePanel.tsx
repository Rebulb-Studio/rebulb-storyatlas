import { useState } from "react";
import type { Theme } from "../types";
import { createShareLink } from "../api";

interface Props {
  theme: Theme;
  toast: (msg: string, type?: "info" | "success" | "error") => void;
}

export default function SharePanel({ theme: t, toast }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const shareUrl = token ? `${window.location.origin}/shared/${token}` : "";

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const result = await createShareLink();
      setToken(result.token);
      toast("Share link generated", "success");
    } catch {
      toast("Failed to generate share link", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Failed to copy link", "error");
    }
  };

  const pillBtn = (color: string): React.CSSProperties => ({
    background: color + "18",
    border: `1px solid ${color}40`,
    color,
    padding: "0.3rem 0.7rem",
    borderRadius: "16px",
    cursor: "pointer",
    fontSize: "0.72rem",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.82rem",
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, margin: 0 }}>
        Share Your Project
      </h3>

      <p style={{ color: t.textMuted, fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
        Generate a read-only share link for your project. Anyone with the link can view your world.
      </p>

      {/* Generate Button */}
      {!token && (
        <div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            style={{
              ...pillBtn(t.accent),
              padding: "0.45rem 1.2rem",
              fontSize: "0.82rem",
              opacity: generating ? 0.5 : 1,
              cursor: generating ? "not-allowed" : "pointer",
            }}
          >
            {generating ? "Generating..." : "Generate Share Link"}
          </button>
        </div>
      )}

      {/* Share Link Display */}
      {token && (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "stretch" }}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleCopy}
            style={{
              ...pillBtn(t.accent),
              padding: "0.45rem 0.9rem",
              fontSize: "0.82rem",
              flexShrink: 0,
            }}
          >
            Copy
          </button>
        </div>
      )}

      {/* Warning */}
      <p style={{ color: t.textDim, fontSize: "0.75rem", margin: 0, fontStyle: "italic" }}>
        Share links contain a snapshot of your current data.
      </p>
    </div>
  );
}

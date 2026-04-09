import { useState, useEffect, useRef } from "react";
import type { Theme } from "../types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  allTags?: string[];
  theme: Theme;
}

export default function TagInput({ value, onChange, allTags = [], theme: t }: Props) {
  const tags = (value || "").split(",").map((s) => s.trim()).filter(Boolean);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Cleanup blur timer on unmount
  useEffect(() => {
    return () => { if (blurTimer.current) clearTimeout(blurTimer.current); };
  }, []);

  const suggestions = input.trim()
    ? allTags.filter((tag) => tag.toLowerCase().includes(input.toLowerCase()) && !tags.includes(tag)).slice(0, 8)
    : [];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed].join(", ");
    onChange(next);
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx).join(", ");
    onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      removeTag(tags.length - 1);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.35rem 0.5rem",
        background: t.input, border: `1px solid ${t.inputBorder}`, borderRadius: "6px",
        alignItems: "center", minHeight: "38px",
      }}>
        {tags.map((tag, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            background: t.accentDim, border: `1px solid ${t.accent}30`, color: t.accent,
            padding: "0.15rem 0.5rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
          }}>
            {tag}
            <button type="button" onClick={() => removeTag(i)}
              style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", padding: 0, fontSize: "0.85rem", lineHeight: 1 }}>{"×"}</button>
          </span>
        ))}
        <input ref={inputRef} value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={onKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => { if (blurTimer.current) clearTimeout(blurTimer.current); blurTimer.current = setTimeout(() => setShowSuggestions(false), 200); }}
          placeholder={tags.length ? "" : "Add tags..."}
          style={{
            flex: 1, minWidth: "80px", background: "transparent", border: "none", outline: "none",
            color: t.text, fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif", padding: "0.15rem 0",
          }}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: t.bg, border: `1px solid ${t.border}`, borderRadius: "6px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", marginTop: "2px", overflow: "hidden",
        }}>
          {suggestions.map((tag) => (
            <button key={tag} type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
              style={{
                display: "block", width: "100%", padding: "0.4rem 0.75rem", border: "none",
                background: "transparent", color: t.textMuted, fontSize: "0.8rem",
                fontFamily: "inherit", textAlign: "left", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = t.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

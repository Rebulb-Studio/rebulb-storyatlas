import { useState, useEffect, useRef, useCallback } from "react";
import { COLLECTION_DEFS, FIELD_HELP, STARTER_KITS } from "../constants";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import type { Entry, Theme } from "../types";

const STATUS_OPTIONS = ["draft", "published", "archived"] as const;

interface Props {
  collection: string;
  existing?: Entry;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
  theme: Theme;
  allTags?: string[];
}

export default function EntryForm({ collection, existing, onSubmit, onCancel, theme: t, allTags = [] }: Props) {
  const cfg = COLLECTION_DEFS[collection];
  if (!cfg) return null;
  const isEdit = !!existing;

  const [values, setValues] = useState<Record<string, unknown>>(existing || {});
  const [validationError, setValidationError] = useState("");
  const [appliedSeed, setAppliedSeed] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const set = (k: string, v: unknown) => setValues((prev) => ({ ...prev, [k]: v }));

  const kits = (STARTER_KITS as Record<string, Array<{ label: string; values: Record<string, string> }>>)[collection];

  // Autosave to localStorage every 5 seconds for drafts
  useEffect(() => {
    const key = `sa_draft_${collection}_${existing?.id || "new"}`;
    const saved = localStorage.getItem(key);
    if (saved && !existing) {
      try {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setValues((prev) => ({ ...prev, ...parsed }));
          setAutosaveStatus("saved");
        }
      } catch { /* ignore */ }
    }
  }, [collection, existing]);

  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      const key = `sa_draft_${collection}_${existing?.id || "new"}`;
      localStorage.setItem(key, JSON.stringify(values));
      setAutosaveStatus("saved");
      setTimeout(() => setAutosaveStatus("idle"), 1500);
    }, 5000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [values, collection, existing]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const inputStyle = {
    width: "100%", background: t.input, border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px", padding: "0.55rem 0.7rem", color: t.text, fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif", transition: "border-color 0.15s",
  };

  const pillBtn = (color: string) => ({
    background: color + "18", border: `1px solid ${color}40`, color,
    padding: "0.35rem 0.9rem", borderRadius: "20px", cursor: "pointer" as const,
    fontSize: "0.78rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
  });

  const handleSubmit = () => {
    const nameField = cfg.fields?.find((f) => f.k === "name" || f.k === "title");
    if (nameField) {
      const val = String(values[nameField.k] || "").trim();
      if (!val) { setValidationError(`${nameField.l} is required`); return; }
    }
    setValidationError("");
    // Clear autosave draft
    localStorage.removeItem(`sa_draft_${collection}_${existing?.id || "new"}`);
    onSubmit(values);
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", color: t.textBright, margin: 0 }}>
          {isEdit ? `Edit ${cfg.label.replace(/s$/, "")}` : `New ${cfg.label.replace(/s$/, "")}`}
        </h2>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {autosaveStatus === "saved" && <span style={{ fontSize: "0.68rem", color: t.success }}>Draft saved</span>}
          {autosaveStatus === "saving" && <span style={{ fontSize: "0.68rem", color: t.accent }}>Saving...</span>}
          <button onClick={onCancel} style={pillBtn("#475569")}>{"\u2190"} Back</button>
        </div>
      </div>

      {/* Status selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Status:</span>
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => set("_status", s)}
            style={{
              ...pillBtn((values._status || "draft") === s ? t.accent : t.textDim),
              padding: "0.2rem 0.6rem", fontSize: "0.7rem",
              background: (values._status || "draft") === s ? t.accent + "20" : "transparent",
            }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* User tags (_tags field) */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.72rem", color: t.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.3rem" }}>Tags</label>
        <TagInput value={(values._tags as string) || ""} onChange={(v) => set("_tags", v)} allTags={allTags} theme={t} />
      </div>

      {!isEdit && kits && kits.length > 0 && !appliedSeed && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.7rem", color: t.textDim, marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Start from template</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {kits.map((kit, i) => (
              <button key={i} onClick={() => { setValues((prev) => ({ ...prev, ...kit.values })); setAppliedSeed(true); }}
                style={{ ...pillBtn(cfg.color), fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}>{kit.label}</button>
            ))}
          </div>
        </div>
      )}

      {validationError && (
        <div style={{ background: `${t.danger}15`, border: `1px solid ${t.danger}40`, color: t.danger, padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "1rem" }}>
          {validationError}
        </div>
      )}

      {cfg.fields?.map((f) => (
        <div key={f.k} style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.72rem", color: cfg.color, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{f.l}</label>
          {(FIELD_HELP as Record<string, string>)[f.k] && (
            <div style={{ fontSize: "0.68rem", color: t.textDim, marginBottom: "0.3rem", lineHeight: 1.4, fontStyle: "italic" }}>{(FIELD_HELP as Record<string, string>)[f.k]}</div>
          )}
          {f.t === "select" ? (
            <select value={(values[f.k] as string) || ""} onChange={(e) => set(f.k, e.target.value)} style={inputStyle}>
              <option value="">{"\— Select \—"}</option>
              {f.opts?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.t === "textarea" ? (
            <RichTextEditor content={(values[f.k] as string) || ""} onChange={(html) => set(f.k, html)} placeholder={`Enter ${f.l.toLowerCase()}...`} theme={t} />
          ) : f.t === "tags" ? (
            <TagInput value={(values[f.k] as string) || ""} onChange={(v) => set(f.k, v)} allTags={allTags} theme={t} />
          ) : (
            <input value={(values[f.k] as string) || ""} onChange={(e) => set(f.k, e.target.value)} style={inputStyle} />
          )}
        </div>
      ))}
      <button onClick={handleSubmit} style={{
        background: (cfg.color) + "18", border: `1px solid ${cfg.color}40`, color: cfg.color,
        padding: "0.6rem 1.5rem", borderRadius: "20px", cursor: "pointer",
        fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", marginTop: "0.5rem",
      }}>
        {isEdit ? "Save Changes" : "Create Entry"}
      </button>
    </div>
  );
}

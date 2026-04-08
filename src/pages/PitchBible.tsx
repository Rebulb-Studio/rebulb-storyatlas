import { useMemo } from "react";
import { FORMAT_PRESETS } from "../constants";
import type { CollectionData, ProjectMeta, Entry, Theme } from "../types";

interface Props {
  data: CollectionData;
  meta: ProjectMeta;
  toast: (msg: string, type?: "info" | "success" | "error") => void;
  theme: Theme;
}

function entryName(e: Entry): string {
  return (e.title as string) || (e.name as string) || e.id;
}

export default function PitchBible({ data, meta, toast, theme: t }: Props) {
  const characters: Entry[] = data.characters || [];
  const locations: Entry[] = data.locations || [];
  const lore: Entry[] = data.lore || [];
  const plots: Entry[] = data.plots || [];
  const bibliography: Entry[] = data.bibliography || [];

  const preset = FORMAT_PRESETS[meta.format] || null;

  const markdown = useMemo(() => {
    const lines: string[] = [];

    // Title
    lines.push(`# ${meta.projectName || "Untitled Project"} -- Pitch Bible`);
    lines.push("");

    // Author / Genre / Format
    const infoParts: string[] = [];
    if (meta.author) infoParts.push(`**Author:** ${meta.author}`);
    if (meta.genre) infoParts.push(`**Genre:** ${meta.genre}`);
    if (meta.format) infoParts.push(`**Format:** ${meta.format}`);
    if (infoParts.length) {
      lines.push(infoParts.join("  |  "));
      lines.push("");
    }

    // Logline
    if (meta.description) {
      lines.push("## Logline");
      lines.push("");
      lines.push(meta.description);
      lines.push("");
    }

    // World Overview
    if (lore.length > 0) {
      lines.push("## World Overview");
      lines.push("");
      lore.forEach((l) => {
        lines.push(`### ${entryName(l)}`);
        if (l.overview) lines.push(String(l.overview));
        lines.push("");
      });
    }

    // Characters
    if (characters.length > 0) {
      lines.push("## Characters");
      lines.push("");
      characters.forEach((c) => {
        lines.push(`### ${entryName(c)}`);
        const details: string[] = [];
        if (c.role) details.push(`**Role:** ${c.role}`);
        if (c.archetype) details.push(`**Archetype:** ${c.archetype}`);
        if (c.status) details.push(`**Status:** ${c.status}`);
        if (details.length) lines.push(details.join("  |  "));
        if (c.personality) lines.push(`\n${c.personality}`);
        if (c.motivations) lines.push(`\n**Motivations:** ${c.motivations}`);
        lines.push("");
      });
    }

    // Locations
    if (locations.length > 0) {
      lines.push("## Locations");
      lines.push("");
      locations.forEach((loc) => {
        lines.push(`### ${entryName(loc)}`);
        if (loc.type) lines.push(`**Type:** ${loc.type}`);
        if (loc.overview) lines.push(String(loc.overview));
        lines.push("");
      });
    }

    // Plot Arcs
    if (plots.length > 0) {
      lines.push("## Plot Arcs");
      lines.push("");
      plots.forEach((p) => {
        lines.push(`### ${entryName(p)}`);
        if (p.type) lines.push(`**Type:** ${p.type}`);
        if (p.synopsis) lines.push(String(p.synopsis));
        if (p.conflict) lines.push(`\n**Central Conflict:** ${p.conflict}`);
        if (p.stakes) lines.push(`\n**Stakes:** ${p.stakes}`);
        lines.push("");
      });
    }

    // Comparable Titles
    if (bibliography.length > 0) {
      lines.push("## Comparable Titles");
      lines.push("");
      bibliography.forEach((b) => {
        const parts: string[] = [entryName(b)];
        if (b.creator) parts.push(`by ${b.creator}`);
        if (b.type) parts.push(`(${b.type})`);
        lines.push(`- ${parts.join(" ")}`);
        if (b.influence) lines.push(`  *${b.influence}*`);
      });
      lines.push("");
    }

    // Format Specification
    if (preset) {
      lines.push("## Format Specification");
      lines.push("");
      lines.push(`- **Format:** ${preset.label}`);
      lines.push(`- **Chapter Length:** ${preset.chapterWords}`);
      lines.push(`- **Volume Structure:** ${preset.volumeChapters}`);
      lines.push(`- **POV:** ${preset.pov}`);
      lines.push(`- **Tense:** ${preset.tense}`);
      if (preset.notes) lines.push(`- **Notes:** ${preset.notes}`);
      lines.push("");
    }

    return lines.join("\n");
  }, [meta, characters, locations, lore, plots, bibliography, preset]);

  const htmlContent = useMemo(() => {
    // Convert markdown to basic HTML
    let html = markdown
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br/>");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${meta.projectName || "Pitch Bible"}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 1rem 2rem; color: #1e293b; line-height: 1.7; }
  h1 { font-size: 2rem; border-bottom: 2px solid #1e293b; padding-bottom: 0.5rem; }
  h2 { font-size: 1.4rem; color: #475569; margin-top: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; }
  h3 { font-size: 1.1rem; color: #1e293b; margin-top: 1rem; }
  ul { padding-left: 1.5rem; }
  li { margin-bottom: 0.3rem; }
  strong { color: #0f172a; }
  em { color: #64748b; }
  p { margin: 0.5rem 0; }
</style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
  }, [markdown, meta.projectName]);

  const exportHtml = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(meta.projectName || "pitch-bible").replace(/\s+/g, "-").toLowerCase()}-pitch-bible.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Pitch Bible HTML exported", "success");
  };

  const copyMarkdown = () => {
    navigator.clipboard.writeText(markdown).then(() => {
      toast("Markdown copied to clipboard", "success");
    }).catch(() => {
      toast("Failed to copy to clipboard", "error");
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: t.input,
    border: `1px solid ${t.inputBorder}`,
    borderRadius: "6px",
    padding: "0.55rem 0.7rem",
    color: t.text,
    fontSize: "0.88rem",
    fontFamily: "'DM Sans',sans-serif",
    transition: "border-color 0.15s",
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

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", color: t.textBright, marginBottom: "0.3rem" }}>
            Pitch Bible
          </h2>
          <p style={{ color: t.textMuted, fontSize: "0.85rem" }}>
            Auto-generated from your project data. Export or copy to share with publishers, agents, or collaborators.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          <button onClick={exportHtml} style={pillBtn(t.success)}>Export HTML</button>
          <button onClick={copyMarkdown} style={pillBtn(t.accent)}>Copy Markdown</button>
        </div>
      </div>

      {/* Live Preview */}
      <div style={{
        background: "#ffffff",
        borderRadius: "10px",
        border: `1px solid ${t.border}`,
        padding: "2rem",
        fontFamily: "Georgia, serif",
        color: "#1e293b",
        lineHeight: 1.7,
        maxHeight: "70vh",
        overflowY: "auto",
      }}>
        {/* Project Name */}
        <h1 style={{ fontSize: "1.8rem", borderBottom: "2px solid #1e293b", paddingBottom: "0.5rem", marginBottom: "0.8rem" }}>
          {meta.projectName || "Untitled Project"} -- Pitch Bible
        </h1>

        {/* Author / Genre / Format line */}
        {(meta.author || meta.genre || meta.format) && (
          <p style={{ color: "#475569", fontSize: "0.95rem", marginBottom: "1rem" }}>
            {[meta.author && `Author: ${meta.author}`, meta.genre && `Genre: ${meta.genre}`, meta.format && `Format: ${meta.format}`].filter(Boolean).join("  |  ")}
          </p>
        )}

        {/* Logline */}
        {meta.description && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Logline</h2>
            <p>{meta.description}</p>
          </>
        )}

        {/* World Overview */}
        {lore.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>World Overview</h2>
            {lore.map((l) => (
              <div key={l.id} style={{ marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.2rem" }}>{entryName(l)}</h3>
                {l.overview ? <p style={{ fontSize: "0.9rem" }}>{String(l.overview)}</p> : null}
              </div>
            ))}
          </>
        )}

        {/* Characters */}
        {characters.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Characters</h2>
            {characters.map((c) => (
              <div key={c.id} style={{ marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.2rem" }}>{entryName(c)}</h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {[c.role, c.archetype, c.status].filter(Boolean).join(" | ")}
                </p>
                {c.personality ? <p style={{ fontSize: "0.9rem" }}>{String(c.personality)}</p> : null}
              </div>
            ))}
          </>
        )}

        {/* Locations */}
        {locations.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Locations</h2>
            {locations.map((loc) => (
              <div key={loc.id} style={{ marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.2rem" }}>{entryName(loc)}</h3>
                {loc.type ? <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{String(loc.type)}</p> : null}
                {loc.overview ? <p style={{ fontSize: "0.9rem" }}>{String(loc.overview)}</p> : null}
              </div>
            ))}
          </>
        )}

        {/* Plot Arcs */}
        {plots.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Plot Arcs</h2>
            {plots.map((p) => (
              <div key={p.id} style={{ marginBottom: "0.8rem" }}>
                <h3 style={{ fontSize: "1.05rem", marginBottom: "0.2rem" }}>{entryName(p)}</h3>
                {p.type ? <p style={{ fontSize: "0.85rem", color: "#64748b" }}>{String(p.type)}</p> : null}
                {p.synopsis ? <p style={{ fontSize: "0.9rem" }}>{String(p.synopsis)}</p> : null}
              </div>
            ))}
          </>
        )}

        {/* Comparable Titles */}
        {bibliography.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Comparable Titles</h2>
            <ul style={{ paddingLeft: "1.5rem" }}>
              {bibliography.map((b) => (
                <li key={b.id} style={{ marginBottom: "0.4rem", fontSize: "0.9rem" }}>
                  <strong>{entryName(b)}</strong>
                  {b.creator ? ` by ${String(b.creator)}` : null}
                  {b.type ? ` (${String(b.type)})` : null}
                  {b.influence ? <em style={{ display: "block", color: "#64748b", fontSize: "0.85rem" }}>{String(b.influence)}</em> : null}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Format Specification */}
        {preset && (
          <>
            <h2 style={{ fontSize: "1.3rem", color: "#475569", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.3rem", marginTop: "1.5rem" }}>Format Specification</h2>
            <ul style={{ paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
              <li><strong>Format:</strong> {preset.label}</li>
              <li><strong>Chapter Length:</strong> {preset.chapterWords}</li>
              <li><strong>Volume Structure:</strong> {preset.volumeChapters}</li>
              <li><strong>POV:</strong> {preset.pov}</li>
              <li><strong>Tense:</strong> {preset.tense}</li>
              {preset.notes && <li><strong>Notes:</strong> {preset.notes}</li>}
            </ul>
          </>
        )}

        {/* Empty state */}
        {!meta.description && characters.length === 0 && locations.length === 0 && lore.length === 0 && plots.length === 0 && bibliography.length === 0 && !preset && (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "2rem 0" }}>
            Add project data (characters, locations, lore, plots, bibliography) to generate your pitch bible.
          </p>
        )}
      </div>
    </div>
  );
}

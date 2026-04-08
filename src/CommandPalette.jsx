import { useState, useEffect, useRef } from "react";

export default function CommandPalette({ commands, onClose, theme }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || (c.group || "").toLowerCase().includes(query.toLowerCase())).slice(0, 20)
    : commands.slice(0, 20);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => { setIndex(0); }, [query]);

  const run = (cmd) => { cmd.action(); onClose(); };

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIndex(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[index]) { e.preventDefault(); run(filtered[index]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  const t = theme;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:9999, display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"15vh" }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:"520px", background:t.bg, border:`1px solid ${t.border}`, borderRadius:"12px", boxShadow:"0 20px 60px rgba(0,0,0,0.5)", overflow:"hidden" }}>
        <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
          placeholder="Type a command or search..."
          style={{ width:"100%", padding:"0.9rem 1.2rem", background:"transparent", border:"none", borderBottom:`1px solid ${t.border}`, color:t.text, fontSize:"0.95rem", fontFamily:"'DM Sans',sans-serif", outline:"none" }}
        />
        <div style={{ maxHeight:"320px", overflowY:"auto" }}>
          {filtered.length === 0 && (
            <div style={{ padding:"1.5rem", textAlign:"center", color:t.textDim, fontSize:"0.85rem" }}>No matching commands</div>
          )}
          {filtered.map((cmd, i) => (
            <button key={cmd.id || i} onClick={() => run(cmd)}
              style={{
                display:"flex", alignItems:"center", gap:"0.75rem", width:"100%", padding:"0.6rem 1.2rem",
                background: i === index ? t.accentDim : "transparent",
                border:"none", borderLeft: i === index ? `2px solid ${t.accent}` : "2px solid transparent",
                color: i === index ? t.textBright : t.textMuted,
                cursor:"pointer", textAlign:"left", fontFamily:"inherit", fontSize:"0.85rem", transition:"all 0.1s",
              }}
              onMouseEnter={() => setIndex(i)}
            >
              <span style={{ width:"20px", textAlign:"center", flexShrink:0, opacity:0.7 }}>{cmd.icon || "\u25B8"}</span>
              <span style={{ flex:1 }}>{cmd.label}</span>
              {cmd.group && <span style={{ fontSize:"0.65rem", color:t.textDim, textTransform:"uppercase", letterSpacing:"0.08em" }}>{cmd.group}</span>}
            </button>
          ))}
        </div>
        <div style={{ padding:"0.5rem 1.2rem", borderTop:`1px solid ${t.border}`, display:"flex", gap:"1rem", fontSize:"0.65rem", color:t.textDim }}>
          <span>{"\u2191\u2193"} navigate</span>
          <span>{"\u21B5"} select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

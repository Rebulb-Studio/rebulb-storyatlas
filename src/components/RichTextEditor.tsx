import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import type { Theme } from "../types";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  theme: Theme;
}

function MenuBar({ editor, theme: t }: { editor: ReturnType<typeof useEditor>; theme: Theme }) {
  if (!editor) return null;

  const btn = (active: boolean) => ({
    background: active ? t.accent + "25" : "transparent",
    border: `1px solid ${active ? t.accent + "50" : t.border}`,
    color: active ? t.accent : t.textMuted,
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    cursor: "pointer" as const,
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    minWidth: "28px",
    textAlign: "center" as const,
  });

  return (
    <div style={{ display: "flex", gap: "0.25rem", padding: "0.4rem", borderBottom: `1px solid ${t.border}`, flexWrap: "wrap" }}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive("bold"))} title="Bold"><b>B</b></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive("italic"))} title="Italic"><i>I</i></button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btn(editor.isActive("underline"))} title="Underline"><u>U</u></button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btn(editor.isActive("strike"))} title="Strikethrough"><s>S</s></button>
      <div style={{ width: "1px", background: t.border, margin: "0 0.15rem" }} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btn(editor.isActive("heading", { level: 2 }))} title="Heading 2">H2</button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btn(editor.isActive("heading", { level: 3 }))} title="Heading 3">H3</button>
      <div style={{ width: "1px", background: t.border, margin: "0 0.15rem" }} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn(editor.isActive("bulletList"))} title="Bullet List">{"\u2022"}</button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btn(editor.isActive("orderedList"))} title="Ordered List">1.</button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btn(editor.isActive("blockquote"))} title="Quote">{"\u201C"}</button>
      <div style={{ width: "1px", background: t.border, margin: "0 0.15rem" }} />
      <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} style={btn(editor.isActive("codeBlock"))} title="Code Block">{"{}"}</button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btn(false)} title="Divider">{"\u2014"}</button>
      <div style={{ width: "1px", background: t.border, margin: "0 0.15rem" }} />
      <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} style={{ ...btn(false), opacity: editor.can().undo() ? 1 : 0.3 }} title="Undo">{"\u21A9"}</button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} style={{ ...btn(false), opacity: editor.can().redo() ? 1 : 0.3 }} title="Redo">{"\u21AA"}</button>
    </div>
  );
}

export default function RichTextEditor({ content, onChange, placeholder = "Start writing...", theme: t }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "tiptap-link" } }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        style: `color: ${t.text}; font-family: 'DM Sans', sans-serif; font-size: 0.88rem; line-height: 1.7; min-height: 120px; outline: none; padding: 0.75rem;`,
      },
    },
  });

  return (
    <div style={{ border: `1px solid ${t.inputBorder}`, borderRadius: "6px", background: t.input, overflow: "hidden" }}>
      <MenuBar editor={editor} theme={t} />
      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0.3em 0; }
        .tiptap h2 { font-size: 1.3em; font-weight: 700; margin: 0.8em 0 0.3em; color: ${t.textBright}; }
        .tiptap h3 { font-size: 1.1em; font-weight: 700; margin: 0.6em 0 0.2em; color: ${t.textBright}; }
        .tiptap ul, .tiptap ol { padding-left: 1.5em; margin: 0.3em 0; }
        .tiptap blockquote { border-left: 3px solid ${t.accent}40; padding-left: 0.75em; margin: 0.5em 0; color: ${t.textMuted}; }
        .tiptap code { background: ${t.surface}; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.85em; }
        .tiptap pre { background: ${t.surface}; padding: 0.75em; border-radius: 6px; overflow-x: auto; }
        .tiptap pre code { background: none; padding: 0; }
        .tiptap hr { border: none; border-top: 1px solid ${t.border}; margin: 1em 0; }
        .tiptap .tiptap-link { color: ${t.accent}; text-decoration: underline; cursor: pointer; }
        .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: ${t.textDim}; pointer-events: none; float: left; height: 0; }
        .tiptap s { text-decoration: line-through; color: ${t.textDim}; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

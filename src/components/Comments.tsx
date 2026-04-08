import { useState, useEffect } from "react";
import type { Theme } from "../types";
import { getComments, addComment, deleteComment, Comment } from "../api";

interface Props {
  collection: string;
  entryId: string;
  theme: Theme;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export default function Comments({ collection, entryId, theme: t }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState(() => localStorage.getItem("sa_comment_author") || "Author");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    getComments(collection, entryId)
      .then((data) => setComments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [collection, entryId]);

  const handleAuthorChange = (value: string) => {
    setAuthor(value);
    localStorage.setItem("sa_comment_author", value);
  };

  const handlePost = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);

    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      entryId,
      collection,
      content: content.trim(),
      author: author.trim() || "Author",
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, optimisticComment]);
    const postedContent = content.trim();
    setContent("");

    try {
      const created = await addComment(collection, entryId, postedContent, author.trim() || "Author");
      setComments((prev) => prev.map((c) => (c.id === optimisticComment.id ? created : c)));
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== optimisticComment.id));
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const prev = comments;
    setComments((c) => c.filter((item) => item.id !== commentId));
    try {
      await deleteComment(collection, entryId, commentId);
    } catch {
      setComments(prev);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <h4 style={{ fontFamily: "'Playfair Display', serif", color: t.textBright, margin: 0, fontSize: "1rem" }}>
        Comments
      </h4>

      {/* Comment List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {loading && (
          <div style={{ color: t.textDim, fontSize: "0.82rem" }}>Loading comments...</div>
        )}

        {!loading && comments.length === 0 && (
          <div style={{ color: t.textDim, fontSize: "0.82rem", fontStyle: "italic" }}>No comments yet</div>
        )}

        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: "8px",
              padding: "0.6rem 0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: t.accent, fontSize: "0.78rem", fontWeight: 600 }}>{c.author}</span>
                <span style={{ color: t.textDim, fontSize: "0.68rem" }}>{relativeTime(c.createdAt)}</span>
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                style={pillBtn(t.danger)}
              >
                Delete
              </button>
            </div>
            <div style={{ color: t.textMuted, fontSize: "0.82rem", whiteSpace: "pre-wrap" }}>{c.content}</div>
          </div>
        ))}
      </div>

      {/* Add Comment Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", borderTop: `1px solid ${t.border}`, paddingTop: "0.75rem" }}>
        <input
          type="text"
          placeholder="Your name"
          value={author}
          onChange={(e) => handleAuthorChange(e.target.value)}
          style={{ ...inputStyle, width: "200px" }}
        />
        <textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            style={{
              ...pillBtn(t.accent),
              opacity: !content.trim() || posting ? 0.5 : 1,
              cursor: !content.trim() || posting ? "not-allowed" : "pointer",
            }}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

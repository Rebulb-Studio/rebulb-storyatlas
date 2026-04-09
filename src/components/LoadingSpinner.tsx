export default function LoadingSpinner() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1rem",
      background: "#06060f", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div className="animate-spin" style={{
        width: "36px", height: "36px", borderRadius: "50%",
        border: "3px solid rgba(168,85,247,0.15)",
        borderTopColor: "#a855f7",
      }} />
      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Loading your workspace...</div>
    </div>
  );
}

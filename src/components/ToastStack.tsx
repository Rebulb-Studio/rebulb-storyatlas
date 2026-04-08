import { useUIStore } from "../stores/useUIStore";
import { Z_INDEX } from "../constants";
import type { Theme } from "../types";

export default function ToastStack({ theme: t }: { theme: Theme }) {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "48px", right: "16px", display: "grid", gap: "0.4rem", zIndex: Z_INDEX.toast }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          background: toast.type === "error" ? `${t.danger}20` : toast.type === "success" ? `${t.success}20` : t.surface,
          border: `1px solid ${toast.type === "error" ? t.danger : toast.type === "success" ? t.success : t.border}40`,
          color: toast.type === "error" ? t.danger : toast.type === "success" ? t.success : t.text,
          padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", maxWidth: "320px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

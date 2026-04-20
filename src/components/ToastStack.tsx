import { useUIStore } from "../stores/useUIStore";
import { Z_INDEX } from "../constants";
import type { Theme } from "../types";

export default function ToastStack({ theme: t }: { theme: Theme }) {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: "48px", right: "16px", display: "grid", gap: "0.4rem", zIndex: Z_INDEX.toast }}>
      {toasts.map((toast) => {
        const accent =
          toast.type === "error" ? t.danger
          : toast.type === "success" ? t.success
          : toast.type === "warning" ? (t.info || t.accent)
          : t.border;
        const textColor =
          toast.type === "error" ? t.danger
          : toast.type === "success" ? t.success
          : toast.type === "warning" ? (t.info || t.accent)
          : t.text;
        const bg =
          toast.type === "error" ? `${t.danger}20`
          : toast.type === "success" ? `${t.success}20`
          : toast.type === "warning" ? `${(t.info || t.accent)}20`
          : t.surface;
        return (
          <div key={toast.id} role="status" aria-live="polite"
            className={toast.exiting ? "animate-slide-out-right" : "animate-slide-in-right"} style={{
              background: bg,
              border: `1px solid ${accent}40`,
              color: textColor,
              padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.8rem", maxWidth: "320px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}

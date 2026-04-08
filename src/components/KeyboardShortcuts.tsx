import { useEffect, useCallback, useState } from "react";
import type { Theme } from "../types";

// ===========================================================================
// Shortcut Definitions
// ===========================================================================

interface Shortcut {
  key: string;
  description: string;
  group: "Navigation" | "Actions" | "Views";
}

const SHORTCUTS: Shortcut[] = [
  { key: "n", description: "New entry in current collection", group: "Actions" },
  { key: "/", description: "Focus search input", group: "Actions" },
  { key: "?", description: "Show keyboard shortcuts", group: "Views" },
  { key: "Esc", description: "Close any overlay", group: "Views" },
];

// ===========================================================================
// Hook: useKeyboardShortcuts
// ===========================================================================

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((document.activeElement as HTMLElement)?.isContentEditable) return true;
  return false;
}

function getCurrentCollection(): string | null {
  const path = window.location.hash.replace(/^#\/?/, "");
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 1) return segments[0];
  return null;
}

export function useKeyboardShortcuts(
  navigate: (path: string) => void,
): { overlayOpen: boolean; setOverlayOpen: (open: boolean) => void } {
  const [overlayOpen, setOverlayOpen] = useState<boolean>(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape always works
      if (e.key === "Escape") {
        setOverlayOpen(false);
        return;
      }

      // Skip if user is typing in an input
      if (isInputFocused()) return;

      // ? or Shift+/ => show shortcut overlay
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOverlayOpen((prev) => !prev);
        return;
      }

      // / => focus search input
      if (e.key === "/") {
        e.preventDefault();
        const event = new CustomEvent("sa:focus-search");
        window.dispatchEvent(event);
        return;
      }

      // n => navigate to new entry in current collection
      if (e.key === "n") {
        const collection = getCurrentCollection();
        if (collection) {
          e.preventDefault();
          navigate(`/${collection}/new`);
        }
        return;
      }
    },
    [navigate],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return { overlayOpen, setOverlayOpen };
}

// ===========================================================================
// Component: ShortcutOverlay
// ===========================================================================

interface ShortcutOverlayProps {
  open: boolean;
  onClose: () => void;
  theme: Theme;
}

export function ShortcutOverlay({ open, onClose, theme: t }: ShortcutOverlayProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const groups: Array<"Navigation" | "Actions" | "Views"> = [
    "Navigation",
    "Actions",
    "Views",
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: t.surface,
          border: `1px solid ${t.border}`,
          borderRadius: "12px",
          padding: "1.5rem",
          minWidth: "380px",
          maxWidth: "520px",
          width: "90vw",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.2rem",
              color: t.textBright,
              margin: 0,
            }}
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: t.textDim,
              fontSize: "1.2rem",
              cursor: "pointer",
              padding: "0.2rem",
              fontFamily: "inherit",
            }}
          >
            {"\u00D7"}
          </button>
        </div>

        {/* Shortcut groups */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {groups.map((group) => {
            const items = SHORTCUTS.filter((s) => s.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: t.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {group}
                </div>
                <div style={{ display: "grid", gap: "0.3rem" }}>
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.4rem 0.6rem",
                        background: t.surfaceHover,
                        borderRadius: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.82rem",
                          color: t.text,
                        }}
                      >
                        {shortcut.description}
                      </span>
                      <kbd
                        style={{
                          background: t.input,
                          border: `1px solid ${t.inputBorder}`,
                          borderRadius: "4px",
                          padding: "0.15rem 0.5rem",
                          fontSize: "0.75rem",
                          fontFamily: "'DM Sans',monospace",
                          color: t.textBright,
                          fontWeight: 600,
                          minWidth: "24px",
                          textAlign: "center",
                        }}
                      >
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div
          style={{
            fontSize: "0.7rem",
            color: t.textDim,
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          Press <strong>?</strong> to toggle this overlay
        </div>
      </div>
    </div>
  );
}

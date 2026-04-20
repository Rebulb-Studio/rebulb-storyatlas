/**
 * Quota-aware wrappers around localStorage. Every write path that used to
 * swallow QuotaExceededError silently now returns a Result so the caller can
 * toast the user instead of pretending the save succeeded.
 */

export type StorageResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "other"; error: unknown };

type QuotaListener = (key: string) => void;
const quotaListeners = new Set<QuotaListener>();

/** Subscribe to quota failures (called with the key that failed). */
export function onStorageQuota(fn: QuotaListener): () => void {
  quotaListeners.add(fn);
  return () => {
    quotaListeners.delete(fn);
  };
}

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number };
  if (e.name === "QuotaExceededError") return true;
  if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
  if (e.code === 22 || e.code === 1014) return true;
  return false;
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): StorageResult {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (err) {
    if (isQuotaError(err)) {
      quotaListeners.forEach((fn) => {
        try { fn(key); } catch { /* noop */ }
      });
      return { ok: false, reason: "quota", error: err };
    }
    // Safari private mode / disabled storage
    if (err instanceof Error && /SecurityError|NS_ERROR/.test(err.name)) {
      return { ok: false, reason: "unavailable", error: err };
    }
    return { ok: false, reason: "other", error: err };
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* noop */ }
}

export function safeSetJSON(key: string, value: unknown): StorageResult {
  try {
    return safeSetItem(key, JSON.stringify(value));
  } catch (err) {
    // JSON.stringify can throw on circular structures
    return { ok: false, reason: "other", error: err };
  }
}

export function safeGetJSON<T = unknown>(key: string): T | null {
  const raw = safeGetItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

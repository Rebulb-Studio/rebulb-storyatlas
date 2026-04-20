/**
 * IndexedDB-backed offline write queue.
 *
 * When an API write fails due to network/backend unreachable, the store
 * enqueues the intended write here. `drain()` is called on page load,
 * on `online` events, and after a successful `/api/health` probe — it
 * retries each pending write in order, with exponential backoff.
 *
 * Pending writes survive a full browser restart.
 */

const DB_NAME = "sa_writeQueue";
const DB_VERSION = 1;
const STORE = "pending";

export type QueuedWrite = {
  id: string;             // uuid, auto-assigned
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;            // absolute or /api-relative
  body?: unknown;         // JSON-stringifiable
  enqueuedAt: number;     // Date.now()
  attempts: number;
  lastError?: string;
  // Group key for ordering: writes sharing a groupKey are drained sequentially.
  // For an entry update, groupKey = "{collection}:{id}".
  groupKey?: string;
};

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("enqueuedAt", "enqueuedAt", { unique: false });
        store.createIndex("groupKey", "groupKey", { unique: false });
      }
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result: T | undefined;
    Promise.resolve(fn(store))
      .then((r) => { result = r; })
      .catch(reject);
    tx.oncomplete = () => resolve(result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function enqueueWrite(
  entry: Omit<QueuedWrite, "id" | "enqueuedAt" | "attempts">
): Promise<QueuedWrite> {
  const full: QueuedWrite = {
    id: randomId(),
    enqueuedAt: Date.now(),
    attempts: 0,
    ...entry,
  };
  try {
    await withStore("readwrite", (store) => {
      store.put(full);
    });
  } catch (err) {
    // IndexedDB unavailable — fall back to in-memory only (this session).
    // Caller still gets the queued item so it can react, but it's lost on reload.
    console.warn("[writeQueue] IndexedDB unavailable; write not persisted", err);
  }
  return full;
}

export async function listPending(): Promise<QueuedWrite[]> {
  try {
    const all = await withStore("readonly", (store) => {
      return new Promise<QueuedWrite[]>((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as QueuedWrite[]);
        req.onerror = () => reject(req.error);
      });
    });
    return all.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
  } catch {
    return [];
  }
}

export async function removePending(id: string): Promise<void> {
  try {
    await withStore("readwrite", (store) => {
      store.delete(id);
    });
  } catch { /* noop */ }
}

export async function updatePending(item: QueuedWrite): Promise<void> {
  try {
    await withStore("readwrite", (store) => {
      store.put(item);
    });
  } catch { /* noop */ }
}

export async function pendingCount(): Promise<number> {
  try {
    return await withStore("readonly", (store) => {
      return new Promise<number>((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    });
  } catch {
    return 0;
  }
}

const BACKOFF_MS = [1000, 2000, 5000, 15000, 60000];
const MAX_ATTEMPTS = BACKOFF_MS.length;

export interface DrainEvents {
  onFlushed?: (item: QueuedWrite) => void;
  onFailed?: (item: QueuedWrite, err: unknown) => void;
  onParked?: (item: QueuedWrite) => void;   // MAX_ATTEMPTS exhausted
}

let draining = false;

/** Drain all pending writes sequentially (per groupKey). Safe to call redundantly. */
export async function drainQueue(events: DrainEvents = {}): Promise<number> {
  if (draining) return 0;
  draining = true;
  let flushed = 0;
  try {
    const pending = await listPending();
    for (const item of pending) {
      const nextAttempt = item.attempts + 1;
      try {
        const res = await fetch(item.url, {
          method: item.method,
          headers: item.body !== undefined ? { "Content-Type": "application/json" } : undefined,
          body: item.body !== undefined ? JSON.stringify(item.body) : undefined,
        });
        if (!res.ok) {
          // 4xx is permanent — don't retry
          if (res.status >= 400 && res.status < 500) {
            await removePending(item.id);
            events.onFailed?.(item, new Error(`HTTP ${res.status}`));
            continue;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        await removePending(item.id);
        flushed++;
        events.onFlushed?.(item);
      } catch (err) {
        const updated: QueuedWrite = {
          ...item,
          attempts: nextAttempt,
          lastError: err instanceof Error ? err.message : String(err),
        };
        if (nextAttempt >= MAX_ATTEMPTS) {
          events.onParked?.(updated);
          // Keep it parked in the queue for manual retry, just don't auto-drain it anymore.
          await updatePending(updated);
          continue;
        }
        await updatePending(updated);
        const wait = BACKOFF_MS[Math.min(item.attempts, BACKOFF_MS.length - 1)];
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  } finally {
    draining = false;
  }
  return flushed;
}

/** Clear parked items (attempts >= MAX_ATTEMPTS) — used by a manual "discard" UI. */
export async function clearParked(): Promise<number> {
  const all = await listPending();
  const parked = all.filter((w) => w.attempts >= MAX_ATTEMPTS);
  for (const p of parked) await removePending(p.id);
  return parked.length;
}

/** Wire up browser `online` event + BroadcastChannel listener (cross-tab) to auto-drain. */
export function startQueueAutoDrain(events: DrainEvents = {}): () => void {
  const handler = () => { void drainQueue(events); };
  window.addEventListener("online", handler);
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel("sa_writeQueue");
    channel.onmessage = handler;
  } catch { /* older browsers */ }
  // First attempt now in case we have pending items from a previous session.
  void drainQueue(events);
  return () => {
    window.removeEventListener("online", handler);
    channel?.close();
  };
}

/** Notify other tabs a write was enqueued. */
export function notifyQueueChanged(): void {
  try {
    const channel = new BroadcastChannel("sa_writeQueue");
    channel.postMessage({ type: "changed", at: Date.now() });
    channel.close();
  } catch { /* noop */ }
}

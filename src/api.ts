import type { Entry, ProjectMeta } from "./types";

const API = "/api";

async function request(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      return res;
    } catch (err: unknown) {
      lastError = err;
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      if (err instanceof Error && /4\d\d/.test(err.message)) throw err;
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export async function loadAll(): Promise<Record<string, unknown>> {
  const res = await request(`${API}/all`);
  return res.json();
}

export async function createEntry(
  collection: string,
  data: Partial<Entry>
): Promise<Entry> {
  const res = await request(`${API}/${collection}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEntry(
  collection: string,
  id: string,
  data: Partial<Entry>
): Promise<Entry> {
  const res = await request(`${API}/${collection}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEntry(
  collection: string,
  id: string
): Promise<void> {
  await request(`${API}/${collection}/${id}`, { method: "DELETE" });
}

export async function updateMeta(
  data: Partial<ProjectMeta>,
  opts: { signal?: AbortSignal } = {}
): Promise<ProjectMeta> {
  const res = await request(
    `${API}/meta`,
    { method: "PUT", body: JSON.stringify(data), signal: opts.signal },
    1
  );
  return res.json();
}

export async function exportJSON(): Promise<void> {
  const res = await fetch(`${API}/export.json`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storyatlas_backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportZIP(): Promise<void> {
  const res = await fetch(`${API}/export.zip`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storyatlas_export.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importFile(file: File): Promise<unknown> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/import-file`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Import failed");
  }
  return res.json();
}

export async function importJSON(
  payload: Record<string, unknown>
): Promise<unknown> {
  const res = await request(`${API}/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ─── Search ─────────────────────────────────────────────────────────
export interface SearchParams {
  q?: string;
  collection?: string;
  status?: string;
  tag?: string;
  sort?: string;
}

export async function searchEntries(params: SearchParams): Promise<(Entry & { _collection?: string })[]> {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.collection) qs.set("collection", params.collection);
  if (params.status) qs.set("status", params.status);
  if (params.tag) qs.set("tag", params.tag);
  if (params.sort) qs.set("sort", params.sort);
  const res = await request(`${API}/search?${qs.toString()}`);
  return res.json();
}

// ─── Tags ────────────────────────────────────────────────────────────
export async function getAllTags(): Promise<string[]> {
  const res = await request(`${API}/tags`);
  return res.json();
}

// ─── Bulk Operations ─────────────────────────────────────────────────
interface BulkItem {
  collection: string;
  id: string;
}

export async function bulkDelete(items: BulkItem[]): Promise<{ deleted: number }> {
  const res = await request(`${API}/bulk/delete`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return res.json();
}

export async function bulkTag(items: BulkItem[], tag: string): Promise<{ updated: number }> {
  const res = await request(`${API}/bulk/tag`, {
    method: "POST",
    body: JSON.stringify({ items, tag }),
  });
  return res.json();
}

export async function bulkStatus(items: BulkItem[], status: string): Promise<{ updated: number }> {
  const res = await request(`${API}/bulk/status`, {
    method: "POST",
    body: JSON.stringify({ items, status }),
  });
  return res.json();
}

// ─── Selective Export ────────────────────────────────────────────────
export async function exportSelective(collections: string[], format: "json" | "csv" = "json"): Promise<void> {
  const res = await fetch(`${API}/export/selective`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collections, format }),
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = format === "csv" ? "storyatlas_export.csv" : "storyatlas_selective.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ─── Comments ───────────────────────────────────────────────────────
export interface Comment {
  id: string;
  entryId: string;
  collection: string;
  content: string;
  author: string;
  createdAt: string;
}

export async function getComments(collection: string, entryId: string): Promise<Comment[]> {
  const res = await request(`${API}/${collection}/${entryId}/comments`);
  return res.json();
}

export async function addComment(collection: string, entryId: string, content: string, author = "Author"): Promise<Comment> {
  const res = await request(`${API}/${collection}/${entryId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, author }),
  });
  return res.json();
}

export async function deleteComment(collection: string, entryId: string, commentId: string): Promise<void> {
  await request(`${API}/${collection}/${entryId}/comments/${commentId}`, { method: "DELETE" });
}

// ─── Share Links ────────────────────────────────────────────────────
export async function createShareLink(): Promise<{ token: string }> {
  const res = await request(`${API}/share`, { method: "POST" });
  return res.json();
}

export async function getSharedData(token: string): Promise<Record<string, unknown>> {
  const res = await request(`${API}/shared/${token}`);
  return res.json();
}

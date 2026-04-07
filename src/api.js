const API = "/api";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res;
}

export async function loadAll() {
  const res = await request(`${API}/all`);
  return res.json();
}

export async function createEntry(collection, data) {
  const res = await request(`${API}/${collection}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEntry(collection, id, data) {
  const res = await request(`${API}/${collection}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEntry(collection, id) {
  await request(`${API}/${collection}/${id}`, { method: "DELETE" });
}

export async function updateMeta(data) {
  const res = await request(`${API}/meta`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function exportJSON() {
  const res = await fetch(`${API}/export.json`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storyatlas_backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function exportZIP() {
  const res = await fetch(`${API}/export.zip`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "storyatlas_export.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importFile(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/import-file`, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Import failed");
  }
  return res.json();
}

export async function importJSON(payload) {
  const res = await request(`${API}/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
}

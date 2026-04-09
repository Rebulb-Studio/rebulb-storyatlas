// ─── Core Types ──────────────────────────────────────────────────────

export interface Entry {
  id: string;
  name?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  _collection?: string;
  [key: string]: unknown;
}

export interface ProjectMeta {
  projectName: string;
  genre: string;
  format: string;
  description: string;
  author: string;
  scratchpad?: string;
  canvasNotes?: StickyNote[];
  series?: SeriesEntry[];
  [key: string]: unknown;
}

export interface SeriesEntry {
  id: string;
  title: string;
  genre: string;
  format: string;
  status: string;
  synopsis: string;
  targetAudience: string;
  chapterCount: number | string;
  tags: string;
  coverConcept: string;
  createdAt?: string;
}

export interface StickyNote {
  id: string;
  text: string;
  column: string;
}

export interface Toast {
  id: number;
  message: string;
  type: "info" | "success" | "error";
  exiting?: boolean;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface FieldDef {
  k: string;
  l: string;
  t: "text" | "select" | "textarea" | "tags";
  opts?: string[];
}

export interface CollectionDef {
  label: string;
  icon: string;
  color: string;
  group?: string;
  fields?: FieldDef[];
}

export interface FormatPreset {
  label: string;
  icon: string;
  chapterWords: string;
  volumeChapters: string;
  pov: string;
  tense: string;
  notes: string;
}

export interface OutlineMethod {
  id: string;
  label: string;
  desc: string;
  beats: string[];
}

export interface Theme {
  bg: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderHover: string;
  text: string;
  textMuted: string;
  textDim: string;
  textBright: string;
  accent: string;
  accentDim: string;
  input: string;
  inputBorder: string;
  danger: string;
  success: string;
  info: string;
}

export type CollectionData = Record<string, Entry[]>;

// Route params
export interface CollectionParams {
  collection: string;
  id?: string;
}

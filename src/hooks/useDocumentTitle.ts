import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDataStore } from "../stores/useDataStore";
import { COLLECTION_DEFS, WORKSPACE_SECTIONS } from "../constants";

export function useDocumentTitle() {
  const { pathname } = useLocation();
  const data = useDataStore((s) => s.data);

  useEffect(() => {
    const parts = pathname.split("/").filter(Boolean);
    let title = "StoryAtlas";

    if (parts.length === 0) {
      title = "Home — StoryAtlas";
    } else if (parts[0] === "workspace" && parts[1]) {
      const ws = WORKSPACE_SECTIONS[parts[1]];
      title = ws ? `${ws.label} — StoryAtlas` : "Workspace — StoryAtlas";
    } else if (parts[0] === "publish" && parts[1]) {
      title = "Publish — StoryAtlas";
    } else if (parts[0] === "search") {
      title = "Search — StoryAtlas";
    } else if (parts[0] === "writing-tools") {
      title = "Writing Tools — StoryAtlas";
    } else if (parts[0] === "upgrade") {
      title = "Upgrade to Pro — StoryAtlas";
    } else if (parts[0] === "progress") {
      title = "Progress — StoryAtlas";
    } else if (parts[0] === "calendar") {
      title = "Calendar — StoryAtlas";
    } else if (COLLECTION_DEFS[parts[0]]) {
      const col = COLLECTION_DEFS[parts[0]];
      if (parts[1] === "new") {
        title = `New ${col.label.replace(/s$/, "")} — StoryAtlas`;
      } else if (parts[1]) {
        const entry = (data[parts[0]] || []).find((e) => e.id === parts[1]);
        const name = entry ? ((entry.name as string) || (entry.title as string) || "Untitled") : "";
        title = name ? `${name} — ${col.label} — StoryAtlas` : `${col.label} — StoryAtlas`;
      } else {
        title = `${col.label} — StoryAtlas`;
      }
    }

    document.title = title;
  }, [pathname, data]);
}

import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "../stores/useUIStore";
import { useProjectStore } from "../stores/useProjectStore";
import { useDataStore } from "../stores/useDataStore";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      darkMode: true,
      sidebarOpen: true,
      cmdOpen: false,
      toasts: [],
      saveStatus: "idle",
      filterText: "",
      searchQuery: "",
      showOnboarding: false,
      onboardingStep: 0,
    });
  });

  it("toggles dark mode", () => {
    expect(useUIStore.getState().darkMode).toBe(true);
    useUIStore.getState().toggleDarkMode();
    expect(useUIStore.getState().darkMode).toBe(false);
  });

  it("adds and removes toasts", async () => {
    useUIStore.getState().toast("Test message", "info");
    expect(useUIStore.getState().toasts).toHaveLength(1);
    expect(useUIStore.getState().toasts[0].message).toBe("Test message");
    expect(useUIStore.getState().toasts[0].type).toBe("info");
  });

  it("manages sidebar state", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it("manages command palette state", () => {
    expect(useUIStore.getState().cmdOpen).toBe(false);
    useUIStore.getState().setCmdOpen(true);
    expect(useUIStore.getState().cmdOpen).toBe(true);
  });

  it("manages search query", () => {
    useUIStore.getState().setSearchQuery("test");
    expect(useUIStore.getState().searchQuery).toBe("test");
  });

  it("sets save status", () => {
    useUIStore.getState().setSaveStatus("saving");
    expect(useUIStore.getState().saveStatus).toBe("saving");
  });
});

describe("useProjectStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      meta: { projectName: "", genre: "", format: "novel", description: "", author: "" },
      scratchpadText: "",
      promptIndex: 0,
    });
  });

  it("sets meta values", () => {
    useProjectStore.getState().setMeta({ projectName: "My Project" });
    expect(useProjectStore.getState().meta.projectName).toBe("My Project");
  });

  it("preserves other meta when updating", () => {
    useProjectStore.getState().setMeta({ projectName: "Test", genre: "Fantasy" });
    useProjectStore.getState().setMeta({ author: "Alice" });
    const { meta } = useProjectStore.getState();
    expect(meta.projectName).toBe("Test");
    expect(meta.genre).toBe("Fantasy");
    expect(meta.author).toBe("Alice");
  });

  it("manages scratchpad text", () => {
    useProjectStore.getState().setScratchpadText("Hello world");
    expect(useProjectStore.getState().scratchpadText).toBe("Hello world");
  });

  it("increments prompt index", () => {
    expect(useProjectStore.getState().promptIndex).toBe(0);
    useProjectStore.getState().nextPrompt();
    expect(useProjectStore.getState().promptIndex).toBe(1);
  });
});

describe("useDataStore", () => {
  beforeEach(() => {
    useDataStore.setState({ data: {}, loaded: false });
  });

  it("sets data", () => {
    useDataStore.getState().setData({
      characters: [{ id: "1", name: "Alice" }],
    });
    expect(useDataStore.getState().data.characters).toHaveLength(1);
    expect(useDataStore.getState().data.characters![0].name).toBe("Alice");
  });

  it("starts with empty data", () => {
    expect(useDataStore.getState().loaded).toBe(false);
    expect(Object.keys(useDataStore.getState().data)).toHaveLength(0);
  });
});

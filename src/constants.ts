import type { CollectionDef, FormatPreset, OutlineMethod, Theme } from "./types";

// ─── Format Presets ────────────────────────────────────────────────────
export const FORMAT_PRESETS: Record<string, FormatPreset> = {
  lightNovel: { label: "Light Novel", icon: "\u{1F4D6}", chapterWords: "4000\u20136000", volumeChapters: "8\u201312", pov: "First Person", tense: "Past", notes: "Internal monologue heavy, short punchy chapters, cliffhangers, illustrations every 30\u201350 pages" },
  graphicNovel: { label: "Graphic Novel", icon: "\u{1F3A8}", chapterWords: "Script pages", volumeChapters: "22\u201328 pages", pov: "Third Limited / Visual", tense: "Present (visual)", notes: "Panel-driven, 5\u20137 panels/page avg, splash pages for impact, visual metaphors, minimal exposition" },
  manga: { label: "Manga", icon: "\u2B1B", chapterWords: "16\u201320 pages", volumeChapters: "8\u201310 chapters/volume", pov: "Multiple", tense: "Visual Present", notes: "Right-to-left, speed lines, SD moments, double-page spreads, weekly/monthly rhythm" },
  webtoon: { label: "Webtoon", icon: "\u{1F4F1}", chapterWords: "60\u201380 panels", volumeChapters: "Season-based (50\u201380 eps)", pov: "Third Limited", tense: "Present", notes: "Vertical scroll, one panel wide, color mandatory, hook in first 3 panels, end-of-ep cliffhanger" },
  novel: { label: "Novel", icon: "\u{1F4D5}", chapterWords: "3000\u20135000", volumeChapters: "20\u201335 chapters", pov: "Third Limited / Multiple", tense: "Past", notes: "Deep prose, subtext, thematic density, scene-sequel rhythm" },
  webSerial: { label: "Web Serial", icon: "\u{1F310}", chapterWords: "2000\u20134000", volumeChapters: "Arc-based", pov: "First / Third", tense: "Past / Present", notes: "Frequent releases, strong hooks, community engagement, progression fantasy popular" },
  screenplay: { label: "Screenplay", icon: "\u{1F3AC}", chapterWords: "Scene-based", volumeChapters: "3 Acts / 8 Sequences", pov: "Camera", tense: "Present", notes: "Slug lines, action blocks, parentheticals, 1 page \u2248 1 minute" },
};

// ─── Outline Methods ──────────────────────────────────────────────────
export const OUTLINE_METHODS: OutlineMethod[] = [
  { id: "threeAct", label: "Three-Act Structure", desc: "Setup \u2192 Confrontation \u2192 Resolution", beats: ["Hook","Inciting Incident","First Plot Point","Rising Action","Midpoint","Crisis","Climax","Falling Action","Resolution"] },
  { id: "kishotenketsu", label: "Kish\u014Dtenketsu", desc: "Introduction \u2192 Development \u2192 Twist \u2192 Conclusion (no central conflict required)", beats: ["Ki (Introduction)","Sh\u014D (Development)","Ten (Twist/Complication)","Ketsu (Conclusion)"] },
  { id: "saveTheCat", label: "Save the Cat!", desc: "15-beat structure for compelling narrative pacing", beats: ["Opening Image","Theme Stated","Setup","Catalyst","Debate","Break into Two","B Story","Fun and Games","Midpoint","Bad Guys Close In","All Is Lost","Dark Night of Soul","Break into Three","Finale","Final Image"] },
  { id: "heros", label: "Hero's Journey", desc: "Campbell/Vogler monomyth", beats: ["Ordinary World","Call to Adventure","Refusal","Meeting the Mentor","Crossing the Threshold","Tests, Allies, Enemies","Approach","Ordeal","Reward","The Road Back","Resurrection","Return with Elixir"] },
  { id: "snowflake", label: "Snowflake Method", desc: "Fractal expansion from sentence to full outline", beats: ["One-Sentence Summary","One-Paragraph Summary","Character Summaries","Expand to Full Page","Character Synopses","Expand to 4 Pages","Character Charts","Scene List","Scene Details"] },
  { id: "sevenPoint", label: "Seven-Point Story", desc: "Dan Wells method \u2014 work backwards from resolution", beats: ["Hook","Plot Turn 1","Pinch Point 1","Midpoint","Pinch Point 2","Plot Turn 2","Resolution"] },
  { id: "fichtean", label: "Fichtean Curve", desc: "Start in crisis \u2014 no slow setup, immediate tension", beats: ["Crisis 1 (Opening)","Rising Crises","Crisis Escalation","Climax","Falling Action"] },
];

export const SCENE_TYPES = ["Action","Dialogue","Exposition","Flashback","Dream","Training","Battle","Revelation","Romance","Aftermath","Travel","Political","Ritual","Transformation","Death","Reunion","Betrayal","Escape","Investigation","Duel"];
export const EMOTIONS = ["Tension","Joy","Grief","Rage","Fear","Wonder","Disgust","Hope","Despair","Love","Betrayal","Triumph","Melancholy","Dread","Relief","Confusion","Determination","Nostalgia"];
export const PACING = ["Slow Burn","Building","Moderate","Intense","Breakneck","Reflective","Montage"];

// ─── Collection Definitions ───────────────────────────────────────────
export const COLLECTION_DEFS: Record<string, CollectionDef> = {
  characters: {
    label: "Characters", icon: "\u25C8", color: "#8b5cf6", group: "WIKI",
    fields: [
      { k:"name", l:"Full Name", t:"text" },
      { k:"aliases", l:"Aliases", t:"tags" },
      { k:"status", l:"Status", t:"select", opts:["Alive","Deceased","Missing","Unknown","Sealed","Transformed"] },
      { k:"role", l:"Story Role", t:"select", opts:["Protagonist","Deuteragonist","Tritagonist","Antagonist","Supporting","Mentor","Rival","Love Interest","Comic Relief","Minor","Narrator"] },
      { k:"archetype", l:"Character Archetype", t:"select", opts:["The Chosen One","The Outsider","The Mentor","The Trickster","The Shadow","The Herald","The Shapeshifter","The Guardian","The Everyperson","The Rebel","The Explorer","The Sage","The Lover","The Ruler","Custom"] },
      { k:"affiliation", l:"Affiliation", t:"text" },
      { k:"age", l:"Age", t:"text" },
      { k:"powerTier", l:"Power Tier", t:"select", opts:["S-Tier","A-Tier","B-Tier","C-Tier","D-Tier","Non-combatant","Unknown","Varies","Sealed"] },
      { k:"appearance", l:"Appearance", t:"textarea" },
      { k:"personality", l:"Personality", t:"textarea" },
      { k:"motivations", l:"Motivations & Desires", t:"textarea" },
      { k:"fears", l:"Fears & Weaknesses", t:"textarea" },
      { k:"background", l:"Background / Biography", t:"textarea" },
      { k:"abilities", l:"Abilities & Powers", t:"textarea" },
      { k:"fightingStyle", l:"Fighting Style / Combat Notes", t:"textarea" },
      { k:"voiceProfile", l:"Dialogue Voice Profile", t:"textarea" },
      { k:"speechPatterns", l:"Speech Patterns & Verbal Tics", t:"text" },
      { k:"internalMonologue", l:"Internal Monologue Style", t:"textarea" },
      { k:"relationships", l:"Key Relationships", t:"textarea" },
      { k:"arcSummary", l:"Character Arc Summary", t:"textarea" },
      { k:"lies", l:"The Lie They Believe", t:"text" },
      { k:"truth", l:"The Truth They Must Learn", t:"text" },
      { k:"ghost", l:"The Ghost (Backstory Wound)", t:"textarea" },
      { k:"storyNotes", l:"Author Notes", t:"textarea" },
      { k:"visualRef", l:"Visual Reference Notes", t:"textarea" },
      { k:"quotes", l:"Signature Quotes", t:"textarea" },
    ]
  },
  locations: {
    label: "Locations", icon: "\u25C9", color: "#10b981", group: "WIKI",
    fields: [
      { k:"name", l:"Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["City","District","Building","Region","Nation","Continent","Realm","Landmark","Underground","Floating","Pocket Dimension","Ruin","Other"] },
      { k:"status", l:"Status", t:"select", opts:["Active","Hidden","Abandoned","Destroyed","Sealed","Contested","Under Construction","Unknown"] },
      { k:"region", l:"Region / Parent Location", t:"text" },
      { k:"controlledBy", l:"Controlled By", t:"text" },
      { k:"population", l:"Population / Scale", t:"text" },
      { k:"overview", l:"Overview", t:"textarea" },
      { k:"geography", l:"Geography & Layout", t:"textarea" },
      { k:"atmosphere", l:"Sensory Atmosphere", t:"textarea" },
      { k:"landmarks", l:"Sub-Locations & Landmarks", t:"textarea" },
      { k:"inhabitants", l:"Inhabitants & Culture", t:"textarea" },
      { k:"history", l:"History", t:"textarea" },
      { k:"secrets", l:"Hidden Secrets", t:"textarea" },
      { k:"storySignificance", l:"Story Significance", t:"textarea" },
      { k:"visualRef", l:"Visual Reference Notes", t:"textarea" },
      { k:"mapX", l:"Map X Coordinate", t:"text" },
      { k:"mapY", l:"Map Y Coordinate", t:"text" },
    ]
  },
  factions: {
    label: "Factions", icon: "\u25C6", color: "#ef4444", group: "WIKI",
    fields: [
      { k:"name", l:"Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Government","Military","Secret Society","Criminal","Religious","Bloodline","Corporate","Resistance","Academy","Guild","Mercenary","Other"] },
      { k:"status", l:"Status", t:"select", opts:["Active","Covert","Dormant","Fractured","Disbanded","Rising","Falling","Unknown"] },
      { k:"leader", l:"Leader", t:"text" },
      { k:"territory", l:"Territory", t:"text" },
      { k:"overview", l:"Overview", t:"textarea" },
      { k:"ideology", l:"Ideology & Beliefs", t:"textarea" },
      { k:"goals", l:"Goals", t:"textarea" },
      { k:"hierarchy", l:"Hierarchy & Ranks", t:"textarea" },
      { k:"resources", l:"Resources & Assets", t:"textarea" },
      { k:"members", l:"Notable Members", t:"textarea" },
      { k:"allies", l:"Allies", t:"tags" },
      { k:"enemies", l:"Enemies", t:"tags" },
      { k:"secrets", l:"Secrets & Hidden Agendas", t:"textarea" },
      { k:"history", l:"History & Origin", t:"textarea" },
      { k:"storyRole", l:"Story Role", t:"textarea" },
    ]
  },
  items: {
    label: "Items & Artifacts", icon: "\u25C7", color: "#f59e0b", group: "WIKI",
    fields: [
      { k:"name", l:"Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Weapon","Armor","Tool","Key Item","Relic","Consumable","Vehicle","Document","Currency","Other"] },
      { k:"status", l:"Status", t:"select", opts:["In Use","Lost","Destroyed","Sealed","Hidden","Dormant","Unknown"] },
      { k:"owner", l:"Current Owner", t:"text" },
      { k:"origin", l:"Origin", t:"textarea" },
      { k:"abilities", l:"Abilities & Properties", t:"textarea" },
      { k:"cost", l:"Cost of Use", t:"textarea" },
      { k:"forms", l:"Alternate Forms", t:"textarea" },
      { k:"history", l:"History", t:"textarea" },
      { k:"storySignificance", l:"Story Significance", t:"textarea" },
      { k:"appearance", l:"Appearance", t:"textarea" },
    ]
  },
  lore: {
    label: "Lore & Concepts", icon: "\u25CE", color: "#06b6d4", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Name", t:"text" },
      { k:"category", l:"Category", t:"select", opts:["Myth","Legend","Prophecy","Law","Science","Philosophy","Religion","Taboo","Custom","Theory","Secret","Other"] },
      { k:"overview", l:"Overview", t:"textarea" },
      { k:"details", l:"Detailed Explanation", t:"textarea" },
      { k:"publicKnowledge", l:"What the Public Knows", t:"textarea" },
      { k:"hiddenTruth", l:"Hidden Truth", t:"textarea" },
      { k:"impact", l:"Impact on Story", t:"textarea" },
    ]
  },
  history: {
    label: "World History", icon: "\u2295", color: "#7c3aed", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Event Name", t:"text" },
      { k:"era", l:"Era / Period", t:"text" },
      { k:"date", l:"Date (In-World)", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["War","Discovery","Catastrophe","Founding","Political","Cultural","Technological","Supernatural","Personal","Other"] },
      { k:"scale", l:"Scale", t:"select", opts:["Global","Continental","National","Regional","Local","Personal"] },
      { k:"overview", l:"Overview", t:"textarea" },
      { k:"causes", l:"Causes", t:"textarea" },
      { k:"consequences", l:"Consequences", t:"textarea" },
      { k:"keyFigures", l:"Key Figures", t:"textarea" },
      { k:"legacy", l:"Legacy / Modern Impact", t:"textarea" },
    ]
  },
  systems: {
    label: "Power Systems", icon: "\u2297", color: "#3b82f6", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"System Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Magic","Technology","Martial","Psychic","Biological","Divine","Alchemical","Contractual","Hybrid","Other"] },
      { k:"overview", l:"Overview / Core Concept", t:"textarea" },
      { k:"source", l:"Source of Power", t:"textarea" },
      { k:"mechanics", l:"Mechanics & Rules", t:"textarea" },
      { k:"disciplines", l:"Disciplines / Sub-Systems", t:"textarea" },
      { k:"tiers", l:"Tiers / Levels / Rankings", t:"textarea" },
      { k:"costs", l:"Costs & Limitations", t:"textarea" },
      { k:"counters", l:"Counters & Weaknesses", t:"textarea" },
      { k:"training", l:"How It's Learned / Acquired", t:"textarea" },
      { k:"socialImpact", l:"Social / Political Impact", t:"textarea" },
      { k:"forbiddenUses", l:"Forbidden / Taboo Uses", t:"textarea" },
      { k:"evolution", l:"How It Evolves / Upgrades", t:"textarea" },
      { k:"visualManifest", l:"Visual Manifestation", t:"textarea" },
      { k:"storyNotes", l:"Story Notes", t:"textarea" },
    ]
  },
  cultures: {
    label: "Cultures", icon: "\u2298", color: "#ec4899", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Name", t:"text" },
      { k:"region", l:"Region", t:"text" },
      { k:"overview", l:"Overview", t:"textarea" },
      { k:"values", l:"Core Values & Beliefs", t:"textarea" },
      { k:"customs", l:"Customs & Rituals", t:"textarea" },
      { k:"language", l:"Language & Communication", t:"textarea" },
      { k:"clothing", l:"Clothing & Aesthetics", t:"textarea" },
      { k:"food", l:"Food & Drink", t:"textarea" },
      { k:"arts", l:"Arts & Entertainment", t:"textarea" },
      { k:"socialStructure", l:"Social Structure & Classes", t:"textarea" },
      { k:"taboos", l:"Taboos & Forbidden Things", t:"textarea" },
      { k:"naming", l:"Naming Conventions", t:"textarea" },
    ]
  },
  languages: {
    label: "Languages & Naming", icon: "\u{1F5E3}", color: "#0ea5e9", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Language Name", t:"text" },
      { k:"speakers", l:"Who Speaks It", t:"text" },
      { k:"overview", l:"Overview & Feel", t:"textarea" },
      { k:"phonetics", l:"Phonetic Rules", t:"textarea" },
      { k:"grammar", l:"Grammar Notes", t:"textarea" },
      { k:"namingConventions", l:"Naming Conventions", t:"textarea" },
      { k:"commonWords", l:"Common Words / Phrases", t:"textarea" },
      { k:"insults", l:"Insults & Slang", t:"textarea" },
      { k:"honorifics", l:"Honorifics & Titles", t:"textarea" },
      { k:"writingSystem", l:"Writing System Notes", t:"textarea" },
    ]
  },
  timelineEvents: {
    label: "Timeline", icon: "\u22A0", color: "#f59e0b", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Event Name", t:"text" },
      { k:"date", l:"Date", t:"text" },
      { k:"dateValue", l:"Sort Order Value", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["War","Birth","Death","Discovery","Catastrophe","Political","Cultural","Personal","Founding","Other"] },
      { k:"scale", l:"Scale", t:"select", opts:["Global","Continental","National","Regional","Local","Personal"] },
      { k:"overview", l:"Overview", t:"textarea" },
    ]
  },
  plots: {
    label: "Plots & Arcs", icon: "\u229E", color: "#8b5cf6", group: "STORY",
    fields: [
      { k:"name", l:"Arc Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Main Plot","Subplot","Character Arc","Romance Arc","Mystery","Revenge","Political","War","Training","Tournament","Heist","Redemption","Tragedy","Coming of Age","Other"] },
      { k:"status", l:"Status", t:"select", opts:["Planned","In Progress","Complete","Abandoned","Reworking"] },
      { k:"volume", l:"Volume / Part", t:"text" },
      { k:"method", l:"Structure Method", t:"select", opts:["Three-Act","Kish\u014Dtenketsu","Save the Cat","Hero's Journey","Snowflake","Seven-Point","Fichtean","Custom"] },
      { k:"synopsis", l:"Synopsis", t:"textarea" },
      { k:"conflict", l:"Central Conflict", t:"textarea" },
      { k:"stakes", l:"Stakes", t:"textarea" },
      { k:"incitingIncident", l:"Inciting Incident", t:"textarea" },
      { k:"midpoint", l:"Midpoint / Twist", t:"textarea" },
      { k:"climax", l:"Climax", t:"textarea" },
      { k:"resolution", l:"Resolution", t:"textarea" },
      { k:"themes", l:"Themes", t:"tags" },
      { k:"characters", l:"Key Characters", t:"tags" },
      { k:"foreshadowing", l:"Foreshadowing Seeds", t:"textarea" },
      { k:"payoffs", l:"Payoffs & Callbacks", t:"textarea" },
      { k:"emotionalArc", l:"Emotional Arc", t:"textarea" },
    ]
  },
  chapters: {
    label: "Chapters", icon: "\u2261", color: "#0891b2", group: "STORY",
    fields: [
      { k:"name", l:"Chapter Title", t:"text" },
      { k:"number", l:"Chapter Number", t:"text" },
      { k:"volume", l:"Volume / Part", t:"text" },
      { k:"arc", l:"Parent Arc", t:"text" },
      { k:"pov", l:"POV Character", t:"text" },
      { k:"status", l:"Status", t:"select", opts:["Outline","First Draft","Revised","Polished","Final","Cut"] },
      { k:"wordCount", l:"Word Count / Page Count", t:"text" },
      { k:"synopsis", l:"Synopsis", t:"textarea" },
      { k:"openingHook", l:"Opening Hook", t:"textarea" },
      { k:"closingHook", l:"Closing Hook / Cliffhanger", t:"textarea" },
      { k:"scenes", l:"Scene Breakdown", t:"textarea" },
      { k:"emotionalBeat", l:"Emotional Beat", t:"select", opts: EMOTIONS },
      { k:"pacing", l:"Pacing", t:"select", opts: PACING },
      { k:"reveals", l:"Reveals & Info Drops", t:"textarea" },
      { k:"foreshadowing", l:"Foreshadowing Planted", t:"textarea" },
      { k:"payoffs", l:"Payoffs Delivered", t:"textarea" },
      { k:"notes", l:"Author Notes", t:"textarea" },
    ]
  },
  scenes: {
    label: "Scenes", icon: "\u25B8", color: "#f97316", group: "STORY",
    fields: [
      { k:"name", l:"Scene Title", t:"text" },
      { k:"chapter", l:"Parent Chapter", t:"text" },
      { k:"type", l:"Scene Type", t:"select", opts: SCENE_TYPES },
      { k:"pov", l:"POV Character", t:"text" },
      { k:"location", l:"Location", t:"text" },
      { k:"time", l:"Time (In-World)", t:"text" },
      { k:"present", l:"Characters Present", t:"tags" },
      { k:"goal", l:"Scene Goal (Character)", t:"textarea" },
      { k:"conflict", l:"Scene Conflict", t:"textarea" },
      { k:"outcome", l:"Outcome", t:"select", opts:["Success","Failure","Complication","Pyrrhic Victory","Revelation","Cliffhanger"] },
      { k:"sequel", l:"Sequel (Reaction/Decision)", t:"textarea" },
      { k:"emotionalBeat", l:"Emotional Beat", t:"select", opts: EMOTIONS },
      { k:"pacing", l:"Pacing", t:"select", opts: PACING },
      { k:"sensory", l:"Sensory Details", t:"textarea" },
      { k:"dialogue", l:"Key Dialogue / Lines", t:"textarea" },
      { k:"subtext", l:"Subtext & Unspoken", t:"textarea" },
      { k:"foreshadowing", l:"Foreshadowing", t:"textarea" },
      { k:"notes", l:"Author Notes", t:"textarea" },
    ]
  },
  volumes: {
    label: "Volumes / Parts", icon: "\u{1F4DA}", color: "#6366f1", group: "STORY",
    fields: [
      { k:"name", l:"Volume Title", t:"text" },
      { k:"number", l:"Volume Number", t:"text" },
      { k:"subtitle", l:"Subtitle / Tagline", t:"text" },
      { k:"format", l:"Format", t:"select", opts: Object.keys(FORMAT_PRESETS).map(k => FORMAT_PRESETS[k].label) },
      { k:"status", l:"Status", t:"select", opts:["Planned","Outlining","Drafting","Revising","Complete","Published"] },
      { k:"synopsis", l:"Synopsis", t:"textarea" },
      { k:"arcs", l:"Arcs Covered", t:"tags" },
      { k:"chapters", l:"Chapter List (ordered)", t:"textarea" },
      { k:"themes", l:"Central Themes", t:"tags" },
      { k:"openingImage", l:"Opening Image / Scene", t:"textarea" },
      { k:"closingImage", l:"Closing Image / Scene", t:"textarea" },
      { k:"targetWordCount", l:"Target Word/Page Count", t:"text" },
      { k:"coverConcept", l:"Cover Art Concept", t:"textarea" },
      { k:"backBlurb", l:"Back Cover Blurb", t:"textarea" },
      { k:"notes", l:"Author Notes", t:"textarea" },
    ]
  },
  combatSequences: {
    label: "Combat Design", icon: "\u2694", color: "#dc2626", group: "CREATIVE",
    fields: [
      { k:"name", l:"Fight Name", t:"text" },
      { k:"chapter", l:"Chapter / Scene", t:"text" },
      { k:"combatants", l:"Combatants", t:"tags" },
      { k:"location", l:"Location", t:"text" },
      { k:"stakes", l:"Stakes", t:"textarea" },
      { k:"emotionalCore", l:"Emotional Core", t:"textarea" },
      { k:"setup", l:"Setup / Pre-Fight Tension", t:"textarea" },
      { k:"phases", l:"Fight Phases (Beats)", t:"textarea" },
      { k:"turningPoint", l:"Turning Point", t:"textarea" },
      { k:"resolution", l:"Resolution", t:"textarea" },
      { k:"injuries", l:"Injuries & Costs", t:"textarea" },
      { k:"aftermath", l:"Aftermath / Emotional Fallout", t:"textarea" },
      { k:"powersUsed", l:"Powers / Techniques Used", t:"textarea" },
      { k:"choreography", l:"Choreography Notes", t:"textarea" },
      { k:"panelNotes", l:"Panel / Visual Notes (for GN/Manga)", t:"textarea" },
    ]
  },
  themes: {
    label: "Themes & Motifs", icon: "\u2726", color: "#a855f7", group: "CREATIVE",
    fields: [
      { k:"name", l:"Theme / Motif Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Theme","Motif","Symbol","Recurring Image","Philosophical Question","Paradox"] },
      { k:"statement", l:"Thematic Statement", t:"textarea" },
      { k:"forIt", l:"Characters / Arcs That Argue FOR", t:"textarea" },
      { k:"againstIt", l:"Characters / Arcs That Argue AGAINST", t:"textarea" },
      { k:"appearances", l:"Where It Appears (Chapters/Scenes)", t:"textarea" },
      { k:"evolution", l:"How It Evolves Across the Story", t:"textarea" },
      { k:"resolution", l:"How It Resolves", t:"textarea" },
    ]
  },
  foreshadowing: {
    label: "Foreshadowing", icon: "\u{1F52E}", color: "#7c3aed", group: "CREATIVE",
    fields: [
      { k:"name", l:"Seed Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Dialogue","Object","Event","Name","Visual","Structural","Thematic","Character Behavior"] },
      { k:"planted", l:"Where Planted", t:"text" },
      { k:"payoff", l:"Where It Pays Off", t:"text" },
      { k:"status", l:"Status", t:"select", opts:["Planted","Partially Paid Off","Fully Resolved","Abandoned","Redirected"] },
      { k:"subtlety", l:"Subtlety Level", t:"select", opts:["Blatant","Moderate","Subtle","Hidden in Plain Sight"] },
      { k:"description", l:"Description", t:"textarea" },
      { k:"notes", l:"Notes", t:"textarea" },
    ]
  },
  dialogueVoices: {
    label: "Dialogue Voices", icon: "\u{1F4AC}", color: "#14b8a6", group: "CREATIVE",
    fields: [
      { k:"name", l:"Character Name", t:"text" },
      { k:"vocabulary", l:"Vocabulary Level", t:"select", opts:["Simple","Casual","Educated","Formal","Archaic","Technical","Street","Mixed"] },
      { k:"sentenceLength", l:"Sentence Length Tendency", t:"select", opts:["Very Short","Short","Medium","Long","Varies Wildly"] },
      { k:"speechPatterns", l:"Speech Patterns & Tics", t:"textarea" },
      { k:"catchphrases", l:"Catchphrases / Verbal Habits", t:"textarea" },
      { k:"tone", l:"Default Tone", t:"textarea" },
      { k:"underPressure", l:"How They Speak Under Pressure", t:"textarea" },
      { k:"lying", l:"How They Sound When Lying", t:"textarea" },
      { k:"emotional", l:"How They Sound When Emotional", t:"textarea" },
      { k:"exampleLines", l:"Example Lines", t:"textarea" },
    ]
  },
  panels: {
    label: "Panel Layouts", icon: "\u2B1A", color: "#f43f5e", group: "CREATIVE",
    fields: [
      { k:"name", l:"Page / Panel Set Name", t:"text" },
      { k:"chapter", l:"Chapter", t:"text" },
      { k:"pageNumber", l:"Page Number(s)", t:"text" },
      { k:"panelCount", l:"Panel Count", t:"text" },
      { k:"layout", l:"Layout Description", t:"textarea" },
      { k:"splashPage", l:"Splash Page?", t:"select", opts:["No","Single Splash","Double-Page Spread","Partial Splash"] },
      { k:"focusCharacter", l:"Focus Character(s)", t:"tags" },
      { k:"action", l:"Action / Content per Panel", t:"textarea" },
      { k:"dialogue", l:"Dialogue per Panel", t:"textarea" },
      { k:"sfx", l:"Sound Effects", t:"textarea" },
      { k:"cameraAngles", l:"Camera Angles / Framing", t:"textarea" },
      { k:"emotionalGoal", l:"Emotional Goal", t:"textarea" },
      { k:"notes", l:"Notes for Artist", t:"textarea" },
    ]
  },
  manuscripts: {
    label: "Manuscripts", icon: "\u270E", color: "#22c55e", group: "WRITING",
    fields: [
      { k:"title", l:"Title", t:"text" },
      { k:"linkedChapter", l:"Linked Chapter", t:"text" },
      { k:"status", l:"Status", t:"select", opts:["Draft 1","Draft 2","Draft 3","Revised","Polished","Final","Submitted"] },
      { k:"pov", l:"POV", t:"text" },
      { k:"content", l:"Content", t:"textarea" },
      { k:"wordCount", l:"Word Count", t:"text" },
      { k:"notes", l:"Revision Notes", t:"textarea" },
    ]
  },
  bibliography: {
    label: "Bibliography", icon: "\u229F", color: "#64748b", group: "REFERENCE",
    fields: [
      { k:"name", l:"Title", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Anime","Manga","Light Novel","Novel","Film","TV Series","Game","Comic","Webtoon","Music","Art","Academic","Other"] },
      { k:"creator", l:"Creator", t:"text" },
      { k:"influence", l:"How It Influenced You", t:"textarea" },
      { k:"whatToTake", l:"What to Learn From", t:"textarea" },
      { k:"whatToAvoid", l:"What to Avoid Copying", t:"textarea" },
    ]
  },
  publishing: {
    label: "Publication Pipeline", icon: "\u{1F4E4}", color: "#059669", group: "REFERENCE",
    fields: [
      { k:"name", l:"Submission / Goal", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Publisher Query","Agent Query","Contest","Self-Publish Milestone","Platform Submission","Grant","Other"] },
      { k:"status", l:"Status", t:"select", opts:["Researching","Preparing","Submitted","Awaiting Response","Accepted","Rejected","Revise & Resubmit","Published"] },
      { k:"deadline", l:"Deadline", t:"text" },
      { k:"target", l:"Target (Publisher/Agent/Platform)", t:"text" },
      { k:"requirements", l:"Requirements", t:"textarea" },
      { k:"materials", l:"Materials Needed", t:"textarea" },
      { k:"notes", l:"Notes", t:"textarea" },
      { k:"response", l:"Response Received", t:"textarea" },
    ]
  },
};

export const NAV_GROUPS = ["WIKI","WORLDBUILDING","STORY","CREATIVE","WRITING","REFERENCE","PUBLISH","WORKSPACE"];

// ─── Workspace Sections ───────────────────────────────────────────────
export const WORKSPACE_SECTIONS: Record<string, { label: string; icon: string; color: string }> = {
  worldBible: { label: "World Bible", icon: "\u{1F4D6}", color: "#a855f7" },
  storyCanvas: { label: "Story Canvas", icon: "\u{1F4CB}", color: "#3b82f6" },
  canonGraph: { label: "Canon Graph", icon: "\u{1F578}\uFE0F", color: "#8b5cf6" },
  forceGraph: { label: "Relationship Graph", icon: "\u{1F517}", color: "#ec4899" },
  timeline: { label: "Timeline", icon: "\u{1F552}", color: "#f97316" },
  stats: { label: "Project Stats", icon: "\u{1F4CA}", color: "#10b981" },
  atlasMap: { label: "Atlas Map", icon: "\u{1F5FA}\uFE0F", color: "#f59e0b" },
  scratchpad: { label: "Scratchpad", icon: "\u{1F4DD}", color: "#22c55e" },
};

// ─── Field Help Hints ─────────────────────────────────────────────────
export const FIELD_HELP = {
  name: "Use the most recognizable name. Aliases can go in a separate field.",
  role: "Think about narrative function, not just job title. How does this character serve the story?",
  archetype: "Archetypes are starting points, not cages. Characters can subvert or evolve beyond their archetype.",
  personality: "Focus on contradictions and tensions. Perfect people are boring.",
  motivations: "What do they want (external goal) vs what do they need (internal growth)?",
  fears: "Fears create vulnerability. Vulnerability creates connection with the reader.",
  relationships: "Tension matters more than labels. How do these relationships challenge the character?",
  arcSummary: "Where do they start emotionally? Where do they end? What forces the change?",
  lies: "The false belief that drives their flawed behavior at the start of the story.",
  truth: "The lesson they must internalize. Often the opposite of the lie.",
  ghost: "The backstory wound that created the lie. Show, don't tell.",
  overview: "Start with the single most important thing a reader/player would notice first.",
  atmosphere: "Use all five senses. What does this place sound like? Smell like?",
  ideology: "What do members genuinely believe? How does this differ from their public stance?",
  goals: "Separate short-term objectives from long-term ambitions.",
  mechanics: "Explain the internal logic clearly. If you can't explain the rules, readers won't buy it.",
  costs: "Every power needs a meaningful cost. Free power = boring power.",
  synopsis: "One paragraph max. If you can't summarize it briefly, the plot may be too complex.",
  conflict: "Every scene needs conflict. No conflict = no reason for the scene to exist.",
  stakes: "What happens if they fail? Make the consequences personal and specific.",
  openingHook: "The first line should make the reader need to read the second line.",
  closingHook: "End on a question, revelation, or reversal that demands the next chapter.",
  sensory: "Ground abstract emotions in concrete sensory details.",
  subtext: "What characters mean vs what they say. The gap between them creates drama.",
  statement: "A theme is a question the story explores, not an answer it preaches.",
};

// ─── Writing Prompts ──────────────────────────────────────────────────
export const WRITING_PROMPTS = [
  "Write a scene where your protagonist fails at something they're supposed to be good at.",
  "Describe a location entirely through the sounds a character hears.",
  "Two characters who are enemies must work together. What breaks the ice?",
  "Write the moment a character realizes they've been wrong about everything.",
  "A character finds an object that shouldn't exist in this world. What is it?",
  "Write a conversation where both characters are lying to each other.",
  "Describe a ritual or tradition unique to your world. Who participates and why?",
  "A character must explain their world's magic system to a child.",
  "Write the last peaceful moment before everything changes.",
  "Two characters meet for the first time. First impressions are completely wrong.",
];

// ─── Starter Kits ─────────────────────────────────────────────────────
export const STARTER_KITS = {
  characters: [
    { label: "Reluctant Hero", values: { role: "Protagonist", archetype: "The Outsider", status: "Alive", lies: "I can't make a difference", truth: "One person's courage can change everything" }},
    { label: "Mentor Figure", values: { role: "Mentor", archetype: "The Sage", status: "Alive", lies: "My student isn't ready", truth: "They've been ready; I'm the one who's afraid" }},
    { label: "Complex Villain", values: { role: "Antagonist", archetype: "The Shadow", status: "Alive", lies: "The ends justify the means", truth: "Power without empathy destroys everything it touches" }},
  ],
  plots: [
    { label: "Coming of Age Arc", values: { type: "Coming of Age", method: "Three-Act", status: "Planned" }},
    { label: "Mystery Arc", values: { type: "Mystery", method: "Fichtean", status: "Planned" }},
    { label: "Redemption Arc", values: { type: "Redemption", method: "Hero's Journey", status: "Planned" }},
  ],
  locations: [
    { label: "Mysterious Ruins", values: { type: "Ruin", status: "Abandoned" }},
    { label: "Capital City", values: { type: "City", status: "Active" }},
  ],
  factions: [
    { label: "Secret Society", values: { type: "Secret Society", status: "Covert" }},
    { label: "Military Order", values: { type: "Military", status: "Active" }},
  ],
};

// ─── Publish Sections ────────────────────────────────────────────────
export const PUBLISH_SECTIONS = {
  seriesListing: { label: "Series Listing", icon: "\u{1F4FA}", color: "#ec4899", group: "PUBLISH" },
  readerMode: { label: "Reader Mode", icon: "\u{1F4D6}", color: "#8b5cf6", group: "PUBLISH" },
  seriesDashboard: { label: "Series Dashboard", icon: "\u{1F4CA}", color: "#3b82f6", group: "PUBLISH" },
  pitchBible: { label: "Pitch Bible", icon: "\u{1F4CB}", color: "#f59e0b", group: "PUBLISH" },
};

export const SERIES_FORMATS = ["Manga", "Webtoon", "Light Novel", "Web Serial", "Graphic Novel", "Screenplay", "Animated Series", "Short Film"];
export const SERIES_STATUSES = ["Planned", "Ongoing", "Hiatus", "Complete"];

export const READER_THEMES = {
  dark: { bg: "#0a0a14", text: "#d4d4d8", name: "Dark" },
  light: { bg: "#fefce8", text: "#1c1917", name: "Light" },
  sepia: { bg: "#f5f0e8", text: "#44403c", name: "Sepia" },
};

export const READER_FONTS = {
  serif: { family: "'Playfair Display', Georgia, serif", label: "Serif" },
  sans: { family: "'DM Sans', system-ui, sans-serif", label: "Sans" },
  mono: { family: "'JetBrains Mono', monospace", label: "Mono" },
};

// ─── Theme Palettes ───────────────────────────────────────────────────
export const DARK_THEME: Theme = {
  bg: "#06060f", surface: "rgba(255,255,255,0.02)", surfaceHover: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.12)",
  text: "#e2e8f0", textMuted: "#94a3b8", textDim: "#64748b", textBright: "#f1f5f9",
  accent: "#a855f7", accentDim: "rgba(168,85,247,0.12)",
  input: "rgba(255,255,255,0.04)", inputBorder: "rgba(255,255,255,0.1)",
  danger: "#ef4444", success: "#22c55e", info: "#3b82f6",
};

export const LIGHT_THEME: Theme = {
  bg: "#f8fafc", surface: "#ffffff", surfaceHover: "#f1f5f9",
  border: "#e2e8f0", borderHover: "#cbd5e1",
  text: "#1e293b", textMuted: "#64748b", textDim: "#94a3b8", textBright: "#0f172a",
  accent: "#7c3aed", accentDim: "rgba(124,58,237,0.08)",
  input: "#ffffff", inputBorder: "#cbd5e1",
  danger: "#dc2626", success: "#16a34a", info: "#2563eb",
};

// ─── Z-Index Scale ──────────────────────────────────────────────────
export const Z_INDEX = {
  sidebarOverlay: 99,
  sidebar: 100,
  toast: 5000,
  commandPalette: 6000,
  onboarding: 7000,
};

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Data Schema ───────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

const FORMAT_PRESETS = {
  lightNovel: { label: "Light Novel", icon: "📖", chapterWords: "4000–6000", volumeChapters: "8–12", pov: "First Person", tense: "Past", notes: "Internal monologue heavy, short punchy chapters, cliffhangers, illustrations every 30–50 pages" },
  graphicNovel: { label: "Graphic Novel", icon: "🎨", chapterWords: "Script pages", volumeChapters: "22–28 pages", pov: "Third Limited / Visual", tense: "Present (visual)", notes: "Panel-driven, 5–7 panels/page avg, splash pages for impact, visual metaphors, minimal exposition" },
  manga: { label: "Manga", icon: "⬛", chapterWords: "16–20 pages", volumeChapters: "8–10 chapters/volume", pov: "Multiple", tense: "Visual Present", notes: "Right-to-left, speed lines, SD moments, double-page spreads, weekly/monthly rhythm" },
  webtoon: { label: "Webtoon", icon: "📱", chapterWords: "60–80 panels", volumeChapters: "Season-based (50–80 eps)", pov: "Third Limited", tense: "Present", notes: "Vertical scroll, one panel wide, color mandatory, hook in first 3 panels, end-of-ep cliffhanger" },
  novel: { label: "Novel", icon: "📕", chapterWords: "3000–5000", volumeChapters: "20–35 chapters", pov: "Third Limited / Multiple", tense: "Past", notes: "Deep prose, subtext, thematic density, scene-sequel rhythm" },
  webSerial: { label: "Web Serial", icon: "🌐", chapterWords: "2000–4000", volumeChapters: "Arc-based", pov: "First / Third", tense: "Past / Present", notes: "Frequent releases, strong hooks, community engagement, progression fantasy popular" },
  screenplay: { label: "Screenplay", icon: "🎬", chapterWords: "Scene-based", volumeChapters: "3 Acts / 8 Sequences", pov: "Camera", tense: "Present", notes: "Slug lines, action blocks, parentheticals, 1 page ≈ 1 minute" },
};

const OUTLINE_METHODS = [
  { id: "threeAct", label: "Three-Act Structure", desc: "Setup → Confrontation → Resolution", beats: ["Hook","Inciting Incident","First Plot Point","Rising Action","Midpoint","Crisis","Climax","Falling Action","Resolution"] },
  { id: "kishotenketsu", label: "Kishōtenketsu", desc: "Introduction → Development → Twist → Conclusion (no central conflict required)", beats: ["Ki (Introduction)","Shō (Development)","Ten (Twist/Complication)","Ketsu (Conclusion)"] },
  { id: "saveTheCat", label: "Save the Cat!", desc: "15-beat structure for compelling narrative pacing", beats: ["Opening Image","Theme Stated","Setup","Catalyst","Debate","Break into Two","B Story","Fun and Games","Midpoint","Bad Guys Close In","All Is Lost","Dark Night of Soul","Break into Three","Finale","Final Image"] },
  { id: "heros", label: "Hero's Journey", desc: "Campbell/Vogler monomyth", beats: ["Ordinary World","Call to Adventure","Refusal","Meeting the Mentor","Crossing the Threshold","Tests, Allies, Enemies","Approach","Ordeal","Reward","The Road Back","Resurrection","Return with Elixir"] },
  { id: "snowflake", label: "Snowflake Method", desc: "Fractal expansion from sentence to full outline", beats: ["One-Sentence Summary","One-Paragraph Summary","Character Summaries","Expand to Full Page","Character Synopses","Expand to 4 Pages","Character Charts","Scene List","Scene Details"] },
  { id: "sevenPoint", label: "Seven-Point Story", desc: "Dan Wells method — work backwards from resolution", beats: ["Hook","Plot Turn 1","Pinch Point 1","Midpoint","Pinch Point 2","Plot Turn 2","Resolution"] },
  { id: "fichtean", label: "Fichtean Curve", desc: "Start in crisis — no slow setup, immediate tension", beats: ["Crisis 1 (Opening)","Rising Crises","Crisis Escalation","Climax","Falling Action"] },
];

const SCENE_TYPES = ["Action","Dialogue","Exposition","Flashback","Dream","Training","Battle","Revelation","Romance","Aftermath","Travel","Political","Ritual","Transformation","Death","Reunion","Betrayal","Escape","Investigation","Duel"];
const EMOTIONS = ["Tension","Joy","Grief","Rage","Fear","Wonder","Disgust","Hope","Despair","Love","Betrayal","Triumph","Melancholy","Dread","Relief","Confusion","Determination","Nostalgia"];
const PACING = ["Slow Burn","Building","Moderate","Intense","Breakneck","Reflective","Montage"];

const COLLECTION_DEFS = {
  characters: {
    label: "Characters", icon: "◈", color: "#8b5cf6", group: "WIKI",
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
    label: "Locations", icon: "◉", color: "#10b981", group: "WIKI",
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
    ]
  },
  factions: {
    label: "Factions", icon: "◆", color: "#ef4444", group: "WIKI",
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
  systems: {
    label: "Power Systems", icon: "⊗", color: "#3b82f6", group: "WORLDBUILDING",
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
  items: {
    label: "Items & Artifacts", icon: "◇", color: "#f59e0b", group: "WIKI",
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
    label: "Lore & Concepts", icon: "◎", color: "#06b6d4", group: "WORLDBUILDING",
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
    label: "World History", icon: "⊕", color: "#7c3aed", group: "WORLDBUILDING",
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
  cultures: {
    label: "Cultures", icon: "⊘", color: "#ec4899", group: "WORLDBUILDING",
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
  plots: {
    label: "Plots & Arcs", icon: "⊞", color: "#8b5cf6", group: "STORY",
    fields: [
      { k:"name", l:"Arc Name", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["Main Plot","Subplot","Character Arc","Romance Arc","Mystery","Revenge","Political","War","Training","Tournament","Heist","Redemption","Tragedy","Coming of Age","Other"] },
      { k:"status", l:"Status", t:"select", opts:["Planned","In Progress","Complete","Abandoned","Reworking"] },
      { k:"volume", l:"Volume / Part", t:"text" },
      { k:"method", l:"Structure Method", t:"select", opts:["Three-Act","Kishōtenketsu","Save the Cat","Hero's Journey","Snowflake","Seven-Point","Fichtean","Custom"] },
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
    label: "Chapters", icon: "≡", color: "#0891b2", group: "STORY",
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
    label: "Scenes", icon: "▸", color: "#f97316", group: "STORY",
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
      { k:"outcome", l:"Outcome (Succeed/Fail/Complicate)", t:"select", opts:["Success","Failure","Complication","Pyrrhic Victory","Revelation","Cliffhanger"] },
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
    label: "Volumes / Parts", icon: "📚", color: "#6366f1", group: "STORY",
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
    label: "Combat Design", icon: "⚔", color: "#dc2626", group: "CREATIVE",
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
    label: "Themes & Motifs", icon: "✦", color: "#a855f7", group: "CREATIVE",
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
    label: "Foreshadowing", icon: "🔮", color: "#7c3aed", group: "CREATIVE",
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
  languages: {
    label: "Languages & Naming", icon: "🗣", color: "#0ea5e9", group: "WORLDBUILDING",
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
  dialogueVoices: {
    label: "Dialogue Voices", icon: "💬", color: "#14b8a6", group: "CREATIVE",
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
    label: "Panel Layouts", icon: "⬚", color: "#f43f5e", group: "CREATIVE",
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
    label: "Manuscripts", icon: "✎", color: "#22c55e", group: "WRITING",
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
  timelineEvents: {
    label: "Timeline", icon: "⊠", color: "#f59e0b", group: "WORLDBUILDING",
    fields: [
      { k:"name", l:"Event Name", t:"text" },
      { k:"date", l:"Date", t:"text" },
      { k:"dateValue", l:"Sort Order Value", t:"text" },
      { k:"type", l:"Type", t:"select", opts:["War","Birth","Death","Discovery","Catastrophe","Political","Cultural","Personal","Founding","Other"] },
      { k:"scale", l:"Scale", t:"select", opts:["Global","Continental","National","Regional","Local","Personal"] },
      { k:"overview", l:"Overview", t:"textarea" },
    ]
  },
  bibliography: {
    label: "Bibliography", icon: "⊟", color: "#64748b", group: "REFERENCE",
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
    label: "Publication Pipeline", icon: "📤", color: "#059669", group: "REFERENCE",
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

const NAV_GROUPS = ["WIKI","WORLDBUILDING","STORY","CREATIVE","WRITING","REFERENCE"];

// ─── Component ─────────────────────────────────────────────────────────
export default function StoryAtlasWorkspace() {
  const [data, setData] = useState({});
  const [section, setSection] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectMeta, setProjectMeta] = useState({ projectName:"", genre:"", format:"novel", description:"", author:"" });
  const [loaded, setLoaded] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [darkMode] = useState(true);

  // Load from persistent storage
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("storyatlas-workspace");
        if (r && r.value) {
          const parsed = JSON.parse(r.value);
          setData(parsed.data || {});
          setProjectMeta(parsed.meta || projectMeta);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Save
  const save = useCallback(async (d, m) => {
    try {
      await window.storage.set("storyatlas-workspace", JSON.stringify({ data: d, meta: m }));
    } catch {}
  }, []);

  const addEntry = (collection, entry) => {
    const e = { ...entry, id: uid(), createdAt: now(), updatedAt: now() };
    const next = { ...data, [collection]: [...(data[collection]||[]), e] };
    setData(next);
    save(next, projectMeta);
    setEditing(null);
    return e;
  };

  const updateEntry = (collection, id, updates) => {
    const next = { ...data, [collection]: (data[collection]||[]).map(e => e.id === id ? { ...e, ...updates, updatedAt: now() } : e) };
    setData(next);
    save(next, projectMeta);
    setEditing(null);
  };

  const deleteEntry = (collection, id) => {
    if (!confirm("Delete this entry?")) return;
    const next = { ...data, [collection]: (data[collection]||[]).filter(e => e.id !== id) };
    setData(next);
    save(next, projectMeta);
    setViewing(null);
  };

  const updateMeta = (updates) => {
    const m = { ...projectMeta, ...updates };
    setProjectMeta(m);
    save(data, m);
  };

  const totalEntries = Object.values(data).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);

  const allEntries = Object.entries(data).flatMap(([col, items]) =>
    (Array.isArray(items) ? items : []).map(item => ({ ...item, _collection: col }))
  );

  const searchResults = searchQuery.trim()
    ? allEntries.filter(e => {
        const q = searchQuery.toLowerCase();
        return (e.name||e.title||"").toLowerCase().includes(q) ||
          Object.values(e).some(v => typeof v === "string" && v.toLowerCase().includes(q));
      })
    : [];

  // ─── Export ──────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ meta: projectMeta, ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${projectMeta.projectName || "storyatlas"}_export.json`; a.click();
  };

  const importJSON = () => {
    const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        const { meta, ...rest } = parsed;
        // Merge collections
        const merged = { ...data };
        Object.keys(COLLECTION_DEFS).forEach(col => {
          if (Array.isArray(rest[col])) {
            merged[col] = [...(merged[col]||[]), ...rest[col].map(e => ({ ...e, id: e.id || uid() }))];
          }
        });
        if (meta) setProjectMeta(prev => ({ ...prev, ...meta }));
        setData(merged);
        save(merged, meta ? { ...projectMeta, ...meta } : projectMeta);
        alert("Import complete!");
      } catch { alert("Invalid JSON file."); }
    };
    input.click();
  };

  if (!loaded) return <div style={{ background:"#06060f", color:"#94a3b8", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>Loading workspace...</div>;

  // ─── Render Helpers ──────────────────────────────────────────────────
  const renderForm = (collection, existing) => {
    const cfg = COLLECTION_DEFS[collection];
    if (!cfg) return null;
    const isEdit = !!existing;
    const formData = { ...(existing || {}) };

    return (
      <div style={{ padding:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", color:"#f1f5f9", margin:0 }}>
            {isEdit ? `Edit ${cfg.label.replace(/s$/,"")}` : `New ${cfg.label.replace(/s$/,"")}`}
          </h2>
          <button onClick={() => { setEditing(null); setViewing(null); }} style={pillBtn("#475569")}>← Back</button>
        </div>
        <FormFields
          fields={cfg.fields}
          initial={formData}
          onSubmit={(values) => {
            if (isEdit) updateEntry(collection, existing.id, values);
            else addEntry(collection, values);
          }}
          accent={cfg.color}
        />
      </div>
    );
  };

  const renderDetail = (collection, item) => {
    const cfg = COLLECTION_DEFS[collection];
    if (!cfg || !item) return null;
    return (
      <div style={{ padding:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.6rem", color:"#f1f5f9", margin:0 }}>
            <span style={{ color:cfg.color, marginRight:"0.5rem" }}>{cfg.icon}</span>
            {item.name || item.title || "Untitled"}
          </h2>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <button onClick={() => { setViewing(null); setEditing({ collection, item }); }} style={pillBtn(cfg.color)}>Edit</button>
            <button onClick={() => deleteEntry(collection, item.id)} style={pillBtn("#ef4444")}>Delete</button>
            <button onClick={() => setViewing(null)} style={pillBtn("#475569")}>← Back</button>
          </div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", marginBottom:"1.5rem" }}>
          {cfg.fields.filter(f => f.t === "select" && item[f.k]).map(f => (
            <span key={f.k} style={{ background:cfg.color+"20", border:`1px solid ${cfg.color}40`, color:cfg.color, fontSize:"0.72rem", padding:"3px 10px", borderRadius:"20px", fontWeight:600 }}>
              {f.l}: {item[f.k]}
            </span>
          ))}
        </div>
        {cfg.fields.filter(f => item[f.k] && f.t !== "select").map(f => (
          <div key={f.k} style={{ marginBottom:"1.25rem" }}>
            <div style={{ fontSize:"0.7rem", color:cfg.color, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:"0.35rem" }}>{f.l}</div>
            <div style={{ fontSize:"0.9rem", color:"#cbd5e1", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
              {f.t === "tags" ? (
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem" }}>
                  {(typeof item[f.k] === "string" ? item[f.k].split(",") : item[f.k] || []).map((t,i) => (
                    <span key={i} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", padding:"2px 8px", borderRadius:"4px", fontSize:"0.8rem" }}>{t.trim()}</span>
                  ))}
                </div>
              ) : item[f.k]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderList = (collection) => {
    const cfg = COLLECTION_DEFS[collection];
    const items = (data[collection] || []).filter(e => {
      if (!filterText) return true;
      const q = filterText.toLowerCase();
      return (e.name||e.title||"").toLowerCase().includes(q);
    });

    return (
      <div style={{ padding:"1.5rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.4rem", color:"#f1f5f9", margin:0 }}>
            <span style={{ color:cfg.color }}>{cfg.icon}</span> {cfg.label}
            <span style={{ fontSize:"0.8rem", color:"#64748b", fontWeight:400, marginLeft:"0.5rem" }}>({items.length})</span>
          </h2>
          <button onClick={() => setEditing({ collection, item: null })} style={pillBtn(cfg.color)}>+ New</button>
        </div>
        <input
          placeholder={`Filter ${cfg.label.toLowerCase()}...`}
          value={filterText} onChange={e => setFilterText(e.target.value)}
          style={inputStyle}
        />
        {items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:"#475569" }}>
            <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>{cfg.icon}</div>
            <div>No {cfg.label.toLowerCase()} yet. Create your first one!</div>
          </div>
        ) : (
          <div style={{ display:"grid", gap:"0.5rem", marginTop:"0.75rem" }}>
            {items.map(item => (
              <button key={item.id} onClick={() => setViewing({ collection, item })}
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"8px", padding:"0.85rem 1rem", cursor:"pointer", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all 0.15s", fontFamily:"inherit", color:"inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
              >
                <div>
                  <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.95rem" }}>{item.name || item.title || "Untitled"}</div>
                  {item.status && <span style={{ fontSize:"0.7rem", color:cfg.color, marginTop:"2px", display:"inline-block" }}>{item.status}</span>}
                  {item.role && <span style={{ fontSize:"0.7rem", color:"#64748b", marginLeft:"0.5rem" }}>{item.role}</span>}
                  {item.type && <span style={{ fontSize:"0.7rem", color:"#64748b", marginLeft:"0.5rem" }}>{item.type}</span>}
                </div>
                <span style={{ color:"#334155", fontSize:"0.9rem" }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Dashboard ───────────────────────────────────────────────────────
  const renderDashboard = () => {
    const formatInfo = FORMAT_PRESETS[projectMeta.format] || FORMAT_PRESETS.novel;
    const recentItems = allEntries.sort((a,b) => (b.updatedAt||"").localeCompare(a.updatedAt||"")).slice(0,8);

    return (
      <div style={{ padding:"1.5rem" }}>
        {/* Project Header */}
        <div style={{ marginBottom:"2rem" }}>
          <div style={{ fontSize:"0.7rem", color:"#a855f7", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700, marginBottom:"0.25rem" }}>StoryAtlas · Creative Workspace</div>
          <div style={{ fontSize:"0.65rem", color:"#64748b", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>A <a href="https://rebulb.com" style={{ color:"#a855f7", textDecoration:"none" }} target="_blank" rel="noopener noreferrer">Rebulb</a> Tool — by Dreesman</div>
          <input value={projectMeta.projectName} onChange={e => updateMeta({ projectName: e.target.value })} placeholder="Your Project Name"
            style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(1.6rem,4vw,2.4rem)", background:"transparent", border:"none", color:"#f1f5f9", width:"100%", outline:"none", padding:0 }} />
          <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.75rem", flexWrap:"wrap" }}>
            <input value={projectMeta.author} onChange={e => updateMeta({ author: e.target.value })} placeholder="Author" style={{ ...smallInput, width:"160px" }} />
            <input value={projectMeta.genre} onChange={e => updateMeta({ genre: e.target.value })} placeholder="Genre" style={{ ...smallInput, width:"160px" }} />
            <select value={projectMeta.format} onChange={e => updateMeta({ format: e.target.value })} style={{ ...smallInput, width:"180px" }}>
              {Object.entries(FORMAT_PRESETS).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select>
          </div>
          <textarea value={projectMeta.description} onChange={e => updateMeta({ description: e.target.value })} placeholder="Project description / logline..."
            style={{ ...inputStyle, marginTop:"0.75rem", height:"60px", resize:"vertical" }} />
        </div>

        {/* Format Card */}
        <div style={{ background:"linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.08))", border:"1px solid rgba(168,85,247,0.25)", borderRadius:"10px", padding:"1.25rem", marginBottom:"1.5rem" }}>
          <div style={{ fontWeight:700, color:"#a855f7", fontSize:"0.85rem", marginBottom:"0.5rem" }}>{formatInfo.icon} {formatInfo.label} Format Guide</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:"0.75rem", fontSize:"0.82rem", color:"#94a3b8" }}>
            <div><span style={{ color:"#64748b" }}>Chapter Size:</span> {formatInfo.chapterWords}</div>
            <div><span style={{ color:"#64748b" }}>Volume:</span> {formatInfo.volumeChapters}</div>
            <div><span style={{ color:"#64748b" }}>POV:</span> {formatInfo.pov}</div>
            <div><span style={{ color:"#64748b" }}>Tense:</span> {formatInfo.tense}</div>
          </div>
          <div style={{ fontSize:"0.78rem", color:"#64748b", marginTop:"0.5rem", lineHeight:1.5 }}>{formatInfo.notes}</div>
        </div>

        {/* Stats Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px,1fr))", gap:"0.5rem", marginBottom:"1.5rem" }}>
          {Object.entries(COLLECTION_DEFS).map(([key, cfg]) => {
            const count = (data[key]||[]).length;
            return (
              <button key={key} onClick={() => { setSection(key); setViewing(null); setEditing(null); setFilterText(""); }}
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", padding:"0.75rem", cursor:"pointer", textAlign:"left", fontFamily:"inherit", color:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = cfg.color+"60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
              >
                <div style={{ fontSize:"1.3rem", color:cfg.color, fontWeight:700 }}>{count}</div>
                <div style={{ fontSize:"0.72rem", color:"#64748b" }}>{cfg.label}</div>
              </button>
            );
          })}
        </div>

        {/* Outline Methods Reference */}
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", padding:"1.25rem", marginBottom:"1.5rem" }}>
          <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.95rem", marginBottom:"0.75rem", fontFamily:"'Playfair Display',serif" }}>Outline Method Reference</div>
          <div style={{ display:"grid", gap:"0.5rem" }}>
            {OUTLINE_METHODS.map(m => (
              <details key={m.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"6px", padding:"0.6rem 0.75rem" }}>
                <summary style={{ cursor:"pointer", fontWeight:600, color:"#e2e8f0", fontSize:"0.85rem" }}>
                  {m.label} <span style={{ color:"#64748b", fontWeight:400 }}>— {m.desc}</span>
                </summary>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.3rem", marginTop:"0.5rem" }}>
                  {m.beats.map((b,i) => (
                    <span key={i} style={{ background:"rgba(168,85,247,0.1)", border:"1px solid rgba(168,85,247,0.2)", color:"#c4b5fd", fontSize:"0.7rem", padding:"2px 8px", borderRadius:"4px" }}>
                      {i+1}. {b}
                    </span>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentItems.length > 0 && (
          <div style={{ marginBottom:"1.5rem" }}>
            <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:"0.95rem", marginBottom:"0.75rem", fontFamily:"'Playfair Display',serif" }}>Recent Activity</div>
            <div style={{ display:"grid", gap:"0.4rem" }}>
              {recentItems.map(item => {
                const cfg = COLLECTION_DEFS[item._collection];
                return cfg ? (
                  <button key={item.id} onClick={() => setViewing({ collection: item._collection, item })}
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:"6px", padding:"0.6rem 0.75rem", cursor:"pointer", textAlign:"left", display:"flex", gap:"0.75rem", alignItems:"center", fontFamily:"inherit", color:"inherit" }}
                  >
                    <span style={{ color:cfg.color }}>{cfg.icon}</span>
                    <span style={{ fontWeight:600, color:"#e2e8f0", fontSize:"0.85rem", flex:1 }}>{item.name||item.title||"Untitled"}</span>
                    <span style={{ fontSize:"0.65rem", color:"#475569" }}>{cfg.label.replace(/s$/,"")}</span>
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Import / Export */}
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          <button onClick={exportJSON} style={pillBtn("#3b82f6")}>Export JSON</button>
          <button onClick={importJSON} style={pillBtn("#22c55e")}>Import JSON</button>
          <button onClick={async () => {
            if (confirm("Reset ALL data? This cannot be undone.")) {
              setData({}); setProjectMeta({ projectName:"", genre:"", format:"novel", description:"", author:"" });
              try { await window.storage.delete("storyatlas-workspace"); } catch {}
            }
          }} style={pillBtn("#ef4444")}>Reset All</button>
        </div>
      </div>
    );
  };

  // ─── Main Content Router ─────────────────────────────────────────────
  const renderContent = () => {
    if (editing) return renderForm(editing.collection, editing.item);
    if (viewing) return renderDetail(viewing.collection, viewing.item);
    if (section === "dashboard") return renderDashboard();
    if (COLLECTION_DEFS[section]) return renderList(section);
    return <div style={{ padding:"2rem", color:"#475569", textAlign:"center" }}>Select a section from the sidebar</div>;
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#06060f", color:"#e2e8f0", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing:border-box; margin:0; }
        ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-thumb { background:#a855f7; border-radius:3px; }
        ::selection { background:#a855f730; }
        details > summary { list-style:none; } details > summary::-webkit-details-marker { display:none; }
        textarea:focus, input:focus, select:focus { outline:none; border-color:#a855f780 !important; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? "240px" : "50px",
        minHeight:"100vh",
        background:"rgba(255,255,255,0.02)",
        borderRight:"1px solid rgba(255,255,255,0.06)",
        transition:"width 0.2s",
        flexShrink:0,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
      }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"transparent", border:"none", color:"#64748b", padding:"1rem", cursor:"pointer", textAlign:"left", fontSize:"1.1rem", fontFamily:"inherit" }}>
          {sidebarOpen ? "◁" : "▷"}
        </button>

        {sidebarOpen && (
          <div style={{ padding:"0 0.5rem", flex:1, overflowY:"auto" }}>
            {/* Search */}
            <input placeholder="Search everything..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, fontSize:"0.78rem", marginBottom:"0.75rem", padding:"0.5rem 0.6rem" }}
            />
            {searchQuery && searchResults.length > 0 && (
              <div style={{ marginBottom:"1rem", maxHeight:"200px", overflowY:"auto" }}>
                {searchResults.slice(0,10).map(item => {
                  const cfg = COLLECTION_DEFS[item._collection];
                  return (
                    <button key={item.id} onClick={() => { setViewing({ collection: item._collection, item }); setSearchQuery(""); }}
                      style={{ display:"block", width:"100%", background:"transparent", border:"none", padding:"0.4rem 0.5rem", cursor:"pointer", textAlign:"left", color:"#94a3b8", fontSize:"0.78rem", fontFamily:"inherit", borderRadius:"4px" }}
                    >
                      <span style={{ color:cfg?.color }}>{cfg?.icon}</span> {item.name||item.title||"Untitled"}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Dashboard */}
            <NavItem label="Dashboard" icon="⌂" active={section==="dashboard" && !editing && !viewing} onClick={() => { setSection("dashboard"); setEditing(null); setViewing(null); setFilterText(""); }} />

            {/* Grouped nav */}
            {NAV_GROUPS.map(group => {
              const items = Object.entries(COLLECTION_DEFS).filter(([,v]) => v.group === group);
              if (!items.length) return null;
              return (
                <div key={group} style={{ marginTop:"0.75rem" }}>
                  <div style={{ fontSize:"0.6rem", color:"#475569", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700, padding:"0.3rem 0.5rem" }}>{group}</div>
                  {items.map(([key, cfg]) => (
                    <NavItem key={key} label={cfg.label} icon={cfg.icon} color={cfg.color}
                      count={(data[key]||[]).length}
                      active={section===key && !editing && !viewing}
                      onClick={() => { setSection(key); setEditing(null); setViewing(null); setFilterText(""); }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex:1, minWidth:0, overflowY:"auto", maxHeight:"100vh" }}>
        {renderContent()}
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────
function NavItem({ label, icon, color, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:"0.5rem", width:"100%",
      padding:"0.45rem 0.5rem", borderRadius:"6px", cursor:"pointer",
      background: active ? "rgba(168,85,247,0.12)" : "transparent",
      border: active ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
      color: active ? "#e2e8f0" : "#94a3b8",
      fontSize:"0.82rem", fontFamily:"inherit", textAlign:"left",
      transition:"all 0.15s", marginBottom:"2px",
    }}>
      <span style={{ color: color || "#a855f7", flexShrink:0, width:"16px", textAlign:"center" }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {count > 0 && <span style={{ fontSize:"0.65rem", color:"#475569", background:"rgba(255,255,255,0.05)", padding:"1px 5px", borderRadius:"3px" }}>{count}</span>}
    </button>
  );
}

function FormFields({ fields, initial, onSubmit, accent }) {
  const [values, setValues] = useState(initial || {});
  const set = (k, v) => setValues(prev => ({ ...prev, [k]: v }));

  return (
    <div>
      {fields.map(f => (
        <div key={f.k} style={{ marginBottom:"1rem" }}>
          <label style={{ display:"block", fontSize:"0.72rem", color: accent || "#a855f7", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:"0.3rem" }}>{f.l}</label>
          {f.t === "select" ? (
            <select value={values[f.k]||""} onChange={e => set(f.k, e.target.value)} style={inputStyle}>
              <option value="">— Select —</option>
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.t === "textarea" ? (
            <textarea value={values[f.k]||""} onChange={e => set(f.k, e.target.value)} rows={4} style={{ ...inputStyle, minHeight:"80px", resize:"vertical", lineHeight:1.6 }} />
          ) : f.t === "tags" ? (
            <input value={values[f.k]||""} onChange={e => set(f.k, e.target.value)} placeholder="Comma-separated" style={inputStyle} />
          ) : (
            <input value={values[f.k]||""} onChange={e => set(f.k, e.target.value)} style={inputStyle} />
          )}
        </div>
      ))}
      <button onClick={() => onSubmit(values)} style={{ ...pillBtn(accent || "#a855f7"), padding:"0.6rem 1.5rem", fontSize:"0.9rem", marginTop:"0.5rem" }}>
        {initial?.id ? "Save Changes" : "Create Entry"}
      </button>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:"6px", padding:"0.55rem 0.7rem", color:"#e2e8f0", fontSize:"0.88rem",
  fontFamily:"'DM Sans',sans-serif", transition:"border-color 0.15s",
};
const smallInput = {
  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:"6px", padding:"0.4rem 0.6rem", color:"#e2e8f0", fontSize:"0.8rem",
  fontFamily:"'DM Sans',sans-serif",
};
const pillBtn = (color) => ({
  background: color + "18", border:`1px solid ${color}40`, color,
  padding:"0.35rem 0.9rem", borderRadius:"20px", cursor:"pointer",
  fontSize:"0.78rem", fontWeight:600, fontFamily:"'DM Sans',sans-serif",
  transition:"all 0.15s",
});

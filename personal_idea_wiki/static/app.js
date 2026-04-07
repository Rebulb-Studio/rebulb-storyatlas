const WF = {
  data: null,
  section: 'dashboard',
  editingId: null,

  PROMPTS: [
    'What truth about your world would shatter a character if they learned it too early?',
    'What does power cost in your story emotionally, socially, and physically?',
    'Which faction thinks it is heroic, and what makes that belief convincing?',
    'What ordinary daily ritual would feel strange or impossible in our world?',
    'What is the first lie your protagonist tells themself, and why do they need it?',
    'What historical event still shapes politics, class, or fear in the present day?',
    'What does your setting smell like at dawn, at noon, and at midnight?',
    'What taboo does everyone obey, even when they pretend not to believe in it?',
  ],

  NAV: [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂', group: null },
    { id: 'characters', label: 'Characters', icon: '◈', group: 'WIKI' },
    { id: 'locations', label: 'Locations', icon: '◉', group: 'WIKI' },
    { id: 'factions', label: 'Factions', icon: '◆', group: 'WIKI' },
    { id: 'items', label: 'Items & Artifacts', icon: '◇', group: 'WIKI' },
    { id: 'lore', label: 'Lore & Concepts', icon: '◎', group: 'WIKI' },
    { id: 'history', label: 'World History', icon: '⊕', group: 'WORLD BUILDING' },
    { id: 'systems', label: 'Power Systems', icon: '⊗', group: 'WORLD BUILDING' },
    { id: 'cultures', label: 'Cultures', icon: '⊘', group: 'WORLD BUILDING' },
    { id: 'plots', label: 'Plots & Arcs', icon: '⊞', group: 'STORY' },
    { id: 'chapters', label: 'Chapters', icon: '≡', group: 'STORY' },
    { id: 'timelineEvents', label: 'Chronology', icon: '⊠', group: 'CREATIVE' },
    { id: 'manuscripts', label: 'Manuscripts', icon: '✎', group: 'CREATIVE' },
    { id: 'bibliography', label: 'Bibliography', icon: '⊟', group: 'CREATIVE' },
  ],

  COLLECTIONS: {
    characters: {
      label: 'Character', color: '#8b5cf6', icon: '◈', titleKey: 'name',
      infoboxFields: ['status', 'role', 'affiliation', 'age', 'powerTier'],
      fields: [
        { k: 'name', l: 'Full Name', t: 'text', req: true, p: 'e.g. Elias Cross' },
        { k: 'aliases', l: 'Aliases / Nicknames', t: 'tags', p: 'Type and press Enter' },
        { k: 'status', l: 'Status', t: 'select', opts: ['Alive', 'Deceased', 'Missing', 'Unknown', 'Other'] },
        { k: 'role', l: 'Story Role', t: 'select', opts: ['Protagonist', 'Antagonist', 'Supporting', 'Mentor', 'Rival', 'Minor'] },
        { k: 'affiliation', l: 'Affiliation', t: 'text', p: 'Faction, school, family, squad, guild...' },
        { k: 'age', l: 'Age', t: 'text', p: 'e.g. 19, late 20s, unknown' },
        { k: 'powerTier', l: 'Power Tier', t: 'select', opts: ['S-Tier', 'A-Tier', 'B-Tier', 'C-Tier', 'D-Tier', 'Non-combatant', 'Unknown'] },
        { k: 'appearance', l: 'Appearance', t: 'textarea', p: 'What do they look like? Make them feel visually distinct.', tall: true },
        { k: 'personality', l: 'Personality', t: 'textarea', p: 'How do they act in public? In private? Under pressure?', tall: true },
        { k: 'motivations', l: 'Motivations', t: 'textarea', p: 'What do they want and why?', tall: true },
        { k: 'background', l: 'Background / Biography', t: 'richtext', p: 'Origin, formative events, turning points, scars, secrets...' },
        { k: 'abilities', l: 'Abilities & Powers', t: 'abilities' },
        { k: 'relationships', l: 'Relationships', t: 'relationships' },
        { k: 'storyNotes', l: 'Story Involvement', t: 'textarea', p: 'What is their function in the narrative? Which arcs define them?', tall: true },
        { k: 'pastStatus', l: 'Past Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'pastSummary', l: 'Past Snapshot', t: 'textarea', p: 'How were they positioned earlier in the story or lore?', tall: true },
        { k: 'presentStatus', l: 'Present Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'presentSummary', l: 'Present Snapshot', t: 'textarea', p: 'Where are they now, emotionally, politically, or physically?', tall: true },
        { k: 'futureStatus', l: 'Future / End-State Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'futureSummary', l: 'Future / End-State Snapshot', t: 'textarea', p: 'What do they become, lose, inherit, or leave behind later?', tall: true },
        { k: 'quotes', l: 'Notable Quotes', t: 'quotes' },
      ],
    },

    locations: {
      label: 'Location', color: '#10b981', icon: '◉', titleKey: 'name',
      infoboxFields: ['type', 'status', 'region', 'controlledBy'],
      fields: [
        { k: 'name', l: 'Name', t: 'text', req: true, p: 'e.g. The Citadel, Blackwater Basin' },
        { k: 'type', l: 'Type', t: 'select', opts: ['City', 'District', 'Building', 'Region', 'Nation', 'Landmark', 'Realm', 'Other'] },
        { k: 'status', l: 'Status', t: 'select', opts: ['Active', 'Hidden', 'Abandoned', 'Destroyed', 'Sealed', 'Unknown'] },
        { k: 'region', l: 'Region / Country', t: 'text', p: 'Where does it sit in the world?' },
        { k: 'controlledBy', l: 'Controlled By', t: 'text', p: 'Faction, government, family, cult...' },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'Why does this place matter? What is the first impression?', tall: true },
        { k: 'geography', l: 'Geography & Layout', t: 'richtext', p: 'Architecture, geography, climate, smell, sounds, atmosphere...' },
        { k: 'landmarks', l: 'Landmarks', t: 'list', p: 'One landmark per line item' },
        { k: 'inhabitants', l: 'Inhabitants / Culture', t: 'textarea', p: 'Who lives here and what are they like?', tall: true },
        { k: 'history', l: 'History', t: 'richtext', p: 'Founding, disasters, wars, secrets, rebuilding...' },
        { k: 'storySignificance', l: 'Story Significance', t: 'textarea', p: 'Which scenes or arcs make this location unforgettable?', tall: true },
        { k: 'mapRegion', l: 'Map Region', t: 'text', p: 'Continent, nation, district, route, or map layer name.' },
        { k: 'mapX', l: 'Map X Position (%)', t: 'text', p: 'Horizontal pin position from 0 to 100.' },
        { k: 'mapY', l: 'Map Y Position (%)', t: 'text', p: 'Vertical pin position from 0 to 100.' },
        { k: 'mapPinNote', l: 'Map Pin Note', t: 'textarea', p: 'What should a viewer understand at a glance from the map pin?' },
      ],
    },

    factions: {
      label: 'Faction', color: '#ef4444', icon: '◆', titleKey: 'name',
      infoboxFields: ['type', 'status', 'leader', 'territory'],
      fields: [
        { k: 'name', l: 'Faction Name', t: 'text', req: true, p: 'e.g. Bureau of Veilwatch' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Government', 'Military', 'Secret Society', 'Criminal Organization', 'Religious Order', 'Bloodline / Family', 'Resistance', 'Other'] },
        { k: 'status', l: 'Status', t: 'select', opts: ['Active', 'Covert', 'Dormant', 'Fractured', 'Disbanded', 'Unknown'] },
        { k: 'leader', l: 'Leader', t: 'text', p: 'Current head, captain, king, director...' },
        { k: 'territory', l: 'Territory / HQ', t: 'text', p: 'Where are they strongest?' },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'What are they and how does the world see them?', tall: true },
        { k: 'ideology', l: 'Ideology', t: 'textarea', p: 'What do they believe? What justifies their behavior?', tall: true },
        { k: 'goals', l: 'Primary Goals', t: 'list', p: 'One goal per line item' },
        { k: 'hierarchy', l: 'Hierarchy & Ranks', t: 'richtext', p: 'How power is structured and how members rise or fall.' },
        { k: 'members', l: 'Notable Members', t: 'relationships' },
        { k: 'allies', l: 'Allies', t: 'tags', p: 'Allied groups or people' },
        { k: 'enemies', l: 'Enemies', t: 'tags', p: 'Rivals, sworn enemies, targets...' },
        { k: 'history', l: 'History & Founding', t: 'richtext', p: 'Founding event, betrayals, wars, schisms...' },
        { k: 'pastStatus', l: 'Past Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'pastSummary', l: 'Past Snapshot', t: 'textarea', p: 'What did the organization used to be when it held real influence?', tall: true },
        { k: 'presentStatus', l: 'Present Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'presentSummary', l: 'Present Snapshot', t: 'textarea', p: 'What is its current shape, pressure, and role in the story?', tall: true },
        { k: 'futureStatus', l: 'Future / End-State Status', t: 'select', opts: ['Active', 'Alive', 'Dormant', 'Missing', 'Retired', 'Disbanded', 'Destroyed', 'Deceased', 'Unknown', 'Other'] },
        { k: 'futureSummary', l: 'Future / End-State Snapshot', t: 'textarea', p: 'How does it survive, collapse, split, or become legend by the end?', tall: true },
      ],
    },

    items: {
      label: 'Item / Artifact', color: '#f59e0b', icon: '◇', titleKey: 'name',
      infoboxFields: ['type', 'rarity', 'status', 'currentHolder'],
      fields: [
        { k: 'name', l: 'Name', t: 'text', req: true, p: 'e.g. Veil Breaker, Hollow Crown' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Weapon', 'Armor', 'Artifact', 'Tool', 'Document', 'Consumable', 'Vehicle', 'Other'] },
        { k: 'rarity', l: 'Rarity', t: 'select', opts: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'One of a Kind', 'Unknown'] },
        { k: 'status', l: 'Current Status', t: 'select', opts: ['In Use', 'Lost', 'Hidden', 'Sealed', 'Destroyed', 'Unknown'] },
        { k: 'currentHolder', l: 'Current Holder', t: 'text', p: 'Who possesses it now?' },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'Why is this item feared, desired, or sacred?', tall: true },
        { k: 'appearance', l: 'Appearance', t: 'textarea', p: 'Materials, inscriptions, design motifs, aura...', tall: true },
        { k: 'abilities', l: 'Properties', t: 'abilities' },
        { k: 'weaknesses', l: 'Limitations / Costs', t: 'textarea', p: 'Conditions, prices, side effects, counters...', tall: true },
        { k: 'history', l: 'History', t: 'richtext', p: 'Who forged it? Who bled for it? What myths follow it?' },
      ],
    },

    lore: {
      label: 'Lore / Concept', color: '#06b6d4', icon: '◎', titleKey: 'name',
      infoboxFields: ['category'],
      fields: [
        { k: 'name', l: 'Name', t: 'text', req: true, p: 'e.g. The Veil, The Great Fracture' },
        { k: 'category', l: 'Category', t: 'select', opts: ['Phenomenon', 'Theory', 'Law / Rule', 'Myth', 'Prophecy', 'Religion', 'Other'] },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'Define it clearly for someone new to the setting.', tall: true },
        { k: 'description', l: 'Full Description', t: 'richtext', p: 'How it works, what it means, what people misunderstand about it.' },
        { k: 'relatedEntries', l: 'Related Entries', t: 'tags', p: 'Pages, factions, locations, characters...' },
      ],
    },

    history: {
      label: 'Historical Event', color: '#7c3aed', icon: '⊕', titleKey: 'name',
      infoboxFields: ['date', 'era', 'type', 'scale'],
      fields: [
        { k: 'name', l: 'Event Name', t: 'text', req: true, p: 'e.g. The Night of Empty Thrones' },
        { k: 'date', l: 'Date (Display)', t: 'text', p: 'e.g. Year 347, 12 years before Chapter 1' },
        { k: 'dateValue', l: 'Date (Number)', t: 'text', p: 'Used for sorting / timeline positioning' },
        { k: 'era', l: 'Era / Age', t: 'text', p: 'The Age of Fracture, Post-Fall...' },
        { k: 'type', l: 'Type', t: 'select', opts: ['War / Conflict', 'Political Shift', 'Discovery', 'Assassination', 'Founding', 'Collapse', 'Cultural Event', 'Supernatural Event', 'Other'] },
        { k: 'scale', l: 'Scale', t: 'select', opts: ['World-Shaping', 'Continental', 'National', 'Regional', 'Local', 'Personal'] },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'What happened and why does it still matter?', tall: true },
        { k: 'description', l: 'Full Account', t: 'richtext', p: 'Causes, event flow, aftermath, narrative consequences.' },
        { k: 'keyFigures', l: 'Key Figures', t: 'tags', p: 'Leaders, martyrs, traitors, survivors...' },
        { k: 'consequences', l: 'Consequences', t: 'textarea', p: 'How did this permanently alter the world?', tall: true },
      ],
    },

    systems: {
      label: 'Power System', color: '#3b82f6', icon: '⊗', titleKey: 'name',
      infoboxFields: ['type'],
      fields: [
        { k: 'name', l: 'System Name', t: 'text', req: true, p: 'e.g. Aethon, Ember Circuit, Hollow Script' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Magic System', 'Combat Technique', 'Innate Ability', 'Technology', 'Psychic', 'Spiritual', 'Biological', 'Hybrid', 'Other'] },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'What does the system allow and what makes it distinct?', tall: true },
        { k: 'mechanics', l: 'Core Mechanics', t: 'richtext', p: 'Rules, activation, flow, limitations, expression.' },
        { k: 'source', l: 'Source / Origin', t: 'textarea', p: 'Where does this power come from?', tall: true },
        { k: 'tiers', l: 'Tiers & Progression', t: 'richtext', p: 'How do beginners differ from masters?' },
        { k: 'costs', l: 'Costs & Limits', t: 'textarea', p: 'What is the price? What breaks users?', tall: true },
        { k: 'categories', l: 'Types / Schools', t: 'richtext', p: 'Subtypes, branches, specializations...' },
        { k: 'cultureImpact', l: 'Cultural Impact', t: 'textarea', p: 'How has it shaped class, religion, law, fear, or war?', tall: true },
        { k: 'notableUsers', l: 'Notable Users', t: 'tags', p: 'Characters or groups known for it' },
      ],
    },

    cultures: {
      label: 'Culture', color: '#ec4899', icon: '⊘', titleKey: 'name',
      infoboxFields: ['type'],
      fields: [
        { k: 'name', l: 'Culture Name', t: 'text', req: true, p: 'e.g. The Veilborn, Foundless, Housebound' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Ethnic Group', 'Social Class', 'Regional Culture', 'Religious Group', 'Subculture', 'Professional Class', 'Other'] },
        { k: 'overview', l: 'Overview', t: 'textarea', p: 'What defines this group?', tall: true },
        { k: 'values', l: 'Core Values', t: 'richtext', p: 'Honor, fear, purity, achievement, loyalty, debt...' },
        { k: 'customs', l: 'Customs & Traditions', t: 'richtext', p: 'Rites of passage, rituals, taboos, holidays, mourning...' },
        { k: 'socialStructure', l: 'Social Structure', t: 'textarea', p: 'Who has status? What changes that?', tall: true },
        { k: 'language', l: 'Language / Dialect', t: 'textarea', p: 'Speech patterns, taboo words, naming systems...', tall: true },
        { k: 'history', l: 'History & Origins', t: 'richtext', p: 'Where they came from and what broke or hardened them.' },
        { k: 'relations', l: 'Relations with Others', t: 'textarea', p: 'Alliances, prejudice, fear, misunderstandings...', tall: true },
      ],
    },

    plots: {
      label: 'Plot / Arc', color: '#8b5cf6', icon: '⊞', titleKey: 'name',
      infoboxFields: ['type', 'status', 'tone'],
      fields: [
        { k: 'name', l: 'Arc Title', t: 'text', req: true, p: 'e.g. Arc I: Smoke & Iron' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Main Arc', 'Sub-Arc', 'Side Story', 'Backstory Arc', 'Prologue', 'Epilogue', 'Interlude'] },
        { k: 'status', l: 'Status', t: 'select', opts: ['Planned', 'Outlined', 'In Progress', 'First Draft', 'Completed', 'On Hold', 'Scrapped'] },
        { k: 'tone', l: 'Tone', t: 'select', opts: ['Dark & Gritty', 'Bittersweet', 'Political Thriller', 'Action-Heavy', 'Horror', 'Hopeful', 'Mixed'] },
        { k: 'synopsis', l: 'Synopsis', t: 'textarea', p: '2–3 sentence overview of the arc.', tall: true },
        { k: 'premise', l: 'Premise & Setup', t: 'richtext', p: 'Starting situation, pressure points, who wants what.' },
        { k: 'conflict', l: 'Central Conflict', t: 'textarea', p: 'What makes this arc impossible to solve cleanly?', tall: true },
        { k: 'climax', l: 'Climax', t: 'textarea', p: 'The decisive confrontation or revelation.', tall: true },
        { k: 'resolution', l: 'Resolution / Aftermath', t: 'textarea', p: 'What is lost, gained, and inherited by the next arc?', tall: true },
        { k: 'themes', l: 'Themes', t: 'list', p: 'One theme per line item' },
        { k: 'keyCharacters', l: 'Key Characters', t: 'tags', p: 'Who defines this arc?' },
        { k: 'keyLocations', l: 'Key Locations', t: 'tags', p: 'Where does it matter most?' },
        { k: 'notes', l: 'Author Notes', t: 'richtext', p: 'Loose ideas, alternate beats, open questions...' },
      ],
    },

    chapters: {
      label: 'Chapter', color: '#0891b2', icon: '≡', titleKey: 'name',
      infoboxFields: ['number', 'arc', 'status', 'pov'],
      fields: [
        { k: 'name', l: 'Chapter Title', t: 'text', req: true, p: 'e.g. Chapter 1: First Contact' },
        { k: 'number', l: 'Chapter Number', t: 'text', p: '1, 2.5, Prologue, Interlude I...' },
        { k: 'arc', l: 'Parent Arc', t: 'text', p: 'Which larger arc does this belong to?' },
        { k: 'status', l: 'Status', t: 'select', opts: ['Idea Only', 'Outlined', 'First Draft', 'Revision', 'Final Draft', 'Published'] },
        { k: 'pov', l: 'POV Character', t: 'text', p: 'Whose perspective is this?' },
        { k: 'synopsis', l: 'Synopsis', t: 'textarea', p: 'Beat-by-beat summary of what happens.', tall: true },
        { k: 'openingBeat', l: 'Opening Beat', t: 'textarea', p: 'How does the chapter hook the reader immediately?', tall: true },
        { k: 'keyScenes', l: 'Key Scenes', t: 'list', p: 'One important scene per line item' },
        { k: 'closingBeat', l: 'Closing Beat', t: 'textarea', p: 'What drives the reader into the next chapter?', tall: true },
        { k: 'characterDev', l: 'Character Development', t: 'textarea', p: 'What changes internally?', tall: true },
        { k: 'thematicPurpose', l: 'Thematic Purpose', t: 'textarea', p: 'What is this chapter saying beneath the plot?', tall: true },
      ],
    },

    timelineEvents: {
      label: 'Timeline Event', color: '#f59e0b', icon: '⊠', titleKey: 'name',
      infoboxFields: ['date', 'type', 'scale'],
      fields: [
        { k: 'name', l: 'Event Name', t: 'text', req: true, p: 'e.g. Fall of the Third Gate' },
        { k: 'date', l: 'Date Label', t: 'text', p: 'e.g. Year 347, 12 years before Chapter 1' },
        { k: 'dateValue', l: 'Date Number', t: 'text', p: 'e.g. 347' },
        { k: 'type', l: 'Type', t: 'select', opts: ['War / Conflict', 'Political', 'Personal', 'Discovery / Invention', 'Formation / Founding', 'Collapse / End', 'Supernatural', 'Cultural', 'Other'] },
        { k: 'scale', l: 'Scale', t: 'select', opts: ['World-Shaping', 'National', 'Regional', 'Local', 'Personal'] },
        { k: 'overview', l: 'Description', t: 'textarea', p: 'What happened and why should a reader care?', tall: true },
        { k: 'keyFigures', l: 'Key Figures', t: 'tags', p: 'Characters or factions involved' },
      ],
    },

    manuscripts: {
      label: 'Manuscript', color: '#22c55e', icon: '✎', titleKey: 'title',
      infoboxFields: ['type', 'status', 'linkedChapter'],
      fields: [
        { k: 'title', l: 'Title', t: 'text', req: true, p: 'e.g. Chapter 1 — First Draft' },
        { k: 'type', l: 'Document Type', t: 'select', opts: ['Chapter Draft', 'Full Outline', 'Scene', 'Short Story / Excerpt', 'Character Study', 'Worldbuilding Essay', 'Backstory', 'Other'] },
        { k: 'status', l: 'Status', t: 'select', opts: ['Outline', 'First Draft', '2nd Draft', 'Revision', 'Polished Draft', 'Final'] },
        { k: 'linkedChapter', l: 'Linked Chapter', t: 'text', p: 'Optional chapter reference' },
        { k: 'synopsis', l: 'Brief Summary', t: 'textarea', p: 'One sentence about what this contains.' },
        { k: 'notes', l: 'Author Notes', t: 'textarea', p: 'Intention, revision notes, reminders...' },
        { k: 'content', l: 'Content', t: 'richtext', p: 'Begin writing here...' },
      ],
    },

    bibliography: {
      label: 'Reference / Inspiration', color: '#64748b', icon: '⊟', titleKey: 'name',
      infoboxFields: ['type', 'creator'],
      fields: [
        { k: 'name', l: 'Title', t: 'text', req: true, p: 'e.g. Jujutsu Kaisen, Chainsaw Man, Monster' },
        { k: 'type', l: 'Type', t: 'select', opts: ['Manga', 'Anime', 'Novel', 'Film', 'TV Series', 'Game', 'Comic', 'History Book', 'Article', 'Music', 'Personal Experience', 'Other'] },
        { k: 'creator', l: 'Creator / Author', t: 'text', p: 'e.g. Gege Akutami' },
        { k: 'influence', l: 'Influence on Your Work', t: 'textarea', p: 'What specifically are you taking inspiration from?', tall: true },
        { k: 'aspects', l: 'Specific Aspects', t: 'list', p: 'One influence aspect per line item' },
        { k: 'notes', l: 'Notes', t: 'textarea', p: 'Extra thoughts, warnings, or research notes...', tall: true },
      ],
    },
  },

  STARTER_KITS: {
    characters: [
      {
        name: 'Protagonist Skeleton',
        fill: {
          role: 'Protagonist',
          status: 'Alive',
          powerTier: 'B-Tier',
          personality: 'Public face:\n-\n\nPrivate self:\n-\n\nUnder pressure:\n-',
          motivations: 'What do they want right now?\nWhat do they need but do not understand yet?\nWhat are they willing to sacrifice? ',
          storyNotes: 'Act I: \nAct II: \nAct III: \nFinal image / ending state: ',
        },
      },
      {
        name: 'Villain / Rival Skeleton',
        fill: {
          role: 'Antagonist',
          status: 'Alive',
          powerTier: 'A-Tier',
          motivations: 'What do they think they are protecting?\nWhat wound or belief makes their logic persuasive?\nWhat line will they never admit they crossed?',
          storyNotes: 'How are they introduced?\nHow do they escalate?\nWhat makes the audience almost agree with them?',
        },
      },
    ],
    factions: [
      {
        name: 'Government / Order Template',
        fill: {
          type: 'Government',
          status: 'Active',
          ideology: 'Official doctrine:\n-\n\nWhat members really believe:\n-\n\nWhat outsiders accuse them of:\n-',
          hierarchy: '<h3>Leadership</h3><p>Who commands, who obeys, and how promotions happen.</p><h3>Ranks</h3><p>List the major ranks here.</p>',
        },
      },
      {
        name: 'Cult / Secret Society Template',
        fill: {
          type: 'Secret Society',
          status: 'Covert',
          ideology: 'Sacred belief:\nWhat they promise recruits:\nWhat they hide from recruits:',
          goals: ['Recruit quietly', 'Expand influence', 'Protect the central secret'],
        },
      },
    ],
    locations: [
      {
        name: 'Capital City Template',
        fill: {
          type: 'City',
          status: 'Active',
          overview: 'First impression:\nWhy the city matters politically:\nWhy the city matters emotionally:',
          landmarks: ['Seat of power', 'Poor district / undercity', 'Sacred or forbidden landmark'],
        },
      },
      {
        name: 'Forbidden Zone Template',
        fill: {
          type: 'Region',
          status: 'Sealed',
          overview: 'Why people fear this place:\nWhat rumor about it is true:\nWhat rumor about it is false:',
        },
      },
    ],
    plots: [
      {
        name: 'Tournament / Exam Arc',
        fill: {
          type: 'Main Arc',
          tone: 'Action-Heavy',
          conflict: 'Visible conflict: the competition itself.\nHidden conflict: the conspiracy or emotional fracture underneath it.',
          themes: ['Merit vs. inheritance', 'Humiliation and pride', 'What competition reveals'],
        },
      },
      {
        name: 'War / Collapse Arc',
        fill: {
          type: 'Main Arc',
          tone: 'Dark & Gritty',
          themes: ['Cost of loyalty', 'The machinery of institutions', 'What victory destroys'],
          resolution: 'Who survives?\nWhat city / belief / relationship does not?\nWhat new era begins here?',
        },
      },
    ],
    systems: [
      {
        name: 'Hard Magic System Skeleton',
        fill: {
          type: 'Magic System',
          mechanics: '<h3>How it is accessed</h3><p></p><h3>What it can do</h3><p></p><h3>What it cannot do</h3><p></p>',
          costs: 'Physical cost:\nMental cost:\nSocial / legal cost:\nSpiritual or existential cost:',
          categories: '<h3>Common users</h3><p></p><h3>Elite users</h3><p></p><h3>Forbidden expression</h3><p></p>',
        },
      },
    ],
    chapters: [
      {
        name: 'Chapter Beat Skeleton',
        fill: {
          status: 'Outlined',
          openingBeat: 'Start with disruption, contrast, or dread.',
          closingBeat: 'End on a choice, reveal, threat, or emotional break.',
          keyScenes: ['Opening disruption', 'Midpoint reveal or clash', 'Closing turn'],
        },
      },
    ],
    history: [
      {
        name: 'Foundational Historical Event',
        fill: {
          scale: 'World-Shaping',
          overview: 'Before this event:\nThe event itself:\nAfter this event:',
          consequences: 'Political consequence:\nCultural consequence:\nPersonal consequence for the story present:',
        },
      },
    ],
    timelineEvents: [
      {
        name: 'Timeline Milestone',
        fill: {
          scale: 'Regional',
          overview: 'What changed on this date? Why is it memorable enough for the timeline?',
        },
      },
    ],
    manuscripts: [
      {
        name: 'First Draft Starter',
        fill: {
          type: 'Chapter Draft',
          status: 'First Draft',
          content: '<p>Open with motion, tension, or a specific image.</p><p>Keep going before you edit.</p>',
        },
      },
    ],
    bibliography: [
      {
        name: 'Influence Note Template',
        fill: {
          influence: 'What exact feeling, structure, character dynamic, or worldbuilding choice am I studying here?\nWhat am I avoiding copying directly?\nHow will I transform the influence into something original?',
          aspects: ['Structure', 'Tone', 'Character writing'],
        },
      },
    ],
  },

  STATUS_CLASSES: {
    Alive: 'badge-green',
    Active: 'badge-green',
    Completed: 'badge-green',
    Final: 'badge-green',
    'Final Draft': 'badge-green',
    Deceased: 'badge-red',
    Destroyed: 'badge-red',
    Disbanded: 'badge-red',
    Retired: 'badge-outline',
    Dormant: 'badge-purple',
    Missing: 'badge-purple',
    Hidden: 'badge-purple',
    Unknown: 'badge-outline',
    Planned: 'badge-outline',
    Outlined: 'badge-outline',
    'In Progress': 'badge-blue',
    'First Draft': 'badge-gold',
  },

  async init() {
    await this.loadData();
    this.bindGlobalEvents();
    this.updateBrand();
    this.renderNav();
    this.render();
  },

  async loadData() {
    const res = await fetch('/api/all');
    this.data = await res.json();
  },

  async saveItem(collection, payload, id = null) {
    const url = id ? `/api/${collection}/${id}` : `/api/${collection}`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Save failed');
    const saved = await res.json();
    if (!this.data[collection]) this.data[collection] = [];
    if (id) {
      const idx = this.data[collection].findIndex((item) => item.id === id);
      if (idx >= 0) this.data[collection][idx] = saved;
    } else {
      this.data[collection].unshift(saved);
    }
    return saved;
  },

  async deleteItem(collection, id) {
    const res = await fetch(`/api/${collection}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    this.data[collection] = (this.data[collection] || []).filter((item) => item.id !== id);
  },

  async saveMeta(payload) {
    const res = await fetch('/api/meta', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Settings save failed');
    this.data.meta = await res.json();
    this.updateBrand();
  },

  bindGlobalEvents() {
    const input = document.getElementById('global-search');
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.search(event.target.value.trim());
    });
    input.addEventListener('input', (event) => {
      if (!event.target.value.trim() && this.section !== 'dashboard') this.render();
    });
  },

  updateBrand() {
    const meta = this.data.meta || {};
    document.getElementById('project-name-display').textContent = meta.projectName || 'StoryAtlas';
    document.getElementById('project-genre-display').textContent = meta.genre || 'Light novel / comic / manga story bible';
    document.title = `${meta.projectName || 'StoryAtlas'} — Story Studio`;
  },

  renderNav() {
    const nav = document.getElementById('main-nav');
    let html = '';
    let currentGroup = null;
    this.NAV.forEach((item) => {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        if (currentGroup) html += `<div class="nav-group-label">${currentGroup}</div>`;
      }
      const count = Array.isArray(this.data[item.id]) ? this.data[item.id].length : null;
      html += `
        <button class="nav-item ${this.section === item.id ? 'active' : ''}" onclick="WF.navigate('${item.id}')">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          ${count !== null ? `<span class="nav-count">${count}</span>` : ''}
        </button>`;
    });
    nav.innerHTML = html;
  },

  navigate(section) {
    this.section = section;
    this.editingId = null;
    this.renderNav();
    this.render();
  },

  render() {
    const area = document.getElementById('content-area');
    if (this.section.startsWith('ms_')) {
      const id = this.section.replace('ms_', '');
      area.innerHTML = this.renderManuscriptEditor(id);
      return;
    }
    const config = this.COLLECTIONS[this.section];
    if (config && this.editingId === 'new') {
      area.innerHTML = this.renderForm(this.section, null);
      return;
    }
    if (config && this.editingId) {
      const item = this.findItem(this.section, this.editingId);
      area.innerHTML = this.renderForm(this.section, item);
      return;
    }
    if (this.section === 'dashboard') {
      area.innerHTML = this.renderDashboard();
      return;
    }
    if (this.section === 'timelineEvents') {
      area.innerHTML = this.renderTimeline();
      return;
    }
    if (this.section === 'manuscripts') {
      area.innerHTML = this.renderManuscriptList();
      return;
    }
    if (!config) {
      area.innerHTML = '<div class="empty-state"><h3>Unknown section</h3></div>';
      return;
    }
    area.innerHTML = this.renderCollectionList(this.section);
  },

  renderDashboard() {
    const meta = this.data.meta || {};
    const prompt = this.PROMPTS[Math.floor(Math.random() * this.PROMPTS.length)];
    const spotlightCollections = ['characters', 'factions', 'locations', 'systems', 'plots', 'history'];
    const spotlight = spotlightCollections.map((key) => {
      const collection = this.COLLECTIONS[key];
      return `
        <button class="portal-card" onclick="WF.navigate('${key}')" style="--portal-color:${collection.color}">
          <div class="portal-icon">${collection.icon}</div>
          <div class="portal-title">${collection.label}${collection.label.endsWith('s') ? '' : 's'}</div>
          <div class="portal-count">${(this.data[key] || []).length} entries</div>
        </button>`;
    }).join('');

    const recent = this.getRecentEntries(8).map((item) => {
      const cfg = this.COLLECTIONS[item._collection];
      return `
        <button class="recent-item" onclick="WF.openDetail('${item._collection}', '${item.id}')">
          <div class="recent-icon">${cfg.icon}</div>
          <div class="recent-copy">
            <div class="recent-name">${this.titleFor(item, item._collection)}</div>
            <div class="recent-meta">${cfg.label} · ${this.timeAgo(item.updatedAt || item.createdAt)}</div>
          </div>
        </button>`;
    }).join('') || '<div class="empty-inline">Nothing has been created yet.</div>';

    const starterCards = [
      ['characters', 'Build a protagonist or rival sheet'],
      ['factions', 'Shape an institution, cult, gang, or house'],
      ['systems', 'Define a hard power system with costs'],
      ['plots', 'Outline a main arc with conflict and aftermath'],
      ['timelineEvents', 'Anchor your lore with timeline milestones'],
      ['bibliography', 'Track research, influences, and adaptation choices'],
    ].map(([key, desc]) => {
      const cfg = this.COLLECTIONS[key];
      return `
        <button class="starter-card" onclick="WF.startCreate('${key}')">
          <div class="starter-top">
            <span class="starter-icon">${cfg.icon}</span>
            <span class="starter-title">${cfg.label}</span>
          </div>
          <div class="starter-desc">${desc}</div>
        </button>`;
    }).join('');

    return `
      <div class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow">PERSONAL WIKI HOME</div>
          <h1>${meta.projectName || 'Your Story Atlas'}</h1>
          <p>${meta.description || 'A local-first studio for light novels, comics, manga, graphic novels, and long-form story bibles.'}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="WF.startCreate('characters')">New Character</button>
            <button class="btn btn-secondary" onclick="WF.startCreate('plots')">New Story Arc</button>
            <button class="btn btn-secondary" onclick="WF.navigate('timelineEvents')">Open Chronology</button>
          </div>
        </div>
        <div class="hero-stats">
          ${this.dashboardStat('Total Wiki Entries', this.totalWikiEntries(), '1,075 pages style hub')}
          ${this.dashboardStat('Story Material', (this.data.plots || []).length + (this.data.chapters || []).length + (this.data.manuscripts || []).length, 'arcs, chapters, manuscripts')}
          ${this.dashboardStat('Timeline Events', (this.data.timelineEvents || []).length, 'visual chronology points')}
        </div>
      </div>

      <div class="dashboard-grid two-col">
        <section class="panel">
          <div class="panel-header"><h2>Explore</h2><span class="panel-sub">Wiki-style category hubs</span></div>
          <div class="portal-grid">${spotlight}</div>
        </section>
        <section class="panel">
          <div class="panel-header"><h2>Recently Updated</h2><span class="panel-sub">Your most recent edits</span></div>
          <div class="recent-list">${recent}</div>
        </section>
      </div>

      <div class="dashboard-grid two-col">
        <section class="panel">
          <div class="panel-header"><h2>Starter Kits</h2><span class="panel-sub">Template-first creation with auto-fill guidance</span></div>
          <div class="starter-grid">${starterCards}</div>
        </section>
        <section class="panel prompt-panel">
          <div class="panel-header"><h2>Writing Prompt</h2><span class="panel-sub">Use this to deepen the next page you build</span></div>
          <blockquote class="writing-prompt">${prompt}</blockquote>
          <div class="prompt-actions">
            <button class="btn btn-secondary" onclick="WF.showSettings()">Project Settings</button>
            <button class="btn btn-secondary" onclick="WF.exportZIP()">Export ZIP</button>
          </div>
        </section>
      </div>`;
  },

  dashboardStat(label, value, sub) {
    return `<div class="hero-stat"><div class="hero-stat-value">${value}</div><div class="hero-stat-label">${label}</div><div class="hero-stat-sub">${sub}</div></div>`;
  },

  totalWikiEntries() {
    return ['characters', 'locations', 'factions', 'items', 'lore', 'history', 'systems', 'cultures']
      .reduce((acc, key) => acc + ((this.data[key] || []).length), 0);
  },

  getRecentEntries(limit = 8) {
    const rows = [];
    Object.keys(this.COLLECTIONS).forEach((key) => {
      (this.data[key] || []).forEach((item) => rows.push({ ...item, _collection: key }));
    });
    return rows.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, limit);
  },

  renderCollectionList(collection) {
    const cfg = this.COLLECTIONS[collection];
    const items = this.data[collection] || [];
    const list = items.length ? items.map((item) => this.renderEntryCard(collection, item)).join('') : `
      <div class="empty-state">
        <div class="empty-icon">${cfg.icon}</div>
        <h3>No ${cfg.label.toLowerCase()} entries yet</h3>
        <p>This section is template-driven. Start with a guided page and let the prompts pull more detail out of you.</p>
        <button class="btn btn-primary" onclick="WF.startCreate('${collection}')">Create ${cfg.label}</button>
      </div>`;
    return `
      <div class="page-header-row">
        <div>
          <div class="eyebrow">${cfg.label.toUpperCase()} HUB</div>
          <h1>${cfg.icon} ${cfg.label}${cfg.label.endsWith('s') ? '' : 's'}</h1>
          <p class="page-description">Wiki-style browse view with cards, quick scan info, and guided creation.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" onclick="WF.startCreate('${collection}')">New ${cfg.label}</button>
        </div>
      </div>
      <div class="toolbar-row">
        <input id="filter-${collection}" class="search-input narrow" placeholder="Filter this section..." oninput="WF.filterList('${collection}', this.value)">
        <div class="toolbar-meta">${items.length} entries</div>
      </div>
      <div id="collection-grid-${collection}" class="collection-grid">${list}</div>`;
  },

  renderEntryCard(collection, item) {
    const cfg = this.COLLECTIONS[collection];
    const title = this.titleFor(item, collection);
    const subtitle = item.affiliation || item.type || item.role || item.arc || item.category || item.creator || item.date || '';
    const snippet = this.stripHtml(item.overview || item.synopsis || item.description || item.influence || item.content || '').slice(0, 180);
    const status = item.status ? `<span class="badge ${this.statusClass(item.status)}">${item.status}</span>` : '';
    const chips = [];
    if (Array.isArray(item.aliases)) chips.push(...item.aliases.slice(0, 2));
    if (item.powerTier) chips.push(item.powerTier);
    if (item.tone) chips.push(item.tone);
    return `
      <button class="entry-card" style="--card-color:${cfg.color}" onclick="WF.openDetail('${collection}', '${item.id}')">
        <div class="entry-card-top">
          <div class="entry-card-title">${title}</div>
          ${status}
        </div>
        ${subtitle ? `<div class="entry-card-sub">${subtitle}</div>` : ''}
        ${snippet ? `<div class="entry-card-snippet">${snippet}${snippet.length >= 180 ? '…' : ''}</div>` : ''}
        <div class="entry-card-footer">
          <div class="chip-row">${chips.slice(0, 3).map((chip) => `<span class="tag-chip">${chip}</span>`).join('')}</div>
          <span class="entry-card-meta">${this.timeAgo(item.updatedAt || item.createdAt)}</span>
        </div>
      </button>`;
  },

  filterList(collection, query) {
    const grid = document.getElementById(`collection-grid-${collection}`);
    if (!grid) return;
    const q = (query || '').trim().toLowerCase();
    Array.from(grid.children).forEach((card) => {
      const matches = !q || card.textContent.toLowerCase().includes(q);
      card.style.display = matches ? '' : 'none';
    });
  },

  startCreate(collection) {
    this.section = collection;
    this.editingId = 'new';
    this.renderNav();
    this.render();
  },

  startEdit(collection, id) {
    this.section = collection;
    this.editingId = id;
    this.renderNav();
    this.render();
  },

  openDetail(collection, id) {
    if (collection === 'manuscripts') {
      this.section = `ms_${id}`;
      this.renderNav();
      this.render();
      return;
    }
    const item = this.findItem(collection, id);
    if (!item) return;
    const cfg = this.COLLECTIONS[collection];
    const title = this.titleFor(item, collection);
    const infobox = (cfg.infoboxFields || []).map((field) => {
      const value = item[field];
      if (!value || (Array.isArray(value) && !value.length)) return '';
      const label = (cfg.fields.find((entry) => entry.k === field) || {}).l || field;
      return `<div class="infobox-row"><div class="infobox-label">${label}</div><div class="infobox-value">${Array.isArray(value) ? value.join(', ') : value}</div></div>`;
    }).join('');

    const temporalKeys = ['pastStatus', 'pastSummary', 'presentStatus', 'presentSummary', 'futureStatus', 'futureSummary'];
    const temporal = this.renderTemporalPanels(item);
    const sections = cfg.fields
      .filter((field) => !cfg.infoboxFields.includes(field.k) && !['name', 'title'].includes(field.k) && !temporalKeys.includes(field.k))
      .map((field) => {
        const value = item[field.k];
        if (!value || (Array.isArray(value) && !value.length)) return '';
        return `
          <section class="wiki-section">
            <div class="wiki-section-title">${field.l}</div>
            <div class="wiki-section-body">${this.renderFieldValue(field, value)}</div>
          </section>`;
      }).join('');

    document.getElementById('content-area').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="eyebrow">${cfg.label.toUpperCase()} PAGE</div>
          <h1>${title}</h1>
          <p class="page-description">Detailed article view with infobox and structured sections.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WF.navigate('${collection}')">Back</button>
          <button class="btn btn-primary" onclick="WF.startEdit('${collection}', '${id}')">Edit</button>
          <button class="btn btn-danger" onclick="WF.confirmDelete('${collection}', '${id}', '${this.escapeForAttr(title)}')">Delete</button>
        </div>
      </div>
      <div class="wiki-layout">
        <div class="wiki-main">${temporal}${sections || '<div class=\"empty-state\"><p>No content yet. Edit this page to flesh it out.</p></div>'}</div>
        <aside class="wiki-side">
          <div class="infobox-card">
            <div class="infobox-head">${cfg.icon} ${title}</div>
            <div class="infobox-avatar" style="--avatar-color:${cfg.color}">${cfg.icon}</div>
            ${item.aliases && item.aliases.length ? `<div class="infobox-aliases">Also known as: ${item.aliases.join(', ')}</div>` : ''}
            ${infobox || '<div class="empty-inline">No quick info yet.</div>'}
          </div>
        </aside>
      </div>`;
  },

  renderTemporalPanels(item) {
    const phases = [
      { key: 'past', label: 'Past', status: item.pastStatus, summary: item.pastSummary },
      { key: 'present', label: 'Present', status: item.presentStatus || item.status, summary: item.presentSummary || item.overview || '' },
      { key: 'future', label: 'Future', status: item.futureStatus, summary: item.futureSummary },
    ].filter((phase) => phase.status || phase.summary);
    if (!phases.length) return '';
    return `
      <section class="temporal-strip">
        ${phases.map((phase) => `
          <article class="temporal-card temporal-${phase.key}">
            <div class="temporal-head">
              <span class="temporal-label">${phase.label}</span>
              ${phase.status ? `<span class="badge ${this.statusClass(phase.status)}">${this.escapeHtml(phase.status)}</span>` : ''}
            </div>
            <div class="temporal-body">${phase.summary ? this.escapeHtml(String(phase.summary)).replace(/\n/g, '<br>') : '<span class=\"empty-inline\">No notes yet.</span>'}</div>
          </article>`).join('')}
      </section>`;
  },

  renderFieldValue(field, value) {
    if (field.t === 'richtext') return `<div class="rich-view">${value}</div>`;
    if (field.t === 'textarea') return `<p class="long-text">${this.escapeHtml(value).replace(/\n/g, '<br>')}</p>`;
    if (field.t === 'list') return `<ul class="bullet-list">${value.map((entry) => `<li>${this.escapeHtml(entry)}</li>`).join('')}</ul>`;
    if (field.t === 'tags') return `<div class="chip-row">${value.map((entry) => `<span class="tag-chip">${this.escapeHtml(entry)}</span>`).join('')}</div>`;
    if (field.t === 'relationships') return `<div class="mini-grid">${value.map((entry) => `<div class="mini-card"><div class="mini-card-title">${this.escapeHtml(entry.name || '')}</div><div class="mini-card-sub">${this.escapeHtml(entry.type || '')}</div><div class="mini-card-copy">${this.escapeHtml(entry.desc || '')}</div></div>`).join('')}</div>`;
    if (field.t === 'abilities') return `<div class="mini-grid">${value.map((entry) => `<div class="mini-card"><div class="mini-card-title">${this.escapeHtml(entry.name || '')}</div><div class="mini-card-sub">${this.escapeHtml(entry.tier || '')}</div><div class="mini-card-copy">${this.escapeHtml(entry.desc || '')}</div></div>`).join('')}</div>`;
    if (field.t === 'quotes') return value.map((entry) => `<blockquote class="quote-block">“${this.escapeHtml(entry.text || '')}”${entry.context ? `<footer>— ${this.escapeHtml(entry.context)}</footer>` : ''}</blockquote>`).join('');
    return `<p>${this.escapeHtml(String(value))}</p>`;
  },

  renderForm(collection, item) {
    const cfg = this.COLLECTIONS[collection];
    const isEdit = !!(item && item.id);
    const title = item ? this.titleFor(item, collection) : `New ${cfg.label}`;
    const fieldsHtml = cfg.fields.map((field) => this.renderFormField(field, item ? item[field.k] : null, collection)).join('');
    const starterButtons = !isEdit ? this.renderStarterKitButtons(collection) : '';
    return `
      <div class="page-header-row">
        <div>
          <div class="eyebrow">${isEdit ? 'EDIT ENTRY' : 'GUIDED TEMPLATE'}</div>
          <h1>${title}</h1>
          <p class="page-description">Template-first page creation with prompts and starter auto-fill.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="${isEdit ? `WF.openDetail('${collection}', '${item.id}')` : `WF.navigate('${collection}')`}">Cancel</button>
        </div>
      </div>
      ${starterButtons}
      <form id="entry-form" class="edit-form" onsubmit="return false;">
        ${fieldsHtml}
        <div class="form-actions">
          ${isEdit ? `<button type="button" class="btn btn-danger" onclick="WF.confirmDelete('${collection}', '${item.id}', '${this.escapeForAttr(title)}')">Delete</button>` : '<span></span>'}
          <button type="button" class="btn btn-primary" onclick="WF.submitForm('${collection}', ${isEdit ? `'${item.id}'` : 'null'})">${isEdit ? 'Save Changes' : `Create ${cfg.label}`}</button>
        </div>
      </form>`;
  },

  getTextSuggestions(collection, fieldKey) {
    const titles = (name) => (this.data?.[name] || []).map((item) => this.titleFor(item, name)).filter(Boolean);
    const map = {
      'characters.affiliation': titles('factions'),
      'factions.leader': titles('characters'),
      'factions.territory': titles('locations'),
      'locations.controlledBy': titles('factions'),
      'items.currentHolder': [...titles('characters'), ...titles('factions')],
      'chapters.arc': titles('plots'),
      'chapters.pov': titles('characters'),
      'manuscripts.linkedChapter': titles('chapters'),
    };
    return [...new Set((map[`${collection}.${fieldKey}`] || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  },

  renderStarterKitButtons(collection) {
    const kits = this.STARTER_KITS[collection] || [];
    if (!kits.length) return '';
    return `
      <section class="panel compact-panel">
        <div class="panel-header"><h2>Auto-Fill Starter Kits</h2><span class="panel-sub">Click a template to prefill useful scaffolding</span></div>
        <div class="kit-row">${kits.map((kit, idx) => `<button type="button" class="kit-chip" onclick="WF.applyStarterKit('${collection}', ${idx})">${this.escapeHtml(kit.name)}</button>`).join('')}</div>
      </section>`;
  },

  renderFormField(field, value, collection = this.section) {
    const required = field.req ? '<span class="required">*</span>' : '';
    const hint = field.p ? `<div class="field-hint">${this.escapeHtml(field.p)}</div>` : '';
    const val = value ?? (field.t === 'list' || field.t === 'tags' || field.t === 'relationships' || field.t === 'abilities' || field.t === 'quotes' ? [] : '');
    let input = '';

    if (field.t === 'text') {
      const suggestions = this.getTextSuggestions(collection, field.k);
      const listId = suggestions.length ? `dl-${collection}-${field.k}` : '';
      input = `${suggestions.length ? `<datalist id="${listId}">${suggestions.map((entry) => `<option value="${this.escapeForAttr(entry)}"></option>`).join('')}</datalist>` : ''}<input class="field-input" name="${field.k}" value="${this.escapeForAttr(val)}" ${listId ? `list="${listId}"` : ''}>`;
    } else if (field.t === 'textarea') {
      input = `<textarea class="field-textarea ${field.tall ? 'tall' : ''}" name="${field.k}">${this.escapeHtml(val)}</textarea>`;
    } else if (field.t === 'select') {
      input = `<select class="field-input" name="${field.k}"><option value="">— Select —</option>${(field.opts || []).map((opt) => `<option value="${this.escapeForAttr(opt)}" ${val === opt ? 'selected' : ''}>${this.escapeHtml(opt)}</option>`).join('')}</select>`;
    } else if (field.t === 'richtext') {
      input = `<div class="richtext-wrapper"><div class="richtext-toolbar"><button type="button" class="tool-btn" onclick="WF.rt(event, 'bold')"><b>B</b></button><button type="button" class="tool-btn" onclick="WF.rt(event, 'italic')"><i>I</i></button><button type="button" class="tool-btn" onclick="WF.rt(event, 'insertUnorderedList')">• List</button><button type="button" class="tool-btn" onclick="WF.rt(event, 'formatBlock', '<h2>')">H2</button><button type="button" class="tool-btn" onclick="WF.rt(event, 'formatBlock', '<blockquote>')">Quote</button></div><div class="richtext-editor" contenteditable="true" data-name="${field.k}" onfocus="WF.setActiveEditor(this)" onkeyup="WF.captureEditorSelection()" onmouseup="WF.captureEditorSelection()">${val || ''}</div></div>`;
    } else if (field.t === 'tags') {
      const tags = Array.isArray(val) ? val : [];
      input = `<div class="tag-builder" data-name="${field.k}">${tags.map((tag) => `<span class="tag-item">${this.escapeHtml(tag)}<button type="button" onclick="WF.removeTag(this)">✕</button></span>`).join('')}<input class="tag-input" placeholder="Type and press Enter" onkeydown="WF.addTag(event)"></div>`;
    } else if (field.t === 'list') {
      const items = Array.isArray(val) ? val : [];
      input = `<div class="list-builder" id="list-${field.k}">${items.map((entry) => this.renderSimpleListRow(entry)).join('')}</div><button type="button" class="btn btn-secondary btn-sm" onclick="WF.addListRow('list-${field.k}')">Add Item</button>`;
    } else if (field.t === 'relationships') {
      const items = Array.isArray(val) ? val : [];
      input = `<div class="builder-stack" id="rels-${field.k}">${items.map((entry) => this.renderRelationshipRow(entry)).join('')}</div><button type="button" class="btn btn-secondary btn-sm" onclick="WF.addRelationshipRow('rels-${field.k}')">Add Relationship</button>`;
    } else if (field.t === 'abilities') {
      const items = Array.isArray(val) ? val : [];
      input = `<div class="builder-stack" id="abilities-${field.k}">${items.map((entry) => this.renderAbilityRow(entry)).join('')}</div><button type="button" class="btn btn-secondary btn-sm" onclick="WF.addAbilityRow('abilities-${field.k}')">Add Ability</button>`;
    } else if (field.t === 'quotes') {
      const items = Array.isArray(val) ? val : [];
      input = `<div class="builder-stack" id="quotes-${field.k}">${items.map((entry) => this.renderQuoteRow(entry)).join('')}</div><button type="button" class="btn btn-secondary btn-sm" onclick="WF.addQuoteRow('quotes-${field.k}')">Add Quote</button>`;
    }

    return `<div class="form-field"><label class="field-label">${field.l} ${required}</label>${hint}${input}</div>`;
  },

  renderSimpleListRow(value = '') {
    return `<div class="simple-list-row"><input class="field-input" type="text" value="${this.escapeForAttr(value)}"><button type="button" class="icon-btn" onclick="this.parentElement.remove()">✕</button></div>`;
  },

  renderRelationshipRow(value = {}) {
    return `<div class="builder-card"><input class="field-input" placeholder="Name" value="${this.escapeForAttr(value.name || '')}"><input class="field-input" placeholder="Relationship Type" value="${this.escapeForAttr(value.type || '')}"><textarea class="field-textarea" placeholder="Description">${this.escapeHtml(value.desc || '')}</textarea><div class="builder-actions"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.builder-card').remove()">Remove</button></div></div>`;
  },

  renderAbilityRow(value = {}) {
    const tiers = ['S-Tier', 'A-Tier', 'B-Tier', 'C-Tier', 'D-Tier', 'Signature', 'Passive', 'Unknown'];
    return `<div class="builder-card"><input class="field-input" placeholder="Ability Name" value="${this.escapeForAttr(value.name || '')}"><select class="field-input">${tiers.map((tier) => `<option value="${this.escapeForAttr(tier)}" ${value.tier === tier ? 'selected' : ''}>${tier}</option>`).join('')}</select><textarea class="field-textarea" placeholder="What does this ability do?">${this.escapeHtml(value.desc || '')}</textarea><div class="builder-actions"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.builder-card').remove()">Remove</button></div></div>`;
  },

  renderQuoteRow(value = {}) {
    return `<div class="builder-card"><textarea class="field-textarea" placeholder="Quote text">${this.escapeHtml(value.text || '')}</textarea><input class="field-input" placeholder="Context" value="${this.escapeForAttr(value.context || '')}"><div class="builder-actions"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.builder-card').remove()">Remove</button></div></div>`;
  },

  addListRow(id) {
    const wrap = document.getElementById(id);
    wrap.insertAdjacentHTML('beforeend', this.renderSimpleListRow(''));
  },

  addRelationshipRow(id) {
    document.getElementById(id).insertAdjacentHTML('beforeend', this.renderRelationshipRow({}));
  },

  addAbilityRow(id) {
    document.getElementById(id).insertAdjacentHTML('beforeend', this.renderAbilityRow({}));
  },

  addQuoteRow(id) {
    document.getElementById(id).insertAdjacentHTML('beforeend', this.renderQuoteRow({}));
  },

  applyStarterKit(collection, idx) {
    const kit = (this.STARTER_KITS[collection] || [])[idx];
    if (!kit) return;
    const form = document.getElementById('entry-form');
    if (!form) return;
    Object.entries(kit.fill).forEach(([key, value]) => {
      const standard = form.querySelector(`[name="${key}"]`);
      if (standard) {
        standard.value = Array.isArray(value) ? value.join(', ') : value;
        return;
      }
      const rich = form.querySelector(`.richtext-editor[data-name="${key}"]`);
      if (rich) {
        rich.innerHTML = value;
        return;
      }
      const tags = form.querySelector(`.tag-builder[data-name="${key}"]`);
      if (tags && Array.isArray(value)) {
        tags.querySelectorAll('.tag-item').forEach((item) => item.remove());
        const input = tags.querySelector('.tag-input');
        value.forEach((tag) => {
          const chip = document.createElement('span');
          chip.className = 'tag-item';
          chip.innerHTML = `${this.escapeHtml(tag)}<button type="button" onclick="WF.removeTag(this)">✕</button>`;
          tags.insertBefore(chip, input);
        });
        return;
      }
      const listWrap = form.querySelector(`#list-${key}`);
      if (listWrap && Array.isArray(value)) {
        listWrap.innerHTML = value.map((entry) => this.renderSimpleListRow(entry)).join('');
      }
    });
    this.toast(`${kit.name} applied`, 'success');
  },

  activeEditor: null,
  savedEditorRange: null,

  setActiveEditor(element) {
    this.activeEditor = element || null;
    this.captureEditorSelection();
  },

  captureEditorSelection() {
    const sel = window.getSelection ? window.getSelection() : null;
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const editor = this.activeEditor;
    if (editor && editor.contains(range.commonAncestorContainer)) {
      this.savedEditorRange = range.cloneRange();
    }
  },

  restoreEditorSelection(editor) {
    const sel = window.getSelection ? window.getSelection() : null;
    if (!sel || !editor) return;
    if (this.savedEditorRange && editor.contains(this.savedEditorRange.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(this.savedEditorRange);
      return;
    }
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  },

  rt(eventOrCommand, maybeCommand = null, value = null) {
    let command = eventOrCommand;
    let trigger = null;
    if (eventOrCommand && typeof eventOrCommand === 'object' && 'preventDefault' in eventOrCommand) {
      trigger = eventOrCommand.currentTarget;
      eventOrCommand.preventDefault();
      command = maybeCommand;
    } else {
      value = maybeCommand;
    }
    const editor = trigger?.closest('.richtext-wrapper, .manuscript-editor-shell')?.querySelector('.richtext-editor, .manuscript-editor') || this.activeEditor;
    if (!editor) return;
    this.activeEditor = editor;
    editor.focus();
    this.restoreEditorSelection(editor);
    document.execCommand(command, false, value);
    editor.focus();
    this.captureEditorSelection();
  },

  addTag(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const input = event.target;
    const value = input.value.trim();
    if (!value) return;
    const chip = document.createElement('span');
    chip.className = 'tag-item';
    chip.innerHTML = `${this.escapeHtml(value)}<button type="button" onclick="WF.removeTag(this)">✕</button>`;
    input.parentElement.insertBefore(chip, input);
    input.value = '';
  },

  removeTag(button) {
    button.parentElement.remove();
  },

  async submitForm(collection, id = null) {
    const cfg = this.COLLECTIONS[collection];
    const form = document.getElementById('entry-form');
    const payload = {};

    cfg.fields.forEach((field) => {
      if (['text', 'textarea', 'select'].includes(field.t)) {
        const el = form.querySelector(`[name="${field.k}"]`);
        payload[field.k] = el ? el.value.trim() : '';
      } else if (field.t === 'richtext') {
        const el = form.querySelector(`.richtext-editor[data-name="${field.k}"]`);
        payload[field.k] = el ? el.innerHTML.trim() : '';
      } else if (field.t === 'tags') {
        const el = form.querySelector(`.tag-builder[data-name="${field.k}"]`);
        payload[field.k] = el ? [...el.querySelectorAll('.tag-item')].map((item) => item.childNodes[0].textContent.trim()).filter(Boolean) : [];
      } else if (field.t === 'list') {
        const el = form.querySelector(`#list-${field.k}`);
        payload[field.k] = el ? [...el.querySelectorAll('input')].map((input) => input.value.trim()).filter(Boolean) : [];
      } else if (field.t === 'relationships') {
        const cards = [...form.querySelectorAll(`#rels-${field.k} .builder-card`)];
        payload[field.k] = cards.map((card) => {
          const inputs = card.querySelectorAll('input, textarea');
          return { name: inputs[0].value.trim(), type: inputs[1].value.trim(), desc: inputs[2].value.trim() };
        }).filter((entry) => entry.name || entry.type || entry.desc);
      } else if (field.t === 'abilities') {
        const cards = [...form.querySelectorAll(`#abilities-${field.k} .builder-card`)];
        payload[field.k] = cards.map((card) => {
          const name = card.querySelector('input').value.trim();
          const tier = card.querySelector('select').value.trim();
          const desc = card.querySelector('textarea').value.trim();
          return { name, tier, desc };
        }).filter((entry) => entry.name || entry.desc);
      } else if (field.t === 'quotes') {
        const cards = [...form.querySelectorAll(`#quotes-${field.k} .builder-card`)];
        payload[field.k] = cards.map((card) => {
          const text = card.querySelector('textarea').value.trim();
          const context = card.querySelector('input').value.trim();
          return { text, context };
        }).filter((entry) => entry.text || entry.context);
      }
    });

    const missing = cfg.fields.filter((field) => field.req && !payload[field.k]);
    if (missing.length) {
      this.toast(`Please fill in: ${missing.map((entry) => entry.l).join(', ')}`, 'error');
      return;
    }

    try {
      const saved = await this.saveItem(collection, payload, id);
      this.renderNav();
      this.toast(`${cfg.label} saved`, 'success');
      this.editingId = null;
      this.openDetail(collection, saved.id);
    } catch (error) {
      this.toast('Save failed', 'error');
    }
  },

  renderTimeline() {
    const items = [...(this.data.timelineEvents || [])].sort((a, b) => (parseFloat(a.dateValue) || 0) - (parseFloat(b.dateValue) || 0));
    if (items.length < 2) {
      return `
        <div class="page-header-row">
          <div><div class="eyebrow">SERIES CHRONOLOGY</div><h1>Timeline</h1><p class="page-description">Place milestones left-to-right using the numeric date value so your canon stays easy to follow.</p></div>
          <div class="page-actions"><button class="btn btn-primary" onclick="WF.startCreate('timelineEvents')">New Timeline Event</button></div>
        </div>
        <div class="empty-state"><div class="empty-icon">⊠</div><h3>Not enough events yet</h3><p>Add at least two timeline events to see the chronology line.</p></div>`;
    }
    const numeric = items.map((item) => parseFloat(item.dateValue) || 0);
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    const range = max - min || 1;
    const nodes = items.map((item, index) => {
      const left = ((parseFloat(item.dateValue) || 0) - min) / range * 100;
      const above = index % 2 === 0;
      const color = this.timelineColor(item.type);
      return `
        <button class="timeline-node ${above ? 'above' : 'below'}" style="left:${left}%; --node-color:${color}" onclick="WF.openDetail('timelineEvents', '${item.id}')">
          <span class="timeline-dot"></span>
          <span class="timeline-card">
            <span class="timeline-date">${this.escapeHtml(item.date || '')}</span>
            <strong>${this.escapeHtml(item.name || 'Untitled')}</strong>
            <span>${this.escapeHtml((item.overview || '').slice(0, 120))}${(item.overview || '').length > 120 ? '…' : ''}</span>
          </span>
        </button>`;
    }).join('');

    return `
      <div class="page-header-row">
        <div><div class="eyebrow">SERIES CHRONOLOGY</div><h1>Chronology</h1><p class="page-description">A canon timeline for your story, factions, eras, and turning points.</p></div>
        <div class="page-actions"><button class="btn btn-primary" onclick="WF.startCreate('timelineEvents')">New Timeline Event</button></div>
      </div>
      <section class="panel">
        <div class="panel-header"><h2>Timeline Track</h2><span class="panel-sub">Events are positioned from their numeric date value</span></div>
        <div class="timeline-wrap">
          <div class="timeline-axis"></div>
          ${nodes}
        </div>
      </section>`;
  },

  timelineColor(type) {
    const map = {
      'War / Conflict': '#ef4444',
      Political: '#8b5cf6',
      Personal: '#22c55e',
      'Discovery / Invention': '#3b82f6',
      'Formation / Founding': '#f59e0b',
      'Collapse / End': '#64748b',
      Supernatural: '#ec4899',
      Cultural: '#0891b2',
      Other: '#94a3b8',
    };
    return map[type] || '#94a3b8';
  },

  renderManuscriptList() {
    const items = this.data.manuscripts || [];
    const cards = items.length ? items.map((item) => `
      <button class="manuscript-card" onclick="WF.openManuscript('${item.id}')">
        <div class="manuscript-title">${this.escapeHtml(item.title || 'Untitled')}</div>
        <div class="manuscript-meta">${this.escapeHtml(item.status || 'Draft')} ${item.linkedChapter ? `· ${this.escapeHtml(item.linkedChapter)}` : ''}</div>
        <div class="manuscript-snippet">${this.escapeHtml(this.stripHtml(item.content || item.synopsis || '').slice(0, 180))}${this.stripHtml(item.content || item.synopsis || '').length > 180 ? '…' : ''}</div>
      </button>`).join('') : '<div class="empty-state"><h3>No manuscripts yet</h3><p>Create a draft, outline, or scene document.</p></div>';
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">WRITING STUDIO</div><h1>Drafts & Writing</h1><p class="page-description">Long-form writing space for chapters, episodes, scenes, outlines, and comic scripts.</p></div>
        <div class="page-actions"><button class="btn btn-primary" onclick="WF.startCreate('manuscripts')">New Manuscript</button></div>
      </div>
      <div class="manuscript-grid">${cards}</div>`;
  },

  openManuscript(id) {
    this.section = `ms_${id}`;
    this.renderNav();
    this.render();
  },

  renderManuscriptEditor(id) {
    const item = this.findItem('manuscripts', id);
    if (!item) return '<div class="empty-state"><h3>Manuscript not found</h3></div>';
    const count = this.countWords(this.stripHtml(item.content || ''));
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">MANUSCRIPT EDITOR</div><h1>${this.escapeHtml(item.title || 'Untitled')}</h1><p class="page-description">Dedicated writing space with rich text editing and local save.</p></div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WF.navigate('manuscripts')">Back</button>
          <button class="btn btn-primary" onclick="WF.saveManuscript('${id}')">Save Manuscript</button>
        </div>
      </div>
      <section class="panel manuscript-editor-shell">
        <div class="manuscript-meta-row">
          <input id="ms-title" class="field-input" value="${this.escapeForAttr(item.title || '')}">
          <select id="ms-status" class="field-input">
            ${['Outline', 'First Draft', '2nd Draft', 'Revision', 'Polished Draft', 'Final'].map((opt) => `<option value="${opt}" ${item.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
          <input id="ms-chapter" class="field-input" value="${this.escapeForAttr(item.linkedChapter || '')}" placeholder="Linked Chapter">
          <div id="ms-word-count" class="word-count">${count} words</div>
        </div>
        <div class="richtext-toolbar manuscript-toolbar"><button type="button" class="tool-btn" onclick="WF.rt(event, 'bold')"><b>B</b></button><button type="button" class="tool-btn" onclick="WF.rt(event, 'italic')"><i>I</i></button><button type="button" class="tool-btn" onclick="WF.rt(event, 'insertUnorderedList')">• List</button><button type="button" class="tool-btn" onclick="WF.rt(event, 'formatBlock', '<h2>')">H2</button><button type="button" class="tool-btn" onclick="WF.rt(event, 'formatBlock', '<blockquote>')">Quote</button></div>
        <div id="ms-content" class="manuscript-editor" contenteditable="true" onfocus="WF.setActiveEditor(this)" onkeyup="WF.captureEditorSelection()" onmouseup="WF.captureEditorSelection()" oninput="WF.msWordCount(this)">${item.content || ''}</div>
      </section>`;
  },

  msWordCount(element) {
    const count = this.countWords(this.stripHtml(element.innerHTML));
    document.getElementById('ms-word-count').textContent = `${count} words`;
  },

  async saveManuscript(id) {
    try {
      const payload = {
        title: document.getElementById('ms-title').value.trim(),
        status: document.getElementById('ms-status').value,
        linkedChapter: document.getElementById('ms-chapter').value.trim(),
        content: document.getElementById('ms-content').innerHTML,
      };
      const saved = await this.saveItem('manuscripts', payload, id);
      this.section = `ms_${saved.id}`;
      this.renderNav();
      this.render();
      this.toast('Manuscript saved', 'success');
    } catch (error) {
      this.toast('Failed to save manuscript', 'error');
    }
  },

  showSettings() {
    const meta = this.data.meta || {};
    this.showModal(
      'Project Settings',
      `
        <div class="form-field"><label class="field-label">Project Name</label><input id="set-project-name" class="field-input" value="${this.escapeForAttr(meta.projectName || '')}"></div>
        <div class="form-field"><label class="field-label">Genre / Type</label><input id="set-project-genre" class="field-input" value="${this.escapeForAttr(meta.genre || '')}"></div>
        <div class="form-field"><label class="field-label">Description</label><textarea id="set-project-description" class="field-textarea tall">${this.escapeHtml(meta.description || '')}</textarea></div>`,
      `<button class="btn btn-secondary" onclick="WF.closeModal()">Cancel</button><button class="btn btn-primary" onclick="WF.commitSettings()">Save</button>`
    );
  },

  async commitSettings() {
    try {
      await this.saveMeta({
        projectName: document.getElementById('set-project-name').value.trim(),
        genre: document.getElementById('set-project-genre').value.trim(),
        description: document.getElementById('set-project-description').value.trim(),
      });
      this.closeModal();
      this.render();
      this.toast('Settings saved', 'success');
    } catch (error) {
      this.toast('Could not save settings', 'error');
    }
  },

  showModal(title, body, footer = '') {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-footer').innerHTML = footer;
    document.getElementById('modal-overlay').classList.remove('hidden');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  closeModalOnBg(event) {
    if (event.target.id === 'modal-overlay') this.closeModal();
  },

  confirmDelete(collection, id, title) {
    this.showModal(
      'Delete Entry',
      `<p>Delete <strong>${this.escapeHtml(title)}</strong>? This cannot be undone.</p>`,
      `<button class="btn btn-secondary" onclick="WF.closeModal()">Cancel</button><button class="btn btn-danger" onclick="WF.doDelete('${collection}', '${id}')">Delete</button>`
    );
  },

  async doDelete(collection, id) {
    try {
      await this.deleteItem(collection, id);
      this.closeModal();
      this.renderNav();
      this.navigate(collection);
      this.toast('Entry deleted', 'success');
    } catch (error) {
      this.toast('Delete failed', 'error');
    }
  },

  search(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) {
      this.render();
      return;
    }
    const results = [];
    Object.keys(this.COLLECTIONS).forEach((collection) => {
      (this.data[collection] || []).forEach((item) => {
        const haystack = JSON.stringify(item).toLowerCase();
        if (haystack.includes(q)) results.push({ ...item, _collection: collection });
      });
    });
    document.getElementById('content-area').innerHTML = `
      <div class="page-header-row">
        <div><div class="eyebrow">SEARCH RESULTS</div><h1>Search: ${this.escapeHtml(query)}</h1><p class="page-description">${results.length} result${results.length === 1 ? '' : 's'} across your whole wiki.</p></div>
      </div>
      <div class="search-result-list">${results.length ? results.map((item) => {
        const cfg = this.COLLECTIONS[item._collection];
        return `<button class="search-result" onclick="WF.openDetail('${item._collection}', '${item.id}')"><div class="search-result-icon">${cfg.icon}</div><div><div class="search-result-title">${this.escapeHtml(this.titleFor(item, item._collection))}</div><div class="search-result-meta">${cfg.label}</div><div class="search-result-copy">${this.escapeHtml(this.stripHtml(item.overview || item.synopsis || item.description || item.influence || '').slice(0, 160))}</div></div></button>`;
      }).join('') : '<div class="empty-state"><h3>No matches found</h3></div>'}</div>`;
  },

  async exportZIP() {
    this.toast('Building ZIP export…', 'info');
    const response = await fetch('/api/export.zip');
    if (!response.ok) {
      this.toast('Export failed', 'error');
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'storyatlas_export.zip';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    this.toast('ZIP exported', 'success');
  },

  titleFor(item, collection) {
    const cfg = this.COLLECTIONS[collection];
    const key = cfg ? cfg.titleKey : 'name';
    return item[key] || item.name || item.title || 'Untitled';
  },

  findItem(collection, id) {
    return (this.data[collection] || []).find((item) => item.id === id);
  },

  statusClass(status) {
    return this.STATUS_CLASSES[status] || 'badge-outline';
  },

  timeAgo(timestamp) {
    if (!timestamp) return 'just now';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  },

  stripHtml(value) {
    return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  },

  countWords(value) {
    const clean = String(value || '').trim();
    return clean ? clean.split(/\s+/).length : 0;
  },

  toast(message, kind = 'info') {
    const stack = document.getElementById('toast-stack');
    const node = document.createElement('div');
    node.className = `toast ${kind}`;
    node.textContent = message;
    stack.appendChild(node);
    setTimeout(() => node.classList.add('show'), 10);
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 250);
    }, 2600);
  },

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeForAttr(value) {
    return this.escapeHtml(value).replace(/`/g, '&#96;');
  },
};

document.addEventListener('DOMContentLoaded', () => {
  WF.init().catch((error) => {
    console.error(error);
    document.getElementById('content-area').innerHTML = '<div class="empty-state"><h3>App failed to load</h3><p>Check the console and make sure the Flask server is running.</p></div>';
  });
});

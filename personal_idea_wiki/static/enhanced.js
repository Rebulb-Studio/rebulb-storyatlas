(function () {
  const EXTRA_SECTIONS = [
    { id: 'worldBible', label: 'Series Bible', icon: '✦', group: 'WORKSPACE' },
    { id: 'atlasMap', label: 'World Map', icon: '⌖', group: 'WORKSPACE' },
    { id: 'publicWiki', label: 'Public Wiki', icon: '☍', group: 'WORKSPACE' },
    { id: 'canonGraph', label: 'Canon Graph', icon: '⇄', group: 'WORKSPACE' },
    { id: 'storyCanvas', label: 'Story Canvas', icon: '☰', group: 'WORKSPACE' },
    { id: 'stats', label: 'Project Stats', icon: '▤', group: 'WORKSPACE' },
    { id: 'scratchpad', label: 'Scratch Pad', icon: '✎', group: 'WORKSPACE' },
  ];

  const WRITING_PROMPTS = [
    'What truth about your world would shatter a character if they learned it too early?',
    'What does power cost in your story emotionally, socially, and physically?',
    'Which faction thinks it is heroic, and what makes that belief genuinely convincing?',
    'What ordinary daily ritual would feel strange or impossible in our world?',
    'What historical event still shapes politics, class, or fear in the present day?',
    'What law or custom exists specifically because of something terrible that happened?',
    'What does your antagonist genuinely love that makes them human?',
    'What is the most beautiful thing that still exists despite everything?',
    'What does your protagonist want versus what do they actually need?',
    'Which alliance in your story is built entirely on a mutual lie?',
  ];

  const FIELD_HELP = {
    name: 'Use the most recognizable name for the entry. You can add nicknames separately.',
    title: 'Use a clear title you will recognize later in search and exports.',
    aliases: 'Add alternate names so search is more forgiving.',
    status: 'This is the quickest way to understand the current state of the entry.',
    role: 'Think about narrative function, not just job title.',
    affiliation: 'Faction, family, school, crew, institution, or loyalty.',
    appearance: 'Focus on the few details that make the person instantly recognizable.',
    personality: 'Public self, private self, and pressure response are usually enough to start strong.',
    motivations: 'What do they actively want, and what pain or belief drives that want?',
    background: 'Only include past events that still matter in the present story.',
    abilities: 'List what they can do and what it costs or fails against.',
    relationships: 'Tension matters more than labels. Add why the relationship feels the way it does.',
    storyNotes: 'Use this for your author-only thinking, future plans, and arc notes.',
    overview: 'Write the shortest explanation that still makes the entry matter.',
    synopsis: 'Summarize setup, escalation, and consequence in one tight paragraph.',
    ideology: 'Write this as if the faction truly believes it is right.',
    goals: 'Use one line per goal. The best goals create friction with other entries.',
    hierarchy: 'Who actually has power, who enforces it, and who pays the cost?',
    geography: 'What does the place feel like physically and emotionally?',
    history: 'Include only the parts of the past that still create present pressure.',
    storySignificance: 'Why is this place, system, or item in your story instead of a generic version?',
    mechanics: 'Explain the internal logic clearly enough that future scenes stay consistent.',
    costs: 'Costs and limits make a power system more interesting than raw strength.',
    conflict: 'What makes this arc impossible to resolve cleanly?',
    climax: 'What must finally be confronted?',
    resolution: 'What changes permanently after the conflict ends?',
    themes: 'A few repeated ideas are enough. Let the scenes carry the rest.',
    content: 'Draft freely. You can clean it later.',
    influence: 'Be specific about what inspired you and what you want to avoid copying.',
  };

  const original = {
    init: WF.init.bind(WF),
    render: WF.render.bind(WF),
    renderNav: WF.renderNav.bind(WF),
    navigate: WF.navigate.bind(WF),
    openDetail: WF.openDetail.bind(WF),
    openManuscript: WF.openManuscript.bind(WF),
    showSettings: WF.showSettings.bind(WF),
    saveItem: WF.saveItem.bind(WF),
    saveMeta: WF.saveMeta.bind(WF),
    deleteItem: WF.deleteItem.bind(WF),
    exportZIP: WF.exportZIP.bind(WF),
    renderCollectionList: WF.renderCollectionList.bind(WF),
    renderEntryCard: WF.renderEntryCard.bind(WF),
    renderForm: WF.renderForm.bind(WF),
    renderFieldValue: WF.renderFieldValue.bind(WF),
    submitForm: WF.submitForm.bind(WF),
    saveManuscript: WF.saveManuscript.bind(WF),
  };

  Object.assign(WF, {
    enhancedReady: false,
    recentKeys: [],
    darkMode: false,
    scratchpadLocal: '',
    commandResults: [],
    commandIndex: -1,
    searchResults: [],
    searchIndex: -1,
    writingGoalWords: 1200,
    promptIndex: 0,
    helpTab: 'getting-started',
    saveStatus: 'ready',
    lastSaveTime: null,
    _scratchTimer: null,

    async loadAll() {
      await this.loadData();
      return this.data;
    },

    loadEnhancedPrefs() {
      try {
        this.recentKeys = JSON.parse(localStorage.getItem('wf_recent_keys') || '[]');
      } catch {
        this.recentKeys = [];
      }
      this.darkMode = localStorage.getItem('wf_dark_mode') === '1';
      this.scratchpadLocal = localStorage.getItem('wf_scratchpad_local') || '';
      this.writingGoalWords = parseInt(localStorage.getItem('wf_writing_goal') || '1200', 10) || 1200;
      this.promptIndex = parseInt(localStorage.getItem('wf_prompt_index') || '0', 10) || 0;
    },

    saveEnhancedPrefs() {
      localStorage.setItem('wf_recent_keys', JSON.stringify(this.recentKeys.slice(0, 30)));
      localStorage.setItem('wf_dark_mode', this.darkMode ? '1' : '0');
      localStorage.setItem('wf_scratchpad_local', this.scratchpadLocal || '');
      localStorage.setItem('wf_writing_goal', String(this.writingGoalWords));
      localStorage.setItem('wf_prompt_index', String(this.promptIndex));
    },

    injectShellEnhancements() {
      if (document.getElementById('wf-help-overlay')) return;

      const helpOverlay = document.createElement('div');
      helpOverlay.id = 'wf-help-overlay';
      helpOverlay.className = 'modal-overlay hidden';
      helpOverlay.innerHTML = `
        <div class="modal-card help-card">
          <div class="modal-header">
            <div class="modal-title">Help & Reference</div>
            <button class="icon-btn" type="button" onclick="WF.closeHelp()">✕</button>
          </div>
          <div class="help-shell">
            <div id="wf-help-tabs" class="help-tabs"></div>
            <div id="wf-help-content" class="help-content"></div>
          </div>
        </div>`;
      helpOverlay.addEventListener('click', (event) => {
        if (event.target.id === 'wf-help-overlay') this.closeHelp();
      });
      document.body.appendChild(helpOverlay);

      const onboarding = document.createElement('div');
      onboarding.id = 'wf-onboarding-overlay';
      onboarding.className = 'modal-overlay hidden';
      onboarding.innerHTML = `
        <div class="modal-card onboarding-card">
          <div id="wf-onboarding-content"></div>
        </div>`;
      document.body.appendChild(onboarding);

      const statusbar = document.createElement('footer');
      statusbar.id = 'wf-statusbar';
      statusbar.className = 'statusbar';
      statusbar.innerHTML = `
        <div id="status-project" class="status-chip status-project">StoryAtlas</div>
        <div id="status-entries" class="status-chip">0 entries</div>
        <div id="status-words" class="status-chip">0 words</div>
        <div id="status-save" class="status-chip status-save ready">● Ready</div>`;
      document.body.appendChild(statusbar);
    },

    bindEnhancedEvents() {
      document.getElementById('help-btn')?.addEventListener('click', () => this.openHelp('getting-started'));
      document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());
      document.getElementById('notes-btn')?.addEventListener('click', () => this.navigate('scratchpad'));
      document.getElementById('command-btn')?.addEventListener('click', () => this.openCommandPalette());
      document.getElementById('import-file-input')?.addEventListener('change', (event) => this.handleImportFile(event));

      const search = document.getElementById('global-search');
      if (search) {
        search.addEventListener('input', (event) => this.handleSearchInput(event.target.value));
        search.addEventListener('keydown', (event) => this.handleSearchKeydown(event));
        search.addEventListener('focus', () => this.showSearchDropdown());
      }

      const cmdInput = document.getElementById('command-input');
      if (cmdInput) {
        cmdInput.addEventListener('input', (event) => {
          this.commandIndex = -1;
          this.renderCommandResults(event.target.value || '');
        });
        cmdInput.addEventListener('keydown', (event) => this.handleCommandKeydown(event));
      }

      document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-wrap')) this.hideSearchDropdown();
      });

      document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.openCommandPalette();
        } else if (event.key === 'Escape') {
          this.hideSearchDropdown();
          this.closeCommandPalette();
          this.closeHelp();
        }
      });
    },

    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.darkMode ? 'dark' : 'light');
      const button = document.getElementById('theme-toggle');
      if (button) button.textContent = this.darkMode ? '☀ Light' : '◑ Dark';
    },

    toggleTheme() {
      this.darkMode = !this.darkMode;
      this.applyTheme();
      this.saveEnhancedPrefs();
      this.toast(this.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    },

    updateStatusBar() {
      const project = document.getElementById('status-project');
      const entries = document.getElementById('status-entries');
      const words = document.getElementById('status-words');
      const save = document.getElementById('status-save');
      const meta = this.data?.meta || {};
      if (project) project.textContent = meta.projectName || 'StoryAtlas';
      if (entries) {
        const total = this.getTotalEntries();
        entries.textContent = `${total} ${total === 1 ? 'entry' : 'entries'}`;
      }
      if (words) words.textContent = `${this.estimateTotalWords().toLocaleString()} words`;
      if (save) {
        save.className = `status-chip status-save ${this.saveStatus}`;
        if (this.saveStatus === 'saving') save.textContent = '◌ Saving…';
        else if (this.saveStatus === 'error') save.textContent = '✗ Save failed';
        else if (this.lastSaveTime) save.textContent = `✓ Saved ${this.formatRelativeTime(this.lastSaveTime)}`;
        else save.textContent = '● Ready';
      }
    },

    signalSave() {
      this.saveStatus = 'saving';
      this.updateStatusBar();
    },

    signalSaved() {
      this.saveStatus = 'saved';
      this.lastSaveTime = new Date().toISOString();
      this.updateStatusBar();
    },

    signalSaveError() {
      this.saveStatus = 'error';
      this.updateStatusBar();
    },

    itemKey(collection, id) {
      return `${collection}:${id}`;
    },

    pushRecent(collection, id) {
      const key = this.itemKey(collection, id);
      this.recentKeys = [key, ...this.recentKeys.filter((entry) => entry !== key)].slice(0, 20);
      this.saveEnhancedPrefs();
    },

    getAllEntries() {
      const rows = [];
      Object.keys(this.COLLECTIONS).forEach((collection) => {
        (this.data?.[collection] || []).forEach((item) => {
          rows.push({ ...item, _collection: collection });
        });
      });
      return rows;
    },

    getRecentEntries(limit = 8) {
      return this.recentKeys.map((key) => {
        const [collection, id] = key.split(':');
        const item = this.findItem(collection, id);
        return item ? { ...item, _collection: collection } : null;
      }).filter(Boolean).slice(0, limit);
    },

    getTotalEntries() {
      return Object.keys(this.COLLECTIONS).reduce((sum, key) => sum + ((this.data?.[key] || []).length), 0);
    },

    getCompleteness(collection, item) {
      const cfg = this.COLLECTIONS[collection];
      if (!cfg) return 0;
      const total = cfg.fields.length || 1;
      const complete = cfg.fields.filter((field) => {
        const value = item[field.k];
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && String(value).trim() !== '';
      }).length;
      return Math.round((complete / total) * 100);
    },

    estimateTotalWords() {
      const keys = ['overview', 'synopsis', 'description', 'background', 'history', 'appearance', 'personality', 'motivations', 'ideology', 'geography', 'content', 'storyNotes', 'conflict', 'resolution', 'climax', 'influence', 'values', 'customs', 'mechanics', 'consequences'];
      let total = this.countWords(this.scratchpadLocal || '');
      this.getAllEntries().forEach((item) => {
        keys.forEach((key) => {
          if (item[key]) total += this.countWords(this.stripHtml(String(item[key])));
        });
      });
      return total;
    },

    formatRelativeTime(value) {
      if (!value) return 'just now';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    },

    getCoverageRows() {
      return Object.keys(this.COLLECTIONS).map((key) => {
        const cfg = this.COLLECTIONS[key];
        const items = this.data?.[key] || [];
        const avg = items.length ? Math.round(items.reduce((sum, item) => sum + this.getCompleteness(key, item), 0) / items.length) : 0;
        return { key, cfg, count: items.length, average: avg };
      }).sort((a, b) => b.count - a.count || b.average - a.average);
    },

    nextPrompt() {
      this.promptIndex = (this.promptIndex + 1) % WRITING_PROMPTS.length;
      this.saveEnhancedPrefs();
      if (this.section === 'dashboard') this.render();
    },

    async createQuickDraft() {
      const count = (this.data?.manuscripts || []).length + 1;
      const title = `Untitled Draft ${count}`;
      try {
        const saved = await this.saveItem('manuscripts', {
          title,
          status: 'First Draft',
          linkedChapter: '',
          content: '<p></p>',
          synopsis: '',
        });
        this.pushRecent('manuscripts', saved.id);
        this.section = `ms_${saved.id}`;
        this.editingId = null;
        this.renderNav();
        this.render();
        this.toast('Blank draft created', 'success');
        setTimeout(() => document.getElementById('ms-content')?.focus(), 20);
        return saved;
      } catch (error) {
        this.toast('Could not create a draft', 'error');
        throw error;
      }
    },

    getCommandItems(query = '') {
      const items = [];
      const q = query.trim().toLowerCase();
      EXTRA_SECTIONS.forEach((section) => items.push({ kind: 'section', icon: section.icon, label: section.label, meta: section.group, action: () => this.navigate(section.id) }));
      this.NAV.forEach((section) => items.push({ kind: 'section', icon: section.icon, label: section.label, meta: section.group || 'CORE', action: () => this.navigate(section.id) }));
      Object.keys(this.COLLECTIONS).forEach((collection) => items.push({
        kind: 'create',
        icon: '+',
        label: `Create ${this.COLLECTIONS[collection].label}`,
        meta: collection,
        action: () => collection === 'manuscripts' ? this.createQuickDraft() : this.startCreate(collection),
      }));
      this.getRecentEntries(6).forEach((item) => {
        const cfg = this.COLLECTIONS[item._collection];
        items.push({ kind: 'recent', icon: cfg.icon, label: this.titleFor(item, item._collection), meta: `${cfg.label} · recent`, action: () => this.openDetail(item._collection, item.id) });
      });
      items.push({ kind: 'action', icon: '?', label: 'Open Help & Reference', meta: 'Help', action: () => this.openHelp('getting-started') });
      items.push({ kind: 'action', icon: '⬇', label: 'Export ZIP', meta: 'Backup', action: () => this.exportZIP() });
      items.push({ kind: 'action', icon: '⤓', label: 'Export JSON Backup', meta: 'Backup', action: () => this.downloadJsonBackup() });
      if (!q) return items.slice(0, 22);
      return items.filter((item) => `${item.label} ${item.meta}`.toLowerCase().includes(q)).slice(0, 30);
    },

    openCommandPalette() {
      document.getElementById('command-overlay')?.classList.remove('hidden');
      const input = document.getElementById('command-input');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 10);
      }
      this.commandIndex = -1;
      this.renderCommandResults('');
    },

    closeCommandPalette() {
      document.getElementById('command-overlay')?.classList.add('hidden');
    },

    closeCommandPaletteOnBg(event) {
      if (event.target.id === 'command-overlay') this.closeCommandPalette();
    },

    renderCommandResults(query) {
      this.commandResults = this.getCommandItems(query);
      const wrap = document.getElementById('command-results');
      if (!wrap) return;
      if (!this.commandResults.length) {
        wrap.innerHTML = '<div class="search-drop-empty">No matches. Try a collection, page, or action.</div>';
        return;
      }
      wrap.innerHTML = this.commandResults.map((item, index) => `
        <button type="button" class="command-item ${index === this.commandIndex ? 'active' : ''}" onclick="WF.runCommand(${index})">
          <div class="command-item-icon">${item.icon}</div>
          <div class="command-item-body"><strong>${this.escapeHtml(item.label)}</strong><small>${this.escapeHtml(item.meta || '')}</small></div>
        </button>`).join('');
    },

    runCommand(index) {
      const item = this.commandResults[index];
      if (!item) return;
      this.closeCommandPalette();
      item.action();
    },

    handleCommandKeydown(event) {
      if (event.key === 'Escape') {
        this.closeCommandPalette();
        return;
      }
      if (!this.commandResults.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.commandIndex = Math.min(this.commandIndex + 1, this.commandResults.length - 1);
        this.renderCommandResults(event.target.value || '');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.commandIndex = Math.max(this.commandIndex - 1, 0);
        this.renderCommandResults(event.target.value || '');
      } else if (event.key === 'Enter' && this.commandIndex >= 0) {
        event.preventDefault();
        this.runCommand(this.commandIndex);
      }
    },

    buildSearchResults(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      return this.getAllEntries().filter((item) => JSON.stringify(item).toLowerCase().includes(q)).slice(0, 10);
    },

    handleSearchInput(value) {
      const query = value.trim();
      if (query.startsWith('/')) {
        this.openCommandPalette();
        const input = document.getElementById('command-input');
        if (input) {
          input.value = query.slice(1);
          this.renderCommandResults(input.value);
        }
        this.hideSearchDropdown();
        return;
      }
      this.searchResults = this.buildSearchResults(query);
      const drop = document.getElementById('search-dropdown');
      if (!drop) return;
      if (!query) {
        drop.innerHTML = '';
        this.hideSearchDropdown();
        return;
      }
      if (!this.searchResults.length) {
        drop.innerHTML = '<div class="search-drop-empty">No quick matches. Press Enter to run a full search.</div>';
        drop.classList.remove('hidden');
        return;
      }
      drop.innerHTML = this.searchResults.map((item, index) => {
        const cfg = this.COLLECTIONS[item._collection];
        const excerpt = this.stripHtml(item.overview || item.synopsis || item.description || item.influence || item.storyNotes || '').slice(0, 110);
        return `
          <button type="button" class="search-drop-item ${index === this.searchIndex ? 'active' : ''}" onclick="WF.openQuickSearchResult(${index})">
            <div class="search-drop-icon">${cfg.icon}</div>
            <div class="search-drop-copy">
              <div class="search-drop-title">${this.escapeHtml(this.titleFor(item, item._collection))}</div>
              <div class="search-drop-meta">${this.escapeHtml(cfg.label)} · ${this.escapeHtml(excerpt)}${excerpt.length >= 110 ? '…' : ''}</div>
            </div>
          </button>`;
      }).join('');
      drop.classList.remove('hidden');
    },

    openQuickSearchResult(index) {
      const item = this.searchResults[index];
      if (!item) return;
      this.hideSearchDropdown();
      this.openDetail(item._collection, item.id);
    },

    showSearchDropdown() {
      if (this.searchResults.length) document.getElementById('search-dropdown')?.classList.remove('hidden');
    },

    hideSearchDropdown() {
      document.getElementById('search-dropdown')?.classList.add('hidden');
      this.searchIndex = -1;
    },

    handleSearchKeydown(event) {
      if (event.key === 'Escape') {
        this.hideSearchDropdown();
        return;
      }
      if (event.key === 'Enter' && this.searchIndex < 0) {
        this.search(event.target.value.trim());
        this.hideSearchDropdown();
        return;
      }
      if (!this.searchResults.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.searchIndex = Math.min(this.searchIndex + 1, this.searchResults.length - 1);
        this.handleSearchInput(event.target.value);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.searchIndex = Math.max(this.searchIndex - 1, 0);
        this.handleSearchInput(event.target.value);
      } else if (event.key === 'Enter' && this.searchIndex >= 0) {
        event.preventDefault();
        this.openQuickSearchResult(this.searchIndex);
      }
    },

    renderDashboardEnhanced() {
      const meta = this.data?.meta || {};
      const totalEntries = this.getTotalEntries();
      const totalWords = this.estimateTotalWords();
      const prompt = WRITING_PROMPTS[this.promptIndex % WRITING_PROMPTS.length];
      const coverage = this.getCoverageRows();
      const recent = this.getRecentEntries(6);
      const used = coverage.filter((row) => row.count > 0).length;
      const goalPct = Math.min(100, Math.round((totalWords / Math.max(this.writingGoalWords, 1)) * 100));

      const quickStart = [
        ['characters', 'Build someone unforgettable'],
        ['locations', 'Define where the story breathes'],
        ['factions', 'Create groups with pressure and ideology'],
        ['systems', 'Lock in clear rules and costs'],
        ['plots', 'Outline a main arc'],
        ['manuscripts', 'Start drafting immediately'],
      ].map(([key, desc]) => {
        const cfg = this.COLLECTIONS[key];
        return `
          <button class="quick-card" onclick="${key === 'manuscripts' ? `WF.startCreate('manuscripts')` : `WF.startCreate('${key}')`}">
            <div class="quick-icon">${cfg.icon}</div>
            <strong>${cfg.label}</strong>
            <span>${desc}</span>
          </button>`;
      }).join('');

      const recentHtml = recent.length ? recent.map((item) => {
        const cfg = this.COLLECTIONS[item._collection];
        return `
          <button class="compact-row" onclick="WF.openDetail('${item._collection}', '${item.id}')">
            <div class="compact-row-left">
              <div class="compact-icon">${cfg.icon}</div>
              <div>
                <strong>${this.escapeHtml(this.titleFor(item, item._collection))}</strong>
                <div class="compact-row-meta">${cfg.label}</div>
              </div>
            </div>
            <div class="compact-row-time">${this.escapeHtml(this.formatRelativeTime(item.updatedAt || item.createdAt))}</div>
          </button>`;
      }).join('') : '<div class="page-description">No recent pages yet.</div>';

      const topCollections = coverage.slice(0, 5).map((row) => `
        <div class="collection-progress-row" onclick="WF.navigate('${row.key}')">
          <div class="collection-progress-label"><span>${row.cfg.icon}</span><strong>${this.escapeHtml(row.cfg.label)}</strong></div>
          <div class="progress-pill"><span style="width:${row.average}%"></span><em>${row.average}%</em></div>
          <div class="collection-progress-meta">${row.count}</div>
        </div>`).join('');

      return `
        <div class="simple-hero">
          <div>
            <div class="eyebrow">SERIAL STORY STUDIO</div>
            <h1>${this.escapeHtml(meta.projectName || 'StoryAtlas')}</h1>
            <p class="page-description">${this.escapeHtml(meta.description || 'A smoother local studio for light novels, novels, graphic novels, comics, manga, and long-form series planning.')}</p>
            <div class="page-actions">
              <button class="btn btn-primary" onclick="WF.startCreate('characters')">New Character</button>
              <button class="btn btn-secondary" onclick="WF.startCreate('plots')">New Arc</button>
              <button class="btn btn-secondary" onclick="WF.navigate('worldBible')">Open World Bible</button>
              <button class="btn btn-secondary" onclick="WF.navigate('storyCanvas')">Open Story Canvas</button>
            </div>
          </div>
          <div class="hero-stat-grid">
            <div class="hero-stat-simple"><strong>${totalEntries}</strong><span>Total Entries</span><small>Across ${used}/${Object.keys(this.COLLECTIONS).length} collections</small></div>
            <div class="hero-stat-simple"><strong>${totalWords.toLocaleString()}</strong><span>Total Words</span><small>Includes scratch pad and rich text</small></div>
            <div class="hero-stat-simple"><strong>${goalPct}%</strong><span>Writing Goal</span><small>${Math.min(totalWords, this.writingGoalWords).toLocaleString()} / ${this.writingGoalWords.toLocaleString()} words</small></div>
            <div class="hero-stat-simple"><strong>${recent.length}</strong><span>Recent Pages</span><small>Quickly reopen what you touched last</small></div>
          </div>
        </div>

        <section class="panel">
          <div class="panel-header"><h2>Quick Start</h2><span class="panel-sub">Jump into the part of the project that needs attention</span></div>
          <div class="quick-grid">${quickStart}</div>
        </section>

        <div class="workspace-grid two-up">
          <section class="panel">
            <div class="panel-header"><h2>Recently Opened</h2><span class="panel-sub">Continue where you left off</span></div>
            <div class="collection-list-enhanced">${recentHtml}</div>
          </section>
          <section class="panel">
            <div class="panel-header"><h2>Project Coverage</h2><span class="panel-sub">Average entry completeness by section</span></div>
            <div class="collection-list-enhanced">${topCollections || '<div class="page-description">Create a few entries to see coverage.</div>'}</div>
          </section>
        </div>

        <div class="workspace-grid two-up">
          <section class="panel">
            <div class="panel-header"><h2>Writing Prompt</h2><button class="icon-btn" type="button" onclick="WF.nextPrompt()">↻</button></div>
            <blockquote class="prompt-quote">“${this.escapeHtml(prompt)}”</blockquote>
            <div class="page-actions">
              <button class="btn btn-secondary" onclick="WF.navigate('scratchpad')">Capture Idea</button>
              <button class="btn btn-secondary" onclick="WF.nextPrompt()">Next Prompt</button>
            </div>
          </section>
          <section class="panel">
            <div class="panel-header"><h2>Workspace</h2><span class="panel-sub">Higher-level project views</span></div>
            <div class="workspace-shortcuts">
              <button class="quick-card" onclick="WF.navigate('worldBible')"><div class="quick-icon">✦</div><strong>Series Bible</strong><span>Readable bird’s-eye reference</span></button>
              <button class="quick-card" onclick="WF.navigate('atlasMap')"><div class="quick-icon">⌖</div><strong>World Map</strong><span>Regions and clickable lore pins</span></button>
              <button class="quick-card" onclick="WF.navigate('publicWiki')"><div class="quick-icon">☍</div><strong>Public Wiki</strong><span>Audience-facing shareable reference</span></button>
              <button class="quick-card" onclick="WF.navigate('canonGraph')"><div class="quick-icon">⇄</div><strong>Canon Graph</strong><span>Interactive cast and faction web</span></button>
              <button class="quick-card" onclick="WF.navigate('storyCanvas')"><div class="quick-icon">☰</div><strong>Story Canvas</strong><span>Idea board for arcs, projects, and loose notes</span></button>
              <button class="quick-card" onclick="WF.navigate('stats')"><div class="quick-icon">▤</div><strong>Project Stats</strong><span>Coverage, counts, and health checks</span></button>
            </div>
          </section>
        </div>`;
    },

    renderWorldBible() {
      const meta = this.data?.meta || {};
      const cards = this.getCoverageRows().map((row) => `
        <div class="world-summary-card" onclick="WF.navigate('${row.key}')">
          <h3>${row.cfg.icon} ${this.escapeHtml(row.cfg.label)}${row.cfg.label.endsWith('s') ? '' : 's'}</h3>
          <div class="page-description">${row.count} ${row.count === 1 ? 'entry' : 'entries'} · avg ${row.average}% complete</div>
          <div class="prog-bar"><div class="prog-bar-fill" style="width:${row.average}%"></div></div>
        </div>`).join('');

      const highlights = this.getRecentEntries(10).map((item) => {
        const cfg = this.COLLECTIONS[item._collection];
        return `<div class="mini-link" onclick="WF.openDetail('${item._collection}', '${item.id}')"><span>${cfg.icon} ${this.escapeHtml(this.titleFor(item, item._collection))}</span><span class="page-description">${cfg.label}</span></div>`;
      }).join('') || '<div class="page-description">Open pages and they will appear here.</div>';

      return `
        <div class="page-header-row">
          <div>
            <div class="eyebrow">WORLD BIBLE</div>
            <h1>Project Reference</h1>
            <p class="page-description">A clean overview of the setting, cast, systems, story structure, and current work.</p>
          </div>
          <div class="page-actions"><button class="btn btn-primary" onclick="WF.exportZIP()">Export Project</button></div>
        </div>
        <section class="panel bible-hero">
          <h2>${this.escapeHtml(meta.projectName || 'Untitled Project')}</h2>
          <p>${this.escapeHtml(meta.description || 'Add project settings to make the world bible feel complete.')}</p>
          <p><strong>Genre:</strong> ${this.escapeHtml(meta.genre || 'Not set')}</p>
        </section>
        <section class="world-summary-grid">${cards}</section>
        <section class="panel">
          <div class="panel-header"><h2>Recently Opened</h2><span class="panel-sub">Fast routes back into active pages</span></div>
          <div class="mini-list">${highlights}</div>
        </section>`;
    },

    renderStoryboard() {
      const columns = [
        { label: 'Planned', statuses: ['Planned', 'Idea Only', 'Outline', 'Outlined'] },
        { label: 'In Progress', statuses: ['In Progress', 'First Draft', '2nd Draft', 'Revision', 'Outline'] },
        { label: 'Polishing', statuses: ['Polished Draft', 'Final Draft'] },
        { label: 'Done', statuses: ['Completed', 'Final', 'Published'] },
      ];
      const storyItems = [
        ...(this.data.plots || []).map((item) => ({ ...item, _collection: 'plots' })),
        ...(this.data.chapters || []).map((item) => ({ ...item, _collection: 'chapters' })),
        ...(this.data.manuscripts || []).map((item) => ({ ...item, _collection: 'manuscripts' })),
      ];
      const cols = columns.map((column) => {
        const items = storyItems.filter((item) => column.statuses.includes(item.status || ''));
        return `
          <div class="board-col-enhanced">
            <div class="board-col-head"><span>${column.label}</span><span class="board-col-count">${items.length}</span></div>
            ${items.length ? items.map((item) => {
              const cfg = this.COLLECTIONS[item._collection];
              const open = item._collection === 'manuscripts'
                ? `WF.openManuscript('${item.id}')`
                : `WF.openDetail('${item._collection}', '${item.id}')`;
              return `<button class="board-card-enhanced" onclick="${open}"><strong>${this.escapeHtml(this.titleFor(item, item._collection))}</strong><small>${this.escapeHtml(cfg.label)} · ${this.escapeHtml(item.status || 'Unsorted')}</small></button>`;
            }).join('') : '<div class="page-description">Nothing here yet.</div>'}
          </div>`;
      }).join('');
      return `
        <div class="page-header-row">
          <div><div class="eyebrow">STORY CANVAS</div><h1>Workflow Board</h1><p class="page-description">Plots, chapters, manuscripts, and loose idea notes grouped so the whole series is easier to steer.</p></div>
          <div class="page-actions"><button class="btn btn-primary" onclick="WF.startCreate('plots')">New Arc</button><button class="btn btn-secondary" onclick="WF.startCreate('chapters')">New Chapter</button><button class="btn btn-secondary" onclick="WF.startCreate('manuscripts')">New Draft</button></div>
        </div>
        <section class="board-shell-enhanced">${cols}</section>`;
    },

    renderRelationshipsMap() {
      const rows = [];
      (this.data.characters || []).forEach((character) => {
        (character.relationships || []).forEach((rel) => {
          rows.push({ source: character.name || 'Unnamed character', type: rel.type || 'Relationship', target: rel.name || 'Unknown', desc: rel.desc || '' });
        });
      });
      (this.data.factions || []).forEach((faction) => {
        (faction.allies || []).forEach((ally) => rows.push({ source: faction.name || 'Unnamed faction', type: 'Ally', target: ally, desc: '' }));
        (faction.enemies || []).forEach((enemy) => rows.push({ source: faction.name || 'Unnamed faction', type: 'Enemy', target: enemy, desc: '' }));
      });
      rows.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
      const body = rows.length ? rows.map((row) => `
        <div class="relationship-line">
          <span class="rel-badge badge badge-outline">${this.escapeHtml(row.type)}</span>
          <strong>${this.escapeHtml(row.source)}</strong>
          <span>→</span>
          <strong>${this.escapeHtml(row.target)}</strong>
          <small>${this.escapeHtml(row.desc || '')}</small>
        </div>`).join('') : '<div class="empty-state"><h3>No relationship data yet</h3><p>Add character relationships or faction allies and enemies to populate this view.</p></div>';
      return `
        <div class="page-header-row">
          <div><div class="eyebrow">CANON GRAPH</div><h1>Relationship Web</h1><p class="page-description">An interactive graph of characters, factions, and locations pulled from your pages.</p></div>
        </div>
        <section class="panel relationships-shell">${body}</section>`;
    },

    renderStats() {
      const rows = this.getCoverageRows();
      const weak = this.getAllEntries().filter((item) => this.getCompleteness(item._collection, item) < 45).slice(0, 10);
      const recent = this.getAllEntries().slice().sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)).slice(0, 8);
      return `
        <div class="page-header-row">
          <div><div class="eyebrow">PROJECT STATS</div><h1>Coverage & Health</h1><p class="page-description">A quick way to spot thin sections, underbuilt entries, and the parts of your project receiving the most attention.</p></div>
          <div class="page-actions"><button class="btn btn-secondary" onclick="WF.showSettings()">Project Settings</button><button class="btn btn-primary" onclick="WF.exportZIP()">Export ZIP</button></div>
        </div>
        <div class="workspace-grid two-up">
          <section class="panel">
            <div class="panel-header"><h2>Collection Coverage</h2><span class="panel-sub">Average completeness by collection</span></div>
            <div class="collection-list-enhanced">
              ${rows.map((row) => `
                <div class="collection-progress-row" onclick="WF.navigate('${row.key}')">
                  <div class="collection-progress-label"><span>${row.cfg.icon}</span><strong>${this.escapeHtml(row.cfg.label)}</strong></div>
                  <div class="progress-pill"><span style="width:${row.average}%"></span><em>${row.average}%</em></div>
                  <div class="collection-progress-meta">${row.count}</div>
                </div>`).join('')}
            </div>
          </section>
          <section class="panel">
            <div class="panel-header"><h2>Entries That Need Love</h2><span class="panel-sub">Lowest-completeness pages</span></div>
            <div class="collection-list-enhanced">
              ${weak.length ? weak.map((item) => {
                const cfg = this.COLLECTIONS[item._collection];
                const score = this.getCompleteness(item._collection, item);
                return `<button class="compact-row" onclick="WF.openDetail('${item._collection}', '${item.id}')"><div class="compact-row-left"><div class="compact-icon">${cfg.icon}</div><div><strong>${this.escapeHtml(this.titleFor(item, item._collection))}</strong><div class="compact-row-meta">${cfg.label}</div></div></div><div class="compact-row-time">${score}%</div></button>`;
              }).join('') : '<div class="page-description">Everything looks reasonably built out.</div>'}
            </div>
          </section>
        </div>
        <section class="panel">
          <div class="panel-header"><h2>Recent Activity</h2><span class="panel-sub">Most recently updated entries</span></div>
          <div class="collection-list-enhanced">
            ${recent.map((item) => {
              const cfg = this.COLLECTIONS[item._collection];
              return `<button class="compact-row" onclick="WF.openDetail('${item._collection}', '${item.id}')"><div class="compact-row-left"><div class="compact-icon">${cfg.icon}</div><div><strong>${this.escapeHtml(this.titleFor(item, item._collection))}</strong><div class="compact-row-meta">${cfg.label}</div></div></div><div class="compact-row-time">${this.escapeHtml(this.formatRelativeTime(item.updatedAt || item.createdAt))}</div></button>`;
            }).join('') || '<div class="page-description">No activity yet.</div>'}
          </div>
        </section>`;
    },

    renderScratchpad() {
      const value = this.scratchpadLocal || this.data?.meta?.scratchpad || '';
      return `
        <div class="page-header-row">
          <div><div class="eyebrow">SCRATCH PAD</div><h1>Quick Notes</h1><p class="page-description">Fast idea capture with local autosave and project sync.</p></div>
          <div class="page-actions"><button class="btn btn-secondary" onclick="WF.clearScratchpad()">Clear</button><button class="btn btn-primary" onclick="WF.saveScratchpad(true)">Save Now</button></div>
        </div>
        <section class="panel">
          <div class="scratch-meta"><span id="scratch-meta-text">${this.countWords(value)} words</span><span class="panel-sub">Local autosave is on</span></div>
          <textarea id="scratchpad-editor" class="field-textarea tall scratch-area" oninput="WF.scratchChanged(this.value)">${this.escapeHtml(value)}</textarea>
        </section>`;
    },

    scratchChanged(value) {
      this.scratchpadLocal = value;
      localStorage.setItem('wf_scratchpad_local', value);
      const metaText = document.getElementById('scratch-meta-text');
      if (metaText) metaText.textContent = `${this.countWords(value)} words`;
      clearTimeout(this._scratchTimer);
      this._scratchTimer = setTimeout(() => this.saveScratchpad(false), 700);
      this.updateStatusBar();
    },

    async saveScratchpad(showToast = false) {
      try {
        this.signalSave();
        await original.saveMeta({ scratchpad: this.scratchpadLocal || '' });
        this.signalSaved();
        if (showToast) this.toast('Scratch pad saved', 'success');
      } catch {
        this.signalSaveError();
        if (showToast) this.toast('Could not save scratch pad', 'error');
      }
    },

    clearScratchpad() {
      this.scratchpadLocal = '';
      localStorage.setItem('wf_scratchpad_local', '');
      if (this.section === 'scratchpad') this.render();
      this.saveScratchpad(false);
      this.updateStatusBar();
    },

    shouldShowOnboarding() {
      return localStorage.getItem('wf_onboarding_done') !== '1' && this.getTotalEntries() === 0 && !(this.data?.meta?.projectName);
    },

    showOnboarding(step = 1) {
      const overlay = document.getElementById('wf-onboarding-overlay');
      const content = document.getElementById('wf-onboarding-content');
      if (!overlay || !content) return;
      const slides = [
        {
          icon: '✦',
          title: 'Welcome to StoryAtlas',
          subtitle: 'A local-first worldbuilding workspace that stays simple while giving you room to go deep.',
          body: `
            <p class="page-description">Track characters, factions, organizations, locations, lore, systems, chapters, scripts, and timelines without needing accounts or cloud setup.</p>
            <div class="onboard-list">
              <div><strong>Ctrl/Cmd + K</strong> opens the command palette.</div>
              <div><strong>Search</strong> scans every entry quickly.</div>
              <div><strong>Scratch Pad</strong> auto-saves rough ideas.</div>
              <div><strong>Export ZIP or JSON</strong> keeps your work portable.</div>
            </div>`,
          primary: `<button class="btn btn-primary" type="button" onclick="WF.showOnboarding(2)">Set Up My Project</button>`,
          secondary: `<button class="btn btn-secondary" type="button" onclick="WF.finishOnboarding()">Skip</button>`,
        },
        {
          icon: '◎',
          title: 'Name the Project',
          subtitle: 'These details appear across the app and inside exports.',
          body: `
            <div class="form-field"><label class="field-label">Project Name</label><input id="ob-project-name" class="field-input" placeholder="e.g. Ashfall, Iron Veil, Project Ember"></div>
            <div class="form-field"><label class="field-label">Genre</label><input id="ob-project-genre" class="field-input" placeholder="e.g. Dark Fantasy, Sci-Fi, Urban Fantasy"></div>
            <div class="form-field"><label class="field-label">Description</label><textarea id="ob-project-desc" class="field-textarea" placeholder="One or two sentences about the heart of the setting or story."></textarea></div>`,
          primary: `<button class="btn btn-primary" type="button" onclick="WF.commitOnboarding()">Save & Continue</button>`,
          secondary: `<button class="btn btn-secondary" type="button" onclick="WF.showOnboarding(1)">Back</button>`,
        },
        {
          icon: '◈',
          title: 'You’re Ready',
          subtitle: 'Start with the part of the world that already feels alive in your head.',
          body: `
            <div class="onboard-list">
              <div><strong>Characters</strong> and <strong>Locations</strong> are usually the easiest anchors.</div>
              <div><strong>World Bible</strong> gives you a bird’s-eye view.</div>
              <div><strong>Project Stats</strong> helps spot weak areas.</div>
              <div><strong>Help</strong> explains shortcuts, workflows, and export options.</div>
            </div>`,
          primary: `<button class="btn btn-primary" type="button" onclick="WF.finishOnboarding()">Start Building</button>`,
          secondary: '',
        },
      ];
      const slide = slides[Math.max(1, Math.min(step, slides.length)) - 1];
      content.innerHTML = `
        <div class="onboarding-inner">
          <div class="onboarding-icon">${slide.icon}</div>
          <h2>${slide.title}</h2>
          <p class="page-description">${slide.subtitle}</p>
          ${slide.body}
          <div class="page-actions">${slide.secondary}${slide.primary}</div>
        </div>`;
      overlay.classList.remove('hidden');
    },

    async commitOnboarding() {
      const name = document.getElementById('ob-project-name')?.value.trim();
      const genre = document.getElementById('ob-project-genre')?.value.trim();
      const description = document.getElementById('ob-project-desc')?.value.trim();
      if (!name) {
        this.toast('Please enter a project name.', 'error');
        return;
      }
      try {
        this.signalSave();
        await original.saveMeta({ projectName: name, genre, description });
        this.signalSaved();
        this.updateBrand();
        this.updateStatusBar();
        this.showOnboarding(3);
      } catch {
        this.signalSaveError();
        this.toast('Could not save project info.', 'error');
      }
    },

    finishOnboarding() {
      localStorage.setItem('wf_onboarding_done', '1');
      document.getElementById('wf-onboarding-overlay')?.classList.add('hidden');
      this.render();
    },

    openHelp(tab = 'getting-started') {
      this.helpTab = tab;
      this.renderHelpPanel();
      document.getElementById('wf-help-overlay')?.classList.remove('hidden');
    },

    closeHelp() {
      document.getElementById('wf-help-overlay')?.classList.add('hidden');
    },

    switchHelpTab(tab) {
      this.helpTab = tab;
      this.renderHelpPanel();
    },

    renderHelpPanel() {
      const tabsEl = document.getElementById('wf-help-tabs');
      const contentEl = document.getElementById('wf-help-content');
      if (!tabsEl || !contentEl) return;
      const tabs = [
        ['getting-started', 'Getting Started'],
        ['workspace', 'Workspace'],
        ['shortcuts', 'Shortcuts'],
        ['backups', 'Backups'],
      ];
      tabsEl.innerHTML = tabs.map(([id, label]) => `<button class="help-tab ${this.helpTab === id ? 'active' : ''}" onclick="WF.switchHelpTab('${id}')">${label}</button>`).join('');
      if (this.helpTab === 'getting-started') {
        contentEl.innerHTML = `
          <div class="help-section"><h3>How to begin</h3><p>Start with whatever feels most concrete: a character, a place, or an arc. Use the collection pages for structured entries and the scratch pad for rough ideas.</p></div>
          <div class="help-section"><h3>What the app is good at</h3><p>StoryAtlas is strongest when you need characters, factions, lore, timeline events, maps, graph views, and manuscript drafts to live in the same place without feeling bloated.</p></div>
          <div class="help-section"><h3>Use the dashboard</h3><p>The dashboard gives you quick-start buttons, recent pages, writing prompts, and project coverage so it is easier to know where to go next.</p></div>`;
      } else if (this.helpTab === 'workspace') {
        contentEl.innerHTML = `
          <div class="help-section"><h3>World Bible</h3><p>A bird’s-eye overview of the entire project with section counts and recently opened pages.</p></div>
          <div class="help-section"><h3>Story Board</h3><p>Plots, chapters, and manuscripts grouped by workflow status so you can see what still needs drafting or revision.</p></div>
          <div class="help-section"><h3>Connections</h3><p>Pulls from character relationships and faction allies or enemies to make ties easier to review.</p></div>
          <div class="help-section"><h3>Project Stats</h3><p>Shows collection coverage and the entries that are still very thin.</p></div>`;
      } else if (this.helpTab === 'shortcuts') {
        contentEl.innerHTML = `
          <div class="help-section"><h3>Keyboard shortcuts</h3>
            <table class="shortcuts-table"><tbody>
              <tr><td><kbd class="kbd">Ctrl / Cmd + K</kbd></td><td>Open command palette</td></tr>
              <tr><td><kbd class="kbd">/</kbd></td><td>Type in search to switch into command mode</td></tr>
              <tr><td><kbd class="kbd">Enter</kbd></td><td>Run full search from the search bar</td></tr>
              <tr><td><kbd class="kbd">Esc</kbd></td><td>Close dropdowns, command palette, and help</td></tr>
              <tr><td><kbd class="kbd">↑ ↓</kbd></td><td>Move through quick results or commands</td></tr>
            </tbody></table>
          </div>
          <div class="help-section"><h3>Field tips</h3><p>On forms, small help notes are added automatically for the fields that tend to confuse people most.</p></div>`;
      } else {
        contentEl.innerHTML = `
          <div class="help-section"><h3>Export ZIP</h3><p>Creates a full portable project package with Markdown pages, manuscripts, a world bible, indexes, and the raw JSON backup.</p></div>
          <div class="help-section"><h3>Export JSON Backup</h3><p>Downloads the raw project data so you can restore it later with Import JSON.</p></div>
          <div class="help-section"><h3>Import JSON</h3><p>Use the exported JSON file to restore the entire project into the local app.</p></div>`;
      }
    },

    addFieldHelpHints() {
      const form = document.getElementById('entry-form');
      if (!form) return;
      form.querySelectorAll('.form-field').forEach((fieldWrap) => {
        if (fieldWrap.dataset.helpApplied === '1') return;
        const control = fieldWrap.querySelector('[name], [data-name]');
        const key = control?.getAttribute('name') || control?.getAttribute('data-name');
        const help = FIELD_HELP[key];
        if (!help) return;
        const existingHint = fieldWrap.querySelector('.field-hint');
        if (existingHint) {
          existingHint.textContent = `${existingHint.textContent} · ${help}`;
        } else {
          const hint = document.createElement('div');
          hint.className = 'field-hint';
          hint.textContent = help;
          const label = fieldWrap.querySelector('.field-label');
          if (label) label.insertAdjacentElement('afterend', hint);
        }
        fieldWrap.dataset.helpApplied = '1';
      });
    },

    downloadBlob(filename, blob) {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },

    async downloadJsonBackup() {
      try {
        const response = await fetch('/api/export.json');
        if (!response.ok) throw new Error('Export failed');
        const blob = await response.blob();
        this.downloadBlob('storyatlas_backup.json', blob);
        this.toast('JSON backup exported', 'success');
      } catch {
        this.toast('JSON backup export failed', 'error');
      }
    },

    async handleImportFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        this.signalSave();
        const formData = new FormData();
        formData.append('file', file, file.name || 'storyatlas_import');
        const response = await fetch('/api/import-file', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Import failed');
        }
        await this.loadAll();
        this.recentKeys = this.recentKeys.filter((key) => {
          const [collection, id] = key.split(':');
          return !!this.findItem(collection, id);
        });
        this.saveEnhancedPrefs();
        this.signalSaved();
        this.closeModal();
        this.updateBrand();
        this.section = 'dashboard';
        this.editingId = null;
        this.renderNav();
        this.render();
        this.toast('Project imported', 'success');
      } catch (error) {
        console.error(error);
        this.signalSaveError();
        this.toast(error.message || 'Import failed. Use a valid StoryAtlas backup.', 'error');
      } finally {
        event.target.value = '';
      }
    },

    postRenderEnhance() {
      this.addFieldHelpHints();
      this.applyTheme();
      this.updateStatusBar();
      const area = document.getElementById('content-area');
      if (area) {
        area.classList.remove('view-enter');
        void area.offsetWidth;
        area.classList.add('view-enter');
      }
    },
  });

  WF.saveItem = async function (collection, payload, id = null) {
    try {
      this.signalSave();
      const saved = await original.saveItem(collection, payload, id);
      this.signalSaved();
      return saved;
    } catch (error) {
      this.signalSaveError();
      throw error;
    }
  };

  WF.saveMeta = async function (payload) {
    try {
      this.signalSave();
      const saved = await original.saveMeta(payload);
      this.signalSaved();
      return saved;
    } catch (error) {
      this.signalSaveError();
      throw error;
    }
  };

  WF.deleteItem = async function (collection, id) {
    try {
      this.signalSave();
      const result = await original.deleteItem(collection, id);
      this.signalSaved();
      return result;
    } catch (error) {
      this.signalSaveError();
      throw error;
    }
  };

  WF.exportZIP = async function () {
    this.signalSave();
    try {
      await original.exportZIP();
      this.signalSaved();
    } catch (error) {
      this.signalSaveError();
      throw error;
    }
  };

  WF.submitForm = async function (collection, id = null) {
    const result = await original.submitForm(collection, id);
    this.updateStatusBar();
    return result;
  };

  WF.saveManuscript = async function (id) {
    const result = await original.saveManuscript(id);
    this.updateStatusBar();
    return result;
  };

  WF.renderEntryCard = function (collection, item) {
    const cfg = this.COLLECTIONS[collection];
    const title = this.titleFor(item, collection);
    const subtitle = item.affiliation || item.type || item.role || item.arc || item.category || item.creator || item.date || '';
    const snippet = this.stripHtml(item.overview || item.synopsis || item.description || item.influence || item.content || item.storyNotes || '').slice(0, 180);
    const status = item.status ? `<span class="badge ${this.statusClass(item.status)}">${this.escapeHtml(item.status)}</span>` : '';
    const score = this.getCompleteness(collection, item);
    const chips = [];
    if (Array.isArray(item.aliases)) chips.push(...item.aliases.slice(0, 2));
    if (item.powerTier) chips.push(item.powerTier);
    if (item.tone) chips.push(item.tone);
    return `
      <button class="entry-card-simple" style="--card-color:${cfg.color}" onclick="WF.openDetail('${collection}', '${item.id}')">
        <div class="entry-card-top">
          <div class="entry-main-head">
            <div class="entry-icon">${cfg.icon}</div>
            <div>
              <h3>${this.escapeHtml(title)}</h3>
              ${subtitle ? `<div class="entry-card-sub">${this.escapeHtml(subtitle)}</div>` : ''}
            </div>
          </div>
          ${status}
        </div>
        ${snippet ? `<div class="entry-summary">${this.escapeHtml(snippet)}${snippet.length >= 180 ? '…' : ''}</div>` : '<div class="entry-summary muted">No summary yet.</div>'}
        <div class="entry-card-bottom">
          <div class="chip-row">${chips.slice(0, 3).map((chip) => `<span class="tag-chip">${this.escapeHtml(chip)}</span>`).join('')}</div>
          <div class="progress-pill"><span style="width:${score}%"></span><em>${score}%</em></div>
        </div>
      </button>`;
  };

  WF.renderCollectionList = function (collection) {
    const cfg = this.COLLECTIONS[collection];
    const items = this.data[collection] || [];
    const avg = items.length ? Math.round(items.reduce((sum, item) => sum + this.getCompleteness(collection, item), 0) / items.length) : 0;
    const list = items.length ? items.map((item) => this.renderEntryCard(collection, item)).join('') : `
      <div class="empty-state">
        <div class="empty-icon">${cfg.icon}</div>
        <h3>No ${cfg.label.toLowerCase()} entries yet</h3>
        <p>Start with a strong first page and let the structure pull more detail out of you.</p>
        <button class="btn btn-primary" onclick="WF.startCreate('${collection}')">Create ${cfg.label}</button>
      </div>`;
    return `
      <div class="page-header-row">
        <div>
          <div class="eyebrow">${cfg.label.toUpperCase()} HUB</div>
          <h1>${cfg.icon} ${cfg.label}${cfg.label.endsWith('s') ? '' : 's'}</h1>
          <p class="page-description">${items.length} ${items.length === 1 ? 'entry' : 'entries'} · average completeness ${avg}%</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WF.search(document.getElementById('global-search')?.value || '')">Run Search</button>
          <button class="btn btn-primary" onclick="WF.startCreate('${collection}')">New ${cfg.label}</button>
        </div>
      </div>
      <div class="collection-controls">
        <input id="filter-${collection}" class="search-input" placeholder="Filter this section..." oninput="WF.filterList('${collection}', this.value)">
        <div class="collection-summary-bar"><span>${cfg.icon} ${cfg.label}</span><span>${items.length} total</span><span>${avg}% avg complete</span></div>
      </div>
      <div id="collection-grid-${collection}" class="collection-list-enhanced">${list}</div>`;
  };

  WF.renderNav = function () {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    const sections = [...this.NAV, ...EXTRA_SECTIONS];
    let html = '';
    let currentGroup = null;
    sections.forEach((item) => {
      if (item.group !== currentGroup) {
        currentGroup = item.group;
        if (currentGroup) html += `<div class="nav-group-label">${currentGroup}</div>`;
      }
      const count = Array.isArray(this.data?.[item.id]) ? this.data[item.id].length : null;
      html += `<button class="nav-item ${this.section === item.id ? 'active' : ''}" onclick="WF.navigate('${item.id}')"><span class="nav-icon">${item.icon}</span><span class="nav-label">${this.escapeHtml(item.label)}</span>${count !== null ? `<span class="nav-count">${count}</span>` : ''}</button>`;
    });
    nav.innerHTML = html;
  };

  WF.navigate = function (section) {
    this.section = section;
    this.editingId = null;
    this.hideSearchDropdown();
    this.closeCommandPalette();
    this.renderNav();
    this.render();
  };

  WF.openDetail = function (collection, id) {
    this.pushRecent(collection, id);
    const result = original.openDetail(collection, id);
    this.postRenderEnhance();
    return result;
  };

  WF.openManuscript = function (id) {
    this.pushRecent('manuscripts', id);
    return original.openManuscript(id);
  };

  WF.startCreate = function (collection) {
    if (collection === 'manuscripts') return this.createQuickDraft();
    this.section = collection;
    this.editingId = 'new';
    this.renderNav();
    this.render();
  };

  WF.showSettings = function () {
    const meta = this.data?.meta || {};
    this.showModal(
      'Project Settings',
      `
        <div class="form-field"><label class="field-label">Project Name</label><input id="set-project-name" class="field-input" value="${this.escapeForAttr(meta.projectName || '')}"></div>
        <div class="form-field"><label class="field-label">Genre / Type</label><input id="set-project-genre" class="field-input" value="${this.escapeForAttr(meta.genre || '')}"></div>
        <div class="form-field"><label class="field-label">Description</label><textarea id="set-project-description" class="field-textarea tall">${this.escapeHtml(meta.description || '')}</textarea></div>
        <div class="form-field"><label class="field-label">Writing Goal (words)</label><input id="set-writing-goal" class="field-input" type="number" min="100" step="100" value="${this.writingGoalWords}"></div>
        <section class="panel compact-panel">
          <div class="panel-header"><h2>Backups</h2><span class="panel-sub">Move your project safely between machines or restore old states</span></div>
          <div class="page-actions">
            <button class="btn btn-secondary" type="button" onclick="WF.downloadJsonBackup()">Export JSON</button>
            <button class="btn btn-secondary" type="button" onclick="document.getElementById('import-file-input').click()">Import JSON or ZIP</button>
            <button class="btn btn-primary" type="button" onclick="WF.exportZIP()">Export ZIP</button>
          </div>
        </section>`,
      `<button class="btn btn-secondary" onclick="WF.closeModal()">Cancel</button><button class="btn btn-primary" onclick="WF.commitSettingsEnhanced()">Save</button>`
    );
  };

  WF.commitSettingsEnhanced = async function () {
    try {
      this.writingGoalWords = parseInt(document.getElementById('set-writing-goal')?.value || `${this.writingGoalWords}`, 10) || this.writingGoalWords;
      this.saveEnhancedPrefs();
      await this.saveMeta({
        projectName: document.getElementById('set-project-name').value.trim(),
        genre: document.getElementById('set-project-genre').value.trim(),
        description: document.getElementById('set-project-description').value.trim(),
      });
      this.closeModal();
      this.render();
      this.toast('Settings saved', 'success');
    } catch {
      this.toast('Could not save settings', 'error');
    }
  };

  WF.getPublicSections = function () {
    return ['characters', 'factions', 'locations', 'systems', 'plots', 'chapters', 'timelineEvents'];
  };


  WF.matchLinkedEntry = function (raw) {
    const target = String(raw || '').trim().toLowerCase();
    if (!target) return null;
    const collections = ['characters', 'factions', 'locations', 'plots', 'chapters', 'timelineEvents', 'systems', 'items', 'history', 'cultures', 'lore', 'manuscripts'];
    for (const collection of collections) {
      const found = (this.data?.[collection] || []).find((item) => this.titleFor(item, collection).trim().toLowerCase() === target || (Array.isArray(item.aliases) && item.aliases.some((alias) => String(alias).trim().toLowerCase() === target)));
      if (found) return { collection, item: found };
    }
    return null;
  };

  WF.renderLinkedText = function (raw, className = 'inline-link-chip') {
    const value = String(raw || '').trim();
    if (!value) return '';
    const match = this.matchLinkedEntry(value);
    if (!match) return this.escapeHtml(value);
    return `<button class="${className}" onclick="WF.openDetail('${match.collection}', '${match.item.id}')">${this.escapeHtml(value)}</button>`;
  };

  WF.renderChipSet = function (values) {
    return `<div class="chip-row">${values.map((entry) => {
      const match = this.matchLinkedEntry(entry);
      return match
        ? `<button class="tag-chip linked-chip" onclick="WF.openDetail('${match.collection}', '${match.item.id}')">${this.escapeHtml(entry)}</button>`
        : `<span class="tag-chip">${this.escapeHtml(entry)}</span>`;
    }).join('')}</div>`;
  };

  WF.findBacklinks = function (collection, id) {
    const item = this.findItem(collection, id);
    if (!item) return [];
    const title = this.titleFor(item, collection).trim().toLowerCase();
    if (!title) return [];
    const backlinks = [];
    Object.keys(this.COLLECTIONS).forEach((otherCollection) => {
      (this.data?.[otherCollection] || []).forEach((entry) => {
        if (otherCollection === collection && entry.id === id) return;
        if (JSON.stringify(entry).toLowerCase().includes(title)) backlinks.push({ collection: otherCollection, item: entry, reason: this.COLLECTIONS[otherCollection].label });
      });
    });
    const unique = new Map();
    backlinks.forEach((row) => unique.set(`${row.collection}:${row.item.id}`, row));
    return [...unique.values()];
  };

  WF.findStructuredConnections = function (collection, item) {
    const links = [];
    const push = (expectedCollection, value, reason) => {
      const match = this.matchLinkedEntry(value);
      if (match && (!expectedCollection || match.collection === expectedCollection)) links.push({ collection: match.collection, item: match.item, reason });
    };
    if (collection === 'characters') {
      push('factions', item.affiliation, 'Affiliation');
      (item.relationships || []).forEach((rel) => push('characters', rel.name, rel.type || 'Relationship'));
    }
    if (collection === 'factions') {
      push('characters', item.leader, 'Leader');
      push('locations', item.territory, 'Territory');
      (item.members || []).forEach((rel) => push('characters', rel.name, 'Member'));
      (item.allies || []).forEach((ally) => push('factions', ally, 'Ally'));
      (item.enemies || []).forEach((enemy) => push('factions', enemy, 'Enemy'));
    }
    if (collection === 'locations') push('factions', item.controlledBy, 'Controlled By');
    if (collection === 'chapters') {
      push('plots', item.arc, 'Parent Arc');
      push('characters', item.pov, 'POV');
    }
    if (collection === 'manuscripts') push('chapters', item.linkedChapter, 'Linked Chapter');
    if (collection === 'items') push(null, item.currentHolder, 'Current Holder');
    const unique = new Map();
    links.forEach((row) => unique.set(`${row.collection}:${row.item.id}:${row.reason}`, row));
    return [...unique.values()];
  };

  WF.renderConnectionList = function (rows) {
    if (!rows.length) return '<div class="page-description">No linked entries found yet.</div>';
    return `<div class="mini-list">${rows.map((row) => {
      const cfg = this.COLLECTIONS[row.collection];
      return `<button class="mini-link" onclick="WF.openDetail('${row.collection}', '${row.item.id}')"><span>${cfg.icon} ${this.escapeHtml(this.titleFor(row.item, row.collection))}</span><span class="page-description">${this.escapeHtml(row.reason || cfg.label)}</span></button>`;
    }).join('')}</div>`;
  };

  WF.quickCreateLinked = function (targetCollection, sourceCollection, sourceId) {
    const source = this.findItem(sourceCollection, sourceId);
    if (!source) return this.startCreate(targetCollection);
    const title = this.titleFor(source, sourceCollection);
    const seed = {};
    if (targetCollection === 'chapters') {
      seed.arc = sourceCollection === 'plots' ? title : '';
      seed.pov = sourceCollection === 'characters' ? title : '';
      seed.name = sourceCollection === 'plots' ? `${title} — New Chapter` : `Chapter: ${title}`;
    } else if (targetCollection === 'timelineEvents') {
      seed.name = `${title} — Timeline Event`;
      seed.keyFigures = ['characters', 'factions'].includes(sourceCollection) ? [title] : [];
    } else if (targetCollection === 'manuscripts') {
      seed.title = `Draft — ${title}`;
      seed.linkedChapter = sourceCollection === 'chapters' ? title : '';
    } else if (targetCollection === 'locations') {
      seed.controlledBy = sourceCollection === 'factions' ? title : '';
    }
    this.section = targetCollection;
    this.editingId = 'new';
    this._linkedSeed = { collection: targetCollection, values: seed };
    this.renderNav();
    this.render();
  };

  WF.getMapPins = function () {
    const items = (this.data?.locations || []).map((item, index) => ({
      ...item,
      _x: Number(item.mapX || (18 + (index * 11) % 68)),
      _y: Number(item.mapY || (22 + (index * 9) % 58)),
      _region: item.mapRegion || item.region || 'Unassigned',
    }));
    return items.sort((a, b) => String(a._region).localeCompare(String(b._region)) || this.titleFor(a, 'locations').localeCompare(this.titleFor(b, 'locations')));
  };

  WF.renderAtlasMap = function () {
    const pins = this.getMapPins();
    const regions = [...new Set(pins.map((pin) => pin._region))];
    const legend = regions.length ? regions.map((region) => `<span class="tag-chip">${this.escapeHtml(region)} (${pins.filter((pin) => pin._region === region).length})</span>`).join('') : '<span class="page-description">Add locations and optional map coordinates to start plotting your world.</span>';
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">WORLD MAP</div><h1>Atlas View</h1><p class="page-description">Pins come from location cards. Set Map Region and optional X/Y values to place them exactly.</p></div>
        <div class="page-actions"><button class="btn btn-primary" onclick="WF.startCreate('locations')">New Location</button></div>
      </div>
      <section class="panel">
        <div class="panel-header"><h2>Regions</h2><span class="panel-sub">Pins and cards stay connected</span></div>
        <div class="chip-row">${legend}</div>
      </section>
      <div class="workspace-grid map-layout">
        <section class="panel map-stage-shell">
          <div class="story-map-stage">
            <div class="story-map-grid"></div>
            ${pins.map((pin) => `
              <button class="map-pin" style="left:${Math.max(4, Math.min(96, pin._x))}%; top:${Math.max(6, Math.min(94, pin._y))}%" onclick="WF.openDetail('locations', '${pin.id}')">
                <span class="map-pin-dot">⌖</span>
                <span class="map-pin-label">${this.escapeHtml(this.titleFor(pin, 'locations'))}</span>
              </button>`).join('')}
          </div>
        </section>
        <section class="panel map-card-shell">
          <div class="panel-header"><h2>Mapped Location Cards</h2><span class="panel-sub">Click a pin or a card to open the full article</span></div>
          <div class="collection-list-enhanced">
            ${pins.length ? pins.map((pin) => `
              <button class="compact-row" onclick="WF.openDetail('locations', '${pin.id}')">
                <div class="compact-row-left"><div class="compact-icon">◉</div><div><strong>${this.escapeHtml(this.titleFor(pin, 'locations'))}</strong><div class="compact-row-meta">${this.escapeHtml(pin._region)}${pin.mapPinNote ? ` · ${this.escapeHtml(pin.mapPinNote)}` : ''}</div></div></div>
              </button>`).join('') : '<div class="page-description">No mapped locations yet.</div>'}
          </div>
        </section>
      </div>`;
  };

  WF.collectGraphData = function () {
    const nodeMap = new Map();
    const edges = [];
    const addNode = (id, label, type) => {
      if (!id || nodeMap.has(id)) return;
      nodeMap.set(id, { id, label, type });
    };
    const addEdge = (source, target, label) => {
      if (!source || !target || source === target) return;
      edges.push({ source, target, label });
    };

    (this.data?.characters || []).forEach((character) => {
      const id = `char:${character.id}`;
      addNode(id, this.titleFor(character, 'characters'), 'Character');
      if (character.affiliation) {
        const faction = (this.data?.factions || []).find((entry) => this.titleFor(entry, 'factions').toLowerCase() === String(character.affiliation).toLowerCase());
        if (faction) addEdge(id, `fac:${faction.id}`, 'Affiliated');
      }
      (character.relationships || []).forEach((rel) => {
        const target = (this.data?.characters || []).find((entry) => this.titleFor(entry, 'characters').toLowerCase() === String(rel.name || '').toLowerCase());
        if (target) addEdge(id, `char:${target.id}`, rel.type || 'Relationship');
      });
    });

    (this.data?.factions || []).forEach((faction) => {
      const id = `fac:${faction.id}`;
      addNode(id, this.titleFor(faction, 'factions'), 'Faction');
      if (faction.territory) {
        const place = (this.data?.locations || []).find((entry) => this.titleFor(entry, 'locations').toLowerCase() === String(faction.territory).toLowerCase());
        if (place) addEdge(id, `loc:${place.id}`, 'Operates In');
      }
      (faction.allies || []).forEach((ally) => {
        const target = (this.data?.factions || []).find((entry) => this.titleFor(entry, 'factions').toLowerCase() === String(ally).toLowerCase());
        if (target) addEdge(id, `fac:${target.id}`, 'Ally');
      });
      (faction.enemies || []).forEach((enemy) => {
        const target = (this.data?.factions || []).find((entry) => this.titleFor(entry, 'factions').toLowerCase() === String(enemy).toLowerCase());
        if (target) addEdge(id, `fac:${target.id}`, 'Enemy');
      });
    });

    (this.data?.locations || []).forEach((location) => addNode(`loc:${location.id}`, this.titleFor(location, 'locations'), 'Location'));
    const nodes = [...nodeMap.values()];
    nodes.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, nodes.length);
      node.x = 320 + Math.cos(angle) * 210;
      node.y = 250 + Math.sin(angle) * 170;
    });
    return { nodes, edges };
  };

  WF.graphNodeTarget = function (nodeId) {
    const [type, raw] = String(nodeId).split(':');
    const map = { char: 'characters', fac: 'factions', loc: 'locations' };
    return map[type] ? { collection: map[type], id: raw } : null;
  };

  WF.openGraphNode = function (nodeId) {
    const target = this.graphNodeTarget(nodeId);
    if (target) this.openDetail(target.collection, target.id);
  };

  WF.renderCanonGraph = function () {
    const { nodes, edges } = this.collectGraphData();
    const edgeRows = edges.slice(0, 24).map((edge) => `<div class="relationship-line"><span class="rel-badge badge badge-outline">${this.escapeHtml(edge.label)}</span><strong>${this.escapeHtml(nodes.find((node) => node.id === edge.source)?.label || edge.source)}</strong><span>→</span><strong>${this.escapeHtml(nodes.find((node) => node.id === edge.target)?.label || edge.target)}</strong></div>`).join('');
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">CANON GRAPH</div><h1>Relationship Web</h1><p class="page-description">Click nodes to open their cards. The graph pulls from affiliations, allies, enemies, territory, and character relationships.</p></div>
      </div>
      <div class="workspace-grid graph-layout">
        <section class="panel graph-stage-shell">
          ${nodes.length ? `
            <svg class="canon-graph" viewBox="0 0 640 500" role="img" aria-label="Canon graph">
              ${edges.map((edge) => {
                const a = nodes.find((node) => node.id === edge.source);
                const b = nodes.find((node) => node.id === edge.target);
                if (!a || !b) return '';
                return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="canon-edge"></line>`;
              }).join('')}
              ${nodes.map((node) => `
                <g class="canon-node" tabindex="0" onclick="WF.openGraphNode('${node.id}')">
                  <circle cx="${node.x}" cy="${node.y}" r="28"></circle>
                  <text x="${node.x}" y="${node.y - 38}" text-anchor="middle">${this.escapeHtml(node.label)}</text>
                </g>`).join('')}
            </svg>` : '<div class="empty-state"><h3>No graph data yet</h3><p>Add relationships, affiliations, and territories to generate your canon graph.</p></div>'}
        </section>
        <section class="panel relationships-shell">
          <div class="panel-header"><h2>Visible Edges</h2><span class="panel-sub">First 24 connections for quick scanning</span></div>
          ${edgeRows || '<div class="page-description">No visible edges yet.</div>'}
        </section>
      </div>`;
  };

  WF.buildPublicWikiHtml = function () {
    const meta = this.data?.meta || {};
    const sections = this.getPublicSections().map((collection) => {
      const cfg = this.COLLECTIONS[collection];
      const items = this.data?.[collection] || [];
      if (!items.length) return '';
      return `
        <section>
          <h2>${this.escapeHtml(cfg.label)}${cfg.label.endsWith('s') ? '' : 's'}</h2>
          <div class="grid">${items.map((item) => `
            <article class="card">
              <h3>${this.escapeHtml(this.titleFor(item, collection))}</h3>
              <div class="meta">${this.escapeHtml(item.status || item.type || item.role || '')}</div>
              <p>${this.escapeHtml(this.stripHtml(item.overview || item.synopsis || item.description || item.storyNotes || '').slice(0, 260))}</p>
            </article>`).join('')}</div>
        </section>`;
    }).join('');

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${this.escapeHtml(meta.projectName || 'StoryAtlas')}</title>
<style>
body{font-family:Inter,Arial,sans-serif;margin:0;background:#0f172a;color:#e5e7eb;line-height:1.5}
header{padding:56px 24px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,#111827,#0f172a)}
main{max-width:1120px;margin:0 auto;padding:32px 24px 72px}
h1{margin:0 0 8px;font-size:2.4rem}p{opacity:.92}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}.card{background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:18px}.meta{opacity:.7;font-size:.9rem;margin-bottom:8px}section{margin-top:30px}h2{margin-bottom:14px}
</style>
</head>
<body>
<header><h1>${this.escapeHtml(meta.projectName || 'StoryAtlas')}</h1><p>${this.escapeHtml(meta.description || 'A shareable audience-facing guide to the series canon, cast, places, and lore.')}</p><p><strong>Genre:</strong> ${this.escapeHtml(meta.genre || 'Unspecified')}</p></header>
<main>${sections || '<p>No public-facing entries yet.</p>'}</main>
</body>
</html>`;
  };

  WF.exportPublicWiki = function () {
    const blob = new Blob([this.buildPublicWikiHtml()], { type: 'text/html;charset=utf-8' });
    this.downloadBlob('storyatlas_public_wiki.html', blob);
    this.toast('Public wiki HTML exported', 'success');
  };

  WF.renderPublicWiki = function () {
    const counts = this.getPublicSections().map((collection) => {
      const cfg = this.COLLECTIONS[collection];
      const count = (this.data?.[collection] || []).length;
      return `<div class="hero-stat-simple"><strong>${count}</strong><span>${this.escapeHtml(cfg.label)}${count === 1 || cfg.label.endsWith('s') ? '' : 's'}</span><small>Included in the audience-facing export</small></div>`;
    }).join('');
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">PUBLIC WIKI</div><h1>Audience-Facing Reference</h1><p class="page-description">Preview a simpler shareable wiki and export it as a single HTML file for readers or collaborators.</p></div>
        <div class="page-actions"><button class="btn btn-primary" onclick="WF.exportPublicWiki()">Export Public HTML</button></div>
      </div>
      <section class="panel">
        <div class="hero-stat-grid">${counts}</div>
      </section>
      <section class="panel public-preview-shell">
        <div class="public-preview-frame">${this.buildPublicWikiHtml().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </section>`;
  };

  WF.getCanvasNotes = function () {
    return Array.isArray(this.data?.meta?.canvasNotes) ? this.data.meta.canvasNotes : [];
  };

  WF.addCanvasNote = function () {
    this.showModal('Add Canvas Note', `
      <div class="form-field"><label class="field-label">Title</label><input id="canvas-note-title" class="field-input" placeholder="e.g. Future arc, spin-off idea, side character" /></div>
      <div class="form-field"><label class="field-label">Column</label><select id="canvas-note-column" class="field-input"><option>Ideas</option><option>Building</option><option>Drafting</option><option>Future</option></select></div>
      <div class="form-field"><label class="field-label">Note</label><textarea id="canvas-note-body" class="field-textarea tall" placeholder="What belongs on the canvas?"></textarea></div>`,
      `<button class="btn btn-secondary" onclick="WF.closeModal()">Cancel</button><button class="btn btn-primary" onclick="WF.saveCanvasNote()">Save Note</button>`);
  };

  WF.saveCanvasNote = async function () {
    const note = {
      id: `note_${Date.now()}`,
      title: document.getElementById('canvas-note-title')?.value.trim() || 'Untitled note',
      column: document.getElementById('canvas-note-column')?.value || 'Ideas',
      body: document.getElementById('canvas-note-body')?.value.trim() || '',
    };
    const notes = [...this.getCanvasNotes(), note];
    await this.saveMeta({ canvasNotes: notes });
    this.closeModal();
    this.render();
  };

  WF.deleteCanvasNote = async function (id) {
    await this.saveMeta({ canvasNotes: this.getCanvasNotes().filter((note) => note.id !== id) });
    this.render();
  };

  WF.renderStoryCanvas = function () {
    const notes = this.getCanvasNotes();
    const storyItems = [
      ...(this.data.plots || []).map((item) => ({ ...item, _collection: 'plots', _column: item.status && ['Completed', 'Final', 'Published'].includes(item.status) ? 'Drafting' : 'Building' })),
      ...(this.data.chapters || []).map((item) => ({ ...item, _collection: 'chapters', _column: item.status && ['Final Draft', 'Published', 'Final'].includes(item.status) ? 'Drafting' : 'Building' })),
      ...(this.data.manuscripts || []).map((item) => ({ ...item, _collection: 'manuscripts', _column: item.status && ['Final', 'Polished Draft'].includes(item.status) ? 'Drafting' : 'Building' })),
    ];
    const columns = ['Ideas', 'Building', 'Drafting', 'Future'];
    const body = columns.map((column) => {
      const items = [
        ...notes.filter((note) => note.column === column).map((note) => ({ ...note, _kind: 'note' })),
        ...storyItems.filter((item) => item._column === column).map((item) => ({ ...item, _kind: 'entry' })),
      ];
      return `
        <div class="board-col-enhanced">
          <div class="board-col-head"><span>${column}</span><span class="board-col-count">${items.length}</span></div>
          ${items.length ? items.map((item) => item._kind === 'note'
            ? `<article class="board-card-enhanced canvas-note-card"><strong>${this.escapeHtml(item.title)}</strong><small>Canvas note</small><p>${this.escapeHtml(item.body || '')}</p><button class="btn btn-secondary btn-sm" onclick="WF.deleteCanvasNote('${item.id}')">Remove</button></article>`
            : `<button class="board-card-enhanced" onclick="${item._collection === 'manuscripts' ? `WF.openManuscript('${item.id}')` : `WF.openDetail('${item._collection}', '${item.id}')`}\"><strong>${this.escapeHtml(this.titleFor(item, item._collection))}</strong><small>${this.escapeHtml(this.COLLECTIONS[item._collection].label)} · ${this.escapeHtml(item.status || 'Unsorted')}</small></button>`
          ).join('') : '<div class="page-description">Nothing here yet.</div>'}
        </div>`;
    }).join('');
    return `
      <div class="page-header-row">
        <div><div class="eyebrow">STORY CANVAS</div><h1>Idea & Workflow Canvas</h1><p class="page-description">Lay out arcs, chapters, drafts, and loose notes in one broad planning surface.</p></div>
        <div class="page-actions"><button class="btn btn-secondary" onclick="WF.startCreate('plots')">New Arc</button><button class="btn btn-secondary" onclick="WF.startCreate('manuscripts')">New Draft</button><button class="btn btn-primary" onclick="WF.addCanvasNote()">Add Canvas Note</button></div>
      </div>
      <section class="board-shell-enhanced">${body}</section>`;
  };

  WF.renderForm = function (collection, item) {
    if (!item && this._linkedSeed && this._linkedSeed.collection === collection) {
      const seeded = { ...(this._linkedSeed.values || {}) };
      this._linkedSeed = null;
      return original.renderForm.call(this, collection, seeded);
    }
    return original.renderForm.call(this, collection, item);
  };

  WF.renderFieldValue = function (field, value) {
    if (field.t === 'richtext') return `<div class="rich-view">${value}</div>`;
    if (field.t === 'textarea') return `<p class="long-text">${this.escapeHtml(value).replace(/\n/g, '<br>')}</p>`;
    if (field.t === 'list') return `<ul class="bullet-list">${value.map((entry) => `<li>${this.renderLinkedText(entry, 'inline-link-text')}</li>`).join('')}</ul>`;
    if (field.t === 'tags') return this.renderChipSet(value);
    if (field.t === 'relationships') return `<div class="mini-grid">${value.map((entry) => {
      const linked = this.matchLinkedEntry(entry.name || '');
      return `<div class="mini-card ${linked ? 'mini-card-linked' : ''}"><div class="mini-card-title">${linked ? `<button class="inline-link-chip" onclick="WF.openDetail('${linked.collection}', '${linked.item.id}')">${this.escapeHtml(entry.name || '')}</button>` : this.escapeHtml(entry.name || '')}</div><div class="mini-card-sub">${this.escapeHtml(entry.type || '')}</div><div class="mini-card-copy">${this.escapeHtml(entry.desc || '')}</div></div>`;
    }).join('')}</div>`;
    if (field.t === 'abilities') return original.renderFieldValue.call(this, field, value);
    if (field.t === 'quotes') return original.renderFieldValue.call(this, field, value);
    return `<p>${this.renderLinkedText(String(value), 'inline-link-text')}</p>`;
  };

  WF.openDetail = function (collection, id) {
    this.pushRecent(collection, id);
    const item = this.findItem(collection, id);
    if (!item) return;
    if (collection === 'manuscripts') return this.openManuscript(id);
    const cfg = this.COLLECTIONS[collection];
    const title = this.titleFor(item, collection);
    const temporalKeys = ['pastStatus', 'pastSummary', 'presentStatus', 'presentSummary', 'futureStatus', 'futureSummary'];
    const infobox = (cfg.infoboxFields || []).map((field) => {
      const value = item[field];
      if (!value || (Array.isArray(value) && !value.length)) return '';
      const label = (cfg.fields.find((entry) => entry.k === field) || {}).l || field;
      const rendered = Array.isArray(value) ? this.renderChipSet(value) : this.renderLinkedText(value) || this.escapeHtml(String(value));
      return `<div class="infobox-row"><div class="infobox-label">${label}</div><div class="infobox-value">${rendered}</div></div>`;
    }).join('');

    const sections = cfg.fields
      .filter((field) => !cfg.infoboxFields.includes(field.k) && !['name', 'title'].includes(field.k) && !temporalKeys.includes(field.k))
      .map((field) => {
        const value = item[field.k];
        if (!value || (Array.isArray(value) && !value.length)) return '';
        return `<section class="wiki-section"><div class="wiki-section-title">${field.l}</div><div class="wiki-section-body">${this.renderFieldValue(field, value)}</div></section>`;
      }).join('');

    const structured = this.findStructuredConnections(collection, item);
    const backlinks = this.findBacklinks(collection, id).slice(0, 12);
    const quickActions = [];
    if (collection === 'characters') {
      quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('chapters', 'characters', '${id}')">New Chapter for This Character</button>`);
      quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('timelineEvents', 'characters', '${id}')">New Timeline Event</button>`);
    }
    if (collection === 'factions') {
      quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('locations', 'factions', '${id}')">New Controlled Location</button>`);
      quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('timelineEvents', 'factions', '${id}')">New Faction Event</button>`);
    }
    if (collection === 'plots') quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('chapters', 'plots', '${id}')">New Chapter in This Arc</button>`);
    if (collection === 'chapters') quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.quickCreateLinked('manuscripts', 'chapters', '${id}')">New Draft from This Chapter</button>`);
    if (collection === 'locations' && (item.mapRegion || item.mapX || item.mapY)) quickActions.push(`<button class="btn btn-secondary btn-block" onclick="WF.navigate('atlasMap')">Open on World Map</button>`);
    quickActions.push(`<button class="btn btn-primary btn-block" onclick="WF.navigate('canonGraph')">Open Canon Graph</button>`);

    document.getElementById('content-area').innerHTML = `
      <div class="page-header-row">
        <div>
          <div class="eyebrow">${cfg.label.toUpperCase()} PAGE</div>
          <h1>${this.escapeHtml(title)}</h1>
          <p class="page-description">Structured article view with connected references, backlinks, and quick follow-up actions.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" onclick="WF.navigate('${collection}')">Back</button>
          <button class="btn btn-primary" onclick="WF.startEdit('${collection}', '${id}')">Edit</button>
          <button class="btn btn-danger" onclick="WF.confirmDelete('${collection}', '${id}', '${this.escapeForAttr(title)}')">Delete</button>
        </div>
      </div>
      <div class="wiki-layout">
        <div class="wiki-main">${this.renderTemporalPanels(item)}${sections || '<div class="empty-state"><p>No content yet. Edit this page to flesh it out.</p></div>'}</div>
        <aside class="wiki-side connected-side">
          <div class="infobox-card">
            <div class="infobox-head">${cfg.icon} ${this.escapeHtml(title)}</div>
            <div class="infobox-avatar" style="--avatar-color:${cfg.color}">${cfg.icon}</div>
            ${item.aliases && item.aliases.length ? `<div class="infobox-aliases">Also known as: ${this.renderChipSet(item.aliases)}</div>` : ''}
            ${infobox || '<div class="empty-inline">No quick info yet.</div>'}
          </div>
          <div class="panel compact-panel connection-panel"><div class="panel-header"><h2>Direct Connections</h2><span class="panel-sub">Structured links from this page</span></div>${this.renderConnectionList(structured)}</div>
          <div class="panel compact-panel connection-panel"><div class="panel-header"><h2>Referenced Elsewhere</h2><span class="panel-sub">Backlinks across the studio</span></div>${this.renderConnectionList(backlinks)}</div>
          <div class="panel compact-panel connection-panel"><div class="panel-header"><h2>Quick Actions</h2><span class="panel-sub">Keep building without losing context</span></div><div class="sidebar-footer">${quickActions.join('')}</div></div>
        </aside>
      </div>`;
    this.postRenderEnhance();
  };

  WF.render = function () {
    const area = document.getElementById('content-area');
    if (!area) return;
    if (this.section === 'dashboard') area.innerHTML = this.renderDashboardEnhanced();
    else if (this.section === 'worldBible') area.innerHTML = this.renderWorldBible();
    else if (this.section === 'atlasMap') area.innerHTML = this.renderAtlasMap();
    else if (this.section === 'publicWiki') area.innerHTML = this.renderPublicWiki();
    else if (this.section === 'storyCanvas') area.innerHTML = this.renderStoryCanvas();
    else if (this.section === 'canonGraph') area.innerHTML = this.renderCanonGraph();
    else if (this.section === 'stats') area.innerHTML = this.renderStats();
    else if (this.section === 'scratchpad') area.innerHTML = this.renderScratchpad();
    else original.render();
    this.postRenderEnhance();
  };

  WF.init = async function () {
    this.loadEnhancedPrefs();
    await original.init();
    this.injectShellEnhancements();
    if (!this.enhancedReady) {
      this.enhancedReady = true;
      this.bindEnhancedEvents();
    }
    if (this.data?.meta?.scratchpad && !this.scratchpadLocal) this.scratchpadLocal = this.data.meta.scratchpad;
    this.applyTheme();
    this.saveEnhancedPrefs();
    this.renderNav();
    this.render();
    if (this.shouldShowOnboarding()) this.showOnboarding(1);
  };
})();

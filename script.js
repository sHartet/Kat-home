(function () {
  'use strict';

  const ENGINES = {
    bing: { name: '必应', icon: 'B', url: 'https://www.bing.com/search?q=' },
    google: { name: '谷歌', icon: 'G', url: 'https://www.google.com/search?q=' },
    baidu: { name: '百度', icon: 'D', url: 'https://www.baidu.com/s?wd=' }
  };

  const DEFAULT_NAVS = [
    { title: 'GitHub', url: 'https://github.com' },
    { title: '哔哩哔哩', url: 'https://www.bilibili.com' },
    { title: '知乎', url: 'https://www.zhihu.com' },
    { title: '掘金', url: 'https://juejin.cn' }
  ];

  let currentEngine = 'bing';
  let navItems = [];
  let recentSearches = [];
  let suggestionItems = [];
  let activeSuggestionIndex = -1;

  // ---------- DOM refs ----------
  const timeText = document.getElementById('timeText');
  const engineBtn = document.getElementById('engineBtn');
  const engineIcon = document.getElementById('engineIcon');
  const engineMenu = document.getElementById('engineMenu');
  const searchInput = document.getElementById('searchInput');
  const searchSubmit = document.getElementById('searchSubmit');
  const suggestionsMenu = document.getElementById('suggestionsMenu');
  const navGrid = document.getElementById('navGrid');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const closeSettings = document.getElementById('closeSettings');
  const defaultEngineSelector = document.getElementById('defaultEngineSelector');
  const wallpaperFile = document.getElementById('wallpaperFile');
  const wallpaperUrl = document.getElementById('wallpaperUrl');
  const navEditor = document.getElementById('navEditor');
  const addNavBtn = document.getElementById('addNavBtn');

  // ---------- Storage helpers ----------
  function loadStorage() {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      const raw = localStorage.getItem('home_settings');
      return raw ? JSON.parse(raw) : {};
    }
    return new Promise((resolve) => {
      chrome.storage.local.get(['engine', 'wallpaper', 'navs', 'recentSearches'], (res) => resolve(res || {}));
    });
  }

  function saveStorage(data) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
      const existing = JSON.parse(localStorage.getItem('home_settings') || '{}');
      localStorage.setItem('home_settings', JSON.stringify({ ...existing, ...data }));
      return;
    }
    chrome.storage.local.set(data);
  }

  async function init() {
    const stored = await loadStorage();

    currentEngine = ENGINES[stored.engine] ? stored.engine : 'bing';
    updateEngineUI();

    if (stored.wallpaper) {
      applyWallpaper(stored.wallpaper);
    }

    navItems = Array.isArray(stored.navs) && stored.navs.length
      ? stored.navs
      : DEFAULT_NAVS;
    recentSearches = Array.isArray(stored.recentSearches)
      ? stored.recentSearches.slice(0, 15)
      : [];
    renderNav();
    renderNavEditor();

    startClock();
    bindEvents();
  }

  // ---------- Clock ----------
  function startClock() {
    const update = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      timeText.textContent = `${h}:${m}`;
    };
    update();
    setInterval(update, 1000);
  }

  // ---------- Engine ----------
  function updateEngineUI() {
    const cfg = ENGINES[currentEngine];
    engineIcon.textContent = cfg.name;
    searchInput.placeholder = `使用 ${cfg.name} 搜索...`;

    document.querySelectorAll('#engineMenu .engine-option').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.engine === currentEngine);
    });

    document.querySelectorAll('#defaultEngineSelector .engine-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.engine === currentEngine);
    });
  }

  function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    window.location.href = ENGINES[currentEngine].url + encodeURIComponent(q);
  }

  function saveRecentSearch(query) {
    const q = query.trim();
    if (!q) return;
    recentSearches = recentSearches.filter((item) => item !== q);
    recentSearches.unshift(q);
    if (recentSearches.length > 15) recentSearches = recentSearches.slice(0, 15);
    saveStorage({ recentSearches });
  }

  function doSearchWith(q) {
    const query = (q || searchInput.value).trim();
    if (!query) return;
    saveRecentSearch(query);
    window.location.href = ENGINES[currentEngine].url + encodeURIComponent(query);
  }

  // ---------- Suggestions ----------
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.textContent || textarea.innerText || text;
  }

  function quoteJsonKeys(text) {
    // Baidu returns JavaScript object literals with unquoted keys, e.g. {q:"...",p:false,s:[...]}
    return text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  }

  async function fetchSuggestions(query) {
    const q = query.trim();
    if (!q) {
      hideSuggestions();
      return;
    }

    const endpoints = [
      `https://suggestion.baidu.com/su?wd=${encodeURIComponent(q)}&cb=cb`,
      `https://sp1.baidu.com/5a1Fazu8AA54nxGko9WTAnF6hhy/su?wd=${encodeURIComponent(q)}&cb=cb`
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { credentials: 'omit' });
        const buffer = await res.arrayBuffer();
        let text = new TextDecoder('gbk').decode(buffer);
        // eslint-disable-next-line no-console
        console.log('[MyHome] suggestion raw:', text.slice(0, 200));
        text = text.replace(/^\uFEFF/, ''); // strip BOM
        text = decodeHtmlEntities(text); // Baidu returns HTML-escaped JSON
        const start = text.indexOf('(');
        const end = text.lastIndexOf(')');
        if (start === -1 || end === -1 || end <= start) throw new Error('invalid jsonp');
        const jsonText = quoteJsonKeys(text.slice(start + 1, end));
        const data = JSON.parse(jsonText);
        const apiSuggestions = Array.isArray(data.s) ? data.s.slice(0, 8) : [];
        if (apiSuggestions.length) {
          suggestionItems = apiSuggestions;
          activeSuggestionIndex = -1;
          renderSuggestions();
          return;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[MyHome] suggestion endpoint failed:', url, err);
      }
    }

    // Fallback to recent searches matching current query
    const matches = recentSearches
      .filter((item) => item.toLowerCase().includes(q.toLowerCase()) && item !== q)
      .slice(0, 6);
    if (matches.length) {
      suggestionItems = matches;
      activeSuggestionIndex = -1;
      renderSuggestions();
    } else {
      suggestionItems = [];
      hideSuggestions();
    }
  }

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 180);

  function renderSuggestions() {
    if (!suggestionItems.length) {
      hideSuggestions();
      return;
    }
    suggestionsMenu.innerHTML = '';
    suggestionItems.forEach((text, idx) => {
      const btn = document.createElement('button');
      btn.className = 'suggestion-item';
      btn.type = 'button';
      btn.dataset.index = idx;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>${escapeHtml(text)}</span>
      `;
      btn.addEventListener('click', () => {
        searchInput.value = text;
        doSearchWith(text);
      });
      suggestionsMenu.appendChild(btn);
    });
    suggestionsMenu.classList.remove('hidden');
  }

  function hideSuggestions() {
    suggestionItems = [];
    activeSuggestionIndex = -1;
    suggestionsMenu.classList.add('hidden');
  }

  function updateActiveSuggestion() {
    const items = suggestionsMenu.querySelectorAll('.suggestion-item');
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === activeSuggestionIndex);
    });
  }

  function applyActiveSuggestion() {
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestionItems.length) {
      searchInput.value = suggestionItems[activeSuggestionIndex];
    }
  }

  // ---------- Navigation ----------
  function renderNav() {
    navGrid.innerHTML = '';
    navItems.forEach((item) => {
      const a = document.createElement('a');
      a.className = 'nav-item';
      a.href = item.url;
      a.title = item.title;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const icon = document.createElement('span');
      icon.className = 'nav-icon';
      icon.textContent = getFaviconLetter(item.title);

      const title = document.createElement('span');
      title.className = 'nav-title';
      title.textContent = item.title;

      a.appendChild(icon);
      a.appendChild(title);
      navGrid.appendChild(a);
    });
  }

  function getFaviconLetter(title) {
    return (title || '?').trim().charAt(0).toUpperCase();
  }

  function renderNavEditor() {
    navEditor.innerHTML = '';
    navItems.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'nav-edit-row';
      row.innerHTML = `
        <input type="text" data-idx="${idx}" data-field="title" placeholder="名称" value="${escapeHtml(item.title)}" />
        <input type="text" data-idx="${idx}" data-field="url" placeholder="链接" value="${escapeHtml(item.url)}" />
        <button class="delete-nav-btn" data-idx="${idx}" title="删除">×</button>
      `;
      navEditor.appendChild(row);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveNavFromEditor() {
    const rows = navEditor.querySelectorAll('.nav-edit-row');
    const next = [];
    rows.forEach((row) => {
      const title = row.querySelector('[data-field="title"]').value.trim();
      let url = row.querySelector('[data-field="url"]').value.trim();
      if (!title || !url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      next.push({ title, url });
    });
    navItems = next;
    renderNav();
    saveStorage({ navs: navItems });
  }

  // ---------- Wallpaper ----------
  function applyWallpaper(source) {
    const bg = document.getElementById('bgLayer');
    if (!source) {
      bg.style.backgroundImage = '';
      return;
    }
    bg.style.backgroundImage = `url(${source})`;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  // ---------- Events ----------
  function bindEvents() {
    // Engine dropdown
    engineBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      engineMenu.classList.toggle('hidden');
      hideSuggestions();
    });

    document.addEventListener('click', () => {
      engineMenu.classList.add('hidden');
      hideSuggestions();
    });

    engineMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.target.closest('.engine-option');
      if (!btn) return;
      currentEngine = btn.dataset.engine;
      updateEngineUI();
      saveStorage({ engine: currentEngine });
      engineMenu.classList.add('hidden');
    });

    // Suggestions menu: prevent click from closing itself
    suggestionsMenu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Search
    searchSubmit.addEventListener('click', () => {
      hideSuggestions();
      doSearch();
    });

    searchInput.addEventListener('input', () => {
      debouncedFetchSuggestions(searchInput.value);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (!suggestionItems.length) {
        if (e.key === 'Enter') doSearch();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestionItems.length;
        updateActiveSuggestion();
        applyActiveSuggestion();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex =
          activeSuggestionIndex <= 0 ? suggestionItems.length - 1 : activeSuggestionIndex - 1;
        updateActiveSuggestion();
        applyActiveSuggestion();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        hideSuggestions();
      } else if (e.key === 'Enter') {
        hideSuggestions();
        doSearch();
      }
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) {
        debouncedFetchSuggestions(searchInput.value);
      } else if (recentSearches.length) {
        suggestionItems = recentSearches.slice(0, 6);
        activeSuggestionIndex = -1;
        renderSuggestions();
      }
    });

    // Settings open/close
    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.remove('hidden');
      renderNavEditor();
    });

    const hideSettings = () => settingsPanel.classList.add('hidden');
    closeSettings.addEventListener('click', hideSettings);
    settingsPanel.addEventListener('click', (e) => {
      if (e.target === settingsPanel) hideSettings();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideSettings();
    });

    // Default engine in settings
    defaultEngineSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.engine-chip');
      if (!btn) return;
      currentEngine = btn.dataset.engine;
      updateEngineUI();
      saveStorage({ engine: currentEngine });
    });

    // Wallpaper file
    wallpaperFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await readFileAsBase64(file);
      applyWallpaper(dataUrl);
      saveStorage({ wallpaper: dataUrl });
    });

    // Wallpaper URL
    wallpaperUrl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const url = wallpaperUrl.value.trim();
      if (!url) return;
      applyWallpaper(url);
      saveStorage({ wallpaper: url });
    });

    // Nav editor
    navEditor.addEventListener('input', saveNavFromEditor);
    navEditor.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-nav-btn')) {
        const idx = Number(e.target.dataset.idx);
        navItems.splice(idx, 1);
        renderNav();
        renderNavEditor();
        saveStorage({ navs: navItems });
      }
    });

    addNavBtn.addEventListener('click', () => {
      navItems.push({ title: '新网址', url: 'https://' });
      renderNavEditor();
      saveNavFromEditor();
      setTimeout(() => {
        const inputs = navEditor.querySelectorAll('[data-field="title"]');
        if (inputs.length) {
          inputs[inputs.length - 1].focus();
          inputs[inputs.length - 1].select();
        }
      }, 0);
    });
  }

  init();
})();

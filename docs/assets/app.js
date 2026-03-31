// =============================================
// AI Agent Trends — App Controller v3
// =============================================

const BASE = 'data';
let toolsData = null;
let ghTrending = null;
let hfTrending = null;
let benchData = null;
let articlesData = null;
let geekNewsData = null;
let activeCat = 'all';
let sortBy = 'recent';
let ghPeriod = 'daily';
let query = '';

/* ---- Icons ---- */
const I = {
  star: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`,
  gh: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`,
  link: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 11.5 4 14a2.12 2.12 0 0 1-3-3l2.5-2.5M9.5 4.5 12 2a2.12 2.12 0 0 1 3 3l-2.5 2.5M6 10l4-4"/></svg>`,
  dl: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14zM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06z"/></svg>`,
  heart: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="m8 14.25-.345-.666C3.457 8.322 1.5 6.45 1.5 4.414 1.5 2.756 2.756 1.5 4.414 1.5 5.368 1.5 6.283 1.95 7 2.673V2.67C7.717 1.95 8.632 1.5 9.586 1.5c1.658 0 2.914 1.256 2.914 2.914 0 2.036-1.957 3.908-6.155 9.17z"/></svg>`,
  clock: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 4v4l2.5 1.5"/></svg>`,
  article: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h12M2 6.5h12M2 10h8M2 13.5h5"/></svg>`,
};

/* ---- Formatters ---- */
function fmt(n) {
  if (n == null) return '-';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}
function timeAgo(s) {
  if (!s) return '';
  const d = (Date.now() - new Date(s)) / 1000;
  if (d < 3600) return Math.floor(d / 60) + 'm ago';
  if (d < 86400) return Math.floor(d / 3600) + 'h ago';
  if (d < 2592000) return Math.floor(d / 86400) + 'd ago';
  return new Date(s).toLocaleDateString('ko-KR');
}
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function sClass(v) { return v >= 85 ? 's-high' : v >= 65 ? 's-mid' : 's-low'; }

/* ---- Markdown to HTML ---- */
function md(text) {
  // Code blocks first (```...```)
  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre>${esc(code.trim())}</pre>`
  );
  // Headings
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code (after code blocks)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Tables (simple |...|...|)
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (table) => {
    const rows = table.trim().split('\n').filter(r => !r.match(/^\|\s*[-:]+/));
    if (rows.length < 1) return table;
    const hdr = rows[0].split('|').filter(c => c.trim());
    const body = rows.slice(1);
    return `<table class="bench-table"><thead><tr>${hdr.map(h => `<th>${h.trim()}</th>`).join('')}</tr></thead><tbody>${body.map(r => {
      const cells = r.split('|').filter(c => c.trim());
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table>`;
  });
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  return html;
}

/* ---- Data Loading ---- */
async function boot() {
  // Read URL state
  const params = new URLSearchParams(location.search);
  if (params.get('cat')) activeCat = params.get('cat');
  if (params.get('sort')) sortBy = params.get('sort');
  if (params.get('q')) query = params.get('q');

  const [t, g, h, b, a, gn] = await Promise.allSettled([
    fetch(`${BASE}/tools.json`).then(r => r.json()),
    fetch(`${BASE}/github_trending.json`).then(r => r.json()),
    fetch(`${BASE}/hf_trending.json`).then(r => r.json()),
    fetch(`${BASE}/benchmarks.json`).then(r => r.json()),
    fetch(`${BASE}/articles.json`).then(r => r.json()),
    fetch(`${BASE}/geeknews.json`).then(r => r.json()),
  ]);
  if (t.status === 'fulfilled') toolsData = t.value;
  if (g.status === 'fulfilled') ghTrending = g.value;
  if (h.status === 'fulfilled') hfTrending = h.value;
  if (b.status === 'fulfilled') benchData = b.value;
  if (a.status === 'fulfilled') articlesData = a.value;
  if (gn.status === 'fulfilled') geekNewsData = gn.value;

  // Restore UI state
  if (query) document.getElementById('searchInput').value = query;
  document.getElementById('sortSelect').value = sortBy;

  render();
}

function syncURL() {
  const params = new URLSearchParams();
  if (activeCat !== 'all') params.set('cat', activeCat);
  if (sortBy !== 'recent') params.set('sort', sortBy);
  if (query) params.set('q', query);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

/* ---- Render All ---- */
function render() {
  renderUpdated();
  renderTopics();
  renderHighlights();
  renderTabs();
  renderStats();
  renderTools();
  renderGH();
  renderHF();
  renderGeekNews();
  renderCatTrending();
}

function renderUpdated() {
  const el = document.getElementById('lastUpdated');
  if (toolsData?.last_updated) {
    el.innerHTML = `<span class="live-dot"></span> Updated ${timeAgo(toolsData.last_updated)}`;
  }
}

/* ---- Trending Topics ---- */
function renderTopics() {
  const el = document.getElementById('topicPills');
  // Extract trending topics from GitHub trending descriptions
  const topicCounts = {};
  const topicKws = ['mcp','rag','agent','llm','diffusion','workflow','tts','voice','video','coding','browser','local','fine-tune','multimodal','embedding','vector'];
  (ghTrending?.ai_trending || []).concat(ghTrending?.ai_daily || []).forEach(r => {
    const text = `${r.full_name} ${r.description || ''}`.toLowerCase();
    topicKws.forEach(kw => { if (text.includes(kw)) topicCounts[kw] = (topicCounts[kw] || 0) + 1; });
  });
  const sorted = Object.entries(topicCounts).sort((a,b) => b[1] - a[1]).slice(0, 12);
  if (!sorted.length) { el.innerHTML = ''; return; }
  el.innerHTML = sorted.map(([kw, count]) =>
    `<span class="topic-pill" data-topic="${kw}"><span class="pill-hash">#</span>${kw} <span style="opacity:.4;margin-left:2px">${count}</span></span>`
  ).join('');
  el.addEventListener('click', e => {
    const pill = e.target.closest('.topic-pill');
    if (!pill) return;
    document.getElementById('searchInput').value = pill.dataset.topic;
    query = pill.dataset.topic;
    syncURL();
    renderTools();
  });
}

/* ---- Today's Highlights ---- */
function renderHighlights() {
  const hdr = document.getElementById('highlightsHeader');
  const el = document.getElementById('highlightsGrid');
  const items = [];

  // Recently updated tools (last 7 days)
  const week = 7 * 86400 * 1000;
  const recentTools = (toolsData?.tools || []).filter(t => t.last_push && (Date.now() - new Date(t.last_push)) < week)
    .sort((a,b) => new Date(b.last_push) - new Date(a.last_push))
    .slice(0, 3);
  recentTools.forEach(t => items.push({ type:'new', label:'Recently Active', icon:'🟢', title:t.name, sub:`Updated ${timeAgo(t.last_push)}`, stat:fmt(t.stars), statClass:'hot', url:t.website || t.github_url, toolId:t.id }));

  // Top daily trending repos
  (ghTrending?.ai_daily || []).slice(0, 3).forEach(r =>
    items.push({ type:'hot', label:'Trending Today', icon:'⭐', title:r.full_name.split('/').pop(), sub:r.trending_stars || `${fmt(r.stars)} stars`, stat:r.trending_stars || '', statClass:'hot', url:r.url })
  );

  // Top GeekNews
  (geekNewsData?.posts || []).slice(0, 2).forEach(p =>
    items.push({ type:'surge', label:'Community Buzz', icon:'💬', title:p.title, sub:`${p.points}P · GeekNews`, stat:`${p.points}P`, statClass:'green', url:p.url })
  );

  if (!items.length) { hdr.innerHTML = ''; el.innerHTML = ''; return; }

  hdr.innerHTML = `<span class="highlights-title">Today's Highlights</span><span class="highlights-sub">— recently active tools, daily trending repos, and community buzz</span>`;
  el.innerHTML = items.map(it => `
    <a class="highlight-card hl-${it.type}" href="${it.url || '#'}" ${it.url ? 'target="_blank" rel="noopener"' : ''} ${it.toolId ? `data-tool="${it.toolId}"` : ''}>
      <div class="hl-icon">${it.icon}</div>
      <div class="hl-info">
        <div class="hl-label">${it.label}</div>
        <div class="hl-title">${it.title}</div>
        <div class="hl-sub">${it.sub}</div>
      </div>
      ${it.stat ? `<span class="hl-stat ${it.statClass}">${it.stat}</span>` : ''}
    </a>
  `).join('');

  // Click on tool highlights opens modal
  el.querySelectorAll('[data-tool]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const tool = toolsData.tools.find(t => t.id === card.dataset.tool);
      if (tool) openModal(tool);
    });
  });
}

function renderTabs() {
  if (!toolsData?.categories) return;
  const wrap = document.getElementById('categoryTabs');
  wrap.innerHTML = `<button class="tab active" data-category="all">All</button>`;
  toolsData.categories.forEach(c => {
    const b = document.createElement('button');
    b.className = 'tab';
    b.dataset.category = c.id;
    b.textContent = `${c.icon} ${c.name_en}`;
    wrap.appendChild(b);
  });
  wrap.addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (!b) return;
    wrap.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    b.classList.add('active');
    activeCat = b.dataset.category;
    syncURL();
    renderTools();
  });

  // Restore active tab from URL
  if (activeCat !== 'all') {
    wrap.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.category === activeCat);
    });
  }
}

function renderStats() {
  if (!toolsData?.tools) return;
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  set('totalTools', `<span class="h-stat-n">${toolsData.tools.length}</span> tools`);
  set('totalStars', `<span class="h-stat-n">${fmt(toolsData.tools.reduce((s, t) => s + (t.stars || 0), 0))}</span> stars`);
  set('totalCategories', `<span class="h-stat-n">${toolsData.categories?.length || 0}</span> categories`);
  set('trendingCount', `<span class="h-stat-n">${ghTrending?.ai_trending?.length || 0}</span> trending`);
}

/* ---- Tools Grid ---- */
function renderTools() {
  if (!toolsData?.tools) return;
  const grid = document.getElementById('toolsGrid');
  let list = [...toolsData.tools];

  if (activeCat !== 'all') list = list.filter(t => t.category === activeCat);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags || []).some(g => g.includes(q))
    );
  }
  // Sort
  switch (sortBy) {
    case 'recent':
      list.sort((a, b) => {
        const da = a.last_push || '';
        const db = b.last_push || '';
        return db.localeCompare(da);
      });
      break;
    case 'stars':
      list.sort((a, b) => (b.stars || 0) - (a.stars || 0));
      break;
    case 'trending':
      list.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));
      break;
    case 'name':
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  if (!list.length) {
    grid.innerHTML = `<div class="no-results"><h3>No results</h3><p>Try a different keyword or category.</p></div>`;
    return;
  }

  const cats = {};
  (toolsData.categories || []).forEach(c => cats[c.id] = c);

  // Check which tools have articles
  const articleIds = new Set((articlesData?.articles || []).map(a => a.tool_id));

  function freshness(lp) {
    if (!lp) return '';
    const days = (Date.now() - new Date(lp)) / 86400000;
    if (days < 7) return '<span class="freshness freshness-hot" title="Active (< 7 days)"></span>';
    if (days < 30) return '<span class="freshness freshness-warm" title="Recent (< 30 days)"></span>';
    return '<span class="freshness freshness-cold" title="Stale (> 30 days)"></span>';
  }

  grid.innerHTML = list.map(t => {
    const c = cats[t.category] || {};
    const hasArticle = articleIds.has(t.id);
    return `
    <div class="tool-card" data-id="${t.id}">
      <div class="card-top">
        <span class="card-cat cat-${t.category}">${c.icon || ''} ${c.name_en || t.category}</span>
        <span class="card-score ${sClass(t.trending_score||0)}">${t.trending_score||0}</span>
      </div>
      <div class="card-name">${freshness(t.last_push)}${t.name}${hasArticle ? '<span class="card-article-dot" title="Deep Dive available"></span>' : ''}</div>
      <div class="card-desc">${t.description}</div>
      ${t.pricing ? `<div class="card-pricing">${t.pricing}</div>` : ''}
      <div class="card-meta">
        ${t.stars ? `<span class="meta-item stars-item">${I.star} ${fmt(t.stars)}</span>` : ''}
        ${t.last_push ? `<span class="meta-item">${I.clock} ${timeAgo(t.last_push)}</span>` : ''}
        ${t.github_url ? `<span class="meta-item">${I.gh}</span>` : ''}
        ${t.website ? `<span class="meta-item">${I.link}</span>` : ''}
      </div>
      <div class="card-tags">${(t.tags||[]).map(g => `<span class="tag">${g}</span>`).join('')}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.tool-card').forEach(card =>
    card.addEventListener('click', () => {
      const tool = toolsData.tools.find(t => t.id === card.dataset.id);
      if (tool) openModal(tool);
    })
  );
}

/* ---- GitHub Trending ---- */
function renderGH() {
  const el = document.getElementById('githubTrending');
  const repos = ghPeriod === 'daily'
    ? (ghTrending?.ai_daily || ghTrending?.ai_trending || [])
    : (ghTrending?.ai_trending || []);
  if (!repos.length) {
    el.innerHTML = `<div class="placeholder-loader small"><p style="font-size:12px;color:var(--text-3)">Run <code>python crawler/fetch_trends.py</code></p></div>`;
    return;
  }
  el.innerHTML = repos.slice(0, 15).map((r, i) => `
    <a class="feed-item" href="${r.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${r.full_name}</div>
        <div class="feed-desc">${r.description || ''}</div>
      </div>
      <span class="feed-stat">${I.star} ${fmt(r.stars)}${r.trending_stars ? `<br><span style="font-size:10px;color:var(--orange)">${r.trending_stars}</span>` : ''}</span>
    </a>
  `).join('');
}

/* ---- Category Trending ---- */
function renderCatTrending() {
  const section = document.getElementById('catTrendingSection');
  const byCat = ghTrending?.by_category || {};
  if (!Object.keys(byCat).length) { section.innerHTML = ''; return; }

  const cats = {};
  (toolsData?.categories || []).forEach(c => cats[c.id] = c);

  section.innerHTML = Object.entries(byCat).map(([catId, repos]) => {
    const cat = cats[catId] || { icon: '', name_en: catId };
    return `
      <div class="cat-trending-group">
        <div class="cat-trending-title">
          <span class="card-cat cat-${catId}">${cat.icon} ${cat.name_en}</span>
          <span style="font-size:11px;color:var(--text-3)">${repos.length} trending repos</span>
        </div>
        <div class="cat-trending-list">
          ${repos.slice(0, 6).map((r, i) => `
            <a class="feed-item" href="${r.url}" target="_blank" rel="noopener">
              <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
              <div class="feed-info">
                <div class="feed-name">${r.full_name}</div>
                <div class="feed-desc">${r.description || ''}</div>
              </div>
              <span class="feed-stat">${I.star} ${fmt(r.stars)}</span>
            </a>
          `).join('')}
        </div>
      </div>`;
  }).join('');
}

/* ---- HuggingFace Trending ---- */
function renderHF() {
  const el = document.getElementById('hfTrending');
  const models = hfTrending?.trending_models || [];
  if (!models.length) {
    el.innerHTML = `<div class="placeholder-loader small"><p style="font-size:12px;color:var(--text-3)">Run crawler to load HuggingFace data</p></div>`;
    return;
  }
  el.innerHTML = models.slice(0, 15).map((m, i) => `
    <a class="feed-item" href="${m.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${m.id}</div>
        <div class="feed-desc">${m.pipeline_tag || ''}</div>
      </div>
      <span class="feed-stat">${I.heart} ${fmt(m.likes)}&ensp;${I.dl} ${fmt(m.downloads)}</span>
    </a>
  `).join('');
}

/* ---- GeekNews Feed ---- */
function renderGeekNews() {
  const el = document.getElementById('geeknewsFeed');
  const posts = geekNewsData?.posts || [];
  if (!posts.length) {
    el.innerHTML = '<div class="placeholder-loader small"><p style="font-size:11px;color:var(--text-3)">No GeekNews data</p></div>';
    return;
  }
  el.innerHTML = posts.slice(0, 15).map((p, i) => `
    <a class="feed-item" href="${p.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${p.title}</div>
        <div class="feed-desc">${p.source || 'GeekNews'}</div>
      </div>
      <span class="feed-stat" style="color:var(--orange)">${p.points}P</span>
    </a>
  `).join('');
}

/* ---- Modal ---- */
function openModal(t) {
  const bd = document.getElementById('modalBackdrop');
  const body = document.getElementById('modalContent');
  const cats = {};
  (toolsData.categories || []).forEach(c => cats[c.id] = c);
  const c = cats[t.category] || {};

  function highlight(code) {
    return esc(code)
      .replace(/^(#.*)/gm, '<span class="comment">$1</span>')
      .replace(/(pip install|npm install|docker run|git clone|brew install|curl|conda|python3?|npx)\b/g, '<span class="cmd">$1</span>');
  }

  // Find article for this tool
  const article = (articlesData?.articles || []).find(a => a.tool_id === t.id);

  // Find related benchmarks by category
  const benchCatMap = {
    'coding-agents': ['swe-bench', 'aider-leaderboard', 'livecodebench'],
    'image-generation': ['image-arena'],
    'local-llm': ['chatbot-arena', 'livecodebench'],
    'agent-frameworks': ['chatbot-arena'],
    'workflow-automation': ['chatbot-arena'],
    'nocode-builders': ['chatbot-arena'],
  };
  const relatedBenchIds = benchCatMap[t.category] || [];
  const relatedBenches = (benchData?.benchmarks || []).filter(b => relatedBenchIds.includes(b.id));

  function renderMiniLeaderboard(b) {
    const top5 = b.entries.slice(0, 5);
    return `
      <div class="mini-bench">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;font-weight:700">${b.name}</span>
          <a class="bench-source" href="${b.source_url}" target="_blank" rel="noopener">Source &rarr;</a>
        </div>
        <table class="bench-table">
          <thead><tr><th>#</th><th>Model</th><th>Score</th><th>Org</th></tr></thead>
          <tbody>${top5.map(e => `
            <tr>
              <td class="rank-cell ${e.rank <= 3 ? 'top' : ''}">${e.rank}</td>
              <td>${e.name}</td>
              <td class="score-cell">${e.score}${e.unit === '%' ? '%' : ' ' + e.unit}</td>
              <td class="org-cell">${e.org}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  body.innerHTML = `
    <div class="modal-cat">
      <span class="card-cat cat-${t.category}">${c.icon||''} ${c.name_en||''}</span>
    </div>
    <h2 class="modal-title">${t.name}</h2>
    <p class="modal-desc">${t.description}</p>

    <div class="modal-links">
      ${t.github_url ? `<a class="m-link m-link-gh" href="${t.github_url}" target="_blank" rel="noopener">${I.gh} GitHub Repository</a>` : ''}
      ${t.website ? `<a class="m-link m-link-web" href="${t.website}" target="_blank" rel="noopener">${I.link} Official Website</a>` : ''}
    </div>

    <div class="modal-stats-row">
      <div class="m-stat"><div class="m-stat-val">${fmt(t.stars)}</div><div class="m-stat-lbl">Stars</div></div>
      ${t.forks ? `<div class="m-stat"><div class="m-stat-val">${fmt(t.forks)}</div><div class="m-stat-lbl">Forks</div></div>` : `<div class="m-stat"><div class="m-stat-val">${t.trending_score||'-'}</div><div class="m-stat-lbl">Trend Score</div></div>`}
      <div class="m-stat"><div class="m-stat-val">${t.license||'-'}</div><div class="m-stat-lbl">License</div></div>
    </div>
    ${t.last_push ? `<div style="font-size:11px;color:var(--text-3);margin-bottom:20px">Last updated: ${timeAgo(t.last_push)} ${t.pricing ? ' &middot; ' + t.pricing : ''}</div>` : (t.pricing ? `<div style="font-size:11px;color:var(--green);margin-bottom:20px">${t.pricing}</div>` : '')}

    ${t.key_features ? `
    <div class="m-section">
      <h3 class="m-section-title">Key Features</h3>
      <ul class="feature-grid">${t.key_features.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>` : ''}

    ${article ? `
    <div class="m-section">
      <h3 class="m-section-title">Deep Dive</h3>
      <div class="article-meta">
        <span class="article-meta-item">${I.clock} ${article.read_time} min read</span>
        <span class="article-meta-item">${(article.tags||[]).map(g => '#'+g).join(' ')}</span>
      </div>
      <div class="article-body">${md(article.content)}</div>
    </div>
    ` : ''}

    ${t.install_guide ? `
    <div class="m-section">
      <h3 class="m-section-title">Quick Start</h3>
      <div class="code-block"><pre>${highlight(t.install_guide)}</pre></div>
    </div>` : ''}

    ${relatedBenches.length ? `
    <div class="m-section">
      <h3 class="m-section-title">Related Benchmarks</h3>
      ${relatedBenches.map(renderMiniLeaderboard).join('')}
    </div>` : ''}
  `;

  bd.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---- Search ---- */
let timer;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(timer);
  timer = setTimeout(() => { query = e.target.value.trim(); syncURL(); renderTools(); }, 180);
});

/* ---- Sort ---- */
document.getElementById('sortSelect').addEventListener('change', e => {
  sortBy = e.target.value;
  syncURL();
  renderTools();
});

/* ---- GitHub Daily/Weekly toggle ---- */
document.getElementById('ghDaily').addEventListener('click', () => {
  ghPeriod = 'daily';
  document.getElementById('ghDaily').classList.add('active');
  document.getElementById('ghWeekly').classList.remove('active');
  renderGH();
});
document.getElementById('ghWeekly').addEventListener('click', () => {
  ghPeriod = 'weekly';
  document.getElementById('ghWeekly').classList.add('active');
  document.getElementById('ghDaily').classList.remove('active');
  renderGH();
});

/* ======== INTERACTIVE EFFECTS ======== */

/* Cursor Spotlight */
const glow = document.getElementById('cursorGlow');
let glowVisible = false;
document.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
  if (!glowVisible) { glow.classList.add('visible'); glowVisible = true; }
});
document.addEventListener('mouseleave', () => {
  glow.classList.remove('visible'); glowVisible = false;
});

/* Card 3D Tilt */
document.addEventListener('mousemove', e => {
  const card = e.target.closest('.tool-card');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  card.style.setProperty('--rx', (y * -4) + 'deg');
  card.style.setProperty('--ry', (x * 4) + 'deg');
});
document.addEventListener('mouseout', e => {
  const card = e.target.closest('.tool-card');
  if (card && !card.contains(e.relatedTarget)) {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }
});

/* Animated Stat Counters */
function animateCounters() {
  document.querySelectorAll('.stat-number').forEach(el => {
    const target = el.textContent;
    if (!target || target === '-') return;
    el.classList.add('counting');
    setTimeout(() => el.classList.remove('counting'), 500);
  });
}

/* Magnetic Buttons */
document.addEventListener('mousemove', e => {
  const btn = e.target.closest('.tab, .feed-btn, .topic-pill');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;
  btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
});
document.addEventListener('mouseout', e => {
  const btn = e.target.closest('.tab, .feed-btn, .topic-pill');
  if (btn) btn.style.transform = '';
});

/* ---- Boot ---- */
boot().then(() => {
  setTimeout(animateCounters, 300);
});

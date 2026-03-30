// =============================================
// AI Agent Trends — App Controller v2
// =============================================

const BASE = 'data';
let toolsData = null;
let ghTrending = null;
let hfTrending = null;
let benchData = null;
let articlesData = null;
let activeCat = 'all';
let activeBench = 0;
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

/* ---- Simple Markdown to HTML ---- */
function md(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/^(?!<[hup]|<li|<ul)/gm, '<p>')
    .replace(/\n/g, '<br>');
}

/* ---- Data Loading ---- */
async function boot() {
  const [t, g, h, b, a] = await Promise.allSettled([
    fetch(`${BASE}/tools.json`).then(r => r.json()),
    fetch(`${BASE}/github_trending.json`).then(r => r.json()),
    fetch(`${BASE}/hf_trending.json`).then(r => r.json()),
    fetch(`${BASE}/benchmarks.json`).then(r => r.json()),
    fetch(`${BASE}/articles.json`).then(r => r.json()),
  ]);
  if (t.status === 'fulfilled') toolsData = t.value;
  if (g.status === 'fulfilled') ghTrending = g.value;
  if (h.status === 'fulfilled') hfTrending = h.value;
  if (b.status === 'fulfilled') benchData = b.value;
  if (a.status === 'fulfilled') articlesData = a.value;
  render();
}

/* ---- Render All ---- */
function render() {
  renderUpdated();
  renderTabs();
  renderStats();
  renderTools();
  renderBenchmarks();
  renderGH();
  renderHF();
}

function renderUpdated() {
  const el = document.getElementById('lastUpdated');
  if (toolsData?.last_updated) {
    el.innerHTML = `<span class="live-dot"></span> Updated ${timeAgo(toolsData.last_updated)}`;
  }
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
    renderTools();
  });
}

function renderStats() {
  if (!toolsData?.tools) return;
  document.getElementById('totalTools').textContent = toolsData.tools.length;
  document.getElementById('totalStars').textContent = fmt(
    toolsData.tools.reduce((s, t) => s + (t.stars || 0), 0)
  );
  document.getElementById('totalCategories').textContent = toolsData.categories?.length || 0;
  document.getElementById('trendingCount').textContent = ghTrending?.ai_trending?.length || 0;
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
  list.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));

  if (!list.length) {
    grid.innerHTML = `<div class="no-results"><h3>No results</h3><p>Try a different keyword or category.</p></div>`;
    return;
  }

  const cats = {};
  (toolsData.categories || []).forEach(c => cats[c.id] = c);

  // Check which tools have articles
  const articleIds = new Set((articlesData?.articles || []).map(a => a.tool_id));

  grid.innerHTML = list.map(t => {
    const c = cats[t.category] || {};
    const hasArticle = articleIds.has(t.id);
    return `
    <div class="tool-card" data-id="${t.id}">
      <div class="card-top">
        <span class="card-cat cat-${t.category}">${c.icon || ''} ${c.name_en || t.category}</span>
        <span class="card-score ${sClass(t.trending_score||0)}">${t.trending_score||0}</span>
      </div>
      <div class="card-name">${t.name} ${hasArticle ? '<span style="font-size:12px;color:var(--accent-l);margin-left:4px" title="Deep Dive article available">' + I.article + '</span>' : ''}</div>
      <div class="card-desc">${t.description}</div>
      <div class="card-meta">
        ${t.stars ? `<span class="meta-item stars-item">${I.star} ${fmt(t.stars)}</span>` : ''}
        ${t.github_url ? `<span class="meta-item">${I.gh} GitHub</span>` : ''}
        ${t.website ? `<span class="meta-item">${I.link} Web</span>` : ''}
        ${t.license ? `<span class="meta-item">${t.license}</span>` : ''}
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

/* ---- Benchmarks ---- */
function renderBenchmarks() {
  if (!benchData?.benchmarks?.length) {
    document.getElementById('benchContent').innerHTML =
      '<div class="placeholder-loader small"><p style="font-size:12px;color:var(--text-3)">No benchmark data available</p></div>';
    return;
  }

  const tabs = document.getElementById('benchTabs');
  tabs.innerHTML = benchData.benchmarks.map((b, i) =>
    `<button class="bench-tab ${i === 0 ? 'active' : ''}" data-idx="${i}">${b.name}</button>`
  ).join('');

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.bench-tab');
    if (!btn) return;
    tabs.querySelectorAll('.bench-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeBench = parseInt(btn.dataset.idx);
    renderBenchTable();
  });

  renderBenchTable();
}

function renderBenchTable() {
  const b = benchData.benchmarks[activeBench];
  if (!b) return;
  const wrap = document.getElementById('benchContent');

  wrap.innerHTML = `
    <div class="bench-info">
      <div>
        <div class="bench-name">${b.name}</div>
        <div class="bench-desc">${b.description}</div>
      </div>
      <a class="bench-source" href="${b.source_url}" target="_blank" rel="noopener">Source &rarr;</a>
    </div>
    <table class="bench-table">
      <thead>
        <tr><th>#</th><th>Model / Agent</th><th>Score</th><th>Organization</th></tr>
      </thead>
      <tbody>
        ${b.entries.map(e => `
          <tr>
            <td class="rank-cell ${e.rank <= 3 ? 'top' : ''}">${e.rank}</td>
            <td><strong>${e.name}</strong></td>
            <td class="score-cell">${e.score}${e.unit === '%' ? '%' : ' ' + e.unit}</td>
            <td class="org-cell">${e.org}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ---- GitHub Trending ---- */
function renderGH() {
  const el = document.getElementById('githubTrending');
  const repos = ghTrending?.ai_trending || [];
  if (!repos.length) {
    el.innerHTML = `<div class="placeholder-loader small"><p style="font-size:12px;color:var(--text-3)">Run <code>python crawler/fetch_trends.py</code> to load live data</p></div>`;
    return;
  }
  el.innerHTML = repos.slice(0, 15).map((r, i) => `
    <a class="feed-item" href="${r.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${r.full_name}</div>
        <div class="feed-desc">${r.description || ''}</div>
      </div>
      <span class="feed-stat">${I.star} ${fmt(r.stars)}</span>
    </a>
  `).join('');
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
      <div class="m-stat"><div class="m-stat-val">${t.trending_score||'-'}</div><div class="m-stat-lbl">Trend Score</div></div>
      <div class="m-stat"><div class="m-stat-val">${t.license||'-'}</div><div class="m-stat-lbl">License</div></div>
    </div>

    ${article ? `
    <div class="m-section">
      <h3 class="m-section-title">Deep Dive</h3>
      <div class="article-meta">
        <span class="article-meta-item">${I.article} ${article.title}</span>
        <span class="article-meta-item">${I.clock} ${article.read_time} min read</span>
      </div>
      <div class="article-body" id="articleBody">${md(article.content)}</div>
    </div>
    ` : ''}

    ${t.key_features ? `
    <div class="m-section">
      <h3 class="m-section-title">Key Features</h3>
      <ul class="feature-grid">${t.key_features.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>` : ''}

    ${t.install_guide ? `
    <div class="m-section">
      <h3 class="m-section-title">Installation & Usage Guide</h3>
      <div class="code-block"><pre>${highlight(t.install_guide)}</pre></div>
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
  timer = setTimeout(() => { query = e.target.value.trim(); renderTools(); }, 180);
});

/* ---- Boot ---- */
boot();

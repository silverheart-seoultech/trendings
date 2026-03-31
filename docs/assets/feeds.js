// =============================================
// AI Agent Trends — Feeds Page Controller
// =============================================

const BASE = 'data';
let ghData = null, hfData = null, gnData = null, rssData = null;
let ghPeriod = 'daily';
let activeTab = new URLSearchParams(location.search).get('tab') || 'all';

const I = {
  star: `<svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>`,
  heart: `<svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="m8 14.25-.345-.666C3.457 8.322 1.5 6.45 1.5 4.414 1.5 2.756 2.756 1.5 4.414 1.5 5.368 1.5 6.283 1.95 7 2.673V2.67C7.717 1.95 8.632 1.5 9.586 1.5c1.658 0 2.914 1.256 2.914 2.914 0 2.036-1.957 3.908-6.155 9.17z"/></svg>`,
  dl: `<svg viewBox="0 0 16 16" fill="currentColor" style="width:12px;height:12px"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14zM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06z"/></svg>`,
};

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
  return Math.floor(d / 86400) + 'd ago';
}

async function boot() {
  const [g, h, gn, rss] = await Promise.allSettled([
    fetch(`${BASE}/github_trending.json`).then(r => r.json()),
    fetch(`${BASE}/hf_trending.json`).then(r => r.json()),
    fetch(`${BASE}/geeknews.json`).then(r => r.json()),
    fetch(`${BASE}/rss_feeds.json`).then(r => r.json()),
  ]);
  if (g.status === 'fulfilled') ghData = g.value;
  if (h.status === 'fulfilled') hfData = h.value;
  if (gn.status === 'fulfilled') gnData = gn.value;
  if (rss.status === 'fulfilled') rssData = rss.value;

  const up = document.getElementById('lastUpdated');
  if (ghData?.last_updated) up.innerHTML = `<span class="live-dot"></span> ${timeAgo(ghData.last_updated)}`;

  render();
}

function render() {
  renderGH();
  renderHF();
  renderGN();
  renderRSS('news', 'fpNews');
  renderRSS('research', 'fpResearch');
  renderRSS('launches', 'fpLaunches');

  // Set active tab from URL
  document.querySelectorAll('#feedTabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.feed === activeTab);
  });
  applyFilter();
}

function renderGH() {
  const el = document.getElementById('fpGithub');
  const repos = ghPeriod === 'daily' ? (ghData?.ai_daily || []) : (ghData?.ai_trending || []);
  if (!repos.length) { el.innerHTML = '<p style="color:var(--text-3);padding:20px">No data</p>'; return; }
  el.innerHTML = repos.map((r, i) => `
    <a class="feed-item" href="${r.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${r.full_name}</div>
        <div class="feed-desc">${r.description || ''}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <span class="feed-stat">${I.star} ${fmt(r.stars)}</span>
        ${r.trending_stars ? `<div style="font-size:10px;color:var(--orange);margin-top:2px">${r.trending_stars}</div>` : ''}
      </div>
    </a>
  `).join('');
}

function renderHF() {
  const el = document.getElementById('fpHF');
  const models = hfData?.trending_models || [];
  if (!models.length) { el.innerHTML = '<p style="color:var(--text-3);padding:20px">No data</p>'; return; }
  el.innerHTML = models.map((m, i) => `
    <a class="feed-item" href="${m.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${m.id}</div>
        <div class="feed-desc">${m.pipeline_tag || ''}</div>
      </div>
      <span class="feed-stat">${I.heart} ${fmt(m.likes)} &ensp; ${I.dl} ${fmt(m.downloads)}</span>
    </a>
  `).join('');
}

function renderGN() {
  const el = document.getElementById('fpGeekNews');
  const posts = gnData?.posts || [];
  if (!posts.length) { el.innerHTML = '<p style="color:var(--text-3);padding:20px">No data</p>'; return; }
  el.innerHTML = posts.map((p, i) => `
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

function renderRSS(category, elId) {
  const el = document.getElementById(elId);
  const entries = rssData?.by_category?.[category] || [];
  if (!entries.length) { el.innerHTML = '<p style="color:var(--text-3);padding:20px">No data yet. RSS feeds update hourly.</p>'; return; }
  el.innerHTML = entries.map((e, i) => `
    <a class="feed-item" href="${e.url}" target="_blank" rel="noopener">
      <span class="feed-rank ${i < 3 ? 'gold' : ''}">${i + 1}</span>
      <div class="feed-info">
        <div class="feed-name">${e.is_new ? '<span style="color:var(--green);font-size:9px;margin-right:4px">NEW</span>' : ''}${e.title}</div>
        <div class="feed-desc">${e.source_icon} ${e.source_name}${e.published ? ' · ' + timeAgo(e.published) : ''}</div>
      </div>
      ${e.points ? `<span class="feed-stat" style="color:var(--orange)">${e.points}pts</span>` : ''}
      ${e.likes ? `<span class="feed-stat">${I.heart} ${e.likes}</span>` : ''}
    </a>
  `).join('');
}

function applyFilter() {
  const sections = {
    github: 'sec-github', hf: 'sec-hf', geeknews: 'sec-geeknews',
    news: 'sec-news', research: 'sec-research', launches: 'sec-launches'
  };
  Object.entries(sections).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (activeTab === 'all' || activeTab === key) ? '' : 'none';
  });
}

// Events
document.getElementById('feedTabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('#feedTabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeTab = btn.dataset.feed;
  applyFilter();
});

document.getElementById('fpGhDaily').addEventListener('click', () => {
  ghPeriod = 'daily';
  document.getElementById('fpGhDaily').classList.add('active');
  document.getElementById('fpGhWeekly').classList.remove('active');
  renderGH();
});
document.getElementById('fpGhWeekly').addEventListener('click', () => {
  ghPeriod = 'weekly';
  document.getElementById('fpGhWeekly').classList.add('active');
  document.getElementById('fpGhDaily').classList.remove('active');
  renderGH();
});

boot();

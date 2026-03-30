// ============================================
// AI Agent Trends - Main Application
// ============================================

const DATA_BASE = '../data';
let toolsData = null;
let githubTrending = null;
let hfTrending = null;
let activeCategory = 'all';
let searchQuery = '';

// ---- SVG Icons ----
const ICONS = {
  star: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>',
  github: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  link: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 11.5L4 14a2.12 2.12 0 0 1-3-3l2.5-2.5M9.5 4.5L12 2a2.12 2.12 0 0 1 3 3l-2.5 2.5M6 10l4-4"/></svg>',
  download: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14zM7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06z"/></svg>',
  heart: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M7.655 14.916v-.001l-.091-.037a14 14 0 0 1-2.002-1.05 12.1 12.1 0 0 1-2.56-2.05C1.356 10.048.5 8.092.5 5.836c0-3.386 2.566-4.586 4.39-4.586 1.18 0 2.26.522 3.11 1.39.85-.868 1.93-1.39 3.11-1.39 1.824 0 4.39 1.2 4.39 4.586 0 2.256-.856 4.212-2.502 5.942a12.1 12.1 0 0 1-2.56 2.05 14 14 0 0 1-2.093 1.087l-.091.037h-.001a.75.75 0 0 1-.608 0"/></svg>',
};

// ---- Format Numbers ----
function formatNumber(num) {
  if (!num && num !== 0) return '-';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 30) return `${days}일 전`;
  return date.toLocaleDateString('ko-KR');
}

// ---- Score class ----
function scoreClass(score) {
  if (score >= 85) return 'score-high';
  if (score >= 70) return 'score-mid';
  return 'score-low';
}

// ---- Load Data ----
async function loadData() {
  try {
    const [toolsResp, ghResp, hfResp] = await Promise.allSettled([
      fetch(`${DATA_BASE}/tools.json`),
      fetch(`${DATA_BASE}/github_trending.json`),
      fetch(`${DATA_BASE}/hf_trending.json`),
    ]);

    if (toolsResp.status === 'fulfilled' && toolsResp.value.ok) {
      toolsData = await toolsResp.value.json();
    }
    if (ghResp.status === 'fulfilled' && ghResp.value.ok) {
      githubTrending = await ghResp.value.json();
    }
    if (hfResp.status === 'fulfilled' && hfResp.value.ok) {
      hfTrending = await hfResp.value.json();
    }

    renderAll();
  } catch (err) {
    console.error('Failed to load data:', err);
    document.getElementById('toolsGrid').innerHTML =
      '<div class="no-results"><h3>데이터를 불러올 수 없습니다</h3><p>data/ 폴더의 JSON 파일을 확인해주세요.</p></div>';
  }
}

// ---- Render All ----
function renderAll() {
  renderLastUpdated();
  renderCategoryTabs();
  renderStats();
  renderTools();
  renderGithubTrending();
  renderHfTrending();
}

// ---- Last Updated ----
function renderLastUpdated() {
  const el = document.getElementById('lastUpdated');
  if (toolsData?.last_updated) {
    el.textContent = `최종 업데이트: ${formatDate(toolsData.last_updated)}`;
  }
}

// ---- Category Tabs ----
function renderCategoryTabs() {
  if (!toolsData?.categories) return;
  const tabs = document.getElementById('categoryTabs');
  tabs.innerHTML = '<button class="tab active" data-category="all">전체</button>';
  toolsData.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.dataset.category = cat.id;
    btn.textContent = `${cat.icon} ${cat.name}`;
    tabs.appendChild(btn);
  });

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderTools();
  });
}

// ---- Stats ----
function renderStats() {
  if (!toolsData?.tools) return;
  const tools = toolsData.tools;
  document.getElementById('totalTools').textContent = tools.length;
  const totalStars = tools.reduce((sum, t) => sum + (t.stars || 0), 0);
  document.getElementById('totalStars').textContent = formatNumber(totalStars);
  document.getElementById('totalCategories').textContent = toolsData.categories?.length || 0;

  const trendingCount = githubTrending?.ai_trending?.length || 0;
  document.getElementById('trendingCount').textContent = trendingCount;
}

// ---- Render Tools ----
function renderTools() {
  if (!toolsData?.tools) return;
  const grid = document.getElementById('toolsGrid');
  let tools = toolsData.tools;

  // Filter by category
  if (activeCategory !== 'all') {
    tools = tools.filter(t => t.category === activeCategory);
  }

  // Filter by search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    tools = tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort by trending score
  tools.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0));

  if (tools.length === 0) {
    grid.innerHTML = '<div class="no-results"><h3>검색 결과 없음</h3><p>다른 키워드나 카테고리를 시도해보세요.</p></div>';
    return;
  }

  const categoryMap = {};
  (toolsData.categories || []).forEach(c => { categoryMap[c.id] = c; });

  grid.innerHTML = tools.map(tool => {
    const cat = categoryMap[tool.category] || {};
    const catClass = `cat-${tool.category}`;
    return `
      <div class="tool-card" data-tool-id="${tool.id}">
        <span class="tool-category-badge ${catClass}">${cat.icon || ''} ${cat.name || tool.category}</span>
        <div class="tool-card-header">
          <div class="tool-name">${tool.name}</div>
          <span class="tool-score ${scoreClass(tool.trending_score || 0)}">
            ${tool.trending_score || 0}
          </span>
        </div>
        <div class="tool-desc">${tool.description}</div>
        <div class="tool-meta">
          ${tool.stars ? `<span class="tool-meta-item">${ICONS.star} ${formatNumber(tool.stars)}</span>` : ''}
          ${tool.github_url ? `<span class="tool-meta-item">${ICONS.github} GitHub</span>` : ''}
          ${tool.website ? `<span class="tool-meta-item">${ICONS.link} Website</span>` : ''}
          ${tool.license ? `<span class="tool-meta-item">${tool.license}</span>` : ''}
        </div>
        <div class="tool-tags">
          ${(tool.tags || []).map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  grid.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.dataset.toolId;
      const tool = toolsData.tools.find(t => t.id === toolId);
      if (tool) openModal(tool);
    });
  });
}

// ---- Render GitHub Trending ----
function renderGithubTrending() {
  const container = document.getElementById('githubTrending');
  const repos = githubTrending?.ai_trending || [];

  if (repos.length === 0) {
    container.innerHTML = '<div class="loading">크롤러를 실행하면 실시간 트렌딩 데이터가 표시됩니다.<br><code>python crawler/fetch_trends.py</code></div>';
    return;
  }

  container.innerHTML = repos.slice(0, 12).map((repo, i) => `
    <a class="trending-item" href="${repo.url}" target="_blank" rel="noopener">
      <span class="trending-rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
      <div class="trending-info">
        <div class="trending-name">${repo.full_name}</div>
        <div class="trending-desc">${repo.description || ''}</div>
      </div>
      <span class="trending-stars">${ICONS.star} ${formatNumber(repo.stars)}</span>
    </a>
  `).join('');
}

// ---- Render HuggingFace Trending ----
function renderHfTrending() {
  const container = document.getElementById('hfTrending');
  const models = hfTrending?.trending_models || [];

  if (models.length === 0) {
    container.innerHTML = '<div class="loading">크롤러를 실행하면 HuggingFace 트렌딩 데이터가 표시됩니다.<br><code>python crawler/fetch_trends.py</code></div>';
    return;
  }

  container.innerHTML = models.slice(0, 12).map((model, i) => `
    <a class="trending-item" href="${model.url}" target="_blank" rel="noopener">
      <span class="trending-rank ${i < 3 ? 'top3' : ''}">${i + 1}</span>
      <div class="trending-info">
        <div class="trending-name">${model.id}</div>
        <div class="trending-desc">${model.pipeline_tag || 'N/A'}</div>
      </div>
      <span class="trending-stars">${ICONS.heart} ${formatNumber(model.likes)} &nbsp; ${ICONS.download} ${formatNumber(model.downloads)}</span>
    </a>
  `).join('');
}

// ---- Modal ----
function openModal(tool) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const categoryMap = {};
  (toolsData.categories || []).forEach(c => { categoryMap[c.id] = c; });
  const cat = categoryMap[tool.category] || {};

  content.innerHTML = `
    <div class="modal-header">
      <span class="tool-category-badge cat-${tool.category}">${cat.icon || ''} ${cat.name || ''}</span>
      <h2 class="modal-title">${tool.name}</h2>
      <p class="modal-desc">${tool.description}</p>
    </div>

    <div class="modal-links">
      ${tool.github_url ? `<a class="modal-link github" href="${tool.github_url}" target="_blank" rel="noopener">${ICONS.github} GitHub Repository</a>` : ''}
      ${tool.website ? `<a class="modal-link website" href="${tool.website}" target="_blank" rel="noopener">${ICONS.link} 공식 웹사이트</a>` : ''}
    </div>

    <div class="modal-stats">
      <div class="modal-stat">
        <div class="modal-stat-value">${formatNumber(tool.stars)}</div>
        <div class="modal-stat-label">GitHub Stars</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-value">${tool.trending_score || '-'}</div>
        <div class="modal-stat-label">Trending Score</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-value">${tool.license || '-'}</div>
        <div class="modal-stat-label">License</div>
      </div>
    </div>

    ${tool.key_features ? `
    <div class="modal-section">
      <h3 class="modal-section-title">주요 기능</h3>
      <ul class="feature-list">
        ${tool.key_features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${tool.install_guide ? `
    <div class="modal-section">
      <h3 class="modal-section-title">설치 및 사용 가이드</h3>
      <div class="install-guide">
        <pre>${escapeHtml(tool.install_guide)}</pre>
      </div>
    </div>
    ` : ''}
  `;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Event Listeners ----
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Search
let searchTimeout;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery = e.target.value.trim();
    renderTools();
  }, 200);
});

// ---- Init ----
loadData();

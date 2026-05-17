const API_BASE = 'http://localhost:8000/api';

// ── App State ───────────────────────────────────────────────
let currentFile = null;
let browsePage = 1;
let browseSearch = '';
let isIngesting = false;
let isChatting = false;

// ── Chart setup script inclusion ──
const loadChartJs = () => {
  return new Promise((resolve, reject) => {
    if (window.Chart) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// ── Initialization ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadChartJs();
  checkHealth();
  updateStrategyInfo();
});

// ── Health & Setup ──────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const pill = document.getElementById('statusPill');
    const text = document.getElementById('statusText');
    if (data.status === 'ok') {
      pill.classList.add('connected');
      text.textContent = 'Backend Connected';
      if (!data.groq_ready) {
        showApiKeyModal();
      }
    }
  } catch (err) {
    document.getElementById('statusText').textContent = 'Backend Offline';
    console.error('Health check failed', err);
  }
}

// ── Tab Navigation ──────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`view-${tabId}`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');

  if (tabId === 'browse') loadBrowse();
}

// ── API Key Modal ───────────────────────────────────────────
function showApiKeyModal() { document.getElementById('apiModal').style.display = 'flex'; }
function hideApiModal() { document.getElementById('apiModal').style.display = 'none'; document.getElementById('apiKeyStatus').textContent=''; }

async function saveApiKey() {
  const key = document.getElementById('apiKeyInput').value.trim();
  const status = document.getElementById('apiKeyStatus');
  if (!key) { status.textContent = 'Please enter a key.'; status.className = 'api-status error'; return; }
  
  status.textContent = 'Verifying...'; status.className = 'api-status';
  try {
    const res = await fetch(`${API_BASE}/set-api-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key })
    });
    if (res.ok) {
      status.textContent = 'Key saved successfully!'; status.className = 'api-status success';
      setTimeout(hideApiModal, 1000);
    } else {
      status.textContent = 'Failed to set key.'; status.className = 'api-status error';
    }
  } catch (err) {
    status.textContent = 'Error connecting to backend.'; status.className = 'api-status error';
  }
}

// ── TAB 1: Ingestion ────────────────────────────────────────
function updateStrategyInfo() {
  const val = document.getElementById('chunkStrategy').value;
  const info = document.getElementById('strategyInfo');
  if (val === 'fixed') info.innerHTML = '<strong>Fixed-Size:</strong> Splits text every N words with M-word overlap. Fast and predictable.';
  else info.innerHTML = '<strong>Sentence-Aware:</strong> Splits on sentence boundaries (.). Keeps context intact better than fixed slicing.';
}

function handleDrop(e) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    setFile(e.dataTransfer.files[0]);
  }
}
function handleFileSelect(e) {
  if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
}

function setFile(file) {
  currentFile = file;
  const badge = document.getElementById('fileName');
  badge.textContent = file.name;
  badge.style.display = 'inline-block';
  document.getElementById('ingestBtn').disabled = false;
}

async function startIngestion() {
  if (!currentFile || isIngesting) return;
  isIngesting = true;
  const btn = document.getElementById('ingestBtn');
  const progCard = document.getElementById('progressCard');
  const progBar = document.getElementById('progressBar');
  
  btn.disabled = true;
  btn.innerHTML = `<span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span> Ingesting...`;
  progCard.style.display = 'block';
  progBar.style.width = '30%';

  const formData = new FormData();
  formData.append('file', currentFile);
  formData.append('chunk_size', document.getElementById('chunkSize').value);
  formData.append('chunk_overlap', document.getElementById('chunkOverlap').value);
  formData.append('chunking_strategy', document.getElementById('chunkStrategy').value);
  formData.append('reset_collection', document.getElementById('resetCollection').checked);

  try {
    const res = await fetch(`${API_BASE}/ingest`, {
      method: 'POST',
      body: formData
    });
    progBar.style.width = '70%';
    const data = await res.json();
    
    if (res.ok) {
      progBar.style.width = '100%';
      setTimeout(() => { progCard.style.display = 'none'; showIngestionResults(data); }, 500);
    } else {
      alert(`Ingestion failed: ${data.detail || 'Unknown error'}`);
      progCard.style.display = 'none';
      btn.disabled = false;
      btn.innerHTML = `Ingest into Vector Store`;
    }
  } catch (err) {
    alert(`Connection error: ${err.message}`);
    progCard.style.display = 'none';
  } finally {
    isIngesting = false;
    btn.disabled = false;
    btn.innerHTML = `Ingest into Vector Store`;
  }
}

let chunkDataCache = [];

function showIngestionResults(data) {
  document.getElementById('preIngestionState').style.display = 'none';
  const resultsDiv = document.getElementById('ingestionResults');
  resultsDiv.style.display = 'block';
  chunkDataCache = data.chunk_preview || [];

  const st = data.stats;
  
  // Stats Grid
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><span class="stat-label">Total Rows</span><span class="stat-val">${st.total_rows}</span></div>
    <div class="stat-card"><span class="stat-label">Total Chunks</span><span class="stat-val">${st.total_chunks}</span></div>
    <div class="stat-card"><span class="stat-label">Avg Tokens/Chunk</span><span class="stat-val">${st.avg_tokens_per_chunk}</span></div>
    <div class="stat-card"><span class="stat-label">Ingest Time</span><span class="stat-val">${st.total_time_sec}s</span></div>
  `;

  // Pipeline Flow
  document.getElementById('pipelineFlow').innerHTML = `
    <div class="pipe-node">
      <b>1. Document Parse</b>
      <span>${st.filename}</span>
      <span>${st.total_rows} rows</span>
    </div>
    <div class="pipe-arr">→</div>
    <div class="pipe-node">
      <b>2. Text Chunking</b>
      <span>${st.chunking_strategy} strategy</span>
      <span>${st.total_chunks} chunks gen.</span>
    </div>
    <div class="pipe-arr">→</div>
    <div class="pipe-node">
      <b>3. Vector Embeddings</b>
      <span>${st.embedding_model}</span>
      <span>${st.embed_time_sec}s compute</span>
    </div>
    <div class="pipe-arr">→</div>
    <div class="pipe-node">
      <b>4. Vector Store</b>
      <span>${st.vector_store}</span>
      <span>${st.upsert_time_sec}s upsert</span>
    </div>
  `;

  // Chart
  renderChart(chunkDataCache);

  // Chunks Preview
  renderChunksTable(chunkDataCache);
}

let chartInstance = null;
function renderChart(chunks) {
  const ctx = document.getElementById('chunkChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  const tokens = chunks.map(c => c.metadata.tokens);
  
  // bin data
  const bins = {};
  tokens.forEach(t => {
    const bin = Math.floor(t / 20) * 20;
    bins[bin] = (bins[bin] || 0) + 1;
  });
  
  const labels = Object.keys(bins).map(k => `${k}-${parseInt(k)+20} tkts`);
  const data = Object.values(bins);

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Chunks',
        data: data,
        backgroundColor: '#D97757',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#E7E5E4' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderChunksTable(chunks) {
  const list = document.getElementById('chunkList');
  list.innerHTML = chunks.map(c => `
    <div class="chunk-card">
      <div class="chunk-header">
        <span class="chunk-id">${c.id}</span>
        <div class="chunk-meta">
          <span>Row: ${c.metadata.row_index}</span>
          <span>Tokens: ${c.metadata.tokens}</span>
          <span>Strategy: ${c.metadata.strategy}</span>
        </div>
      </div>
      <div class="chunk-text">${escapeHTML(c.text)}</div>
    </div>
  `).join('');
}

function filterChunks() {
  const query = document.getElementById('chunkFilter').value.toLowerCase();
  const filtered = chunkDataCache.filter(c => 
    c.text.toLowerCase().includes(query) || 
    c.id.toLowerCase().includes(query)
  );
  renderChunksTable(filtered);
}

// ── TAB 2: Vector Browser ───────────────────────────────────
async function loadBrowse() {
  const pageSize = document.getElementById('browsePageSize').value;
  const search = document.getElementById('browseSearch').value;
  
  try {
    const res = await fetch(`${API_BASE}/browse-chunks?page=${browsePage}&page_size=${pageSize}&search=${encodeURIComponent(search)}`);
    const data = await res.json();
    
    document.getElementById('pageInfo').textContent = `Page ${data.page}`;
    
    // update collection info
    document.getElementById('collectionInfo').innerHTML = `
      <div class="info-item"><span>Vector Store</span><span>ChromaDB</span></div>
      <div class="info-item"><span>Total Chunks Indexed</span><span>${data.total}</span></div>
      <div class="info-item"><span>Distance Metric</span><span>Cosine</span></div>
      <div class="info-item"><span>Embedding Dim</span><span>384</span></div>
    `;

    const rb = document.getElementById('browseResults');
    if (data.chunks.length === 0) {
      rb.innerHTML = `<div class="empty-state">No chunks found in the database.</div>`;
    } else {
      rb.innerHTML = data.chunks.map(c => `
        <div class="chunk-card">
          <div class="chunk-header">
            <span class="chunk-id">${c.id}</span>
            <div class="chunk-meta">
              ${c.score ? `<span class="score-badge">Similarity: ${c.score}</span>` : ''}
              <span>Row: ${c.metadata.row_index}</span>
            </div>
          </div>
          <div class="chunk-text">${escapeHTML(c.text)}</div>
          <div style="font-size: 0.7rem; color: #A8A29E; margin-top: 8px; font-family: monospace;">
            Source: ${c.metadata.source_file || 'N/A'}
          </div>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

function changePage(dir) {
  browsePage += dir;
  if (browsePage < 1) browsePage = 1;
  loadBrowse();
}

document.getElementById('browseSearch').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { browsePage = 1; loadBrowse(); }
});

// ── TAB 3: RAG Chat ─────────────────────────────────────────
function clearChat() {
  document.getElementById('chatMessages').innerHTML = `
    <div class="message assistant">
      <div class="message-bubble">
        <p>👋 Hello! I'm your Advanced RAG Assistant powered by Groq.</p>
        <p>After you ingest your test cases, ask me anything — create new test cases for a Jira ID, find edge cases, summarize a feature's coverage, or explore your test repository.</p>
      </div>
    </div>
  `;
  document.getElementById('inspectorContent').innerHTML = `
    <div class="inspector-empty">
      <div class="empty-icon sm">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <p>Ask a question to see the full RAG pipeline trace here.</p>
    </div>
  `;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const query = input.value.trim();
  if (!query || isChatting) return;

  isChatting = true;
  input.value = '';
  document.getElementById('sendBtn').disabled = true;

  const chatArea = document.getElementById('chatMessages');
  
  // Add user message
  chatArea.innerHTML += `
    <div class="message user">
      <div class="message-bubble"><p>${escapeHTML(query)}</p></div>
    </div>
  `;

  // Add loading indicator
  const loadingId = 'loading-' + Date.now();
  chatArea.innerHTML += `
    <div class="message assistant" id="${loadingId}">
      <div class="message-bubble">
        <span class="typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></span>
      </div>
    </div>
  `;
  chatArea.scrollTop = chatArea.scrollHeight;

  const topK = parseInt(document.getElementById('topK').value) || 10;
  const rerankK = parseInt(document.getElementById('rerankK').value) || 5;
  const model = document.getElementById('groqModel').value;

  try {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK, rerank_top_k: rerankK, groq_model: model })
    });
    
    document.getElementById(loadingId).remove();
    const data = await res.json();

    if (res.ok) {
      // Add assistant response
      // Simple markdown conversion for display
      const formattedAnswer = data.answer
        .replace(/### (.*)/g, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/\n\n/g, '</p><p>');
        
      chatArea.innerHTML += `
        <div class="message assistant">
          <div class="message-bubble markdown-body"><p>${formattedAnswer}</p></div>
        </div>
      `;
      
      updateInspector(data);
    } else {
      chatArea.innerHTML += `
        <div class="message assistant">
          <div class="message-bubble" style="color:#EF4444;"><p>Error: ${data.detail}</p></div>
        </div>
      `;
    }
  } catch (err) {
    document.getElementById(loadingId)?.remove();
    chatArea.innerHTML += `
      <div class="message assistant">
        <div class="message-bubble" style="color:#EF4444;"><p>Connection failed.</p></div>
      </div>
    `;
  } finally {
    isChatting = false;
    document.getElementById('sendBtn').disabled = false;
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

function updateInspector(data) {
  const p = data.pipeline;
  const ret = data.retrieval;
  
  const chunksHtml = data.reranked_chunks.map(c => `
    <div class="chunk-mini">
      <div class="chunk-mini-head">
        <span style="font-family:monospace; color:#A8A29E">Rank #${c.reranked_rank}</span>
        <span class="score-badge">Score: ${c.rerank_score.toFixed(4)}</span>
      </div>
      <div class="chunk-text" style="font-size:0.75rem;">${escapeHTML(c.text.substring(0, 150))}...</div>
    </div>
  `).join('');

  document.getElementById('inspectorContent').innerHTML = `
    <div class="insp-step">
      <div class="insp-step-head">
        <div class="insp-step-title">1. Query Embedding</div>
        <div class="insp-time">${p.embed_time_ms}ms</div>
      </div>
      <div class="insp-data">Model: all-MiniLM-L6-v2<br>Result: 384-dimensional dense vector</div>
    </div>

    <div class="insp-step">
      <div class="insp-step-head">
        <div class="insp-step-title">2. Initial Retrieval (ChromaDB)</div>
        <div class="insp-time">${p.retrieve_time_ms}ms</div>
      </div>
      <div class="insp-data">Strategy: ${ret.retrieval_strategy}<br>Requested Top-K: ${ret.top_k_requested}<br>Retrieved: ${ret.chunks_retrieved} chunks</div>
    </div>

    <div class="insp-step">
      <div class="insp-step-head">
        <div class="insp-step-title">3. Cross-Encoder Re-ranking</div>
        <div class="insp-time">${p.rerank_time_ms}ms</div>
      </div>
      <div class="insp-data" style="margin-bottom:12px;">Strategy: ${ret.rerank_strategy}<br>Selected Top: ${ret.chunks_after_rerank} chunks for Context</div>
      ${chunksHtml}
    </div>

    <div class="insp-step">
      <div class="insp-step-head">
        <div class="insp-step-title">4. Groq LLM Generation</div>
        <div class="insp-time">${p.llm_time_ms}ms</div>
      </div>
      <div class="insp-data">Model: ${data.llm.model}<br>Prompt Tokens: ${data.llm.prompt_tokens}<br>Completion Tokens: ${data.llm.completion_tokens}<br>Total Tokens: ${data.llm.total_tokens}</div>
    </div>
    
    <div style="text-align:right; font-size:0.75rem; color:#A8A29E; font-weight:600;">
      Total Pipeline Time: ${p.total_time_ms}ms
    </div>
  `;
}

// ── Utils ───────────────────────────────────────────────────
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
  );
}

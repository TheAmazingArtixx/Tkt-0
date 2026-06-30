// ===== Aston News — Admin CMS =====

// ---- Utilitaires ----
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
function formatDate(iso) {
  try {
    return new Date(iso.replace(' ', 'T') + 'Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}
function showToast(msg, duration = 3000) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, duration);
}
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = !msg;
}

// ---- Auth ----
async function checkSession() {
  const res = await fetch('/api/session');
  const data = await res.json();
  return data.authenticated === true;
}

async function login() {
  const pw = document.getElementById('password').value;
  showError('login-error', '');
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Connexion…';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    if (data.ok) {
      showLoginView(false);
      showAdminView(true);
      await loadAll();
    } else {
      showError('login-error', data.error || 'Mot de passe incorrect.');
    }
  } catch {
    showError('login-error', 'Erreur réseau. Réessaie.');
  }
  btn.disabled = false;
  btn.textContent = 'Se connecter';
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  showAdminView(false);
  showLoginView(true);
}

function showLoginView(show) {
  document.getElementById('login-view').hidden = !show;
}
function showAdminView(show) {
  document.getElementById('admin-view').hidden = !show;
}

// ---- Onglets ----
function setupTabs() {
  document.querySelectorAll('.admin-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById('tab-articles').hidden = tab !== 'articles';
      document.getElementById('tab-settings').hidden = tab !== 'settings';
    });
  });
}

// ---- Liste des articles ----
let articlesList = [];

async function loadArticles() {
  const list = document.getElementById('article-list');
  list.innerHTML = '<p style="color:var(--ink-muted)">Chargement…</p>';
  const res = await fetch('/api/articles');
  const data = await res.json();
  articlesList = data.articles || [];
  if (!articlesList.length) {
    list.innerHTML = '<p class="empty-state">Aucun article. Crée-en un !</p>';
    return;
  }
  list.innerHTML = articlesList.map(a => `
    <div class="article-list-row" id="row-${a.id}">
      <div class="info">
        <strong>${escapeHtml(a.title)}</strong>
        <span>${formatDate(a.published_at)}</span>
      </div>
      <div class="actions">
        <button class="btn secondary" onclick="editArticle(${a.id})">Modifier</button>
        <button class="btn danger" onclick="deleteArticle(${a.id})">Supprimer</button>
      </div>
    </div>
  `).join('');
}

async function deleteArticle(id) {
  if (!confirm('Supprimer cet article ? Cette action est irréversible.')) return;
  const res = await fetch('/api/articles/' + id, { method: 'DELETE' });
  const data = await res.json();
  if (data.ok) {
    showToast('Article supprimé.');
    await loadArticles();
  } else {
    showToast('Erreur : ' + (data.error || 'impossible de supprimer.'));
  }
}

// ---- Éditeur de blocs ----
let editingId = null;
let blocks = [];

function openEditor(article = null) {
  editingId = article ? article.id : null;
  blocks = article ? parseBlocks(article.content) : [];
  document.getElementById('art-title').value = article ? article.title : '';
  document.getElementById('art-excerpt').value = article ? (article.excerpt || '') : '';
  document.getElementById('editor-title').textContent = article ? 'Modifier l\'article' : 'Nouvel article';
  document.getElementById('cover-preview').innerHTML = article && article.cover_image
    ? `<img src="${article.cover_image}" style="max-height:120px; border-radius:8px;">`
    : '';
  showError('editor-error', '');
  renderBlocks();
  document.getElementById('editor-card').hidden = false;
  document.getElementById('editor-card').scrollIntoView({ behavior: 'smooth' });
}

function parseBlocks(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

function closeEditor() {
  document.getElementById('editor-card').hidden = true;
  editingId = null;
  blocks = [];
}

// Rendu des blocs dans l'éditeur
function renderBlocks() {
  const container = document.getElementById('blocks-container');
  container.innerHTML = '';
  blocks.forEach((block, idx) => {
    const div = document.createElement('div');
    div.className = 'block block-' + block.type;
    div.dataset.idx = idx;

    if (block.type === 'paragraph') {
      div.innerHTML = `
        <div class="block-toolbar">
          <button type="button" onclick="applyFmt(${idx}, 'bold')"><strong>G</strong></button>
          <button type="button" onclick="applyFmt(${idx}, 'italic')"><em>I</em></button>
          <button type="button" onclick="applyFmt(${idx}, 'underline')"><u>U</u></button>
        </div>
        <div class="editable" contenteditable="true" data-idx="${idx}" data-placeholder="Écris ton texte ici…">${block.html || ''}</div>
        <button class="block-remove" type="button" onclick="removeBlock(${idx})" title="Supprimer ce bloc">✕</button>
      `;
    } else if (block.type === 'heading') {
      div.innerHTML = `
        <div class="editable" contenteditable="true" data-idx="${idx}" data-placeholder="Sous-titre…">${block.html || ''}</div>
        <button class="block-remove" type="button" onclick="removeBlock(${idx})" title="Supprimer ce bloc">✕</button>
      `;
    } else if (block.type === 'image') {
      const preview = block.src ? `<img src="${block.src}" alt="">` : '';
      div.innerHTML = `
        <div class="block-image">${preview}</div>
        <input type="file" accept="image/*" class="img-block-file" data-idx="${idx}" style="margin-bottom:8px;">
        <input type="text" class="img-block-caption" data-idx="${idx}" placeholder="Légende (optionnelle)" value="${escapeHtml(block.caption || '')}" style="width:100%;padding:6px 10px;border:1px solid var(--line);border-radius:6px;font-family:inherit;">
        <button class="block-remove" type="button" onclick="removeBlock(${idx})" title="Supprimer ce bloc">✕</button>
      `;
    }

    container.appendChild(div);

    // Events live
    const editable = div.querySelector('.editable');
    if (editable) {
      editable.addEventListener('input', () => {
        blocks[idx].html = editable.innerHTML;
      });
    }
    const fileInput = div.querySelector('.img-block-file');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => handleBlockImage(e, idx));
    }
    const captionInput = div.querySelector('.img-block-caption');
    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        blocks[idx].caption = e.target.value;
      });
    }
  });
}

function applyFmt(idx, cmd) {
  const el = document.querySelector(`.editable[data-idx="${idx}"]`);
  if (!el) return;
  el.focus();
  document.execCommand(cmd, false, null);
  blocks[idx].html = el.innerHTML;
}

function addBlock(type) {
  if (type === 'paragraph') blocks.push({ type: 'paragraph', html: '' });
  else if (type === 'heading') blocks.push({ type: 'heading', html: '' });
  else if (type === 'image') blocks.push({ type: 'image', src: '', caption: '' });
  renderBlocks();
  // focus dernier bloc
  const editables = document.querySelectorAll('.editable');
  if (editables.length) editables[editables.length - 1].focus();
}

function removeBlock(idx) {
  blocks.splice(idx, 1);
  renderBlocks();
}

// Resize + compress image côté client avant stockage base64
function compressImage(file, maxWidth = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handleBlockImage(e, idx) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await compressImage(file);
    blocks[idx].src = dataUrl;
    renderBlocks();
  } catch {
    showToast('Impossible de charger cette image.');
  }
}

// Image de couverture
let coverDataUrl = '';
document.addEventListener('DOMContentLoaded', () => {
  const coverInput = document.getElementById('art-cover');
  if (coverInput) {
    coverInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      coverDataUrl = await compressImage(file, 1400, 0.80);
      document.getElementById('cover-preview').innerHTML =
        `<img src="${coverDataUrl}" style="max-height:140px; border-radius:8px;">`;
    });
  }
});

// ---- Sauvegarde article ----
async function saveArticle() {
  const title = document.getElementById('art-title').value.trim();
  const excerpt = document.getElementById('art-excerpt').value.trim();
  if (!title) { showError('editor-error', 'Le titre est requis.'); return; }

  const btn = document.getElementById('save-article-btn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';
  showError('editor-error', '');

  // Snapshot live des editables
  document.querySelectorAll('.editable[data-idx]').forEach(el => {
    const idx = Number(el.dataset.idx);
    if (blocks[idx]) blocks[idx].html = el.innerHTML;
  });
  document.querySelectorAll('.img-block-caption[data-idx]').forEach(el => {
    const idx = Number(el.dataset.idx);
    if (blocks[idx]) blocks[idx].caption = el.value;
  });

  const cover = coverDataUrl || (editingId
    ? (articlesList.find(a => a.id === editingId) || {}).cover_image || ''
    : '');

  const payload = { title, excerpt, content: blocks, cover_image: cover };
  try {
    let res;
    if (editingId) {
      res = await fetch('/api/articles/' + editingId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    const data = await res.json();
    if (data.ok) {
      showToast(editingId ? 'Article mis à jour !' : 'Article créé !');
      coverDataUrl = '';
      closeEditor();
      await loadArticles();
    } else {
      showError('editor-error', data.error || 'Erreur lors de l\'enregistrement.');
    }
  } catch {
    showError('editor-error', 'Erreur réseau. Réessaie.');
  }
  btn.disabled = false;
  btn.textContent = 'Enregistrer';
}

async function editArticle(id) {
  const res = await fetch('/api/articles/' + id);
  const data = await res.json();
  if (data.ok) {
    coverDataUrl = '';
    openEditor(data.article);
  } else {
    showToast('Impossible de charger l\'article.');
  }
}

// ---- Réglages radio ----
async function loadSettings() {
  const res = await fetch('/api/settings');
  const data = await res.json();
  if (!data.ok) return;
  const s = data.settings;
  document.getElementById('show-name').value = s.radio_show_name || '';
  document.getElementById('stream-url').value = s.radio_stream_url || '';
  document.getElementById('radio-enabled').checked = s.radio_enabled === '1' || s.radio_enabled === 'true';
}

async function saveSettings() {
  const payload = {
    radio_show_name: document.getElementById('show-name').value.trim(),
    radio_stream_url: document.getElementById('stream-url').value.trim(),
    radio_enabled: document.getElementById('radio-enabled').checked ? '1' : '0',
  };
  showError('settings-error', '');
  const btn = document.getElementById('save-settings-btn');
  btn.disabled = true;
  btn.textContent = 'Enregistrement…';
  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.ok) showToast('Réglages enregistrés !');
    else showError('settings-error', data.error || 'Erreur.');
  } catch {
    showError('settings-error', 'Erreur réseau.');
  }
  btn.disabled = false;
  btn.textContent = 'Enregistrer les réglages';
}

// ---- Chargement complet ----
async function loadAll() {
  await Promise.all([loadArticles(), loadSettings()]);
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();

  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('new-article-btn').addEventListener('click', () => { coverDataUrl = ''; openEditor(); });
  document.getElementById('save-article-btn').addEventListener('click', saveArticle);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeEditor);
  document.getElementById('add-paragraph').addEventListener('click', () => addBlock('paragraph'));
  document.getElementById('add-heading').addEventListener('click', () => addBlock('heading'));
  document.getElementById('add-image').addEventListener('click', () => addBlock('image'));
  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

  const authed = await checkSession();
  if (authed) {
    showAdminView(true);
    await loadAll();
  } else {
    showLoginView(true);
  }
});

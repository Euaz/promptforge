/* Persistence. Always writes to localStorage; mirrors to Supabase when signed in. */

window.PF = window.PF || {};

var LS_PROMPTS = 'pf.prompts.v1';
var LS_THEME = 'pf.theme';
var LS_DRAFT = 'pf.draft.v1';

var client = null;
var session = null;
var listeners = [];

var SUPABASE_SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
var SUPABASE_SDK_TIMEOUT_MS = 8000;

/* Loaded via JS, not a <script> tag in index.html, so a blocked or slow CDN
   can never hold up the app's own scripts from running. Classic <script> tags
   execute in strict document order — one stalled network request ahead of
   templates.js/app.js would leave the whole page blank under the header. */
function loadSupabaseSdk(cb) {
  if (window.supabase && window.supabase.createClient) { cb(true); return; }
  var done = false;
  function finish(ok) { if (done) return; done = true; cb(ok); }
  var script = document.createElement('script');
  script.src = SUPABASE_SDK_URL;
  script.onload = function () { finish(!!(window.supabase && window.supabase.createClient)); };
  script.onerror = function () { finish(false); };
  document.head.appendChild(script);
  setTimeout(function () { finish(false); }, SUPABASE_SDK_TIMEOUT_MS);
}

function uid() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_PROMPTS) || '[]');
  } catch (e) {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(LS_PROMPTS, JSON.stringify(list));
}

function emit() {
  listeners.forEach(function (fn) { fn(); });
}

PF.store = {
  onChange: function (fn) { listeners.push(fn); },

  /* --- Theme --- */
  getTheme: function () { return localStorage.getItem(LS_THEME) || 'dark'; },
  setTheme: function (t) { localStorage.setItem(LS_THEME, t); },

  /* --- Draft autosave --- */
  saveDraft: function (draft) {
    try { localStorage.setItem(LS_DRAFT, JSON.stringify(draft)); } catch (e) {}
  },
  loadDraft: function () {
    try { return JSON.parse(localStorage.getItem(LS_DRAFT) || 'null'); } catch (e) { return null; }
  },
  clearDraft: function () { localStorage.removeItem(LS_DRAFT); },

  /* --- Prompts --- */
  list: function () {
    return readLocal().sort(function (a, b) { return b.updated - a.updated; });
  },

  get: function (id) {
    return readLocal().filter(function (p) { return p.id === id; })[0] || null;
  },

  save: function (prompt) {
    var list = readLocal();
    var now = Date.now();
    if (!prompt.id) {
      prompt.id = uid();
      prompt.created = now;
    }
    prompt.updated = now;
    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i].id === prompt.id) idx = i; }
    if (idx >= 0) list[idx] = prompt; else list.push(prompt);
    writeLocal(list);
    emit();
    pushRemote(prompt);
    return prompt;
  },

  remove: function (id) {
    writeLocal(readLocal().filter(function (p) { return p.id !== id; }));
    emit();
    if (client && session) {
      client.from('prompts').delete().eq('id', id).then(function () {}, function () {});
    }
  },

  /* --- Auth --- */
  isConfigured: function () { return !!client; },
  getSession: function () { return session; },
  getUser: function () { return session ? session.user : null; },

  signIn: function (email) {
    if (!client) return Promise.reject(new Error('Cloud sync is not configured yet.'));
    return client.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: window.location.href.split('#')[0] }
    }).then(function (res) {
      if (res.error) throw res.error;
      return res;
    });
  },

  signOut: function () {
    if (!client) return Promise.resolve();
    return client.auth.signOut().then(function () {
      session = null;
      emit();
    });
  },

  init: function () {
    var cfg = window.PF_CONFIG;
    if (!cfg || !cfg.supabaseUrl || !cfg.supabaseAnonKey || /YOUR_/.test(cfg.supabaseUrl)) return;

    loadSupabaseSdk(function (ok) {
      if (!ok) return; /* No network, CDN blocked, or timed out — app stays local-only. */

      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);

      client.auth.getSession().then(function (res) {
        session = res.data.session;
        if (session) pullRemote();
        emit();
      });

      client.auth.onAuthStateChange(function (_evt, s) {
        var wasSignedOut = !session;
        session = s;
        if (s && wasSignedOut) pullRemote();
        emit();
      });

      emit(); /* Tell the UI cloud sync just became available, e.g. show Sign in. */
    });
  }
};

/* --- Sync --- */

function toRow(p) {
  return {
    id: p.id,
    user_id: session.user.id,
    title: p.title,
    template_id: p.templateId,
    body: p.body,
    values: p.values,
    options: p.options,
    tags: p.tags || [],
    created_at: new Date(p.created || Date.now()).toISOString(),
    updated_at: new Date(p.updated || Date.now()).toISOString()
  };
}

function fromRow(r) {
  return {
    id: r.id,
    title: r.title,
    templateId: r.template_id,
    body: r.body,
    values: r.values || {},
    options: r.options || {},
    tags: r.tags || [],
    created: new Date(r.created_at).getTime(),
    updated: new Date(r.updated_at).getTime()
  };
}

function pushRemote(prompt) {
  if (!client || !session) return;
  client.from('prompts').upsert(toRow(prompt)).then(function (res) {
    if (res.error) console.warn('Sync failed:', res.error.message);
  });
}

/* Merge remote into local, newest-wins per prompt, then push anything local-only. */
function pullRemote() {
  if (!client || !session) return;
  client.from('prompts').select('*').then(function (res) {
    if (res.error) { console.warn('Sync failed:', res.error.message); return; }
    var local = readLocal();
    var byId = {};
    local.forEach(function (p) { byId[p.id] = p; });

    (res.data || []).forEach(function (r) {
      var remote = fromRow(r);
      var existing = byId[remote.id];
      if (!existing || remote.updated > existing.updated) byId[remote.id] = remote;
    });

    var merged = Object.keys(byId).map(function (k) { return byId[k]; });
    writeLocal(merged);

    var remoteIds = {};
    (res.data || []).forEach(function (r) { remoteIds[r.id] = true; });
    merged.forEach(function (p) { if (!remoteIds[p.id]) pushRemote(p); });

    emit();
  });
}

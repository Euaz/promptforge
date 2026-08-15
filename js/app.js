/* UI: routing, form rendering, live preview, library. */
(function () {
  'use strict';

  var view = document.getElementById('view');
  var state = { category: 'All', search: '', values: {}, opts: {}, format: 'xml', template: null, editingId: null, exampleLabel: null };

  /* Set just before navigating to the builder; renderBuilder consumes it in
     place of the saved draft, then clears it. */
  var pendingExample = null;

  /* ---------- helpers ---------- */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function frag(id) {
    return document.getElementById(id).content.cloneNode(true);
  }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, a); }, ms);
    };
  }

  /* ---------- theme ---------- */

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    PF.store.setTheme(t);
  }
  applyTheme(PF.store.getTheme());

  document.getElementById('themeBtn').addEventListener('click', function () {
    applyTheme(PF.store.getTheme() === 'dark' ? 'light' : 'dark');
  });

  /* ---------- modal ---------- */

  var modal = document.getElementById('modal');
  var modalBody = document.getElementById('modalBody');

  function openModal(nodes) {
    modalBody.textContent = '';
    nodes.forEach(function (n) { modalBody.appendChild(n); });
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ---------- auth ---------- */

  function renderAccountBtn() {
    var btn = document.getElementById('accountBtn');
    var user = PF.store.getUser();

    /* Nothing to sign in to until Supabase is configured. */
    btn.hidden = !PF.store.isConfigured();
    if (btn.hidden) return;

    if (user) {
      btn.textContent = user.email.split('@')[0];
      btn.onclick = function () {
        openModal([
          el('h2', { text: 'Signed in' }),
          el('p', { text: user.email + ' — your prompts sync across devices.' }),
          el('div', { class: 'modal-actions' }, [
            el('button', { class: 'btn btn-ghost', onclick: closeModal, text: 'Close' }),
            el('button', {
              class: 'btn', text: 'Sign out',
              onclick: function () { PF.store.signOut().then(function () { closeModal(); toast('Signed out'); }); }
            })
          ])
        ]);
      };
    } else {
      btn.textContent = 'Sign in';
      btn.onclick = openSignIn;
    }
  }

  function openSignIn() {
    var input = el('input', { type: 'email', placeholder: 'you@example.com', required: 'required' });
    var status = el('p', { class: 'muted' });

    function submit() {
      var email = input.value.trim();
      if (!email || email.indexOf('@') === -1) { status.textContent = 'Enter a valid email address.'; return; }
      status.textContent = 'Sending…';
      PF.store.signIn(email).then(function () {
        status.textContent = 'Check your inbox — we sent a sign-in link to ' + email + '.';
      }, function (err) {
        status.textContent = err.message || 'Could not send the link.';
      });
    }

    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

    openModal([
      el('h2', { text: 'Sign in' }),
      el('p', { text: 'We email you a one-time link — no password to remember. Your saved prompts then follow you between devices.' }),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Email address' }), input]),
      status,
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn btn-ghost', onclick: closeModal, text: 'Cancel' }),
        el('button', { class: 'btn', onclick: submit, text: 'Send link' })
      ])
    ]);
    setTimeout(function () { input.focus(); }, 30);
  }

  /* ---------- gallery ---------- */

  function renderGallery() {
    view.textContent = '';
    view.appendChild(frag('tpl-gallery'));

    var chips = document.getElementById('catChips');
    PF.CATEGORIES.forEach(function (cat) {
      chips.appendChild(el('button', {
        class: 'chip' + (state.category === cat ? ' active' : ''),
        text: cat,
        onclick: function () { state.category = cat; renderGallery(); }
      }));
    });

    document.getElementById('heroSurprise').addEventListener('click', function () {
      loadExample(PF.randomExample());
    });

    var promptForm = document.getElementById('promptBar');
    var promptInput = document.getElementById('promptInput');

    function startImprove() {
      var text = promptInput.value.trim();
      if (!text) { promptInput.focus(); return; }
      beginImprove(text);
      location.hash = '#/improve';
    }

    promptForm.addEventListener('submit', function (e) { e.preventDefault(); startImprove(); });
    /* Enter sends, Shift+Enter makes a new line — the convention people expect
       from a chat box. */
    promptInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startImprove(); }
    });

    var searchBox = document.getElementById('tplSearch');
    searchBox.value = state.search;
    searchBox.addEventListener('input', debounce(function () {
      state.search = searchBox.value;
      paintGrid();
    }, 120));

    paintGrid();
  }

  function paintGrid() {
    var grid = document.getElementById('tplGrid');
    if (!grid) return;
    grid.textContent = '';

    var q = state.search.toLowerCase().trim();
    var list = PF.TEMPLATES.filter(function (t) {
      if (state.category !== 'All' && t.category !== state.category) return false;
      if (!q) return true;
      return (t.name + ' ' + t.blurb + ' ' + t.category).toLowerCase().indexOf(q) !== -1;
    });

    if (!list.length) {
      grid.appendChild(el('p', { class: 'empty', text: 'No templates match that search.' }));
      return;
    }

    list.forEach(function (t) {
      grid.appendChild(el('button', {
        class: 'card',
        onclick: function () { location.hash = '#/build/' + t.id; }
      }, [
        el('div', { class: 'card-top' }, [
          el('div', { class: 'card-icon', text: t.icon }),
          el('div', {}, [
            el('h3', { text: t.name }),
            el('div', { class: 'card-cat', text: t.category })
          ])
        ]),
        el('p', { text: t.blurb })
      ]));
    });
  }

  /* ---------- builder ---------- */

  function renderBuilder(templateId, loadId) {
    var t = PF.getTemplate(templateId);
    if (!t) { location.hash = '#/'; return; }

    state.template = t;
    state.editingId = loadId || null;
    state.values = {};
    state.opts = { format: 'xml', reasoning: true, noHallucinate: true, noFluff: false, askFirst: false, outputStructure: 'none', role: t.defaultRole || '', examples: '' };

    t.fields.forEach(function (f) {
      state.values[f.key] = f.value !== undefined ? f.value : (f.type === 'tags' ? [] : (f.type === 'toggle' ? false : ''));
    });

    state.exampleLabel = null;
    var example = pendingExample && pendingExample.templateId === templateId ? pendingExample : null;
    pendingExample = null;

    if (loadId) {
      var saved = PF.store.get(loadId);
      if (saved) {
        Object.keys(saved.values || {}).forEach(function (k) { state.values[k] = saved.values[k]; });
        Object.keys(saved.options || {}).forEach(function (k) { state.opts[k] = saved.options[k]; });
      }
    } else if (example) {
      Object.keys(example.values).forEach(function (k) { state.values[k] = example.values[k]; });
      /* Creative scenarios switch off guardrails that would contradict the task —
         "never invent names or quotes" makes no sense for a short story. */
      if (example.opts) Object.keys(example.opts).forEach(function (k) { state.opts[k] = example.opts[k]; });
      state.exampleLabel = example.label;
    } else {
      var draft = PF.store.loadDraft();
      if (draft && draft.templateId === templateId) {
        Object.keys(draft.values || {}).forEach(function (k) { state.values[k] = draft.values[k]; });
        Object.keys(draft.options || {}).forEach(function (k) { state.opts[k] = draft.options[k]; });
      }
    }

    state.format = state.opts.format || 'xml';

    view.textContent = '';
    view.appendChild(frag('tpl-builder'));

    document.getElementById('bTitle').textContent = t.name;
    document.getElementById('bBlurb').textContent = t.blurb;

    var form = document.getElementById('bForm');
    t.fields.forEach(function (f) { form.appendChild(buildField(f)); });

    wireAdvanced();
    wireOutput();
    wireExampleControls();
    refresh();
  }

  /* Load an example into the builder, navigating there first if needed. */
  function loadExample(ex) {
    if (!ex) { toast('No example available for this one yet'); return; }
    pendingExample = ex;
    if (location.hash === '#/build/' + ex.templateId) {
      renderBuilder(ex.templateId);
    } else {
      location.hash = '#/build/' + ex.templateId;
    }
  }

  function wireExampleControls() {
    var note = document.getElementById('exampleNote');
    if (state.exampleLabel) {
      note.hidden = false;
      note.textContent = 'Example: ' + state.exampleLabel + ' — edit anything you like';
    } else {
      note.hidden = true;
    }

    var reroll = document.getElementById('rerollBtn');
    reroll.hidden = !PF.hasExamples(state.template.id);
    reroll.onclick = function () {
      loadExample(PF.exampleFor(state.template.id, state.exampleLabel));
    };

    document.getElementById('clearBtn').onclick = function () {
      PF.store.clearDraft();
      state.editingId = null;
      renderBuilder(state.template.id);
      toast('Form cleared');
    };
  }

  function buildField(f) {
    var wrap = el('label', { class: 'field' });
    var label = el('span', { class: 'label', text: f.label });
    if (f.required) label.appendChild(el('span', { class: 'req', text: '*' }));
    wrap.appendChild(label);

    var control;

    if (f.type === 'textarea') {
      control = el('textarea', { rows: f.rows || 3, placeholder: f.placeholder || '' });
      control.value = state.values[f.key] || '';
      control.addEventListener('input', function () { state.values[f.key] = control.value; refresh(); });

    } else if (f.type === 'select') {
      control = el('select');
      f.options.forEach(function (o) {
        var opt = el('option', { value: o, text: o });
        if (state.values[f.key] === o) opt.selected = true;
        control.appendChild(opt);
      });
      if (!state.values[f.key]) state.values[f.key] = f.options[0];
      control.addEventListener('change', function () { state.values[f.key] = control.value; refresh(); });

    } else if (f.type === 'toggle') {
      wrap.className = 'switch';
      wrap.textContent = '';
      var cb = el('input', { type: 'checkbox' });
      cb.checked = !!state.values[f.key];
      cb.addEventListener('change', function () { state.values[f.key] = cb.checked; refresh(); });
      wrap.appendChild(cb);
      wrap.appendChild(el('span'));
      wrap.appendChild(el('em', { text: f.label }));
      return wrap;

    } else if (f.type === 'tags') {
      control = buildTags(f);

    } else {
      control = el('input', { type: 'text', placeholder: f.placeholder || '' });
      control.value = state.values[f.key] || '';
      control.addEventListener('input', function () { state.values[f.key] = control.value; refresh(); });
    }

    wrap.appendChild(control);
    if (f.help) wrap.appendChild(el('span', { class: 'help', text: f.help }));
    return wrap;
  }

  function buildTags(f) {
    var box = el('div', { class: 'tagbox' });
    var input = el('input', { type: 'text', placeholder: f.placeholder || 'Type and press Enter' });

    function paint() {
      box.textContent = '';
      (state.values[f.key] || []).forEach(function (tag, i) {
        box.appendChild(el('span', { class: 'tag' }, [
          document.createTextNode(tag),
          el('button', {
            type: 'button', text: '×', 'aria-label': 'Remove ' + tag,
            onclick: function () { state.values[f.key].splice(i, 1); paint(); refresh(); }
          })
        ]));
      });
      box.appendChild(input);
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        var v = input.value.trim().replace(/,$/, '');
        if (v) {
          state.values[f.key] = state.values[f.key] || [];
          state.values[f.key].push(v);
          input.value = '';
          paint();
          input.focus();
          refresh();
        }
      } else if (e.key === 'Backspace' && !input.value && (state.values[f.key] || []).length) {
        state.values[f.key].pop();
        paint();
        input.focus();
        refresh();
      }
    });

    paint();
    return box;
  }

  function wireAdvanced() {
    var map = {
      optRole: ['role', 'value'],
      optExamples: ['examples', 'value'],
      optStructure: ['outputStructure', 'value'],
      optReasoning: ['reasoning', 'checked'],
      optNoHallucinate: ['noHallucinate', 'checked'],
      optNoFluff: ['noFluff', 'checked'],
      optAskFirst: ['askFirst', 'checked']
    };

    Object.keys(map).forEach(function (id) {
      var node = document.getElementById(id);
      var key = map[id][0], prop = map[id][1];
      node[prop] = state.opts[key];
      node.addEventListener(prop === 'checked' ? 'change' : 'input', function () {
        state.opts[key] = node[prop];
        refresh();
      });
      if (node.tagName === 'SELECT') node.addEventListener('change', function () { state.opts[key] = node.value; refresh(); });
    });

    var customised = (state.opts.examples || '').trim() !== ''
      || (state.opts.outputStructure && state.opts.outputStructure !== 'none')
      || state.opts.role !== (state.template.defaultRole || '');
    if (customised) document.getElementById('advanced').open = true;
  }

  function wireOutput() {
    var tabs = document.getElementById('fmtTabs');
    Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (b) {
      b.classList.toggle('active', b.dataset.fmt === state.format);
      b.addEventListener('click', function () {
        state.format = b.dataset.fmt;
        state.opts.format = b.dataset.fmt;
        Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        refresh();
      });
    });

    document.getElementById('copyBtn').addEventListener('click', function () {
      var text = currentPrompt();
      if (!text) { toast('Nothing to copy yet'); return; }
      copyText(text);
    });

    document.getElementById('saveBtn').addEventListener('click', openSave);
    document.getElementById('dlBtn').addEventListener('click', function () {
      var text = currentPrompt();
      if (!text) { toast('Nothing to download yet'); return; }
      var name = (state.template.name + '-prompt').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      download(name + '.md', text);
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied to clipboard'); }, fallback);
    } else { fallback(); }

    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard'); }
      catch (e) { toast('Press Ctrl+C to copy'); }
      document.body.removeChild(ta);
    }
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function currentPrompt() {
    if (!state.template) return '';
    var o = {};
    Object.keys(state.opts).forEach(function (k) { o[k] = state.opts[k]; });
    o.format = state.format;
    return PF.build(state.template, state.values, o);
  }

  function refresh() {
    var text = currentPrompt();
    document.getElementById('output').textContent = text;

    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('charCount').textContent = text.length
      ? words + ' words · ' + text.length + ' characters · ~' + Math.ceil(text.length / 4) + ' tokens'
      : '';

    var enc = encodeURIComponent(text.slice(0, 6000));
    document.getElementById('claudeLink').href = 'https://claude.ai/new?q=' + enc;
    document.getElementById('gptLink').href = 'https://chatgpt.com/?q=' + enc;

    paintScore();

    PF.store.saveDraft({ templateId: state.template.id, values: state.values, options: state.opts });
  }

  function paintScore() {
    var s = PF.score(state.template, state.values, state.opts);
    var box = document.getElementById('score');
    box.textContent = '';

    var fill = el('div', { class: 'score-fill' + (s.pct >= 75 ? ' good' : '') });
    fill.style.width = s.pct + '%';

    box.appendChild(el('div', { class: 'score-bar' }, [
      el('div', { class: 'score-track' }, [fill]),
      el('span', { class: 'score-label', text: 'Prompt strength ' + s.pct + '%' })
    ]));

    var missing = s.checks.filter(function (c) { return !c.ok; });
    if (missing.length) {
      var tips = el('div', { class: 'score-tips' });
      missing.forEach(function (c) {
        tips.appendChild(el('span', { class: 'tip', title: c.hint, text: 'Missing: ' + c.label.toLowerCase() }));
      });
      box.appendChild(tips);
    }
  }

  function openSave() {
    var text = currentPrompt();
    if (!text.trim()) { toast('Fill in the form first'); return; }

    var existing = state.editingId ? PF.store.get(state.editingId) : null;
    var input = el('input', { type: 'text', placeholder: 'e.g. Weekly newsletter prompt' });
    input.value = existing ? existing.title : state.template.name + ' — ' + new Date().toLocaleDateString();

    function submit() {
      var title = input.value.trim() || state.template.name;
      PF.store.save({
        id: state.editingId || null,
        title: title,
        templateId: state.template.id,
        body: text,
        values: state.values,
        options: state.opts,
        created: existing ? existing.created : Date.now()
      });
      PF.store.clearDraft();
      closeModal();
      toast(PF.store.getUser() ? 'Saved and synced' : 'Saved to your library');
    }

    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });

    openModal([
      el('h2', { text: existing ? 'Update prompt' : 'Save to library' }),
      el('p', { text: PF.store.getUser() ? 'Saved to your account and synced across devices.' : 'Saved in this browser. Sign in to sync across devices.' }),
      el('label', { class: 'field' }, [el('span', { class: 'label', text: 'Name' }), input]),
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn btn-ghost', onclick: closeModal, text: 'Cancel' }),
        el('button', { class: 'btn', onclick: submit, text: 'Save' })
      ])
    ]);
    setTimeout(function () { input.select(); }, 30);
  }

  /* ---------- prompt improver ---------- */

  var improveSession = null;

  /* The conversation stored as replayable actions. Editing or deleting a
     message rewrites this list and replays it from the start.

     Replay rather than undo, because refinements have no inverse: "remove the
     bit about domains" filters an array and "10 instead of 20" rewrites a
     number in place, so there is nothing to reverse. Rebuilding from the
     original text is the only way the prompt can be guaranteed to match what
     the messages on screen actually say. */
  var transcript = [];

  /* Output preferences are a property of the view, not of the conversation, so
     they live outside the session — replay builds a fresh session each time and
     would otherwise reset the user's toggles on every refinement. */
  var outputPrefs = { structured: false, guardrails: false };

  function beginImprove(text) {
    transcript = [{ kind: 'initial', text: text }];
    outputPrefs = { structured: false, guardrails: false };
  }

  function renderImprove() {
    if (!transcript.length) { location.hash = '#/'; return; }
    view.textContent = '';
    view.appendChild(frag('tpl-improve'));
    replay();
  }

  function say(chat, who, text, extraClass) {
    var msg = el('div', { class: 'msg msg-' + who + (extraClass ? ' ' + extraClass : '') }, [
      el('div', { class: 'msg-body', text: text })
    ]);
    chat.appendChild(msg);
    return msg;
  }

  /* A user bubble that remembers which transcript entry produced it. */
  function sayUser(chat, text, index) {
    var msg = say(chat, 'user', text);
    msg.dataset.entry = index;
    return msg;
  }

  /* Rebuild the entire conversation and the session from `transcript`. */
  function replay() {
    var chat = document.getElementById('chat');
    if (!chat || !transcript.length) return;
    chat.textContent = '';

    var head = transcript[0];
    improveSession = PF.startImprove(head.text);
    improveSession.structured = outputPrefs.structured;
    improveSession.guardrails = outputPrefs.guardrails;
    sayUser(chat, head.text, 0);

    if (head.previous) {
      var note = say(chat, 'bot', 'That read like a new prompt, so this is a fresh start.');
      note.appendChild(el('div', { class: 'chat-actions' }, [
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button',
          text: 'No — refine the previous prompt instead',
          onclick: function () {
            /* Fold the misread message back in as a refinement. */
            transcript = head.previous.concat([{ kind: 'refine', text: head.text }]);
            replay();
          }
        })
      ]));
    }

    var pack = PF.detectIntent(improveSession.raw);
    say(chat, 'bot', pack.label
      ? 'Looks like a ' + pack.label + ' task — I know what a good one of those needs. A couple of questions first, or skip and I will fill in the rest.'
      : 'Got it. A couple of questions and it will be sharper — skip any you do not care about.');

    var i = 1;

    /* Question phase: re-ask each question and feed back the stored answer.
       Question generation is deterministic, so the same answers land in the
       same slots. */
    while (i < transcript.length && transcript[i].kind === 'answer') {
      var q = PF.nextQuestion(improveSession);
      if (!q) break;
      var bubble = say(chat, 'bot', q.label);
      if (q.why) bubble.appendChild(el('div', { class: 'msg-why', text: q.why }));
      sayUser(chat, transcript[i].text || 'Skip', i);
      PF.answerImprove(improveSession, q, transcript[i].text);
      i++;
    }

    /* Editing the opening prompt can shorten the question list, orphaning
       answers that no longer have a question to attach to. */
    while (i < transcript.length && transcript[i].kind === 'answer') {
      transcript.splice(i, 1);
    }

    var pending = PF.nextQuestion(improveSession);
    /* If an edit re-opened the question queue but refinements already exist,
       keep the refinements rather than re-interrogating the user. */
    if (pending && i < transcript.length) {
      PF.finishImprove(improveSession);
      pending = null;
    }

    if (!pending) addResult(chat, 'Here is your prompt, improved.');

    for (; i < transcript.length; i++) {
      var entry = transcript[i];
      sayUser(chat, entry.text, i);

      if (entry.kind === 'question') {
        say(chat, 'bot', PF.answerFollowUp(improveSession, entry.text));
      } else {
        var changes = PF.applyRefinement(improveSession, entry.text);
        if (changes.length) addResult(chat, 'Updated — ' + changes.join(', ') + '.');
        else say(chat, 'bot', 'I could not make anything of that — try something like "make it shorter", "only 10 options", or "remove the bit about domains".');
      }
    }

    /* Only the newest card keeps its controls. */
    var cards = chat.querySelectorAll('.result');
    for (var k = 0; k < cards.length - 1; k++) {
      var stale = cards[k].querySelectorAll('.result-toggles, .chat-actions');
      Array.prototype.forEach.call(stale, function (n) { n.parentNode.removeChild(n); });
      cards[k].classList.add('result-old');
    }

    if (pending) askNext();
    else setupFollowUp();

    attachEditControls();
    scrollChat();
  }

  function addResult(chat, message) {
    say(chat, 'bot', message);
    var wrap = el('div', { class: 'result' });
    chat.appendChild(wrap);
    paintResult(wrap);
    return wrap;
  }

  /* ---------- editing the last message ---------- */

  function attachEditControls() {
    var chat = document.getElementById('chat');
    if (!chat) return;

    var bubbles = chat.querySelectorAll('.msg-user[data-entry]');
    if (!bubbles.length) return;

    var last = bubbles[bubbles.length - 1];
    var index = parseInt(last.dataset.entry, 10);
    if (isNaN(index)) return;

    var controls = el('div', { class: 'msg-tools' }, [
      el('button', {
        class: 'msg-tool', type: 'button', text: 'Edit',
        title: 'Change this message and rebuild the prompt',
        onclick: function () { startEditing(last, index); }
      })
    ]);

    /* Deleting the opening prompt would leave nothing to work from. */
    if (index > 0) {
      controls.appendChild(el('button', {
        class: 'msg-tool', type: 'button', text: 'Delete',
        title: 'Remove this message and revert the prompt',
        onclick: function () {
          transcript = transcript.slice(0, index);
          replay();
          toast('Message removed — prompt reverted');
        }
      }));
    }

    last.appendChild(controls);
  }

  function startEditing(bubble, index) {
    var original = transcript[index].text;
    bubble.textContent = '';

    var input = el('input', { type: 'text', class: 'msg-edit-input' });
    input.value = original;

    function save() {
      var next = input.value.trim();
      if (!next) { cancel(); return; }
      if (next === original) { cancel(); return; }
      transcript[index].text = next;
      /* An edited final message may no longer be the same kind of thing —
         "make it shorter" changed to "write me a poem" is a new prompt. */
      if (index > 0 && transcript[index].kind !== 'answer') {
        transcript[index].kind = PF.classifyFollowUp(improveSession, next) === 'question' ? 'question' : 'refine';
      }
      replay();
      toast('Updated — prompt rebuilt');
    }

    function cancel() { replay(); }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });

    bubble.appendChild(el('div', { class: 'msg-edit' }, [
      input,
      el('div', { class: 'msg-edit-actions' }, [
        el('button', { class: 'btn btn-sm', type: 'button', text: 'Save', onclick: save }),
        el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Cancel', onclick: cancel })
      ])
    ]));

    setTimeout(function () { input.focus(); input.select(); }, 30);
  }

  function askNext() {
    var chat = document.getElementById('chat');
    var box = document.getElementById('chatInput');
    if (!chat || !box) return;

    var q = PF.nextQuestion(improveSession);
    if (!q) { setupFollowUp(); return; }

    var bubble = say(chat, 'bot', q.label);
    if (q.why) bubble.appendChild(el('div', { class: 'msg-why', text: q.why }));

    box.textContent = '';

    var chips = el('div', { class: 'chat-chips' });
    q.chips.forEach(function (c) {
      chips.appendChild(el('button', {
        class: 'chip', type: 'button', text: c,
        onclick: function () { submitAnswer(c); }
      }));
    });
    if (q.chips.length) box.appendChild(chips);

    var input = el('input', { type: 'text', placeholder: q.placeholder || 'Type your answer…' });
    box.appendChild(el('form', {
      class: 'chat-form',
      onsubmit: function (e) { e.preventDefault(); submitAnswer(input.value); }
    }, [input, el('button', { class: 'btn', type: 'submit', text: 'Send' })]));

    box.appendChild(el('div', { class: 'chat-actions' }, [
      el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Skip this', onclick: function () { submitAnswer(''); } }),
      el('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', text: 'Just generate it now',
        onclick: function () {
          /* Record the skips so a replay reaches the same place. */
          var guard = 0;
          while (PF.nextQuestion(improveSession) && guard++ < 8) {
            transcript.push({ kind: 'answer', text: '' });
            PF.answerImprove(improveSession, PF.nextQuestion(improveSession), '');
          }
          replay();
        }
      })
    ]));

    setTimeout(function () { input.focus(); }, 30);
    scrollChat();
  }

  function submitAnswer(answer) {
    transcript.push({ kind: 'answer', text: String(answer || '').trim() });
    replay();
  }

  /* Persistent box after a result: refine the prompt, or start a new one. */
  function setupFollowUp() {
    var box = document.getElementById('chatInput');
    if (!box) return;
    box.textContent = '';

    var quick = ['Make it shorter', 'More detail', 'Output as a table', 'More formal', 'Fewer options'];
    var chips = el('div', { class: 'chat-chips' });
    quick.forEach(function (c) {
      chips.appendChild(el('button', {
        class: 'chip', type: 'button', text: c,
        onclick: function () { handleFollowUp(c); }
      }));
    });
    box.appendChild(chips);

    var input = el('input', { type: 'text', placeholder: 'Refine it, ask a question, or type a whole new prompt…' });
    box.appendChild(el('form', {
      class: 'chat-form',
      onsubmit: function (e) { e.preventDefault(); var v = input.value; input.value = ''; handleFollowUp(v); }
    }, [input, el('button', { class: 'btn', type: 'submit', text: 'Send' })]));

    setTimeout(function () { input.focus(); }, 30);
  }

  function handleFollowUp(text) {
    var t = String(text || '').trim();
    if (!t) return;

    var kind = PF.classifyFollowUp(improveSession, t);

    if (kind === 'new') {
      /* Keep the old conversation so the guess can be reversed in one click. */
      transcript = [{ kind: 'initial', text: t, previous: transcript.slice() }];
    } else {
      transcript.push({ kind: kind === 'question' ? 'question' : 'refine', text: t });
    }

    replay();
  }

  /* Re-rendered in place whenever a toggle changes. */
  function paintResult(wrap) {
    wrap.textContent = '';

    var prompt = PF.composeImproved(improveSession);
    var report = PF.improveReport(improveSession);

    wrap.appendChild(el('pre', { class: 'chat-output', text: prompt }));

    if (report.notes.length) {
      wrap.appendChild(el('div', { class: 'chat-gains' }, [
        el('span', { class: 'gain-pill', text: report.words.before + ' → ' + report.words.after + ' words' }),
        el('span', { class: 'muted', text: 'What changed: ' + report.notes.join(', ') + '.' })
      ]));
    }

    /* Say plainly what is still wrong, even when everything was skipped. */
    if (report.missingInstruction) {
      wrap.appendChild(el('div', { class: 'warn-note' }, [
        el('strong', { text: 'Still missing: an actual request. ' }),
        document.createTextNode('Your prompt explains your situation but never says what you want the AI to do with it, so it will guess. Adding one line — "review this and tell me what I have missed" — will do more than anything else here.')
      ]));
    }

    wrap.appendChild(el('div', { class: 'result-toggles' }, [
      toggle('Add XML structure tags', outputPrefs.structured, function (on) {
        outputPrefs.structured = on;
        improveSession.structured = on;
        paintResult(wrap);
      }, 'Wraps each part in tags. Claude follows these closely; useful for long or reused prompts.'),
      toggle('Add quality guardrails', outputPrefs.guardrails, function (on) {
        outputPrefs.guardrails = on;
        improveSession.guardrails = on;
        paintResult(wrap);
      }, 'Adds step-by-step reasoning and a do-not-invent-facts instruction.')
    ]));

    wrap.appendChild(el('div', { class: 'chat-actions chat-actions-final' }, [
      el('button', { class: 'btn', type: 'button', text: 'Copy', onclick: function () { copyText(prompt); } }),
      el('a', {
        class: 'btn btn-ghost', target: '_blank', rel: 'noopener',
        text: 'Open in Claude ↗',
        href: 'https://claude.ai/new?q=' + encodeURIComponent(prompt.slice(0, 6000))
      }),
      el('button', {
        class: 'btn btn-ghost', type: 'button', text: 'Open in full builder',
        onclick: function () { loadExample(PF.improveHandoff(improveSession)); }
      }),
      el('button', {
        class: 'btn btn-ghost', type: 'button', text: 'Save',
        onclick: function () {
          PF.store.save({
            id: null,
            title: improveSession.raw.slice(0, 60),
            templateId: improveSession.templateId || 'blank',
            body: prompt,
            values: {},
            options: {}
          });
          toast('Saved to your library');
        }
      }),
      el('button', {
        class: 'btn btn-ghost', type: 'button', text: 'Start over',
        onclick: function () {
          transcript = [];
          improveSession = null;
          outputPrefs = { structured: false, guardrails: false };
          location.hash = '#/';
        }
      })
    ]));
  }

  function toggle(label, on, onchange, hint) {
    var cb = el('input', { type: 'checkbox' });
    cb.checked = !!on;
    cb.addEventListener('change', function () { onchange(cb.checked); });
    var row = el('label', { class: 'switch' }, [cb, el('span'), el('em', { text: label })]);
    if (!hint) return row;
    return el('div', { class: 'toggle-row' }, [row, el('div', { class: 'toggle-hint', text: hint })]);
  }

  function scrollChat() {
    var chat = document.getElementById('chat');
    if (chat) chat.scrollTop = chat.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
  }

  /* ---------- idea generator ---------- */

  var seedCategory = 'all';
  var currentSeeds = [];

  function renderInspire() {
    view.textContent = '';
    view.appendChild(frag('tpl-inspire'));

    var chips = document.getElementById('seedChips');
    var cats = [{ id: 'all', name: 'A bit of everything' }].concat(PF.SEED_CATEGORIES);
    cats.forEach(function (c) {
      chips.appendChild(el('button', {
        class: 'chip' + (seedCategory === c.id ? ' active' : ''),
        text: c.name,
        onclick: function () { seedCategory = c.id; currentSeeds = []; renderInspire(); }
      }));
    });

    document.getElementById('rollBtn').addEventListener('click', function () {
      currentSeeds = PF.generateSeeds(seedCategory, 3);
      paintSeeds();
    });

    if (!currentSeeds.length) currentSeeds = PF.generateSeeds(seedCategory, 3);
    paintSeeds();
  }

  function paintSeeds() {
    var list = document.getElementById('seedList');
    if (!list) return;
    list.textContent = '';

    if (!currentSeeds.length) {
      list.appendChild(el('p', { class: 'empty', text: 'Hit "New ideas" for a starting point.' }));
      return;
    }

    currentSeeds.forEach(function (seed) {
      list.appendChild(el('div', { class: 'seed-card' }, [
        el('div', { class: 'seed-cat', text: seed.categoryName }),
        el('p', { class: 'seed-text', text: seed.text }),
        el('div', { class: 'seed-actions' }, [
          el('button', {
            class: 'btn btn-sm', text: 'Build a prompt from this →',
            onclick: function () { loadExample(seed.target); }
          }),
          el('button', { class: 'btn btn-ghost btn-sm', text: 'Copy', onclick: function () { copyText(seed.text); } }),
          el('button', {
            class: 'btn btn-ghost btn-sm', text: '🎲 Reroll',
            onclick: function () {
              var cat = PF.getSeedCategory(seed.categoryId);
              if (!cat) return;
              var fresh = cat.generate();
              fresh.categoryId = cat.id;
              fresh.categoryName = cat.name;
              currentSeeds[currentSeeds.indexOf(seed)] = fresh;
              paintSeeds();
            }
          })
        ])
      ]));
    });
  }

  /* ---------- library ---------- */

  var libSearch = '';

  function renderLibrary() {
    view.textContent = '';
    view.appendChild(frag('tpl-library'));

    var box = document.getElementById('libSearch');
    box.value = libSearch;
    box.addEventListener('input', debounce(function () { libSearch = box.value; paintLibrary(); }, 120));

    document.getElementById('exportBtn').addEventListener('click', function () {
      var list = PF.store.list();
      if (!list.length) { toast('Nothing to export'); return; }
      download('promptforge-library.json', JSON.stringify(list, null, 2));
    });

    paintSync();
    paintLibrary();
  }

  function paintSync() {
    var note = document.getElementById('libSync');
    if (!note) return;
    note.textContent = '';
    var user = PF.store.getUser();

    if (user) {
      note.className = 'sync-note ok';
      note.textContent = 'Synced to ' + user.email + '.';
    } else if (PF.store.isConfigured()) {
      note.className = 'sync-note';
      note.appendChild(document.createTextNode('Saved in this browser only. '));
      note.appendChild(el('a', { text: 'Sign in', onclick: openSignIn }));
      note.appendChild(document.createTextNode(' to sync across devices.'));
    } else {
      note.className = 'sync-note';
      note.textContent = 'Saved in this browser only. Clearing site data will remove these — use Export to keep a backup.';
    }
  }

  function paintLibrary() {
    var list = document.getElementById('libList');
    if (!list) return;
    list.textContent = '';

    var q = libSearch.toLowerCase().trim();
    var items = PF.store.list().filter(function (p) {
      if (!q) return true;
      return (p.title + ' ' + p.body).toLowerCase().indexOf(q) !== -1;
    });

    if (!items.length) {
      list.appendChild(el('p', { class: 'empty', text: PF.store.list().length ? 'No saved prompts match that search.' : 'Nothing saved yet. Build a prompt and hit Save.' }));
      return;
    }

    items.forEach(function (p) {
      var t = PF.getTemplate(p.templateId);
      list.appendChild(el('div', { class: 'lib-item' }, [
        el('div', { class: 'lib-item-head' }, [
          el('h3', { text: p.title }),
          el('span', { class: 'lib-badge', text: t ? t.name : 'Custom' }),
          el('span', { class: 'muted', text: new Date(p.updated).toLocaleDateString() })
        ]),
        el('div', { class: 'lib-preview', text: p.body.slice(0, 260) }),
        el('div', { class: 'lib-actions' }, [
          el('button', { class: 'btn btn-sm', text: 'Copy', onclick: function () { copyText(p.body); } }),
          el('button', { class: 'btn btn-ghost btn-sm', text: 'Edit', onclick: function () { location.hash = '#/build/' + p.templateId + '/' + p.id; } }),
          el('button', { class: 'btn btn-ghost btn-sm', text: 'Duplicate', onclick: function () {
            var copy = JSON.parse(JSON.stringify(p));
            copy.id = null;
            copy.title = p.title + ' (copy)';
            PF.store.save(copy);
            toast('Duplicated');
          } }),
          el('button', { class: 'btn btn-danger btn-sm', text: 'Delete', onclick: function () { confirmDelete(p); } })
        ])
      ]));
    });
  }

  function confirmDelete(p) {
    openModal([
      el('h2', { text: 'Delete this prompt?' }),
      el('p', { text: '"' + p.title + '" will be removed from your library. This cannot be undone.' }),
      el('div', { class: 'modal-actions' }, [
        el('button', { class: 'btn btn-ghost', onclick: closeModal, text: 'Cancel' }),
        el('button', {
          class: 'btn', text: 'Delete',
          onclick: function () { PF.store.remove(p.id); closeModal(); toast('Deleted'); }
        })
      ])
    ]);
  }

  /* ---------- router ---------- */

  function route() {
    var hash = location.hash.replace(/^#\/?/, '');
    var parts = hash.split('/').filter(Boolean);

    document.querySelectorAll('[data-nav]').forEach(function (a) { a.classList.remove('active'); });

    if (parts[0] === 'build' && parts[1]) {
      renderBuilder(parts[1], parts[2]);
    } else if (parts[0] === 'improve') {
      renderImprove();
    } else if (parts[0] === 'inspire') {
      document.querySelector('[data-nav="inspire"]').classList.add('active');
      renderInspire();
    } else if (parts[0] === 'library') {
      document.querySelector('[data-nav="library"]').classList.add('active');
      renderLibrary();
    } else {
      document.querySelector('[data-nav="gallery"]').classList.add('active');
      renderGallery();
    }
    window.scrollTo(0, 0);
  }

  function refreshChrome() {
    document.getElementById('libCount').textContent = PF.store.list().length;
    renderAccountBtn();
    if (location.hash.indexOf('library') !== -1) { paintSync(); paintLibrary(); }
  }

  document.getElementById('surpriseBtn').addEventListener('click', function () {
    var current = state.template ? state.template.id : null;
    loadExample(PF.randomExample(current));
  });

  PF.validateExamples();
  PF.validateSeeds();
  PF.store.onChange(refreshChrome);
  PF.store.init();

  window.addEventListener('hashchange', route);
  route();
  refreshChrome();
})();

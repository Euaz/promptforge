/* Assembles form values into a structured prompt. */

window.PF = window.PF || {};

var SLOT_TAGS = {
  role: 'role',
  task: 'task',
  context: 'context',
  inputs: 'input_data',
  audience: 'audience',
  constraints: 'constraints',
  tone: 'tone_and_style',
  format: 'output_format',
  examples: 'examples',
  criteria: 'success_criteria'
};

function isEmpty(v) {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'boolean') return v === false;
  return false;
}

/* Turn one field's value into a line of prompt text. */
function renderField(field, value) {
  if (isEmpty(value)) return null;
  if (field.render) return field.render(value);
  if (field.type === 'toggle') return field.label + '.';
  if (field.type === 'tags') return field.label + ': ' + value.join(', ') + '.';

  var text = String(value).trim();
  /* Without a lead-in, free-text fields land as bare fragments — and two fields
     sharing a slot run together with nothing to tell them apart. */
  if (field.prefix) {
    if (!/[.!?:]$/.test(text)) text += '.';
    return field.prefix + text;
  }
  return text;
}

/* Group rendered field text by prompt slot. */
function collectSlots(template, values) {
  var slots = {};
  template.fields.forEach(function (f) {
    var text = renderField(f, values[f.key]);
    if (!text) return;
    if (!slots[f.slot]) slots[f.slot] = [];
    slots[f.slot].push(text);
  });
  return slots;
}

/* Extra instructions driven by the advanced options panel. */
function optionLines(opts, slots) {
  if (opts.reasoning) {
    slots.criteria = slots.criteria || [];
    slots.criteria.push('Before writing your final answer, think through the problem step by step. Work out your reasoning first, then give the answer.');
  }
  if (opts.askFirst) {
    slots.criteria = slots.criteria || [];
    slots.criteria.push('If anything above is ambiguous or you are missing information you genuinely need, ask me clarifying questions before producing the output rather than guessing.');
  }
  if (opts.noFluff) {
    slots.constraints = slots.constraints || [];
    slots.constraints.push('Skip preamble and sign-off. Do not restate the task back to me, do not open with "Certainly" or similar, and do not add a closing offer of further help. Give me the output and nothing else.');
  }
  if (opts.noHallucinate) {
    slots.criteria = slots.criteria || [];
    slots.criteria.push('Accuracy matters more than completeness. If you do not know something, say so plainly instead of guessing. Never invent facts, statistics, citations, names or quotes.');
  }
  if (opts.outputStructure && opts.outputStructure !== 'none') {
    slots.format = slots.format || [];
    var m = {
      markdown: 'Format the response in clean markdown with headings and bullet points where they aid readability.',
      json: 'Return the response as valid JSON only. No markdown code fences, no commentary before or after the JSON object.',
      table: 'Present the response as a markdown table.',
      bullets: 'Present the response as a flat bulleted list. No prose paragraphs.',
      plain: 'Return plain prose. No markdown, no bullet points, no headings.'
    };
    if (m[opts.outputStructure]) slots.format.push(m[opts.outputStructure]);
  }
  if (opts.examples && opts.examples.trim()) {
    slots.examples = slots.examples || [];
    slots.examples.push(opts.examples.trim());
  }
  return slots;
}

function joinSlot(lines) {
  return lines.join('\n\n');
}

/* --- Format renderers --- */

function renderXml(slots, order) {
  var out = [];
  order.forEach(function (slot) {
    if (!slots[slot]) return;
    var tag = SLOT_TAGS[slot];
    out.push('<' + tag + '>\n' + joinSlot(slots[slot]) + '\n</' + tag + '>');
  });
  return out.join('\n\n');
}

function renderMarkdown(slots, order) {
  var out = [];
  order.forEach(function (slot) {
    if (!slots[slot]) return;
    out.push('## ' + PF.SLOT_LABELS[slot] + '\n' + joinSlot(slots[slot]));
  });
  return out.join('\n\n');
}

function renderPlain(slots, order) {
  var out = [];
  order.forEach(function (slot) {
    if (!slots[slot]) return;
    var body = joinSlot(slots[slot]);
    if (slot === 'role') {
      out.push(body);
    } else if (slot === 'inputs') {
      out.push(PF.SLOT_LABELS[slot] + ':\n"""\n' + body + '\n"""');
    } else {
      out.push(PF.SLOT_LABELS[slot] + ': ' + body);
    }
  });
  return out.join('\n\n');
}

/* Image prompts want a dense descriptive line, not a structured document. */
function renderImage(template, values) {
  var parts = [];
  template.fields.forEach(function (f) {
    var v = values[f.key];
    if (isEmpty(v)) return;
    if (f.key === 'negative') return;
    if (f.key === 'ratio') return;
    parts.push(f.render ? f.render(v) : String(v).trim());
  });
  var main = parts.join(', ').replace(/\.,/g, ',').replace(/\.$/, '');
  var out = main;
  var neg = values.negative;
  if (!isEmpty(neg)) out += '\n\nNegative prompt: ' + neg.join(', ');
  var ratio = values.ratio;
  if (!isEmpty(ratio)) {
    var map = { 'Square 1:1': '1:1', 'Landscape 16:9': '16:9', 'Portrait 9:16': '9:16', 'Portrait 4:5': '4:5', 'Wide 21:9': '21:9' };
    out += '\n\nAspect ratio: ' + (map[ratio] || ratio);
  }
  return out;
}

/* "senior copywriter" / "act as a coach" -> "You are a senior copywriter." */
function normaliseRole(raw) {
  var r = raw.trim().replace(/^(you are|act as)\s+/i, '').replace(/\.$/, '');
  if (!/^(a|an|the)\s/i.test(r)) {
    r = (/^[aeiou]/i.test(r) ? 'an ' : 'a ') + r;
  }
  return 'You are ' + r + '.';
}

/* --- Public API --- */

PF.build = function (template, values, opts) {
  opts = opts || {};
  if (template.isImage) return renderImage(template, values);

  var slots = collectSlots(template, values);

  if (opts.role && opts.role.trim() && !slots.role) {
    slots.role = [opts.role.trim()];
  }
  slots = optionLines(opts, slots);

  if (slots.role) slots.role = slots.role.map(normaliseRole);

  var order = PF.SLOTS;
  var fmt = opts.format || 'xml';
  if (fmt === 'markdown') return renderMarkdown(slots, order);
  if (fmt === 'plain') return renderPlain(slots, order);
  return renderXml(slots, order);
};

/* Completeness score — nudges the user toward a stronger prompt. */
PF.score = function (template, values, opts) {
  opts = opts || {};
  var slots = collectSlots(template, values);

  /* Only judge a slot the user can actually fill — via a template field or an Advanced option. */
  var reachable = { role: true, examples: true, criteria: true, format: true, constraints: true };
  template.fields.forEach(function (f) { reachable[f.slot] = true; });

  function has(slot) { return !!slots[slot]; }

  var candidates = [
    { slot: 'task', ok: has('task'), label: 'A clear task', hint: 'Say exactly what you want done.' },
    { slot: 'context', ok: has('context'), label: 'Background context', hint: 'The AI cannot read your mind about your situation.' },
    { slot: 'role', ok: has('role') || !!(opts.role && opts.role.trim()), label: 'A role for the AI', hint: 'Assigning expertise measurably sharpens output.' },
    { slot: 'audience', ok: has('audience'), label: 'A defined audience', hint: 'Who is this for? It changes everything.' },
    { slot: 'constraints', ok: has('constraints'), label: 'Constraints or exclusions', hint: 'Telling it what NOT to do is high leverage.' },
    { slot: 'format', ok: has('format'), label: 'A specified output format', hint: 'Otherwise you get whatever shape it feels like.' },
    { slot: 'examples', ok: has('examples') || !!(opts.examples && opts.examples.trim()), label: 'An example of what good looks like', hint: 'One example beats three paragraphs of description.' },
    { slot: 'criteria', ok: has('criteria') || !!opts.noHallucinate || !!opts.reasoning, label: 'Quality guardrails', hint: 'Add reasoning or accuracy guardrails in Advanced.' }
  ];

  var checks = candidates.filter(function (c) { return reachable[c.slot]; });
  var passed = checks.filter(function (c) { return c.ok; }).length;
  return { checks: checks, passed: passed, total: checks.length, pct: Math.round((passed / checks.length) * 100) };
};

/* Substitute {{variables}} — lets a saved prompt act as a reusable template. */
PF.findVariables = function (text) {
  var out = [];
  var re = /\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g;
  var m;
  while ((m = re.exec(text)) !== null) {
    if (out.indexOf(m[1].trim()) === -1) out.push(m[1].trim());
  }
  return out;
};

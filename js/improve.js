/* The front-page prompt improver.
   Takes a rough, rambling prompt and turns it into a clearer one: strips
   filler and false starts, splits run-on speech into readable points, and
   spots what is actually missing. Runs entirely locally — no API, no key.

   Guiding rule: never pad. The output should contain the user's own meaning,
   better organised — not boilerplate they did not ask for. Anything extra
   (structure tags, guardrails) is opt-in on the result screen. */

window.PF = window.PF || {};

/* ---------- cleaning ---------- */

/* Verbal tics that carry no meaning in a written prompt. */
var FILLERS = [
  /\bor something\b/gi,
  /\band stuff\b/gi,
  /\band all that\b/gi,
  /\bbasically\b/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
  /\byou know\b/gi,
  /\bi mean\b/gi,
  /\bto be honest\b/gi,
  /\bum+\b/gi,
  /\buh+\b/gi
];

function collapseFalseStarts(text) {
  var out = text;

  /* "i want to So I want to use X" — the same phrase restarted. Keep the
     second, more complete attempt. */
  out = out.replace(/\b([\w']+(?:\s+[\w']+){1,3})[\s,]+(?:so|and|but|then)?\s*\1\b/gi, '$1');

  /* "For products, I want I'm still trying to…" — an abandoned clause
     immediately restarted with a new subject. */
  out = out.replace(/\b(?:i want|i need|i'd like|i think)\s+(?=i['’]?m\b|i am\b|i've\b|i\b)/gi, '');

  /* "And I use... and I want to use X" — a trailing-off fragment. Capture the
     preceding terminator and put it back, or the sentence before it gets
     swallowed and two separate points merge into one run-on. */
  out = out.replace(/([.!?]\s*|^)(?:and\s+|but\s+|so\s+)?[\w' ]{0,24}\.{2,}\s*/gi, '$1 ');

  return out;
}

function stripFillers(text) {
  var out = text;
  FILLERS.forEach(function (re) { out = out.replace(re, ' '); });
  /* Tidy the gaps the removals leave behind. */
  out = out.replace(/\s{2,}/g, ' ');
  out = out.replace(/\s+([,.!?;:])/g, '$1');
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\(\s*\)/g, '');
  return out;
}

/* Abbreviations whose full stop does not end a sentence. */
var ABBREV = /(^|\s)(e\.g|i\.e|etc|vs|approx|mr|mrs|ms|dr|prof|st|inc|ltd|co|fig|no)$/i;

/* Scanned rather than split by regex, because a naive split on "." tears
   "1.2%" into "1." and "2%" — silently corrupting the user's own figures,
   which is far worse than leaving two sentences joined. */
function splitSentences(text) {
  var chunks = [];
  var buf = '';

  for (var i = 0; i < text.length; i++) {
    var ch = text.charAt(i);
    buf += ch;
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;

    var next = text.charAt(i + 1);
    if (ch === '.') {
      if (/\d/.test(text.charAt(i - 1)) && /\d/.test(next)) continue;  /* 1.2 */
      if (ABBREV.test(buf.slice(0, -1))) continue;                     /* e.g. */
    }
    /* A real boundary is followed by whitespace or nothing at all. */
    if (!next || /\s/.test(next)) { chunks.push(buf); buf = ''; }
  }
  if (buf) chunks.push(buf);

  var out = [];
  chunks.forEach(function (s) {
    var t = s.replace(/\s+/g, ' ').trim();
    if (!t) return;
    /* Drop leftovers that are pure punctuation or a stray word. */
    if (!/[a-z0-9]/i.test(t)) return;
    out.push(t);
  });
  return out;
}

function tidySentence(s, dropLeadingConjunction) {
  var t = s.trim();
  if (dropLeadingConjunction) t = t.replace(/^(?:and|but|so|then|also)\s+/i, '');
  t = t.replace(/^[,;:\s]+/, '');
  /* "domain/ store name" -> "domain / store name" */
  t = t.replace(/\s*\/\s*/g, ' / ');
  if (!t) return '';
  t = t.charAt(0).toUpperCase() + t.slice(1);
  /* Speech-to-text often capitalises conjunctions mid-sentence. */
  t = t.replace(/(\S)\s+And\s+/g, '$1 and ').replace(/(\S)\s+But\s+/g, '$1 but ');
  /* Normalise common brand casing people type in lowercase. */
  t = t.replace(/\bwordpress\b/gi, 'WordPress')
       .replace(/\bwoocommerce\b/gi, 'WooCommerce')
       .replace(/\bwoopayments\b/gi, 'WooPayments')
       .replace(/\bshopify\b/gi, 'Shopify')
       .replace(/\baliexpress\b/gi, 'AliExpress')
       .replace(/\bcj drop ?shipping\b/gi, 'CJ Dropshipping')
       .replace(/\bi\b/g, 'I')
       .replace(/\bi'm\b/gi, "I'm")
       .replace(/\bi've\b/gi, "I've");
  if (!/[.!?]$/.test(t)) t += '.';
  return t;
}

/* Does the text actually ask for anything? A prompt full of context with no
   request is the most common reason output misses the mark. */
var INSTRUCTION_VERBS = /\b(writ(?:e|ing)|creat(?:e|ing)|build(?:ing)?|mak(?:e|ing)|design(?:ing)?|explain(?:ing)?|describ(?:e|ing)|compar(?:e|ing)|summaris(?:e|ing)|summariz(?:e|ing)|analys(?:e|ing)|analyz(?:e|ing)|review(?:ing)?|fix(?:ing)?|debug(?:ging)?|draft(?:ing)?|plan(?:ning)?|list(?:ing)?|suggest(?:ing)?|recommend(?:ing)?|give me|help me|tell me|show me|generat(?:e|ing)|rewrit(?:e|ing)|improv(?:e|ing)|translat(?:e|ing)|calculat(?:e|ing)|find(?:ing)?|research(?:ing)?|evaluat(?:e|ing)|critiqu(?:e|ing)|check(?:ing)?|link(?:ing)?|connect(?:ing)?|add(?:ing)?|updat(?:e|ing)|upload(?:ing)?|publish(?:ing)?|integrat(?:e|ing)|configur(?:e|ing)|set up|setting up|sync(?:ing)?|import(?:ing)?|export(?:ing)?|remov(?:e|ing)|delet(?:e|ing)|migrat(?:e|ing)|send(?:ing)?|shar(?:e|ing)|deploy(?:ing)?)\b/i;

function detectInstruction(text) {
  var t = text.trim();
  if (/\?\s*$/.test(t)) return true;
  /* "I need help writing X" is a request; "I want to use X" is only a
     preference, so bare "i want"/"i need" deliberately do not count. */
  if (/\b(can you|could you|please|help me|need help|i need you to|i want you to|your job is|looking for)\b/i.test(t)) return true;
  if (/\bi need (?:a|an|some|ideas|advice|help)\b/i.test(t)) return true;
  /* An instruction verb near the start reads as a request; the same verb
     buried at the end is usually just description. */
  var head = t.split(/\s+/).slice(0, 12).join(' ');
  return INSTRUCTION_VERBS.test(head);
}

/* Speech-to-text often runs an acknowledgment straight into the actual ask
   with a bare "now" and no punctuation ("I'm happy with the pricing for
   now, we can work with that now link the products") — split there so the
   instruction becomes its own sentence instead of being buried inside a
   context-only run-on. Deliberately skips "for now" (means "for the time
   being", not a pivot) and requires an instruction verb right after the
   split point, so it only fires when there is a real ask to surface. */
function splitPivotClauses(text) {
  var re = /\bnow\b/gi;
  var m;
  while ((m = re.exec(text))) {
    var before = text.slice(0, m.index);
    var after = text.slice(m.index + 3);
    if (/for\s*$/i.test(before)) continue;
    if (before.trim().split(/\s+/).length < 4) continue;
    if (/[.!?]\s*$/.test(before.trim())) continue;
    var afterTrim = after.replace(/^[,\s]+/, '');
    var head = afterTrim.split(/\s+/).slice(0, 8).join(' ');
    if (INSTRUCTION_VERBS.test(head)) {
      return before.replace(/\s+$/, '').replace(/,\s*$/, '') + '. Now ' + afterTrim;
    }
  }
  return text;
}

/* Full clean: returns the tidied sentences plus what is missing. */
PF.cleanPrompt = function (raw) {
  var text = String(raw || '').replace(/\s+/g, ' ').trim();
  var working = stripFillers(collapseFalseStarts(text));
  working = splitPivotClauses(working);

  var sentences = splitSentences(working)
    .map(function (s, i) { return tidySentence(s, i > 0); })
    .filter(Boolean);

  /* detectInstruction only looks at the first 12 words, so a pivot
     instruction split out further down the sentence list can be missed at
     the whole-text level even though it clearly reads as a request. */
  var hasInstruction = detectInstruction(text);
  if (!hasInstruction) {
    for (var i = 0; i < sentences.length; i++) {
      if (detectInstruction(sentences[i])) { hasInstruction = true; break; }
    }
  }

  return {
    original: text,
    sentences: sentences,
    hasInstruction: hasInstruction,
    /* Rambling input reads far better broken up than as a wall of prose. */
    asBullets: sentences.length >= 3,
    changed: sentences.join(' ') !== text
  };
};

/* ---------- classification (only a suggestion now) ---------- */

PF.IMPROVE_KEYWORDS = {
  'marketing-copy': ['marketing', 'advert', 'advertisement', 'ad copy', 'landing page', 'headline', 'sales page', 'promo', 'promotion', 'campaign', 'product description', 'call to action', 'conversion', 'value proposition', 'case study'],
  email: ['email', 'e-mail', 'reply to', 'respond to', 'follow up', 'follow-up', 'inbox', 'message to', 'letter to', 'invoice', 'apologise to'],
  'content-writing': ['blog', 'article', 'newsletter', 'essay', 'long form', 'long-form', 'seo', 'write about'],
  coding: ['code', 'function', 'script', 'program', 'implement', 'api', 'component', 'algorithm', 'typescript', 'javascript', 'python', 'react', 'sql query'],
  debug: ['bug', 'error', 'broken', 'not working', 'debug', 'stack trace', 'traceback', 'exception', 'crash', 'crashing', 'why is my', 'fix this', 'fix my', 'review my code', 'refactor', 'too slow', 'optimise', 'optimize', 'throwing'],
  analysis: ['analyse', 'analyze', 'analysis', 'spreadsheet', 'csv', 'metrics', 'trends', 'statistics', 'figures', 'churn', 'forecast', 'profitable'],
  summarise: ['summarise', 'summarize', 'summary', 'tldr', 'tl;dr', 'condense', 'shorten', 'key points', 'transcript'],
  support: ['complaint', 'refund', 'support ticket', 'angry customer', 'unhappy customer', 'unhappy client', 'customer who', 'wants a refund', 'apologise for', 'service failure', 'chargeback'],
  meeting: ['meeting', 'minutes', 'action items', 'standup', 'stand-up', 'meeting notes', 'attendees'],
  career: ['cv', 'resume', 'cover letter', 'job application', 'interview', 'linkedin profile', 'hiring manager', 'recruiter', 'job advert'],
  learn: ['explain', 'teach me', 'eli5', 'walk me through', 'help me grasp', 'in simple terms'],
  brainstorm: ['brainstorm', 'ideas for', 'come up with', 'creative ways'],
  social: ['linkedin post', 'tweet', 'instagram', 'tiktok', 'social media', 'caption', 'hashtag', 'threads post', 'facebook post'],
  research: ['compare', 'comparison', 'versus', ' vs ', 'which should i', 'best tool', 'shortlist', 'pros and cons'],
  image: ['image', 'picture', 'photo', 'illustration', 'midjourney', 'dall-e', 'dalle', 'stable diffusion', 'artwork', 'render of', 'logo', 'poster', 'thumbnail']
};

var STARTERS = {
  learn: ['what is', 'what are', 'what does', 'how does', 'how do', 'why does', 'why do', 'why is', 'explain'],
  summarise: ['summarise', 'summarize', 'tldr'],
  brainstorm: ['ideas for', 'ways to'],
  research: ['compare', 'which should']
};

/* A single generic word is not enough to commit to a specialised template —
   that is how "still trying to optimize" became a debugging prompt. */
var MIN_TEMPLATE_SCORE = 4;

function scoreTemplate(text, id) {
  var words = PF.IMPROVE_KEYWORDS[id] || [];
  var score = 0;
  for (var i = 0; i < words.length; i++) {
    if (text.indexOf(words[i]) !== -1) score += words[i].indexOf(' ') !== -1 ? 3 : 1;
  }
  var starters = STARTERS[id] || [];
  var head = text.replace(/^\s+/, '');
  for (var j = 0; j < starters.length; j++) {
    if (head.indexOf(starters[j]) === 0) { score += 3; break; }
  }
  return score;
}

PF.classify = function (text) {
  var t = ' ' + String(text || '').toLowerCase() + ' ';
  var best = null, bestScore = 0;
  Object.keys(PF.IMPROVE_KEYWORDS).forEach(function (id) {
    var s = scoreTemplate(t, id);
    if (s > bestScore) { bestScore = s; best = id; }
  });

  var strong = bestScore >= MIN_TEMPLATE_SCORE;
  return {
    templateId: strong ? best : null,
    suggestion: best,
    score: bestScore,
    confident: strong
  };
};

/* ---------- questions ---------- */

/* Generic and template-agnostic. The improver's job is to sharpen what the
   user wrote, so it asks about universal gaps rather than template fields.
   Anyone wanting the full field set can open the builder from the result. */
var QUESTIONS = [
  {
    key: 'instruction',
    label: 'What do you actually want the AI to do with this?',
    why: 'Your prompt describes the situation but never makes a request, so the model has to guess. This is the single biggest thing holding it back.',
    chips: ['Review it and flag problems', 'Give me step-by-step instructions', 'Compare it against alternatives', 'Answer my questions about it'],
    placeholder: 'e.g. review this plan and tell me what I have missed',
    askIf: function (session) { return !session.clean.hasInstruction; }
  },
  {
    key: 'audience',
    label: 'Who is the answer for?',
    why: 'Audience changes vocabulary and depth more than any other single detail.',
    chips: ['Just me', 'A complete beginner', 'My team', 'Customers', 'Technical experts'],
    placeholder: 'e.g. someone with no technical background'
  },
  {
    key: 'format',
    label: 'How should the answer be laid out?',
    why: 'Specify the shape or you get whatever the model feels like producing.',
    chips: ['A short summary', 'Numbered steps', 'A comparison table', 'Bullet points', 'Detailed prose'],
    placeholder: 'e.g. a table, then a one-line recommendation'
  },
  {
    key: 'avoid',
    label: 'Anything it should avoid?',
    why: 'Negative constraints are one of the highest-leverage things you can add.',
    chips: ['No jargon', 'No filler or preamble', 'Do not invent facts', 'Keep it short'],
    placeholder: 'e.g. no marketing speak, do not suggest paid tools'
  }
];

var MAX_QUESTIONS = 4;

/* "give me 20 youtube video ideas" -> "20". Deliberately requires a countable
   noun so "a 500 word article" and "2 week trip" are not mistaken for counts. */
var COUNTABLE = /\b(\d{1,3})\s+(?:\w+\s+){0,3}?(ideas|options|names|examples|versions|variations|suggestions|tips|ways|prompts|questions|headlines|captions|subject lines|posts|bullet points)\b/i;

function statedQuantity(raw) {
  var m = String(raw || '').match(COUNTABLE);
  return m ? m[1] : null;
}

PF.startImprove = function (text) {
  var raw = String(text || '').trim();
  var clean = PF.cleanPrompt(raw);
  var match = PF.classify(raw);

  var session = {
    raw: raw,
    clean: clean,
    templateId: match.templateId,
    suggestion: match.suggestion,
    confident: match.confident,
    answers: {},
    askedCount: 0,
    maxQuestions: MAX_QUESTIONS,
    done: false,
    /* Both off by default: the user asked for their prompt improved, not
       decorated. They can switch these on from the result screen. */
    structured: false,
    guardrails: false,
    /* Accumulated from follow-up refinements. */
    extraRequirements: [],
    removedRequirements: [],
    /* If the user already said how many they want, that beats the pack's
       default — otherwise "give me 20 video ideas" produces a prompt whose
       requirements then demand 12, contradicting the request. */
    countOverride: statedQuantity(raw),
    lengthPref: null,
    tone: null
  };

  session.queue = QUESTIONS.filter(function (q) {
    return !q.askIf || q.askIf(session);
  }).slice();

  return session;
};

PF.nextQuestion = function (session) {
  if (session.done || session.askedCount >= session.maxQuestions || !session.queue.length) return null;
  var q = session.queue[0];
  return {
    key: q.key,
    label: q.label,
    why: q.why,
    chips: q.chips || [],
    placeholder: q.placeholder || '',
    remaining: session.queue.length
  };
};

PF.answerImprove = function (session, question, answer) {
  var text = answer === null || answer === undefined ? '' : String(answer).trim();
  if (text) session.answers[question.key] = text;
  session.queue.shift();
  session.askedCount++;
  if (!session.queue.length || session.askedCount >= session.maxQuestions) session.done = true;
  return session;
};

PF.finishImprove = function (session) {
  session.done = true;
  return session;
};

/* ---------- intent packs ----------
   The actual value of the improver. A vague request is weak not because it is
   badly worded but because it leaves out the requirements that make that
   *kind* of task come out well. Each pack encodes what an expert would add.

   `askFor` entries carry a tag; anything the user already answered is dropped
   so the prompt never asks for something it has been told. */

var GENERIC_PACK = {
  id: 'generic',
  requirements: [
    'Be specific and concrete. Avoid advice so general it would apply to anyone.',
    'Where you are uncertain, say so plainly instead of guessing.',
    'Lead with what matters most rather than working up to it.'
  ],
  askFor: [
    { tag: 'audience', text: 'who this is for' },
    { tag: 'goal', text: 'what a good result would look like to me' }
  ]
};

PF.INTENT_PACKS = [
  {
    id: 'naming',
    label: 'naming',
    test: /\b(name ideas|names for|store name|business name|brand name|domain name|company name|product name|what should i call|naming)\b/i,
    requirements: [
      'Give me 20 options, grouped by approach: descriptive, invented or coined, metaphorical, compound, and playful.',
      'For each name, add one short line on why it works.',
      'Prioritise names that are easy to spell after hearing them once and easy to say aloud.',
      'Flag anything that is obviously an existing well-known brand.',
      'For your top five, suggest realistic domain options — and state plainly that you cannot verify availability.'
    ],
    askFor: [
      { tag: 'subject', text: 'what the store actually sells' },
      { tag: 'audience', text: 'who the target customer is' },
      { tag: 'tone', text: 'the tone I want (playful, premium, plain, technical)' },
      { tag: 'avoid', text: 'any words, styles or languages to avoid' }
    ]
  },
  {
    id: 'ideation',
    label: 'idea generation',
    test: /\b(ideas|brainstorm|suggestions|ways to|come up with|think of|options for)\b/i,
    requirements: [
      'Give 12 ideas, deliberately spread across the risk spectrum: several safe and immediately doable, several moderately ambitious, and at least two genuinely unconventional.',
      'Each idea must be distinct — no variations on the same underlying idea.',
      'For each: the idea in one line, why it could work, estimated effort (low/medium/high) and estimated impact (low/medium/high).',
      'Skip anything so obvious I have certainly already considered it.'
    ],
    askFor: [
      { tag: 'situation', text: 'my situation, budget and time constraints' },
      { tag: 'tried', text: 'what I have already tried or ruled out' }
    ]
  },
  {
    id: 'image',
    label: 'image prompt',
    test: /\b(midjourney|dall-?e|stable diffusion|image prompt|logo prompt|logo design|logo for|illustration of|artwork of|poster of|thumbnail for|render of|photo of|picture of|image of)\b/i,
    requirements: [
      'Give the prompt as a single dense descriptive line, not a paragraph of prose.',
      'Cover subject, setting, composition, lighting, colour palette and style — in that order.',
      'Name a specific medium or art style rather than vague quality words like "high quality" or "4k".',
      'Add a negative prompt listing what to exclude.',
      'Suggest an aspect ratio and say which tool the phrasing suits.'
    ],
    askFor: [
      { tag: 'purpose', text: 'what the image is for (logo, hero image, print, thumbnail)' },
      { tag: 'tone', text: 'the mood or brand feel I am after' }
    ]
  },
  {
    id: 'compare',
    label: 'comparison',
    test: /\b(compar(?:e|ing|ison)|versus|\bvs\b|which should i|which is better|what'?s the best|what is the best|best .{0,20}for|recommend (?:a|an|the best)|pros and cons|shortlist)\b/i,
    requirements: [
      'Produce a comparison table first, then a written recommendation.',
      'Commit to one recommendation. Give the main reason to choose it and the strongest argument against it. Do not hedge with "it depends".',
      'Include the option most people overlook, if there is one.',
      'Where pricing, features or availability may have changed since your training data, say so explicitly rather than stating it as current fact.'
    ],
    askFor: [
      { tag: 'situation', text: 'my budget and scale' },
      { tag: 'criteria', text: 'which criteria matter most to me' }
    ]
  },
  {
    id: 'debug',
    label: 'debugging',
    test: /\b(bug|error|broken|not working|debug(?:ging)?|crash(?:ing)?|stack trace|exception|fix(?:ing)? this|fix(?:ing)? my|why is my)\b/i,
    requirements: [
      'Identify the root cause. Do not just supply a patch that makes the symptom disappear.',
      'Explain why the bug produces this specific symptom.',
      'If you are uncertain, say so and list exactly what extra information would confirm the diagnosis.',
      'Give the corrected code and mark clearly what changed.'
    ],
    askFor: [
      { tag: 'error', text: 'the exact error message or stack trace' },
      { tag: 'tried', text: 'what I have already tried' },
      { tag: 'env', text: 'the language, runtime and versions' }
    ]
  },
  {
    id: 'code',
    label: 'code writing',
    test: /\b(write|build|create|implement|make)\b.{0,30}\b(code|function|script|program|component|class|api|query|app)\b/i,
    requirements: [
      'Write complete, runnable code. No placeholder comments like "// implementation here".',
      'Handle the obvious edge cases: empty input, malformed input and boundary values.',
      'Explain the approach in a few sentences first, then keep comments inside the code minimal.',
      'If there is a significantly simpler approach than the one I described, say so before writing anything.'
    ],
    askFor: [
      { tag: 'lang', text: 'the language, framework and version' },
      { tag: 'conventions', text: 'any existing code or conventions to match' }
    ]
  },
  {
    id: 'feature',
    label: 'software change',
    test: /\b(make it so|add (?:a |the )?(?:feature|ability|option|button)|so that the user can|allow the user to|add the ability|implement|refactor so|change it so|support for)\b/i,
    requirements: [
      'Explain the approach before writing any code, and flag any design decision that has a real tradeoff.',
      'Tell me which existing files or functions need to change, and roughly how much.',
      'Point out edge cases and failure modes I have not mentioned.',
      'If this interacts badly with existing behaviour, say so rather than silently working around it.',
      'Keep the change as small as it can be while still being correct.'
    ],
    askFor: [
      { tag: 'code', text: 'the relevant existing code or file structure' },
      { tag: 'constraints', text: 'anything I must not break' }
    ]
  },
  {
    /* social and writing sit here, ahead of explain/review/summarise/analyse/
       plan, because those five now match on gerunds ("explaining",
       "reviewing", "summarising"...) that commonly appear as a subordinate
       clause inside a request that is really asking for something to be
       written — "write an email explaining X" is a writing task, not a
       request to have X explained. social has to stay ahead of writing in
       turn, or "write me an instagram caption" loses to the generic pack. */
    id: 'social',
    label: 'social post',
    test: /\b(instagram|linkedin|tiktok|twitter|tweet|facebook|threads post|social media|caption|hashtag|reel)\b/i,
    requirements: [
      'Match the native conventions, length and rhythm of that platform — not copy that could be pasted anywhere.',
      'The first line has to earn the second. Open with a specific, concrete hook.',
      'Give me three versions with different hooks, clearly labelled.',
      'No "in today\'s fast-paced world", no engagement-bait questions, no emoji bullet lists.'
    ],
    askFor: [
      { tag: 'audience', text: 'who I am trying to reach' },
      { tag: 'goal', text: 'whether I want clicks, replies or just awareness' }
    ]
  },
  {
    id: 'writing',
    label: 'writing',
    test: /\b(writ(?:e|ing)|draft(?:ing)?|rewrit(?:e|ing)|compos(?:e|ing))\b/i,
    requirements: [
      'Write the piece itself. No preamble and no explanation of what you are about to do.',
      'Open with something specific and concrete — no throat-clearing, no "in today\'s world".',
      'Vary sentence length, and do not fall into a three-item list in every paragraph.',
      'Give me two versions taking different angles, clearly labelled.'
    ],
    askFor: [
      { tag: 'audience', text: 'who the reader is' },
      { tag: 'format', text: 'the tone and length I want' }
    ]
  },
  {
    id: 'explain',
    label: 'explanation',
    test: /\b(explain(?:ing)?|teach me|help me understand|what is|what are|how does|how do|why does|eli5|walk me through)\b/i,
    requirements: [
      'Assume no prior knowledge of the jargon, but do not talk down to me.',
      'Ground every abstract point in a concrete everyday example.',
      'Lead with the single most important idea, then build outward from it.',
      'Flag the common misconception people have about this.',
      'End with three short questions I can answer to check I actually understood it.'
    ],
    askFor: [
      { tag: 'level', text: 'what I already know about this' },
      { tag: 'goal', text: 'why I need to know it' }
    ]
  },
  {
    id: 'review',
    label: 'review',
    test: /\b(review(?:ing)?|critiqu(?:e|ing)|feedback on|what do you think of|improve my|check my|roast)\b/i,
    requirements: [
      'Be direct. Lead with the most serious problem, not the easiest compliment.',
      'For each issue: what is wrong, why it matters, and a specific fix.',
      'Separate genuine problems from matters of taste, and say which is which.',
      'If something genuinely works, say so briefly — but do not pad with praise.'
    ],
    askFor: [
      { tag: 'purpose', text: 'what this is for and who will see it' },
      { tag: 'worry', text: 'what I am most worried about' }
    ]
  },
  {
    id: 'summarise',
    label: 'summarising',
    test: /\b(summaris(?:e|ing)|summariz(?:e|ing)|summary|tldr|condense|key points|shorten)\b/i,
    requirements: [
      'Use only what is in the source. Do not add outside knowledge or inference.',
      'Lead with the single most important takeaway in one sentence.',
      'Preserve specifics — names, numbers, dates and commitments. Those are usually what matters.',
      'Note anything left ambiguous or unresolved rather than smoothing over it.'
    ],
    askFor: [
      { tag: 'source', text: 'the text to summarise' },
      { tag: 'audience', text: 'who the summary is for' }
    ]
  },
  {
    id: 'analyse',
    label: 'analysis',
    test: /\b(analys(?:e|ing)|analyz(?:e|ing)|analysis|work out why|what does this data|interpret)\b/i,
    requirements: [
      'State your assumptions explicitly before drawing any conclusions.',
      'Flag any conclusion the data does not firmly support.',
      'Lead with the finding that changes a decision, not the most obvious one.',
      'If the data is insufficient to answer the question, say so rather than speculating.'
    ],
    askFor: [
      { tag: 'data', text: 'the data itself' },
      { tag: 'meaning', text: 'what each column means and the period it covers' },
      { tag: 'decision', text: 'what decision this informs' }
    ]
  },
  {
    id: 'plan',
    label: 'planning',
    test: /\b(plan(?:ning)?|roadmap|strategy|steps to|how do i start|set(?:ting)? up|launch(?:ing)?|checklist)\b/i,
    requirements: [
      'Give concrete steps in order, with a rough time estimate for each.',
      'Flag dependencies — what has to happen before what.',
      'Identify the single most likely point of failure and how to de-risk it.',
      'Mark anything I could skip or defer if I am short on time or money.'
    ],
    askFor: [
      { tag: 'deadline', text: 'my deadline and budget' },
      { tag: 'resources', text: 'what resources, skills or people I have' },
      { tag: 'done', text: 'what I have already done' }
    ]
  }
];

PF.detectIntent = function (text) {
  var t = String(text || '');
  for (var i = 0; i < PF.INTENT_PACKS.length; i++) {
    if (PF.INTENT_PACKS[i].test.test(t)) return PF.INTENT_PACKS[i];
  }
  return GENERIC_PACK;
};

/* ---------- composing the improved prompt ---------- */

var GUARDRAILS = [
  'Think it through step by step before answering.',
  'If you are unsure about something, say so rather than guessing. Do not invent facts, figures or sources.',
  'If anything above is unclear, ask me before proceeding.'
];

function contextBlock(session) {
  var c = session.clean;
  if (!c.sentences.length) return '';
  if (c.asBullets) {
    return c.sentences.map(function (s) { return '- ' + s; }).join('\n');
  }
  return c.sentences.join(' ');
}

/* The user's own request, cleaned. When their text is one sentence it *is* the
   task; when it rambles, the first sentence leads and the rest becomes context. */
function taskAndContext(session) {
  var a = session.answers;
  var c = session.clean;

  if (a.instruction) {
    return { task: a.instruction, context: contextBlock(session) };
  }
  if (!c.sentences.length) return { task: '', context: '' };
  if (c.sentences.length === 1) return { task: c.sentences[0], context: '' };
  if (c.hasInstruction) {
    /* The instruction is not always the first sentence — a run-on often
       leads with context and pivots to the ask partway through. Pull out
       whichever sentences actually read as a request; the rest is context. */
    var taskSentences = [], contextSentences = [];
    c.sentences.forEach(function (s) {
      (detectInstruction(s) ? taskSentences : contextSentences).push(s);
    });
    if (!taskSentences.length) { taskSentences = [c.sentences[0]]; contextSentences = c.sentences.slice(1); }
    return {
      task: taskSentences.join(' '),
      context: contextSentences.map(function (s) { return '- ' + s; }).join('\n')
    };
  }
  /* No request anywhere — it is all context. */
  return { task: '', context: contextBlock(session) };
}

/* Drop anything the user has already told us. */
function openQuestions(pack, session) {
  var a = session.answers;
  return (pack.askFor || []).filter(function (item) {
    if (item.tag === 'audience' && a.audience) return false;
    if (item.tag === 'format' && a.format) return false;
    if ((item.tag === 'avoid' || item.tag === 'tone') && a.avoid) return false;
    return true;
  });
}

/* A detailed, clearly-worded prompt does not need a list of questions bolted
   on — being told to stop and ask "who is this for?" about a self-contained
   task just costs the user a round trip. Below the threshold the list earns
   its place; above it, a single fallback line does the same job. */
function needsClarifyList(session) {
  if (!session.clean.hasInstruction) return true;
  return session.raw.split(/\s+/).length < 14;
}

/* Pack requirements plus everything the user has since asked for. */
function effectiveRequirements(session, pack) {
  var a = session.answers;
  var reqs = (pack.requirements || []).slice();

  if (session.removedRequirements.length) {
    reqs = reqs.filter(function (r) {
      var lower = r.toLowerCase();
      for (var i = 0; i < session.removedRequirements.length; i++) {
        if (lower.indexOf(session.removedRequirements[i]) !== -1) return false;
      }
      return true;
    });
  }

  /* "give me 10 instead of 20" — rewrite the first requirement that carries a
     quantity rather than appending a contradictory second instruction. */
  if (session.countOverride) {
    for (var i = 0; i < reqs.length; i++) {
      if (/\d+/.test(reqs[i])) { reqs[i] = reqs[i].replace(/\b\d+\b/, session.countOverride); break; }
    }
  }

  if (a.format) reqs.push('Format: ' + a.format + '.');
  if (a.audience) reqs.push('Audience: ' + a.audience + '.');
  if (session.tone) reqs.push('Tone: ' + session.tone + '.');
  if (a.avoid) reqs.push('Avoid: ' + a.avoid + '.');
  if (session.lengthPref === 'shorter') reqs.push('Keep it tight — no padding, and no more than a couple of sentences per point.');
  if (session.lengthPref === 'longer') reqs.push('Go into real depth on each point rather than summarising.');

  session.extraRequirements.forEach(function (r) { reqs.push(r); });
  return reqs;
}

PF.composeImproved = function (session) {
  var a = session.answers;
  var pack = PF.detectIntent(session.raw + ' ' + (a.instruction || ''));
  var tc = taskAndContext(session);
  var asks = openQuestions(pack, session);
  var parts = [];
  var reqs = effectiveRequirements(session, pack);

  var listAsks = asks.length && needsClarifyList(session);
  var fallbackAsk = 'If anything here is ambiguous, ask me before starting rather than assuming.';

  if (session.structured) {
    if (tc.task) parts.push('<task>\n' + tc.task + '\n</task>');
    if (tc.context) parts.push('<context>\n' + tc.context + '\n</context>');
    if (reqs.length) parts.push('<requirements>\n' + reqs.map(function (r) { return '- ' + r; }).join('\n') + '\n</requirements>');
    if (listAsks) {
      parts.push('<clarify_first>\nBefore you begin, ask me:\n' +
        asks.map(function (q) { return '- ' + q.text; }).join('\n') + '\n</clarify_first>');
    } else if (asks.length) {
      parts.push('<clarify_first>\n' + fallbackAsk + '\n</clarify_first>');
    }
    if (session.guardrails) parts.push('<success_criteria>\n' + GUARDRAILS.join('\n') + '\n</success_criteria>');
    return parts.join('\n\n');
  }

  if (tc.task) parts.push(tc.task);
  if (tc.context) parts.push((tc.task ? 'Context:\n' : '') + tc.context);
  if (reqs.length) parts.push('Requirements:\n' + reqs.map(function (r) { return '- ' + r; }).join('\n'));
  if (listAsks) {
    parts.push('Before you begin, ask me:\n' + asks.map(function (q) { return '- ' + q.text; }).join('\n'));
  } else if (asks.length) {
    parts.push(fallbackAsk);
  }
  if (session.guardrails) parts.push(GUARDRAILS.join('\n'));

  return parts.join('\n\n');
};

/* What the improver actually did, for an honest summary line. */
PF.improveReport = function (session) {
  var notes = [];
  var c = session.clean;
  var a = session.answers;
  var pack = PF.detectIntent(session.raw + ' ' + (a.instruction || ''));
  var asks = openQuestions(pack, session);

  if (c.changed) notes.push('tidied filler and false starts');
  if (c.asBullets && c.sentences.length >= 3) notes.push('split into ' + c.sentences.length + ' clear points');
  if (pack.requirements && pack.requirements.length) {
    notes.push('added ' + pack.requirements.length + ' ' + (pack.label || 'task') + ' requirements');
  }
  if (asks.length && needsClarifyList(session)) notes.push('told it to ask ' + asks.length + ' things first');
  if (a.instruction) notes.push('added an explicit request');
  if (a.audience) notes.push('named the audience');
  if (a.format) notes.push('specified the output format');
  if (a.avoid) notes.push('added constraints');

  return {
    notes: notes,
    intent: pack.id,
    intentLabel: pack.label || null,
    /* The flaw worth flagging even when every question was skipped. */
    missingInstruction: !c.hasInstruction && !a.instruction,
    suggestion: session.suggestion,
    words: { before: session.raw.split(/\s+/).length, after: PF.composeImproved(session).split(/\s+/).length }
  };
};

/* ---------- follow-up: refine, or start again ---------- */

/* Openers that unambiguously operate on the prompt we already have. */
var REFINE_OPENERS = /^(also|and|add|remove|delete|drop|take out|get rid of|make it|change|set|use|include|exclude|instead|shorter|longer|more|less|fewer|no |not |don'?t|do not|without|avoid|keep|swap|replace)\b/i;

/* Openers that begin a fresh request rather than adjust the current one. */
var NEW_STARTERS = /^(write|create|build|make|design|explain|describe|compare|summarise|summarize|analyse|analyze|review|fix|debug|draft|plan|suggest|recommend|generate|rewrite|translate|research|help me|give me|i need|i want|can you)\b/i;

/* Words that mean "adjust what you just gave me", whatever the sentence shape. */
var TWEAK_WORDS = /\b(shorter|longer|more detail|fewer|table|bullets?|json|markdown|formal|casual|playful|concise)\b/i;

/* Is this a tweak to the current prompt, a brand-new prompt, or a question? */
PF.classifyFollowUp = function (session, text) {
  var t = String(text || '').trim();
  if (!t) return 'refine';
  var words = t.split(/\s+/).length;

  if (REFINE_OPENERS.test(t)) return 'refine';
  if (/\binstead\b/i.test(t)) return 'refine';
  /* "how do I make it shorter" is a request, not a question about the tool. */
  if (TWEAK_WORDS.test(t) && words <= 12) return 'refine';

  /* A question about the tool's own choices. */
  if (/^(why|what|how)\b/i.test(t) &&
      /\b(you|your|this|that|it|prompt|requirement|ask|added|xml|structure|tags?|guardrail|toggle|mean|does|do)\b/i.test(t) &&
      words <= 16) {
    return 'question';
  }

  /* A fresh request: an instruction verb leading the sentence, with enough
     substance behind it that it is not just an adjustment. Checked before the
     pronoun rule, or "summarise this article" reads as a tweak because of
     the word "this". */
  if (NEW_STARTERS.test(t) && words >= 5) return 'new';

  /* Short and pointing back at what we already produced. */
  if (/\b(it|this|that|the prompt)\b/i.test(t) && words < 14) return 'refine';
  if (words >= 15) return 'new';

  return 'refine';
};

/* Apply a refinement. Returns plain-English descriptions of what changed so
   the chat can say what it did rather than silently mutating the prompt. */
PF.applyRefinement = function (session, raw) {
  var t = String(raw || '').trim();
  /* Nothing meaningful to act on — never append punctuation as a requirement. */
  if (!/[a-z0-9]/i.test(t)) return [];
  var lower = t.toLowerCase();
  var changed = [];

  var countMatch = lower.match(/\b(\d{1,3})\b/);
  if (countMatch && /\b(instead|only|just|give me|make it|options|ideas|names|examples|versions|variations)\b/.test(lower)) {
    session.countOverride = countMatch[1];
    changed.push('changed the quantity to ' + countMatch[1]);
  }

  if (/\b(shorter|concise|brief|trim|cut it down|too long)\b/.test(lower)) {
    session.lengthPref = 'shorter';
    changed.push('asked for a tighter response');
  } else if (/\b(longer|more detail|expand|in depth|in-depth|thorough)\b/.test(lower)) {
    session.lengthPref = 'longer';
    changed.push('asked for more depth');
  }

  var toneM = t.match(/\b(?:more |less )?(?:formal|informal|casual|professional|friendly|playful|serious|technical|simple|blunt|warm)\b/i);
  if (toneM) {
    session.tone = toneM[0].toLowerCase();
    changed.push('set the tone to ' + session.tone);
  }

  var fmtM = lower.match(/\b(table|bullet points|bullets|json|markdown|numbered list|numbered steps|prose|paragraphs)\b/);
  if (fmtM) {
    session.answers.format = fmtM[0];
    changed.push('set the output format to ' + fmtM[0]);
  }

  /* Only read an audience when the sentence is actually about one. */
  if (/^for\b/i.test(t) || /\b(audience|aimed at|targeting|readers are)\b/i.test(t)) {
    var audM = t.match(/\b(?:for|aimed at|targeting|audience is|readers are)\s+((?:a |an |my |the )?[\w][\w' -]{2,40})/i);
    if (audM) {
      session.answers.audience = audM[1].trim().replace(/[.,]$/, '');
      changed.push('set the audience to ' + session.answers.audience);
    }
  }

  if (/^(avoid|don'?t|do not|never|without|no)\b/i.test(t) || /\bavoid\b/i.test(t)) {
    var avoidM = t.match(/\b(?:avoid|don'?t|do not|never|without|no)\s+(.{3,70})/i);
    if (avoidM) {
      var clause = avoidM[1].trim().replace(/[.]$/, '');
      session.answers.avoid = session.answers.avoid ? session.answers.avoid + '; ' + clause : clause;
      changed.push('added a constraint');
    }
  }

  var remM = t.match(/^(?:remove|delete|drop|take out|get rid of)\s+(?:the\s+)?(.{3,50})/i);
  if (remM) {
    var key = remM[1].toLowerCase().replace(/\b(requirement|line|bit|part|point|about)\b/g, '').trim();
    if (key) {
      session.removedRequirements.push(key);
      changed.push('removed the requirement about ' + key);
    }
  }

  /* Anything we could not parse still has value as a literal requirement —
     better than dropping the user's instruction on the floor. */
  if (!changed.length) {
    var extra = t.replace(/^(also|and|add|please)\s+/i, '');
    extra = extra.charAt(0).toUpperCase() + extra.slice(1);
    if (!/[.!?]$/.test(extra)) extra += '.';
    session.extraRequirements.push(extra);
    changed.push('added that as a requirement');
  }

  return changed;
};

/* Short answers to "why did you add that?" style questions. */
PF.answerFollowUp = function (session, text) {
  var t = String(text || '').toLowerCase();
  var pack = PF.detectIntent(session.raw + ' ' + (session.answers.instruction || ''));

  if (/\b(xml|structure|tags?)\b/.test(t)) {
    return 'XML tags wrap each part of the prompt in labelled sections. Claude follows them closely, and they make a long prompt easier to edit later. For a short prompt they are usually unnecessary — that is why the toggle is off by default.';
  }
  if (/\b(guardrail|step by step|invent|hallucinat)\b/.test(t)) {
    return 'The guardrails add step-by-step reasoning and an instruction not to invent facts. They help on factual or analytical work and get in the way on creative work, so they are opt-in.';
  }
  if (/\b(ask|question|clarify)\b/.test(t)) {
    return 'Telling the model to ask before it starts stops it guessing at things only you know. Answer them here instead and I will fold them into the prompt directly.';
  }
  return 'Those requirements come from what generally makes a ' + (pack.label || 'task like this') +
    ' come out well — things people usually leave out. Remove any you do not want: just say "remove the bit about X".';
};

/* Hand off to the full builder, mapping what we have onto blank's fields. */
PF.improveHandoff = function (session) {
  var a = session.answers;
  return {
    templateId: session.templateId || 'blank',
    label: 'From your prompt',
    values: {
      task: a.instruction || session.clean.sentences.join(' '),
      context: a.instruction ? contextBlock(session) : '',
      audience: a.audience || '',
      format: a.format || '',
      avoid: a.avoid || ''
    },
    opts: { format: 'xml', reasoning: false, noHallucinate: false, outputStructure: 'none', role: '', examples: '' }
  };
};

/* Prompt template definitions.
   Each field declares a `slot` telling the builder which prompt section it feeds. */

window.PF = window.PF || {};

PF.SLOTS = ['role', 'task', 'context', 'inputs', 'audience', 'constraints', 'tone', 'format', 'examples', 'criteria'];

PF.SLOT_LABELS = {
  role: 'Role',
  task: 'Task',
  context: 'Context',
  inputs: 'Input',
  audience: 'Audience',
  constraints: 'Constraints',
  tone: 'Tone and style',
  format: 'Output format',
  examples: 'Examples',
  criteria: 'Success criteria'
};

var TONES = ['Professional', 'Friendly and warm', 'Direct and concise', 'Persuasive', 'Authoritative', 'Casual and conversational', 'Empathetic', 'Playful', 'Academic', 'Neutral and factual'];

var LENGTHS = ['As short as possible', 'Around 100 words', 'Around 250 words', 'Around 500 words', 'Around 1000 words', 'As long as needed'];

/* Strip a trailing full stop so renderers that append their own punctuation
   do not produce "…if they prefer.. Do not promise anything beyond this." */
function trimDot(v) {
  return String(v).trim().replace(/[.\s]+$/, '');
}

/* Fields reused across several templates. */
function toneField(def) {
  return {
    key: 'tone', label: 'Tone of voice', type: 'select', slot: 'tone',
    options: TONES, value: def || 'Professional',
    render: function (v) { return 'Write in a tone that is ' + v.toLowerCase() + '.'; }
  };
}
function lengthField(def) {
  return { key: 'length', label: 'Target length', type: 'select', slot: 'format', options: LENGTHS, value: def || 'Around 250 words', render: function (v) { return 'Length: ' + v.toLowerCase() + '.'; } };
}
function audienceField(ph) {
  return { key: 'audience', label: 'Who is the audience?', type: 'text', slot: 'audience', placeholder: ph || 'e.g. non-technical small business owners' };
}
function avoidField() {
  return { key: 'avoid', label: 'Things to avoid', type: 'textarea', slot: 'constraints', rows: 2, prefix: 'Avoid the following: ', placeholder: 'e.g. no jargon, no exclamation marks, never promise specific results', help: 'Negative constraints are one of the highest-leverage things you can add.' };
}

PF.TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank / Custom',
    icon: '✎',
    category: 'General',
    blurb: 'Start from scratch with the full prompt-engineering scaffold.',
    fields: [
      { key: 'role', label: 'Who should the AI be?', type: 'text', slot: 'role', placeholder: 'e.g. a senior copywriter with 15 years in B2B SaaS' },
      { key: 'task', label: 'What do you want it to do?', type: 'textarea', slot: 'task', rows: 3, required: true, placeholder: 'Describe the job in one or two clear sentences.' },
      { key: 'context', label: 'Background it needs to know', type: 'textarea', slot: 'context', rows: 4, placeholder: 'Situation, product, history, what has already been tried...' },
      audienceField(),
      toneField(),
      avoidField(),
      { key: 'format', label: 'How should the answer be laid out?', type: 'textarea', slot: 'format', rows: 2, placeholder: 'e.g. a markdown table with three columns: option, pros, cons' }
    ]
  },

  {
    id: 'marketing-copy',
    name: 'Marketing Copy',
    icon: '◆',
    category: 'Business',
    blurb: 'Landing pages, ads, product descriptions and campaign copy.',
    defaultRole: 'a senior direct-response copywriter who has spent fifteen years writing copy that converts',
    fields: [
      { key: 'asset', label: 'What are you writing?', type: 'select', slot: 'task', options: ['Landing page headline and subhead', 'Full landing page copy', 'Google search ad', 'Facebook / Instagram ad', 'Product description', 'Email subject lines', 'Cold outreach email', 'Value proposition statement', 'Case study'], value: 'Full landing page copy', render: function (v) { return 'Write ' + v.toLowerCase() + '.'; } },
      { key: 'product', label: 'What are you selling?', type: 'textarea', slot: 'context', rows: 3, required: true, placeholder: 'Product or service, what it does, what makes it different.' },
      audienceField('e.g. operations managers at 50-200 person logistics firms'),
      { key: 'pain', label: 'What problem does it solve for them?', type: 'textarea', slot: 'context', rows: 2, prefix: 'The problem it solves for them: ', placeholder: 'The pain point in the customer’s own words, if you know it.' },
      { key: 'benefits', label: 'Key benefits to hit', type: 'tags', slot: 'constraints', placeholder: 'Type a benefit, press Enter', render: function (v) { return 'Make sure the copy covers these benefits: ' + v.join('; ') + '.'; } },
      { key: 'cta', label: 'Call to action', type: 'text', slot: 'constraints', placeholder: 'e.g. Book a 15-minute demo', render: function (v) { return 'End with this call to action: "' + v + '".'; } },
      toneField('Persuasive'),
      { key: 'variants', label: 'How many variations?', type: 'select', slot: 'format', options: ['1', '3', '5', '10'], value: '3', render: function (v) { return 'Produce ' + v + ' distinct variation' + (v === '1' ? '' : 's') + ', each taking a different angle. Label them clearly.'; } },
      avoidField()
    ]
  },

  {
    id: 'email',
    name: 'Email & Messages',
    icon: '✉',
    category: 'Business',
    blurb: 'Professional emails, replies, follow-ups and difficult conversations.',
    defaultRole: 'an experienced professional communicator who writes clear, effective business email',
    fields: [
      { key: 'purpose', label: 'What is this email meant to achieve?', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. chase an overdue invoice without damaging the relationship' },
      { key: 'recipient', label: 'Who are you writing to?', type: 'text', slot: 'audience', placeholder: 'e.g. a client I have worked with for two years' },
      { key: 'relationship', label: 'Relationship and history', type: 'textarea', slot: 'context', rows: 3, prefix: 'Relationship and history: ', placeholder: 'Prior conversations, any tension, what they already know.' },
      { key: 'points', label: 'Points that must be included', type: 'tags', slot: 'constraints', placeholder: 'Type a point, press Enter', render: function (v) { return 'The email must cover: ' + v.join('; ') + '.'; } },
      { key: 'thread', label: 'Email you are replying to (optional)', type: 'textarea', slot: 'inputs', rows: 4, placeholder: 'Paste the original message here.' },
      toneField('Professional'),
      lengthField('Around 100 words'),
      { key: 'signoff', label: 'Sign off as', type: 'text', slot: 'constraints', placeholder: 'e.g. Euan, Head of Operations', render: function (v) { return 'Sign off as: ' + trimDot(v) + '.'; } },
      avoidField()
    ]
  },

  {
    id: 'content-writing',
    name: 'Article & Blog',
    icon: '✍',
    category: 'Content',
    blurb: 'Long-form articles, blog posts and newsletters with real structure.',
    defaultRole: 'an experienced long-form writer and editor with a ruthless eye for filler',
    fields: [
      { key: 'topic', label: 'Topic', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. why small retailers should stop discounting to compete on price' },
      { key: 'angle', label: 'Angle or argument', type: 'textarea', slot: 'context', rows: 2, prefix: 'The angle to take: ', placeholder: 'What is the point of view? What should the reader believe by the end?' },
      audienceField('e.g. independent shop owners with no marketing background'),
      { key: 'keywords', label: 'Keywords to work in (SEO)', type: 'tags', slot: 'constraints', placeholder: 'Type a keyword, press Enter', render: function (v) { return 'Naturally incorporate these keywords without keyword stuffing: ' + v.join(', ') + '.'; } },
      { key: 'structure', label: 'Structure', type: 'select', slot: 'format', options: ['Let the AI decide', 'Intro, 3-5 subheaded sections, conclusion', 'Listicle', 'Problem / agitate / solution', 'How-to walkthrough with numbered steps', 'Comparison piece'], value: 'Intro, 3-5 subheaded sections, conclusion', render: function (v) { return v === 'Let the AI decide' ? 'Choose whatever structure best serves the topic.' : 'Structure: ' + v + '.'; } },
      toneField('Friendly and warm'),
      lengthField('Around 1000 words'),
      { key: 'sources', label: 'Source material to draw on', type: 'textarea', slot: 'inputs', rows: 4, placeholder: 'Paste notes, research, stats or quotes the article should use.' },
      avoidField()
    ]
  },

  {
    id: 'coding',
    name: 'Write Code',
    icon: '‹›',
    category: 'Technical',
    blurb: 'Get working code with the constraints and context that actually matter.',
    defaultRole: 'a senior software engineer who writes clean, production-quality code',
    fields: [
      { key: 'build', label: 'What should it build?', type: 'textarea', slot: 'task', rows: 3, required: true, placeholder: 'e.g. a function that parses a CSV of transactions and returns monthly totals' },
      { key: 'lang', label: 'Language / framework', type: 'text', slot: 'constraints', placeholder: 'e.g. TypeScript, React 18, Tailwind', render: function (v) { return 'Use: ' + trimDot(v) + '.'; } },
      { key: 'codebase', label: 'Existing code or conventions', type: 'textarea', slot: 'inputs', rows: 5, placeholder: 'Paste relevant existing code, types, or style conventions to match.' },
      { key: 'reqs', label: 'Requirements', type: 'tags', slot: 'constraints', placeholder: 'Type a requirement, press Enter', render: function (v) { return 'Requirements:\n' + v.map(function (x) { return '- ' + x; }).join('\n'); } },
      { key: 'edge', label: 'Edge cases to handle', type: 'textarea', slot: 'constraints', rows: 2, prefix: 'Handle these edge cases: ', placeholder: 'e.g. empty input, malformed dates, duplicate IDs' },
      { key: 'level', label: 'Explanation level', type: 'select', slot: 'format', options: ['Code only, no commentary', 'Code with brief inline comments', 'Code plus a short explanation of the approach', 'Full walkthrough for a beginner'], value: 'Code plus a short explanation of the approach', render: function (v) { return v + '.'; } },
      { key: 'tests', label: 'Include tests', type: 'toggle', slot: 'format', value: false, render: function () { return 'Include unit tests covering the main paths and the edge cases listed above.'; } }
    ]
  },

  {
    id: 'debug',
    name: 'Debug & Code Review',
    icon: '⚑',
    category: 'Technical',
    blurb: 'Find the root cause instead of getting a plausible-sounding guess.',
    defaultRole: 'a senior engineer who is methodical about diagnosing root causes rather than patching symptoms',
    fields: [
      { key: 'mode', label: 'What do you need?', type: 'select', slot: 'task', options: ['Find and fix a bug', 'Review this code for problems', 'Explain what this code does', 'Make this code faster', 'Refactor for readability'], value: 'Find and fix a bug', render: function (v) { return v + '.'; } },
      { key: 'code', label: 'The code', type: 'textarea', slot: 'inputs', rows: 8, required: true, placeholder: 'Paste the code here.' },
      { key: 'symptom', label: 'What is going wrong?', type: 'textarea', slot: 'context', rows: 3, prefix: 'What is going wrong: ', placeholder: 'Expected behaviour vs actual behaviour. Be specific.' },
      { key: 'error', label: 'Error message / stack trace', type: 'textarea', slot: 'inputs', rows: 4, placeholder: 'Paste the full error output.' },
      { key: 'tried', label: 'What you have already tried', type: 'textarea', slot: 'context', rows: 2, prefix: 'Already tried and ruled out: ', placeholder: 'Saves the AI from suggesting things you have ruled out.' },
      { key: 'env', label: 'Environment', type: 'text', slot: 'context', prefix: 'Environment: ', placeholder: 'e.g. Node 20, Postgres 15, running in Docker on Windows' },
      { key: 'shape', label: 'How should the answer be laid out?', type: 'select', slot: 'format', options: ['Diagnosis, then the fix, then why it works', 'Corrected code with comments on what changed', 'A numbered list of issues by severity', 'A short explanation followed by a diff'], value: 'Diagnosis, then the fix, then why it works', render: function (v) { return v + '.'; } },
      { key: 'rootcause', label: 'Demand a root-cause explanation', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Do not just supply a patch. Identify the root cause and explain why the bug produces this specific symptom. If you are uncertain, say so and list what additional information would confirm the diagnosis.'; } }
    ]
  },

  {
    id: 'analysis',
    name: 'Data & Analysis',
    icon: '▦',
    category: 'Business',
    blurb: 'Turn raw numbers or documents into findings you can act on.',
    defaultRole: 'an experienced data analyst who is rigorous about what the numbers actually support',
    fields: [
      { key: 'question', label: 'What question are you trying to answer?', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. which of our five products is quietly losing us money?' },
      { key: 'data', label: 'The data', type: 'textarea', slot: 'inputs', rows: 8, placeholder: 'Paste your table, CSV, figures or document extract.' },
      { key: 'datacontext', label: 'What the data represents', type: 'textarea', slot: 'context', rows: 3, prefix: 'What the data represents: ', placeholder: 'Where it came from, what each column means, the time period, known gaps.' },
      { key: 'decision', label: 'What decision hangs on this?', type: 'text', slot: 'context', prefix: 'This analysis informs the decision: ', placeholder: 'e.g. whether to discontinue a product line next quarter' },
      audienceField('e.g. a board of non-specialists'),
      { key: 'depth', label: 'Output', type: 'select', slot: 'format', options: ['Headline findings only', 'Findings with supporting numbers', 'Full analysis with methodology', 'Executive summary then detail'], value: 'Findings with supporting numbers', render: function (v) { return v + '.'; } },
      { key: 'caveat', label: 'Require caveats and uncertainty', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Flag any conclusion the data does not firmly support. State your assumptions explicitly. If the data is insufficient to answer the question, say so rather than speculating.'; } }
    ]
  },

  {
    id: 'summarise',
    name: 'Summarise & Extract',
    icon: '≡',
    category: 'General',
    blurb: 'Condense documents, transcripts and threads without losing what matters.',
    defaultRole: 'an expert at distilling long documents down to what matters without losing substance',
    fields: [
      { key: 'source', label: 'The text to work from', type: 'textarea', slot: 'inputs', rows: 10, required: true, placeholder: 'Paste the document, transcript, article or thread.' },
      { key: 'goal', label: 'What do you need out of it?', type: 'select', slot: 'task', options: ['A plain-English summary', 'Key decisions and action items', 'The main arguments and counter-arguments', 'Facts and figures only', 'Risks and concerns raised', 'A one-paragraph brief for someone with no context'], value: 'A plain-English summary', render: function (v) { return 'Produce ' + v.toLowerCase() + ' from the supplied text.'; } },
      { key: 'focus', label: 'Focus on', type: 'text', slot: 'constraints', placeholder: 'e.g. anything relating to budget or timelines', render: function (v) { return 'Pay particular attention to: ' + trimDot(v) + '.'; } },
      audienceField('e.g. an executive who was not in the meeting'),
      lengthField('Around 250 words'),
      { key: 'fidelity', label: 'Stay strictly within the source', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Use only information present in the supplied text. Do not add outside knowledge, inferences or filler. If something is ambiguous in the source, note the ambiguity rather than resolving it.'; } }
    ]
  },

  {
    id: 'support',
    name: 'Customer Support',
    icon: '☺',
    category: 'Business',
    blurb: 'Replies that resolve the issue and keep the customer.',
    defaultRole: 'an experienced customer support lead known for turning frustrated customers around',
    fields: [
      { key: 'want', label: 'What do you need?', type: 'select', slot: 'task', options: ['A reply to send to the customer', 'Three reply options with different levels of goodwill', 'A reply plus internal notes for the team', 'An apology email for a service failure'], value: 'A reply to send to the customer', render: function (v) { return 'Write ' + v.toLowerCase() + '.'; } },
      { key: 'message', label: 'Customer message', type: 'textarea', slot: 'inputs', rows: 5, required: true, placeholder: 'Paste what the customer wrote.' },
      { key: 'situation', label: 'What actually happened', type: 'textarea', slot: 'context', rows: 3, prefix: 'What actually happened on our side: ', placeholder: 'The real story from your side, including anything that went wrong.' },
      { key: 'resolution', label: 'What you can offer', type: 'textarea', slot: 'constraints', rows: 2, placeholder: 'e.g. full refund, or a replacement within 5 days but no refund', render: function (v) { return 'What we can offer: ' + trimDot(v) + '. Do not promise anything beyond this.'; } },
      { key: 'policy', label: 'Policy or rules to respect', type: 'textarea', slot: 'constraints', rows: 2, prefix: 'Policy that must be respected: ', placeholder: 'e.g. never admit legal liability; refunds over £200 need manager approval' },
      { key: 'brand', label: 'Brand voice', type: 'text', slot: 'tone', prefix: 'Brand voice: ', placeholder: 'e.g. warm, human, no corporate speak' },
      toneField('Empathetic'),
      lengthField('Around 100 words'),
      { key: 'apology', label: 'An apology is warranted', type: 'toggle', slot: 'constraints', value: true, render: function () { return 'Open with a genuine, specific apology for what went wrong — not a generic "sorry for any inconvenience".'; } }
    ]
  },

  {
    id: 'meeting',
    name: 'Meeting Notes',
    icon: '☷',
    category: 'Business',
    blurb: 'Transcript in, decisions and owners out.',
    defaultRole: 'an experienced chief of staff who takes precise, genuinely actionable meeting notes',
    fields: [
      { key: 'transcript', label: 'Notes or transcript', type: 'textarea', slot: 'inputs', rows: 10, required: true, placeholder: 'Paste your raw notes or the meeting transcript.' },
      { key: 'meta', label: 'Meeting context', type: 'text', slot: 'context', prefix: 'Meeting: ', placeholder: 'e.g. weekly product sync, 6 attendees, 45 minutes' },
      { key: 'want', label: 'What to produce', type: 'select', slot: 'task', options: ['Summary, decisions and action items', 'Action items only', 'Formal minutes', 'A follow-up email to attendees'], value: 'Summary, decisions and action items', render: function (v) { return 'Produce: ' + v.toLowerCase() + '.'; } },
      { key: 'owners', label: 'Assign owners and deadlines', type: 'toggle', slot: 'format', value: true, render: function () { return 'For every action item, give it as: owner — action — deadline. Where the transcript does not state an owner or deadline, write "unassigned" rather than guessing.'; } },
      { key: 'unresolved', label: 'Surface unresolved items', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Add a final section listing questions that were raised but never answered, and decisions that were deferred.'; } }
    ]
  },

  {
    id: 'career',
    name: 'CV & Job Applications',
    icon: '★',
    category: 'Personal',
    blurb: 'Cover letters, CV bullets and interview prep tailored to the role.',
    defaultRole: 'an experienced recruiter and career coach who knows what hiring managers actually respond to',
    fields: [
      { key: 'what', label: 'What do you need?', type: 'select', slot: 'task', options: ['A cover letter', 'Rewrite my CV bullet points', 'A LinkedIn summary', 'Answers to likely interview questions', 'A follow-up thank-you note'], value: 'A cover letter', render: function (v) { return 'Write ' + v.toLowerCase() + '.'; } },
      { key: 'job', label: 'Job description', type: 'textarea', slot: 'inputs', rows: 6, required: true, placeholder: 'Paste the job advert.' },
      { key: 'background', label: 'Your background', type: 'textarea', slot: 'context', rows: 6, prefix: 'My background: ', placeholder: 'Paste your CV, or list your relevant experience and achievements with numbers where you have them.' },
      { key: 'why', label: 'Why this role, genuinely?', type: 'textarea', slot: 'context', rows: 2, prefix: 'My genuine motivation for this role: ', placeholder: 'Your actual motivation — this is what stops it sounding generic.' },
      toneField('Professional'),
      lengthField('Around 250 words'),
      { key: 'honest', label: 'No invented experience', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Use only experience I have actually given you. Do not invent achievements, metrics, employers or skills. If there is a gap against the job requirements, either leave it out or address it honestly — never fabricate.'; } },
      avoidField()
    ]
  },

  {
    id: 'learn',
    name: 'Learn & Explain',
    icon: '◎',
    category: 'Personal',
    blurb: 'Get a concept explained at exactly your level.',
    defaultRole: 'a patient expert teacher who pitches explanations at exactly the right level',
    fields: [
      { key: 'topic', label: 'What do you want to understand?', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. how compound interest actually works against you on a credit card' },
      { key: 'know', label: 'What you already know', type: 'textarea', slot: 'context', rows: 3, prefix: 'What I already know: ', placeholder: 'Be honest — this is the single biggest factor in getting a useful explanation.' },
      { key: 'level', label: 'Explain it like I am', type: 'select', slot: 'audience', options: ['A complete beginner', 'A curious teenager', 'A smart adult outside the field', 'A working professional in an adjacent field', 'An expert who wants the technical detail'], value: 'A smart adult outside the field', render: function (v) { return v + '.'; } },
      { key: 'why', label: 'Why you need to know', type: 'text', slot: 'context', prefix: 'Why I need to know: ', placeholder: 'e.g. deciding whether to consolidate my debts' },
      { key: 'analogies', label: 'Use analogies and concrete examples', type: 'toggle', slot: 'constraints', value: true, render: function () { return 'Ground every abstract point in a concrete example or analogy from everyday life.'; } },
      { key: 'check', label: 'End with comprehension questions', type: 'toggle', slot: 'format', value: false, render: function () { return 'Finish with three short questions I can answer to check whether I actually understood it.'; } }
    ]
  },

  {
    id: 'brainstorm',
    name: 'Brainstorm & Ideas',
    icon: '✦',
    category: 'General',
    blurb: 'Ideas that are actually usable, not twenty rewordings of the obvious.',
    defaultRole: 'a creative strategist who generates genuinely varied, practical ideas',
    fields: [
      { key: 'challenge', label: 'What are you trying to come up with?', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. ways to get repeat custom from one-off wedding clients' },
      { key: 'context', label: 'Your situation', type: 'textarea', slot: 'context', rows: 3, prefix: 'My situation: ', placeholder: 'Business, resources, team size, budget, timeframe.' },
      { key: 'tried', label: 'Already tried or ruled out', type: 'tags', slot: 'constraints', placeholder: 'Type an idea to exclude, press Enter', render: function (v) { return 'Do not suggest these — already tried or ruled out: ' + v.join('; ') + '.'; } },
      { key: 'limits', label: 'Hard constraints', type: 'textarea', slot: 'constraints', rows: 2, prefix: 'Hard constraints: ', placeholder: 'e.g. under £500, must work with no extra staff' },
      { key: 'count', label: 'How many ideas?', type: 'select', slot: 'format', options: ['5', '10', '15', '20'], value: '10', render: function (v) { return 'Give ' + v + ' ideas.'; } },
      { key: 'spread', label: 'Force a range of ambition', type: 'toggle', slot: 'constraints', value: true, render: function () { return 'Deliberately spread the ideas across the risk spectrum: some safe and immediately doable, some moderately ambitious, and at least two genuinely unconventional. Avoid variations on the same underlying idea.'; } },
      { key: 'evaluate', label: 'Rate effort and impact', type: 'toggle', slot: 'format', value: true, render: function () { return 'For each idea give: the idea in one line, why it could work, estimated effort (low/medium/high) and estimated impact (low/medium/high).'; } }
    ]
  },

  {
    id: 'social',
    name: 'Social Media',
    icon: '◐',
    category: 'Content',
    blurb: 'Platform-native posts that do not read like a press release.',
    defaultRole: 'a social media strategist who writes natively for each platform rather than recycling copy',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', slot: 'constraints', options: ['LinkedIn', 'X / Twitter', 'Instagram caption', 'Facebook', 'TikTok script', 'YouTube description', 'Threads'], value: 'LinkedIn', render: function (v) { return 'Platform: ' + v + '. Match the native conventions, length and rhythm of that platform — do not write generic copy and paste it across.'; } },
      { key: 'about', label: 'What is the post about?', type: 'textarea', slot: 'task', rows: 3, required: true, placeholder: 'The news, insight, story or offer.' },
      { key: 'goal', label: 'What should it achieve?', type: 'select', slot: 'context', options: ['Build awareness', 'Drive clicks to a link', 'Start a conversation', 'Establish credibility', 'Announce something', 'Sell directly'], value: 'Start a conversation', render: function (v) { return 'Goal of the post: ' + v.toLowerCase() + '.'; } },
      audienceField('e.g. HR leads at mid-size UK companies'),
      toneField('Casual and conversational'),
      { key: 'hook', label: 'Lead with a strong hook', type: 'toggle', slot: 'constraints', value: true, render: function () { return 'The first line has to earn the second. Open with a specific, concrete hook — no throat-clearing, no "In today’s fast-paced world".'; } },
      { key: 'hashtags', label: 'Include hashtags', type: 'toggle', slot: 'format', value: false, render: function () { return 'Add 3-5 relevant hashtags at the end.'; } },
      { key: 'variants', label: 'How many versions?', type: 'select', slot: 'format', options: ['1', '3', '5'], value: '3', render: function (v) { return 'Write ' + v + ' version' + (v === '1' ? '' : 's with different hooks') + '.'; } },
      avoidField()
    ]
  },

  {
    id: 'research',
    name: 'Research & Comparison',
    icon: '⌕',
    category: 'Business',
    blurb: 'Structured research briefs and options analysis.',
    defaultRole: 'a rigorous research analyst who weighs evidence and commits to a clear recommendation',
    fields: [
      { key: 'question', label: 'Research question', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. compare the three leading EPOS systems for a two-site cafe' },
      { key: 'options', label: 'Options to compare', type: 'tags', slot: 'context', placeholder: 'Type an option, press Enter', render: function (v) { return 'Compare these specifically: ' + v.join(', ') + '.'; } },
      { key: 'criteria', label: 'What matters in the decision', type: 'tags', slot: 'criteria', placeholder: 'Type a criterion, press Enter', render: function (v) { return 'Evaluate against these criteria, in priority order: ' + v.join(', ') + '.'; } },
      { key: 'situation', label: 'Your situation', type: 'textarea', slot: 'context', rows: 3, prefix: 'My situation: ', placeholder: 'Budget, scale, constraints, deadline.' },
      { key: 'output', label: 'Output format', type: 'select', slot: 'format', options: ['Comparison table then a recommendation', 'Written brief', 'Pros and cons per option', 'Ranked shortlist with reasoning'], value: 'Comparison table then a recommendation', render: function (v) { return v + '.'; } },
      { key: 'recommend', label: 'Force a single recommendation', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'End by committing to one recommendation and stating the main reason to choose it, plus the strongest argument against it. Do not hedge with "it depends".'; } },
      { key: 'uncertainty', label: 'Flag knowledge limits', type: 'toggle', slot: 'criteria', value: true, render: function () { return 'Where pricing, features or availability may have changed since your training data, say so explicitly rather than stating it as current fact.'; } }
    ]
  },

  {
    id: 'image',
    name: 'Image Generation',
    icon: '▣',
    category: 'Content',
    blurb: 'Detailed prompts for Midjourney, DALL·E, Firefly and friends.',
    isImage: true,
    fields: [
      { key: 'subject', label: 'Main subject', type: 'textarea', slot: 'task', rows: 2, required: true, placeholder: 'e.g. an elderly watchmaker at his bench' },
      { key: 'setting', label: 'Setting and background', type: 'text', slot: 'context', placeholder: 'e.g. a cluttered workshop, late afternoon' },
      { key: 'style', label: 'Art style', type: 'select', slot: 'constraints', options: ['Photorealistic', 'Cinematic film still', 'Oil painting', 'Watercolour', 'Pencil sketch', 'Flat vector illustration', '3D render', 'Anime', 'Vintage photograph', 'Product photography'], value: 'Photorealistic' },
      { key: 'lighting', label: 'Lighting', type: 'select', slot: 'constraints', options: ['Natural daylight', 'Golden hour', 'Soft diffused', 'Dramatic side lighting', 'Low key / moody', 'High key / bright', 'Neon', 'Candlelight'], value: 'Soft diffused' },
      { key: 'camera', label: 'Composition and camera', type: 'text', slot: 'constraints', placeholder: 'e.g. close-up portrait, 85mm, shallow depth of field' },
      { key: 'colour', label: 'Colour palette and mood', type: 'text', slot: 'tone', placeholder: 'e.g. warm browns and brass, nostalgic' },
      { key: 'ratio', label: 'Aspect ratio', type: 'select', slot: 'format', options: ['Square 1:1', 'Landscape 16:9', 'Portrait 9:16', 'Portrait 4:5', 'Wide 21:9'], value: 'Landscape 16:9' },
      { key: 'negative', label: 'Do not include', type: 'tags', slot: 'constraints', placeholder: 'Type something to exclude, press Enter', render: function (v) { return 'Negative prompt — avoid: ' + v.join(', ') + '.'; } }
    ]
  }
];

PF.CATEGORIES = ['All', 'Business', 'Content', 'Technical', 'Personal', 'General'];

PF.getTemplate = function (id) {
  for (var i = 0; i < PF.TEMPLATES.length; i++) {
    if (PF.TEMPLATES[i].id === id) return PF.TEMPLATES[i];
  }
  return null;
};

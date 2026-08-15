# PromptForge

A guided prompt builder. You answer a few questions about what you actually need; it assembles a properly structured prompt — role, task, context, audience, constraints, output format and quality guardrails.

Sixteen templates covering business, content, technical and personal use.

## Running it

Double-click `index.html`. That's it — no install, no build step, no server.

Every feature works this way except signing in, which needs the site to be on a real URL — see the sync section below.

## How it works

Everything runs in the browser. There is no build tooling and no framework, which means nothing to install, nothing to keep updated, and no way for a dependency upgrade to break the site.

```
index.html          page structure and view templates
styles.css          design system, light and dark themes
js/templates.js     the 16 prompt templates — edit this to add your own
js/improve.js       front-page improver: classification, gap analysis, questions
js/examples.js      32 worked scenarios behind the Surprise me button
js/seeds.js         the Idea Generator's word pools and composition rules
js/builder.js       assembles form values into a prompt; scores prompt strength
js/store.js         saving, and cloud sync when configured
js/app.js           routing, forms, live preview, library
js/config.js        Supabase credentials
supabase-setup.sql  database schema, already applied to the live project
```

### The front-page improver

The landing page is a single box: type a rough prompt in your own words, press Enter, and the app turns it into a structured one. The templates sit below it for anyone who would rather start there.

**The governing rule: every result must be worth more than what was typed in, without adding irrelevant boilerplate.** Those pull in opposite directions, and getting the balance wrong in either direction is a real failure. An early version bolted a "senior engineer / find and fix a bug" scaffold onto a question about e-commerce hosting. The over-correction was worse: for a clean one-line request like *"give me store name ideas"* there was no filler to strip, so the tool handed the input straight back unchanged.

The resolution is **intent packs** (`PF.INTENT_PACKS`). A vague request is weak not because it is badly worded but because it omits the requirements that make that *kind* of task come out well. Each pack encodes what an expert would add for one task type — naming, ideation, comparison, debugging, code, explanation, review, summarising, analysis, planning, writing, plus a generic fallback.

So *"give me store name ideas"* (10 words) becomes a 118-word prompt asking for 20 options grouped by naming approach, a one-line rationale each, a bias toward names that survive being said aloud, a flag on existing brands, and an instruction to ask what the store sells before starting. That is genuinely expert knowledge the user did not have to supply — and it is specific to naming, not generic filler.

Structure tags and quality guardrails remain off by default and opt-in on the result screen, since that was the boilerplate worth avoiding.

It works in three steps, all local:

1. **Clean** (`PF.cleanPrompt`) — collapses restarted phrases ("i want to So I want to use…" keeps the second attempt), drops abandoned clauses and trailing-off fragments ("And I use…"), strips verbal filler, fixes brand casing, and splits run-on speech into separate sentences. Input of three or more sentences is rendered as bullets, which is a large readability win for dictated or stream-of-consciousness text.
2. **Diagnose** — the most valuable check is whether the prompt contains an actual *request*. Text that only describes a situation, with no instruction verb, no question mark and no "can you", is the most common reason output misses the mark. That becomes the first question, and if it is skipped the result screen still says plainly that it is missing.
3. **Ask, then compose** — up to four generic questions (request, audience, format, things to avoid), each with quick-pick chips and a note on why it matters. Anything answered is dropped from the pack's "ask me first" list, so the prompt never asks for something it has already been told. Deliberately template-agnostic: the improver's job is to sharpen what was written, and anyone wanting the full field set can hit "Open in full builder".

**Adding an intent pack**: append to `PF.INTENT_PACKS` in `js/improve.js` with a `test` regex, a `requirements` array, and an `askFor` array of `{tag, text}`. Order matters — the first match wins, so put specific patterns above general ones (`naming` sits above `ideation`, or "store name ideas" would be caught by the word "ideas"). Tags `audience`, `format`, `avoid` and `tone` are auto-suppressed when the user answers the matching question.

**A specific ordering trap, worth knowing before you touch pack order.** `explain`, `review`, `summarise`, `analyse` and `plan` all match on a gerund ("explaining", "reviewing", "summarising"...) so they can catch a request phrased either way ("explain X" or "please explain X for me"). The failure mode: those same gerunds commonly appear as a *subordinate clause* inside a request that is actually asking for something to be written — "write an email **explaining** that the deadline moved" is a writing task, not a request to have something explained to the user. `writing` and `social` are positioned ahead of those five gerund packs for exactly this reason, and `social` has to stay ahead of `writing` in turn, or "write me an instagram caption" loses to the generic writing pack instead of getting platform-specific requirements. If you add a new gerund-based pack, decide deliberately where it sits relative to `writing` and `social`, and re-run the pack-reachability check below — it is easy to accidentally shadow an existing pack into never firing.

**Testing this file changed after a real regression.** An earlier version broadened `explain`'s trigger to match "explaining" and broke exactly the case above, undetected until it was run against real prompts. The fix was to move `writing` and `social` earlier in the array (see above) and add an automated check that every pack is still individually reachable — probe each pack's id with an unambiguous input and assert `PF.detectIntent(probe).id` still equals it. A pack that compiles fine and never fires again is the specific failure mode worth guarding against whenever `PF.INTENT_PACKS` is reordered.

### Refining after the first result

The chat box stays open once a prompt is generated, and every message is routed by `PF.classifyFollowUp` into one of three paths:

- **refine** — adjust the prompt in place. Handles quantities ("10 instead of 20" rewrites the number inside the existing requirement rather than appending a contradictory second one), length, tone, format, audience, constraints, and removals ("remove the bit about domains"). Anything unparseable is still added verbatim as a requirement rather than being dropped.
- **new** — a fresh request starts a clean session. A one-click "No — refine the previous one instead" chip sits on that message, because the guess is occasionally wrong and should be cheap to undo.
- **question** — "why did you add that?", "what does XML do?" get a short explanation instead of mangling the prompt.

Ordering inside the classifier is deliberate and fragile to change. Refine-openers are matched first, then tweak words, then questions, then new-request starters, and only then the pronoun rule. The pronoun rule has to come last: "summarise **this** article for me" contains a back-reference but is plainly a new prompt, and checking pronouns earlier misfiled it as a tweak.

Each refinement appends a new result card and dims the previous one, so the prompt's evolution stays visible and only the newest card keeps its controls.

### Editing and deleting messages: why replay

The last message you sent carries **Edit** and **Delete** controls, and using either rebuilds the prompt to match.

This is implemented by storing the conversation as a list of replayable actions (`transcript`) and rebuilding the session from scratch on every change, rather than trying to undo the last mutation. That is not over-engineering — **refinements have no inverse.** "Remove the bit about domains" filters an array; "10 instead of 20" rewrites a number inside an existing requirement, destroying the original. There is nothing to reverse. Replaying from the original text is the only way the prompt can be guaranteed to match the messages actually on screen.

The same single code path renders both new messages and edits, so the two can never drift apart — a class of bug that is otherwise very easy to introduce here.

Two consequences worth knowing if you extend this:

- **Question generation must stay deterministic.** Replay re-asks each question and feeds the stored answer back in order. If `PF.nextQuestion` ever became random or time-dependent, answers would land in the wrong slots.
- **Anything that must survive a replay cannot live on the session.** The XML and guardrail toggles are held in a separate `outputPrefs` object for exactly this reason; when they lived on the session, every refinement silently reset them.

Editing the *opening* prompt re-runs everything, including intent detection — change "give me store name ideas" to "summarise this article" and the naming requirements disappear, while later refinements still apply. Answers left orphaned by a shortened question list are discarded rather than being misapplied to the wrong question.

Classification still runs, but only as a *suggestion*, and it needs a score of at least `MIN_TEMPLATE_SCORE` (4) to commit. An earlier version let a single generic keyword decide — the word "optimize" in a paragraph about e-commerce hosting was enough to classify it as a debugging task and wrap it in a "find and fix a bug" scaffold. One weak signal should never outrank the user's evident intent.

There is no LLM behind this, so it will not creatively reword your prose or restructure your argument. What it does reliably is remove the noise, break up the walls of text, and catch the missing pieces.

**Adding a keyword** means editing `PF.IMPROVE_KEYWORDS` in `js/improve.js`. If the phrase is common in ordinary English, put it in `STARTERS` instead so it only matches at the start of the input.

### Three output formats

The same answers render three ways, because different models respond to different structures:

- **Claude / XML** — `<role>`, `<task>`, `<context>` tags. Anthropic models follow XML-delimited sections closely.
- **ChatGPT / Markdown** — `## Role`, `## Task` headings.
- **Plain** — prose, for anywhere that chokes on markup.

### Surprise me

The dice button fills a random template with a complete, realistic scenario so a first-time visitor sees a finished prompt in one click. There are 32 hand-written scenarios in `js/examples.js`, two per template, plus a re-roll button in the builder to cycle between a template's own scenarios.

They are hand-written rather than assembled from random word pools on purpose. Recombining pools per field produces things like "sell a coffee subscription" paired with "audience: hospital procurement teams" — technically varied, visibly nonsense. Only pure-quantity dropdowns (number of variations, number of ideas) are randomised, because those cannot make a scenario incoherent.

`PF.validateExamples()` runs at startup and warns in the console if a scenario references a field that no longer exists or picks a dropdown value that is not in that field's options — the failure mode you get when a template is edited later.

### Idea Generator

A separate page (`#/inspire`) for when you do not yet know what you want to make. Five categories — story premise, business idea, writing exercise, content idea, image concept — each composed from scoped word pools using a fixed sentence shape, so any combination reads properly.

Every seed has a **Build a prompt from this** button that carries it into the right template with the surrounding fields already filled. Creative categories switch off the "never invent facts" guardrail, which would otherwise contradict the task of writing fiction.

`PF.validateSeeds()` generates 40 seeds per category at startup and checks each one maps onto real fields with valid values.

### Prompt strength score

The meter tracks the eight things that most reliably improve output. It only counts the ones a given template can actually provide, so a template with no audience field is never marked down for lacking one.

## Adding your own template

Add an object to the `PF.TEMPLATES` array in `js/templates.js`. Each field declares a `slot`, which tells the builder where in the prompt it belongs:

```js
{
  id: 'my-template',
  name: 'My Template',
  icon: '★',
  category: 'Business',
  blurb: 'One line describing what it does.',
  defaultRole: 'an expert in whatever this is about',
  fields: [
    { key: 'goal', label: 'What do you need?', type: 'textarea',
      slot: 'task', rows: 3, required: true, placeholder: 'e.g. ...' }
  ]
}
```

Field `type` is one of `text`, `textarea`, `select` (needs `options`), `tags`, or `toggle`.
Field `slot` is one of `role`, `task`, `context`, `inputs`, `audience`, `constraints`, `tone`, `format`, `examples`, `criteria`.

Add a `prefix` to give a free-text field a lead-in — `prefix: 'Environment: '` turns a bare `Node 20, Postgres 15` into a labelled line. This matters most when two fields share a slot, since otherwise they run together with nothing to tell them apart.

For full control use `render(value)`, which returns the exact sentence. If your renderer appends punctuation, wrap the value in `trimDot()` or you get a double full stop when the user's text already ends in one.

Then add two scenarios for it to `js/examples.js` so the dice button can land on it — `validateExamples()` will warn on startup if you skip this.

If you add a `select` field, make sure its `value` default is one of its own `options` — otherwise the dropdown and the generated prompt disagree.

## Deploying it

Any static host works, and the free tiers are genuinely free for this.

**Netlify** — go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `promptforge` folder onto the page. You get a live URL in about ten seconds. No account needed to try it.

**Cloudflare Pages** or **Vercel** — same idea; both accept a direct folder upload or a GitHub repo.

**GitHub Pages** — push the folder to a repo, then Settings → Pages → deploy from branch.

## Accounts and cross-device sync

Already set up. A Supabase project called **promptforge** exists in the London region (`eu-west-2`), on the free tier, with the schema and security rules from `supabase-setup.sql` applied. The credentials are in `js/config.js`.

Prompts always save to the browser first, so the app works offline and without an account. Signing in adds a cloud copy that follows you between devices; the two are merged newest-wins on sign-in.

Sign-in is by emailed one-time link — no passwords stored anywhere.

### One thing to know before you test sign-in

**Sign-in will not work when you open `index.html` directly from disk.** Supabase only sends magic links back to `http://` or `https://` addresses, and a double-clicked file is a `file://` address. Everything else in the app works fine that way; only sign-in needs a real URL.

So to try sign-in, deploy first (see below), then in your Supabase dashboard under **Authentication → URL Configuration** set the **Site URL** to your deployed address and add it to **Redirect URLs**. Until you do, the link in the email will bounce you to `localhost:3000`.

### Before real users arrive

Supabase's built-in email sender is rate-limited and meant for testing — a handful of sign-ins per hour. Connect your own SMTP provider under **Authentication → Emails** before you promote the site anywhere.

### How the Supabase SDK loads

`store.js` injects the Supabase SDK `<script>` itself, on a timer, rather than index.html loading it directly. This matters: a plain `<script src="https://cdn...">` tag in the page blocks every script after it from running until that one resolves, in strict document order. On a network that blocks or stalls the CDN — common on managed/school networks — that would leave the entire app blank under the header, forever, since the scripts that build the page would simply never run. Loading it dynamically with an 8-second timeout means the app always renders immediately; cloud sync just quietly stays unavailable if the SDK can't be fetched.

### On the key in `js/config.js`

The anon key is designed to be published in client-side code; every Supabase web app ships one. What protects the data is the row-level security in `supabase-setup.sql`, which restricts every user to their own rows — verified working: an unauthenticated client gets zero rows back and is refused on insert.

Never put the `service_role` key in this file. That one bypasses row-level security entirely.

## Known limits

- Prompts are stored unencrypted in browser local storage. Fine for prompt templates; don't paste credentials or personal data you'd mind another user of the same computer seeing.
- Browsers cache the CSS and JS aggressively. If you edit a file and the change doesn't show up, bump the `?v=1` numbers on the `<script>` and `<link>` tags in `index.html`.
- The "Open in Claude" and "Open in ChatGPT" buttons pass the prompt in the URL, which caps at roughly 6,000 characters. Longer prompts are truncated in the link — use Copy instead.
- No test suite. Everything was verified by hand in the browser.

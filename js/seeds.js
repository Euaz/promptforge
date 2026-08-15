/* Idea generator: random creative seeds.
   Pools are scoped per category and composed with a fixed sentence shape, so
   any combination reads coherently. Each seed can be handed straight to a
   builder template via its `target`. */

window.PF = window.PF || {};

function one(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalise(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Pull from a real template's own option list so mapped values always validate. */
function optionOf(templateId, fieldKey) {
  var t = PF.getTemplate(templateId);
  if (!t) return '';
  for (var i = 0; i < t.fields.length; i++) {
    if (t.fields[i].key === fieldKey) return one(t.fields[i].options);
  }
  return '';
}

var STORY = {
  who: ['A lighthouse keeper', 'A night-shift nurse', 'A retired safecracker', 'A wedding photographer', 'A village postmaster', 'A ferry captain', 'A museum night guard', 'A crossword setter', 'A funeral director', 'A long-haul lorry driver', 'A piano tuner', 'A school caretaker', 'A locksmith', 'A river bailiff'],
  what: ['finds a letter addressed to them in a stranger\'s handwriting', 'realises the same customer has come in every day for a year and never bought anything', 'is handed a key with no explanation', 'finds their own name in a fifty-year-old logbook', 'starts receiving phone calls meant for someone who died', 'inherits a building they have never heard of', 'notices something in the background of an old photograph', 'is asked to keep a secret they immediately want to tell', 'discovers the job they have done for decades was never necessary', 'is recognised by someone they have never met'],
  twist: ['They have until Friday to decide what to do about it.', 'The only person who can explain is someone they have avoided for years.', 'Telling the truth would cost them the one thing they have left.', 'Nobody else believes it happened.', 'They have done this before, and it ended badly.', 'The obvious explanation turns out to be wrong.', 'Someone else is clearly looking for the same thing.', 'They decide, for now, to say nothing.']
};

var BUSINESS = {
  who: ['city dog owners', 'self-employed tradespeople', 'parents of under-fives', 'small charities', 'independent cafes', 'night-shift workers', 'people caring for an elderly relative', 'amateur sports clubs', 'allotment holders', 'first-time landlords', 'freelance musicians', 'rural GP surgeries'],
  friction: ['waste hours every month on paperwork nobody trained them for', 'consistently overpay because comparing the options is too hard', 'need help at exactly the times everyone else is closed', 'only need the thing twice a year and cannot justify a subscription', 'have to chase three different people to get one simple answer', 'give up halfway through because the first step is too daunting', 'are sold enterprise software scaled down badly', 'rely entirely on one person who is about to retire'],
  twist: ['the whole thing runs over text message, with no app to download', 'you pay per result rather than per month', 'it is deliberately limited to one town so it can be genuinely local', 'it works offline and syncs later', 'a real person does the hard part and software does the rest', 'it is free for the user and paid for by the other side of the transaction', 'it deletes your data by default instead of hoarding it', 'it is designed to be needed less over time, not more']
};

var EXERCISE = {
  form: ['a 100-word story', 'a letter that is never sent', 'an instruction manual', 'a complaint that turns into a confession', 'an obituary', 'a voicemail transcript', 'a diary entry written twenty years too late', 'a set of lost-property notices', 'a recipe', 'a weather forecast'],
  subject: ['about a misdelivered parcel', 'about the last day of a job', 'about something returned to its owner', 'about a room nobody enters', 'about an argument over nothing', 'about a photograph that should not exist', 'about a promise kept too literally', 'about a debt finally repaid', 'about the wrong person being thanked'],
  constraint: ['without using the word "I"', 'in exactly seven sentences', 'where nothing is described visually', 'using only dialogue', 'where every sentence is shorter than the one before', 'without naming a single character', 'set entirely within one minute of real time', 'where the narrator is clearly lying', 'ending on the least dramatic sentence you can manage']
};

var CONTENT = {
  format: ['A myth-busting post', 'A behind-the-scenes breakdown', 'A "what I got wrong" post', 'A teardown of a real example', 'A beginner\'s guide', 'A contrarian take', 'A day-in-the-life', 'A before-and-after comparison', 'A list of things nobody warns you about', 'An honest cost breakdown'],
  angle: ['the thing everyone in your field gets wrong', 'the unglamorous work that actually drives the results', 'a decision you would make differently now', 'the question clients ask most often', 'a tool everyone recommends that you quietly stopped using', 'the part of the job nobody sees', 'why the standard advice fails for small operators', 'a mistake that cost you real money', 'what changed your mind after ten years']
};

var IMAGE = {
  subject: ['an elderly watchmaker bent over his bench', 'a fox crossing an empty supermarket car park at dawn', 'a swimmer alone in a lido in winter', 'a cluttered potting shed with the door open', 'a brass band waiting in the rain', 'a cat asleep on a stack of library books', 'a fishing boat pulled up on a shingle beach', 'a child\'s bicycle left against a dry stone wall', 'a chef plating the last dish of the night', 'a red telephone box repurposed as a tiny library'],
  setting: ['a narrow cobbled street after rain', 'open moorland under a low sky', 'a cramped workshop lined with parts drawers', 'a station platform at the last train of the night', 'a kitchen mid-service', 'a walled garden gone slightly wild', 'a harbour at slack tide', 'a village hall set up for something'],
  mood: ['quiet and nostalgic, warm browns and brass', 'cold blues with one warm light source, lonely but not sad', 'high contrast, muted greens, faintly ominous', 'soft washed-out pastels, gentle and unhurried', 'rich saturated colour, celebratory', 'near-monochrome with a single point of red'],
  camera: ['close-up, 85mm, shallow depth of field', 'wide establishing shot, 24mm, deep focus', 'eye-level medium shot, 50mm', 'slightly high angle looking down, 35mm', 'tight detail shot of the hands, macro']
};

PF.SEED_CATEGORIES = [
  {
    id: 'story',
    name: 'Story premise',
    icon: '✷',
    blurb: 'A character, a situation and something in the way.',
    generate: function () {
      var text = one(STORY.who) + ' ' + one(STORY.what) + '. ' + one(STORY.twist);
      return {
        text: text,
        target: {
          templateId: 'blank',
          label: 'From the idea generator',
          opts: { noHallucinate: false },
          values: {
            role: 'a short story writer with a gift for restraint and subtext',
            task: 'Write a short story from this premise: ' + text,
            context: 'The premise is a starting point, not a plot. You are free to change details as long as the central situation survives.',
            audience: 'adult readers of literary short fiction',
            tone: 'Neutral and factual',
            avoid: 'no twist ending for its own sake, no explaining the theme to the reader, do not open by describing the weather',
            format: 'Around 1,200 words. Prose only, no headings or section breaks.'
          }
        }
      };
    }
  },

  {
    id: 'business',
    name: 'Business idea',
    icon: '◈',
    blurb: 'An underserved group, a real friction, and an angle.',
    generate: function () {
      var text = 'A service for ' + one(BUSINESS.who) + ' who ' + one(BUSINESS.friction) + '. The twist: ' + one(BUSINESS.twist) + '.';
      return {
        text: text,
        target: {
          templateId: 'brainstorm',
          label: 'From the idea generator',
          values: {
            challenge: 'Pressure-test this business idea and work out whether there is anything in it: ' + text,
            context: 'This is a raw idea, not a plan. I have no customers, no product and no particular expertise in this market yet. I am trying to work out whether it is worth a weekend of research.',
            limits: 'Assume a solo founder with under £2,000 to spend and evenings and weekends only',
            count: '10',
            spread: true,
            evaluate: true
          }
        }
      };
    }
  },

  {
    id: 'exercise',
    name: 'Writing exercise',
    icon: '✎',
    blurb: 'A form, a subject and an awkward constraint.',
    generate: function () {
      var text = 'Write ' + one(EXERCISE.form) + ' ' + one(EXERCISE.subject) + ', ' + one(EXERCISE.constraint) + '.';
      return {
        text: text,
        target: {
          templateId: 'blank',
          label: 'From the idea generator',
          opts: { noHallucinate: false },
          values: {
            role: 'a writer who treats formal constraints as the point rather than an obstacle',
            task: text,
            context: 'This is a craft exercise. The constraint is the whole interest of the piece — honour it exactly rather than working around it.',
            audience: 'a writing group who will notice if the constraint slips',
            tone: 'Neutral and factual',
            avoid: 'do not explain or comment on the constraint, do not break it once "for effect"',
            format: 'The piece only. No title, no preamble, no note about the approach.'
          }
        }
      };
    }
  },

  {
    id: 'content',
    name: 'Content idea',
    icon: '◐',
    blurb: 'Something worth posting that is not another listicle.',
    generate: function () {
      var text = one(CONTENT.format) + ', focused on ' + one(CONTENT.angle) + '.';
      return {
        text: text,
        target: {
          templateId: 'content-writing',
          label: 'From the idea generator',
          values: {
            topic: text,
            angle: 'Take a specific, first-person position and back it with concrete detail rather than general advice.',
            audience: 'people doing the same work, who can tell immediately when someone is bluffing',
            structure: 'Let the AI decide',
            tone: 'Direct and concise',
            length: 'Around 500 words',
            avoid: 'no generic openers, no "in today\'s world", nothing that could have been written by someone who has not done the job'
          }
        }
      };
    }
  },

  {
    id: 'image',
    name: 'Image concept',
    icon: '▣',
    blurb: 'A subject, a setting and a look — ready for Midjourney.',
    generate: function () {
      var subject = one(IMAGE.subject);
      var setting = one(IMAGE.setting);
      var mood = one(IMAGE.mood);
      var camera = one(IMAGE.camera);
      var style = optionOf('image', 'style');
      var lighting = optionOf('image', 'lighting');
      var ratio = optionOf('image', 'ratio');

      return {
        text: capitalise(subject) + ', in ' + setting + '. ' + style + ', ' + lighting.toLowerCase() + ', ' + mood + '.',
        target: {
          templateId: 'image',
          label: 'From the idea generator',
          values: {
            subject: subject,
            setting: setting,
            style: style,
            lighting: lighting,
            camera: camera,
            colour: mood,
            ratio: ratio,
            negative: ['text', 'watermark', 'extra limbs', 'distorted faces']
          }
        }
      };
    }
  }
];

PF.getSeedCategory = function (id) {
  for (var i = 0; i < PF.SEED_CATEGORIES.length; i++) {
    if (PF.SEED_CATEGORIES[i].id === id) return PF.SEED_CATEGORIES[i];
  }
  return null;
};

/* n seeds from one category, or spread across all of them. */
PF.generateSeeds = function (categoryId, n) {
  var cats = categoryId && categoryId !== 'all'
    ? [PF.getSeedCategory(categoryId)].filter(Boolean)
    : PF.SEED_CATEGORIES;
  if (!cats.length) return [];

  var out = [];
  for (var i = 0; i < (n || 3); i++) {
    var cat = cats.length === 1 ? cats[0] : cats[i % cats.length];
    var seed = cat.generate();
    seed.categoryId = cat.id;
    seed.categoryName = cat.name;
    out.push(seed);
  }
  return out;
};

/* Mirrors PF.validateExamples: seed targets must also match real fields. */
PF.validateSeeds = function () {
  var problems = [];

  PF.SEED_CATEGORIES.forEach(function (cat) {
    for (var run = 0; run < 40; run++) {
      var seed = cat.generate();
      if (!seed.text || seed.text.length < 20) problems.push(cat.id + ': produced an empty or tiny seed');
      if (/undefined|,\s*\./.test(seed.text)) problems.push(cat.id + ': malformed text "' + seed.text + '"');

      var target = seed.target;
      if (!target) { problems.push(cat.id + ': no target'); break; }

      var t = PF.getTemplate(target.templateId);
      if (!t) { problems.push(cat.id + ': no template "' + target.templateId + '"'); break; }

      var byKey = {};
      t.fields.forEach(function (f) { byKey[f.key] = f; });

      Object.keys(target.values).forEach(function (k) {
        var f = byKey[k];
        if (!f) { problems.push(cat.id + ': no field "' + k + '" on ' + target.templateId); return; }
        if (f.type === 'select' && f.options.indexOf(target.values[k]) === -1) {
          problems.push(cat.id + ': ' + k + ' = "' + target.values[k] + '" not a valid option');
        }
      });
    }
  });

  var unique = problems.filter(function (p, i) { return problems.indexOf(p) === i; });
  if (unique.length) console.warn('[PromptForge] Seed problems:\n' + unique.join('\n'));
  return unique;
};

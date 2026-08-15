/* Worked example scenarios for the "Surprise me" button.
   Two per template. Every value here must match a real field key, and every
   `select` value must be one of that field's own options — PF.validateExamples()
   checks this at startup and logs anything that drifts. */

window.PF = window.PF || {};

PF.EXAMPLES = {

  blank: [
    {
      label: 'Reviving a quiet Tuesday',
      values: {
        role: 'a pub landlord who has run profitable midweek events for a decade',
        task: 'Plan a six-week series of themed quiz nights designed to lift Tuesday trade.',
        context: 'A 60-cover village pub. Fridays and Saturdays are full; Tuesdays average eleven covers. We have a PA system, a projector nobody has used in a year, and no events budget to speak of. The nearest competing quiz is eight miles away on a Wednesday.',
        audience: 'locals aged 30-65, mostly regulars who already drink here at weekends',
        tone: 'Direct and concise',
        avoid: 'no suggestions that need extra staff, no app or website builds, nothing that relies on paid advertising',
        format: 'A week-by-week plan. For each week: theme, one-line promotional hook, anything I need to buy or prepare, and the single thing most likely to go wrong.'
      }
    },
    {
      label: 'Untangling a house move',
      values: {
        role: 'a relocation specialist who has project-managed hundreds of domestic moves',
        task: 'Build me a countdown checklist for moving house, working backwards from completion day.',
        context: 'Moving from a two-bed flat to a three-bed house forty miles away, completing in seven weeks. Two adults, one cat, both working full time. First-time movers with no idea what we are forgetting.',
        audience: 'two organised but inexperienced adults doing this around full-time jobs',
        tone: 'Friendly and warm',
        avoid: 'do not recommend specific companies or brands, and do not pad it with obvious items like "pack your things"',
        format: 'Grouped by time remaining: 7 weeks out, 4 weeks, 2 weeks, the final week, moving day, first week after. Flag anything with a legal or financial deadline in bold.'
      }
    }
  ],

  'marketing-copy': [
    {
      label: 'Speciality coffee subscription',
      values: {
        asset: 'Full landing page copy',
        product: 'A coffee subscription for offices. Beans are roasted the morning they ship, so they arrive four days off roast instead of the four months typical of supermarket bags. Flexible quantities, pause any time, free grinder on annual plans.',
        audience: 'office managers buying for teams of 10-50 people',
        pain: 'The office coffee is stale and nobody enjoys it, but sorting out something better feels like one more admin job and the last supplier locked them into a two-year contract.',
        benefits: ['Roasted the day it ships', 'Pause or cancel any time, no contract', 'Free commercial grinder on annual plans', 'One invoice, no per-person faff'],
        cta: 'Start a free two-week trial',
        tone: 'Persuasive',
        variants: '3',
        avoid: 'no exclamation marks, no "game-changing" or "revolutionise", do not mock instant coffee or the reader\'s current choices'
      }
    },
    {
      label: 'Bookkeeping for tradespeople',
      values: {
        asset: 'Google search ad',
        product: 'A bookkeeping service aimed specifically at self-employed tradespeople. Photograph a receipt, text it in, and we handle the rest including the Self Assessment return. Fixed monthly fee.',
        audience: 'self-employed electricians, plumbers and builders turning over £40k-£120k',
        pain: 'They lose an evening a month to a shoebox of receipts, and every January they panic about the tax return. They assume an accountant means suits, jargon and an unpredictable bill.',
        benefits: ['Text a photo of the receipt, that is the whole process', 'Fixed monthly fee, no surprise invoices', 'Self Assessment filed for you', 'We speak plain English, not accountant'],
        cta: 'See your fixed monthly price',
        tone: 'Direct and concise',
        variants: '5',
        avoid: 'no accountancy jargon, no scare tactics about HMRC penalties, do not imply the reader is bad at admin'
      }
    }
  ],

  email: [
    {
      label: 'Chasing an overdue invoice',
      values: {
        purpose: 'Get a sixty-day overdue invoice paid without damaging a relationship I want to keep.',
        recipient: 'the operations director at a client I have worked with for two years',
        relationship: 'Good relationship, steady work, they have always paid eventually but never on time. I have sent two polite reminders that went unanswered. I know their finance person left last month, so this may be a process problem rather than an unwillingness to pay.',
        points: ['Invoice 2841, £4,200, due 60 days ago', 'Two previous reminders went unanswered', 'Offer to resend to a different contact in finance', 'Work continues as normal, this is not a threat'],
        tone: 'Professional',
        length: 'Around 100 words',
        signoff: 'Euan',
        avoid: 'no passive aggression, no mention of late payment interest or legal action, do not apologise for chasing'
      }
    },
    {
      label: 'Pushing back on a deadline',
      values: {
        purpose: 'Tell a client their requested deadline is not achievable, and get them to agree to a realistic one without losing their confidence.',
        recipient: 'a new client, three weeks into our first project together',
        relationship: 'Early days, still building trust. They have been enthusiastic and easy to work with. The scope has grown by roughly a third since we agreed the timeline, mostly through small additions they may not realise add up.',
        points: ['The original date assumed the original scope', 'Six specific additions have been requested since', 'I can hit the original date if we drop three of them', 'Otherwise I need eleven extra days'],
        tone: 'Direct and concise',
        length: 'Around 250 words',
        signoff: 'Euan',
        avoid: 'do not sound defensive, do not blame the client, do not bury the ask at the bottom'
      }
    }
  ],

  'content-writing': [
    {
      label: 'Why discounting is a trap',
      values: {
        topic: 'Why small independent retailers should stop discounting to compete with big chains, and what to do instead.',
        angle: 'Discounting trains your best customers to wait for sales and quietly destroys the margin that keeps you open. The independents that survive compete on things a chain structurally cannot copy.',
        audience: 'independent shop owners with no marketing background, often running the shop alone',
        keywords: ['independent retail', 'pricing strategy', 'small shop marketing', 'customer loyalty'],
        structure: 'Problem / agitate / solution',
        tone: 'Friendly and warm',
        length: 'Around 1000 words',
        sources: 'Rough figures to work from: a shop on a 40% gross margin that discounts 20% has to sell roughly twice the volume to stand still. Most independents I speak to have never done that calculation.',
        avoid: 'no generic "know your customer" filler, do not romanticise the high street, no statistics unless I have supplied them'
      }
    },
    {
      label: 'Onboarding remote hires',
      values: {
        topic: 'How to onboard a remote employee properly in their first thirty days.',
        angle: 'Most remote onboarding fails not because of missing paperwork but because nobody engineers the informal contact that happens automatically in an office. You have to schedule what used to be accidental.',
        audience: 'first-time managers at companies that went remote without redesigning how they work',
        keywords: ['remote onboarding', 'first 30 days', 'distributed teams', 'new hire experience'],
        structure: 'How-to walkthrough with numbered steps',
        tone: 'Professional',
        length: 'Around 1000 words',
        sources: 'Common failure pattern worth using: the new starter is set up with accounts on day one, has three meetings in week one, and then goes quiet for a fortnight because nobody owns their week two.',
        avoid: 'no virtual-coffee clichés, do not recommend specific software, avoid the word "culture" unless it is doing real work'
      }
    }
  ],

  coding: [
    {
      label: 'CSV transaction parser',
      values: {
        build: 'A function that takes a CSV of bank transactions and returns totals grouped by month, so I can see spend per category over time.',
        lang: 'TypeScript, no external dependencies',
        codebase: 'type Transaction = {\n  date: string;      // ISO 8601, but the CSV sometimes has DD/MM/YYYY\n  description: string;\n  amount: number;    // negative for money out\n  category?: string;\n};',
        reqs: ['Return a plain object keyed by YYYY-MM', 'Group by category within each month', 'Keep money-in and money-out separate', 'Pure function, no I/O'],
        edge: 'Empty file, header row only, DD/MM/YYYY dates mixed with ISO, missing category, amounts with currency symbols or thousands separators, duplicate rows',
        level: 'Code plus a short explanation of the approach',
        tests: true
      }
    },
    {
      label: 'Debounced search box',
      values: {
        build: 'A search input component that waits until the user stops typing before firing a request, cancels any request already in flight, and never renders results from a stale response.',
        lang: 'React 18 with TypeScript, function components and hooks',
        codebase: 'async function searchItems(\n  query: string,\n  signal: AbortSignal\n): Promise<Item[]>',
        reqs: ['300ms debounce', 'Abort the previous request when a new one starts', 'Ignore out-of-order responses', 'Show a loading state only after 500ms so fast responses do not flicker'],
        edge: 'User clears the input mid-flight, component unmounts mid-flight, the same query typed twice in a row, network error',
        level: 'Code with brief inline comments',
        tests: false
      }
    }
  ],

  debug: [
    {
      label: 'Totals that come out wrong',
      values: {
        mode: 'Find and fix a bug',
        code: 'async function getTotals(userIds) {\n  const totals = {};\n  userIds.forEach(async (id) => {\n    const orders = await fetchOrders(id);\n    totals[id] = orders.reduce((sum, o) => sum + o.amount, 0);\n  });\n  return totals;\n}',
        symptom: 'Expected an object with a total for every user id. Actually get an empty object most of the time, and very occasionally one or two entries. Same input gives different results between runs.',
        error: 'No error thrown. The function resolves successfully with {}.',
        tried: 'Added logging inside the reduce and it does run, just apparently after the caller has already used the result. Tried making fetchOrders faster, which changed how many entries appear but did not fix it.',
        env: 'Node 20, called from an Express route handler',
        shape: 'Diagnosis, then the fix, then why it works',
        rootcause: true
      }
    },
    {
      label: 'Query that got slow',
      values: {
        mode: 'Make this code faster',
        code: 'SELECT o.id, o.created_at, c.name,\n       (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.created_at >= NOW() - INTERVAL \'30 days\'\nORDER BY o.created_at DESC\nLIMIT 50;',
        symptom: 'Ran in about 40ms for the first year. Now takes 6-9 seconds. The orders table crossed roughly 2 million rows last month, order_items is about 14 million.',
        error: '',
        tried: 'Added an index on orders.created_at, which helped a little but not much. Increased work_mem with no effect.',
        env: 'Postgres 15, 4GB RAM, orders table 2.1M rows, order_items 14M rows',
        shape: 'Diagnosis, then the fix, then why it works',
        rootcause: true
      }
    }
  ],

  analysis: [
    {
      label: 'Which product is losing money',
      values: {
        question: 'Which of these product lines is actually losing us money once returns and support costs are counted?',
        data: 'Product,Units,Revenue,COGS,Returns %,Support tickets\nAlpha,4200,84000,41000,3.1,180\nBravo,1150,92000,38000,11.4,940\nCharlie,8800,61600,44000,1.8,210\nDelta,320,48000,19000,6.2,150\nEcho,2600,52000,33800,4.4,390',
        datacontext: 'Twelve months to March. Revenue and COGS are in pounds and exclude VAT. Returns % is units returned as a share of units sold. Support tickets are raw counts, not weighted by handling time — we estimate an average ticket costs us about £9 in staff time.',
        decision: 'Whether to discontinue a product line before we commit to next season\'s stock order',
        audience: 'two founders who are comfortable with numbers but are not analysts',
        depth: 'Executive summary then detail',
        caveat: true
      }
    },
    {
      label: 'Churn by signup cohort',
      values: {
        question: 'Are customers who signed up during our discount promotion churning faster than everyone else?',
        data: 'Cohort,Signups,Active m1,Active m3,Active m6,Avg monthly £\n2025-01 (full price),310,281,246,221,29\n2025-02 (full price),295,268,238,209,31\n2025-03 (50% promo),980,742,398,201,14\n2025-04 (full price),340,312,279,244,30\n2025-05 (full price),355,321,288,251,32',
        datacontext: 'Monthly signup cohorts with counts still active at 1, 3 and 6 months. March ran a 50% off first-three-months promotion. Avg monthly £ is average revenue per active user in that cohort at month 6, so the promo discount has already ended by then.',
        decision: 'Whether to run the same promotion again for Black Friday',
        audience: 'a board of non-specialists who will see this as one slide',
        depth: 'Findings with supporting numbers',
        caveat: true
      }
    }
  ],

  summarise: [
    {
      label: 'A board paper nobody read',
      values: {
        source: 'The Finance and Resources Committee met on 14 May. The Director of Finance presented the Q4 position, noting an underspend of £182,000 against a budgeted deficit of £95,000, principally due to three unfilled posts in the digital team and a delayed software procurement. Members asked whether the underspend could be carried forward; the Director advised that under current reserves policy only £50,000 may be carried without Board approval. The Committee discussed the proposed 4% uplift to the staffing budget for the coming year. Two members expressed concern that this assumed a recruitment success rate the organisation has not achieved in three years. The Head of People noted that time-to-hire had improved from 94 days to 61 days following the change of recruitment partner, but acknowledged that two senior roles remain unfilled after eleven months. The Committee did not reach a decision on the uplift and agreed to return to it in July with a revised recruitment forecast. On the software procurement, the Committee approved proceeding to contract subject to the outcome of the data protection impact assessment, which remains outstanding.',
        goal: 'Key decisions and action items',
        focus: 'anything with a financial figure, a deadline, or an unresolved decision',
        audience: 'a trustee who missed the meeting and has ten minutes before the next one',
        length: 'Around 250 words',
        fidelity: true
      }
    },
    {
      label: 'A customer interview',
      values: {
        source: 'Interviewer: So walk me through the last time you needed to pull a report.\nParticipant: Right, so it was month end, and I need the spend broken down by department. And I know it can do that, I have done it before, but I can never remember where it lives. So I click around for a bit. Eventually I found it under Insights, which, I would not have guessed that.\nInterviewer: What would you have guessed?\nParticipant: Reports? There is a Reports section. But that is the scheduled ones, apparently. Anyway I get there, I set it up, and then it wants a date range and it defaults to the last seven days which is never what I want, not once, ever. So I change it. And then I export and it gives me a CSV where the department is an ID number, not a name. So then I am doing a lookup in Excel to make it readable. Every single month.\nInterviewer: Have you mentioned this to anyone?\nParticipant: I mentioned the CSV thing to our account manager maybe a year ago. She said she would pass it on. And to be fair the tool is good, I am not slagging it off, this is like ten minutes a month. But it is the same ten minutes every month.',
        goal: 'Risks and concerns raised',
        focus: 'anything that costs the user repeated time, and anything they have already reported without resolution',
        audience: 'a product team deciding what to fix next quarter',
        length: 'Around 250 words',
        fidelity: true
      }
    }
  ],

  support: [
    {
      label: 'Order arrived damaged',
      values: {
        want: 'A reply to send to the customer',
        message: 'This is the second time I have written. My order (#48120) turned up with the glass smashed and the box looked like it had been kicked down a flight of stairs. I sent photos five days ago and have heard absolutely nothing. I have people coming Saturday. Either sort this out today or refund me and I will go elsewhere.',
        situation: 'Courier damage, clearly visible in the photos they sent. Their first email did arrive but our inbox rule was misrouting anything with an attachment into a folder nobody was checking — that is on us, not them. We have the item in stock and can get it there by Friday on a next-day service.',
        resolution: 'A replacement dispatched today on next-day delivery arriving Friday, plus a refund of the original delivery charge. A full refund instead if they prefer.',
        policy: 'Do not admit liability for the courier\'s handling. Do not offer compensation beyond the delivery refund without a manager signing it off.',
        brand: 'warm and human, plain English, no corporate hedging',
        tone: 'Empathetic',
        length: 'Around 250 words',
        apology: true
      }
    },
    {
      label: 'Charged twice',
      values: {
        want: 'Three reply options with different levels of goodwill',
        message: 'You have taken £59 twice this month. I have checked my bank three times. I want it back today please, and I want to know how this happened because if it happens again I am cancelling.',
        situation: 'A genuine double charge caused by a failed payment retry that actually succeeded the first time. It hit 40-odd customers on the same day. The refund takes 3-5 working days to land once we issue it, which we cannot speed up — that is the card network, not us.',
        resolution: 'Immediate refund of the duplicate £59, which will take 3-5 working days to appear. We can also credit next month\'s subscription if that helps.',
        policy: 'Be honest that it was our error. Do not promise the refund will arrive faster than 3-5 working days. Do not name the payment provider.',
        brand: 'straightforward and accountable, no weasel words',
        tone: 'Direct and concise',
        length: 'Around 100 words',
        apology: true
      }
    }
  ],

  meeting: [
    {
      label: 'Weekly product sync',
      values: {
        transcript: 'Priya: Right, where are we with the export feature.\nTom: Backend is done, front end is maybe two days. The blocker is we still do not know what happens if someone exports more than 50,000 rows.\nPriya: What does happen?\nTom: Currently it times out. Silently.\nPriya: That is not great. Can we cap it?\nTom: We can cap it, we just need someone to decide the number and what the message says.\nSam: I can write the message. What is the number?\nTom: I would say 25,000 to be safe.\nPriya: Fine, 25,000, Sam writes the copy. Tom, does that unblock you?\nTom: Yes.\nPriya: Good. Sam, the pricing page.\nSam: I need sign-off from legal on the wording and I have not heard back. Chased twice.\nPriya: I will chase legal. Anything else?\nTom: The staging environment has been down since Tuesday, which is slowing me down.\nPriya: Who owns that?\nTom: Nobody, really. It used to be Ali.\nPriya: Hmm. Leave it with me. Let us pick that up next week.\nSam: Are we still doing the launch on the 30th?\nPriya: I think so. Let us confirm once the export thing is closed off.',
        meta: 'weekly product sync, 3 attendees, 20 minutes',
        want: 'Summary, decisions and action items',
        owners: true,
        unresolved: true
      }
    },
    {
      label: 'Client kickoff',
      values: {
        transcript: 'Notes from kickoff, 14th, at their office. Present: me, Dan, their MD (Ruth), their ops lead (Karim), plus someone from marketing who left after twenty minutes.\nRuth wants the whole thing live before their trade show, which is 3 October. Said it three times so clearly it matters. Dan pointed out that is nine weeks and our estimate was eleven. Ruth said the trade show date is not moveable. No resolution.\nKarim walked us through the current process. Much messier than the brief suggested. They have two separate spreadsheets that both claim to be the master, and nobody could tell us which one wins when they disagree. Karim is going to find out.\nData migration is the big unknown. They think there are about 4,000 records. Karim thinks it might be closer to 12,000 including the archive. Needs confirming before we can size it.\nRuth asked about training. We said we would include two half-day sessions. She wanted four. Left it open.\nMarketing person asked whether it would integrate with their email platform. Nobody knew which platform. She left before we could ask.\nAgreed: Karim sends us a data sample by end of next week. We come back with a revised plan once we have seen it. Ruth wants a call on the 21st either way.',
        meta: 'client project kickoff, 5 attendees, roughly 90 minutes, my rough handwritten notes',
        want: 'Summary, decisions and action items',
        owners: true,
        unresolved: true
      }
    }
  ],

  career: [
    {
      label: 'Cover letter, ops manager',
      values: {
        what: 'A cover letter',
        job: 'Operations Manager, growing e-commerce business, 45 staff across two sites. You will own warehouse throughput, supplier relationships and a team of eleven. We are looking for someone who has scaled operations through a period of rapid growth and can bring order without bureaucracy. Experience with WMS implementation desirable. Reporting to the COO.',
        background: 'Nine years in operations, currently Operations Supervisor at a 3PL handling fashion returns. Team of six, grew to fourteen over two years during a client onboarding. Cut average processing time per return from 11 minutes to 6.5. Led the pilot of a new WMS across one site — went live four weeks late but under budget, and I learned more from the delay than the launch. No formal management qualification. Two years before that in retail store management.',
        why: 'I have spent nine years making other people\'s operations work and I want to own one properly. The two-site setup is the interesting part — I have seen how quickly two sites drift into two different companies if nobody is deliberate about it.',
        tone: 'Professional',
        length: 'Around 250 words',
        honest: true,
        avoid: 'no "I am passionate about", do not open with "I am writing to apply for", do not claim experience I have not listed'
      }
    },
    {
      label: 'Rewriting flat CV bullets',
      values: {
        what: 'Rewrite my CV bullet points',
        job: 'Marketing Executive, B2B software. You will run our email programme, support content production and report on campaign performance. We want someone comfortable with data who can also write. Hubspot experience preferred.',
        background: 'Current bullets, which I know are weak:\n- Responsible for social media accounts\n- Helped with email marketing campaigns\n- Assisted in the creation of marketing materials\n- Worked closely with the sales team\n\nWhat actually happened: I ran four social accounts and grew LinkedIn followers from 800 to 3,400 in eighteen months. I built and sent the monthly newsletter, about 6,000 recipients, and got open rates from 18% to 27% by rewriting subject lines and cutting send frequency. I wrote eleven case studies. I set up a shared Slack channel with sales that turned into how we source case studies now.',
        why: 'Same kind of role but at a company where marketing is not an afterthought.',
        tone: 'Direct and concise',
        length: 'As short as possible',
        honest: true,
        avoid: 'no "spearheaded" or "leveraged", no metrics I have not given you, keep each bullet to one line'
      }
    }
  ],

  learn: [
    {
      label: 'Credit card interest',
      values: {
        topic: 'How compound interest actually works against me on a credit card, and why paying the minimum keeps the balance so stubborn.',
        know: 'I understand that interest is a percentage and that carrying a balance costs money. I do not understand why the balance barely moves when I pay the minimum, or what APR means in terms of what I actually get charged each month.',
        level: 'A smart adult outside the field',
        why: 'Deciding whether it is worth moving £3,200 to a 0% balance transfer card with a 3% fee',
        analogies: true,
        check: true
      }
    },
    {
      label: 'What a VPN really does',
      values: {
        topic: 'What a VPN actually does and does not protect, and whether I need one.',
        know: 'I know it hides your location somehow and people use them for streaming. I have seen a lot of adverts claiming they make you anonymous and I am suspicious of that.',
        level: 'A complete beginner',
        why: 'I work from cafes two days a week and want to know if I am doing something risky',
        analogies: true,
        check: false
      }
    }
  ],

  brainstorm: [
    {
      label: 'Repeat custom from one-off clients',
      values: {
        challenge: 'Ways to get repeat business from wedding photography clients, who by definition only need a wedding photographed once.',
        context: 'Solo wedding photographer, about 22 weddings a year, average booking £2,400. Strong reviews and a decent Instagram following of around 4,000. Almost all new enquiries come from word of mouth or Instagram. Winter is dead — November to February I shoot maybe two things total.',
        tried: ['Anniversary shoot discounts, nobody took them up', 'Referral fee for past clients, felt awkward and got two bookings in a year', 'Selling prints and albums after the wedding'],
        limits: 'Solo operator, no staff, under £500 to try anything, must not require me to be in two places on a Saturday',
        count: '10',
        spread: true,
        evaluate: true
      }
    },
    {
      label: 'Fundraising for a village hall',
      values: {
        challenge: 'Ways to raise £18,000 for a village hall roof repair within twelve months.',
        context: 'Village of about 900 people. Committee of six volunteers, all with day jobs, average age around 60. The hall is used by a playgroup, two exercise classes, a monthly market and the parish council. We have £2,100 in the account and a mailing list of roughly 200 households.',
        tried: ['A raffle, which raised £340 and took a fortnight of effort', 'Applying to the parish council for a grant, refused', 'A GoFundMe that nobody outside the village shared'],
        limits: 'No committee member can commit more than about four hours a month, nothing that needs a licence we do not have, nothing that relies on good weather in a single fixed date',
        count: '15',
        spread: true,
        evaluate: true
      }
    }
  ],

  social: [
    {
      label: 'Hiring post that is not boring',
      values: {
        platform: 'LinkedIn',
        about: 'We are hiring a second support engineer. Small team of nine. The honest pitch is that the work is varied and you will have real ownership, but we are not a big brand and we cannot match agency salaries. What we can offer is a four-day week, which we have run for eighteen months and are not going back on.',
        goal: 'Drive clicks to a link',
        audience: 'support engineers with 2-5 years experience who are tired of ticket-factory jobs',
        tone: 'Casual and conversational',
        hook: true,
        hashtags: false,
        variants: '3',
        avoid: 'no "we are excited to announce", no "rockstar" or "ninja", do not pretend we are a family, no emoji bullet points'
      }
    },
    {
      label: 'Cafe reopening after a refit',
      values: {
        platform: 'Instagram caption',
        about: 'We are reopening on Saturday after six weeks closed for a refit. New bigger kitchen, twelve more seats, and the counter has moved so the queue no longer blocks the door. Same staff, same coffee, same prices.',
        goal: 'Announce something',
        audience: 'regulars and locals within walking distance who have been wondering when we would reopen',
        tone: 'Friendly and warm',
        hook: true,
        hashtags: true,
        variants: '3',
        avoid: 'do not overhype it, no "we cannot wait to welcome you back", nothing that reads like it was written by a marketing agency'
      }
    }
  ],

  research: [
    {
      label: 'Choosing an EPOS system',
      values: {
        question: 'Which EPOS system should a two-site independent cafe choose?',
        options: ['Square', 'Lightspeed', 'Zettle by PayPal', 'Epos Now'],
        criteria: ['Total monthly cost including card fees', 'Works across two sites with combined reporting', 'Stock tracking for a small kitchen', 'Ease of training seasonal staff', 'Exit cost if we switch away'],
        situation: 'Two cafes, roughly £480k combined annual turnover. Around 15 staff, high turnover of seasonal part-timers. Currently on an ageing till system with no stock function and no way to see both sites together. Budget is flexible but we are wary of long contracts after being locked into a three-year deal previously.',
        output: 'Comparison table then a recommendation',
        recommend: true,
        uncertainty: true
      }
    },
    {
      label: 'CRM for a small charity',
      values: {
        question: 'Which CRM should a small charity use to manage donors and volunteers?',
        options: ['Salesforce Nonprofit Cloud', 'Beacon', 'Donorfy', 'A well-organised spreadsheet'],
        criteria: ['Cost at our scale, including any nonprofit discount', 'Gift Aid claim handling', 'How much admin time it saves versus costs', 'Whether a non-technical volunteer can maintain it', 'Data protection and UK hosting'],
        situation: 'UK registered charity, income around £240,000 a year, two part-time paid staff and about thirty volunteers. Roughly 900 donors, of whom 300 give monthly. Currently three spreadsheets and a lot of goodwill. Nobody on the team is technical. We claim Gift Aid quarterly and it takes about two days each time.',
        output: 'Ranked shortlist with reasoning',
        recommend: true,
        uncertainty: true
      }
    }
  ],

  image: [
    {
      label: 'The watchmaker',
      values: {
        subject: 'an elderly watchmaker bent over his bench, loupe to one eye, tweezers holding a tiny gear',
        setting: 'a cluttered workshop lined with parts drawers and half-finished movements, late afternoon',
        style: 'Photorealistic',
        lighting: 'Golden hour',
        camera: 'close-up portrait, 85mm, shallow depth of field, focus on the hands',
        colour: 'warm browns and brass with cool shadow, nostalgic and quiet',
        ratio: 'Landscape 16:9',
        negative: ['text', 'watermark', 'extra fingers', 'modern electronics', 'clean minimal workspace']
      }
    },
    {
      label: 'Product shot for a coffee brand',
      values: {
        subject: 'a matte black bag of coffee beans standing upright, a scattering of roasted beans at its base',
        setting: 'a bare concrete surface against a soft neutral backdrop, nothing else in frame',
        style: 'Product photography',
        lighting: 'Soft diffused',
        camera: 'three-quarter angle, 50mm, sharp throughout, product fills the middle third',
        colour: 'muted greys and deep brown, one warm highlight, understated and premium',
        ratio: 'Portrait 4:5',
        negative: ['text', 'logos', 'hands', 'coffee cups', 'busy background', 'harsh reflections']
      }
    }
  ]
};

/* Quantity-only selects are safe to vary at random — they cannot make a scenario
   incoherent the way a tone or structure change could. */
var QUANTITY_KEYS = ['variants', 'count'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* Returns { templateId, label, values } or null if nothing is available. */
PF.randomExample = function (excludeTemplateId) {
  var ids = Object.keys(PF.EXAMPLES).filter(function (id) {
    return PF.EXAMPLES[id] && PF.EXAMPLES[id].length && PF.getTemplate(id);
  });
  if (!ids.length) return null;

  var pool = ids.length > 1 && excludeTemplateId
    ? ids.filter(function (id) { return id !== excludeTemplateId; })
    : ids;

  var id = pick(pool);
  return PF.exampleFor(id);
};

/* A random scenario from one specific template, optionally avoiding a repeat. */
PF.exampleFor = function (templateId, excludeLabel) {
  var list = PF.EXAMPLES[templateId];
  var template = PF.getTemplate(templateId);
  if (!list || !list.length || !template) return null;

  var pool = list.length > 1 && excludeLabel
    ? list.filter(function (e) { return e.label !== excludeLabel; })
    : list;

  var chosen = pick(pool);
  var values = {};
  Object.keys(chosen.values).forEach(function (k) {
    var v = chosen.values[k];
    values[k] = Array.isArray(v) ? v.slice() : v;
  });

  template.fields.forEach(function (f) {
    if (f.type === 'select' && QUANTITY_KEYS.indexOf(f.key) !== -1) {
      values[f.key] = pick(f.options);
    }
  });

  return { templateId: templateId, label: chosen.label, values: values };
};

PF.hasExamples = function (templateId) {
  return !!(PF.EXAMPLES[templateId] && PF.EXAMPLES[templateId].length);
};

/* Catches the drift that bit us before: a value for a key the template does not
   have, or a select value that is not one of that field's options. */
PF.validateExamples = function () {
  var problems = [];

  Object.keys(PF.EXAMPLES).forEach(function (id) {
    var template = PF.getTemplate(id);
    if (!template) { problems.push('No template with id "' + id + '"'); return; }

    var byKey = {};
    template.fields.forEach(function (f) { byKey[f.key] = f; });

    PF.EXAMPLES[id].forEach(function (ex) {
      if (!ex.label) problems.push(id + ': a scenario is missing its label');

      Object.keys(ex.values).forEach(function (k) {
        var f = byKey[k];
        if (!f) { problems.push(id + '/"' + ex.label + '": no field "' + k + '"'); return; }

        var v = ex.values[k];
        if (f.type === 'select' && f.options.indexOf(v) === -1) {
          problems.push(id + '/"' + ex.label + '": ' + k + ' = "' + v + '" is not one of its options');
        }
        if (f.type === 'tags' && !Array.isArray(v)) {
          problems.push(id + '/"' + ex.label + '": ' + k + ' must be an array');
        }
        if (f.type === 'toggle' && typeof v !== 'boolean') {
          problems.push(id + '/"' + ex.label + '": ' + k + ' must be true or false');
        }
      });
    });
  });

  PF.TEMPLATES.forEach(function (t) {
    if (!PF.hasExamples(t.id)) problems.push('Template "' + t.id + '" has no examples');
  });

  if (problems.length) console.warn('[PromptForge] Example problems:\n' + problems.join('\n'));
  return problems;
};

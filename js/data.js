// All game content lives here: stats, emperors, events, endings, ranks, headlines.
// Tone: satirical, cynical, absurdist. Keep jokes short, dry and a little mean.

export const SLOGAN_LINE_1 = 'Choose Your Emperor...';
export const SLOGAN_LINE_2 = 'As Many Times as it Takes!';

export const REIGN_DAYS = 8;

// dir: +1 means higher is better, -1 means lower is better (Paranoia).
export const STATS = [
  { key: 'treasury', label: 'Treasury', short: 'TRS', dir: 1, color: '#e0a94a', blurb: 'Denarii in the coffers. Mostly coffers.' },
  { key: 'plebs', label: 'Mob Mood', short: 'MOB', dir: 1, color: '#d0704f', blurb: 'The plebs. Currently deciding whether to love you.' },
  { key: 'senate', label: 'Senate Patience', short: 'SEN', dir: 1, color: '#7f9fd0', blurb: 'How long the Senate will tolerate you before it votes.' },
  { key: 'paranoia', label: 'Paranoia', short: 'PAR', dir: -1, color: '#a163b5', blurb: 'Hits 100 and everyone gets purged. Including you.' },
  { key: 'morale', label: 'Guard Morale', short: 'GRD', dir: 1, color: '#72b47f', blurb: 'Your fellow Praetorians. Also you. Hits 0 and you mutiny.' },
];

export const START_STATS = { treasury: 50, plebs: 50, senate: 50, paranoia: 20, morale: 60 };

// Applied at the end of every day, after the player's choice. The Empire costs money
// to run, the plebs get bored, and paranoia creeps up on its own. Action is mandatory.
export const UPKEEP = { treasury: -2, plebs: -3, senate: -1, paranoia: 5, morale: -5 };

// Shown on the reign screen. Keys match the `stats` object used by the engine.
export const STAT_KEYS = STATS.map((s) => s.key);
export const STAT_LABEL = Object.fromEntries(STATS.map((s) => [s.key, s.label]));

// ---------------------------------------------------------------------------
// Emperors (the candidates). `mods` are applied to starting stats.
// `look` drives the procedural pixel portrait (see portrait.js).
// `unlockAt` = number of completed reigns required before they enter the lottery.
// `end` is the natural-causes ending for this emperor.
// ---------------------------------------------------------------------------
export const EMPERORS = [
  {
    id: 'little_boots',
    name: 'Gaius Tertius "Little Boots"',
    title: 'Emperor of Rome (Conditional)',
    blurb: 'Raised in the stables. Believes he is a horse, or at least a horse-adjacent person. Wants his horse made consul. Is, in fairness, the most popular man in the Forum.',
    traits: ['Adores horses', 'Very popular with the stables'],
    tags: ['horse'],
    mods: { plebs: 10, paranoia: 15 },
    look: { hairStyle: 'bowl', eyes: 'wide', mouth: 'open', headwear: 'none', beard: 'none', blush: true, stripe: true },
    end: 'Trampled by his favourite horse, which the Senate then elected to the consulship by acclamation.',
  },
  {
    id: 'lucia',
    name: 'Lucia Vexmarch',
    title: 'Consul of the Feed',
    blurb: 'Three million followers and one baker who keeps replying with the word "bread". Believes all governance is content. Is, annoyingly, correct.',
    traits: ['Chronically online', 'Loves a sunset post'],
    tags: ['media'],
    mods: { plebs: 20, senate: -15 },
    look: { hairStyle: 'bun', eyes: 'normal', mouth: 'smirk', headwear: 'laurel', blush: true, stripe: true },
    end: 'Died mid-livestream, with four million viewers and no idea where she was.',
  },
  {
    id: 'dorcas',
    name: 'Dorcas of Ostia',
    title: 'Emperor (Accountant Edition)',
    blurb: 'Balanced the books so well nobody can find the money. Has never once been seen to enjoy anything, including the money.',
    traits: ['Spreadsheet-minded', 'Does not blink often'],
    tags: ['accountant'],
    mods: { treasury: 30, plebs: -10 },
    look: { hairStyle: 'bowl', eyes: 'sleepy', mouth: 'flat', headwear: 'none', beard: 'none', blush: false, stripe: true },
    end: 'Died of a paper cut on a budget that was, admittedly, very thin.',
  },
  {
    id: 'octavia',
    name: 'Octavia Minor',
    title: 'Emperor (Age Nine)',
    blurb: 'Inherited the throne from a grandfather who wrote "please keep it warm" on the scroll. Issues edicts before breakfast. Breakfast is also an edict.',
    traits: ['Surprisingly cruel', 'Very cute, for political purposes'],
    tags: ['child'],
    mods: { plebs: 25, senate: -20 },
    look: { hairStyle: 'bun', eyes: 'wide', mouth: 'smile', headwear: 'none', beard: 'none', blush: true, stripe: false },
    end: 'Passed peacefully after eating the Imperial supply of honeyed figs. The figs were never recovered.',
  },
  {
    id: 'pompeius',
    name: 'Pompeius the Retired',
    title: 'Former Gladiator, Current Problem',
    blurb: 'Has not lost a fight in forty years of retirement. Challenges the Senate to a duel most Tuesdays. Is winning.',
    traits: ['Undefeated (in the wrong arenas)', 'Thinks everything is a duel'],
    tags: ['gladiator'],
    mods: { plebs: 15, senate: -10, morale: 10 },
    look: { hairStyle: 'balding', eyes: 'angry', mouth: 'frown', beard: 'full', headwear: 'helmet', blush: false, stripe: true },
    end: 'Challenged the Senate to a duel and, for the first time in his life, lost to a motion.',
  },
  {
    id: 'tiberius',
    name: 'Tiberius, Mildly Disappointed',
    title: 'Emperor of Suspicion',
    blurb: 'Suspects the ceiling. Has checked the ceiling. The ceiling was listening, and has since been reassigned to the Senate.',
    traits: ['Trusts no one', 'Checks the ceiling daily'],
    tags: ['paranoid'],
    mods: { paranoia: 25, plebs: -5 },
    look: { hairStyle: 'balding', eyes: 'crazy', mouth: 'frown', beard: 'stubble', headwear: 'none', blush: false, stripe: true },
    end: 'Died of a fully justified, extremely thorough, entirely imaginary plot. His bodyguards were the plot.',
  },
  {
    id: 'severus',
    name: 'Severus the Cheesemonger',
    title: 'Lottery Emperor',
    blurb: 'Won the Imperial Lottery with a ticket bought from his own cheese stall. The cheese is excellent. The Empire is less certain.',
    traits: ['Speaks in aged metaphors', 'Smells of decisions'],
    tags: ['cheese'],
    mods: { treasury: 20, plebs: 5 },
    look: { hairStyle: 'curly', eyes: 'normal', mouth: 'smile', headwear: 'chef', beard: 'mustache', blush: true, stripe: false },
    end: 'Was ripened, sliced, and sold in the Forum at four sesterces a wedge. Sold out by noon.',
  },
  {
    id: 'claudius',
    name: 'Claudius (Backwards)',
    title: 'Emperor, Facing Away',
    blurb: 'Wears his toga backwards and considers it a fashion statement. Nobody has the courage to say otherwise, so it has become policy.',
    traits: ['Wears toga backwards', 'Believes the back is the front'],
    tags: ['backwards'],
    mods: { senate: 5, morale: -5 },
    look: { hairStyle: 'wild', eyes: 'sleepy', mouth: 'smirk', headwear: 'none', beard: 'none', blush: false, stripe: true },
    end: 'Fell down the stairs, which everyone agreed were facing the wrong way.',
  },
  {
    id: 'brutus',
    name: 'Brutus the Pragmatist',
    title: 'Loyal to Whoever Is Winning',
    blurb: 'Has sworn loyalty to you, your predecessor, and the Gauls. Is sincere about all three, in the moment.',
    traits: ['Loyal (provisionally)', 'Keeps a second dagger for the first'],
    tags: ['betrayer'],
    mods: { paranoia: 10, morale: 10 },
    look: { hairStyle: 'bowl', eyes: 'normal', mouth: 'smirk', headwear: 'none', beard: 'goatee', blush: false, stripe: true },
    end: 'Betrayed at last by the one person he had never once considered: himself.',
  },
  {
    id: 'magnus',
    name: 'Magnus Vitellius',
    title: 'Lord of Forms',
    blurb: 'Has never met a form he did not want to duplicate. Form 47-B certifies the receipt of Form 47-A, which has not been received.',
    traits: ['Files everything in triplicate', 'Sighs in standard units'],
    tags: ['bureaucrat'],
    mods: { senate: 20, plebs: -15 },
    look: { hairStyle: 'curly', eyes: 'sleepy', mouth: 'flat', headwear: 'none', beard: 'none', blush: false, stripe: true },
    end: 'Was filed in triplicate under "Deceased", pending review.',
  },
  {
    id: 'helena',
    name: 'Helena the Lyre-Strummer',
    title: 'Patron of Vibes',
    blurb: 'Plays the lyre at every crisis. Is fabulous. The crises remain, but they are very well dressed now.',
    traits: ['Performs at all hours', 'Cannot stop strumming'],
    tags: ['music'],
    mods: { plebs: 15, treasury: -15 },
    look: { hairStyle: 'long', eyes: 'wide', mouth: 'open', headwear: 'laurel', beard: 'none', blush: true, stripe: true },
    end: 'Died during the encore. The Senate has requested a second encore, in her honour.',
  },
  {
    id: 'anserus',
    name: 'Anserus Maximus',
    title: 'The Goose',
    blurb: 'A goose. Elected in a landslide by a population that found the goose more relatable than the Senate. Holds no opinions, and is honked about it.',
    traits: ['Honks in committee', 'Unbothered by everything'],
    tags: ['goose'],
    species: 'goose',
    mods: { senate: 10, plebs: 10, paranoia: -10 },
    look: {},
    unlockAt: 1,
    end: 'Was honked, not bitten, into the Tiber. Still considered the most honest reign on record.',
  },
  {
    id: 'cassia',
    name: 'Cassia, Former Emperor',
    title: 'Emperor Posthumously',
    blurb: 'Died eleven years ago. Declined to leave. Still has the keys. The Senate pretends not to see her, which is the most cooperative they have ever been.',
    traits: ['Technically deceased', 'Holds the keys (possibly)'],
    tags: ['ghost'],
    species: 'ghost',
    mods: { senate: 15, treasury: 10 },
    look: {},
    unlockAt: 3,
    end: 'Died, again. The Senate observed a respectful silence. It was the first peace the city had known in eleven years.',
  },
  {
    id: 'bartholomew',
    name: 'Bartholomew the Potato',
    title: 'Emperor by Sprout',
    blurb: 'Grown in the Imperial garden. Has the Senate\'s endorsement, and the endorsement of several turnips. Has never been asked a single question.',
    traits: ['Earthy', 'Grows on people'],
    tags: ['potato'],
    species: 'potato',
    mods: { plebs: 20, treasury: -10, morale: 5 },
    look: {},
    unlockAt: 8,
    end: 'Was mashed for a state banquet. The plebs called it the finest reign in living memory.',
  },
];

export const EMPEROR_BY_ID = Object.fromEntries(EMPERORS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Events. Each choice either has `effects` (deterministic) or `gamble`
// ({ chance, win, lose }, where win/lose are outcomes with effects + result).
// `requires` = array of emperor tags, any of which unlocks the event (and gives it extra weight).
// ---------------------------------------------------------------------------
export const EVENTS = [
  {
    id: 'bread_situation',
    title: 'The Bread Situation',
    text: 'The bread has been replaced by a rumour about bread. The plebs are outside the Forum holding torches they borrowed from other torches.',
    choices: [
      { label: 'Import grain from Egypt. Egypt has opinions.', effects: { treasury: -20, plebs: 15 }, result: 'The grain arrived. So did Egypt\'s opinions, which were mostly about the price of the grain.' },
      { label: 'Blame the bakers, publicly.', setFlags: ['baker_blamed'], effects: { plebs: 5, senate: -5, paranoia: 5 }, result: 'The bakers are now enemies of Rome. Bread remains unavailable, but at least it is someone\'s fault.' },
      { label: 'Declare a Festival of Bread. It is mostly air.', effects: { plebs: 5, treasury: -5 }, result: 'The plebs ate the air with real gratitude. Several are now full, and most are sincerely thankful.' },
    ],
  },
  {
    id: 'lion_requisition',
    title: 'Requisition for Lions',
    text: 'The Circus requests lions. The Senate requests a budget. The lions request nothing. They are already hungry and have been for three days.',
    choices: [
      { label: 'Fund the lions in full.', setFlags: ['lions_fed'], effects: { treasury: -15, plebs: 15 }, result: 'The lions are magnificent. The Senate has been informed that the lions are a "line item".' },
      { label: 'Fund a smaller, sadder lion.', effects: { treasury: -5, plebs: 3 }, result: 'The plebs noticed. They are less impressed by sadness than you would think, but they are noticing.' },
      { label: 'Send a senator into the arena. Ratings, you know.', effects: { senate: -20, plebs: 15 }, result: 'The senator was not a great fighter. He was, however, extremely well liked by the lion.' },
    ],
  },
  {
    id: 'horse_senator',
    title: 'A Bill to Seat the Horses',
    text: 'Senator Gracchus proposes that the Senate be seated by a lottery of horses. He has a horse. The horse has a better attendance record than he does.',
    choices: [
      { label: 'Sign it. Why not.', effects: { senate: -10, treasury: 5 }, result: 'The horse was seated. The horse did not vote. It rarely does, and is still more effective than most.' },
      { label: 'Veto it through a dove.', effects: { paranoia: 10, senate: 5 }, result: 'The dove was intercepted by a Gracchus pigeon. The veto was rejected. It is now a pigeon matter.' },
      { label: 'Make the horse Consul instead.', effects: { plebs: 10, senate: -15 }, result: 'The horse is now Consul. Its first act was to consider a proposal. The proposal was a carrot.' },
    ],
  },
  {
    id: 'wine_cup',
    title: 'The Wine Near the Bedchamber',
    text: 'A cup of wine has been seen near your bedchamber. It has been reported by eleven informants, none of whom have been reported by anyone else.',
    choices: [
      {
        label: 'Taste the wine.',
        gamble: {
          chance: 0.5,
          win: { effects: { paranoia: -10, plebs: 5 }, result: 'It was just wine. Suspiciously good wine. You now trust nothing, except this wine.' },
          lose: { effects: { paranoia: 15 }, result: 'It was not poison. It was vinegar, which to a Roman is a kind of poison. You are fine. You feel fine. You feel fine.' },
        },
      },
      { label: 'Execute the eleven informants.', effects: { paranoia: -20, senate: -15 }, result: 'Informants remaining: zero. Witnesses: zero. Confidence: boundless.' },
      { label: 'Hire a twelfth informant.', effects: { treasury: -10, paranoia: 5 }, result: 'The twelfth informant reported the other eleven. They have since reported the twelfth. It is a circle, but a nice one.' },
    ],
  },
  {
    id: 'pay_day',
    title: 'Pay Day, Delayed',
    text: 'The Praetorian Guard has not been paid in nine days. The Guard is loyal to the Emperor, provided the Emperor is paying. You are one of the Guard. You are, on reflection, not very loyal right now.',
    choices: [
      { label: 'Pay in full, in gold.', effects: { treasury: -25, morale: 20 }, result: 'The Guard is loyal again. You have never been so loyal to gold.' },
      { label: 'Pay in "exposure" and a stirring speech.', effects: { morale: -15, treasury: 5 }, result: 'The speech was nine minutes long. The exposure was real.' },
      { label: 'Offer the Guard "Prestige".', effects: { morale: 10, treasury: -5 }, result: 'Prestige is also available at the market for two denarii. Nobody mentions this.' },
    ],
  },
  {
    id: 'goose_in_forum',
    title: 'A Goose in the Forum',
    text: 'A goose has entered the Forum. It is not yours. It seems to think it is a senator. On the merits, it is correct.',
    choices: [
      { label: 'Consecrate the goose.', setFlags: ['goose_consecrated'], effects: { plebs: 10, senate: -5 }, result: 'The goose has been declared holy. It has not been informed. It is honking at the altar.' },
      { label: 'Chase the goose with a javelin.', effects: { morale: -5, paranoia: 5, plebs: 5 }, result: 'The goose survived, and so did the javelin. Only the Guard\'s dignity was lost.' },
      { label: 'Ignore the goose.', effects: { senate: -10 }, result: 'The goose was seated in the Senate by the Senate. It bit Senator Piso. Piso now wears a bandage and a new respect.' },
    ],
  },
  {
    id: 'temple_exemption',
    title: 'The Temple Requests Exemption',
    text: 'The Temple of Minor Gods requests a tax exemption. The gods, they say, are very busy and cannot be expected to pay for things they have not yet caused.',
    choices: [
      { label: 'Grant the exemption. The gods are grateful.', effects: { treasury: -10, senate: 5 }, result: 'The gods accepted the exemption and sent a thank-you note. It was delivered by a bird.' },
      { label: 'Tax the gods.', effects: { treasury: 15, senate: -10, paranoia: 10 }, result: 'The gods have not yet noticed. Lightning has been requested, in writing.' },
    ],
  },
  {
    id: 'monument',
    title: 'A Monument to Yourself',
    text: 'Architects propose a monument in your honour. It will be forty metres tall, shaped roughly like an egg, and visible only from one specific ditch.',
    choices: [
      { label: 'Commission it in marble.', effects: { treasury: -30, plebs: 15 }, result: 'The egg is finished. It is breathtaking. Nobody can see it, but everyone has been told how beautiful it is.' },
      { label: 'Commission a smaller egg.', effects: { treasury: -10, plebs: 5 }, result: 'A smaller egg has been built. People say it is cute. It is, regrettably, cute.' },
      { label: 'Accept only a plaque.', effects: { plebs: -5, treasury: 2 }, result: 'The plaque is three centimetres tall and says YOU. The plebs found it presumptuous, and were correct.' },
    ],
  },
  {
    id: 'comet',
    title: 'A Comet, Obviously Meaningful',
    text: 'A comet appears. Astrologers say it means the Emperor is favoured by the gods. Other astrologers say it means the opposite. Both are on your payroll.',
    choices: [
      { label: 'Declare it a divine sign.', effects: { plebs: 15, paranoia: -5, senate: -5 }, result: 'The comet was declared divine. The gods confirmed this by not sending a second comet, which is their way.' },
      { label: 'Declare it merely a comet.', effects: { plebs: -5, senate: 5, paranoia: 5 }, result: 'Scientifically it remains a comet. The plebs have ruled it "boring" and stopped looking up.' },
      { label: 'Blame the Carthaginians.', effects: { senate: 5, plebs: 5, paranoia: 5 }, result: 'The Carthaginians, long dead, have been blamed. They have not replied. Their silence is being read as a confession.' },
    ],
  },
  {
    id: 'senate_speech',
    title: 'The Senate Demands a Speech',
    text: 'The Senate demands a speech on the State of the Empire. The State of the Empire is "ongoing" and has been for four hundred years.',
    choices: [
      { label: 'Give a nine-hour speech.', effects: { senate: 10, plebs: -10 }, result: 'The Senate wept with admiration. The plebs went home at hour two and have since been listed as "absent".' },
      { label: 'Give a ninety-second speech.', effects: { senate: -10, plebs: 10 }, result: 'Short, bold, and contradictory. The plebs chanted it all week. The Senate took it personally.' },
      { label: 'Send a mime.', effects: { plebs: 5, senate: -5, treasury: -5 }, result: 'The mime was also unavailable. The Senate applauded the mime anyway, as a gesture towards nothing.' },
    ],
  },
  {
    id: 'tax_farmers',
    title: 'The Tax Farmers Have Found a Crop',
    text: 'Your tax farmers have discovered a new crop: taxes. They are harvesting heavily and have begun to name the fields after you.',
    choices: [
      { label: 'Let them farm.', effects: { treasury: 20, plebs: -15 }, result: 'A record harvest. The plebs are described in the ledgers as "fertile ground".' },
      { label: 'Audit them, furiously.', setFlags: ['farmers_audited'], effects: { treasury: 5, paranoia: 10, senate: 5 }, result: 'The audit found everything, including, somehow, you. The farmers are nervous. So are the accountants.' },
      { label: 'Make them pay double, then hug them.', effects: { treasury: 10, plebs: 5, morale: -5 }, result: 'They paid double and were hugged. They will remember the hug forever, as a form of debt.' },
    ],
  },
  {
    id: 'fortune_teller',
    title: 'The Fortune-Teller\'s Reading',
    text: 'A fortune-teller reads your will. You have not written one. The will reads "everything to the Senate, in a single sentence, with an apology".',
    choices: [
      { label: 'Write a new will, in ink.', effects: { paranoia: -5, treasury: -5 }, result: 'The new will is short. It says "Rome," then a long dash, then "good luck".' },
      { label: 'Let the fortune-teller keep the will.', effects: { plebs: 10, senate: -5 }, result: 'The fortune-teller has decided to become a legend. The plebs find this inspiring.' },
      { label: 'Frame the fortune-teller for treason.', effects: { paranoia: 15, plebs: -5 }, result: 'The frame was surprisingly good. The trial lasted nine minutes. Fortune-tellers are now careful about the future.' },
    ],
  },
  {
    id: 'parthian_envoy',
    title: 'A Parthian Envoy, Who Would Like to Dine',
    text: 'A Parthian envoy offers an alliance and a sack of gold. He would like to come to dinner. He would like it to be a surprise.',
    choices: [
      { label: 'Accept the gold and the dinner.', effects: { treasury: 20, paranoia: 10 }, result: 'The dinner was lovely. The envoy left early, taking a vase. You would have liked a receipt.' },
      { label: 'Send a nicer envoy in return.', effects: { treasury: -5, senate: 5 }, result: 'Your envoy is a poet. The Parthians found the poetry moving, and the alliance quite confusing.' },
      {
        label: 'Poison the dinner, for the sake of peace.',
        gamble: {
          chance: 0.3,
          win: { effects: { senate: 10, paranoia: -10 }, result: 'Peace, at last, is served. It is a little bitter.' },
          lose: { effects: { paranoia: 20, senate: -10 }, result: 'The envoy was not poisoned. The dinner was. Everyone is now extremely polite about it.' },
        },
      },
    ],
  },
  {
    id: 'gladiator_union',
    title: 'The Gladiators Have Formed a Union',
    text: 'The gladiators have unionised. Their demands include sandals, a day off, and a lion that does not look at them like that.',
    choices: [
      { label: 'Negotiate, reasonably.', effects: { treasury: -15, morale: 5 }, result: 'A deal was struck. Sandals were provided. The lion remains concerning.' },
      { label: 'Unionise the lions too.', effects: { plebs: 10, treasury: -5 }, result: 'The lions have joined. Nobody knows what this means. The plebs find it hopeful.' },
      { label: 'Ban unions by decree. You are the decree.', effects: { plebs: -15, morale: 5, paranoia: 5 }, result: 'The unions are banned. The gladiators are, somehow, still the most organised people in Rome.' },
    ],
  },
  {
    id: 'census',
    title: 'The Census',
    text: 'A census counts four million citizens. A recount finds the same four million, plus one goose. The goose is not on the list. The goose is also not leaving.',
    choices: [
      { label: 'Register the goose as a citizen.', effects: { senate: -5, plebs: 10 }, result: 'The goose is now a citizen. It has voted, in the sense that it has stood near the ballot box and honked.' },
      { label: 'Tax the goose.', effects: { treasury: 10, plebs: -10 }, result: 'The goose has been taxed. It is unbothered, and has begun taxing back.' },
    ],
  },
  {
    id: 'dinner_party',
    title: 'A Dinner Party for the Senate',
    text: 'Someone has brought a cake shaped like Rome to the Senate dinner. It is on fire. It is, on balance, the most honest thing anyone has said all week.',
    choices: [
      { label: 'Put the cake out with wine.', effects: { treasury: -5, senate: 5 }, result: 'The fire is out. The wine is in. Rome is, for now, on fire only metaphorically.' },
      { label: 'Let the cake burn. Rome is burning anyway.', effects: { plebs: -5, senate: -5, paranoia: 5 }, result: 'The Senate found it very relatable and then began to argue about whose fault the cake was.' },
      { label: 'Eat the cake, in front of everyone.', effects: { morale: 5, plebs: 5, paranoia: -5 }, result: 'It was delicious, and slightly on fire. The Guard applauded. The Senate sent for a doctor.' },
    ],
  },
  {
    id: 'lion_dinner',
    title: 'The Lions Have Opinions About the Budget',
    text: 'The Imperial lions have sent a petition. It is signed by all of them, which is to say it is signed by one paw and an unsettling amount of drool.',
    choices: [
      { label: 'Read the petition in full.', effects: { plebs: 5, treasury: -5 }, result: 'It was a very long petition. It is now the national anthem, against your wishes.' },
      { label: 'Accept the paw print as a signature.', effects: { morale: -5, plebs: 10 }, result: 'The paw print is legally binding. The lions are, technically, citizens of Rome. They have not been informed.' },
    ],
  },
  // ----- New general events (v0.2) -----
  {
    id: 'aqueduct_leak',
    title: 'The Aqueduct Is Leaking',
    text: 'The aqueduct has sprung a leak in the shape of a very polite question mark. Water is flowing uphill into the Senate bathhouse.',
    choices: [
      { label: 'Fund repairs, in marble.', effects: { treasury: -20, plebs: 10 }, result: 'The repairs are beautiful and take four years. The water has since learned to flow politely downhill.' },
      { label: 'Summon the Water Guild.', effects: { treasury: -5, plebs: 5, senate: 5 }, result: 'The Water Guild arrived with buckets and a motion. The motion passed. The buckets are still a little wet.' },
      { label: 'Declare the leak a miracle.', effects: { plebs: 5, paranoia: 5, senate: -5 }, result: 'The plebs have begun queuing to drink from the miracle. The Senate has asked whether it is also a tax.' },
    ],
  },
  {
    id: 'triumph_request',
    title: 'A Triumph Has Been Requested',
    text: 'A general returns from a victory over a river, which he has since annexed. He requests a parade, twelve elephants, and the right to be emperor for an afternoon.',
    choices: [
      { label: 'Grant a parade. Not the emperorship.', effects: { plebs: 15, treasury: -15 }, result: 'The parade was spectacular. The elephants were not invited to the Senate, and have taken it personally.' },
      { label: 'Grant the emperorship, to be safe.', effects: { senate: -15, paranoia: 10, morale: -5 }, result: 'He was emperor for an afternoon. He was then made to stand in the rain, which is traditional.' },
      { label: 'Deny the triumph. He was never there.', effects: { senate: 5, plebs: -10, paranoia: 5 }, result: 'The general has been declared absent. He is still at the gates, wearing a very convincing absence.' },
    ],
  },
  {
    id: 'locusts',
    title: 'Locusts in the Senate Chamber',
    text: 'A cloud of locusts has entered the Senate chamber during a debate. The senators cannot decide whether to vote or to swat.',
    choices: [
      { label: 'Call a vote on the locusts.', effects: { senate: 5, plebs: -5, paranoia: 5 }, result: 'The locusts were voted down, then up, then into the Forum, where they were reported as a faction.' },
      { label: 'Hire the swatting guild.', effects: { treasury: -10, senate: 5 }, result: 'The guild swatted with great energy. The locusts swatted back, with greater numbers.' },
      { label: 'Declare the locusts honorary senators.', effects: { senate: -5, plebs: 10, morale: -5 }, result: 'The locusts were seated at the back. They have since been more productive than the front row.' },
    ],
  },
  {
    id: 'oracle_email',
    title: 'The Oracle Has Emailed',
    text: 'The Oracle of Delphi has sent a message. It is in all capitals, contains three exclamation marks, and asks whether you received her previous message.',
    choices: [
      { label: 'Reply that you received it.', effects: { paranoia: -5, senate: 3 }, result: 'The Oracle is pleased. She has since sent a second message asking whether you received the reply.' },
      { label: 'Ask for a prophecy about the Treasury.', effects: { treasury: 10, paranoia: 8 }, result: 'The prophecy: "It will be full, then empty, then full of something else." The accountants are already drafting a rebuttal.' },
      { label: 'Mark it as spam.', effects: { paranoia: 10, plebs: -5 }, result: 'Her next prophecy was about you, specifically. It was spam.' },
    ],
  },
  {
    id: 'printing_bill',
    title: 'A Printing Press Bill',
    text: 'A senator proposes that every citizen must own a printing press. He has already printed the law. It is eleven feet long and has not yet been read.',
    choices: [
      { label: 'Sign it, to see what happens.', effects: { plebs: 10, treasury: -5, paranoia: 5 }, result: 'Everyone now owns a printing press. Everyone is now printing opinions. Nothing else has been printed in a month.' },
      { label: 'Tax the printing presses.', effects: { treasury: 15, plebs: -10 }, result: 'The tax was passed. The presses were printed with the tax, and then the tax was printed on the presses.' },
      { label: 'Burn the law, then the press.', effects: { paranoia: -5, plebs: -5, senate: -10 }, result: 'The senator has since announced a second law, about fire safety, which is eleven feet long.' },
    ],
  },
  {
    id: 'cat_senator',
    title: 'A Cat Has Been Elected to the Senate, Again',
    text: 'The cat was elected by a margin of two votes and one nap. It has been asked to abstain. It is abstaining from everything.',
    choices: [
      { label: 'Confirm the election.', effects: { senate: -5, plebs: 10 }, result: 'The cat has been sworn in. It sat on the oath. It was not asked to get off.' },
      { label: 'Hold a recount, with treats.', effects: { treasury: -10, plebs: 8, senate: 5 }, result: 'The recount was unanimous. The cat was also unanimous, in its opinion of the treats.' },
      { label: 'Let the cat govern. Honestly, why not.', effects: { plebs: 8, senate: -15, morale: 5 }, result: 'The cat has passed three laws, all of them about warmth. The plebs are delighted. The Senate is in a warm corner.' },
    ],
  },
  // ----- Follow-up events. These only appear once a flag set by an earlier choice is on the table. -----
  {
    id: 'bakers_organise',
    title: 'The Bakers Have Organised',
    text: 'The bakers you blamed have formed a guild. Its first resolution declares you a considerable inconvenience to bread. They have also opened a bakery, which is competing with the Empire.',
    needsFlag: 'baker_blamed',
    choices: [
      { label: 'Recognise the guild, with a tax on crusts.', effects: { treasury: 12, plebs: -5 }, result: 'The guild paid. The crusts paid more. The bread is still missing, but now it is taxed.' },
      { label: 'Recognise the guild, with a hug.', effects: { plebs: 8, paranoia: -5 }, result: 'The bakers were hugged. They have since been very difficult to hug again.' },
      { label: 'Outlaw the guild.', effects: { paranoia: 10, plebs: -10, treasury: 5 }, result: 'The guild went underground. Its bread is underground too, which is worse for everyone.' },
    ],
  },
  {
    id: 'sunset_photoshopped',
    title: 'The Sunset Was Edited',
    text: 'A rival feed has proven that your sunset was taken at noon, in another city, with a filter called "Sad Empire". The hashtag has turned on you.',
    needsFlag: 'sunset_posted',
    choices: [
      { label: 'Post a sunrise to cover it.', effects: { plebs: 8, treasury: -5 }, result: 'The sunrise was real and is trending. Nobody trusts it. It is, at least, early.' },
      { label: 'Sue the rival feed.', effects: { treasury: -15, senate: 5 }, result: 'The lawsuit will take nine years. By then everyone will have forgotten the sunset, including you.' },
      { label: 'Claim the photo is art.', effects: { plebs: 5, senate: -5, paranoia: 3 }, result: 'The critics have called it "bold", which is what critics call things they cannot explain.' },
    ],
  },
  {
    id: 'goose_committee',
    title: 'The Goose Demands a Committee Seat',
    text: 'The consecrated goose has been seen at the Senate door. It is holding a small scroll, which it has eaten. Parts of the scroll were a bill.',
    needsFlag: 'goose_consecrated',
    choices: [
      { label: 'Give it a committee: Waterfowl and Public Works.', effects: { senate: 5, plebs: 8, treasury: -5 }, result: 'The committee has met once. It honked, the minutes were eaten, and a bridge was approved.' },
      { label: 'Chase it out with a broom.', effects: { morale: -5, plebs: -5, paranoia: 5 }, result: 'The goose was chased out. It returned by the back entrance, which was never locked, because nobody thought it needed one.' },
      { label: 'Ask it to vote. It honks yes.', effects: { senate: -5, plebs: 10 }, result: 'It honked yes. The Senate asked whether that was a vote. The goose honked yes again.' },
    ],
  },
  {
    id: 'lion_seconds',
    title: 'The Lion Wants Seconds',
    text: 'The lion has finished its dinner and is now looking at the budget as though it were a sheep.',
    needsFlag: 'lions_fed',
    choices: [
      { label: 'Feed it the budget committee.', effects: { senate: -15, plebs: 10, treasury: 5 }, result: 'The committee was very tough. The lion said so. The plebs cheered for the lion, who has no vote.' },
      { label: 'Feed it a sheep, at great expense.', effects: { treasury: -20, plebs: 5 }, result: 'The sheep was delicious and extremely expensive. The lion has written a thank-you note, in blood, on the invoice.' },
      { label: 'Explain politely that lions do not have a vote.', effects: { plebs: -5, paranoia: 5 }, result: 'The lion has been informed. It has not been convinced. Its tail has been informed too.' },
    ],
  },
  {
    id: 'farmers_revolt',
    title: 'The Tax Farmers Unionise Against the Audit',
    text: 'Following your audit, the tax farmers have formed a movement called "Taxes Are Our Problem Too". It is loud. It has a drum.',
    needsFlag: 'farmers_audited',
    choices: [
      { label: 'Negotiate a tax-free harvest.', effects: { treasury: -15, plebs: 10 }, result: 'A tax-free harvest was granted for one season. It was the best harvest anyone can remember, and it was entirely theirs.' },
      { label: 'Arrest the drummer.', effects: { paranoia: 10, plebs: -10 }, result: 'The drummer was arrested. The drum was not. It is now played by the entire Forum, at night, out of tune.' },
      { label: 'Join the drum circle.', effects: { plebs: 10, morale: 5, paranoia: -5, treasury: -5 }, result: 'You played. You were terrible. The farmers have made you an honorary member, which costs nothing and means everything.' },
    ],
  },
  {
    id: 'secret_poster',
    title: 'The Secret Is on a Poster',
    text: 'The secret you told the ceiling is now on a poster outside the baths. It has been translated into four languages. Three of them are accurate.',
    needsFlag: 'secret_told',
    choices: [
      { label: 'Tear down the poster.', effects: { paranoia: 8, plebs: -8 }, result: 'The poster has been torn down. Its replacement is a larger poster, with a question mark where your name was.' },
      { label: 'Print a bigger poster with a denial.', effects: { treasury: -10, plebs: 5, senate: -5 }, result: 'The denial was printed in very small letters. The secret was printed in very large ones.' },
      { label: 'Admit it, dramatically.', effects: { plebs: 12, senate: -10 }, result: 'You admitted everything, on the steps, with feeling. The plebs wept. The Senate is drafting a motion of concern.' },
    ],
  },
  // ----- Tag-specific events -----
  {
    id: 'memoir',
    title: 'The Horse Has Written a Memoir',
    text: 'Your horse has written a memoir. It is titled "Consul: A Life". Chapter one is about you, and it is unflattering in a distinctly equine way.',
    requires: ['horse'],
    choices: [
      { label: 'Ban the memoir.', effects: { paranoia: 10, plebs: -10 }, result: 'The memoir has been banned. It is now the bestselling book in Rome, under a different title.' },
      { label: 'Buy the memoir, to be seen buying it.', effects: { treasury: -10, plebs: 10 }, result: 'You were photographed buying it. The photograph is now on every wall. Your face is extremely smug.' },
      { label: 'Ghostwrite a rebuttal.', effects: { senate: -10, plebs: 5, treasury: -5 }, result: 'The rebuttal was written by a clerk and is titled "Consul: A Rebuttal". The horse is mildly hurt.' },
    ],
  },
  {
    id: 'feed_baker',
    title: 'The Feed and the Baker',
    text: 'Your Forum Feed has three million followers and one dissenting baker, who keeps replying with the word "bread".',
    requires: ['media'],
    choices: [
      { label: 'Post a sunset with a caption about unity.', setFlags: ['sunset_posted'], effects: { plebs: 15, senate: -5 }, result: 'The sunset was tremendous. The caption was a lie. The engagement, however, was real.' },
      { label: 'Block the baker.', effects: { paranoia: 5, plebs: -5 }, result: 'The baker was blocked. He is now posting from an alt account called "bread2".' },
      { label: 'Start a hashtag. #OneRome.', effects: { treasury: -5, plebs: 10, senate: -5 }, result: 'The hashtag is trending. Nobody knows what it means. Advertisers are very interested.' },
    ],
  },
  {
    id: 'cheese_tax',
    title: 'A Tax on Cheese',
    text: 'Severus proposes a tax on cheese. Cheese, he says, is "the only honest currency left in Rome". He is holding a wheel of it, aloft, like a relic.',
    requires: ['cheese'],
    choices: [
      { label: 'Adopt it. Immediately.', effects: { treasury: 20, plebs: -10 }, result: 'The cheese tax passed. The Forum now smells like a decision.' },
      {
        label: 'Refuse, then taste the wheel.',
        gamble: {
          chance: 0.5,
          win: { effects: { plebs: 5, morale: 5 }, result: 'It was excellent. You have agreed, in principle, to the cheese, which is not the same as agreeing to anything.' },
          lose: { effects: { treasury: -10, morale: -5 }, result: 'It was mouldy. It was also expensive. You have now paid the tax you refused.' },
        },
      },
      { label: 'Make Severus Minister of Cheese.', effects: { plebs: 10, senate: -5, morale: 5 }, result: 'He was appointed. He wept. The Senate has asked you to stop doing this sort of thing.' },
    ],
  },
  {
    id: 'ghost_keys',
    title: 'The Ghost and the Keys',
    text: 'Cassia\'s ghost says the previous Emperor is "still rather annoyed". She is holding the treasury keys. They are, technically, hers.',
    requires: ['ghost'],
    choices: [
      { label: 'Ask her, very politely, for the keys.', effects: { treasury: -5, paranoia: -5 }, result: 'She gave them to you. They open nothing. She has been through a lot.' },
      { label: 'Demand the keys.', effects: { paranoia: 15, senate: 5 }, result: 'She passed through the door. The door has been ghostly ever since.' },
      { label: 'Hold a séance to discuss the keys.', effects: { plebs: 10, treasury: -10 }, result: 'Attendance was huge. The keys remain elsewhere. Several senators now believe in the afterlife, and in invoices.' },
    ],
  },
  {
    id: 'child_edict',
    title: 'Octavia\'s Edict',
    text: 'Octavia has issued an edict. It bans vegetables. The edict is popular, and the vegetables are petitioning for amnesty.',
    requires: ['child'],
    choices: [
      { label: 'Enforce the edict.', effects: { plebs: 15, senate: -15 }, result: 'Vegetables were banned. Several turnips went into hiding. The plebs are thrilled.' },
      { label: 'Make the edict a suggestion.', effects: { plebs: -5, senate: 5 }, result: 'She accepted the suggestion, then suggested a vegetable. She was rather firm about it.' },
      { label: 'Offer her a carrot, as a compromise.', effects: { plebs: -5, paranoia: 5 }, result: 'Octavia was given a carrot. She was not impressed. Neither, it turns out, was the carrot.' },
    ],
  },
  {
    id: 'potato_crown',
    title: 'The Potato Wants a Crown',
    text: 'Bartholomew the Potato has requested a crown. The crown is the same size as the potato. The jeweller has requested a raise.',
    requires: ['potato'],
    choices: [
      { label: 'Grant the crown.', effects: { treasury: -10, plebs: 15 }, result: 'The crown is excellent. The potato is adequately crowned. The jeweller is pleased, and rich.' },
      { label: 'Grant a small crown, for dignity.', effects: { treasury: -3, plebs: 5 }, result: 'A small crown has been provided. The potato is wearing it with a flat, sprouting kind of dignity.' },
      { label: 'Mash the crown into the potato.', effects: { plebs: -15, paranoia: -10 }, result: 'Nobody can tell the difference. This is also the potato\'s political platform.' },
    ],
  },
  {
    id: 'lyre_concert',
    title: 'A Six-Hour Lyre Concert',
    text: 'Helena will perform a six-hour lyre concert in the Forum. Attendance is mandatory for the plebs. Helena is available for comment, and is commenting.',
    requires: ['music'],
    choices: [
      { label: 'Make attendance mandatory.', effects: { plebs: -10, morale: 5, treasury: 5 }, result: 'Everybody was present. Few were conscious. The concert has been described as "spiritual".' },
      { label: 'Make attendance optional.', effects: { plebs: 5, treasury: -10 }, result: 'Attendance was low. Helena described the Forum as "empty, but spiritually full".' },
      { label: 'Pay the crowd to clap.', effects: { treasury: -20, plebs: 20 }, result: 'The crowd has never clapped so loudly, or so precisely on the beat, for money.' },
    ],
  },
  {
    id: 'pompeius_duel',
    title: 'The Senate Accepts a Duel',
    text: 'Pompeius has challenged the Senate to a duel. The Senate has accepted, the first time it has accepted anything in years.',
    requires: ['gladiator'],
    choices: [
      { label: 'Let it happen. Charge admission.', effects: { treasury: 20, plebs: 10, senate: -10 }, result: 'Tickets sold out in four minutes. Pompeius won, and the Senate lost what dignity it had, which was already on sale.' },
      { label: 'Cancel the duel. Gladiators are a serious concern.', effects: { plebs: -10, morale: 5, senate: 5 }, result: 'The duel was cancelled. Pompeius is writing a strongly worded letter, in sand, with his sword.' },
      { label: 'Stand as the Senate\'s second.', effects: { morale: 10, paranoia: 10 }, result: 'You were the second. You were given no sword. Pompeius won anyway, and then asked you to help him up.' },
    ],
  },
  {
    id: 'form_47b',
    title: 'Form 47-B',
    text: 'Magnus has produced Form 47-B, certifying receipt of Form 47-A. Form 47-A has not been received. Both are in triplicate.',
    requires: ['bureaucrat'],
    choices: [
      { label: 'Sign it.', effects: { senate: 10, treasury: -5 }, result: 'It is signed. Form 47-C is now required to confirm 47-B.' },
      { label: 'Reject it with a stamp.', effects: { paranoia: 10 }, result: 'The stamp is enormous and red. It says REJECTED in Latin. Magnus has filed a Form 48-A in response.' },
      { label: 'File it under "Forms".', effects: { morale: 5, senate: -5 }, result: 'It is filed. The filing cabinet is now thirteen feet tall and occasionally clears its throat.' },
    ],
  },
  {
    id: 'backwards_toga',
    title: 'The Backwards Toga',
    text: 'Claudius is wearing his toga backwards again. Nobody has the courage to say so. The Senate has started wearing theirs backwards, in solidarity.',
    requires: ['backwards'],
    choices: [
      { label: 'Say something, gently.', effects: { senate: -5, plebs: 5 }, result: 'You said something, gently. Claudius replied that the back is the front, if you believe in it.' },
      { label: 'Wear yours backwards too.', effects: { plebs: 10, senate: 10, morale: -10 }, result: 'You are now both backwards. The Guard is confused. The Senate is delighted. Your back is cold.' },
      { label: 'Declare it a new edict.', effects: { treasury: -5, plebs: 5, paranoia: 5 }, result: 'The edict requires backwards togas for all of Rome. Rome has complied, mostly by accident.' },
    ],
  },
  {
    id: 'brutus_plot',
    title: 'Brutus Has Confessed to Plotting',
    text: 'Brutus is plotting against you. He has told you so, which is either a double bluff or a single bluff. You are not sure what a bluff of that kind is called.',
    requires: ['betrayer'],
    choices: [
      { label: 'Confront him publicly.', effects: { paranoia: -10, senate: -5, plebs: 5 }, result: 'He confessed, then claimed he had been joking. This is the most loyal thing he has done in years.' },
      { label: 'Promote him, to keep him close.', effects: { morale: -10, senate: 5 }, result: 'He is now Prefect. He is still plotting, but from a larger office, with a window.' },
      { label: 'Plot back. Obviously.', effects: { treasury: -10, paranoia: 10, morale: 5 }, result: 'You are now plotting against Brutus, who is plotting against you, who is plotting against your plotting. Rome is ecstatic.' },
    ],
  },
  {
    id: 'ceiling',
    title: 'The Ceiling Is Listening',
    text: 'Tiberius says the ceiling is listening. You checked. It is. It has heard everything, including the thing you said about the ceiling.',
    requires: ['paranoid'],
    choices: [
      { label: 'Repaint the ceiling.', effects: { treasury: -15, paranoia: -10 }, result: 'The ceiling is now silent, which is worse. Tiberius is pleased.' },
      { label: 'Tell the ceiling a secret, to test it.', setFlags: ['secret_told'], effects: { paranoia: 5, plebs: -5 }, result: 'The ceiling has spread it. By lunch the secret was on a poster outside the baths.' },
      { label: 'Hire a Keeper of the Ceiling.', effects: { treasury: -10, senate: 5, paranoia: -5 }, result: 'The Keeper has been hired. The ceiling has been informed. The ceiling is considering a counter-offer.' },
    ],
  },
  {
    id: 'mutiny_rumour',
    title: 'A Rumour of Mutiny',
    text: 'A rumour is spreading through the barracks that the Guard should choose its own emperor. The rumour is being spread by the Guard, who are also deciding who to choose.',
    choices: [
      { label: 'Address the barracks, in person.', effects: { morale: 15, paranoia: 5 }, result: 'The barracks cheered. They also asked you to hold a vote on whether they should cheer. You said yes.' },
      { label: 'Double the rations, quietly.', effects: { treasury: -10, morale: 10 }, result: 'The rations were doubled. Morale recovered. Several soldiers are now too full to mutiny, which is an underrated tactic.' },
      { label: 'Let the rumour spread. Watch who believes it.', effects: { paranoia: 15, morale: -5 }, result: 'You now have a list. The list is long. You have since added yourself to it, for safety.' },
    ],
  },
];

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

// ---------------------------------------------------------------------------
// Endings. `text` may use {name}. Natural ending text comes from the emperor.
// ---------------------------------------------------------------------------
export const CAUSES = {
  bankrupt: {
    title: 'Bankrupt',
    text: 'The Treasury was auctioned on the Forum steps. The highest bidder was the Treasury. It had been lending money to itself.',
    epitaph: 'Survived by an auction catalogue and several unpaid invoices.',
  },
  riot: {
    title: 'Riot in the Subura',
    text: 'The plebs took the Forum by storm, then by bread, and finally by {name}, who was not bread and had not been informed of the plan.',
    epitaph: 'Survived by a very small and very relieved bakery.',
  },
  senate: {
    title: 'Vote of No Confidence',
    text: 'The Senate voted unanimously, which has not happened since the last time. The vote took four seconds. Nobody had to finish their lunch.',
    epitaph: 'Survived by a long, unanimous and extremely efficient minute book.',
  },
  purge: {
    title: 'The Purge',
    text: 'Paranoia peaked. Every witness, baker, senator and cat in the palace was executed. Then, for thoroughness, {name}.',
    epitaph: 'Survived by no one, which the Senate found efficient.',
  },
  mutiny: {
    title: 'Praetorian Mutiny',
    text: 'The Guard mutinied. The Guard, you will recall, is you. You are now the Emperor. Congratulations. Nothing has changed, except the view.',
    epitaph: 'Survived by you, who have been promoted without consultation.',
  },
  abdicated: {
    title: 'Abdicated',
    text: 'You abdicated. The Guard chose a new emperor. It was you, again, in a different hat.',
    epitaph: 'Survived by a resignation letter, which was declined.',
  },
  natural: {
    title: 'Natural Causes',
    text: null, // uses emperor.end
    epitaph: 'Died of old age, which in Rome is considered a scandal.',
  },
};

// ---------------------------------------------------------------------------
// Praetorian ranks, earned by number of emperors served (the player is the Guard).
// ---------------------------------------------------------------------------
export const RANKS = [
  { min: 0, title: 'Recruit, Unpaid' },
  { min: 1, title: 'Legionary of Uncertain Loyalty' },
  { min: 3, title: 'Praetorian, Second Class' },
  { min: 6, title: 'Prefect of Second Opinions' },
  { min: 10, title: 'Keeper of the Lamp That Is Always Lit' },
  { min: 15, title: 'Eternal Guard of the Revolving Door' },
];

export const HEADLINES = [
  'FORUM FEED: Emperor "fine, actually", say sources close to the Emperor',
  'BREAD RUMOUR DENIED BY EXPERTS WHO ALSO DO NOT HAVE BREAD',
  'SENATE ANNOUNCES NEW DEADLINE FOR DEADLINES',
  'LOCAL GOOSE NOW ELIGIBLE TO VOTE, STILL NOT ELIGIBLE TO BE TRUSTED',
  'LOTTERY REMAINS "FAIR", LOTTERY ALSO REMAINS THE LOTTERY',
  'PRAETORIAN GUARD ASKS: IS THIS THE EMPEROR, OR JUST A HAT?',
  'CENSUS FINDS FOUR MILLION CITIZENS, ONE OF WHOM IS A CHEESE',
  'EMPEROR BEGINS REIGN WITH A STRONG SENSE OF THE TIMING OF OTHERS',
];

// ---------------------------------------------------------------------------
// Emperor passives (v0.2). Each factor scales every effect that touches that stat.
// Values above 1 amplify, below 1 dampen. Applied in engine.scaleEffects().
// ---------------------------------------------------------------------------
export const PASSIVES = {
  little_boots: { plebs: 1.5 },
  lucia: { plebs: 1.3, senate: 0.8 },
  dorcas: { treasury: 1.25 },
  octavia: { plebs: 1.4, senate: 0.7 },
  pompeius: { morale: 1.5 },
  tiberius: { paranoia: 1.4 },
  severus: { treasury: 1.2 },
  claudius: { morale: 0.6 },
  brutus: { paranoia: 1.3 },
  magnus: { senate: 1.5 },
  helena: { plebs: 1.5, treasury: 0.7 },
  anserus: { paranoia: 0.5 },
  cassia: { senate: 1.3 },
  bartholomew: { treasury: 0.5 },
};

const STAT_NAME = Object.fromEntries(STATS.map((s) => [s.key, s.label]));

export function passiveText(emperorId) {
  const factors = PASSIVES[emperorId];
  if (!factors) return '';
  return Object.entries(factors)
    .map(([key, f]) => `${STAT_NAME[key]} effects ×${f} ${f > 1 ? '(stronger)' : '(muted)'}`)
    .join('; ');
}

// ---------------------------------------------------------------------------
// Guard perks (v0.2). Unlocked by reigns served; chosen on the lottery screen.
// ---------------------------------------------------------------------------
export const PERKS = [
  { id: 'iron_rations', name: 'Iron Rations', text: 'Start each reign with +10 Guard Morale.', unlockAt: 1, mods: { morale: 10 } },
  { id: 'shadow_ledger', name: 'Shadow Ledger', text: 'Start each reign with +12 Treasury.', unlockAt: 2, mods: { treasury: 12 } },
  { id: 'quiet_informants', name: 'Quiet Informants', text: 'Start each reign with -10 Paranoia.', unlockAt: 3, mods: { paranoia: -10 } },
  { id: 'loaded_dice', name: 'Loaded Dice', text: 'Gambles succeed 15 percentage points more often.', unlockAt: 4, chanceBonus: 0.15 },
  { id: 'loud_herald', name: 'Loud Herald', text: 'Start each reign with +10 Mob Mood.', unlockAt: 6, mods: { plebs: 10 } },
];

// ---------------------------------------------------------------------------
// Difficulty (v0.2). Scales the daily upkeep.
// ---------------------------------------------------------------------------
export const DIFFICULTIES = {
  clement: { label: 'Clement', upkeepMult: 0.5, blurb: 'The Empire is nearly self-sufficient. Suspiciously so.' },
  roman: { label: 'Roman', upkeepMult: 1, blurb: 'Standard. Expect betrayal. Expect lions.' },
  cynical: { label: 'Cynical', upkeepMult: 1.5, blurb: 'Everything costs more, including your dignity.' },
};

export const DEFAULT_SETTINGS = { sound: true, difficulty: 'roman' };

// ---------------------------------------------------------------------------
// Advisor (v0.2). Commentary keyed to whichever stat is closest to failure.
// ---------------------------------------------------------------------------
export const ADVISOR_CALM = [
  'Everything is fine. This is the most dangerous thing you could have told me.',
  'The Empire is stable, in the sense that it has not yet fallen over.',
];

export const ADVISOR = {
  treasury: [
    'The Treasury is empty. We have begun selling the furniture. Some of it is yours.',
    'We have counted the coins twice. We got two different numbers, and both were embarrassing.',
  ],
  plebs: [
    'The mob has begun chanting your name. It is not a compliment.',
    'Bread is a rumour. The mob has started believing rumours in its place.',
  ],
  senate: [
    'The Senate is drafting your replacement. It is on the second page of the agenda.',
    'Senators are calling it "a conversation". It is a vote with better manners.',
  ],
  paranoia: [
    'You have checked the ceiling again. The ceiling is worried about you.',
    'Your guards have been told to stop following you. They have started following your shadow instead.',
  ],
  morale: [
    'The Guard is sitting down during drills. Sitting is how mutinies begin.',
    'Your legionaries have written a petition. It has more signatures than the Senate.',
  ],
};

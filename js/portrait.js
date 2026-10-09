// Procedural 24x24 pixel portraits. Each emperor gets a stable palette (seeded by id)
// and a feature set (hair, eyes, mouth, headwear, beard) from data.js.
// Drawn on a <canvas> one pixel at a time and scaled up with CSS (image-rendering: pixelated).
import { hashString, makeRng, pick } from './util.js';

export const GRID = 24;

const SKINS = [
  ['#f3c9a0', '#d49f70'],
  ['#e0a878', '#b57b52'],
  ['#b97a4f', '#8a5536'],
  ['#f7dcc4', '#d2ad8a'],
  ['#8d5a3b', '#653f29'],
];
const HAIRS = ['#2b1d14', '#c9a04c', '#9a9a9a', '#7a2b1f', '#f2eee4', '#1b1b2e'];
const CLOTHS = [
  ['#7a1f2b', '#4f1119'],
  ['#3d2a5c', '#261a3b'],
  ['#e8dcc4', '#b9ae98'],
  ['#2f5a3c', '#1d3a27'],
  ['#8a6a24', '#5c4415'],
];
const BGS = [
  ['#2a2038', '#211a2d'],
  ['#332a44', '#2a2238'],
  ['#1f2a33', '#18222a'],
  ['#3a2530', '#2e1d27'],
];

const C = {
  ink: '#120d18',
  white: '#f5f1e6',
  metal: '#b9bfc8',
  metalDark: '#6b7280',
  gold: '#e8b84a',
  goldDark: '#9a6b1e',
  red: '#b3262e',
  leaf: '#5f9e5a',
  leafDark: '#33602f',
  blush: '#e0786a',
  gooseShade: '#c9c3b3',
  orange: '#e8862a',
  ghost: '#d8e4ff',
  ghostShade: '#8fa3cf',
  potato: '#b58a52',
  potatoShade: '#7e5a32',
  potatoSpot: '#8f6a3b',
};

// Build the palette and feature list for an emperor. Explicit look fields win over random ones.
export function lookFor(emperor) {
  const rng = makeRng(hashString(emperor.id));
  const [skin, skinShade] = pick(SKINS, rng);
  const [cloth, clothShade] = pick(CLOTHS, rng);
  const [bg, bgDark] = pick(BGS, rng);
  const hair = pick(HAIRS, rng);
  return {
    species: emperor.species || 'human',
    hairStyle: 'bowl',
    eyes: 'normal',
    mouth: 'flat',
    headwear: 'none',
    beard: 'none',
    blush: false,
    stripe: false,
    ...(emperor.look || {}),
    palette: { skin, skinShade, cloth, clothShade, hair, bg, bgDark },
  };
}

export function paintPortrait(canvas, emperor) {
  const L = lookFor(emperor);
  canvas.width = GRID;
  canvas.height = GRID;
  const g = canvas.getContext('2d');
  const put = (x, y, color) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
    g.fillStyle = color;
    g.fillRect(x, y, 1, 1);
  };

  // Background with a light dither, like an old tavern wall.
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dither = (x + y) % 4 === 0 && (x + 2 * y) % 3 === 0;
      put(x, y, dither ? L.palette.bgDark : L.palette.bg);
    }
  }

  if (L.species === 'goose') paintGoose(put);
  else if (L.species === 'ghost') paintGhost(put);
  else if (L.species === 'potato') paintPotato(put);
  else paintHuman(put, L);
}

// ---------------------------------------------------------------------------
// Helpers shared by species
// ---------------------------------------------------------------------------

// Paint a dark outline on every empty pixel that touches `mask` orthogonally.
function outline(put, mask, color = C.ink) {
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (mask(x, y)) continue;
      if (mask(x + 1, y) || mask(x - 1, y) || mask(x, y + 1) || mask(x, y - 1)) put(x, y, color);
    }
  }
}

// ---------------------------------------------------------------------------
// Human
// ---------------------------------------------------------------------------
const HEAD = { cx: 11.5, cy: 11, rx: 5.6, ry: 6.4 };

function inEllipse(x, y, rx, ry, cx = HEAD.cx, cy = HEAD.cy) {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}
const inHead = (x, y, grow = 0) => inEllipse(x, y, HEAD.rx + grow, HEAD.ry + grow);

function hairMask(style) {
  switch (style) {
    case 'bald':
      return () => false;
    case 'bowl':
      return (x, y) =>
        (inHead(x, y, 0.5) && y <= 6) ||
        (y === 7 && inHead(x, y, 0.5)) ||
        (y === 8 && (x <= 6 || x >= 17) && inHead(x, y, 0.5));
    case 'long':
      return (x, y) =>
        (inHead(x, y, 0.5) && y <= 6) ||
        (y === 7 && inHead(x, y, 0.5)) ||
        (y >= 8 && y <= 17 && (x === 4 || x === 5 || x === 18 || x === 19));
    case 'bun':
      return (x, y) =>
        (inHead(x, y, 0.5) && y <= 6) ||
        (y === 7 && inHead(x, y, 0.5)) ||
        inEllipse(x, y, 2.2, 2.2, 11.5, 1.5);
    case 'curly':
      return (x, y) =>
        (inHead(x, y, 1.6) && !inHead(x, y, 0) && y <= 9 && (x + y) % 2 === 0) ||
        (inHead(x, y, 0.6) && y <= 5);
    case 'balding':
      return (x, y) => (x <= 6 || x >= 17) && y <= 10 && inHead(x, y, 0.6);
    case 'mohawk':
      return (x, y) => x >= 10 && x <= 13 && y <= 7;
    case 'wild':
      return (x, y) => inHead(x, y, 1.4) && !inHead(x, y, 0) && y <= 9 && (x * 7 + y * 13) % 5 !== 0;
    default:
      return () => false;
  }
}

function paintHuman(put, L) {
  const P = L.palette;
  const headMask = (x, y) => inHead(x, y, 0);

  // Torso, a toga with an optional purple stripe.
  for (let y = 18; y < GRID; y++) {
    const half = 6.5 + Math.min(2, (y - 18) * 0.6);
    for (let x = Math.ceil(HEAD.cx - half); x <= Math.floor(HEAD.cx + half); x++) {
      const edge = x <= HEAD.cx - half + 1.2 || x >= HEAD.cx + half - 1.2;
      put(x, y, edge ? P.clothShade : P.cloth);
    }
    if (L.stripe) {
      put(11, y, C.red);
      put(12, y, C.red);
    }
  }
  // Neck.
  for (let y = 16; y <= 18; y++) {
    for (let x = 10; x <= 13; x++) put(x, y, x === 13 ? P.skinShade : P.skin);
  }

  // Outline the head, then fill the face.
  outline(put, headMask);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!headMask(x, y)) continue;
      const shaded = x + 0.5 - HEAD.cx > HEAD.rx * 0.5 && y > 9;
      put(x, y, shaded ? P.skinShade : P.skin);
    }
  }

  // Hair (under headwear so helmets and crowns win).
  const hair = hairMask(L.hairStyle);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (hair(x, y)) put(x, y, P.hair);
    }
  }
  if (L.hairStyle === 'bald') put(9, 5, '#fff3dc');

  // Beard (drawn before mouth so the mouth sits on top).
  if (L.beard === 'stubble') {
    for (let y = 13; y <= 16; y++) {
      for (let x = 7; x <= 16; x++) {
        if (inHead(x, y) && (x + y) % 3 === 0) put(x, y, P.hair);
      }
    }
  } else if (L.beard === 'full') {
    for (let y = 13; y < GRID; y++) {
      for (let x = 6; x <= 17; x++) {
        if (inHead(x, y, -0.2) && y >= 14) put(x, y, P.hair);
      }
    }
    for (let x = 9; x <= 14; x++) put(x, 17, P.hair);
  } else if (L.beard === 'goatee') {
    put(11, 16, P.hair);
    put(12, 16, P.hair);
    put(11, 17, P.hair);
    put(12, 17, P.hair);
  } else if (L.beard === 'mustache') {
    for (const x of [9, 10, 13, 14]) put(x, 14, P.hair);
  }

  // Nose.
  put(11, 12, P.skinShade);
  put(12, 13, P.skinShade);

  // Blush.
  if (L.blush) {
    put(8, 13, C.blush);
    put(15, 13, C.blush);
  }

  paintEyes(put, L.eyes);
  paintMouth(put, L.mouth);
  paintHeadwear(put, L.headwear);
}

function paintEyes(put, style) {
  const leftX = 9;
  const rightX = 14;
  switch (style) {
    case 'wide':
      for (const x of [leftX, rightX]) {
        put(x, 9, C.white);
        put(x, 10, C.ink);
        put(x - 1, 10, C.white);
      }
      break;
    case 'sleepy':
      for (const x of [leftX, rightX]) {
        put(x - 1, 10, C.ink);
        put(x, 10, C.ink);
      }
      break;
    case 'angry':
      for (const x of [leftX, rightX]) put(x, 10, C.ink);
      put(8, 8, C.ink);
      put(9, 9, C.ink);
      put(10, 9, C.ink);
      put(15, 8, C.ink);
      put(14, 9, C.ink);
      put(13, 9, C.ink);
      break;
    case 'crazy':
      put(leftX, 10, C.ink);
      put(leftX - 1, 9, C.white);
      put(rightX, 9, C.ink);
      put(rightX, 10, C.white);
      put(rightX + 1, 10, C.white);
      put(13, 7, C.ink);
      put(14, 7, C.ink);
      put(15, 7, C.ink);
      break;
    default:
      put(leftX, 10, C.ink);
      put(rightX, 10, C.ink);
  }
}

function paintMouth(put, style) {
  switch (style) {
    case 'smile':
      [[9, 14], [10, 15], [11, 15], [12, 15], [13, 15], [14, 14]].forEach(([x, y]) => put(x, y, C.ink));
      break;
    case 'frown':
      [[9, 16], [10, 15], [11, 15], [12, 15], [13, 15], [14, 16]].forEach(([x, y]) => put(x, y, C.ink));
      break;
    case 'smirk':
      [[10, 15], [11, 15], [12, 15], [13, 14]].forEach(([x, y]) => put(x, y, C.ink));
      break;
    case 'open':
      put(11, 15, C.white);
      put(12, 15, C.white);
      put(11, 16, C.ink);
      put(12, 16, C.ink);
      put(10, 16, C.ink);
      put(13, 16, C.ink);
      break;
    case 'teeth':
      for (let x = 10; x <= 13; x++) {
        put(x, 15, C.white);
        put(x, 16, C.ink);
      }
      break;
    default:
      for (let x = 10; x <= 13; x++) put(x, 15, C.ink);
  }
}

function paintHeadwear(put, style) {
  switch (style) {
    case 'laurel': {
      // A wreath along the top of the head, from one ear to the other.
      for (let deg = 0; deg <= 180; deg += 9) {
        const rad = (deg * Math.PI) / 180;
        const x = Math.round(HEAD.cx + 7.2 * Math.cos(rad));
        const y = Math.round(HEAD.cy - 7.4 * Math.sin(rad));
        put(x, y, (deg / 9) % 2 ? C.leaf : C.leafDark);
        put(x, y - 1, C.leafDark);
      }
      put(12, 2, C.gold);
      put(11, 2, C.gold);
      break;
    }
    case 'crown': {
      for (let x = 7; x <= 16; x++) put(x, 5, C.gold);
      for (const [sx, top] of [[7, 3], [9, 2], [12, 1], [15, 2], [16, 3]]) {
        for (let y = top; y <= 4; y++) put(sx, y, C.gold);
      }
      put(11, 5, C.red);
      put(12, 5, C.red);
      put(12, 6, C.goldDark);
      break;
    }
    case 'helmet': {
      // Praetorian helmet: metal dome, cheek guards, red crest.
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (inEllipse(x, y, HEAD.rx + 0.8, HEAD.ry + 0.2) && y <= 7) put(x, y, C.metal);
        }
      }
      for (let x = 5; x <= 18; x++) put(x, 8, C.metalDark);
      for (let y = 9; y <= 13; y++) {
        put(4, y, C.metal);
        put(5, y, C.metal);
        put(18, y, C.metal);
        put(19, y, C.metal);
      }
      put(9, 4, C.white);
      put(10, 3, C.white);
      for (let x = 11; x <= 12; x++) put(x, 0, C.red);
      for (let x = 10; x <= 13; x++) put(x, 1, C.red);
      for (let x = 11; x <= 12; x++) put(x, 2, C.red);
      break;
    }
    case 'chef': {
      // A tall white toque.
      for (let x = 8; x <= 15; x++) put(x, 0, C.white);
      for (let y = 1; y <= 3; y++) for (let x = 7; x <= 16; x++) put(x, y, C.white);
      for (let x = 7; x <= 16; x++) put(x, 4, C.metalDark);
      put(7, 2, C.gold);
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Goose
// ---------------------------------------------------------------------------
function paintGoose(put) {
  const body = (x, y) => inEllipse(x, y, 7.6, 4.8, 11, 16);
  const head = (x, y) => inEllipse(x, y, 3.4, 3.4, 16, 7);
  const neck = (x, y) => x >= 14 && x <= 16 && y >= 9 && y <= 14;
  const mask = (x, y) => body(x, y) || head(x, y) || neck(x, y);

  outline(put, mask);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!mask(x, y)) continue;
      const shade = body(x, y) && y >= 17 && x <= 10;
      put(x, y, shade ? C.gooseShade : C.white);
    }
  }
  // Wing line and beak.
  for (let x = 6; x <= 12; x++) put(x, 14, C.gooseShade);
  [[19, 6], [20, 6], [21, 7], [20, 7], [19, 7]].forEach(([x, y]) => put(x, y, C.orange));
  put(17, 6, C.ink);
  put(16, 5, C.white);
  // Feet.
  [[9, 21], [10, 21], [13, 21], [14, 21]].forEach(([x, y]) => put(x, y, C.orange));
}

// ---------------------------------------------------------------------------
// Ghost
// ---------------------------------------------------------------------------
function paintGhost(put) {
  const body = (x, y) => {
    if (y <= 14) return inEllipse(x, y, 6, 7, 11.5, 9);
    const half = 6 - (y - 14) * 0.4;
    return Math.abs(x + 0.5 - 11.5) <= half && (y < 18 || (x + y * 3) % 3 !== 0);
  };
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!body(x, y)) continue;
      const shade = x + 0.5 - 11.5 > 3 || y > 17;
      put(x, y, shade ? C.ghostShade : C.ghost);
    }
  }
  // Hollow eyes and an "o" mouth.
  put(9, 9, C.ink);
  put(9, 10, C.ink);
  put(14, 9, C.ink);
  put(14, 10, C.ink);
  put(11, 13, C.ink);
  put(12, 13, C.ink);
  put(11, 14, C.ink);
  put(12, 14, C.ink);
}

// ---------------------------------------------------------------------------
// Potato
// ---------------------------------------------------------------------------
function paintPotato(put) {
  const mask = (x, y) => inEllipse(x, y, 7.2, 6.4, 11.5, 13);
  outline(put, mask);
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!mask(x, y)) continue;
      const shade = x + 0.5 - 11.5 > 4 || y > 17;
      put(x, y, shade ? C.potatoShade : C.potato);
    }
  }
  [[7, 12], [16, 15], [9, 17], [14, 9], [6, 16]].forEach(([x, y]) => put(x, y, C.potatoSpot));
  // Sprout.
  [[12, 4], [12, 3], [13, 2], [14, 2], [11, 2]].forEach(([x, y]) => put(x, y, C.leaf));
  put(12, 1, C.leafDark);
  // Face.
  put(9, 11, C.ink);
  put(14, 11, C.ink);
  [[9, 15], [10, 16], [11, 16], [12, 16], [13, 16], [14, 15]].forEach(([x, y]) => put(x, y, C.ink));
}

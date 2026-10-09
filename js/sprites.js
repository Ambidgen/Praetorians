// Sprite helpers. Each character is a four-frame breathing loop extracted from a
// magenta sheet by tools/sprite_pipeline.py (see js/sprite-manifest.js). The CSS
// in style.css steps through the frames with a background-position animation,
// so an idle figure breathes without any per-frame JavaScript.
import { SPRITES, SPRITE_CELL } from './sprite-manifest.js';
import { esc } from './util.js';

// A figure is one of these ids. Unknown ids render nothing rather than a broken image.
export function hasSprite(id) {
  return Object.prototype.hasOwnProperty.call(SPRITES, id);
}

// Emperors from the roster that have a breathing sprite. Others keep their canvas portrait.
export function hasEmperorSprite(id) {
  return hasSprite(id) && SPRITES[id].group === 'emperor';
}

// Stagger the breathing so the court does not inhale in unison.
function delayFor(index) {
  return ((index * 0.37) % 3.6).toFixed(2);
}

// One animated sprite. `scale` multiplies the 112x144 cell. Decorative by default,
// because the caption next to it usually names the character.
export function sprite(id, { scale = 1, index = 0, label = null, cls = '' } = {}) {
  if (!hasSprite(id)) return '';
  const s = SPRITES[id];
  const aria = label ? ` role="img" aria-label="${esc(label)}"` : ' aria-hidden="true"';
  return `<span class="sprite ${esc(cls)}"${aria} style="--scale:${scale};--delay:-${delayFor(index)}s;background-image:url('${esc(s.src)}')"></span>`;
}

// The whole court as a row of captioned figures for the title screen.
export function castRow(scale = 0.55) {
  return Object.entries(SPRITES)
    .filter(([, s]) => s.group === 'court')
    .map(([id, s], i) => `
      <figure class="cast-figure">
        ${sprite(id, { scale, index: i, label: s.label })}
        <figcaption>${esc(s.label)}</figcaption>
      </figure>`)
    .join('');
}

export const SPRITE_SIZE = SPRITE_CELL;

// SVG "paper-doll" sprite system — owned by the Graphics Designer. Builds inline SVG for
// each unit from layered shapes, so characters look human, carry a visible weapon, and
// zombies' silhouettes encode their stats (size ∝ strength/toughness, lean ∝ speed, tint
// per variant). Zero dependencies; scales crisply at any cell size. See docs/decisions D7.

function darken(hex, f = 0.55) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
}
function lighten(hex, f = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * f);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

// --- weapon shapes (also used standalone in the HUD) ---
export function weaponShape(icon) {
  switch (icon) {
    case 'pistol':
      return `<g transform="translate(74 52)"><rect x="0" y="0" width="15" height="5" rx="1.5" fill="#3b4043"/><rect x="2" y="4" width="5" height="8" rx="1.5" fill="#2b3032"/></g>`;
    case 'rifle':
      return `<g transform="translate(64 50) rotate(10)"><rect x="0" y="0" width="34" height="4" rx="1.5" fill="#3b4043"/><rect x="0" y="3" width="10" height="8" rx="1.5" fill="#5a4632"/><rect x="24" y="-1" width="10" height="3" rx="1" fill="#2b3032"/></g>`;
    case 'blade':
      return `<g transform="translate(76 38) rotate(28)"><rect x="0" y="0" width="4.5" height="24" rx="2" fill="#cdd0d2"/><rect x="-1.5" y="22" width="8" height="5" rx="1.5" fill="#5a4632"/></g>`;
    case 'bat':
      return `<g transform="translate(76 38) rotate(32)"><rect x="0" y="0" width="7" height="16" rx="3.5" fill="#9a7a4a"/><rect x="1.5" y="15" width="4" height="9" rx="2" fill="#6a4f2f"/></g>`;
    default:
      return '';
  }
}

function survivorSVG(u) {
  const cloth = u.color, skin = u.skin, dark = darken(u.color, 0.5), pants = darken(u.color, 0.38);
  return `<svg viewBox="0 0 100 100" class="spr">
    <ellipse cx="50" cy="90" rx="23" ry="5.5" fill="#0007"/>
    <ellipse cx="50" cy="90" rx="23" ry="5.5" fill="none" stroke="${cloth}" stroke-width="1.5" opacity="0.85"/>
    <rect x="41" y="62" width="8" height="26" rx="3" fill="${pants}"/>
    <rect x="52" y="62" width="8" height="26" rx="3" fill="${pants}"/>
    <rect x="30" y="45" width="8" height="21" rx="4" fill="${dark}"/>
    <rect x="33" y="39" width="34" height="30" rx="10" fill="${cloth}"/>
    <path d="M37 25 a13 13 0 0 1 26 0 z" fill="${dark}"/>
    <circle cx="50" cy="29" r="12.5" fill="${skin}"/>
    <path d="M37.5 25 a12.5 12.5 0 0 1 25 0 z" fill="${dark}"/>
    <circle cx="46" cy="30" r="1.6" fill="#2a2320"/>
    <circle cx="54" cy="30" r="1.6" fill="#2a2320"/>
    <rect x="58" y="47" width="22" height="7" rx="3.5" fill="${cloth}" transform="rotate(16 58 50)"/>
    ${weaponShape(u.weapon.icon)}
  </svg>`;
}

function zombieSVG(u) {
  const tint = u.tint, dark = darken(u.tint, 0.5), rot = (u.lean * 15).toFixed(1), size = u.size;
  const headR = u.variant === 'brute' ? 12 : u.variant === 'spitter' ? 13 : u.variant === 'runner' ? 9.5 : 11;
  const headFill = u.variant === 'spitter' ? lighten(u.tint, 0.35) : lighten(u.tint, 0.15);

  let markers = '';
  if (u.variant === 'brute') {
    markers += `<path d="M32 41 L47 38 L47 54 L34 56 Z" fill="${dark}"/><rect x="44" y="52" width="22" height="2.4" fill="${dark}"/>`;
  } else if (u.variant === 'runner') {
    markers += `<g stroke="${lighten(u.tint, 0.35)}" stroke-width="2.4" opacity="0.55" stroke-linecap="round"><line x1="18" y1="50" x2="33" y2="50"/><line x1="16" y1="61" x2="31" y2="61"/></g>`;
    markers += `<rect x="58" y="38" width="8" height="3" rx="1" fill="#4a1010"/>`;
  } else if (u.variant === 'spitter') {
    markers += `<path d="M60 47 q2.4 6 0 9.5 q-2.4 -3.5 0 -9.5" fill="#b6d84a"/>`;
  }

  const body = `
    <rect x="42" y="64" width="8" height="24" rx="3" fill="${dark}"/>
    <rect x="55" y="66" width="8" height="22" rx="3" fill="${dark}"/>
    <path d="M37 44 L62 40 L67 66 L42 69 Z" fill="${tint}"/>
    <rect x="40" y="46" width="7" height="20" rx="3.5" fill="${dark}" transform="rotate(18 43 48)"/>
    <circle cx="60" cy="35" r="${headR}" fill="${headFill}"/>
    <circle cx="62" cy="34" r="1.7" fill="#20140f"/>
    <circle cx="55.5" cy="35.5" r="1.4" fill="#20140f"/>
    <rect x="58" y="45" width="27" height="7" rx="3.5" fill="${tint}" transform="rotate(6 58 48)"/>
    <rect x="56" y="53" width="25" height="6" rx="3" fill="${dark}" transform="rotate(-6 56 56)"/>
    ${markers}`;

  return `<svg viewBox="0 0 100 100" class="spr">
    <ellipse cx="50" cy="90" rx="${(21 * size).toFixed(1)}" ry="5.5" fill="#0007"/>
    <ellipse cx="50" cy="90" rx="${(21 * size).toFixed(1)}" ry="5.5" fill="none" stroke="${tint}" stroke-width="1.4" opacity="0.8"/>
    <g transform="translate(50 88) scale(${size}) translate(-50 -88) rotate(${rot} 55 58)">${body}</g>
  </svg>`;
}

export function unitSVG(unit) {
  return unit.kind === 'zombie' ? zombieSVG(unit) : survivorSVG(unit);
}

// Small standalone weapon icon for the HUD/roster.
export function weaponIconSVG(icon) {
  return `<svg viewBox="0 0 100 70" class="wicon">${weaponShape(icon)}</svg>`;
}

// Item icon (container drops) for the board and log.
export function itemSVG(item) {
  if (item === 'ammo') {
    return `<svg viewBox="0 0 24 24" class="item"><rect x="4" y="9" width="16" height="11" rx="2" fill="#b9962f"/><rect x="4" y="9" width="16" height="3.5" fill="#d8b64a"/><rect x="10" y="4" width="4" height="6" fill="#8a6a20"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" class="item"><rect x="4" y="6" width="16" height="14" rx="2" fill="#e7ebe9"/><rect x="10.5" y="9" width="3" height="8" fill="#c65b4e"/><rect x="7.5" y="12" width="9" height="3" fill="#c65b4e"/></svg>`;
}

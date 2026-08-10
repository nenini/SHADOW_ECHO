import Phaser from "phaser";

/**
 * Tiny pixel-art painter. Each row string is a scanline; each character maps to
 * a colour (space = transparent). One character = one texture pixel; Phaser's
 * pixelArt mode keeps it crisp when upscaled. All art here is hand-authored for
 * this project (no external assets).
 */

type ColorMap = Record<string, number>;

function gridSize(rows: string[]): { w: number; h: number } {
  let w = 0;
  for (const r of rows) w = Math.max(w, r.length);
  return { w: Math.max(1, w), h: Math.max(1, rows.length) };
}

export function paintPixels(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  map: ColorMap,
): void {
  const { w, h } = gridSize(rows);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === " ") continue;
      const color = map[ch];
      if (color === undefined) continue;
      g.fillStyle(color, 1);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Render the shape of `rows` as a solid silhouette with a 1px rim (for the Echo). */
export function paintSilhouette(
  scene: Phaser.Scene,
  key: string,
  rows: string[],
  fill: number,
  rim: number,
): void {
  const { w, h } = gridSize(rows);
  const filled = (x: number, y: number): boolean =>
    y >= 0 && y < rows.length && x >= 0 && x < rows[y].length && rows[y][x] !== " ";
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === " ") continue;
      const edge = !filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1);
      g.fillStyle(edge ? rim : fill, 1);
      g.fillRect(x, y, 1, 1);
    }
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

// ---------------------------------------------------------------------------
// Harin — small, nimble female swordfighter: long dark hair, ivory face,
// long navy coat with a faint gold belt, short sword at the right hip.
// ---------------------------------------------------------------------------
const HARIN_ROWS = [
  "        HHHHHH",
  "       HHHHHHHH",
  "      HHHHHHHHHH",
  "      HHHhhhHHHH",
  "      HHFFFFFFHH",
  "     HHHFFFFFFHHH",
  "     HHFFFFFFFFHH",
  "     HHFeFFFFeFHH",
  "     HHFFFffFFFHH",
  "      HFFFFFFFFH",
  "      HHFFFFFFHH",
  "       HhFFFFhH",
  "       HH kk HH",
  "      cCCCCCCCCc",
  "     cCCCCiiCCCCc",
  "    kcCCCCCCCCCcs",
  "     cCCCCCCCCCcg",
  "     ggggggggggS",
  "     cCCCCCCCCc S",
  "     cCCCCCCCCc S",
  "      cCCCCCCc  s",
  "      cCCCCCCc",
  "      cCCCCCCc",
  "     cCCCCCCCCc",
  "     cCiCCCCiCc",
  "     cCCCCCCCCc",
  "     cCCc CcCCc",
  "     cCc   cCc",
  "     BB    BB",
  "     BB    BB",
  "     BB    BB",
  "    BBBB  BBBB",
];
const HARIN_MAP: ColorMap = {
  H: 0x141a2e,
  h: 0x2c3555,
  F: 0xf4f0e4,
  f: 0xd8ccb4,
  e: 0x33263f,
  C: 0x1c2842,
  c: 0x0f1626,
  i: 0x2b3a5c,
  g: 0xe8c976,
  k: 0xe9c9aa,
  S: 0xd6dbe6,
  s: 0x7f8a9c,
  B: 0x0b0e18,
};

// ---------------------------------------------------------------------------
// Lost Pilgrim — hunched, hooded wanderer with a murky lantern and red eyes.
// ---------------------------------------------------------------------------
const PILGRIM_ROWS = [
  "         hhhhhh",
  "        hHHHHHHh",
  "       hHHHHHHHHh",
  "       hHHHHHHHHh",
  "       hHHeeHHHHh",
  "       hHHHHHHHHh",
  "        hHHHHHHh",
  "        RRRRRRRR",
  "       oRRRRRRRRo",
  "      rRRRRRRRRRRk",
  "      rRRRRRRRRRR k",
  "      RRRRRRRRRRR  LLL",
  "     rRRRRRRRRRRRr LlL",
  "     rRRRRRRRRRRRr LlL",
  "     oRRRRRRRRRRRo LpL",
  "     RRRRRRRRRRRRR LlL",
  "    rRRRRRRRRRRRRRr LLL",
  "    rRRRRRRRRRRRRRr",
  "    RRRRRRRRRRRRRRR",
  "   rRRRRoRRRRoRRRRr",
  "   rRRRRRRRRRRRRRRr",
  "   RRRRRRRRRRRRRRRR",
  "   rRRRrRRRRRRrRRRr",
  "   RRRr RRRRRR rRRR",
  "   rRr  RRRRRR  rRr",
  "   Rr    RRRR    rR",
  "        rRRRRr",
  "        rR  Rr",
  "        DD  DD",
  "        DD  DD",
  "       DDD  DDD",
];
const PILGRIM_MAP: ColorMap = {
  h: 0x0e1522,
  H: 0x243248,
  R: 0x33402c,
  r: 0x1c2417,
  o: 0x445236,
  D: 0x0c1006,
  e: 0xe23a3a,
  L: 0x554b3b,
  l: 0xcf9a34,
  p: 0xb83030,
  k: 0xa89e86,
};

/** Paint every gameplay character texture. */
export function paintCharacters(scene: Phaser.Scene): void {
  paintPixels(scene, "harin", HARIN_ROWS, HARIN_MAP);
  paintPixels(scene, "pilgrim", PILGRIM_ROWS, PILGRIM_MAP);
  // Echo: Harin's exact silhouette, dark violet body with a pale-gold rim.
  paintSilhouette(scene, "harin_echo", HARIN_ROWS, 0x241d40, 0xe8c976);
}

import Phaser from "phaser";
import { PALETTE } from "../config";
import { paintCharacters } from "../systems/PixelArt";

/**
 * BootScene generates all textures procedurally (hand-authored pixel art, no
 * external assets — see docs/ASSET_LICENSES.md). Then it starts the game scene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    // Characters (Harin, Echo, Lost Pilgrim).
    paintCharacters(this);
    // Environment + fx.
    this.makeGroundTexture();
    this.makeGrassTexture();
    this.makeRockTexture();
    this.makePixelTexture();
    this.makeSlashTexture();
    this.makeMaraTexture();
    this.scene.start("GameScene");
  }

  /** A forest-path tile: packed earth, a mossy grassy top, scattered pebbles. */
  private makeGroundTexture(): void {
    const size = 32;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Earth base with faint vertical variation.
    g.fillStyle(0x3a3126, 1);
    g.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += 2) {
      const seed = Math.abs(Math.sin(x * 0.7));
      g.fillStyle(seed > 0.6 ? 0x332b21 : 0x40382b, 0.5);
      g.fillRect(x, 4, 2, size - 4);
    }
    // Grassy top band.
    g.fillStyle(PALETTE.mutedGreen, 1);
    g.fillRect(0, 0, size, 4);
    g.fillStyle(0x27331f, 1);
    for (let x = 0; x < size; x += 3) {
      const h = 2 + Math.floor(Math.abs(Math.sin(x * 1.3)) * 3);
      g.fillRect(x, 4, 1, h); // grass blades poking down into the earth
    }
    // Pebbles + roots.
    g.fillStyle(0x4a4740, 1);
    g.fillRect(7, 14, 3, 2);
    g.fillRect(21, 22, 4, 2);
    g.fillStyle(0x2a241c, 1);
    g.fillRect(13, 26, 5, 1);
    g.fillRect(2, 20, 3, 1);

    g.generateTexture("ground", size, size);
    g.destroy();
  }

  /** Small grass tuft for scattering along the path. */
  private makeGrassTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const blades = [
      [2, 8, 0x2f3d2b],
      [4, 5, 0x3a4a2c],
      [6, 8, 0x27331f],
      [8, 6, 0x364527],
      [10, 8, 0x2f3d2b],
    ] as const;
    for (const [x, h, c] of blades) {
      g.fillStyle(c, 1);
      g.fillRect(x, 10 - h, 1, h);
      g.fillRect(x + (x < 6 ? -1 : 1), 10 - h + 2, 1, h - 2);
    }
    g.generateTexture("grass", 14, 10);
    g.destroy();
  }

  /** A mossy rock for scattering. */
  private makeRockTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x3d3a34, 1);
    g.fillEllipse(8, 7, 15, 9);
    g.fillStyle(0x4b4842, 1);
    g.fillEllipse(6, 5, 8, 4);
    g.fillStyle(PALETTE.mutedGreen, 0.6);
    g.fillRect(3, 3, 3, 1);
    g.fillRect(10, 4, 3, 1);
    g.generateTexture("rock", 16, 12);
    g.destroy();
  }

  private makePixelTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture("pixel", 1, 1);
    g.destroy();
  }

  private makeMaraTexture(): void {
    const w = 20;
    const h = 30;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(PALETTE.grayBrown, 1);
    g.fillRect(3, 10, w - 6, h - 10);
    g.fillStyle(PALETTE.deepNavy, 1);
    g.fillRect(2, 7, w - 4, 8);
    g.fillStyle(PALETTE.fog, 1);
    g.fillRect(6, 4, 8, 7);
    g.fillStyle(PALETTE.black, 1);
    g.fillRect(7, 7, 6, 3);
    g.fillStyle(0x2a2420, 1);
    g.fillRect(w - 3, 6, 2, h - 6);
    g.generateTexture("mara", w, h);
    g.destroy();
  }

  private makeSlashTexture(): void {
    const size = 48;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(PALETTE.echoPale, 0.9);
    g.beginPath();
    g.arc(6, size / 2, size - 10, -0.9, 0.9, false);
    g.arc(2, size / 2, size - 22, 0.9, -0.9, true);
    g.closePath();
    g.fillPath();
    g.generateTexture("slash", size, size);
    g.destroy();
  }
}

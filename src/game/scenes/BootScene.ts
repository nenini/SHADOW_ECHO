import Phaser from "phaser";
import { PALETTE } from "../config";

/**
 * BootScene generates all placeholder textures procedurally so the game runs
 * with zero external assets. Final art will replace these generated textures
 * (see docs/ASSET_LICENSES.md). Until then these are functional stand-ins,
 * not raw debug rectangles.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.makeHarinTexture();
    this.makeGroundTexture();
    this.makePixelTexture();
    this.makePilgrimTexture();
    this.makeSlashTexture();
    this.scene.start("GameScene");
  }

  /** A small hooded humanoid silhouette for Harin (the player). */
  private makeHarinTexture(): void {
    const w = 20;
    const h = 34;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Cloak body
    g.fillStyle(PALETTE.navy, 1);
    g.fillRect(3, 10, w - 6, h - 10);
    // Shoulders / hood
    g.fillStyle(PALETTE.deepNavy, 1);
    g.fillRect(2, 6, w - 4, 8);
    // Head
    g.fillStyle(PALETTE.harin, 1);
    g.fillRect(6, 2, 8, 8);
    // Face shadow under hood
    g.fillStyle(PALETTE.black, 1);
    g.fillRect(7, 5, 6, 3);
    // Cloak highlight edge (moonlit)
    g.fillStyle(PALETTE.fog, 0.5);
    g.fillRect(3, 10, 2, h - 12);

    g.generateTexture("harin", w, h);
    g.destroy();
  }

  /** A stony/earthy ground tile in muted colors. */
  private makeGroundTexture(): void {
    const size = 32;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(PALETTE.grayBrown, 1);
    g.fillRect(0, 0, size, size);
    // Top mossy edge
    g.fillStyle(PALETTE.mutedGreen, 1);
    g.fillRect(0, 0, size, 5);
    // Speckle for texture
    g.fillStyle(PALETTE.deepNavy, 0.6);
    g.fillRect(6, 12, 3, 3);
    g.fillRect(20, 20, 4, 3);
    g.fillRect(13, 25, 3, 3);

    g.generateTexture("ground", size, size);
    g.destroy();
  }

  /** 1x1 white pixel used for particles / effects later. */
  private makePixelTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 1, 1);
    g.generateTexture("pixel", 1, 1);
    g.destroy();
  }

  /** The "Lost Pilgrim": a headless, hunched humanoid clutching a lantern. */
  private makePilgrimTexture(): void {
    const w = 24;
    const h = 36;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Ragged cloak body (muted green)
    g.fillStyle(PALETTE.mutedGreen, 1);
    g.fillRect(4, 8, w - 8, h - 8);
    // Darker hunched shoulders (no head — headless)
    g.fillStyle(PALETTE.deepNavy, 1);
    g.fillRect(3, 6, w - 6, 8);
    // Tattered hem
    g.fillStyle(PALETTE.black, 1);
    g.fillRect(4, h - 5, 4, 5);
    g.fillRect(12, h - 4, 4, 4);
    g.fillRect(18, h - 6, 4, 6);
    // Lantern arm
    g.fillStyle(PALETTE.grayBrown, 1);
    g.fillRect(w - 6, 16, 4, 10);
    // Lantern (danger-tinted glow so it reads as a threat)
    g.fillStyle(PALETTE.danger, 1);
    g.fillRect(w - 8, 24, 7, 7);
    g.fillStyle(0xf0a060, 1);
    g.fillRect(w - 6, 26, 3, 3);

    g.generateTexture("pilgrim", w, h);
    g.destroy();
  }

  /** A crescent slash arc used for the player's attack VFX. */
  private makeSlashTexture(): void {
    const size = 48;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // Pale crescent, thicker in the middle
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

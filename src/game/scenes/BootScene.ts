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
}

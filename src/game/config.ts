import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";

/**
 * Dark fairy-tale palette (from CLAUDE_PROMPT art direction).
 * Numbers are 0xRRGGBB for Phaser fills; strings are for CSS/text.
 */
export const PALETTE = {
  black: 0x05060a,
  deepNavy: 0x0e1522,
  navy: 0x1b2740,
  grayBrown: 0x4a423a,
  mutedGreen: 0x2f3d2b,
  fog: 0x8a95a5,
  moon: 0xd8dce6,
  danger: 0xb03030,
  echoPale: 0xf2efe4, // 잔영: 창백한 흰색
  echoGold: 0xe8c976, // 잔영: 옅은 금색
  harin: 0xcfd6e0, // player body (placeholder tone)
} as const;

/** Core tunable gameplay constants, kept in one place. */
export const GAME = {
  width: 960,
  height: 540,
  gravityY: 1400,
  // Player movement
  moveSpeed: 260,
  jumpVelocity: -560,
  dashSpeed: 640,
  dashDurationMs: 160,
  dashCooldownMs: 520,
  // World
  worldWidth: 3200,
  worldHeight: 720,
  floorY: 620,
} as const;

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    backgroundColor: PALETTE.black,
    width: GAME.width,
    height: GAME.height,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: GAME.gravityY },
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
  };
}

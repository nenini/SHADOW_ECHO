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
  moveSpeed: 280,
  // Jump: apex height = jumpVelocity^2 / (2*gravityY).
  // 660^2 / 2800 ~= 155px, comfortably above the ~100px platform steps.
  jumpVelocity: -660,
  // Releasing jump early cuts upward velocity for a variable-height jump.
  jumpCutMultiplier: 0.45,
  // Grace windows that make platforming forgiving (in ms).
  coyoteMs: 100,
  jumpBufferMs: 120,
  dashSpeed: 640,
  dashDurationMs: 160,
  dashCooldownMs: 520,
  // World
  worldWidth: 3200,
  worldHeight: 720,
  floorY: 620,
} as const;

/** Combat tuning, kept separate from movement for clarity. */
export const COMBAT = {
  // Player attack (sword slash)
  attackCooldownMs: 360,
  attackWindupMs: 40,
  attackActiveMs: 130,
  attackReach: 30, // horizontal extent in front of the player
  attackHalfHeight: 22,
  attackDamage: 1,
  attackKnockback: 300,
  // Player health
  playerMaxHp: 5,
  playerInvulnMs: 850,
  playerHurtKnockback: 320,
  playerHurtLiftY: -220,
  // Enemy (Lost Pilgrim)
  enemyMaxHp: 3,
  enemyPatrolSpeed: 55,
  enemyTouchDamage: 1,
  enemyHurtKnockback: 240,
  enemyHitstopMs: 70,
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

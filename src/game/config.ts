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

/** Screen / world extents. */
export const GAME = {
  width: 960,
  height: 540,
  worldWidth: 3200,
  worldHeight: 720,
} as const;

/**
 * Pseudo-2.5D coordinate space. Actors live on a floor plane addressed by
 * (worldX, worldY); jumpZ is a separate virtual height above that plane.
 * worldY is the belt-scroll depth band: smaller = far/back, larger = near/front.
 */
export const WORLD = {
  xMin: 60,
  xMax: 3140,
  yMin: 430, // back edge of the walkable floor (screen-space y of the plane)
  yMax: 610, // front edge
} as const;

/** Planar movement + dash. */
export const MOVE = {
  speed: 250, // px/s on the floor plane (used for both axes, then normalized)
  dashSpeed: 620,
  dashDurationMs: 170,
  dashCooldownMs: 520,
} as const;

/**
 * Manual Z-axis jump physics (no Arcade gravity). Numbers mirror the old
 * side-view feel: apex = jumpVelocityZ^2 / (2*gravityZ) ~= 155px.
 */
export const JUMP = {
  gravityZ: 1400,
  jumpVelocityZ: 660,
  cutMultiplier: 0.45,
  coyoteMs: 100,
  bufferMs: 120,
  maxShadowFadeZ: 160, // jumpZ at which the ground shadow is smallest/faintest
} as const;

/** Subtle depth cue: actors near the front (higher worldY) are slightly bigger. */
export const PERSPECTIVE = {
  scaleFar: 0.9, // at WORLD.yMin
  scaleNear: 1.05, // at WORLD.yMax
} as const;

/**
 * Render layers. Background/foreground/HUD keep fixed depths; gameplay actors
 * are sorted dynamically by worldY (see systems/space.ts) between fog and vfx.
 */
export const DEPTH = {
  ground: -10,
  fog: -5,
  actorBase: 0, // actor depth = actorBase + worldY  (~430..610)
  vfx: 5000,
  vignette: 9000,
  hud: 10000,
} as const;

/** Ground shadow footprint. */
export const SHADOW = {
  width: 26,
  height: 10,
  alpha: 0.38,
} as const;

/** Combat tuning (2.5D-aware). */
export const COMBAT = {
  // Player sword
  attackCooldownMs: 360,
  attackWindupMs: 40,
  attackActiveMs: 130,
  attackReach: 34, // forward reach in worldX
  attackDepthTolerance: 26, // max |dworldY| for a hit to land
  attackMaxTargetZ: 60, // enemies higher than this jumpZ are missed
  attackDamage: 1,
  attackKnockback: 300, // planar knockback speed applied to enemies (px/s)
  // Player health
  playerMaxHp: 5,
  playerInvulnMs: 850,
  playerHurtKnockback: 300, // planar knockback speed when hurt (px/s)
  // Contact / proximity tolerances (used by enemy melee strike)
  hitDepthTolerance: 24, // |dworldY|
  hitHeightTolerance: 46, // |djumpZ|
  // Enemy (Lost Pilgrim)
  enemyMaxHp: 3,
  enemyWanderSpeed: 55,
  enemyChaseSpeed: 95,
  enemyDetectRange: 320, // planar distance to start chasing
  enemyStrikeRangeX: 42,
  enemyStrikeRangeY: 26,
  enemyAttackWindupMs: 230,
  enemyAttackCooldownMs: 900,
  enemyTouchDamage: 1,
  enemyHurtKnockback: 240,
  // Shared knockback decay (higher = snappier stop)
  knockbackDecayPerSec: 8,
} as const;

/**
 * PlayerProfile classification thresholds. Metrics are collected from real play
 * (attack/dash/jump counts, damage taken, echo uses, average enemy distance) and
 * used to pick the Shadow's independent support action in the second combat.
 */
export const PROFILE = {
  distThreshold: 170, // avg enemy distance (px): <= is "fights up close"
  attackThreshold: 4, // min attacks to read as offensive
  damageThreshold: 2, // <= damage taken reads as "careful"
} as const;

/** Shadow's independent support action (second combat finale). */
export const SUPPORT = {
  shadowSpeed: 320, // px/s while moving to assist
  approachRange: 46, // stops this close to the target before acting
  staggerMs: 1700, // AGGRESSIVE: how long the enemy is stunned
  tauntMs: 2400, // CAUTIOUS: how long the enemy is drawn to the Shadow
  lingerMs: 800, // Shadow lingers after acting, then fades
} as const;

/** 잔영(Echo): rolling action recording + Shadow replay. */
export const ECHO = {
  recordMs: 3000, // how much recent history the Shadow can replay
  maxFrames: 220, // ring-buffer size (~3.6s at 60fps, safely above recordMs)
  shadowAlpha: 0.55,
  shadowTint: PALETTE.echoGold, // pale gold afterimage
  dashTint: PALETTE.echoPale,
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
    // No global physics: jump uses a manual Z axis and combat uses geometry.
    scene: [BootScene, GameScene],
  };
}

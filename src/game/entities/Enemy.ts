import Phaser from "phaser";
import { COMBAT, SHADOW } from "../config";
import type { Player } from "./Player";
import {
  actorDepth,
  clampWorldX,
  clampWorldY,
  perspectiveScale,
} from "../systems/space";

/**
 * "Lost Pilgrim" in Pseudo-2.5D. Roams a stretch of the floor plane; when the
 * player enters its detection range it chases across (worldX, worldY); when the
 * player is within strike range it winds up and lands a melee hit. No Arcade
 * physics — movement is manual on the plane, consistent with the Player.
 */
export class Enemy extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly glow: Phaser.GameObjects.Ellipse;

  public hp: number;
  public readonly maxHp: number;
  public isDead = false;
  public jumpZ = 0; // pilgrims stay grounded; kept for a uniform actor interface
  /** Last swing id that hit this enemy, keyed by attacker ("player" | "shadow"). */
  public lastHitSwing: Record<string, number> = {};

  private facing: -1 | 1 = 1;
  private wanderDir: -1 | 1 = 1;
  private readonly wanderMin: number;
  private readonly wanderMax: number;

  private attackReadyAt = 0;
  private attackStrikeAt = -1;
  private hurtUntil = 0;

  private kbVX = 0;
  private kbVY = 0;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number, wanderRadius = 130) {
    super(scene, worldX, worldY);
    scene.add.existing(this);

    this.shadow = scene.add
      .ellipse(0, 0, SHADOW.width, SHADOW.height, 0x000000, SHADOW.alpha)
      .setOrigin(0.5, 0.5);
    // Faint danger glow from the lantern (offset to the carrying arm).
    this.glow = scene.add.ellipse(8, 2, 26, 20, 0xf0a060, 0.14).setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(0, 0, "pilgrim").setOrigin(0.5, 0.5);
    this.add([this.shadow, this.glow, this.sprite]);

    this.wanderMin = clampWorldX(worldX - wanderRadius);
    this.wanderMax = clampWorldX(worldX + wanderRadius);
    this.maxHp = COMBAT.enemyMaxHp;
    this.hp = this.maxHp;

    this.applyVisuals();
  }

  get worldX(): number {
    return this.x;
  }
  get worldY(): number {
    return this.y;
  }

  update(time: number, deltaMs: number, player: Player): void {
    const dt = deltaMs / 1000;
    this.applyKnockback(dt);
    if (this.isDead) return;

    if (time >= this.hurtUntil) {
      this.think(time, dt, player);
    }
    this.applyVisuals();
  }

  private think(time: number, dt: number, player: Player): void {
    const dx = player.worldX - this.x;
    const dy = player.worldY - this.y;
    const dist = Math.hypot(dx, dy);
    const inStrike =
      Math.abs(dx) <= COMBAT.enemyStrikeRangeX &&
      Math.abs(dy) <= COMBAT.enemyStrikeRangeY;

    // Resolve an in-progress wind-up.
    if (this.attackStrikeAt > 0) {
      if (time >= this.attackStrikeAt) {
        if (inStrike && player.jumpZ <= COMBAT.hitHeightTolerance) {
          player.takeDamage(COMBAT.enemyTouchDamage, this.x, this.y, time);
        }
        this.attackStrikeAt = -1;
        this.attackReadyAt = time + COMBAT.enemyAttackCooldownMs;
        this.sprite.clearTint();
      }
      return; // hold position during the telegraph
    }

    if (inStrike && time >= this.attackReadyAt) {
      // Begin a telegraphed strike.
      this.attackStrikeAt = time + COMBAT.enemyAttackWindupMs;
      this.facing = dx >= 0 ? 1 : -1;
      this.sprite.setTint(0xff6a6a);
      return;
    }

    if (dist <= COMBAT.enemyDetectRange) {
      // Chase across the plane.
      const len = dist || 1;
      this.x = clampWorldX(this.x + (dx / len) * COMBAT.enemyChaseSpeed * dt);
      this.y = clampWorldY(this.y + (dy / len) * COMBAT.enemyChaseSpeed * dt);
      if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      return;
    }

    // Wander along the home stretch.
    if (this.x <= this.wanderMin) this.wanderDir = 1;
    else if (this.x >= this.wanderMax) this.wanderDir = -1;
    this.x = clampWorldX(this.x + this.wanderDir * COMBAT.enemyWanderSpeed * dt);
    this.facing = this.wanderDir;
  }

  private applyKnockback(dt: number): void {
    if (this.kbVX === 0 && this.kbVY === 0) return;
    this.x = clampWorldX(this.x + this.kbVX * dt);
    this.y = clampWorldY(this.y + this.kbVY * dt);
    const decay = Math.min(1, COMBAT.knockbackDecayPerSec * dt);
    this.kbVX -= this.kbVX * decay;
    this.kbVY -= this.kbVY * decay;
    if (Math.abs(this.kbVX) < 2) this.kbVX = 0;
    if (Math.abs(this.kbVY) < 2) this.kbVY = 0;
  }

  private applyVisuals(): void {
    this.sprite.setFlipX(this.facing === -1);
    this.setScale(perspectiveScale(this.y));
    this.setDepth(actorDepth(this.y));
  }

  /** Take a hit from a source at (fromX, fromY): damage, knockback, flash. */
  takeDamage(amount: number, fromX: number, fromY: number, time: number): void {
    if (this.isDead) return;
    this.hp -= amount;

    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.kbVX = (dx / len) * COMBAT.enemyHurtKnockback;
    this.kbVY = (dy / len) * COMBAT.enemyHurtKnockback;
    this.hurtUntil = time + 220;
    this.attackStrikeAt = -1;

    if (this.hp <= 0) {
      this.die();
      return;
    }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.active && !this.isDead) this.sprite.clearTint();
    });
  }

  private die(): void {
    this.isDead = true;
    this.sprite.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: this.facing * 70,
      y: 6,
      duration: 260,
      ease: "Quad.easeIn",
    });
    this.scene.tweens.add({
      targets: [this.shadow, this.glow],
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}

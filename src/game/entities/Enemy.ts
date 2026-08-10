import Phaser from "phaser";
import { COMBAT } from "../config";

/**
 * "Lost Pilgrim" — a headless jansang (residual echo) that walks the same
 * stretch of path forever, lantern in hand. It patrols between two x bounds and
 * turns around at the edges. Combat resolution (contact damage, being hit) is
 * driven by GameScene; this class owns patrol movement and its own health.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public readonly maxHp: number;
  public isDead = false;
  /** The player's swing id that last damaged this enemy (dedupe per swing). */
  public lastHitSwing = -1;

  private readonly minX: number;
  private readonly maxX: number;
  private dir: -1 | 1 = 1;
  private knockbackUntil = 0;
  private glow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, patrolRadius = 120) {
    super(scene, x, y, "pilgrim");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 32);
    body.setOffset(3, 4);
    body.setCollideWorldBounds(true);
    this.setDepth(9);

    this.minX = x - patrolRadius;
    this.maxX = x + patrolRadius;
    this.maxHp = COMBAT.enemyMaxHp;
    this.hp = this.maxHp;

    // Faint danger glow from the lantern.
    this.glow = scene.add.circle(x, y + 4, 16, 0xf0a060, 0.12).setDepth(8);
    this.on(Phaser.GameObjects.Events.DESTROY, () => this.glow.destroy());
  }

  /** Apply a hit: damage, knockback away from the attacker, and a flash. */
  takeDamage(amount: number, fromX: number, time: number): void {
    if (this.isDead) return;
    this.hp -= amount;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const away = this.x >= fromX ? 1 : -1;
    body.setVelocityX(away * COMBAT.enemyHurtKnockback);
    body.setVelocityY(-140);
    this.knockbackUntil = time + 220;

    if (this.hp <= 0) {
      this.die();
      return;
    }
    // Hit flash
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (this.active) this.clearTint();
    });
  }

  private die(): void {
    this.isDead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    this.setTintFill(0xffffff);
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      angle: this.dir * 60,
      y: this.y + 6,
      duration: 260,
      ease: "Quad.easeIn",
      onComplete: () => this.destroy(),
    });
  }

  update(time: number): void {
    if (this.isDead) return;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Lantern glow trails the body.
    this.glow.setPosition(this.x + this.dir * 6, this.y + 4);

    // While being knocked back, let physics carry the body.
    if (time < this.knockbackUntil) return;

    // Turn around at patrol bounds or when blocked by a wall.
    if (this.x <= this.minX || body.blocked.left) this.dir = 1;
    else if (this.x >= this.maxX || body.blocked.right) this.dir = -1;

    body.setVelocityX(this.dir * COMBAT.enemyPatrolSpeed);
    this.setFlipX(this.dir === -1);
  }
}

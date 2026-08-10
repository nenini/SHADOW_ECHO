import Phaser from "phaser";
import { COMBAT, JUMP, MOVE, SHADOW } from "../config";
import {
  actorDepth,
  clampWorldX,
  clampWorldY,
  perspectiveScale,
} from "../systems/space";

/**
 * Per-frame movement intent. Kept 8-directional (moveX/moveY) so a future
 * ActionRecorder can capture full planar input, not just left/right.
 */
export interface PlayerInputState {
  moveX: -1 | 0 | 1;
  moveY: -1 | 0 | 1;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  facing: -1 | 1;
}

/**
 * Full readable snapshot of the player for the (later) ActionRecorder / Shadow.
 * Everything needed to replay a trajectory lives here.
 */
export interface PlayerState {
  worldX: number;
  worldY: number;
  jumpZ: number;
  facing: -1 | 1;
  moveX: number;
  moveY: number;
  isJumping: boolean;
  isDashing: boolean;
  isAttacking: boolean;
  swingId: number;
}

type Keys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  altLeft: Phaser.Input.Keyboard.Key;
  altRight: Phaser.Input.Keyboard.Key;
  altUp: Phaser.Input.Keyboard.Key;
  altDown: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
};

/**
 * Pseudo-2.5D player.
 *  - The Container position (this.x, this.y) is the logical floor point (worldX, worldY).
 *  - jumpZ is a virtual height; the visual sprite is drawn at local y = -jumpZ.
 *  - The ground shadow stays at local y = 0 so it marks the true floor position.
 * There is no Arcade body, so nothing "flies" and depth sorting stays stable.
 */
export class Player extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly keys: Keys;

  private facing: -1 | 1 = 1;

  // Jump (manual Z axis)
  public jumpZ = 0;
  private velocityZ = 0;
  private isGrounded = true;
  private lastGroundedAt = -10000;
  private jumpBufferedAt = -10000;

  // Dash
  private isDashing = false;
  private dashEndsAt = 0;
  private dashReadyAt = 0;
  private dashVX = 0;
  private dashVY = 0;

  // Planar knockback velocity (px/s), decays over time.
  private kbVX = 0;
  private kbVY = 0;

  // Combat
  public hp: number;
  public readonly maxHp: number;
  public isDead = false;
  private isAttacking = false;
  private attackActiveFrom = 0;
  private attackEndsAt = 0;
  private attackReadyAt = 0;
  private invulnUntil = 0;
  private hurtUntil = 0;
  private swingId = 0;
  public onAttackStart?: (facing: -1 | 1) => void;

  private moveX = 0;
  private moveY = 0;

  public inputState: PlayerInputState = {
    moveX: 0,
    moveY: 0,
    jump: false,
    dash: false,
    attack: false,
    facing: 1,
  };

  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    super(scene, worldX, worldY);
    scene.add.existing(this);

    this.shadow = scene.add
      .ellipse(0, 0, SHADOW.width, SHADOW.height, 0x000000, SHADOW.alpha)
      .setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(0, 0, "harin").setOrigin(0.5, 0.5);
    // Shadow first (behind), sprite second (in front) within the container.
    this.add([this.shadow, this.sprite]);

    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      left: kb.addKey(K.LEFT),
      right: kb.addKey(K.RIGHT),
      up: kb.addKey(K.UP),
      down: kb.addKey(K.DOWN),
      altLeft: kb.addKey(K.A),
      altRight: kb.addKey(K.D),
      altUp: kb.addKey(K.W),
      altDown: kb.addKey(K.S),
      jump: kb.addKey(K.SPACE),
      dash: kb.addKey(K.SHIFT),
      attack: kb.addKey(K.J),
    };
    kb.addCapture([K.SPACE, K.SHIFT, K.UP, K.DOWN, K.LEFT, K.RIGHT, K.W, K.A, K.S, K.D]);

    this.maxHp = COMBAT.playerMaxHp;
    this.hp = this.maxHp;

    this.applyVisuals(0);
  }

  // --- Readable logical position (for camera, combat, future recorder) ---
  get worldX(): number {
    return this.x;
  }
  get worldY(): number {
    return this.y;
  }
  get facingDir(): -1 | 1 {
    return this.facing;
  }

  update(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;

    // Knockback is applied even while hurt / dead so hits read clearly.
    this.applyKnockback(dt);

    if (this.isDead) {
      this.integrateZ(dt);
      this.applyVisuals(time);
      this.inputState = { moveX: 0, moveY: 0, jump: false, dash: false, attack: false, facing: this.facing };
      return;
    }

    const hurt = time < this.hurtUntil;

    // --- Read 8-directional input ---
    const left = this.keys.left.isDown || this.keys.altLeft.isDown;
    const right = this.keys.right.isDown || this.keys.altRight.isDown;
    const up = this.keys.up.isDown || this.keys.altUp.isDown;
    const down = this.keys.down.isDown || this.keys.altDown.isDown;
    const mvx = (right ? 1 : 0) - (left ? 1 : 0);
    const mvy = (down ? 1 : 0) - (up ? 1 : 0);
    this.moveX = mvx;
    this.moveY = mvy;
    if (mvx !== 0 && !hurt) this.facing = mvx > 0 ? 1 : -1;

    // --- Dash ---
    let dashStarted = false;
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.dash) &&
      !this.isDashing &&
      !hurt &&
      !this.isAttacking &&
      time >= this.dashReadyAt
    ) {
      this.isDashing = true;
      dashStarted = true;
      this.dashEndsAt = time + MOVE.dashDurationMs;
      this.dashReadyAt = time + MOVE.dashCooldownMs;
      if (mvx !== 0 || mvy !== 0) {
        const len = Math.hypot(mvx, mvy);
        this.dashVX = mvx / len;
        this.dashVY = mvy / len;
      } else {
        this.dashVX = this.facing;
        this.dashVY = 0;
      }
      this.sprite.setTint(0xdfe6f0);
    }

    if (this.isDashing) {
      this.x = clampWorldX(this.x + this.dashVX * MOVE.dashSpeed * dt);
      this.y = clampWorldY(this.y + this.dashVY * MOVE.dashSpeed * dt);
      if (time >= this.dashEndsAt) {
        this.isDashing = false;
        this.sprite.clearTint();
      }
    } else if (!hurt && (mvx !== 0 || mvy !== 0)) {
      // --- Planar move (8-way, normalized so diagonals aren't faster) ---
      const len = Math.hypot(mvx, mvy);
      this.x = clampWorldX(this.x + (mvx / len) * MOVE.speed * dt);
      this.y = clampWorldY(this.y + (mvy / len) * MOVE.speed * dt);
    }

    // --- Jump (manual Z, coyote + buffer + variable height) ---
    if (this.isGrounded) this.lastGroundedAt = time;
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && !hurt) this.jumpBufferedAt = time;

    let jumpStarted = false;
    const buffered = time - this.jumpBufferedAt <= JUMP.bufferMs;
    const coyote = time - this.lastGroundedAt <= JUMP.coyoteMs;
    if (buffered && coyote && this.isGrounded && !this.isDashing && !hurt) {
      this.velocityZ = JUMP.jumpVelocityZ;
      this.isGrounded = false;
      jumpStarted = true;
      this.jumpBufferedAt = -10000;
      this.lastGroundedAt = -10000;
    }
    if (Phaser.Input.Keyboard.JustUp(this.keys.jump) && this.velocityZ > 0) {
      this.velocityZ *= JUMP.cutMultiplier;
    }
    this.integrateZ(dt);

    // --- Attack ---
    let attackStarted = false;
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.attack) &&
      !hurt &&
      !this.isDashing &&
      !this.isAttacking &&
      time >= this.attackReadyAt
    ) {
      this.isAttacking = true;
      attackStarted = true;
      this.swingId++;
      this.attackActiveFrom = time + COMBAT.attackWindupMs;
      this.attackEndsAt = this.attackActiveFrom + COMBAT.attackActiveMs;
      this.attackReadyAt = time + COMBAT.attackCooldownMs;
      this.onAttackStart?.(this.facing);
    }
    if (this.isAttacking && time >= this.attackEndsAt) this.isAttacking = false;

    this.applyVisuals(time);

    this.inputState = {
      moveX: mvx as -1 | 0 | 1,
      moveY: mvy as -1 | 0 | 1,
      jump: jumpStarted,
      dash: dashStarted,
      attack: attackStarted,
      facing: this.facing,
    };
  }

  private integrateZ(dt: number): void {
    if (this.isGrounded && this.jumpZ === 0 && this.velocityZ === 0) return;
    this.velocityZ -= JUMP.gravityZ * dt;
    this.jumpZ += this.velocityZ * dt;
    if (this.jumpZ <= 0) {
      this.jumpZ = 0;
      this.velocityZ = 0;
      this.isGrounded = true;
    }
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

  private applyVisuals(time: number): void {
    // Sprite rides up with jumpZ; shadow stays on the floor.
    this.sprite.y = -this.jumpZ;
    this.sprite.setFlipX(this.facing === -1);

    const zt = Phaser.Math.Clamp(this.jumpZ / JUMP.maxShadowFadeZ, 0, 1);
    this.shadow.setScale(1 - 0.45 * zt);
    this.shadow.setAlpha(SHADOW.alpha * (1 - 0.55 * zt));

    // Perspective + depth from the floor position only (never jumpZ).
    this.setScale(perspectiveScale(this.y));
    this.setDepth(actorDepth(this.y));

    const blink = time < this.invulnUntil && Math.floor(time / 80) % 2 === 0;
    this.sprite.setAlpha(this.isDead ? 1 : blink ? 0.35 : 1);
  }

  // --- Combat interface (used by GameScene) ---

  isAttackActive(time: number): boolean {
    return this.isAttacking && time >= this.attackActiveFrom && time < this.attackEndsAt;
  }

  getSwingId(): number {
    return this.swingId;
  }

  /** Forward reach on the worldX axis for the current swing. */
  getAttackXRange(): { min: number; max: number } {
    return this.facing === 1
      ? { min: this.x + 6, max: this.x + 6 + COMBAT.attackReach }
      : { min: this.x - 6 - COMBAT.attackReach, max: this.x - 6 };
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnUntil;
  }

  /** Take a hit from a source at (fromX, fromY) on the floor plane. */
  takeDamage(amount: number, fromX: number, fromY: number, time: number): boolean {
    if (this.isDead || this.isInvulnerable(time)) return false;
    this.hp = Math.max(0, this.hp - amount);

    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.kbVX = (dx / len) * COMBAT.playerHurtKnockback;
    this.kbVY = (dy / len) * COMBAT.playerHurtKnockback;

    this.isDashing = false;
    this.sprite.clearTint();
    this.hurtUntil = time + 240;
    this.invulnUntil = time + COMBAT.playerInvulnMs;
    this.facing = dx >= 0 ? -1 : 1; // face the threat

    if (this.hp <= 0) this.isDead = true;
    return true;
  }

  getState(): PlayerState {
    return {
      worldX: this.x,
      worldY: this.y,
      jumpZ: this.jumpZ,
      facing: this.facing,
      moveX: this.moveX,
      moveY: this.moveY,
      isJumping: !this.isGrounded,
      isDashing: this.isDashing,
      isAttacking: this.isAttacking,
      swingId: this.swingId,
    };
  }
}

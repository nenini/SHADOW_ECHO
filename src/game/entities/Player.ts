import Phaser from "phaser";
import { COMBAT, GAME } from "../config";

/**
 * Snapshot of the player's intent on a given frame. The Shadow / Echo system
 * (implemented later) will record a rolling ~3s buffer of these to replay.
 */
export interface PlayerInputState {
  moveDir: -1 | 0 | 1;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  facing: -1 | 1;
}

type Keys = {
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  altLeft: Phaser.Input.Keyboard.Key;
  altRight: Phaser.Input.Keyboard.Key;
  jump: Phaser.Input.Keyboard.Key;
  dash: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: Keys;
  private facing: -1 | 1 = 1;

  private isDashing = false;
  private dashEndsAt = 0;
  private dashReadyAt = 0;

  // Timestamps for forgiving jump handling (coyote time + input buffering).
  private lastOnGroundAt = -10000;
  private jumpBufferedAt = -10000;

  // Combat
  public hp: number;
  public readonly maxHp: number;
  public isDead = false;
  private isAttacking = false;
  private attackEndsAt = 0;
  private attackActiveFrom = 0;
  private attackReadyAt = 0;
  private invulnUntil = 0;
  private hurtUntil = 0;
  /** Increments each swing so GameScene can hit each enemy at most once per swing. */
  private swingId = 0;
  /** Reused rectangle describing the sword's reach during the active window. */
  private readonly attackRect = new Phaser.Geom.Rectangle();
  /** Fires once per swing so GameScene can spawn the slash VFX. */
  public onAttackStart?: (facing: -1 | 1) => void;

  /** The intent produced this frame — read by systems after update(). */
  public inputState: PlayerInputState = {
    moveDir: 0,
    jump: false,
    dash: false,
    attack: false,
    facing: 1,
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "harin");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 30);
    body.setOffset(2, 4);
    body.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.setDepth(10);

    const kb = scene.input.keyboard!;
    this.keys = {
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      altLeft: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      altRight: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      jump: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      dash: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      attack: kb.addKey(Phaser.Input.Keyboard.KeyCodes.J),
    };
    // Prevent Space/Shift from scrolling or triggering browser shortcuts.
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ]);

    this.maxHp = COMBAT.playerMaxHp;
    this.hp = this.maxHp;
  }

  private get onGround(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  update(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isDead) {
      body.setVelocityX(0);
      this.inputState = { moveDir: 0, jump: false, dash: false, attack: false, facing: this.facing };
      return;
    }

    // Invulnerability blink after being hit.
    this.setAlpha(time < this.invulnUntil && Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
    const hurt = time < this.hurtUntil;

    const leftDown = this.keys.left.isDown || this.keys.altLeft.isDown;
    const rightDown = this.keys.right.isDown || this.keys.altRight.isDown;
    const moveDir: -1 | 0 | 1 = leftDown && !rightDown ? -1 : rightDown && !leftDown ? 1 : 0;

    if (moveDir !== 0 && !hurt) this.facing = moveDir;

    // --- Dash ---
    const wantDash = Phaser.Input.Keyboard.JustDown(this.keys.dash);
    let dashStarted = false;
    if (wantDash && !this.isDashing && !hurt && !this.isAttacking && time >= this.dashReadyAt) {
      this.isDashing = true;
      dashStarted = true;
      this.dashEndsAt = time + GAME.dashDurationMs;
      this.dashReadyAt = time + GAME.dashCooldownMs;
      body.setAllowGravity(false);
      body.setVelocityY(0);
      this.setTint(0xdfe6f0);
    }

    if (this.isDashing) {
      body.setVelocityX(this.facing * GAME.dashSpeed);
      if (time >= this.dashEndsAt) {
        this.isDashing = false;
        body.setAllowGravity(true);
        this.clearTint();
      }
    } else if (!hurt) {
      // --- Horizontal move ---
      body.setVelocityX(moveDir * GAME.moveSpeed);
    }
    // While hurt, knockback velocity is left untouched.

    // --- Jump (coyote time + input buffer + variable height) ---
    if (this.onGround) this.lastOnGroundAt = time;
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && !hurt) this.jumpBufferedAt = time;

    let jumpStarted = false;
    const withinCoyote = time - this.lastOnGroundAt <= GAME.coyoteMs;
    const jumpBuffered = time - this.jumpBufferedAt <= GAME.jumpBufferMs;
    if (jumpBuffered && withinCoyote && !this.isDashing) {
      body.setVelocityY(GAME.jumpVelocity);
      jumpStarted = true;
      this.jumpBufferedAt = -10000;
      this.lastOnGroundAt = -10000;
    }

    // Release jump early while rising -> shorter hop.
    if (Phaser.Input.Keyboard.JustUp(this.keys.jump) && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * GAME.jumpCutMultiplier);
    }

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

    // Face the movement direction visually.
    this.setFlipX(this.facing === -1);

    this.inputState = {
      moveDir,
      jump: jumpStarted,
      dash: dashStarted,
      attack: attackStarted,
      facing: this.facing,
    };
  }

  /** True during the damaging window of a swing. */
  isAttackActive(time: number): boolean {
    return this.isAttacking && time >= this.attackActiveFrom && time < this.attackEndsAt;
  }

  /** Identifies the current swing so callers can hit each target once per swing. */
  getSwingId(): number {
    return this.swingId;
  }

  /** The sword's reach rectangle in world space, in front of the player. */
  getAttackRect(): Phaser.Geom.Rectangle {
    const w = COMBAT.attackReach;
    const h = COMBAT.attackHalfHeight * 2;
    const x = this.facing === 1 ? this.x + 6 : this.x - 6 - w;
    this.attackRect.setTo(x, this.y - COMBAT.attackHalfHeight, w, h);
    return this.attackRect;
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnUntil;
  }

  /** Take a hit from a source at fromX: damage, knockback, i-frames. */
  takeDamage(amount: number, fromX: number, time: number): boolean {
    if (this.isDead || this.isInvulnerable(time)) return false;
    this.hp = Math.max(0, this.hp - amount);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const away = this.x >= fromX ? 1 : -1;
    this.isDashing = false;
    body.setAllowGravity(true);
    body.setVelocityX(away * COMBAT.playerHurtKnockback);
    body.setVelocityY(COMBAT.playerHurtLiftY);

    this.hurtUntil = time + 240;
    this.invulnUntil = time + COMBAT.playerInvulnMs;
    this.facing = away === 1 ? -1 : 1; // face the threat

    if (this.hp <= 0) {
      this.isDead = true;
      this.setAlpha(1);
    }
    return true;
  }
}

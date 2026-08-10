import Phaser from "phaser";
import { GAME } from "../config";

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
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  private keys: Keys;
  private facing: -1 | 1 = 1;

  private isDashing = false;
  private dashEndsAt = 0;
  private dashReadyAt = 0;

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
    };
    // Prevent Space/Shift from scrolling or triggering browser shortcuts.
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ]);
  }

  private get onGround(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  update(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const leftDown = this.keys.left.isDown || this.keys.altLeft.isDown;
    const rightDown = this.keys.right.isDown || this.keys.altRight.isDown;
    const moveDir: -1 | 0 | 1 = leftDown && !rightDown ? -1 : rightDown && !leftDown ? 1 : 0;

    if (moveDir !== 0) this.facing = moveDir;

    // --- Dash ---
    const wantDash = Phaser.Input.Keyboard.JustDown(this.keys.dash);
    let dashStarted = false;
    if (wantDash && !this.isDashing && time >= this.dashReadyAt) {
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
    } else {
      // --- Horizontal move ---
      body.setVelocityX(moveDir * GAME.moveSpeed);
    }

    // --- Jump ---
    let jumpStarted = false;
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) && this.onGround && !this.isDashing) {
      body.setVelocityY(GAME.jumpVelocity);
      jumpStarted = true;
    }

    // Face the movement direction visually.
    this.setFlipX(this.facing === -1);

    this.inputState = {
      moveDir,
      jump: jumpStarted,
      dash: dashStarted,
      attack: false,
      facing: this.facing,
    };
  }
}

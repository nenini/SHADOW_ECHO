import Phaser from "phaser";
import { COMBAT, JUMP, SHADOW, SUPPORT } from "../config";
import { actorDepth, clampWorldX, clampWorldY, perspectiveScale } from "../systems/space";
import type { ActionFrame } from "../systems/ActionRecorder";
import type { PlayStyle } from "../systems/PlayerProfile";
import type { Enemy } from "./Enemy";

/**
 * 잔영 (Echo Shadow). Replays a snapshot of the player's recent action frames:
 * position, jump height, facing and attacks are reproduced exactly where the
 * player performed them. It deals damage to enemies during replayed attacks but
 * cannot be hurt and is ignored by enemy AI. Adaptive behaviour comes later —
 * for now it is a faithful afterimage.
 *
 * It exposes the same melee-attacker surface as Player (worldX/worldY,
 * isAttackActive, getSwingId, getAttackXRange) so GameScene resolves its hits
 * with the exact same 2.5D logic.
 */
export class Shadow extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;

  public isReplaying = false;
  public jumpZ = 0;

  private frames: ActionFrame[] = [];
  private index = 0;
  private facing: -1 | 1 = 1;

  // A Shadow-local swing counter so enemy per-attacker dedupe stays correct.
  private swingId = 0;
  private prevFrameSwing = -1;

  /** Fired when a replayed swing begins, so GameScene can spawn the slash VFX. */
  public onAttackStart?: (facing: -1 | 1, x: number, y: number, jumpZ: number) => void;
  /** Fired on a replayed interact frame, routed to the InteractionSystem. */
  public onInteract?: (x: number, y: number) => void;

  // --- Independent support action (second-combat finale, data-driven) ---
  public isSupporting = false;
  private supportStyle: PlayStyle = "AGGRESSIVE";
  private supportTarget: Enemy | null = null;
  private supportActed = false;
  private supportLingerUntil = 0;
  /** Fired once when the Shadow reaches the target and performs the support. */
  public onSupportAct?: (style: PlayStyle, target: Enemy | null) => void;
  /** Fired when the support action fully finishes. */
  public onSupportDone?: () => void;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.shadow = scene.add
      .ellipse(0, 0, SHADOW.width, SHADOW.height, 0x000000, SHADOW.alpha * 0.6)
      .setOrigin(0.5, 0.5);
    this.sprite = scene.add
      .sprite(0, 0, "harin_echo")
      .setOrigin(0.5, 1)
      .setAlpha(0.82);
    this.add([this.shadow, this.sprite]);

    this.setVisible(false);
  }

  get worldX(): number {
    return this.x;
  }
  get worldY(): number {
    return this.y;
  }

  /** Begin replaying a snapshot of recorded frames (oldest -> newest). */
  startReplay(frames: ActionFrame[]): void {
    if (frames.length === 0) return;
    this.frames = frames;
    this.index = 0;
    this.isReplaying = true;
    this.prevFrameSwing = frames[0].swingId;
    this.applyFrame(frames[0]);
    this.setVisible(true);
  }

  /**
   * Begin an independent support action chosen by the PlayerProfile. The Shadow
   * emerges at (fromX, fromY), moves to the target, and acts once.
   */
  startSupport(style: PlayStyle, target: Enemy, fromX: number, fromY: number): void {
    this.isReplaying = false;
    this.isSupporting = true;
    this.supportStyle = style;
    this.supportTarget = target;
    this.supportActed = false;
    this.x = fromX;
    this.y = fromY;
    this.jumpZ = 0;
    this.facing = target.worldX >= fromX ? 1 : -1;
    this.setVisible(true);
    this.refreshTransform();
  }

  update(time: number, deltaMs: number): void {
    if (this.isSupporting) {
      this.updateSupport(time, deltaMs);
      return;
    }
    if (!this.isReplaying) return;

    const f = this.frames[this.index];
    this.applyFrame(f);

    // A change in the recorded swing id marks a new swing starting.
    if (f.swingId !== this.prevFrameSwing) {
      this.prevFrameSwing = f.swingId;
      if (f.swingId !== 0) {
        this.swingId++;
        this.onAttackStart?.(this.facing, this.x, this.y, this.jumpZ);
      }
    }

    // Replayed interact fires the same InteractionSystem path the player uses.
    if (f.interact) this.onInteract?.(this.x, this.y);

    this.index++;
    if (this.index >= this.frames.length) this.endReplay();
  }

  private applyFrame(f: ActionFrame): void {
    this.x = f.worldX;
    this.y = f.worldY;
    this.jumpZ = f.jumpZ;
    this.facing = f.facing;

    this.sprite.y = -f.jumpZ;
    this.sprite.setFlipX(f.facing === -1);
    this.sprite.setAlpha(f.isDashing ? 1 : 0.82);

    const zt = Phaser.Math.Clamp(f.jumpZ / JUMP.maxShadowFadeZ, 0, 1);
    this.shadow.setScale(1 - 0.45 * zt);
    this.shadow.setAlpha(SHADOW.alpha * 0.6 * (1 - 0.55 * zt));

    this.setScale(perspectiveScale(this.y));
    this.setDepth(actorDepth(this.y));
  }

  private endReplay(): void {
    this.isReplaying = false;
    this.frames = [];
    this.setVisible(false);
  }

  private updateSupport(time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const t = this.supportTarget;

    if (!this.supportActed) {
      const tx = t ? t.worldX : this.x;
      const ty = t ? t.worldY : this.y;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const d = Math.hypot(dx, dy);
      if (d > SUPPORT.approachRange) {
        this.x = clampWorldX(this.x + (dx / d) * SUPPORT.shadowSpeed * dt);
        this.y = clampWorldY(this.y + (dy / d) * SUPPORT.shadowSpeed * dt);
        if (dx !== 0) this.facing = dx > 0 ? 1 : -1;
      } else {
        this.supportActed = true;
        this.supportLingerUntil = time + SUPPORT.lingerMs;
        this.onSupportAct?.(this.supportStyle, t);
      }
    } else if (time >= this.supportLingerUntil) {
      this.isSupporting = false;
      this.supportTarget = null;
      this.setVisible(false);
      this.onSupportDone?.();
    }

    this.refreshTransform();
  }

  /** Shared transform/tint update used by the support action. */
  private refreshTransform(): void {
    this.sprite.y = -this.jumpZ;
    this.sprite.setFlipX(this.facing === -1);
    const zt = Phaser.Math.Clamp(this.jumpZ / JUMP.maxShadowFadeZ, 0, 1);
    this.shadow.setScale(1 - 0.45 * zt);
    this.shadow.setAlpha(SHADOW.alpha * 0.6 * (1 - 0.55 * zt));
    this.setScale(perspectiveScale(this.y));
    this.setDepth(actorDepth(this.y));
  }

  // --- Melee-attacker surface (mirrors Player) ---

  isAttackActive(): boolean {
    return this.isReplaying && !!this.frames[this.index - 1]?.attackActive;
  }

  getSwingId(): number {
    return this.swingId;
  }

  getAttackXRange(): { min: number; max: number } {
    return this.facing === 1
      ? { min: this.x + 6, max: this.x + 6 + COMBAT.attackReach }
      : { min: this.x - 6 - COMBAT.attackReach, max: this.x - 6 };
  }
}

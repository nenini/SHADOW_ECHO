import Phaser from "phaser";
import { PALETTE } from "../config";
import { actorDepth, perspectiveScale } from "../systems/space";
import type { Interactable } from "../systems/InteractionSystem";

/**
 * A pull lever on the floor plane. Implements Interactable so the exact same
 * InteractionSystem path drives it whether the Player or a replaying Shadow
 * activates it. Each activation re-fires onActivate (so re-pulling re-opens the
 * door), with a handle-swing tween for feedback.
 */
export class Lever extends Phaser.GameObjects.Container implements Interactable {
  public interactionRangeX = 46;
  public interactionRangeY = 34;
  public active = false;

  /** Fired on every activation (Player or Shadow). Wired to Door.open(). */
  public onActivate?: () => void;

  private readonly handle: Phaser.GameObjects.Rectangle;
  private readonly knob: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    super(scene, worldX, worldY);
    scene.add.existing(this);

    const groundShadow = scene.add.ellipse(0, 2, 26, 9, 0x000000, 0.3).setOrigin(0.5, 0.5);
    // Stone base.
    const base = scene.add.rectangle(0, -6, 14, 18, PALETTE.grayBrown).setOrigin(0.5, 1);
    // Handle pivots from the base top; starts leaning left (OFF).
    this.handle = scene.add.rectangle(0, -22, 5, 22, PALETTE.navy).setOrigin(0.5, 1);
    this.handle.setAngle(-38);
    this.knob = scene.add.ellipse(0, -42, 9, 9, PALETTE.fog).setOrigin(0.5, 0.5);
    this.add([groundShadow, base, this.handle, this.knob]);
    this.syncKnob();

    this.setScale(perspectiveScale(worldY));
    this.setDepth(actorDepth(worldY));
  }

  get worldX(): number {
    return this.x;
  }
  get worldY(): number {
    return this.y;
  }

  interact(): void {
    this.active = true;
    // Swing the handle to the ON side (right) with a small pulse.
    this.scene.tweens.add({
      targets: this.handle,
      angle: 38,
      duration: 140,
      ease: "Back.easeOut",
      onUpdate: () => this.syncKnob(),
    });
    this.scene.tweens.add({
      targets: this.knob,
      scale: { from: 1.4, to: 1 },
      duration: 220,
      ease: "Quad.easeOut",
    });
    this.onActivate?.();
  }

  /** Keep the knob glued to the end of the swinging handle. */
  private syncKnob(): void {
    const rad = Phaser.Math.DegToRad(this.handle.angle - 90);
    this.knob.setPosition(Math.cos(rad) * 22, -22 + Math.sin(rad) * 22);
  }
}

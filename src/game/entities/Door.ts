import Phaser from "phaser";
import { PALETTE } from "../config";
import { actorDepth, perspectiveScale } from "../systems/space";

const DOOR_HEIGHT = 96;
const PANEL_WIDTH = 30;

/**
 * A portcullis-style gate on the floor plane. Opens (panel slides up) when a
 * lever activates it, auto-closes after a duration, and blocks the player from
 * crossing its worldX while shut. Blocks across the whole corridor depth (it is
 * a gate), so it cannot be walked around. The Shadow, being an afterimage,
 * is never blocked.
 */
export class Door extends Phaser.GameObjects.Container {
  public isOpen = false;
  public lockedOpen = false;
  public readonly blockHalfWidth = 15;

  private readonly panel: Phaser.GameObjects.Rectangle;
  private openUntil = 0;

  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    super(scene, worldX, worldY);
    scene.add.existing(this);

    // Stone frame (static): two posts + a lintel.
    const postL = scene.add.rectangle(-20, 0, 10, DOOR_HEIGHT + 8, PALETTE.grayBrown).setOrigin(0.5, 1);
    const postR = scene.add.rectangle(20, 0, 10, DOOR_HEIGHT + 8, PALETTE.grayBrown).setOrigin(0.5, 1);
    const lintel = scene.add.rectangle(0, -DOOR_HEIGHT, 58, 12, PALETTE.grayBrown).setOrigin(0.5, 0.5);
    // Sliding panel (origin at its bottom so it "rises" out of the way).
    this.panel = scene.add.rectangle(0, 0, PANEL_WIDTH, DOOR_HEIGHT, PALETTE.deepNavy).setOrigin(0.5, 1);

    this.add([postL, postR, this.panel, lintel]);
    this.setScale(perspectiveScale(worldY));
    this.setDepth(actorDepth(worldY));
  }

  get worldX(): number {
    return this.x;
  }

  /** Open the gate for `durationMs`; refreshes the timer if already open. */
  open(time: number, durationMs: number): void {
    this.openUntil = time + durationMs;
    if (this.isOpen) return;
    this.isOpen = true;
    this.scene.tweens.add({
      targets: this.panel,
      y: -(DOOR_HEIGHT - 6),
      duration: 220,
      ease: "Quad.easeOut",
    });
  }

  /** Keep the gate open permanently (e.g. after the puzzle is solved). */
  lockOpen(time: number): void {
    this.lockedOpen = true;
    this.open(time, 0);
  }

  private close(): void {
    this.isOpen = false;
    this.scene.tweens.add({
      targets: this.panel,
      y: 0,
      duration: 260,
      ease: "Quad.easeIn",
    });
  }

  update(time: number): void {
    if (this.isOpen && !this.lockedOpen && time >= this.openUntil) this.close();
  }

  /** Block the player from crossing the gate's worldX slab while shut. */
  collide(actor: { x: number }): void {
    if (this.isOpen) return;
    const half = this.blockHalfWidth;
    if (actor.x > this.x - half && actor.x < this.x + half) {
      actor.x = this.x - half; // push back to the approach (left) side
    }
  }
}

import Phaser from "phaser";
import { SHADOW } from "../config";
import { actorDepth, perspectiveScale } from "../systems/space";

/**
 * Mara — the last living villager. A static NPC at the village entrance that
 * triggers the closing story beat. She looks past Harin at the shadow behind.
 * (No branching dialogue system yet; GameScene drives her lines.)
 */
export class Mara extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, worldX: number, worldY: number) {
    super(scene, worldX, worldY);
    scene.add.existing(this);

    const groundShadow = scene.add
      .ellipse(0, 2, SHADOW.width, SHADOW.height, 0x000000, SHADOW.alpha)
      .setOrigin(0.5, 0.5);
    const sprite = scene.add.sprite(0, 0, "mara").setOrigin(0.5, 1).setY(4);
    this.add([groundShadow, sprite]);

    this.setScale(perspectiveScale(worldY));
    this.setDepth(actorDepth(worldY));
  }

  get worldX(): number {
    return this.x;
  }
}

import Phaser from "phaser";
import { GAME, PALETTE } from "../config";

export interface DialogueLine {
  speaker: string;
  text: string;
}

/**
 * A minimal, screen-fixed dialogue box advanced by a keypress. Deliberately
 * small — enough to stage the closing story beat, not a full dialogue system.
 */
export class Dialogue {
  public active = false;

  private readonly panel: Phaser.GameObjects.Graphics;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly bodyText: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly keys: Phaser.Input.Keyboard.Key[];

  private lines: DialogueLine[] = [];
  private index = 0;
  private onDone?: () => void;

  constructor(scene: Phaser.Scene, depth: number) {
    const w = GAME.width;
    const h = GAME.height;
    const top = h - 120;

    this.panel = scene.add.graphics().setScrollFactor(0).setDepth(depth);
    this.panel.fillStyle(PALETTE.black, 0.82);
    this.panel.fillRect(32, top, w - 64, 96);
    this.panel.lineStyle(2, PALETTE.fog, 0.4);
    this.panel.strokeRect(32, top, w - 64, 96);

    this.nameText = scene.add
      .text(52, top + 14, "", { fontFamily: "monospace", fontSize: "16px", color: "#e8c976" })
      .setScrollFactor(0)
      .setDepth(depth);
    this.bodyText = scene.add
      .text(52, top + 42, "", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#f2efe4",
        wordWrap: { width: w - 104 },
      })
      .setScrollFactor(0)
      .setDepth(depth);
    this.hint = scene.add
      .text(w - 48, h - 34, "[Space] 계속", { fontFamily: "monospace", fontSize: "12px", color: "#8a95a5" })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(depth);

    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard!;
    this.keys = [kb.addKey(K.SPACE), kb.addKey(K.E), kb.addKey(K.J), kb.addKey(K.ENTER)];

    this.setVisible(false);
  }

  start(lines: DialogueLine[], onDone?: () => void): void {
    this.lines = lines;
    this.index = 0;
    this.onDone = onDone;
    this.active = true;
    this.setVisible(true);
    this.render();
  }

  update(): void {
    if (!this.active) return;
    const advance = this.keys.some((k) => Phaser.Input.Keyboard.JustDown(k));
    if (!advance) return;

    this.index += 1;
    if (this.index >= this.lines.length) {
      this.active = false;
      this.setVisible(false);
      this.onDone?.();
      return;
    }
    this.render();
  }

  private render(): void {
    const line = this.lines[this.index];
    this.nameText.setText(line.speaker);
    this.bodyText.setText(line.text);
  }

  private setVisible(v: boolean): void {
    this.panel.setVisible(v);
    this.nameText.setVisible(v);
    this.bodyText.setVisible(v);
    this.hint.setVisible(v);
  }
}

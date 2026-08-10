import Phaser from "phaser";
import { COMBAT, DEPTH, GAME, PALETTE, WORLD } from "../config";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";

/**
 * Pseudo-2.5D belt-scroll arena. Actors live on a floor plane (worldX, worldY)
 * with a separate virtual jump height; depth is sorted by worldY every frame.
 * Movement, jump (Z), dash, and combat all operate on this model. Story, Shadow
 * and adaptive AI are layered on later.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hpPips!: Phaser.GameObjects.Graphics;
  private playerDeadHandled = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.playerDeadHandled = false;
    this.enemies = [];

    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.setBackgroundColor(PALETTE.black);

    this.buildBackground();
    this.buildFloor();

    this.player = new Player(this, 220, 540);

    this.spawnEnemies();
    this.setupCombat();

    // Camera follows the logical floor position, so jumping never bounces it.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(180, 240);

    this.buildAtmosphere();
    this.buildHud();
  }

  // --- World construction ---

  /** Layered, parallax dark-forest backdrop using simple shapes + fog. */
  private buildBackground(): void {
    const { worldWidth } = GAME;
    const h = GAME.height;

    this.add
      .rectangle(0, 0, worldWidth, GAME.worldHeight, PALETTE.deepNavy)
      .setOrigin(0, 0)
      .setScrollFactor(0.1)
      .setDepth(-50);

    this.add.circle(GAME.width * 0.72, 90, 46, PALETTE.moon, 0.9).setScrollFactor(0.1).setDepth(-49);
    this.add.circle(GAME.width * 0.72, 90, 70, PALETTE.moon, 0.08).setScrollFactor(0.1).setDepth(-49);

    // Multi-layer parallax tree lines (far -> near).
    this.paintTreeLine(-30, worldWidth, h - 40, 0.3, PALETTE.black, 90, 26);
    this.paintTreeLine(-20, worldWidth, h + 10, 0.55, 0x080b12, 150, 40);
  }

  private paintTreeLine(
    startX: number,
    spanX: number,
    baseY: number,
    scroll: number,
    color: number,
    maxHeight: number,
    step: number,
  ): void {
    const g = this.add.graphics().setScrollFactor(scroll).setDepth(-40);
    g.fillStyle(color, 1);
    for (let x = startX; x < startX + spanX; x += step) {
      const seed = Math.abs(Math.sin(x * 0.09));
      const treeH = maxHeight * (0.5 + seed * 0.6);
      const treeW = step * 0.7;
      g.fillTriangle(x, baseY, x + treeW / 2, baseY - treeH, x + treeW, baseY);
      g.fillRect(x + treeW / 2 - 3, baseY - treeH * 0.3, 6, treeH * 0.3);
    }
  }

  /** One continuous forest floor spanning the walkable depth band. */
  private buildFloor(): void {
    const top = WORLD.yMin - 6;
    const height = GAME.worldHeight - top;

    // Textured ground.
    this.add
      .tileSprite(0, top, GAME.worldWidth, height, "ground")
      .setOrigin(0, 0)
      .setDepth(DEPTH.ground);

    // Depth shading: darker at the back edge, so the plane reads as receding.
    const shade = this.add.graphics().setDepth(DEPTH.ground + 1);
    shade.fillStyle(PALETTE.black, 0.35);
    shade.fillRect(0, top, GAME.worldWidth, 26);
    shade.fillStyle(PALETTE.mutedGreen, 0.25);
    shade.fillRect(0, WORLD.yMin, GAME.worldWidth, 4);
  }

  private spawnEnemies(): void {
    const spawns: Array<[number, number]> = [
      [700, 470],
      [1150, 560],
      [1500, 500],
      [1950, 470],
    ];
    for (const [x, y] of spawns) {
      this.enemies.push(new Enemy(this, x, y));
    }
  }

  private setupCombat(): void {
    this.hitParticles = this.add.particles(0, 0, "pixel", {
      lifespan: 320,
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 3, end: 0 },
      tint: [PALETTE.echoPale, PALETTE.echoGold],
      gravityY: 500,
      emitting: false,
    });
    this.hitParticles.setDepth(DEPTH.vfx);

    this.player.onAttackStart = (facing) => this.spawnSlash(facing);
  }

  private spawnSlash(facing: -1 | 1): void {
    const slash = this.add
      .image(this.player.worldX + facing * 22, this.player.worldY - this.player.jumpZ - 6, "slash")
      .setDepth(DEPTH.vfx)
      .setFlipX(facing === -1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.9);
    this.tweens.add({
      targets: slash,
      alpha: { from: 0.95, to: 0 },
      scaleX: { from: 0.6, to: 1.05 },
      duration: 160,
      onComplete: () => slash.destroy(),
    });
  }

  private buildAtmosphere(): void {
    const fog = this.add
      .rectangle(0, WORLD.yMin - 30, GAME.worldWidth, 120, PALETTE.fog, 0.05)
      .setOrigin(0, 0)
      .setScrollFactor(0.8)
      .setDepth(DEPTH.fog);
    this.tweens.add({
      targets: fog,
      alpha: { from: 0.04, to: 0.09 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });

    const vg = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.vignette);
    vg.fillStyle(PALETTE.black, 0.35);
    vg.fillRect(0, 0, GAME.width, 60);
    vg.fillRect(0, GAME.height - 60, GAME.width, 60);
  }

  private buildHud(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#d8dce6",
    };
    this.add
      .text(16, 14, "그림자가 걷는 밤 · Shadow Echo", { ...style, fontSize: "18px" })
      .setScrollFactor(0)
      .setDepth(DEPTH.hud);
    this.add
      .text(16, 40, "A/D·←/→ 좌우  ·  W/S·↑/↓ 앞뒤  ·  Space 점프  ·  Shift 대시  ·  J 공격", style)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.85);

    this.hpPips = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.hud);
    this.updateHud();
  }

  private updateHud(): void {
    this.hpPips.clear();
    for (let i = 0; i < this.player.maxHp; i++) {
      const filled = i < this.player.hp;
      this.hpPips.fillStyle(filled ? PALETTE.danger : 0x2a2f38, 1);
      this.hpPips.fillRect(16 + i * 22, 70, 16, 16);
      this.hpPips.lineStyle(2, PALETTE.black, 0.6);
      this.hpPips.strokeRect(16 + i * 22, 70, 16, 16);
    }
  }

  // --- Per-frame update ---

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    // Drop destroyed enemies, then update the survivors.
    this.enemies = this.enemies.filter((e) => e.active);
    for (const e of this.enemies) e.update(time, delta, this.player);

    this.resolveSwordHits(time);
    this.updateHud();

    if (this.player.isDead && !this.playerDeadHandled) {
      this.playerDeadHandled = true;
      this.cameras.main.flash(300, 120, 0, 0);
      this.time.delayedCall(1100, () => this.scene.restart());
    }
  }

  /**
   * Sword hit test in 2.5D: the target must be within the forward X reach AND
   * within a shallow worldY depth band AND not too high in the air.
   */
  private resolveSwordHits(time: number): void {
    if (!this.player.isAttackActive(time)) return;
    const xr = this.player.getAttackXRange();
    const swing = this.player.getSwingId();
    const enemyHalfWidth = 12;

    for (const e of this.enemies) {
      if (e.isDead || e.lastHitSwing === swing) continue;
      if (Math.abs(this.player.worldY - e.worldY) > COMBAT.attackDepthTolerance) continue;
      if (e.jumpZ > COMBAT.attackMaxTargetZ) continue;
      const overlapsX = e.worldX + enemyHalfWidth >= xr.min && e.worldX - enemyHalfWidth <= xr.max;
      if (!overlapsX) continue;

      e.lastHitSwing = swing;
      e.takeDamage(COMBAT.attackDamage, this.player.worldX, this.player.worldY, time);
      this.hitParticles.emitParticleAt(e.worldX, e.worldY - e.jumpZ - 8, 12);
      this.cameras.main.shake(70, 0.005);
    }
  }
}

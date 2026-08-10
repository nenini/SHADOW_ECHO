import Phaser from "phaser";
import { COMBAT, GAME, PALETTE } from "../config";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";

/**
 * First-scope playable scene: a dark forest clearing with a test floor and a
 * few platforms. Establishes movement, jump, dash and camera follow.
 * Story beats, combat, enemies and the Echo system are added in later steps.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hpPips!: Phaser.GameObjects.Graphics;
  private playerDeadHandled = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.playerDeadHandled = false;
    this.physics.world.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.setBackgroundColor(PALETTE.black);

    this.buildBackground();
    this.buildTerrain();

    this.player = new Player(this, 160, GAME.floorY - 60);
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(
      this.player,
      this.platforms,
      undefined,
      this.landOnPlatform as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    );

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(220, 140);

    this.spawnEnemies();
    this.setupCombat();

    this.buildAtmosphere();
    this.buildHud();
  }

  private spawnEnemies(): void {
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    // Lost Pilgrims patrolling the forest floor.
    const spawns: Array<[number, number]> = [
      [700, GAME.floorY - 40],
      [1150, GAME.floorY - 40],
      [1500, GAME.floorY - 40],
    ];
    for (const [x, y] of spawns) {
      const e = new Enemy(this, x, y);
      this.enemies.add(e, true);
    }
    this.physics.add.collider(this.enemies, this.solids);
  }

  private setupCombat(): void {
    // Reusable burst emitter for hit sparks (pale/gold echo motes).
    this.hitParticles = this.add.particles(0, 0, "pixel", {
      lifespan: 320,
      speed: { min: 60, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 3, end: 0 },
      tint: [PALETTE.echoPale, PALETTE.echoGold],
      gravityY: 500,
      emitting: false,
    });
    this.hitParticles.setDepth(20);

    // Spawn a slash arc VFX when the player swings.
    this.player.onAttackStart = (facing) => this.spawnSlash(facing);

    // Contact damage: touching a pilgrim hurts the player.
    this.physics.add.overlap(this.player, this.enemies, (_p, eObj) => {
      const e = eObj as Enemy;
      if (e.isDead) return;
      const hit = this.player.takeDamage(
        COMBAT.enemyTouchDamage,
        e.x,
        this.time.now,
      );
      if (hit) {
        this.cameras.main.shake(120, 0.008);
        this.cameras.main.flash(90, 90, 0, 0);
      }
    });
  }

  private spawnSlash(facing: -1 | 1): void {
    const slash = this.add
      .image(this.player.x + facing * 22, this.player.y, "slash")
      .setDepth(12)
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

  /** Layered, parallax dark-forest backdrop using simple shapes + fog. */
  private buildBackground(): void {
    const { worldWidth } = GAME;
    const h = GAME.height;

    // Sky gradient bands (deep navy -> black), fixed-ish via low scroll factor.
    const sky = this.add.rectangle(0, 0, worldWidth, GAME.worldHeight, PALETTE.deepNavy)
      .setOrigin(0, 0)
      .setScrollFactor(0.1)
      .setDepth(-50);
    sky.setAlpha(1);

    // Moon
    this.add.circle(GAME.width * 0.72, 90, 46, PALETTE.moon, 0.9)
      .setScrollFactor(0.1)
      .setDepth(-49);
    this.add.circle(GAME.width * 0.72, 90, 70, PALETTE.moon, 0.08)
      .setScrollFactor(0.1)
      .setDepth(-49);

    // Far tree line (silhouettes)
    this.paintTreeLine(-30, worldWidth, h - 40, 0.3, PALETTE.black, 90, 26);
    // Near tree line
    this.paintTreeLine(-20, worldWidth, h + 10, 0.6, 0x080b12, 150, 40);
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
      // Deterministic pseudo-variation (no RNG needed for a static backdrop).
      const seed = Math.abs(Math.sin(x * 0.09)) ;
      const treeH = maxHeight * (0.5 + seed * 0.6);
      const treeW = step * 0.7;
      g.fillTriangle(x, baseY, x + treeW / 2, baseY - treeH, x + treeW, baseY);
      g.fillRect(x + treeW / 2 - 3, baseY - treeH * 0.3, 6, treeH * 0.3);
    }
  }

  /** Ground floor + a few platforms to test jump/dash traversal. */
  private buildTerrain(): void {
    this.solids = this.physics.add.staticGroup();
    const tile = 32;

    // Continuous floor across the world.
    const cols = Math.ceil(GAME.worldWidth / tile);
    const floorRows = Math.ceil((GAME.worldHeight - GAME.floorY) / tile) + 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < floorRows; r++) {
        const img = this.solids.create(
          c * tile + tile / 2,
          GAME.floorY + r * tile + tile / 2,
          "ground",
        ) as Phaser.Physics.Arcade.Sprite;
        img.setDepth(-5);
        img.refreshBody();
      }
    }

    // Floating platforms (leftEdgeX, centerY, widthInTiles).
    // Laid out as a climbable staircase: each step is ~50-100px above the
    // previous surface (jump apex ~155px), with gaps small enough to clear
    // on a running jump or dash. First step top is ~106px above the floor.
    const platforms: Array<[number, number, number]> = [
      [420, 540, 8],
      [760, 460, 7],
      [1120, 380, 6],
      [1460, 470, 7],
      [1820, 400, 6],
      [2200, 470, 8],
    ];
    this.platforms = this.physics.add.staticGroup();
    for (const [px, py, wTiles] of platforms) {
      for (let i = 0; i < wTiles; i++) {
        const img = this.platforms.create(
          px + i * tile,
          py,
          "ground",
        ) as Phaser.Physics.Arcade.Sprite;
        img.setDepth(-4);
        img.refreshBody();
      }
    }
  }

  /**
   * One-way collision: the player passes up through a platform from below and
   * lands on its top. Only resolves when the player is descending and was above
   * the platform surface on the previous frame.
   */
  private landOnPlatform = (
    playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    platformObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): boolean => {
    const pb = (playerObj as Phaser.Types.Physics.Arcade.GameObjectWithBody)
      .body as Phaser.Physics.Arcade.Body;
    const tb = (platformObj as Phaser.Types.Physics.Arcade.GameObjectWithBody)
      .body as Phaser.Physics.Arcade.Body;
    const prevBottom = pb.prev.y + pb.height;
    return pb.velocity.y >= 0 && prevBottom <= tb.top + 2;
  };

  /** Fog overlay + subtle vignette for mood. */
  private buildAtmosphere(): void {
    // Foreground fog band near the floor.
    const fog = this.add.rectangle(
      0,
      GAME.floorY - 30,
      GAME.worldWidth,
      120,
      PALETTE.fog,
      0.05,
    )
      .setOrigin(0, 0)
      .setScrollFactor(0.8)
      .setDepth(5);
    this.tweens.add({
      targets: fog,
      alpha: { from: 0.04, to: 0.09 },
      duration: 4000,
      yoyo: true,
      repeat: -1,
    });

    // Screen vignette (fixed to camera).
    const vg = this.add.graphics().setScrollFactor(0).setDepth(100);
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
      .setDepth(101);
    this.add
      .text(16, 40, "A/D 또는 ←/→ 이동  ·  Space 점프  ·  Shift 대시  ·  J 공격", style)
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.85);

    // Health pips.
    this.hpPips = this.add.graphics().setScrollFactor(0).setDepth(101);
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

  update(time: number): void {
    this.player.update(time);
    this.enemies.getChildren().forEach((obj) => (obj as Enemy).update(time));

    this.resolveSwordHits(time);
    this.updateHud();

    if (this.player.isDead && !this.playerDeadHandled) {
      this.playerDeadHandled = true;
      this.cameras.main.flash(300, 120, 0, 0);
      this.time.delayedCall(1100, () => this.scene.restart());
    }
  }

  /** Rectangle-vs-enemy check during the active swing window. */
  private resolveSwordHits(time: number): void {
    if (!this.player.isAttackActive(time)) return;
    const rect = this.player.getAttackRect();
    const swing = this.player.getSwingId();

    this.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (e.isDead || e.lastHitSwing === swing) return;
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, e.getBounds())) {
        e.lastHitSwing = swing;
        e.takeDamage(COMBAT.attackDamage, this.player.x, time);
        this.hitParticles.emitParticleAt(e.x, e.y, 12);
        this.cameras.main.shake(70, 0.005);
      }
    });
  }
}

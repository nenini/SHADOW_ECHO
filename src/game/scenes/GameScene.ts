import Phaser from "phaser";
import { COMBAT, DEPTH, ECHO, GAME, PALETTE, WORLD } from "../config";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Shadow } from "../entities/Shadow";
import { Lever } from "../entities/Lever";
import { Door } from "../entities/Door";
import { ActionRecorder } from "../systems/ActionRecorder";
import { InteractionSystem } from "../systems/InteractionSystem";
import { PlayerProfile, type PlayStyle } from "../systems/PlayerProfile";
import { SUPPORT } from "../config";
import { Mara } from "../entities/Mara";
import { Dialogue } from "../ui/Dialogue";

/** Anything that can land a 2.5D sword hit (Player or Shadow). */
interface MeleeAttacker {
  worldX: number;
  worldY: number;
  isAttackActive(time: number): boolean;
  getSwingId(): number;
  getAttackXRange(): { min: number; max: number };
}

/**
 * Pseudo-2.5D belt-scroll arena. Actors live on a floor plane (worldX, worldY)
 * with a separate virtual jump height; depth is sorted by worldY every frame.
 * Movement, jump (Z), dash, and combat all operate on this model. Story, Shadow
 * and adaptive AI are layered on later.
 */
export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private shadow!: Shadow;
  private recorder!: ActionRecorder;
  private keyEcho!: Phaser.Input.Keyboard.Key;
  private hitParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private hpPips!: Phaser.GameObjects.Graphics;
  private playerDeadHandled = false;

  // --- Echo lever puzzle ---
  private interaction!: InteractionSystem;
  private lever!: Lever;
  private door!: Door;
  private leverPrompt!: Phaser.GameObjects.Text;
  private echoHint!: Phaser.GameObjects.Text;
  private echoHintAt = -1;
  private puzzleComplete = false;

  // --- Second combat + Adaptive Shadow ---
  private profile!: PlayerProfile;
  private secondEnemies: Enemy[] = [];
  private supportTriggered = false;
  private lastPlayerHp = 0;
  private subtitle!: Phaser.GameObjects.Text;

  // --- Closing story sequence ---
  private dialogue!: Dialogue;
  private storyActive = false;
  private storyStarted = false;
  private fadeOverlay!: Phaser.GameObjects.Rectangle;
  private endCard!: Phaser.GameObjects.Text;
  private restartHint!: Phaser.GameObjects.Text;
  private keyRestart!: Phaser.Input.Keyboard.Key;
  private readonly villageTriggerX = 2900;
  private readonly puzzle = {
    leverX: 1300,
    leverY: 520,
    doorX: 1680,
    doorY: 520,
    triggerX: 1760,
    doorOpenMs: 1000,
  };

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.playerDeadHandled = false;
    this.enemies = [];
    this.secondEnemies = [];
    this.echoHintAt = -1;
    this.puzzleComplete = false;
    this.supportTriggered = false;
    this.storyActive = false;
    this.storyStarted = false;
    this.profile = new PlayerProfile();

    this.cameras.main.setBounds(0, 0, GAME.worldWidth, GAME.worldHeight);
    this.cameras.main.setBackgroundColor(PALETTE.black);

    this.buildBackground();
    this.buildFloor();

    this.player = new Player(this, 220, 540);

    this.spawnEnemies();
    this.setupCombat();
    this.setupEcho();
    this.buildPuzzle();

    // Camera follows the logical floor position, so jumping never bounces it.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(180, 240);

    this.shadow.onSupportAct = (style, target) => this.applyShadowSupport(style, target);

    this.buildAtmosphere();
    this.buildVillage();
    this.buildHud();
    this.buildStoryUi();
    this.lastPlayerHp = this.player.hp;
  }

  /** Village entrance backdrop + Mara at the far end of the arena. */
  private buildVillage(): void {
    // A few house silhouettes behind the village entrance.
    const g = this.add.graphics().setDepth(-38).setScrollFactor(0.6);
    g.fillStyle(0x0a0e16, 1);
    const houses: Array<[number, number, number, number]> = [
      [2760, 300, 120, 150],
      [2900, 330, 90, 120],
      [3010, 290, 130, 160],
    ];
    for (const [x, y, w, hh] of houses) {
      g.fillRect(x, y, w, hh);
      g.fillTriangle(x - 6, y, x + w / 2, y - 34, x + w + 6, y);
    }
    new Mara(this, 3010, 545);
  }

  private buildStoryUi(): void {
    this.dialogue = new Dialogue(this, DEPTH.dialogue);

    this.fadeOverlay = this.add
      .rectangle(0, 0, GAME.width, GAME.height, PALETTE.black, 1)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.overlay)
      .setAlpha(0)
      .setVisible(false);

    this.endCard = this.add
      .text(GAME.width / 2, GAME.height / 2, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#f2efe4",
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.endCard)
      .setVisible(false);

    this.restartHint = this.add
      .text(GAME.width / 2, GAME.height - 40, "R  다시 시작", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#8a95a5",
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.endCard)
      .setVisible(false);

    this.keyRestart = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
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
    // First combat (before the puzzle).
    const first: Array<[number, number]> = [
      [700, 470],
      [1000, 560],
    ];
    // Second combat (past the gate ~1760). The Adaptive Shadow assists here.
    const second: Array<[number, number]> = [
      [2150, 480],
      [2350, 560],
      [2550, 500],
    ];
    for (const [x, y] of first) this.enemies.push(new Enemy(this, x, y));
    for (const [x, y] of second) {
      const e = new Enemy(this, x, y);
      this.enemies.push(e);
      this.secondEnemies.push(e);
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

    this.player.onAttackStart = (facing) =>
      this.spawnSlash(facing, this.player.worldX, this.player.worldY - this.player.jumpZ - 6, false);
  }

  /** 잔영 recording + Shadow replay (triggered by Q). */
  private setupEcho(): void {
    this.recorder = new ActionRecorder(ECHO.maxFrames);
    this.shadow = new Shadow(this);
    this.shadow.onAttackStart = (facing, x, y, jumpZ) =>
      this.spawnSlash(facing, x, y - jumpZ - 6, true);
    this.shadow.onInteract = (x, y) => this.onActorInteract(x, y, true);
    this.keyEcho = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  }

  /** Build the Echo lever + door puzzle. */
  private buildPuzzle(): void {
    this.interaction = new InteractionSystem();

    this.lever = new Lever(this, this.puzzle.leverX, this.puzzle.leverY);
    this.lever.onActivate = () => this.door.open(this.time.now, this.puzzle.doorOpenMs);
    this.interaction.register(this.lever);

    this.door = new Door(this, this.puzzle.doorX, this.puzzle.doorY);

    // Prompt hovering over the lever.
    this.leverPrompt = this.add
      .text(this.puzzle.leverX, this.puzzle.leverY - 78, "[E] 레버 작동", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#e8c976",
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.vfx)
      .setVisible(false);

    // Failure -> echo hint (screen-fixed, dark fairy-tale tone).
    this.echoHint = this.add
      .text(GAME.width / 2, GAME.height - 96, "", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#d8dce6",
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.9)
      .setVisible(false);
  }

  /** Route an interact from either the Player or a replaying Shadow. */
  private onActorInteract(x: number, y: number, isShadow: boolean): void {
    const target = this.interaction.interactAt(x, y);
    if (!target) return;
    this.spawnPulse(target.worldX, target.worldY);
    if (target === this.lever && !isShadow && !this.puzzleComplete) {
      // Reveal the echo hint the first time the player pulls the lever solo.
      if (this.echoHintAt < 0) this.echoHintAt = this.time.now;
    }
  }

  /** Soft pulse ring when a lever is interacted with. */
  private spawnPulse(x: number, y: number): void {
    const ring = this.add
      .circle(x, y - 20, 8, PALETTE.echoGold, 0.5)
      .setDepth(DEPTH.vfx)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      scale: { from: 0.6, to: 2.6 },
      alpha: { from: 0.5, to: 0 },
      duration: 360,
      onComplete: () => ring.destroy(),
    });
  }

  private spawnSlash(facing: -1 | 1, x: number, y: number, echo: boolean): void {
    const slash = this.add
      .image(x + facing * 22, y, "slash")
      .setDepth(DEPTH.vfx)
      .setFlipX(facing === -1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(echo ? PALETTE.echoGold : 0xffffff)
      .setScale(0.9);
    this.tweens.add({
      targets: slash,
      alpha: { from: echo ? 0.8 : 0.95, to: 0 },
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
      .text(16, 40, "A/D·←/→ 좌우 · W/S·↑/↓ 앞뒤 · Space 점프 · Shift 대시 · J 공격 · E 상호작용 · Q 잔영", style)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setAlpha(0.85);

    this.hpPips = this.add.graphics().setScrollFactor(0).setDepth(DEPTH.hud);
    this.updateHud();

    // Subtitle for the Shadow's line (dark fairy-tale tone, no dialogue box).
    this.subtitle = this.add
      .text(GAME.width / 2, GAME.height - 130, "", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#f2efe4",
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.hud)
      .setVisible(false);
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
    // Closing story: trigger at the village, then freeze gameplay for the beat.
    if (!this.storyStarted && this.player.worldX > this.villageTriggerX) {
      this.startStory();
    }
    if (this.storyActive) {
      this.dialogue.update();
      if (this.restartHint.visible && Phaser.Input.Keyboard.JustDown(this.keyRestart)) {
        this.scene.restart();
      }
      return;
    }

    this.player.update(time, delta);

    // Record this frame of player action for the Shadow.
    const s = this.player.getState();
    this.recorder.record({
      worldX: s.worldX,
      worldY: s.worldY,
      jumpZ: s.jumpZ,
      facing: s.facing,
      isDashing: s.isDashing,
      attackActive: s.attackActive,
      swingId: s.swingId,
      interact: s.interact,
    });

    // Player interact goes through the same path the Shadow will replay.
    if (s.interact) this.onActorInteract(this.player.worldX, this.player.worldY, false);

    // --- PlayerProfile metrics (real play log) ---
    const inp = this.player.inputState;
    if (inp.attack) this.profile.attackCount++;
    if (inp.dash) this.profile.dashCount++;
    if (inp.jump) this.profile.jumpCount++;
    if (this.player.hp < this.lastPlayerHp) {
      this.profile.damageTaken += this.lastPlayerHp - this.player.hp;
    }
    this.lastPlayerHp = this.player.hp;
    let nearest = Infinity;
    for (const e of this.enemies) {
      if (e.isDead) continue;
      const d = Math.hypot(e.worldX - this.player.worldX, e.worldY - this.player.worldY);
      if (d < nearest) nearest = d;
    }
    if (nearest < Infinity) this.profile.sampleEnemyDistance(nearest);

    // Q replays the last ~3s as an Echo Shadow (ignored while one is playing).
    if (
      Phaser.Input.Keyboard.JustDown(this.keyEcho) &&
      !this.shadow.isReplaying &&
      !this.player.isDead &&
      this.recorder.length > 0
    ) {
      this.shadow.startReplay(this.recorder.snapshot());
      this.profile.echoUseCount++;
    }
    this.shadow.update(time, delta);

    // Drop destroyed enemies, then update the survivors.
    this.enemies = this.enemies.filter((e) => e.active);
    for (const e of this.enemies) e.update(time, delta, this.player);

    // Both the player and the replaying Shadow can land sword hits.
    this.applyAttack(this.player, "player", time);
    if (this.shadow.isReplaying) this.applyAttack(this.shadow, "shadow", time);

    // Adaptive Shadow: independent support at the end of the second combat.
    this.updateAdaptiveShadow(time);

    // Door lifecycle + player blocking + puzzle completion + hints.
    this.door.update(time);
    this.door.collide(this.player);
    this.updatePuzzle(time);

    this.updateHud();

    if (this.player.isDead && !this.playerDeadHandled) {
      this.playerDeadHandled = true;
      this.cameras.main.flash(300, 120, 0, 0);
      this.time.delayedCall(1100, () => this.scene.restart());
    }
  }

  /**
   * Sword hit test in 2.5D: the target must be within the attacker's forward X
   * reach AND within a shallow worldY depth band AND not too high in the air.
   * `key` namespaces per-swing dedupe so player and shadow hits don't clash.
   */
  private applyAttack(attacker: MeleeAttacker, key: string, time: number): void {
    if (!attacker.isAttackActive(time)) return;
    const xr = attacker.getAttackXRange();
    const swing = attacker.getSwingId();
    const enemyHalfWidth = 12;

    for (const e of this.enemies) {
      if (e.isDead || e.lastHitSwing[key] === swing) continue;
      if (Math.abs(attacker.worldY - e.worldY) > COMBAT.attackDepthTolerance) continue;
      if (e.jumpZ > COMBAT.attackMaxTargetZ) continue;
      const overlapsX = e.worldX + enemyHalfWidth >= xr.min && e.worldX - enemyHalfWidth <= xr.max;
      if (!overlapsX) continue;

      e.lastHitSwing[key] = swing;
      e.takeDamage(COMBAT.attackDamage, attacker.worldX, attacker.worldY, time);
      this.hitParticles.emitParticleAt(e.worldX, e.worldY - e.jumpZ - 8, 12);
      this.cameras.main.shake(70, 0.005);
    }
  }

  /**
   * When the second combat is down to its last enemy, the Shadow performs ONE
   * independent support action chosen by the PlayerProfile classification.
   */
  private updateAdaptiveShadow(_time: number): void {
    if (this.supportTriggered || !this.puzzleComplete) return;
    if (this.shadow.isReplaying) return; // don't interrupt a replay
    const alive = this.secondEnemies.filter((e) => e.active && !e.isDead);
    if (alive.length !== 1) return;

    const target = alive[0];
    const style = this.profile.classify();
    this.supportTriggered = true;
    const fromX = this.player.worldX - this.player.facingDir * 36;
    this.shadow.startSupport(style, target, fromX, this.player.worldY);
  }

  /** Apply the Shadow's chosen support effect + speak its line. */
  private applyShadowSupport(style: PlayStyle, target: Enemy | null): void {
    const now = this.time.now;
    if (style === "AGGRESSIVE") {
      // Stun the enemy: create an entry opening for the player.
      if (target) {
        target.stagger(now, SUPPORT.staggerMs);
        this.spawnSlash(1, target.worldX, target.worldY - 8, true);
        this.hitParticles.emitParticleAt(target.worldX, target.worldY - 8, 14);
      }
      this.cameras.main.shake(120, 0.006);
    } else {
      // Draw the enemy's attention: create an attack chance for the player.
      if (target) target.distractTo(this.shadow.worldX, this.shadow.worldY, now, SUPPORT.tauntMs);
      this.spawnPulse(this.shadow.worldX, this.shadow.worldY);
    }
    this.showShadowLine();
  }

  /** The Shadow's first words, as staged subtitles (this beat only). */
  private showShadowLine(): void {
    const s = this.subtitle;
    s.setVisible(true).setText("그림자:  이렇게 할 거였잖아.");
    this.time.delayedCall(2200, () => s.setText("하린:  너…"));
    this.time.delayedCall(3400, () => s.setText("그림자:  틀렸어?"));
    this.time.delayedCall(5200, () => s.setVisible(false));
  }

  /** Begin the closing story beat at the village entrance. */
  private startStory(): void {
    this.storyStarted = true;
    this.storyActive = true;
    this.subtitle.setVisible(false);
    this.dialogue.start(
      [
        { speaker: "마라", text: "...그 아이가 아직 널 따라다니는구나." },
        { speaker: "하린", text: "이걸 알아요?" },
        { speaker: "마라", text: "네 그림자는 아니란다." },
        { speaker: "하린", text: "그럼... 누구죠?" },
        { speaker: "마라", text: "성당에 가지 마. 그곳에 가면 네가 원하는 답은 없을 거야." },
      ],
      () => this.beginEnding(),
    );
  }

  /** Fade to black, then the ending cards. */
  private beginEnding(): void {
    this.fadeOverlay.setVisible(true);
    this.tweens.add({
      targets: this.fadeOverlay,
      alpha: { from: 0, to: 1 },
      duration: 1500,
      onComplete: () => {
        this.endCard.setVisible(true).setText("잔영 보존 실험 37차\n— 대상 HARIN");
        this.time.delayedCall(2800, () => {
          this.endCard.setText("TO BE CONTINUED");
          this.restartHint.setVisible(true);
        });
      },
    });
  }

  /** Lever prompt, echo hint state machine, and puzzle completion. */
  private updatePuzzle(time: number): void {
    // Completion: player reaches the far side of the gate.
    if (!this.puzzleComplete && this.player.worldX > this.puzzle.triggerX) {
      this.puzzleComplete = true;
      this.door.lockOpen(time);
      this.leverPrompt.setVisible(false);
      this.echoHint.setVisible(false);
    }

    if (this.puzzleComplete) return;

    // Lever prompt shows only when the player stands in interaction range.
    const inRange =
      Math.abs(this.player.worldX - this.lever.worldX) <= this.lever.interactionRangeX &&
      Math.abs(this.player.worldY - this.lever.worldY) <= this.lever.interactionRangeY;
    this.leverPrompt.setVisible(inRange);

    // After the first solo lever pull, surface the echo hint (two beats).
    if (this.echoHintAt >= 0) {
      this.echoHint.setVisible(true);
      const elapsed = time - this.echoHintAt;
      this.echoHint.setText(
        elapsed > 1400
          ? "방금 한 행동은 아직 남아 있다.\n\n[Q] 잔영 재현"
          : "방금 한 행동은 아직 남아 있다.",
      );
    }
  }
}

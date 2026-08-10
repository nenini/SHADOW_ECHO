/**
 * A single recorded frame of player action, in Pseudo-2.5D space. This is the
 * unit the Shadow replays; it carries everything needed to reproduce position,
 * height, facing and attacks. (Adaptive behaviour is a later step; this only
 * records and replays.)
 */
export interface ActionFrame {
  worldX: number;
  worldY: number;
  jumpZ: number;
  facing: -1 | 1;
  isDashing: boolean;
  /** True on the damaging frames of a swing. */
  attackActive: boolean;
  /** Player swing id at this frame (a change marks a new swing). */
  swingId: number;
  /** True only on the single frame an interact (E) was pressed. */
  interact: boolean;
}

/**
 * Rolling ring buffer of the most recent player action frames. GameScene pushes
 * one frame per update; the Shadow takes a snapshot to replay on demand.
 */
export class ActionRecorder {
  private frames: ActionFrame[] = [];

  constructor(private readonly maxFrames: number) {}

  record(frame: ActionFrame): void {
    this.frames.push(frame);
    if (this.frames.length > this.maxFrames) this.frames.shift();
  }

  /** Independent copy of the buffered frames (oldest -> newest). */
  snapshot(): ActionFrame[] {
    return this.frames.map((f) => ({ ...f }));
  }

  get length(): number {
    return this.frames.length;
  }

  clear(): void {
    this.frames.length = 0;
  }
}

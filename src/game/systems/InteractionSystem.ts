/**
 * A world object an actor can interact with (lever, door, later NPCs/objects).
 * Range is checked on the logical floor plane (worldX/worldY), not screen pixels,
 * so actors at a very different depth cannot reach it.
 */
export interface Interactable {
  worldX: number;
  worldY: number;
  interactionRangeX: number;
  interactionRangeY: number;
  interact(): void;
}

/**
 * Routes interact events from any actor (Player OR replaying Shadow) to the
 * nearest in-range Interactable. Both go through this same path, so a Shadow
 * pulling a lever is the real system firing — not a scripted event.
 */
export class InteractionSystem {
  private readonly items: Interactable[] = [];

  register(item: Interactable): void {
    this.items.push(item);
  }

  /** Nearest in-range interactable to (x, y), or null. */
  nearest(x: number, y: number): Interactable | null {
    let best: Interactable | null = null;
    let bestDist = Infinity;
    for (const it of this.items) {
      if (
        Math.abs(x - it.worldX) <= it.interactionRangeX &&
        Math.abs(y - it.worldY) <= it.interactionRangeY
      ) {
        const d = Math.abs(x - it.worldX) + Math.abs(y - it.worldY);
        if (d < bestDist) {
          bestDist = d;
          best = it;
        }
      }
    }
    return best;
  }

  /** Fire interact on the nearest in-range interactable; returns it or null. */
  interactAt(x: number, y: number): Interactable | null {
    const target = this.nearest(x, y);
    if (target) target.interact();
    return target;
  }
}

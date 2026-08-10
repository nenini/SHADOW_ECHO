import { PROFILE } from "../config";

export type PlayStyle = "AGGRESSIVE" | "CAUTIOUS";

/**
 * Collects real play metrics and classifies the player's style. This drives the
 * Shadow's independent support action in the second combat — the branch is a
 * function of actual logged behaviour, not a fixed script.
 *
 * Metrics: attackCount, dashCount, jumpCount, damageTaken, echoUseCount,
 * averageEnemyDistance.
 */
export class PlayerProfile {
  attackCount = 0;
  dashCount = 0;
  jumpCount = 0;
  damageTaken = 0;
  echoUseCount = 0;

  private distanceSum = 0;
  private distanceSamples = 0;

  /** Call once per frame with the distance to the nearest living enemy (if any). */
  sampleEnemyDistance(distance: number): void {
    this.distanceSum += distance;
    this.distanceSamples += 1;
  }

  averageEnemyDistance(): number {
    return this.distanceSamples > 0 ? this.distanceSum / this.distanceSamples : Infinity;
  }

  /**
   * AGGRESSIVE: fights up close and attacks often.
   * CAUTIOUS: keeps distance and takes little damage.
   * Distance is the primary signal; the average-distance check breaks ties.
   */
  classify(): PlayStyle {
    const avg = this.averageEnemyDistance();
    if (avg <= PROFILE.distThreshold && this.attackCount >= PROFILE.attackThreshold) {
      return "AGGRESSIVE";
    }
    if (avg > PROFILE.distThreshold && this.damageTaken <= PROFILE.damageThreshold) {
      return "CAUTIOUS";
    }
    return avg <= PROFILE.distThreshold ? "AGGRESSIVE" : "CAUTIOUS";
  }

  /** Snapshot for logging / the completion report. */
  snapshot(): Record<string, number | string> {
    return {
      attackCount: this.attackCount,
      dashCount: this.dashCount,
      jumpCount: this.jumpCount,
      damageTaken: this.damageTaken,
      echoUseCount: this.echoUseCount,
      averageEnemyDistance: Math.round(this.averageEnemyDistance()),
      style: this.classify(),
    };
  }
}

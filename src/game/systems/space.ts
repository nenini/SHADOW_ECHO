import Phaser from "phaser";
import { DEPTH, PERSPECTIVE, WORLD } from "../config";

/**
 * Shared Pseudo-2.5D space helpers, reused by Player, Enemy and (later) Shadow
 * so every actor obeys the same depth ordering and perspective scaling.
 */

/** Clamp a worldY to the walkable depth band. */
export function clampWorldY(worldY: number): number {
  return Phaser.Math.Clamp(worldY, WORLD.yMin, WORLD.yMax);
}

/** Clamp a worldX to the belt length. */
export function clampWorldX(worldX: number): number {
  return Phaser.Math.Clamp(worldX, WORLD.xMin, WORLD.xMax);
}

/** 0 at the back edge (yMin), 1 at the front edge (yMax). */
export function depthT(worldY: number): number {
  return Phaser.Math.Clamp(
    (worldY - WORLD.yMin) / (WORLD.yMax - WORLD.yMin),
    0,
    1,
  );
}

/** Slightly larger toward the front of the plane. */
export function perspectiveScale(worldY: number): number {
  return Phaser.Math.Linear(
    PERSPECTIVE.scaleFar,
    PERSPECTIVE.scaleNear,
    depthT(worldY),
  );
}

/**
 * Render order by floor position only (never jumpZ) so jumping never flips an
 * actor in front of / behind another.
 */
export function actorDepth(worldY: number): number {
  return DEPTH.actorBase + worldY;
}

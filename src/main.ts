import Phaser from "phaser";
import { createGameConfig } from "./game/config";
import "./styles/main.css";

// Bootstrap the Phaser game into #game-root.
const PARENT_ID = "game-root";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const game = new Phaser.Game(createGameConfig(PARENT_ID));

// Expose for quick debugging in the browser console (dev convenience only).
declare global {
  interface Window {
    __SHADOW_ECHO__?: Phaser.Game;
  }
}
window.__SHADOW_ECHO__ = game;

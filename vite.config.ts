import { defineConfig } from "vite";

// GitHub Pages project site serves from https://<user>.github.io/<repo>/
// so the production base path must match the repository name.
// Override with the VITE_BASE env var if the repo is renamed.
const repoName = "SHADOW_ECHO";

export default defineConfig(({ command }) => ({
  base: command === "build" ? process.env.VITE_BASE ?? `/${repoName}/` : "/",
  build: {
    target: "es2020",
    outDir: "dist",
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
    open: true,
  },
}));

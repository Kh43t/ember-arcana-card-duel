// main.ts — Ember Arcana's hand-in program (Node 22, standard library only).
//
// It hands the game to make.fun: copy this repository's game/ and screenshots/
// beside this file into the output directory, then write dossier.json there
// with buildDossier from the vendored make.fun library. The grader runs this
// program twice in a sandbox with no network; both runs must write the same
// bytes, so nothing here depends on time, randomness or the environment except
// MAKEFUN_OUTPUT_DIR, which stands in for /output outside the grader.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, so this program refuses exactly where the scorer would:
// at most 4 screenshots of 256 KiB, at most 993 game entries / 48 MiB, paths
// within 1000 bytes, dossier text within 160 KiB.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function freshOutputDir(dir: string): void {
  // Clear only the directory's contents, never the directory itself: in the
  // grader the output directory is a mounted volume, and removing the mount
  // point itself fails (its parent is not writable by the runner), which
  // made the whole run exit 1 before anything was written.
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    rmSync(join(dir, entry.name), { recursive: true, force: true });
  }
}

function handInGame(): void {
  freshOutputDir(OUTPUT_DIR);
  cpSync(join(REPO_ROOT, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });
  const shots = join(REPO_ROOT, 'screenshots');
  if (existsSync(shots)) {
    cpSync(shots, join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
}

handInGame();

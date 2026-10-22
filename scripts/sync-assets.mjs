#!/usr/bin/env node
/**
 * Refresh the HAXcms runtime assets this repo ships from haxtheweb/haxcms-nodejs,
 * the current source of truth for the unbundled web component build and the
 * site boilerplate.
 *
 *   npm run sync-assets                      shallow-clone haxcms-nodejs main and sync
 *   npm run sync-assets -- --from <dir>      sync from an existing haxcms-nodejs checkout
 *   npm run sync-assets -- --locales all     also refresh every translation file
 *   npm run sync-assets -- --dry-run         report what would change, write nothing
 *
 * What is synced (target <- source, relative to the haxcms-nodejs repo):
 *   app/build/                 <- src/public/build/   (mirrored; locales kept as-is by default)
 *   app/wc-registry.json       <- src/public/wc-registry.json
 *   app/wc-registry-graph.json <- src/public/wc-registry-graph.json
 *   app/build.js               <- src/public/build.js
 *   app/build-haxcms.js        <- src/public/build-haxcms.js
 *   app/.well-known/agent-skills/ <- src/boilerplate/site/.well-known/agent-skills/
 *     (only the static skills; api-catalog and security.txt describe a running
 *     HAXcms server and are templates, so a static site does not ship them)
 *
 * Locales: haxcms-nodejs ships a translation file per element per language
 * (tens of thousands of files). A static site only needs them for non-English
 * readers, so by default the locale files already in app/build are left alone
 * and new ones are not added. Pass --locales all to mirror them too.
 *
 * Writes app/assets-source.json recording which commit the assets came from.
 */
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UPSTREAM = "https://github.com/haxtheweb/haxcms-nodejs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "app");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1];
};
const dryRun = flag("dry-run");
const localesMode = option("locales") || "keep";
if (!["keep", "all"].includes(localesMode)) {
  console.error('--locales must be "keep" or "all"');
  process.exit(1);
}

const git = (cwd, ...gitArgs) =>
  spawnSync("git", gitArgs, { cwd, encoding: "utf8" });

function resolveSource() {
  const from = option("from");
  if (from) {
    const dir = path.resolve(from);
    if (!existsSync(path.join(dir, "src", "public", "build"))) {
      console.error(`${dir} does not look like a haxcms-nodejs checkout (no src/public/build)`);
      process.exit(1);
    }
    return { dir, cleanup: () => {} };
  }
  const dir = mkdtempSync(path.join(os.tmpdir(), "hax11ty-assets-"));
  console.log(`Cloning ${UPSTREAM} (shallow, sparse) ...`);
  const steps = [
    ["clone", "--depth", "1", "--filter=blob:none", "--sparse", UPSTREAM, dir],
  ];
  for (const step of steps) {
    const r = git(root, ...step);
    if (r.status !== 0) {
      console.error(r.stderr);
      process.exit(1);
    }
  }
  const sparse = git(dir, "sparse-checkout", "set", "src/public", "src/boilerplate/site/.well-known/agent-skills");
  if (sparse.status !== 0) {
    console.error(sparse.stderr);
    process.exit(1);
  }
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const isLocale = (rel) => rel.split(path.sep).includes("locales");

function listFiles(dir, base = dir, out = []) {
  if (!existsSync(dir)) {
    return out;
  }
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      listFiles(full, base, out);
    } else if (stat.isFile()) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

const stats = { added: 0, updated: 0, removed: 0, same: 0 };

function copyIfChanged(src, dest) {
  const existed = existsSync(dest);
  if (existed && readFileSync(src).equals(readFileSync(dest))) {
    stats.same += 1;
    return;
  }
  stats[existed ? "updated" : "added"] += 1;
  if (!dryRun) {
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

/**
 * Mirror srcDir into destDir. Files in destDir that the source no longer has
 * are removed, except locale files unless --locales all.
 */
function mirror(srcDir, destDir, { skipLocales }) {
  const wanted = new Set();
  for (const rel of listFiles(srcDir)) {
    if (skipLocales && isLocale(rel)) {
      continue;
    }
    wanted.add(rel);
    copyIfChanged(path.join(srcDir, rel), path.join(destDir, rel));
  }
  for (const rel of listFiles(destDir)) {
    if (wanted.has(rel) || (skipLocales && isLocale(rel))) {
      continue;
    }
    stats.removed += 1;
    if (!dryRun) {
      rmSync(path.join(destDir, rel));
    }
  }
}

const source = resolveSource();
try {
  const pub = path.join(source.dir, "src", "public");
  mirror(path.join(pub, "build"), path.join(app, "build"), {
    skipLocales: localesMode === "keep",
  });
  for (const file of [
    "wc-registry.json",
    "wc-registry-graph.json",
    "build.js",
    "build-haxcms.js",
  ]) {
    if (existsSync(path.join(pub, file))) {
      copyIfChanged(path.join(pub, file), path.join(app, file));
    }
  }
  const skills = path.join(
    source.dir,
    "src",
    "boilerplate",
    "site",
    ".well-known",
    "agent-skills",
  );
  if (existsSync(skills)) {
    mirror(skills, path.join(app, ".well-known", "agent-skills"), {
      skipLocales: false,
    });
  }
  const commit = git(source.dir, "rev-parse", "HEAD").stdout.trim();
  const provenance = {
    source: UPSTREAM,
    commit: commit || null,
    locales: localesMode,
  };
  if (!dryRun) {
    writeFileSync(
      path.join(app, "assets-source.json"),
      JSON.stringify(provenance, null, 2) + "\n",
    );
  }
  console.log(
    `${dryRun ? "[dry run] " : ""}added ${stats.added}, updated ${stats.updated}, removed ${stats.removed}, unchanged ${stats.same}` +
      (commit ? ` (from ${UPSTREAM} @ ${commit.slice(0, 7)})` : ""),
  );
} finally {
  source.cleanup();
}

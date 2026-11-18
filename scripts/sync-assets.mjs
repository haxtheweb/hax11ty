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
 *   npm run sync-assets -- --report-decisions <file>
 *                                            sync anyway and list the decisions
 *                                            it needs in <file> (the weekly job)
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
 *   app/_haxcms/site/<file>    <- src/boilerplate/site/<file>, for each file in
 *     app/lib/managed.js MANAGED_FILES: the HAXcms managed-file templates
 *     (robots.txt, manifest.json, service-worker.js, ...). The build renders
 *     these exact files, so a site from hax11ty matches one from HAXcms.
 *   app/assets/<file>          <- src/boilerplate/site/assets/<file>, only for
 *     boilerplate icons the site does not have yet (a site's own icons win)
 *   scripts/ssr/<file>.mjs     <- src/lib/ssr/<file>.mjs, the SSR kit, each with
 *     a header naming the commit it came from (index.mjs is not copied; the
 *     worker imports the modules directly)
 *
 * Decisions it will not make: haxcms-nodejs lists the files it manages in
 * getManagedTemplateFiles() (src/lib/HAXCMS.js). Each must be rendered,
 * copied or skipped on purpose in app/lib/managed.js. When upstream adds one
 * hax11ty has no answer for, or drops one hax11ty still ships, this exits
 * with an error and writes nothing.
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
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const UPSTREAM = "https://github.com/haxtheweb/haxcms-nodejs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "app");
const { MANAGED_FILES, COPIED_MANAGED_FILES, SKIPPED_MANAGED_FILES } =
  createRequire(import.meta.url)(path.join(app, "lib", "managed.js"));

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
  const sparse = git(
    dir,
    "sparse-checkout",
    "set",
    "--no-cone",
    "/src/public/",
    "/src/boilerplate/site/.well-known/agent-skills/",
    "/src/boilerplate/site/assets/",
    "/src/lib/ssr/",
    "/src/lib/HAXCMS.js",
    ...MANAGED_FILES.map((file) => `/src/boilerplate/site/${file}`),
  );
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

/**
 * Paths haxcms-nodejs manages: getManagedTemplateFiles() plus what
 * rebuildManagedFiles() adds (index.php, config.php).
 */
function upstreamManagedFiles(sourceDir) {
  const file = path.join(sourceDir, "src", "lib", "HAXCMS.js");
  if (!existsSync(file)) {
    return null;
  }
  const code = readFileSync(file, "utf8");
  const start = code.indexOf("getManagedTemplateFiles() {");
  const end = start === -1 ? -1 : code.indexOf("};", start);
  if (end === -1) {
    return null;
  }
  const paths = new Set();
  for (const match of code.slice(start, end).matchAll(/:\s*"([^"]+)"/g)) {
    paths.add(match[1]);
  }
  const rebuild = code.indexOf("rebuildManagedFiles() {");
  if (rebuild !== -1) {
    const body = code.slice(rebuild, rebuild + 2000);
    for (const match of body.matchAll(/templates\["\w+"\]\s*=\s*"([^"]+)"/g)) {
      paths.add(match[1]);
    }
  }
  return paths;
}

function checkManagedDecisions(sourceDir) {
  const upstream = upstreamManagedFiles(sourceDir);
  if (!upstream || upstream.size === 0) {
    return ["could not read getManagedTemplateFiles() from src/lib/HAXCMS.js"];
  }
  const decided = new Set([
    ...MANAGED_FILES,
    ...COPIED_MANAGED_FILES,
    ...Object.keys(SKIPPED_MANAGED_FILES),
  ]);
  const problems = [];
  for (const file of upstream) {
    if (!decided.has(file)) {
      problems.push(`haxcms-nodejs now manages ${file}; render, copy or skip it in app/lib/managed.js`);
    }
  }
  for (const file of decided) {
    if (!upstream.has(file)) {
      problems.push(`haxcms-nodejs no longer manages ${file}; drop it from app/lib/managed.js`);
    }
  }
  return problems;
}

const KIT_HEADER = (commit, file) =>
  [
    "// Vendored, unmodified apart from this header, from",
    `// https://github.com/haxtheweb/haxcms-nodejs/blob/${commit}/src/lib/ssr/${file}`,
    "// (Apache-2.0, same as this repository). The kit is not in a published",
    "// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files",
    "// and import it from the package instead.",
    "",
  ].join("\n");

/**
 * Copy the SSR kit. A file whose upstream body is unchanged keeps its header,
 * so a sync only touches the kit when the kit changed.
 */
function syncKit(sourceDir, commit) {
  const kit = path.join(sourceDir, "src", "lib", "ssr");
  if (!existsSync(kit)) {
    return;
  }
  for (const name of readdirSync(kit)) {
    if (!name.endsWith(".mjs") || name === "index.mjs") {
      continue;
    }
    const body = readFileSync(path.join(kit, name), "utf8");
    const dest = path.join(root, "scripts", "ssr", name);
    if (existsSync(dest)) {
      const current = readFileSync(dest, "utf8");
      if (current.endsWith(body) && current.startsWith("// Vendored, unmodified")) {
        stats.same += 1;
        continue;
      }
    }
    stats[existsSync(dest) ? "updated" : "added"] += 1;
    if (!dryRun) {
      writeFileSync(dest, KIT_HEADER(commit, name) + body);
    }
  }
}

const source = resolveSource();
try {
  const problems = checkManagedDecisions(source.dir);
  const reportFile = option("report-decisions");
  if (reportFile && !dryRun) {
    writeFileSync(reportFile, problems.map((problem) => `- ${problem}\n`).join(""));
  }
  if (problems.length && reportFile) {
    console.warn(`sync-assets: ${problems.length} decision(s) needed, listed in ${reportFile}`);
  } else if (problems.length) {
    console.error("sync-assets needs a decision before it can sync:");
    for (const problem of problems) {
      console.error(`  - ${problem}`);
    }
    source.cleanup();
    process.exit(1);
  }
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
  const boilerplate = path.join(source.dir, "src", "boilerplate", "site");
  for (const file of MANAGED_FILES) {
    const from = path.join(boilerplate, file);
    if (!existsSync(from)) {
      console.error(`haxcms-nodejs has no boilerplate ${file}; update MANAGED_FILES`);
      process.exit(1);
    }
    copyIfChanged(from, path.join(app, "_haxcms", "site", file));
  }
  const icons = path.join(boilerplate, "assets");
  for (const name of existsSync(icons) ? readdirSync(icons) : []) {
    if (/^(icon-\d+x\d+\.png|upgrade-browser\.html)$/.test(name)) {
      const dest = path.join(app, "assets", name);
      if (name === "upgrade-browser.html" || !existsSync(dest)) {
        copyIfChanged(path.join(icons, name), dest);
      }
    }
  }
  const commit = git(source.dir, "rev-parse", "HEAD").stdout.trim();
  syncKit(source.dir, commit || "main");
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

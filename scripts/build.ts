#!/usr/bin/env bun
/**
 * Build script for creating platform-specific binaries
 * Usage: bun run scripts/build.ts [--target <target>]
 * 
 * Targets: darwin-arm64, darwin-x64, linux-x64, linux-arm64
 * If no target specified, builds for current platform
 */

import { $ } from "bun";
import { parseArgs } from "util";

const TARGETS = [
  "bun-darwin-arm64",
  "bun-darwin-x64", 
  "bun-linux-x64",
  "bun-linux-arm64",
] as const;

type Target = typeof TARGETS[number];

const TARGET_NAMES: Record<Target, string> = {
  "bun-darwin-arm64": "bullmq-tui-darwin-arm64",
  "bun-darwin-x64": "bullmq-tui-darwin-x64",
  "bun-linux-x64": "bullmq-tui-linux-x64",
  "bun-linux-arm64": "bullmq-tui-linux-arm64",
};

async function build(target?: Target) {
  const outDir = "./dist";
  
  // Ensure dist directory exists
  await $`mkdir -p ${outDir}`;

  if (target) {
    // Build for specific target
    const outName = TARGET_NAMES[target];
    console.log(`Building for ${target}...`);
    await $`bun build ./src/index.tsx --compile --target=${target} --outfile=${outDir}/${outName}`;
    console.log(`Built: ${outDir}/${outName}`);
  } else {
    // Build for all targets
    for (const t of TARGETS) {
      const outName = TARGET_NAMES[t];
      console.log(`Building for ${t}...`);
      try {
        await $`bun build ./src/index.tsx --compile --target=${t} --outfile=${outDir}/${outName}`;
        console.log(`Built: ${outDir}/${outName}`);
      } catch (err) {
        console.error(`Failed to build for ${t}:`, err);
      }
    }
  }

  console.log("\nBuild complete!");
}

// Parse args
const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    target: { type: "string", short: "t" },
    all: { type: "boolean", short: "a" },
  },
});

if (values.all) {
  await build();
} else if (values.target) {
  if (!TARGETS.includes(values.target as Target)) {
    console.error(`Invalid target: ${values.target}`);
    console.error(`Valid targets: ${TARGETS.join(", ")}`);
    process.exit(1);
  }
  await build(values.target as Target);
} else {
  // Build for current platform only
  const platform = process.platform === "darwin" ? "darwin" : "linux";
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  const currentTarget = `bun-${platform}-${arch}` as Target;
  await build(currentTarget);
}

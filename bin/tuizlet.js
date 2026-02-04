#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");

const platform = process.platform;
const arch = process.arch;

const binaryMap = {
  "darwin-arm64": "tuizlet-darwin-arm64",
  "darwin-x64": "tuizlet-darwin-x64",
  "linux-arm64": "tuizlet-linux-arm64",
  "linux-x64": "tuizlet-linux-x64",
};

const key = `${platform}-${arch}`;
const binaryName = binaryMap[key];

if (!binaryName) {
  console.error(`Unsupported platform: ${platform}-${arch}`);
  console.error(`Supported platforms: ${Object.keys(binaryMap).join(", ")}`);
  process.exit(1);
}

const binaryPath = join(distDir, binaryName);

if (!existsSync(binaryPath)) {
  console.error(`Binary not found: ${binaryPath}`);
  console.error(`Please reinstall the package or report this issue.`);
  process.exit(1);
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
});

child.on("error", (err) => {
  console.error(`Failed to start tuizlet: ${err.message}`);
  process.exit(1);
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

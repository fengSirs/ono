#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const templates = {
  local: "miniapp/config.local.example.js",
  prod: "miniapp/config.production.example.js",
  production: "miniapp/config.production.example.js",
};

const target = process.argv[2];
const source = templates[target];

if (!source) {
  console.error("用法: node scripts/use-config.mjs <local|prod>");
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), source);
const targetPath = resolve(process.cwd(), "miniapp/config.js");

if (!existsSync(sourcePath)) {
  console.error(`模板不存在: ${source}`);
  process.exit(1);
}

copyFileSync(sourcePath, targetPath);
console.log(`已生成 miniapp/config.js ← ${source}`);

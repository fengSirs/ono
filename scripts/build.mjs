import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assets } from "./assets.mjs";
import { mkdir, cp, writeFile } from "node:fs/promises";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { build } = createRequire(import.meta.url)("esbuild");
await mkdir(resolve(root, "backend/runtime"), { recursive: true });
await build({
  entryPoints: [resolve(root, "backend/src/game-controller.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: resolve(root, "backend/runtime/game-controller.mjs"),
  external: ["./db.mjs"],
  plugins: [
    {
      name: "shared-sqlite",
      setup(b) {
        b.onResolve({ filter: /^\.\/db\.mjs$/ }, () => ({
          path: "./db.mjs",
          external: true,
        }));
      },
    },
  ],
});
for (const name of [
  "server.mjs",
  "db.mjs",
  "auth.mjs",
  "invitations.mjs",
  "share-cover.mjs",
])
  await cp(
    resolve(root, "backend/src", name),
    resolve(root, "backend/runtime", name),
  );
await cp(
  resolve(root, "backend/src/migrations"),
  resolve(root, "backend/runtime/migrations"),
  { recursive: true },
);
await cp(
  resolve(root, "backend/src/domain"),
  resolve(root, "backend/runtime/domain"),
  { recursive: true },
);
for (const name of ["i18n", "christmas-i18n"])
  await build({
    entryPoints: [resolve(root, "miniapp/utils", name + ".ts")],
    bundle: true,
    format: "cjs",
    platform: "neutral",
    target: "es2018",
    outfile: resolve(root, "miniapp/utils", name + ".js"),
  });
await writeFile(
  resolve(root, "backend/runtime/build.json"),
  JSON.stringify(
    {
      application: "ONO-FinClip",
      version: "1.0.1",
      runtime: "Node >=22.14",
      frontend: "native WXML/WXSS/Page",
      sourceOnly: true,
    },
    null,
    2,
  ),
);
await assets(root);
console.log(
  "Built independent backend runtime and native mini-program dictionaries.",
);

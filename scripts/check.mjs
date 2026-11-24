import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createRequire } from "node:module";
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  mini = resolve(root, "miniapp");
let count = 0;
async function files(dir) {
  var result = [];
  for (const name of await readdir(dir)) {
    if (["node_modules", ".git", "data"].includes(name)) continue;
    const p = resolve(dir, name);
    if ((await stat(p)).isDirectory()) result.push(...(await files(p)));
    else result.push(p);
  }
  return result;
}
const all = await files(root),
  app = JSON.parse(await readFile(resolve(mini, "app.json"), "utf8"));
for (const file of all) {
  const s = await readFile(file, "utf8");
  if (file.endsWith(".json")) {
    JSON.parse(s);
    count++;
  }
  if (file.endsWith(".js") || file.endsWith(".cjs")) {
    new vm.Script(s, { filename: file });
    count++;
  }
  if (file.endsWith(".wxml")) {
    var stack = [],
      tag = /<(\/?)([\w:-]+)\b([^>]*?)(\/?)>/g,
      m;
    var masked = s.replace(/\{\{[\s\S]*?\}\}/g, "EXPR");
    while ((m = tag.exec(masked))) {
      if (m[1]) {
        if (stack.pop() !== m[2]) throw Error("Unbalanced WXML " + file);
      } else if (!m[4]) stack.push(m[2]);
    }
    if (stack.length) throw Error("Unclosed WXML " + file);
    let js = await readFile(file.replace(".wxml", ".js"), "utf8");
    const shared = js.match(/^Page\(require\(['"](\.\/\w+)['"]\)\);\s*$/);
    if (shared) js = await readFile(resolve(dirname(file), shared[1] + '.js'), 'utf8');
    for (const event of s.matchAll(
      /(?:bind|catch)(?::[\w]+|[\w]+)="([\w]+)"/g,
    )) {
      if (!new RegExp("\\b" + event[1] + ":\\s*function").test(js))
        throw Error("Missing event " + event[1] + " in " + file);
    }
    count++;
  }
}
for (const page of app.pages)
  for (const ext of ["js", "json", "wxml", "wxss"])
    await stat(resolve(mini, page + "." + ext));
const require = createRequire(import.meta.url),
  labels = require(resolve(mini, "utils/labels.js"));
for (const file of all.filter((x) => x.endsWith(".wxml"))) {
  var s = await readFile(file, "utf8");
  for (const m of s.matchAll(/\b(t|c)\.([A-Za-z][\w]*)/g)) {
    for (const lang of ["pt", "en", "zh"])
      if (!labels.labels(lang)[m[1]][m[2]])
        throw Error("Missing " + lang + " label " + m[0] + " in " + file);
  }
}
for (const file of all.filter(
  (x) => x.startsWith(mini) && /\.(js|wxml)$/.test(x),
)) {
  var s = await readFile(file, "utf8");
  if (/document\.|window\.|localStorage|<web-view|react-dom/.test(s))
    throw Error("H5 dependency in native miniapp: " + file);
}
console.log(
  "Native structure, JavaScript syntax, JSON, WXML balance, event handlers and three-language labels: " +
    count +
    " files passed.",
);

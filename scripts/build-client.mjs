import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(root, "src/client.js");
const outputPath = path.join(root, "lib/client.js");
const fontDir = path.join(root, "assets/fonts");

const weights = [400, 500, 600];
const faces = weights.map((weight) => {
  const file = path.join(fontDir, `openai-sans-${weight}.woff2`);
  const base64 = fs.readFileSync(file).toString("base64");
  return `@font-face {
  font-family: "OpenAI Sans";
  src: url(data:font/woff2;base64,${base64}) format("woff2");
  font-style: normal;
  font-weight: ${weight};
  font-display: swap;
}`;
}).join("\n");

const template = fs.readFileSync(templatePath, "utf8");
const marker = "/*__FONT_FACES__*/";
if (!template.includes(marker)) {
  throw new Error(`Missing ${marker} in ${templatePath}`);
}

const output = template.replace(marker, faces);
fs.writeFileSync(outputPath, output);
console.log(`wrote ${path.relative(root, outputPath)} (${output.length} bytes)`);

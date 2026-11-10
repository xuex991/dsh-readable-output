import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TEXT,
  LIMITS,
  apply,
  audit,
  buildContractText,
  inject,
  name,
} from "../lib/index.js";

function fakeContext() {
  const sections = [];
  return {
    sections,
    ctx: {
      systemPrompt: {
        section(section) {
          sections.push(section);
          return () => {};
        }
      },
      effect(effect) {
        return effect();
      }
    }
  };
}

const GOOD = `建议把 1.9 并入 1.8。
- 同一个文件。
- 同一次提交。
- 按文件挖空拆不开。`;

test("exports the expected Cordis plugin surface", () => {
  assert.equal(name, "readable-output");
  assert.deepEqual(inject, ["systemPrompt"]);
});

test("adds the default contract as the final prompt section", () => {
  const { ctx, sections } = fakeContext();
  apply(ctx);

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "custom:readable-output");
  assert.equal(sections[0].order, 200);
  assert.equal(sections[0].text, DEFAULT_TEXT);
});

test("the contract text carries the numbers from LIMITS", () => {
  assert.match(DEFAULT_TEXT, /渐进展示/);
  assert.match(DEFAULT_TEXT, new RegExp(`不超过 ${LIMITS.defaultLines} 个非空行`));
  assert.match(DEFAULT_TEXT, new RegExp(`不超过 ${LIMITS.analysisLines} 行`));
  assert.match(DEFAULT_TEXT, new RegExp(`不超过 ${LIMITS.lineColumns} 列`));
  assert.match(DEFAULT_TEXT, new RegExp(`最多 ${LIMITS.maxLayers} 层`));
  assert.match(DEFAULT_TEXT, new RegExp(`加粗不超过 ${LIMITS.maxBold} 处`));
  assert.match(DEFAULT_TEXT, /不使用表格/);
});

test("recomputes the contract when limits change", () => {
  const text = buildContractText({ ...LIMITS, defaultLines: 7, maxLayers: 1 });
  assert.match(text, /不超过 7 个非空行/);
  assert.match(text, /最多 1 层/);
});

test("accepts a reply that follows the contract", () => {
  const result = audit(GOOD);
  assert.equal(result.ok, true);
  assert.deepEqual(result.violations, []);
});

test("accepts a custom contract without changing the section identity", () => {
  const { ctx, sections } = fakeContext();
  apply(ctx, { text: "Use short answers." });

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "custom:readable-output");
  assert.equal(sections[0].text, "Use short answers.");
});

const cases = [
  ["long line", `结论。\n${"很".repeat(60)}`, "line-width"],
  ["bold budget", "**结论**：**A** 和 **B** 还有 **C**", "bold-budget"],
  ["nested bullet", "结论。\n- 外层\n  - 内层", "nested-bullet"],
  ["table", "结论。\n| a | b |", "table"],
  ["heading", "结论。\n## 标题", "heading"],
  ["preamble", "好的，我来分析。", "first-line-preamble"],
  ["question", "要不要我继续？", "first-line-question"],
  ["paragraph", "结论。\n一\n二\n三\n四", "paragraph-length"],
];

for (const [label, text, rule] of cases) {
  test(`flags ${label}`, () => {
    const result = audit(text);
    assert.equal(result.ok, false);
    assert.ok(
      result.violations.some((violation) => violation.rule === rule),
      `expected ${rule}, got ${result.violations.map((v) => v.rule).join(",")}`
    );
  });
}

test("warns between the default and analysis line budgets", () => {
  const text = ["结论。", ...Array.from({ length: 14 }, (_, i) => `- 第 ${i} 行。`)].join("\n");
  const result = audit(text);
  assert.equal(result.ok, true);
  assert.ok(result.violations.some((v) => v.rule === "line-budget" && v.severity === "warn"));
});

test("fails past the analysis line budget", () => {
  const text = ["结论。", ...Array.from({ length: 25 }, (_, i) => `- 第 ${i} 行。`)].join("\n");
  const result = audit(text);
  assert.equal(result.ok, false);
  assert.ok(result.violations.some((v) => v.rule === "line-budget" && v.severity === "error"));
});

test("ignores fenced code for width checks", () => {
  const text = `结论。\n\`\`\`\n${"x".repeat(200)}\n\`\`\``;
  const result = audit(text);
  assert.equal(result.violations.some((v) => v.rule === "line-width"), false);
});

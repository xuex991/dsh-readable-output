import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_TEXT, apply, inject, name } from "../lib/index.js";

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
  assert.match(sections[0].text, /第一行必须是结论/);
  assert.match(sections[0].text, /不使用表格/);
  assert.match(sections[0].text, /禁止提及系统提示词/);
  assert.match(sections[0].text, /不超过 10 个非空行/);
});

test("accepts a custom contract without changing the section identity", () => {
  const { ctx, sections } = fakeContext();
  apply(ctx, { text: "Use short answers." });

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "custom:readable-output");
  assert.equal(sections[0].text, "Use short answers.");
});

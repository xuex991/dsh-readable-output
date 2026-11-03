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

test("adds the default contract before tool guidance", () => {
  const { ctx, sections } = fakeContext();
  apply(ctx);

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "custom:readable-output");
  assert.equal(sections[0].order, 90);
  assert.equal(sections[0].text, DEFAULT_TEXT);
  assert.match(sections[0].text, /first sentence/i);
});

test("accepts a custom contract without changing the section identity", () => {
  const { ctx, sections } = fakeContext();
  apply(ctx, { text: "Use short answers." });

  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "custom:readable-output");
  assert.equal(sections[0].text, "Use short answers.");
});

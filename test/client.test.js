import assert from "node:assert/strict";
import test from "node:test";

let loaded;
const head = {
  children: [],
  appendChild(element) {
    this.children.push(element);
  },
};
const doc = {
  head,
  querySelector(selector) {
    return head.children.find(
      (element) => `style[data-plugin-css="${element.dataset.pluginCss}"]` === selector
    ) ?? null;
  },
  createElement() {
    return {
      dataset: {},
      textContent: "",
      remove() {
        const index = head.children.indexOf(this);
        if (index >= 0) head.children.splice(index, 1);
      },
    };
  },
};

globalThis.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      loaded = { id, exports: factory(() => ({})) };
    },
  },
};
globalThis.document = doc;

await import("../lib/client.js");

test("registers under the package name", () => {
  assert.equal(loaded.id, "dsh-readable-output");
  assert.equal(loaded.exports.name, "readable-output");
  assert.deepEqual(loaded.exports.inject, ["theme"]);
});

test("installs one stylesheet and reuses it", () => {
  const disposeA = loaded.exports.installStyles();
  const disposeB = loaded.exports.installStyles();
  assert.equal(head.children.length, 1);
  assert.equal(head.children[0].dataset.plugin, "dsh-readable-output");
  disposeA();
  disposeB();
  assert.equal(head.children.length, 0);
});

test("the stylesheet changes the rendered reading rhythm", () => {
  const css = loaded.exports.buildCss();
  assert.match(css, /data-chat-flow-kind="assistant-step"/);
  assert.match(css, /max-width: min\(768px, 100%\)/);
  assert.match(css, /line-height: 23px/);
  assert.match(css, /font-size: \.92em !important/);
  assert.match(css, /border-radius: 6px/);
  assert.match(css, /OpenAI Sans/);
  assert.doesNotMatch(css, /data-chat-flow-kind="assistant"/);
});

test("apply registers the stylesheet through ctx.effect", () => {
  const effects = [];
  const overrides = [];
  const ctx = {
    effect(callback, label) {
      effects.push(label);
      callback();
    },
    theme: {
      overrideTokens(source, tokens) {
        overrides.push({ source, tokens });
        return () => {};
      },
    },
  };
  loaded.exports.apply(ctx);
  assert.deepEqual(effects, ["readable-output.theme", "readable-output.typography"]);
  assert.equal(overrides.length, 1);
  assert.equal(overrides[0].source, "dsh-readable-output");
  assert.equal(head.children.length, 1);
});

test("the token layer carries the Codex palette and fonts", () => {
  const tokens = loaded.exports.TOKENS;
  assert.equal(tokens["--dsw-alias-bg-base"].dark, "#181818");
  assert.equal(tokens["--dsw-alias-label-primary"].dark, "#ffffff");
  assert.match(tokens["--dsh-font-family-text-default"].dark, /OpenAI Sans/);
  assert.match(tokens["--dsh-font-family-code-default"].dark, /SF Mono/);
  assert.equal(tokens["--dsw-alias-markdown-inline-code"].light, "#eaeaea");
  assert.equal(tokens["--dsw-alias-markdown-inline-code"].dark, "#343434");
  for (const value of Object.values(tokens)) {
    assert.equal(typeof value.light, "string");
    assert.equal(typeof value.dark, "string");
  }
});

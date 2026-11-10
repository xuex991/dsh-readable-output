/**
 * Client half: inject a typography stylesheet into the DSH web UI.
 *
 * The generated file in lib/client.js embeds the OpenAI Sans faces so the
 * renderer can use them without a file:// request.
 */
window.__ModuleLoader__.load({
  id: "dsh-readable-output",
  factory: () => {
    const module = { exports: {} };
    const exports = module.exports;

    const STYLE_ID = "dsh-readable-output/typography";

    const FONT_FACES = `
/*__FONT_FACES__*/
`;

    const TEXT_FONT = '"OpenAI Sans", "SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", sans-serif';
    const CODE_FONT = '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Consolas, "Liberation Mono", monospace';

    const TOKENS = {
      "--dsh-font-family-text-default": { light: TEXT_FONT, dark: TEXT_FONT },
      "--dsh-font-family-code-default": { light: CODE_FONT, dark: CODE_FONT },
      "--dsw-alias-bg-base": { light: "#ffffff", dark: "#181818" },
      "--dsw-alias-bg-layer-1": { light: "#f9f9f9", dark: "#212121" },
      "--dsw-alias-bg-layer-2": { light: "#f2f2f2", dark: "#282828" },
      "--dsw-alias-bg-layer-3": { light: "#ececec", dark: "#303030" },
      "--dsw-alias-bg-module-platform": { light: "#f7f7f7", dark: "#1f1f1f" },
      "--dsw-alias-bg-overlay": { light: "#f2f2f2", dark: "#2a2a2a" },
      "--dsw-alias-label-primary": { light: "#1a1c1f", dark: "#ffffff" },
      "--dsw-alias-label-secondary": { light: "#5d5d5d", dark: "rgba(255, 255, 255, 0.7)" },
      "--dsw-alias-label-tertiary": { light: "#8f8f8f", dark: "rgba(255, 255, 255, 0.5)" },
      "--dsw-alias-label-caption": { light: "#8f8f8f", dark: "#8a8a8a" },
      "--dsw-alias-border-l1": { light: "rgba(0, 0, 0, 0.06)", dark: "rgba(255, 255, 255, 0.06)" },
      "--dsw-alias-border-l2": { light: "rgba(0, 0, 0, 0.1)", dark: "rgba(255, 255, 255, 0.12)" },
      "--dsw-alias-border-l3": { light: "rgba(0, 0, 0, 0.12)", dark: "rgba(255, 255, 255, 0.16)" },
      "--dsw-alias-interactive-bg-hover": { light: "rgba(0, 0, 0, 0.05)", dark: "rgba(255, 255, 255, 0.08)" },
      "--dsw-alias-markdown-code-block": { light: "#f6f6f6", dark: "#212121" },
      "--dsw-alias-markdown-code-block-banner": { light: "#efefef", dark: "#262626" },
      "--dsw-alias-markdown-inline-code": { light: "#eaeaea", dark: "#343434" },
      "--dsw-alias-brand-primary-new-colorprimary-new-color": { light: "#339cff", dark: "#339cff" },
      "--dsw-alias-state-business-primary": { light: "#339cff", dark: "#339cff" },
      "--dsw-specific-sidebar-fill": { light: "#f7f7f7", dark: "#1b1b1b" },
      "--dsw-specific-bubble": { light: "#f2f2f2", dark: "#262626" },
    };

    const CSS = `${FONT_FACES}
[data-chat-flow-kind="assistant-step"] {
  font-size: 14px;
  line-height: 23px;
}
[data-chat-flow-kind="assistant-step"] :is(p, li) {
  font-size: 14px;
  line-height: 23px;
}
div:has(> [data-slot="conversation.chat.flow"]) {
  width: min(768px, 100%);
  max-width: min(768px, 100%);
  margin-inline: auto;
}
[data-chat-flow-kind="assistant-step"] :not(pre) > code {
  font-size: .92em !important;
  line-height: inherit;
  padding: 1px 6px;
  border: 0;
  border-radius: 6px;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
`;

    function installStyles(doc = typeof document === "undefined" ? undefined : document) {
      if (!doc) return () => {};
      const selector = `style[data-plugin-css="${STYLE_ID}"]`;
      const existing = doc.querySelector(selector);
      if (existing) {
        existing.textContent = CSS;
        return () => existing.remove();
      }
      const tag = doc.createElement("style");
      tag.dataset.plugin = "dsh-readable-output";
      tag.dataset.pluginCss = STYLE_ID;
      tag.textContent = CSS;
      doc.head.appendChild(tag);
      return () => tag.remove();
    }

    function apply(ctx) {
      ctx.effect(
        () => ctx.theme.overrideTokens("dsh-readable-output", TOKENS),
        "readable-output.theme"
      );
      ctx.effect(() => installStyles(), "readable-output.typography");
    }

    exports.name = "readable-output";
    exports.inject = ["theme"];
    exports.STYLE_ID = STYLE_ID;
    exports.TOKENS = TOKENS;
    exports.buildCss = () => CSS;
    exports.installStyles = installStyles;
    exports.apply = apply;
    return module.exports;
  },
});

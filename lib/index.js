import { DEFAULT_TEXT, LIMITS, buildContractText } from './contract.js';

export const name = "readable-output";
export const inject = ["systemPrompt"];

export { DEFAULT_TEXT, LIMITS, buildContractText };
export { audit, displayWidth, units } from './audit.js';

export function apply(ctx, config = {}) {
  const text = typeof config.text === "string" && config.text.trim() !== ""
    ? config.text
    : DEFAULT_TEXT;

  ctx.effect(() => ctx.systemPrompt.section({
    name: "custom:readable-output",
    order: 200,
    text
  }), "readable-output.section()");
}

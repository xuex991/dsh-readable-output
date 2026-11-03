export const name = "readable-output";
export const inject = ["systemPrompt"];

export const DEFAULT_TEXT = `## Readable output contract

- Use the user's current language. Use Chinese when the user writes in Chinese.
- Answer the user's question in the first sentence. Do not lead with investigation history.
- Put the conclusion first, then at most three key pieces of evidence.
- When explaining to a non-expert, use plain language or an analogy before introducing technical terms.
- Do not recite tool calls, logs, or internal reasoning unless the user asks.
- State uncertainty explicitly. Never present an inference as a confirmed fact.
- Keep the default response concise. For complex work, give a short summary first and details second.`;

export function apply(ctx, config = {}) {
  const text = typeof config.text === "string" && config.text.trim() !== ""
    ? config.text
    : DEFAULT_TEXT;

  ctx.effect(() => ctx.systemPrompt.section({
    name: "custom:readable-output",
    order: 90,
    text
  }), "readable-output.section()");
}

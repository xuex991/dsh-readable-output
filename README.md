# dsh-readable-output

A small DeepSeek Harness plugin that adds a progressive-disclosure output
contract to the system prompt, plus a deterministic checker for the numeric
parts of that contract.

## What it adds

The plugin registers one additive `systemPrompt` section at order `200`, after
tool and deliverable guidance:

- first layer: one conclusion, 2-4 reasons, one next step, 10 nonblank lines;
- second layer: evidence, code, data, edge cases, behind one short label;
- at most two levels, 80 columns per line (about 40 Chinese characters);
- one idea per line, no nested bullets, no headings, no tables;
- at most 3 bold spans, 20 nonblank lines for analysis;
- full detail for errors, failing tests, security warnings, and destructive
  confirmations, regardless of the line budget;
- no tool narration, no invented sources.

The numbers live in `lib/contract.js` as `LIMITS`, and the prompt text is
generated from them. Editing a limit changes both the instruction and the
checker.

## Deterministic check

`audit(text)` measures a finished reply against those same numbers: first-line
length and shape, display-column width, bullet length, paragraph height, bold
count, layer count, headings, tables, and nested bullets. Fenced code blocks
are skipped for width checks.

```js
import { audit } from "dsh-readable-output/audit";

const result = audit(reply);
if (!result.ok) console.log(result.violations);
```

```bash
node lib/cli.js reply.md
printf '结论。\n- 依据。' | node lib/cli.js -
```

The checker is deterministic; the prompt is still advisory. For guarantees,
run `audit` in a hook or CI step rather than relying on the model.

It does not replace the deployment persona or other prompt sections.

## Client half: actual layout

`lib/client.js` is the half that changes the rendered page, not just the
model's instructions. It injects one `<style>` tag and targets the stable
`[data-chat-flow-kind="assistant-step"]` flow attribute:

- body text at `14px/23px`, matching Codex's chat line height;
- assistant content capped at `768px`;
- inline code at `0.92em`, `1px 6px` padding, `6px` radius, no border;
- inline code background `#eaeaea` in light mode and `#343434` in dark mode.

The same bundle also overrides the Codex palette and font stacks through
`ctx.theme.overrideTokens`, in both light and dark modes:

- background `#181818`, surfaces `#212121 / #282828 / #303030`;
- text `#ffffff`, secondary 70%, tertiary 50%, borders 6%/12%/16%;
- text font `OpenAI Sans / PingFang SC`, code font `SF Mono`.

The OpenAI Sans faces are embedded as data URIs by `npm run build`, because
DSH blocks `file://` font requests. Zero model tokens, deterministic, and no
component replacement: if DSH renames the flow attribute, the rules stop
applying instead of breaking the page. Disable the client half by removing
`dsh.client` from `package.json` and unloading the bundle.

## Install

```bash
dsh plugin --profile desktop add -w 'github:xuex991/dsh-readable-output'
```

`-w` is required by the pnpm version bundled with DSH `0.1.0-rc.6`. The
`dsh plugin add` command installs the package and adds it to the selected
profile's `dsh.profile.bundles`, which mounts the output contract.

If the bundled pnpm store major version does not match the profile's existing
`node_modules`, mount a local checkout manually instead: add
`"dsh-readable-output": "link:/absolute/path/to/dsh-readable-output"` to the
profile's `dependencies`, add `"dsh-readable-output"` to its
`dsh.profile.bundles`, and symlink it into the profile's `node_modules`.

## Manual mount

If a profile does not add the bundle automatically, add
`dsh-readable-output` to its `dsh.profile.bundles` list:

```json
{
  "name": "dsh-profile-desktop",
  "private": true,
  "dependencies": {
    "dsh-readable-output": "github:xuex991/dsh-readable-output"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "dsh-readable-output"
      ]
    }
  }
}
```

Verify the composed profile:

```bash
dsh --profile desktop --dump-config
```

The output should contain a `readable-output` row.

## Customize the contract

Override `text` in the patch entry:

```yaml
- id: readable-output
  name: dsh-readable-output
  config:
    text: |
      ## Output contract

      - Answer in Chinese.
      - Put the conclusion first.
      - Do not explain tool use unless asked.
```

## Development

```bash
node scripts/build-client.mjs
node --test
npm run check -- reply.md
npm pack --dry-run
```

`lib/client.js` is generated. Edit `src/client.js`, then run `npm run build`.

## Compatibility

The plugin only uses the public `ctx.systemPrompt.section()` service through
Cordis injection. It has no runtime npm dependencies. Pin the DSH version you
use in production and run `--dump-config` after a DSH upgrade.

## License

MIT

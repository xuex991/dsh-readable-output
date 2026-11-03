# dsh-readable-output

A small DeepSeek Harness plugin that adds an always-on output contract to the
system prompt. Install it from Git instead of copying a local `AGENTS.md` to
every machine.

## What it adds

The plugin registers one additive `systemPrompt` section at order `90`:

- answer in the user's language;
- put the direct answer first;
- prefer plain language before jargon;
- do not recite tool calls or internal reasoning;
- mark uncertainty;
- keep responses concise.

It does not replace the deployment persona or other prompt sections.

## Install

```bash
dsh plugin --profile desktop add -w 'github:xuex991/dsh-readable-output'
```

`-w` is required by the pnpm version bundled with DSH `0.1.0-rc.6`. The
`dsh plugin add` command installs the package and adds it to the selected
profile's `dsh.profile.bundles`, which mounts the output contract.

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
node --test
npm pack --dry-run
```

## Compatibility

The plugin only uses the public `ctx.systemPrompt.section()` service through
Cordis injection. It has no runtime npm dependencies. Pin the DSH version you
use in production and run `--dump-config` after a DSH upgrade.

## License

MIT

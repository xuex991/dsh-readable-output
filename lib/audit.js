import { LIMITS } from './contract.js';

const FENCE_RE = /^\s*(```|~~~)/;
const HEADING_RE = /^\s*#{1,6}\s/;
const TABLE_RE = /^\s*\|.*\|\s*$/;
const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+/;
const BOLD_RE = /\*\*[^*\n]+\*\*/g;
const PREAMBLE_RE = /^(好的|当然|没问题|可以|我来|我们|首先|以下|下面|让我|我看了|我检查|先说|简单说)/;

function isWide(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

export function displayWidth(text) {
  let width = 0;
  for (const char of text) width += isWide(char.codePointAt(0)) ? 2 : 1;
  return width;
}

/** One CJK character counts as one unit; two Latin characters count as one. */
export function units(text) {
  return displayWidth(text) / 2;
}

function plain(line) {
  return line.replace(/\*\*/g, '').replace(/`/g, '').trim();
}

function add(violations, rule, message, line, severity = 'error') {
  violations.push({ rule, message, line, severity });
}

/**
 * Deterministic check of a finished reply against the contract's numbers.
 * Fenced code blocks are skipped for width, bold, heading, and table checks;
 * they still count toward the nonblank-line budget.
 */
export function audit(text, limits = LIMITS) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const violations = [];
  let inFence = false;
  let nonblankLines = 0;
  let maxLineColumns = 0;
  let boldCount = 0;
  let layerCount = 0;
  let paragraphStart = 0;
  let paragraphLength = 0;
  let firstLine = null;

  const flushParagraph = () => {
    if (paragraphLength > limits.paragraphLines) {
      add(
        violations,
        'paragraph-length',
        `段落 ${paragraphLength} 行，上限 ${limits.paragraphLines} 行`,
        paragraphStart,
      );
    }
    paragraphLength = 0;
  };

  lines.forEach((raw, index) => {
    const line = index + 1;
    if (FENCE_RE.test(raw)) {
      flushParagraph();
      inFence = !inFence;
      if (raw.trim()) nonblankLines += 1;
      return;
    }
    if (!raw.trim()) {
      flushParagraph();
      return;
    }

    nonblankLines += 1;
    if (inFence) return;

    if (firstLine === null) firstLine = { text: plain(raw), line };

    const columns = displayWidth(plain(raw));
    maxLineColumns = Math.max(maxLineColumns, columns);
    if (columns > limits.lineColumns) {
      add(
        violations,
        'line-width',
        `${columns} 列，上限 ${limits.lineColumns} 列`,
        line,
      );
    }

    boldCount += (raw.match(BOLD_RE) ?? []).length;

    if (HEADING_RE.test(raw)) {
      add(violations, 'heading', '不使用 # 标题', line);
    }
    if (TABLE_RE.test(raw)) {
      add(violations, 'table', '不使用表格', line);
    }

    const list = raw.match(LIST_RE);
    if (list) {
      flushParagraph();
      if (list[1].length >= 2) {
        add(violations, 'nested-bullet', '不嵌套 bullet', line);
      }
      const content = raw.slice(list[0].length);
      const itemUnits = units(plain(content));
      if (itemUnits > limits.bulletUnits) {
        add(
          violations,
          'bullet-length',
          `${Math.round(itemUnits)} 字，上限 ${limits.bulletUnits} 字`,
          line,
        );
      }
      return;
    }

    if (/^\s*\*\*[^*]+\*\*\s*$/.test(raw)) {
      flushParagraph();
      layerCount += 1;
      return;
    }

    if (paragraphLength === 0) paragraphStart = line;
    paragraphLength += 1;
  });

  flushParagraph();

  if (firstLine) {
    if (PREAMBLE_RE.test(firstLine.text)) {
      add(violations, 'first-line-preamble', '第一行是开场白，不是结论', firstLine.line);
    }
    if (/[？?]\s*$/.test(firstLine.text)) {
      add(violations, 'first-line-question', '第一行是问句，不是结论', firstLine.line);
    }
    const firstUnits = units(firstLine.text);
    if (firstUnits > limits.firstLineUnits) {
      add(
        violations,
        'first-line-length',
        `${Math.round(firstUnits)} 字，上限 ${limits.firstLineUnits} 字`,
        firstLine.line,
      );
    }
  }

  if (boldCount > limits.maxBold) {
    add(violations, 'bold-budget', `加粗 ${boldCount} 处，上限 ${limits.maxBold} 处`);
  }
  if (layerCount > limits.maxLayers) {
    add(violations, 'layer-budget', `${layerCount} 层，上限 ${limits.maxLayers} 层`);
  }
  if (nonblankLines > limits.analysisLines) {
    add(
      violations,
      'line-budget',
      `${nonblankLines} 个非空行，上限 ${limits.analysisLines} 行`,
    );
  } else if (nonblankLines > limits.defaultLines) {
    add(
      violations,
      'line-budget',
      `${nonblankLines} 个非空行，超过默认 ${limits.defaultLines} 行`,
      undefined,
      'warn',
    );
  }

  return {
    ok: violations.every((violation) => violation.severity === 'warn'),
    violations,
    metrics: { nonblankLines, maxLineColumns, boldCount, layerCount },
  };
}

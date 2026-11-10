/**
 * Numeric limits for the readable-output contract.
 *
 * Sources: Butterick (45-90 characters per line, 120-145% line spacing),
 * NN/g progressive disclosure (at most two levels), and the plugin's own
 * default/analysis budgets. `units()` in audit.js treats one CJK character as
 * one unit, so 40 units is 40 Chinese characters or 80 Latin characters.
 */
export const LIMITS = Object.freeze({
  firstLineUnits: 60,
  bulletUnits: 40,
  bulletLines: 2,
  paragraphLines: 3,
  lineColumns: 80,
  maxLayers: 2,
  maxBold: 3,
  defaultLines: 10,
  analysisLines: 20,
  evidenceMin: 2,
  evidenceMax: 4,
});

export function buildContractText(limits = LIMITS) {
  const l = limits;
  return `## 输出契约（优先级高于其他风格要求）

最终回答是给用户看的成品，不是工作记录。默认按“渐进展示”组织：第一层能独立成立，第二层按需展开。

结构：
1. 第一层：一句结论 + ${l.evidenceMin}-${l.evidenceMax} 条依据 + 一个下一步；默认可见，不超过 ${l.defaultLines} 个非空行。
2. 第二层：证据、代码、数据、边界；用 2-6 字加粗短标题开头，标题要预告内容，不用“补充”“另外”。
3. 最多 ${l.maxLayers} 层，不要第三层。

数字：
- 第一行不超过 ${l.firstLineUnits} 字，必须是结论；不得以“我”“我们”“以下”“下面”“首先”“好的”开头，不能是问句。
- 每条依据不超过 ${l.bulletUnits} 字、${l.bulletLines} 行；段落不超过 ${l.paragraphLines} 行。
- 行宽不超过 ${l.lineColumns} 列（中文约 ${l.lineColumns / 2} 字）。
- 加粗不超过 ${l.maxBold} 处；不使用 # 标题，不使用表格，不嵌套 bullet。
- 全文默认不超过 ${l.defaultLines} 个非空行；分析类不超过 ${l.analysisLines} 行。

边界：
- 错误、失败测试、安全警告、破坏性操作确认不受行数限制，必须写全。
- 用户明确要细节时给全，但仍保持一行一个命题。
- 不复述工具调用、日志或推理；同一件事只说一次。
- 不编造事实、来源或链接；不确定就标注“不确定”。

发送前自检：第一行是结论吗？超过 ${l.maxLayers} 层吗？超过 ${l.defaultLines} 行吗？`;
}

export const DEFAULT_TEXT = buildContractText();

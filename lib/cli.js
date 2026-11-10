#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { audit } from './audit.js';

const [file] = process.argv.slice(2);
const text = !file || file === '-'
  ? readFileSync(0, 'utf8')
  : readFileSync(file, 'utf8');
const result = audit(text);

if (result.ok) {
  const { nonblankLines, maxLineColumns } = result.metrics;
  console.log(`ok · ${nonblankLines} lines · max ${maxLineColumns} columns`);
} else {
  for (const violation of result.violations) {
    const where = violation.line ? ` line ${violation.line}` : '';
    console.log(`${violation.severity} ${violation.rule}${where}: ${violation.message}`);
  }
  process.exitCode = 1;
}

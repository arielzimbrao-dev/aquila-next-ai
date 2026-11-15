// Method rules every generated project gets: readable code (all stacks) and, for UI stacks, screens without
// the "made by AI" look. Each package stays on its own technology: no UI rules in a backend package.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { PROFILE } from '../bin/profile.mjs';
import { PKG } from './helpers.mjs';

const read = (path) => readFileSync(join(PKG, path), 'utf8');
const UI_RULES = `core/${PROFILE.id}/ui-design.md`;

test('readable code: style.md has the rules and the always-loaded router, implement and review point to them', () => {
  const style = read('core/style.md');
  assert.match(style, /^## Readable code$/m);
  for (const rule of ['Names say what', 'One function, one job', 'Flat flow', 'Before delivering'])
    assert.ok(style.includes(rule), rule);
  assert.match(read('core/always.md'), /Readable code: .*`\.aquila\/core\/style\.md`/);
  assert.match(read('agents/aquila-implement.md'), /\.\.\/core\/style\.md.*Readable code/);
  assert.match(read('agents/aquila-review.md'), /Style and readability/);
});

test('UI stacks: the "made by AI" defaults are off unless explicitly asked; a backend package has no UI rules', () => {
  if (!PROFILE.lint.jsx) {
    assert.ok(!existsSync(join(PKG, UI_RULES)), 'no UI rules in a backend package');
    return;
  }
  const rules = read(UI_RULES);
  assert.match(rules, /explicitly asks/);
  for (const tell of ['gradient', 'Glassmorphism', 'Emoji', 'eyebrow', 'sparkline', 'donut', "don't filter"])
    assert.ok(rules.toLowerCase().includes(tell.toLowerCase()), tell);
  const link = `${PROFILE.id}/ui-design.md`;
  assert.ok(read(`core/${PROFILE.id}.md`).includes(`(${link})`), 'linked from the stack router');
  for (const role of ['aquila-plan', 'aquila-implement', 'aquila-review'])
    assert.ok(read(`agents/${role}.md`).includes(`../core/${link}`), role);
});

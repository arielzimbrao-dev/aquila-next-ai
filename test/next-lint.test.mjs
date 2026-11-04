// Next.js 16 removed `next lint`: the detected lint gate runs ESLint directly from that major on.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aquila, cleanup, project, readIn } from './helpers.mjs';

const pkg = (next) =>
  JSON.stringify({ dependencies: { next }, scripts: { lint: 'next lint', test: 'vitest run' } });

test('next >= 16: a `next lint` script becomes `npx eslint .` in the gates; next 15 keeps it', () => {
  for (const [next, cmd] of [['^16.0.0', 'npx eslint .'], ['^15.5.0', 'npm run lint']]) {
    const root = project({ 'package.json': pkg(next) });
    try {
      const init = aquila(root, 'init', '--tools=codex', '--lint=off');
      assert.equal(JSON.parse(readIn(root, 'docs/ai/aquila.json')).gates.lint, cmd, next);
      if (cmd === 'npx eslint .') assert.match(init.out, /`next lint` was removed in Next\.js 16/);
    } finally {
      cleanup(root);
    }
  }
});

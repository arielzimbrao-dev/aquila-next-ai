// Projects in a subfolder of the git repository and several aquila packages in one repository.
// Real git commits/pushes run the generated hooks with the platform's sh (Git Bash on Windows).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { aquila, cleanup, editConfig, git, LINK_TYPE, PKG, readIn } from './helpers.mjs';

const DISPATCHER = '.aquila-hooks';

/** Temporary repository; each folder in `projects` is a Next.js project with aquila-next-ai installed. */
function repo(projects) {
  const top = mkdtempSync(join(tmpdir(), 'aquila-mono-'));
  run(top, 'git', 'init', '-q', '-b', 'main');
  run(top, 'git', 'config', 'user.email', 'dev@example.com');
  run(top, 'git', 'config', 'user.name', 'dev');
  writeFileSync(join(top, 'README.md'), '# mono\n');
  for (const dir of projects) {
    const root = join(top, dir);
    mkdirSync(join(root, 'node_modules'), { recursive: true });
    symlinkSync(PKG, join(root, 'node_modules', 'aquila-next-ai'), LINK_TYPE);
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({
        dependencies: { next: '^16.0.0' },
        devDependencies: { 'aquila-next-ai': '^0.2.0' },
        scripts: { test: 'node -e "process.exit(0)"' },
      }),
    );
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n');
    mkdirSync(join(root, 'app'), { recursive: true });
    writeFileSync(join(root, 'app', 'page.tsx'), 'export default 1;\n');
  }
  return top;
}

function run(cwd, cmd, ...args) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

function dispose(top, projects) {
  // Subfolders first: each cleanup unlinks the package link before any recursive delete reaches it.
  for (const dir of [...projects].sort((a, b) => b.length - a.length)) cleanup(join(top, dir));
  rmSync(top, { recursive: true, force: true });
}

/** Gates that leave a mark file in the project folder: proves which project ran which phase. */
function markGates(root, { fail = false } = {}) {
  editConfig(root, (cfg) => {
    const mark = (phase) =>
      `node -e "require('fs').appendFileSync('ran-${phase}', 'x'); process.exit(${fail ? 3 : 0})"`;
    cfg.gates = { pc: mark('pre-commit'), pp: mark('pre-push') };
    cfg.hooks = { 'pre-commit': ['pc'], 'pre-push': ['pp'], ci: ['pc'] };
  });
}

const ran = (top, dir, phase) => existsSync(join(top, dir, `ran-${phase}`));
const clearMarks = (top, dirs) => {
  for (const dir of dirs)
    for (const phase of ['pre-commit', 'pre-push']) rmSync(join(top, dir, `ran-${phase}`), { force: true });
};
function commit(top, files) {
  for (const file of files) {
    mkdirSync(dirname(join(top, file)), { recursive: true });
    writeFileSync(join(top, file), `${Date.now()}${Math.random()}\n`);
  }
  run(top, 'git', 'add', '--', ...files);
  return run(top, 'git', 'commit', '-q', '-m', `change ${files.join(' ')}`);
}

test('project at the repository root keeps .aquila/githooks and the hook runs its gates', () => {
  const top = repo(['.']);
  try {
    assert.equal(aquila(top, 'init', '--tools=codex', '--lint=off').code, 0);
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), '.aquila/githooks');
    markGates(top);
    assert.equal(commit(top, ['app/a.tsx']).code, 0);
    assert.ok(ran(top, '.', 'pre-commit'));
    assert.match(readIn(top, '.git/info/exclude'), /^\/AGENTS\.md$/m);
    assert.ok(existsSync(join(top, '.github/workflows/aquila-gates.yml')));
    aquila(top, 'sync');
    const chk = aquila(top, 'check');
    assert.equal(chk.code, 0, chk.out);
  } finally {
    dispose(top, ['.']);
  }
});

test('project in repo/backend: dispatcher at the root, workflow at the root, prefixed exclude', () => {
  const top = repo(['backend']);
  const root = join(top, 'backend');
  try {
    const init = aquila(root, 'init', '--tools=codex', '--lint=off');
    assert.equal(init.code, 0, init.out);
    // git resolves a relative core.hooksPath from the repository root, so it must name the root dispatcher.
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), DISPATCHER);
    assert.equal(readIn(top, `${DISPATCHER}/projects`), 'backend\taquila-next-ai\n');
    for (const phase of ['pre-commit', 'pre-push']) {
      const hook = readIn(top, `${DISPATCHER}/${phase}`);
      assert.match(hook, /^#!\/bin\/sh\n# aquila-hooks v1/);
      assert.ok(!hook.includes('\r\n'), 'sh breaks with CRLF');
      if (process.platform !== 'win32')
        assert.ok(statSync(join(top, DISPATCHER, phase)).mode & 0o111, `${phase} executable`);
    }
    // Excluded paths are anchored at the repository root.
    const exclude = readIn(top, '.git/info/exclude');
    assert.match(exclude, /^\/backend\/AGENTS\.md$/m);
    assert.match(exclude, /^\/backend\/plan\.md$/m);
    assert.match(exclude, /^\/\.aquila-hooks\/$/m);
    assert.doesNotMatch(exclude, /^\/AGENTS\.md$/m);
    assert.equal(git(top, 'status', '--porcelain', '--', 'backend/AGENTS.md'), '');
    // GitHub reads workflows only from the root: one per project, filtered by its folder.
    assert.ok(!existsSync(join(root, '.github/workflows/aquila-gates.yml')));
    const wf = readIn(top, '.github/workflows/aquila-gates-backend.yml');
    assert.match(wf, /working-directory: backend/);
    assert.match(wf, /paths: \['backend\/\*\*', '\.github\/workflows\/aquila-gates-backend\.yml'\]/);
    assert.match(wf, /run: npx aquila-next-ai gate ci/);

    markGates(root);
    assert.equal(commit(top, ['backend/app/a.tsx']).code, 0);
    assert.ok(ran(top, 'backend', 'pre-commit'), 'gate ran from the project folder');
    clearMarks(top, ['backend']);
    assert.equal(commit(top, ['docs.md']).code, 0);
    assert.ok(!ran(top, 'backend', 'pre-commit'), 'nothing changed in backend/: skipped');

    markGates(root, { fail: true });
    assert.notEqual(commit(top, ['backend/app/b.tsx']).code, 0, 'a failing gate blocks the commit');

    const doctor = aquila(root, 'doctor').out;
    assert.match(doctor, /project in subfolder backend\//);
    assert.match(doctor, /✓ git hooks: shared dispatcher \.aquila-hooks/);
    markGates(root);
    aquila(root, 'sync');
    assert.equal(aquila(root, 'check').code, 0, aquila(root, 'check').out);
  } finally {
    dispose(top, ['backend']);
  }
});

test('init twice in a subfolder is idempotent', () => {
  const top = repo(['backend']);
  const root = join(top, 'backend');
  try {
    aquila(root, 'init', '--tools=codex', '--lint=off');
    const snapshot = () =>
      [
        `${DISPATCHER}/projects`,
        `${DISPATCHER}/pre-commit`,
        '.git/info/exclude',
        '.github/workflows/aquila-gates-backend.yml',
      ].map((f) => readIn(top, f));
    const first = snapshot();
    const again = aquila(root, 'init', '--tools=codex', '--lint=off');
    assert.equal(again.code, 0, again.out);
    assert.deepEqual(snapshot(), first);
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), DISPATCHER);
  } finally {
    dispose(top, ['backend']);
  }
});

test('backend (aquila-ai) + frontend (aquila-next-ai) share the dispatcher; each runs only on its changes', () => {
  const top = repo(['frontend']);
  const backend = join(top, 'backend');
  try {
    // Another aquila package (NestJS backend) as its init leaves it: a bin and a registry line.
    mkdirSync(join(backend, 'node_modules/aquila-ai/bin'), { recursive: true });
    writeFileSync(join(backend, '.gitignore'), 'node_modules/\nran-*\n');
    writeFileSync(
      join(backend, 'node_modules/aquila-ai/bin/aquila.mjs'),
      "import { appendFileSync } from 'node:fs';\nappendFileSync(`ran-${process.argv[3]}`, 'x');\n",
    );
    writeFileSync(join(top, '.gitignore'), 'ran-*\n');
    const init = aquila(join(top, 'frontend'), 'init', '--tools=codex', '--lint=off');
    assert.equal(init.code, 0, init.out);
    writeFileSync(join(top, DISPATCHER, 'projects'), 'backend\taquila-ai\nfrontend\taquila-next-ai\n');
    markGates(join(top, 'frontend'));
    // The other package's init reuses the dispatcher and keeps both registrations.
    aquila(join(top, 'frontend'), 'init', '--tools=codex', '--lint=off');
    assert.equal(
      readIn(top, `${DISPATCHER}/projects`),
      'backend\taquila-ai\nfrontend\taquila-next-ai\n',
    );
    assert.match(aquila(join(top, 'frontend'), 'doctor').out, /2 aquila projects share/);

    const dirs = ['backend', 'frontend'];
    const cases = [
      [['backend/src/a.ts'], [true, false]],
      [['frontend/app/a.tsx'], [false, true]],
      [['backend/src/b.ts', 'frontend/app/b.tsx'], [true, true]],
    ];
    for (const [files, expected] of cases) {
      clearMarks(top, dirs);
      assert.equal(commit(top, files).code, 0, files.join(' '));
      assert.deepEqual(
        dirs.map((d) => ran(top, d, 'pre-commit')),
        expected,
        `pre-commit for ${files.join(' ')}`,
      );
    }

    // pre-push: a new branch on the remote checks everything; then only what the pushed commits touch.
    run(top, 'git', 'init', '-q', '--bare', join(top, '.remote.git'));
    run(top, 'git', 'remote', 'add', 'origin', join(top, '.remote.git'));
    clearMarks(top, dirs);
    assert.equal(run(top, 'git', 'push', '-q', 'origin', 'main').code, 0);
    assert.deepEqual(dirs.map((d) => ran(top, d, 'pre-push')), [true, true]);
    commit(top, ['frontend/app/c.tsx']);
    clearMarks(top, dirs);
    assert.equal(run(top, 'git', 'push', '-q', 'origin', 'main').code, 0);
    assert.deepEqual(dirs.map((d) => ran(top, d, 'pre-push')), [false, true]);
  } finally {
    dispose(top, ['frontend']);
  }
});

test('a project at the root joins the dispatcher when another project in the repo already uses it', () => {
  const top = repo(['.', 'web']);
  try {
    assert.equal(aquila(top, 'init', '--tools=codex', '--lint=off').code, 0);
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), '.aquila/githooks');
    const sub = aquila(join(top, 'web'), 'init', '--tools=codex', '--lint=off');
    assert.equal(sub.code, 0, sub.out);
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), DISPATCHER, 'migrated');
    assert.equal(readIn(top, `${DISPATCHER}/projects`), '.\taquila-next-ai\nweb\taquila-next-ai\n');
    aquila(top, 'init', '--tools=codex', '--lint=off');
    assert.equal(git(top, 'config', '--get', 'core.hooksPath'), DISPATCHER, 'root init keeps it');
    assert.equal(readIn(top, `${DISPATCHER}/projects`), '.\taquila-next-ai\nweb\taquila-next-ai\n');
  } finally {
    dispose(top, ['.', 'web']);
  }
});

test('check fails when the hooks or the CI workflow sit where git/GitHub never read them', () => {
  const top = repo(['backend']);
  const root = join(top, 'backend');
  try {
    aquila(root, 'init', '--tools=codex', '--lint=off');
    assert.equal(aquila(root, 'check').code, 0);

    // 0.1.0 behavior: hooksPath relative to the project, which git resolves from the root.
    git(top, 'config', 'core.hooksPath', '.aquila/githooks');
    let out = aquila(root, 'check');
    assert.equal(out.code, 1, out.out);
    assert.match(out.out, /core\.hooksPath \.aquila\/githooks resolves from the repository root/);
    git(top, 'config', 'core.hooksPath', DISPATCHER);

    // Dispatcher without this project registered.
    writeFileSync(join(top, DISPATCHER, 'projects'), 'other\taquila-ai\n');
    out = aquila(root, 'check');
    assert.equal(out.code, 1);
    assert.match(out.out, /backend is not registered in \.aquila-hooks\/projects/);
    assert.match(out.out, /cannot find other\/node_modules\/aquila-ai\/bin\/aquila\.mjs/);
    writeFileSync(join(top, DISPATCHER, 'projects'), 'backend\taquila-next-ai\n');

    // Dispatcher replaced by something else.
    writeFileSync(join(top, DISPATCHER, 'pre-commit'), '#!/bin/sh\nexit 0\n');
    out = aquila(root, 'check');
    assert.equal(out.code, 1);
    assert.match(out.out, /\.aquila-hooks\/pre-commit is not the aquila dispatcher/);
    aquila(root, 'init', '--tools=codex', '--lint=off');

    if (process.platform !== 'win32') {
      chmodSync(join(top, DISPATCHER, 'pre-push'), 0o644);
      out = aquila(root, 'check');
      assert.equal(out.code, 1);
      assert.match(out.out, /\.aquila-hooks\/pre-push is not executable/);
      aquila(root, 'init', '--tools=codex', '--lint=off');
    }

    // Workflow inside the subfolder: GitHub never runs it.
    mkdirSync(join(root, '.github/workflows'), { recursive: true });
    writeFileSync(
      join(root, '.github/workflows/aquila-gates.yml'),
      '# Generated by `npx aquila-next-ai sync` from docs/ai/aquila.json → ci — commit it, do not edit\n',
    );
    out = aquila(root, 'check');
    assert.equal(out.code, 1);
    assert.match(out.out, /backend\/\.github\/workflows\/aquila-gates\.yml: GitHub only reads workflows/);
    const sync = aquila(root, 'sync');
    assert.match(sync.out, /removed \.github\/workflows\/aquila-gates\.yml/);
    const last = aquila(root, 'check');
    assert.equal(last.code, 0, last.out);
  } finally {
    dispose(top, ['backend']);
  }
});

test('gate ci in a subfolder filters `when` by paths relative to the project', () => {
  const top = repo(['backend']);
  const root = join(top, 'backend');
  try {
    aquila(root, 'init', '--tools=codex', '--lint=off');
    commit(top, ['README.md']);
    const base = git(top, 'rev-parse', 'HEAD');
    commit(top, ['backend/app/x.tsx']);
    const head = git(top, 'rev-parse', 'HEAD');
    editConfig(root, (cfg) => {
      cfg.gates = {
        app: { cmd: 'node -e "process.exit(0)"', when: ['app/**'] },
        lib: { cmd: 'node -e "process.exit(0)"', when: ['lib/**'] },
      };
      cfg.hooks = { ci: ['app', 'lib'] };
    });
    const event = join(top, '.event.json');
    writeFileSync(event, JSON.stringify({ before: base, after: head }));
    const r = spawnSync(process.execPath, [join(PKG, 'bin/aquila.mjs'), 'gate', 'ci'], {
      cwd: root,
      env: { ...process.env, AQUILA_ROOT: root, GITHUB_EVENT_PATH: event, GITHUB_SHA: head },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /✓ app/);
    assert.match(r.stdout, /↷ lib: no changed file matches lib\/\*\*/);
  } finally {
    dispose(top, ['backend']);
  }
});

test('packaged hooks find the project from their own location (also in a subfolder)', () => {
  for (const phase of ['pre-commit', 'pre-push']) {
    const text = readFileSync(join(PKG, 'githooks', phase), 'utf8');
    assert.match(
      text,
      new RegExp(
        `cd "\\$\\(dirname "\\$0"\\)/\\.\\./\\.\\." && exec node node_modules/aquila-next-ai/bin/aquila\\.mjs gate ${phase}`,
      ),
    );
  }
});

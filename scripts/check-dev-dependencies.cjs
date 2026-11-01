const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} = require('node:fs');
const { createRequire } = require('node:module');
const { tmpdir } = require('node:os');
const { dirname, join, relative } = require('node:path');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');

const root = createRequire(join(__dirname, '../package.json'));
const from = (parent, name) => createRequire(parent.resolve(name));
const jestConfig = from(from(from(root, 'jest'), '@jest/core'), 'jest-config');
const merge = jestConfig('deepmerge');
const typedoc = from(root, 'typedoc');
const reactNative = from(root, 'react-native');
const cli = from(
  createRequire(join(__dirname, '../example/package.json')),
  '@react-native-community/cli'
);

test('deepmerge blocks prototype poisoning from target and source shapes', () => {
  const payload = () => JSON.parse('{"__proto__":{"injected":true},"safe":1}');
  const cases = [
    () => merge(payload(), {}),
    () => merge(Object.create(null), payload()),
    () => merge(null, payload()),
    () => merge(1, payload()),
    () => merge({ session: null }, { session: payload() }).session,
    () => merge({ session: payload() }, {}).session,
    () => merge({}, { list: [payload()] }).list[0],
    () => merge({ list: [payload()] }, {}).list[0],
    () => merge.all([Object.create(null), payload()]),
  ];
  for (const run of cases) {
    const result = run();
    assert.equal(result.injected, undefined);
    assert.equal(result.safe, 1);
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(Object.hasOwn(result, '__proto__'), false);
  }
  const alternative = JSON.parse(
    '{"constructor":{"prototype":{"injected":true}}}'
  );
  assert.equal(merge({}, alternative).injected, undefined);
  assert.equal({}.injected, undefined);
});

test('Jest merging preserves arrays, symbols, atomic values, cloning and hooks', () => {
  const symbol = Symbol('config');
  const date = new Date('2026-01-01');
  const regex = /scanner/i;
  const left = {
    nested: { first: 1 },
    list: [{ left: true }],
    date,
    regex,
    [symbol]: { a: 1 },
  };
  const right = {
    nested: { second: 2 },
    list: [{ right: true }],
    [symbol]: { b: 2 },
  };
  const result = merge.all([left, right]);
  assert.deepEqual(result.nested, { first: 1, second: 2 });
  assert.deepEqual(result.list, [{ left: true }, { right: true }]);
  assert.deepEqual(result[symbol], { a: 1, b: 2 });
  assert.equal(result.date, date);
  assert.equal(result.regex, regex);
  assert.notEqual(result.list[0], left.list[0]);
  assert.deepEqual(left.nested, { first: 1 });
  assert.deepEqual(right.nested, { second: 2 });
  assert.equal(
    merge({}, { nested: left.nested }, { clone: false }).nested,
    left.nested
  );
  assert.deepEqual(
    merge(
      { nested: { a: 1 } },
      { nested: { b: 2 } },
      {
        customMerge: (key) =>
          key === 'nested' ? (_target, source) => source : undefined,
      }
    ),
    { nested: { b: 2 } }
  );
  assert.deepEqual(
    merge(
      {},
      { date },
      {
        isMergeableObject: (value) =>
          value !== date && value !== null && typeof value === 'object',
      }
    ),
    { date }
  );
  assert.throws(() => merge.all({}), /first argument should be an array/);
});

test('React Native CLI keeps its array replacement and configuration contract', () => {
  const cliConfig = from(cli, '@react-native-community/cli-config');
  const mergeConfig = cliConfig('./merge.js').default;
  const source = ['new'];
  const result = mergeConfig(
    { platforms: ['old'], nested: { a: 1 } },
    { platforms: source, nested: { b: 2 } }
  );
  assert.equal(result.platforms, source);
  assert.deepEqual(result.nested, { a: 1, b: 2 });
  assert.deepEqual(
    mergeConfig(
      { project: null },
      { project: JSON.parse('{"__proto__":{"injected":true},"ios":{}}') }
    ).project,
    { ios: {} }
  );
});

test('minimatch bounds globparts amplification and large-set preprocessing', () => {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      `
    const { Minimatch } = require(${JSON.stringify(typedoc.resolve('minimatch'))});
    const expanded = new Minimatch(Array(10).fill('**/../a/b').join('/'), {
      optimizationLevel: 2, braceExpandMax: 64,
    });
    const large = new Minimatch('{x,*}/{0..999}', { optimizationLevel: 2 });
    const ordinary = new Minimatch('**/../a/b/**/../c/d', { optimizationLevel: 2 });
    console.log(JSON.stringify({
      expanded: expanded.set.length, large: large.set.length,
      ordinary: [ordinary.match('../a/b/../c/d'), ordinary.match('x/a/b/y/c/d')],
      hidden: large.match('.hidden/5'),
    }));
  `,
    ],
    { encoding: 'utf8', timeout: 5000 }
  );
  assert.deepEqual(JSON.parse(output), {
    expanded: 64,
    large: 2000,
    ordinary: [true, true],
    hidden: false,
  });
});

test('legacy Istanbul instrumentation keeps inclusion, negation and glob APIs', async () => {
  const babelJest = from(reactNative, 'babel-jest');
  const transform = from(babelJest, '@jest/transform');
  const istanbul = from(transform, 'babel-plugin-istanbul');
  const TestExclude = istanbul('test-exclude');
  const fixture = mkdtempSync(
    join(
      process.env.SCANNER_TEST_TMPDIR || tmpdir(),
      'scanner-instrumentation-'
    )
  );
  try {
    for (const file of [
      'src/index.ts',
      'src/unit.test.ts',
      'src/keep.test.ts',
      'node_modules/pkg/index.ts',
    ]) {
      mkdirSync(dirname(join(fixture, file)), { recursive: true });
      writeFileSync(join(fixture, file), 'export const value = 1;\n');
    }
    const exclude = new TestExclude({
      cwd: fixture,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '!src/keep.test.ts'],
      extension: ['.ts'],
    });
    assert.equal(exclude.shouldInstrument(join(fixture, 'src/index.ts')), true);
    assert.equal(
      exclude.shouldInstrument(join(fixture, 'src/unit.test.ts')),
      false
    );
    assert.equal(
      exclude.shouldInstrument(join(fixture, 'src/keep.test.ts')),
      true
    );
    assert.equal(
      exclude.shouldInstrument(join(fixture, 'node_modules/pkg/index.ts')),
      false
    );
    assert.equal(
      exclude.shouldInstrument(join(fixture, '../outside.ts')),
      false
    );
    assert.deepEqual(exclude.globSync().sort(), [
      'src/index.ts',
      'src/keep.test.ts',
    ]);
    assert.deepEqual((await exclude.glob()).sort(), [
      'src/index.ts',
      'src/keep.test.ts',
    ]);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('React Native development middleware retains Edge discovery API', () => {
  const middleware = from(
    from(reactNative, '@react-native/community-cli-plugin'),
    '@react-native/dev-middleware'
  );
  assert.equal(
    typeof middleware('chromium-edge-launcher').Launcher.getFirstInstallation,
    'function'
  );
});

test('TypeDoc discovers nested, brace, extglob, hidden and explicit node_modules paths', async () => {
  const { glob } = await import(
    pathToFileURL(
      join(dirname(root.resolve('typedoc/package.json')), 'dist/node-utils.js')
    ).href
  );
  const fixture = mkdtempSync(
    join(process.env.SCANNER_TEST_TMPDIR || tmpdir(), 'scanner-typedoc-')
  );
  try {
    for (const file of [
      'src/index.ts',
      'src/nested/child.ts',
      'src/skip/ignored.ts',
      'other/other.ts',
      'src/.hidden/hidden.ts',
      'src/node_modules/pkg/dependency.ts',
    ]) {
      mkdirSync(dirname(join(fixture, file)), { recursive: true });
      writeFileSync(join(fixture, file), 'export const value = 1;\n');
    }
    const discover = (pattern, options) =>
      glob(pattern, fixture, options)
        .map((file) => relative(fixture, file).replaceAll('\\', '/'))
        .sort();
    assert.deepEqual(discover(`${fixture}/src/**/*.ts`), [
      'src/index.ts',
      'src/nested/child.ts',
      'src/skip/ignored.ts',
    ]);
    assert.deepEqual(discover(`${fixture}/{src,other}/**/*.ts`), [
      'other/other.ts',
      'src/index.ts',
      'src/nested/child.ts',
      'src/skip/ignored.ts',
    ]);
    assert.deepEqual(discover(`${fixture}/src/!(skip)/*.ts`), [
      'src/nested/child.ts',
    ]);
    assert.deepEqual(discover(`${fixture}/src/.hidden/*.ts`), [
      'src/.hidden/hidden.ts',
    ]);
    assert.deepEqual(discover(`${fixture}/src/node_modules/**/*.ts`), [
      'src/node_modules/pkg/dependency.ts',
    ]);
    assert.deepEqual(discover(`!${fixture}/src/**/*.ts`), []);
    assert.deepEqual(discover(`#${fixture}/src/**/*.ts`), []);
    assert.deepEqual(discover(`${fixture}/missing/**/*.ts`), []);
    symlinkSync('src/nested', join(fixture, 'linked'), 'dir');
    assert.deepEqual(discover(`${fixture}/linked/**/*.ts`), []);
    assert.deepEqual(
      discover(`${fixture}/linked/**/*.ts`, { followSymlinks: true }),
      ['linked/child.ts']
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

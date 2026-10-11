import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, dist, work, reset, command, json, save, makeVictim, install } from './common.mjs';

export function setup() {
  reset(dist);
  reset(work);
  writeFileSync(join(dist, 'empty.npmrc'), '');
  writeFileSync(join(dist, 'empty-global.npmrc'), '');
  assert.deepEqual(readFileSync(join(root, 'packages/axios-clean/index.js')),
    readFileSync(join(root, 'packages/axios-compromised/index.js')));
  const cleanManifest = json(join(root, 'packages/axios-clean/package.json'));
  const compromisedManifest = json(join(root, 'packages/axios-compromised/package.json'));
  assert.deepEqual(compromisedManifest, { ...cleanManifest, version: '1.14.1',
    dependencies: { 'plain-crypto-js': 'file:../../dist/plain-crypto-js-4.2.1.tgz' } });
  function pack(cwd) {
    const output = command('npm', ['pack', '--offline', '--ignore-scripts', '--json',
      '--pack-destination', dist], cwd, false);
    const [{ filename }] = JSON.parse(output);
    console.log(`Packed ${filename} (local npm pack)`);
  }
  pack(join(root, 'packages/plain-crypto-js'));
  pack(join(root, 'packages/axios-clean'));
  // An absolute local tarball spec avoids npm's relative transitive-file ambiguity.
  const stage = join(dist, 'staging');
  mkdirSync(stage);
  const manifest = json(join(root, 'packages/axios-compromised/package.json'));
  manifest.dependencies['plain-crypto-js'] = `file:${join(dist, 'plain-crypto-js-4.2.1.tgz')}`;
  save(join(stage, 'package.json'), manifest);
  copyFileSync(join(root, 'packages/axios-compromised/index.js'), join(stage, 'index.js'));
  pack(stage);
  rmSync(stage, { recursive: true });
  const clean = makeVictim('clean', 'axios-demo-1.14.0.tgz');
  install(clean, false, false);
  command(process.execPath, ['app.cjs'], clean, false);
  assert.deepEqual(Object.keys(json(join(clean, 'node_modules/axios-demo/package.json')).dependencies || {}), []);
  assert.equal(existsSync(join(clean, 'node_modules/plain-crypto-js')), false);
  console.log('Clean baseline verified; application code is byte-for-byte identical.');
  console.log('Ready. Run npm run demo:all');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) setup();

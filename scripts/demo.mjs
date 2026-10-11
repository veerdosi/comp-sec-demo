import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, dist, work, proofText, json, save, makeVictim, install, command } from './common.mjs';

export function runDemo() {
  const start = performance.now();
  assert.ok(existsSync(join(dist, 'axios-demo-1.14.1.tgz')), 'Run npm run setup first');
  console.log('LOCAL AXIOS SUPPLY-CHAIN DEMO | harmless, offline');
  const reports = [];
  for (const [name, blocked] of [['vulnerable', false], ['protected', true]]) {
    console.log(`\n${name.toUpperCase()} | .demo/${name}`);
    const cwd = makeVictim(name, 'axios-demo-1.14.1.tgz');
    const log = install(cwd, blocked);
    const tree = JSON.parse(command('npm', ['ls', '--all', '--json', '--offline'], cwd, false));
    assert.equal(tree.dependencies['axios-demo'].dependencies['plain-crypto-js'].version, '4.2.1');
    const dependency = join(cwd, 'node_modules/plain-crypto-js');
    const parent = json(join(cwd, 'node_modules/axios-demo/package.json'));
    assert.equal(parent.version, '1.14.1');
    assert.deepEqual(parent.dependencies, {
      'plain-crypto-js': `file:${join(dist, 'plain-crypto-js-4.2.1.tgz')}`
    });
    assert.equal(json(join(dependency, 'package.json')).scripts.postinstall, 'node postinstall.js');
    for (const file of ['package.json', 'index.js', 'postinstall.js']) {
      assert.deepEqual(readFileSync(join(dependency, file)),
        readFileSync(join(root, 'packages/plain-crypto-js', file)));
    }
    assert.deepEqual(readFileSync(join(cwd, 'node_modules/axios-demo/index.js')),
      readFileSync(join(root, 'packages/axios-clean/index.js')));
    const proof = join(dependency, 'PROOF_OF_EXECUTION.txt');
    assert.equal(existsSync(proof), !blocked);
    assert.equal(log.includes('[postinstall] Harmless proof file created'), !blocked);
    if (!blocked) assert.equal(readFileSync(proof, 'utf8'), proofText);
    const lock = json(join(cwd, 'package-lock.json'));
    for (const entry of Object.values(lock.packages)) {
      if (entry.resolved) assert.ok(entry.resolved.startsWith('file:'), 'Only local resolution allowed');
    }
    console.log('Verified: axios-demo@1.14.1 -> plain-crypto-js@4.2.1 installed');
    console.log(blocked ? 'Verified: postinstall blocked; proof file ABSENT' :
      'Verified: postinstall executed; proof file CREATED');
    command('node', ['app.cjs'], cwd);
    reports.push({ name, proofExists: existsSync(proof),
      axiosIntegrity: lock.packages['node_modules/axios-demo'].integrity,
      dependencyIntegrity: lock.packages['node_modules/plain-crypto-js'].integrity });
  }
  for (const key of ['axiosIntegrity', 'dependencyIntegrity']) {
    assert.ok(reports[0][key]);
    assert.equal(reports[0][key], reports[1][key], 'Both installs must use identical tarballs');
  }
  save(join(work, 'results.json'), reports);
  console.log(`\nPASS: same packages, different lifecycle policy. ${((performance.now() - start) / 1000).toFixed(1)}s`);
  return reports;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) runDemo();

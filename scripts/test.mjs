import assert from 'node:assert/strict';
import { writeFileSync, existsSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from './setup.mjs';
import { runDemo } from './demo.mjs';
import { root, work, command, json } from './common.mjs';

setup();
for (let run = 1; run <= 2; run++) {
  if (run === 2) {
    // Seed stale artifacts: the next run must remove them, even in protected mode.
    for (const name of ['vulnerable', 'protected']) {
      writeFileSync(join(work, name, 'STALE.txt'), 'must disappear');
      writeFileSync(join(work, name, 'node_modules/plain-crypto-js/PROOF_OF_EXECUTION.txt'), 'stale proof');
    }
  }
  const reports = runDemo();
  assert.deepEqual(reports.map(result => result.proofExists), [true, false]);
  for (const name of ['vulnerable', 'protected']) assert.equal(existsSync(join(work, name, 'STALE.txt')), false);
  console.log(`Repeat verification ${run}/2 passed`);
}
console.log('PASS: clean baseline, vulnerable, protected, identical tarballs, and stale-artifact cleanup.');
// npm file specs need raw spaces, not percent-encoded file URLs.
const temporary = mkdtempSync(join(tmpdir(), 'sc3010-'));
try {
  const relocated = join(temporary, 'project with spaces');
  cpSync(root, relocated, { recursive: true,
    filter: path => !['dist', '.demo', 'node_modules'].includes(basename(path)) });
  command('npm', ['run', 'setup'], relocated, false);
  command('npm', ['run', 'demo:all'], relocated, false);
  assert.deepEqual(json(join(relocated, '.demo/results.json')).map(result => result.proofExists), [true, false]);
  console.log('PASS: project relocation to a path containing spaces.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

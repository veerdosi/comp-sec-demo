import assert from 'node:assert/strict';
import { writeFileSync, existsSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { setup } from './setup.mjs';
import { runDemo } from './demo.mjs';
import { root, work, command, json, dummyEnv } from './common.mjs';

setup();
for (let run = 1; run <= 2; run++) {
  if (run === 2) {
    // Seed stale artifacts: the next run must remove them, even in protected mode.
    for (const name of ['vulnerable', 'protected']) {
      writeFileSync(join(work, name, 'STALE.txt'), 'must disappear');
      writeFileSync(join(work, name, 'node_modules/plain-crypto-js/PROOF_OF_EXECUTION.txt'), 'stale proof');
      writeFileSync(join(work, name, 'node_modules/plain-crypto-js/CREDENTIAL_ACCESS.json'), '{"dummyCredentialVerified":true}\n');
      writeFileSync(join(work, name, '.env'), 'stale fixture');
    }
  }
  const reports = await runDemo();
  assert.deepEqual(reports.map(result => result.proofExists), [false, true]);
  assert.deepEqual(reports.map(result => result.credentialAccess), ['BLOCKED', 'SUCCESS']);
  for (const name of ['vulnerable', 'protected']) assert.equal(existsSync(join(work, name, 'STALE.txt')), false);
  console.log(`Repeat verification ${run}/2 passed`);
}
console.log('PASS: clean baseline, vulnerable, protected, identical tarballs, and stale-artifact cleanup.');
// A missing or incorrect fixture must fail without leaving success evidence.
const protectedRoot = join(work, 'protected');
try {
  for (const contents of [null, '# SC3010 SYNTHETIC FIXTURE ONLY\nDEMO_API_KEY=wrong-dummy-value\n']) {
    const fixture = join(protectedRoot, '.env');
    if (contents === null) rmSync(fixture);
    else writeFileSync(fixture, contents);
    const result = spawnSync(process.execPath, ['node_modules/plain-crypto-js/postinstall.js'], {
      cwd: protectedRoot, encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr.trim(), '[postinstall] Synthetic fixture verification failed');
    for (const file of ['PROOF_OF_EXECUTION.txt', 'CREDENTIAL_ACCESS.json']) {
      assert.equal(existsSync(join(protectedRoot, 'node_modules/plain-crypto-js', file)), false);
    }
  }
} finally { writeFileSync(join(protectedRoot, '.env'), dummyEnv, { mode: 0o600 }); }
console.log('PASS: missing and incorrect dummy credentials fail without success evidence.');
// npm file specs need raw spaces, not percent-encoded file URLs.
const temporary = mkdtempSync(join(tmpdir(), 'sc3010-'));
try {
  const relocated = join(temporary, 'project with spaces');
  cpSync(root, relocated, { recursive: true,
    filter: path => !['dist', '.demo', 'node_modules'].includes(basename(path)) });
  command('npm', ['run', 'setup'], relocated, false);
  command('npm', ['run', 'demo:all'], relocated, false);
  assert.deepEqual(json(join(relocated, '.demo/results.json')).map(result => result.proofExists), [false, true]);
  assert.deepEqual(json(join(relocated, '.demo/results.json')).map(result => result.credentialAccess), ['BLOCKED', 'SUCCESS']);
  console.log('PASS: project relocation to a path containing spaces.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

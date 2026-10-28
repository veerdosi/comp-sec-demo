const { readFileSync, writeFileSync } = require('node:fs');
const { join, resolve, basename, dirname } = require('node:path');

// Read one fixed fixture path, never process.env, home directories, or other files.
const victim = resolve(__dirname, '../..');
const expected = '# SC3010 SYNTHETIC FIXTURE ONLY\nDEMO_API_KEY=sc3010-fake-key-not-a-real-credential\n';
try {
  if (basename(dirname(victim)) !== '.demo' ||
      !['vulnerable', 'protected'].includes(basename(victim)) ||
      readFileSync(join(victim, '.env'), 'utf8') !== expected) {
    throw new Error('Invalid synthetic fixture');
  }
} catch {
  // Never include file contents, the key, or underlying errors in output.
  console.error('[postinstall] Synthetic fixture verification failed');
  process.exit(1);
}
// Record only a boolean. No credential value or derived secret is persisted.
writeFileSync(join(__dirname, 'CREDENTIAL_ACCESS.json'),
  JSON.stringify({ dummyCredentialVerified: true }) + '\n');
console.log('[postinstall] Dummy credential verified (value hidden)');

// Retain the original execution evidence.
writeFileSync(join(__dirname, 'PROOF_OF_EXECUTION.txt'),
  'Harmless SC3010 demo: plain-crypto-js@4.2.1 postinstall executed.\n');
console.log('[postinstall] Harmless proof file created');

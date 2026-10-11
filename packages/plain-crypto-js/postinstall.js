const { writeFileSync } = require('node:fs');
const { join } = require('node:path');

// Write only inside this installed package, using no credentials or network.
writeFileSync(join(__dirname, 'PROOF_OF_EXECUTION.txt'),
  'Harmless SC3010 demo: plain-crypto-js@4.2.1 postinstall executed.\n');
console.log('[postinstall] Harmless proof file created');

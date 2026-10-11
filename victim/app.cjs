const assert = require('node:assert/strict');
const axios = require('axios-demo');

async function main() {
  const response = await axios.get('/course');
  assert.deepEqual(response, {
    status: 200,
    data: { course: 'SC3010', message: 'Application still works' }
  });
  console.log('Application still works: SC3010, status 200');
}
main().catch(error => { console.error(error); process.exitCode = 1; });

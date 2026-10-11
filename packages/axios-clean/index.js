// An Axios-shaped API with a local fixture; never opens a network connection.
exports.get = async function get(url) {
  if (url !== '/course') throw new Error('Only the local /course fixture exists');
  return { status: 200, data: { course: 'SC3010', message: 'Application still works' } };
};

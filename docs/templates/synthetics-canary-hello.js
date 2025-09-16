const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const canary = async function () {
  const request = require('request-promise-native');
  const url = process.env.TARGET_URL || 'https://example.com/healthz';
  const res = await request({ uri: url, resolveWithFullResponse: true, simple: false, timeout: 5000 });
  log.info(`GET ${url} -> ${res.statusCode}`);
  if (res.statusCode < 200 || res.statusCode >= 400) {
    throw new Error(`Unhealthy status: ${res.statusCode}`);
  }
};

exports.handler = async () => { return await canary(); };


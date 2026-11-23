// Use Electron's network stack when running inside the app (it honors the
// Windows proxy settings); fall back to Node's fetch for tests.
let electronNet = null;
try { const e = require('electron'); if (e && typeof e === 'object' && e.net) electronNet = e.net; } catch {}

module.exports = function httpFetch(url, opts) {
  return electronNet ? electronNet.fetch(url, opts) : fetch(url, opts);
};

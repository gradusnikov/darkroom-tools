const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
function harness(failInstall = false) {
  const scope = 'https://example.test/darkroom-tools/';
  const handlers = {}, contents = new Map(), deleted = [], keys = ['other-app-v1', 'darkroom-tools-v1', 'darkroom-tools-v2', 'darkroom-tools-v3', 'darkroom-tools-v4'];
  let activated = false, claimed = false, fetched = 0;
  const cache = {
    async addAll(requests) {
      if (failInstall) throw Error('offline');
      for (const req of requests) { assert.equal(req.cache, 'reload'); contents.set(req.url, new Response(req.url)); }
    },
    async match(request) {return contents.get(typeof request === 'string' ? request : request.url);}
  };
  vm.runInNewContext(source, {
    URL, Request, Set,
    self: {registration:{scope}, addEventListener:(name, handler) => handlers[name] = handler,
      skipWaiting:async () => {assert.equal(contents.size, 8); activated = true;},
      clients:{claim:async () => {claimed = true;}}},
    caches:{open:async () => cache, keys:async () => keys, delete:async name => deleted.push(name)},
    fetch:async () => {fetched++; throw Error('offline');}
  });
  const lifetime = name => new Promise((resolve, reject) => handlers[name]({waitUntil:p => p.then(resolve, reject)}));
  const fetchRequest = (url, mode = 'cors', method = 'GET') => {
    let promise;
    handlers.fetch({request:{url, mode, method}, respondWith:p => promise = p});
    return promise;
  };
  return {contents, deleted, lifetime, fetchRequest, scope, state:() => ({activated, claimed, fetched})};
}
test('installation precaches every local runtime asset before activation', async () => {
  const h = harness(); await h.lifetime('install');
  assert.equal(h.state().activated, true);
  for (const path of ['index.html','js/app.js','js/data.js','js/math.js','manifest.json','icon.svg','icon-192.png','icon-512.png']) {
    assert.ok(h.contents.has(h.scope + path));
    assert.ok(fs.existsSync(require('node:path').join(__dirname, '..', path)));
  }
});
test('failed installation cannot replace a working worker', async () => {
  const h = harness(true);
  await assert.rejects(h.lifetime('install'), /offline/);
  assert.equal(h.state().activated, false);
});
test('activation preserves caches owned by other applications', async () => {
  const h = harness(); await h.lifetime('activate');
  assert.deepEqual(h.deleted, ['darkroom-tools-v1', 'darkroom-tools-v2', 'darkroom-tools-v3']); assert.equal(h.state().claimed, true);
});
test('root and index navigation, including query strings, work offline', async () => {
  const h = harness(); await h.lifetime('install');
  for (const suffix of ['', '?installed=1', 'index.html', 'index.html?installed=1']) {
    const response = await h.fetchRequest(h.scope + suffix, 'navigate');
    assert.equal(await response.clone().text(), h.scope + 'index.html');
  }
  assert.equal(h.state().fetched, 0);
});
test('only GET app requests are intercepted; misses reject instead of returning undefined', async () => {
  const h = harness();
  assert.equal(h.fetchRequest('https://fonts.googleapis.com/css'), undefined);
  assert.equal(h.fetchRequest('https://example.test/other-app/index.html', 'navigate'), undefined);
  assert.equal(h.fetchRequest(h.scope + 'index.html', 'cors', 'POST'), undefined);
  assert.equal(h.fetchRequest(h.scope + 'unrelated.pdf'), undefined);
  await assert.rejects(h.fetchRequest(h.scope + 'js/math.js'), /offline/);
});

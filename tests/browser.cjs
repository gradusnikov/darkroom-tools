// Optional end-to-end checks: npm install, npx playwright install chromium, npm run test:browser.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const prefix = '/darkroom-tools/';
const errors = [];
const server = http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = pathname.slice(prefix.length) || 'index.html';
  if (!pathname.startsWith(prefix) || file.includes('..')) { res.writeHead(404).end(); return; }
  try {
    const body = await fs.readFile(path.join(root, file));
    const mime = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png'};
    res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'text/plain', 'Cache-Control':'no-store'}).end(body);
  } catch {res.writeHead(404).end();}
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {})});
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const view = name => page.click(`.tab-btn[data-view="${name}"]`);
    const text = id => page.locator('#' + id).textContent();
    const value = id => page.locator('#' + id).inputValue();
    const fill = (id, value) => page.fill('#' + id, String(value));
    const select = (id, value) => page.selectOption('#' + id, value);
    await page.goto(base);
    await page.waitForFunction(() => typeof window.devtimeCalculate === 'function');
    assert.deepEqual(errors, []);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, {once:true}));
    });
    assert.match(await text('offline-status'), /Available offline/);
    console.log('PASS: all calculators initialize, first-load shell cached');

    await view('exposure');
    await select('exp-paperType', 'ilford');
    await select('exp-colorHeadType', 'meochrom1');
    assert.equal(await page.locator('#exp-updatedFilterGrade option[value="4.5"]').isDisabled(), true);
    assert.equal(await page.locator('#exp-updatedFilterGrade option[value="5"]').count(), 0);
    await fill('exp-updatedM', 180);
    assert.match(await text('exp-error'), /between 0 and 150/);
    assert.equal(await text('exp-updatedTime'), '—');
    await fill('exp-updatedM', -1);
    assert.match(await text('exp-error'), /between/);
    await fill('exp-updatedM', 0);
    await fill('exp-existingTime', '');
    assert.match(await text('exp-error'), /finite/);
    await fill('exp-existingTime', 10);
    console.log('PASS: filter ranges and invalid-result clearing');

    await view('fstop'); await fill('fstop-baseTime', 10); await select('fstop-dryDown', '0.1');
    assert.equal(await page.locator('.row-zero .time-link').textContent(), '9');
    await page.locator('.row-zero .time-link').click();
    assert.equal(await page.locator('.row-zero .time-link').textContent(), '9');
    assert.equal(Number(await value('fstop-baseTime')), 10);
    await fill('fstop-baseTime', -1); assert.match(await text('fstop-error'), /greater than zero/);
    assert.equal(await page.locator('#fstop-tbody tr').count(), 0);
    await fill('fstop-baseTime', 10);
    console.log('PASS: dry-down applies once and negative time rejected');

    await view('enlarger');
    await fill('enlg-initialWidth', 8); await fill('enlg-targetWidth', 16); await fill('enlg-initialExposure', 10);
    const exposure = await text('enlg-targetExposure');
    await select('enlg-unit', 'cm');
    assert.equal(Number(await value('enlg-initialWidth')), 20.32);
    assert.equal(await text('enlg-targetExposure'), exposure);
    await select('enlg-unit', 'inches');
    assert.equal(Number(await value('enlg-targetWidth')), 16);
    assert.equal(await text('enlg-targetExposure'), exposure);
    await fill('enlg-negativeWidth', 24); assert.equal(await value('enlg-negativeType'), 'custom');
    console.log('PASS: enlarger units and custom negative dimensions');

    await view('placement'); await select('plc-mode', 'geometric'); await fill('plc-mountWidth', 401);
    assert.equal((await text('plc-results')).match(/100\.5 mm/g).length, 2);
    await fill('plc-mountWidth', 401.123456);
    const original = await value('plc-mountWidth');
    for (let i = 0; i < 5; i++) {await select('plc-unit', 'in'); await select('plc-unit', 'mm');}
    assert.ok(Math.abs(Number(await value('plc-mountWidth')) - Number(original)) < 1e-10);
    await select('plc-unit', 'in'); await page.reload();
    await select('plc-unit', 'mm');
    assert.ok(Math.abs(Number(await value('plc-mountWidth')) - Number(original)) < 1e-10);
    await fill('plc-verticalOffset', 300);
    assert.match(await text('plc-error'), /outside/); assert.equal(await text('plc-results'), '');
    await fill('plc-verticalOffset', 0);
    console.log('PASS: placement precision, unit persistence and offset bounds');

    await view('nomogram'); await select('nom-lens', '50');
    await page.locator('#nom-s1').fill('1'); await page.locator('#nom-s2').fill('50');
    assert.equal(await text('nom-k-value'), '35.000');
    await fill('nom-easel-height', 2); assert.match(await text('nom-error'), /Corrected test position/);
    assert.equal(await text('nom-corrected-time'), '—');
    await fill('nom-easel-height', 0);
    await page.locator('#nom-s1').fill('20'); await page.locator('#nom-s2').fill('20');
    await fill('nom-time', 10); await select('nom-aperture', '8'); await select('nom-target-aperture', '16');
    assert.equal(await text('nom-corrected-time'), '40.0');
    console.log('PASS: full-range nomogram, easel bounds and aperture ratio');

    await view('developer'); await select('dev-chemical', 'ddx'); await fill('dev-totalVol', 500);
    assert.equal(await text('dev-weight'), '130.0');
    await select('dev-chemical', 'rodinal');
    assert.equal(await value('dev-density'), ''); assert.equal(await text('dev-weight'), '—');
    assert.match(await text('dev-vol'), /ml/);
    await fill('dev-density', 1.13); assert.notEqual(await text('dev-weight'), '—');
    await fill('dev-partB', -1); assert.match(await text('dev-error'), /Water parts/);
    assert.equal(await text('dev-weight'), '—'); await fill('dev-partB', 50);
    console.log('PASS: sourced DD-X density, optional measured density and invalid dilution');

    await view('devtime'); await select('dt-film', 'trix'); await select('dt-developer', 'rodinal');
    await select('dt-recipe', '400'); assert.equal(await text('dt-res-final'), '7:00');
    await fill('dt-baseTime', 10); assert.equal(await value('dt-mode'), 'custom');
    assert.equal(await text('dt-res-final'), '10:00');
    assert.equal(await page.locator('#dt-recipe-row').isVisible(), false);
    assert.equal(await page.locator('#dt-pushpull-controls').isVisible(), true);
    await select('dt-mode', 'recipe'); await select('dt-recipe', '3200');
    assert.equal(Number(await value('dt-refTemp')), 20.5);
    await select('dt-film', 'fp4'); await select('dt-developer', 'rodinal50');
    assert.match(await page.locator('#dt-recipe option[value="250"]').textContent(), /\+1 stops/);
    assert.equal(await page.locator('#dt-recipe option[value="500"]').count(), 0);
    await select('dt-recipe', '250'); assert.equal(await text('dt-res-final'), '26:00');
    await fill('dt-baseTime', 8); await fill('dt-actualTemp', 24);
    assert.equal(await text('dt-res-final'), '5:30');
    await select('dt-temp-model', 'q10'); assert.equal(await text('dt-res-final'), '6:04');
    await fill('dt-factor', 0); await page.locator('#dt-pushpull-presets button').filter({hasText:'+1 stop'}).click();
    assert.equal(await text('dt-res-pushpull'), '8:00');
    await page.reload(); assert.equal(await value('dt-mode'), 'custom');
    assert.equal(await text('dt-res-final'), '6:04');
    console.log('PASS: exact recipe EI, actual recipe temperature, custom edits and both temperature models');

    // Installed shell must survive offline navigation to both hosting URLs immediately after first load.
    await context.setOffline(true);
    await page.goto(base + 'index.html#devtime');
    assert.equal(await text('dt-res-final'), '6:04');
    await page.goto(base + '#nomogram');
    assert.equal(await text('nom-corrected-time'), '40.0');
    console.log('PASS: offline root and index.html navigation with all scripts');
    await context.setOffline(false);
    await page.setViewportSize({width:390,height:844});
    for (const name of ['exposure','fstop','enlarger','placement','nomogram','developer','devtime']) {
      await view(name);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: horizontal overflow`);
    }
    if (process.env.SCREENSHOT_DIR) {
      await fs.mkdir(process.env.SCREENSHOT_DIR, {recursive:true});
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, 'development-mobile.png'), fullPage:true});
      await view('nomogram'); await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR, 'nomogram-mobile.png'), fullPage:true});
    }
    assert.deepEqual(errors, []);
    console.log('PASS: mobile layouts and no uncaught browser errors');

    const legacyContext = await browser.newContext();
    const legacy = await legacyContext.newPage();
    legacy.on('pageerror', e => errors.push(e.message));
    await legacy.addInitScript(() => {
      localStorage.setItem('darkroom_exposure', JSON.stringify({paperType:'ilford',colorHeadType:'meochrom1',updatedFilterGrade:'5',updatedM:'150',updatedY:'0',existingTime:'10',existingY:'0',existingM:'0'}));
      localStorage.setItem('darkroom_developer', JSON.stringify({chemical:'ddx',density:'1.03',partA:'1',partB:'4',totalVol:'500'}));
      localStorage.setItem('darkroom_devtime', JSON.stringify({film:'fp4',developer:'rodinal50',pushPull:2,baseTime:'15',refTemp:'24'}));
      localStorage.setItem('darkroom_nomogram', JSON.stringify({lens:'50',s1:'1',s2:'50',rParam:'14',time:'10',aperture:'8',targetAperture:'8'}));
    });
    await legacy.goto(base);
    assert.equal(await legacy.locator('#exp-updatedFilterGrade').inputValue(), 'custom');
    assert.equal(await legacy.locator('#dev-density').inputValue(), '1.3');
    assert.equal(await legacy.locator('#dt-refTemp').inputValue(), '20');
    assert.equal(await legacy.locator('#dt-recipe').inputValue(), '125');
    await legacy.click('.tab-btn[data-view="nomogram"]');
    assert.equal(await legacy.locator('#nom-k-value').textContent(), '35.000');
    await legacyContext.close();
    console.log('PASS: migration discards misleading legacy grades, densities, stop keys and r calibration');

    const restrictedContext = await browser.newContext();
    const restricted = await restrictedContext.newPage();
    restricted.on('pageerror', e => errors.push(e.message));
    await restricted.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {get() {throw new DOMException('Blocked', 'SecurityError');}});
    });
    await restricted.goto(base);
    await restricted.click('.tab-btn[data-view="devtime"]');
    assert.equal(await restricted.locator('#dt-res-final').textContent(), '7:00');
    await restrictedContext.close();
    assert.deepEqual(errors, []);
    console.log('PASS: calculations work when storage access is blocked');
  } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;}).finally(() => server.close());

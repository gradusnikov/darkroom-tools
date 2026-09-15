const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/math.js');
const D = require('../js/data.js');
const near = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

test('f-stop progression and dry-down rebasing', () => {
  near(M.fstopTime(10, 1), 20);
  near(M.fstopTime(10, 3 / 3), 20);
  near(M.fstopTime(10, -1), 5);
  let base = 10;
  for (let i = 0; i < 20; i++) base = M.uncorrectedBase(M.fstopTime(base, 0, 0.1), 0.1);
  near(base, 10);
  near(M.fstopTime(M.uncorrectedBase(18, .1), 0, .1), 18);
  let cumulative = 0, previous = 0;
  for (let i = -3; i <= 6; i++) {
    const time = M.fstopTime(10, i / 3, .1);
    cumulative += time - previous; previous = time;
    near(cumulative, time);
  }
});
test('filter identity, interpolation, reverse corrections and supported ranges', () => {
  near(M.exposure(10, 'meochrom2', 0, 0, 0, 0), 10);
  near(M.exposure(10, 'meochrom2', 0, 0, 0, 15), 12.15);
  for (const head of Object.keys(D.filterFactors)) {
    for (const m of [0, 15, 70, 150]) {
      const forward = M.exposure(10, head, 50, 10, 0, m);
      near(M.exposure(forward, head, 0, m, 50, 10), 10);
    }
  }
  assert.throws(() => M.filterFactor('meochrom1', 180, 1), RangeError);
  assert.throws(() => M.filterFactor('meochrom2', -1, 0), RangeError);
  assert.equal(D.filterSettings.ilford['5'], undefined);
  assert.deepEqual(D.filterSettings.ilford['4.5'], {Y: 0, M: 200});
});
test('Ilford presets match the supplied single-filter Meopta column', () => {
  const reference = [
    ['00', 150, 0], ['0', 90, 0], ['0.5', 70, 0], ['1', 55, 0],
    ['1.5', 30, 0], ['2', 0, 0], ['2.5', 0, 20], ['3', 0, 40],
    ['3.5', 0, 65], ['4', 0, 85], ['4.5', 0, 200]
  ];
  assert.deepEqual(D.filterSettings.ilford,
    Object.fromEntries(reference.map(([grade, Y, M]) => [grade, {Y, M}])));
});
test('cyan ND correction uses head factors, interpolates and combines with yellow/magenta', () => {
  near(M.exposure(10, 'meochrom1', 0, 0, 0, 0, 0, 100), 15);
  near(M.exposure(10, 'meochrom2', 0, 0, 0, 0, 0, 100), 16);
  near(M.exposure(10, 'meochrom2', 0, 0, 0, 0, 0, 15), 11.3);
  near(M.exposure(10, 'meochrom2', 0, 0, 0, 0, 100, 0), 6.25);
  near(M.exposure(10, 'meochrom2', 0, 0, 10, 10, 0, 10), 10 * 1.05 * 1.15 * 1.09);
  for (const head of Object.keys(D.filterFactors)) {
    near(M.exposure(10, head, 50, 10, 0, 70, 100, 100), M.exposure(10, head, 50, 10, 0, 70));
    const forward = M.exposure(10, head, 50, 10, 0, 70, 15, 150);
    near(M.exposure(forward, head, 0, 70, 50, 10, 150, 15), 10);
    const max = head === 'meochrom1' ? 150 : 180;
    near(M.filterFactor(head, max, 2), head === 'meochrom1' ? 1.65 : 1.86);
    for (const invalid of [-1, max + 1, NaN, Infinity]) {
      assert.throws(() => M.exposure(10, head, 0, 0, 0, 0, invalid, 0), RangeError);
      assert.throws(() => M.exposure(10, head, 0, 0, 0, 0, 0, invalid), RangeError);
    }
  }
});
test('magnification correction: independent worked example and invariant units', () => {
  // 36 mm negative: 180 mm print (5×) to 396 mm print (11×) doubles lens-image distance.
  near(M.enlargement(10, 180, 396, 36).time, 40);
  near(M.enlargement(10, 180 / 25.4, 396 / 25.4, 36 / 25.4).time, 40);
  near(M.enlargement(40, 396, 180, 36).time, 10);
});
test('placement symmetry, sub-mm precision, conservation and offset bounds', () => {
  const p = M.placement(401, 500, 200, 300, 'geometric');
  near(p.left, 100.5); near(p.right, 100.5);
  near(p.left + 200 + p.right, 401); near(p.top + 300 + p.bottom, 500);
  const optical = M.placement(400, 500, 200, 300, 'optical');
  near(optical.top, 75); near(optical.bottom, 125);
  near(M.placement(400, 500, 200, 300, 'optical', 75).top, 0);
  assert.throws(() => M.placement(400, 500, 200, 300, 'optical', 100));
  assert.throws(() => M.placement(400, 500, 200, 300, 'optical', -126));
});
test('dilution preserves volume, uses sourced concentrate densities and allows unknown density', () => {
  const r = M.dilution(1, 25, 260, D.chemicals.rodinal.density);
  near(r.concentrate, 10); near(r.water, 250); near(r.concentrateMass, 13.86);
  near(r.totalMass, 263.41);
  near(M.dilution(1, 10, 550, D.chemicals.fomadon_lqn.density).concentrateMass, 57.5);
  near(M.dilution(1, 19, 500, D.chemicals.fomacitro.density).concentrateMass, 30);
  near(M.dilution(1, 5, 600, D.chemicals.fomafix.density).concentrateMass, 130);
  near(M.dilution(1, 4, 500, D.chemicals.vinegar10.density).concentrateMass, 101);
  assert.equal(M.dilution(1, 50, 500).concentrateMass, null);
  near(M.dilution(1, 0, 500).water, 0);
  assert.throws(() => M.dilution(1, -1, 500, 1));
  assert.throws(() => M.dilution(0, 1, 500, 1));
  for (const c of Object.values(D.chemicals)) assert.ok(c.density === null || c.source);
});
test('recipe indices and temperatures retain their actual meaning', () => {
  near(M.exposureStops(250, 125), 1); near(M.exposureStops(500, 125), 2);
  near(M.exposureStops(200, 125), 0.6780719051126377);
  const fp4 = D.films.fp4.developers.rodinal50.recipes;
  assert.equal(fp4.find(r => r.minutes === 26).ei, 250);
  assert.equal(fp4.find(r => r.ei === 500), undefined);
  assert.equal(D.films.trix.developers.rodinal.recipes.find(r => r.ei === 3200).temperature, 20.5);
  assert.equal(D.films.hp5.developers.rodinal.recipes.find(r => r.ei === 3200).temperature, 21);
  for (const f of Object.values(D.films)) for (const d of Object.values(f.developers)) {
    for (const r of d.recipes) {
      assert.ok(r.ei > 0 && r.minutes > 0 && r.temperature > 0);
      assert.ok(r.sourceLabel && r.format && r.agitation);
      if (r.sourceStatus === 'manufacturer') assert.ok(r.source && r.format !== 'Not recorded' && r.agitation !== 'Not recorded');
    }
  }
  near(M.pushPull(10, 0, 33), 10); near(M.pushPull(10, 2, 0), 10);
  near(M.pushPull(M.pushPull(10, 2, 33), -2, 33), 10);
});
test('Ilford published temperature examples and reversible interpolation', () => {
  near(M.temperature(8, 20, 24), 5.5);
  near(M.temperature(10, 20, 24), 7);
  near(M.temperature(8, 20, 18), 9.75);
  near(M.temperature(5.5, 24, 20), 8);
  for (const t of [4, 5.25, 8, 12.67, 25]) for (const temp of [18, 19.5, 21.75, 24]) {
    near(M.temperature(M.temperature(t, 20, temp), temp, 20), t, 1e-8);
  }
  assert.throws(() => M.temperature(8, 20, 26));
  assert.throws(() => M.temperature(33, 20, 24));
  near(M.temperature(33, 20, 20), 33); // no correction does not require a chart lookup
  near(M.temperature(8, 20, 24, 'q10'), 6.062866266041593);
});
test('nomogram matches manual examples within chart-reading precision', () => {
  // Manual pp.13–15: 80 mm, 19→45: k≈4; 22→18 on 2 cm easel: k≈0.7;
  // 50 mm, 8→13 on an already compensated column: k≈1.5.
  near(M.nomogram('80', 19, 45), 4, .12);
  near(M.nomogram('80', 22, 18, 2), .7, .025);
  near(M.nomogram('50', 8, 13), 1.5, .05);
  near(M.nomogram('50', 1, 50), 35, 1);
  // Further independently read chart points across the range, not just one fit.
  near(M.nomogram('50', 4, 50), 14.5, 1);
  near(M.nomogram('50', 20, 50), 3.75, .2);
  near(M.nomogram('80', 13, 50), 10, .5);
  near(M.nomogram('80', 30, 50), 2.4, .15);
  for (const lens of ['50', '80']) {
    near(M.nomogram(lens, 20, 20), 1);
    near(M.nomogram(lens, 20, 35) * M.nomogram(lens, 35, 20), 1);
    near(M.nomogram(lens, 20, 35) * M.nomogram(lens, 35, 48), M.nomogram(lens, 20, 48));
  }
  assert.throws(() => M.nomogram('80', 12, 40, 2));
  near(M.apertureFactor(8, 16), 4);
});
test('reject nonfinite inputs, empty-value sentinels, overflow and invalid domains', () => {
  for (const v of [NaN, Infinity, -Infinity, 0, -1]) {
    assert.throws(() => M.enlargement(v, 10, 20, 3));
    assert.throws(() => M.fstopTime(v, 1));
    assert.throws(() => M.dilution(1, 2, v));
  }
  assert.throws(() => M.fstopTime(1e308, 100));
  assert.throws(() => M.apertureFactor(0, 16));
  assert.throws(() => M.fstopTime(10, 1, 1));
  assert.throws(() => M.temperature(8, NaN, 24));
});
test('signed stop display does not lose negative fractions', () => {
  assert.equal(M.formatStops(-1 / 24), '−1/24');
  assert.equal(M.formatStops(-25 / 24), '−1 1/24');
  assert.equal(M.formatStops(1), '+1');
});

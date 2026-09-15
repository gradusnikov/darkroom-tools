// Pure calculations shared by the browser and Node's regression tests.
(function (root) {
    'use strict';
    const data = typeof module === 'object' && module.exports ? require('./data.js') : root.DarkroomData;

    function finite(value, label = 'Value') {
        if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
        return value;
    }
    function positive(value, label = 'Value') {
        finite(value, label);
        if (value <= 0) throw new RangeError(`${label} must be greater than zero.`);
        return value;
    }
    function range(value, min, max, label = 'Value') {
        finite(value, label);
        if (value < min || value > max) throw new RangeError(`${label} must be between ${min} and ${max}.`);
        return value;
    }
    function interpolate(points, x, logarithmic = false) {
        range(x, points[0][0], points.at(-1)[0], 'Input');
        for (let i = 0; i < points.length; i++) {
            if (x === points[i][0]) return points[i][1];
            if (x < points[i][0]) {
                const [lo, a] = points[i - 1], [hi, b] = points[i];
                const fraction = (x - lo) / (hi - lo);
                return logarithmic ? Math.exp(Math.log(a) + fraction * Math.log(b / a)) : a + fraction * (b - a);
            }
        }
    }
    function filterFactor(head, value, channel) {
        const table = data.filterFactors[head];
        if (!table || ![0, 1].includes(channel)) throw new RangeError('Select a supported color head and filter.');
        const points = Object.entries(table).map(([x, factors]) => [Number(x), factors[channel]]).sort((a, b) => a[0] - b[0]);
        range(value, points[0][0], points.at(-1)[0], 'Filter setting');
        return interpolate(points, value);
    }
    function exposure(time, head, oldY, oldM, newY, newM) {
        positive(time, 'Exposure time');
        return positive(time * filterFactor(head, newY, 0) / filterFactor(head, oldY, 0)
            * filterFactor(head, newM, 1) / filterFactor(head, oldM, 1), 'Corrected exposure');
    }
    function fstopTime(base, stops, dryDown = 0) {
        positive(base, 'Base time'); finite(stops, 'Stops'); range(dryDown, 0, 0.99, 'Dry-down fraction');
        return positive(base * (1 - dryDown) * 2 ** stops, 'Exposure time');
    }
    function uncorrectedBase(displayedTime, dryDown) {
        positive(displayedTime, 'Selected time'); range(dryDown, 0, 0.99, 'Dry-down fraction');
        return positive(displayedTime / (1 - dryDown), 'Base time');
    }
    function enlargement(time, initialWidth, targetWidth, negativeWidth) {
        [time, initialWidth, targetWidth, negativeWidth].forEach(v => positive(v));
        const m1 = initialWidth / negativeWidth, m2 = targetWidth / negativeWidth;
        return {m1, m2, time: positive(time * ((m2 + 1) / (m1 + 1)) ** 2, 'Corrected exposure')};
    }
    function placement(mountWidth, mountHeight, printWidth, printHeight, mode, offset = 0) {
        [mountWidth, mountHeight, printWidth, printHeight].forEach(v => positive(v, 'Dimension'));
        finite(offset, 'Offset');
        if (!['optical', 'geometric'].includes(mode)) throw new RangeError('Select a placement mode.');
        if (printWidth >= mountWidth || printHeight >= mountHeight) throw new RangeError('Print must be smaller than mount.');
        const x = (mountWidth - printWidth) / 2;
        const opticalY = (1 + printWidth / mountWidth) * (mountHeight - printHeight) / 4;
        const geometricY = (mountHeight - printHeight) / 2;
        const y = (mode === 'optical' ? opticalY : geometricY) - offset;
        const bottom = mountHeight - printHeight - y;
        if (y < 0 || bottom < 0) throw new RangeError('Offset places the print outside the mount. Reduce the offset.');
        return {x, y, left: x, right: x, top: y, bottom, opticalY, geometricY};
    }
    function dilution(a, b, volume, density = null) {
        positive(a, 'Concentrate parts'); range(b, 0, Number.MAX_VALUE, 'Water parts'); positive(volume, 'Volume');
        positive(a + b, 'Total parts');
        if (density !== null) positive(density, 'Density');
        const concentrate = volume * (a / (a + b));
        const water = volume - concentrate;
        const concentrateMass = density === null ? null : positive(concentrate * density, 'Concentrate mass');
        const waterMass = water * 0.9982; // Water at 20°C; only relevant when mixing by weight.
        return {concentrate, water, concentrateMass, waterMass,
            totalMass: concentrateMass === null ? null : finite(concentrateMass + waterMass, 'Total mass')};
    }
    function exposureStops(ei, iso) { return Math.log2(positive(ei, 'Exposure index') / positive(iso, 'Film ISO')); }
    function pushPull(time, stops, percent) {
        positive(time, 'Development time'); range(stops, -6, 6, 'Push/pull stops'); range(percent, 0, 100, 'Compensation percent');
        return positive(time * (1 + percent / 100) ** stops, 'Development time');
    }
    function temperature(time, reference, actual, model = 'ilford') {
        positive(time, 'Development time');
        if (model === 'q10') {
            range(reference, 10, 30, 'Reference temperature'); range(actual, 10, 30, 'Actual temperature');
            return positive(time * 2 ** ((reference - actual) / 10), 'Development time');
        }
        if (model !== 'ilford') throw new RangeError('Select a temperature model.');
        const {temperatures, rows} = data.temperatureChart;
        range(reference, temperatures[0], temperatures.at(-1), 'Reference temperature (°C)');
        range(actual, temperatures[0], temperatures.at(-1), 'Actual temperature (°C)');
        if (reference === actual) return time;
        // Interpolate temperature along each printed row, then time between rows.
        // This also permits reverse conversion from any supported reference temperature.
        const pairs = rows.map(row => [interpolate(temperatures.map((t, i) => [t, row[i]]), reference, true),
            interpolate(temperatures.map((t, i) => [t, row[i]]), actual, true)]);
        if (time < pairs[0][0] || time > pairs.at(-1)[0]) {
            throw new RangeError('Time is outside the Ilford chart. Use a published recipe at this temperature or select the generic estimate.');
        }
        return interpolate(pairs, time);
    }
    function nomogram(lens, s1, s2, easelHeight = 0) {
        const config = data.nomograms[lens];
        if (!config) throw new RangeError('Select a supported lens.');
        range(easelHeight, 0, 20, 'Easel height (cm)');
        const a = s1 - easelHeight, b = s2 - easelHeight;
        range(a, config.sMin, config.sMax, 'Corrected test position');
        range(b, config.sMin, config.sMax, 'Corrected print position');
        return interpolate(config.samples, a, true) / interpolate(config.samples, b, true);
    }
    function apertureFactor(from, to) {
        return positive((positive(to, 'Target aperture') / positive(from, 'Test aperture')) ** 2, 'Aperture factor');
    }
    function formatStops(stops) {
        finite(stops);
        const ticks = Math.round(stops * 24), magnitude = Math.abs(ticks);
        const whole = Math.floor(magnitude / 24), remainder = magnitude % 24;
        return (ticks < 0 ? '−' : '+') + (whole && remainder ? `${whole} ${remainder}/24` : whole ? `${whole}` : `${remainder}/24`);
    }
    const api = {finite, positive, range, interpolate, filterFactor, exposure, fstopTime, uncorrectedBase,
        enlargement, placement, dilution, exposureStops, pushPull, temperature, nomogram, apertureFactor, formatStops};
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.DarkroomMath = api;
})(globalThis);

// ── Utility ──
const $ = id => document.getElementById(id);
const M = DarkroomMath;
function restoreChoice(id, value) {
    const select = $(id);
    if ([...select.options].some(option => option.value === String(value) && !option.disabled)) select.value = value;
}
const readNumber = id => $(id).value.trim() === '' ? NaN : Number($(id).value);
const resultIds = {
    exp: ['exp-updatedTime', 'exp-adjustment', 'exp-fstop-steps', 'exp-fstop-rounded-time', 'exp-fstop-detail'],
    fstop: [], enlg: ['enlg-m1', 'enlg-m2', 'enlg-targetExposure'],
    plc: [], nom: ['nom-k-value', 'nom-corrected-time', 'nom-stops-badge', 'nom-result-note', 'nom-fstop-steps', 'nom-fstop-rounded-time', 'nom-fstop-detail'],
    dev: ['dev-ratioDisplay', 'dev-ratioDesc', 'dev-weight', 'dev-vol', 'dev-waterWeight', 'dev-waterVol', 'dev-totalWeight'],
    dt: ['dt-res-base', 'dt-res-pushpull', 'dt-res-final', 'dt-res-note']
};
function validated(prefix, calculate) {
    return function (...args) {
        $(prefix + '-error').textContent = '';
        try { return calculate.apply(this, args); }
        catch (error) {
            if (!(error instanceof RangeError)) throw error;
            $(prefix + '-error').textContent = error.message;
            resultIds[prefix].forEach(id => $(id).textContent = '—');
            if ($(prefix + '-fstop-result')) $(prefix + '-fstop-result').classList.remove('visible');
            if (prefix === 'fstop') $('fstop-tbody').innerHTML = '';
            if (prefix === 'plc') $('plc-results').innerHTML = '';
            const canvas = prefix === 'plc' ? $('plc-canvas') : prefix === 'nom' ? $('nom-chart') : null;
            if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    };
}

// ── View switching ──
function switchView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    $('view-' + name).classList.add('active');
    document.querySelector(`.tab-btn[data-view="${name}"]`).classList.add('active');
    try { localStorage.setItem('darkroom_active_view', name); } catch (e) { }
    window.location.hash = name;

    // Trigger canvas redraws after view is visible
    if (name === 'nomogram') nomogramUpdate();
    if (name === 'placement') placementDraw();
}

window.addEventListener('hashchange', function () {
    const hash = window.location.hash.replace('#', '');
    if (hash && $('view-' + hash)) switchView(hash);
});


// ================================================================
// TOOL 1: EXPOSURE TIME CALCULATOR
// ================================================================
(function () {
    const FILTER_SETTINGS = DarkroomData.filterSettings;

    const FILTERING_FACTORS = DarkroomData.filterFactors;

    function loadFilterOptions(selId, paperType) {
        const sel = $(selId), previous = sel.value;
        const max = Math.max(...Object.keys(FILTERING_FACTORS[$('exp-colorHeadType').value]).map(Number));
        sel.innerHTML = '';
        const custom = document.createElement('option');
        custom.value = 'custom'; custom.textContent = 'Custom filtration'; sel.appendChild(custom);
        Object.keys(FILTER_SETTINGS[paperType]).sort((a, b) => a === '00' ? -1 : b === '00' ? 1 : Number(a) - Number(b)).forEach(g => {
            const settings = FILTER_SETTINGS[paperType][g];
            const o = document.createElement('option');
            o.value = g; o.disabled = settings.Y > max || settings.M > max;
            o.textContent = 'Grade ' + g + (o.disabled ? ' — unsupported on this head' : '');
            sel.appendChild(o);
        });
        sel.value = [...sel.options].some(o => o.value === previous && !o.disabled) ? previous : 'custom';
        for (const id of ['exp-existingY', 'exp-existingM', 'exp-existingC', 'exp-updatedY', 'exp-updatedM', 'exp-updatedC']) $(id).max = max;
        $('exp-source').href = DarkroomData.sources[paperType === 'foma' ? 'fomaContrast' : 'ilfordContrast'];
    }

    function applyFilterToInputs(selId) {
        const grade = $(selId).value;
        const paper = $('exp-paperType').value;
        const fs = FILTER_SETTINGS[paper][grade];
        if (!fs) return;
        if (selId === 'exp-existingFilterGrade') {
            $('exp-existingY').value = fs.Y;
            $('exp-existingM').value = fs.M;
        } else {
            $('exp-updatedY').value = fs.Y;
            $('exp-updatedM').value = fs.M;
        }
    }

    function formatFStops(fStops) {
        const STEPS = [1, 1 / 3, 1 / 12, 1 / 24];
        const sign = fStops >= 0 ? '+' : '−';
        const abs = Math.abs(fStops);
        let bestRepr = null, bestDiff = Infinity;
        for (const step of STEPS) {
            const mult = Math.round(abs / step);
            const diff = Math.abs(abs - mult * step);
            if (diff < bestDiff && mult > 0) {
                bestDiff = diff;
                bestRepr = {step, mult};
            }
        }
        if (bestRepr && bestDiff < 0.001) {
            const {step, mult} = bestRepr;
            if (step === 1) return `${sign}${mult} f-stop${mult !== 1 ? 's' : ''}`;
            const den = Math.round(1 / step);
            if (mult === 1) return `${sign}1/${den} f-stop`;
            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
            const d = gcd(mult, den);
            const sn = mult / d, sd = den / d;
            return sd === 1 ? `${sign}${sn} f-stop${sn !== 1 ? 's' : ''}` : `${sign}${sn}/${sd} f-stop`;
        }
        return `${sign}${abs.toFixed(3)} f-stops`;
    }

    window.exposureCalculate = validated('exp', function () {
        const headType = $('exp-colorHeadType').value;
        const eY = readNumber('exp-existingY'), eM = readNumber('exp-existingM');
        const nY = readNumber('exp-updatedY'), nM = readNumber('exp-updatedM');
        const time = readNumber('exp-existingTime');
        const updated = M.exposure(time, headType, eY, eM, nY, nM, readNumber('exp-existingC'), readNumber('exp-updatedC'));

        const fStops = Math.log2(updated / time);
        const rounded = Math.round(fStops * 24) / 24;

        $('exp-updatedTime').textContent = updated.toFixed(2);
        $('exp-adjustment').textContent = formatFStops(rounded);

        // F-stop timer
        const fstopMode = $('exp-fstop-mode').checked;
        const fstopResult = $('exp-fstop-result');
        if (fstopMode && time > 0) {
            fstopResult.classList.add('visible');
            const steps24 = Math.round(fStops * 24);
            const roundedStops = steps24 / 24;
            const roundedTime = time * Math.pow(2, roundedStops);
            const delta = roundedTime - updated;
            $('exp-fstop-steps').textContent = M.formatStops(roundedStops);
            $('exp-fstop-rounded-time').textContent = roundedTime.toFixed(1);
            const dSign = delta >= 0 ? '+' : '';
            $('exp-fstop-detail').textContent = `Exact: ${updated.toFixed(1)}s → Rounded: ${roundedTime.toFixed(1)}s (Δ ${dSign}${delta.toFixed(2)}s) · ${steps24} steps of 1/24 stop`;
        } else {
            fstopResult.classList.remove('visible');
        }

        exposureSave();
    });

    function exposureSave() {
        try {
            localStorage.setItem('darkroom_exposure', JSON.stringify({
                paperType: $('exp-paperType').value,
                colorHeadType: $('exp-colorHeadType').value,
                existingFilterGrade: $('exp-existingFilterGrade').value,
                updatedFilterGrade: $('exp-updatedFilterGrade').value,
                existingY: $('exp-existingY').value,
                existingM: $('exp-existingM').value,
                existingC: $('exp-existingC').value,
                existingTime: $('exp-existingTime').value,
                updatedY: $('exp-updatedY').value,
                updatedM: $('exp-updatedM').value,
                updatedC: $('exp-updatedC').value,
                fstopMode: $('exp-fstop-mode').checked
            }));
        } catch (e) { }
    }

    function exposureLoad() {
        try {
            const raw = localStorage.getItem('darkroom_exposure');
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {return null;}
    }

    // Init
    const saved = exposureLoad();
    if (saved) restoreChoice('exp-paperType', saved.paperType);
    if (saved) restoreChoice('exp-colorHeadType', saved.colorHeadType);

    loadFilterOptions('exp-existingFilterGrade', $('exp-paperType').value);
    loadFilterOptions('exp-updatedFilterGrade', $('exp-paperType').value);

    if (saved) {
        if (saved.existingFilterGrade) $('exp-existingFilterGrade').value = saved.existingFilterGrade;
        if (saved.updatedFilterGrade) $('exp-updatedFilterGrade').value = saved.updatedFilterGrade;
        if (saved.existingY) $('exp-existingY').value = saved.existingY;
        if (saved.existingM) $('exp-existingM').value = saved.existingM;
        $('exp-existingC').value = saved.existingC ?? 0;
        if (saved.existingTime) $('exp-existingTime').value = saved.existingTime;
        if (saved.updatedY) $('exp-updatedY').value = saved.updatedY;
        if (saved.updatedM) $('exp-updatedM').value = saved.updatedM;
        $('exp-updatedC').value = saved.updatedC ?? 0;
        if (saved.fstopMode) $('exp-fstop-mode').checked = saved.fstopMode;
    } else {
        $('exp-existingFilterGrade').value = '2';
        $('exp-updatedFilterGrade').value = '2';
        applyFilterToInputs('exp-existingFilterGrade');
        applyFilterToInputs('exp-updatedFilterGrade');
    }

    for (const prefix of ['existing', 'updated']) {
        const sel = $('exp-' + prefix + 'FilterGrade');
        const setting = FILTER_SETTINGS[$('exp-paperType').value][sel.value];
        const option = [...sel.options].find(o => o.value === sel.value);
        if (!setting || !option || option.disabled || setting.Y !== readNumber('exp-' + prefix + 'Y') || setting.M !== readNumber('exp-' + prefix + 'M')) sel.value = 'custom';
    }

    // Events
    $('exp-fstop-mode').addEventListener('change', exposureCalculate);
    $('exp-paperType').addEventListener('change', function () {
        loadFilterOptions('exp-existingFilterGrade', this.value);
        loadFilterOptions('exp-updatedFilterGrade', this.value);
        applyFilterToInputs('exp-existingFilterGrade');
        applyFilterToInputs('exp-updatedFilterGrade');
        exposureCalculate();
    });
    $('exp-colorHeadType').addEventListener('change', function () {
        loadFilterOptions('exp-existingFilterGrade', $('exp-paperType').value);
        loadFilterOptions('exp-updatedFilterGrade', $('exp-paperType').value);
        exposureCalculate();
    });
    $('exp-existingFilterGrade').addEventListener('change', function () {
        applyFilterToInputs('exp-existingFilterGrade');
        exposureCalculate();
    });
    $('exp-updatedFilterGrade').addEventListener('change', function () {
        applyFilterToInputs('exp-updatedFilterGrade');
        exposureCalculate();
    });
    ['exp-existingY', 'exp-existingM', 'exp-existingC', 'exp-existingTime', 'exp-updatedY', 'exp-updatedM', 'exp-updatedC'].forEach(id => {
        $(id).addEventListener('input', function () {
            if (id.endsWith('Y') || id.endsWith('M')) $(id.startsWith('exp-existing') ? 'exp-existingFilterGrade' : 'exp-updatedFilterGrade').value = 'custom';
            exposureCalculate();
        });
    });

    exposureCalculate();
})();


// ================================================================
// TOOL 2: F-STOP TIMING TABLE
// ================================================================
(function () {
    const FSTOP_STEPS = [1, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 12, 1 / 24];
    const EV = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6];

    function calcTime(ev, step, base) {return M.fstopTime(base, ev * step);}

    function formatFrac(ev, step) {
        if (step === 1) return ev.toString();
        if (ev === 0) return "0";
        const den = Math.round(1 / step);
        return `${ev}/${den}`;
    }

    window.fstopSetBaseTime = function (time) {
        $('fstop-baseTime').value = Number(M.uncorrectedBase(time, readNumber('fstop-dryDown')).toPrecision(15));
        fstopCalculate();
    };

    window.fstopCalculate = validated('fstop', function () {
        const stepIdx = parseInt($('fstop-step').value);
        const step = FSTOP_STEPS[stepIdx];
        const base = readNumber('fstop-baseTime');
        const dryDown = readNumber('fstop-dryDown');
        const adjusted = M.fstopTime(base, 0, dryDown);

        const tbody = $('fstop-tbody');
        tbody.innerHTML = '';

        EV.forEach(ev => {
            const time = calcTime(ev, step, adjusted);
            const inc = ev === EV[0] ? time : (time - calcTime(ev - 1, step, adjusted));
            const timeFmt = Number.isInteger(time) ? time.toString() : time.toFixed(2);
            const incFmt = Number.isInteger(inc) ? inc.toString() : inc.toFixed(2);

            const tr = document.createElement('tr');
            if (ev === 0) tr.className = 'row-zero';
            else if (ev < 0) tr.className = 'row-negative';
            tr.innerHTML = `<td>${formatFrac(ev, step)}</td>` +
                `<td><a href="#" class="time-link" onclick="fstopSetBaseTime(${time}); return false;">${timeFmt}</a></td>` +
                `<td>${incFmt}</td>`;
            tbody.appendChild(tr);
        });

        fstopSave();
    });

    function fstopSave() {
        try {
            localStorage.setItem('darkroom_fstop', JSON.stringify({
                step: $('fstop-step').value,
                dryDown: $('fstop-dryDown').value,
                baseTime: $('fstop-baseTime').value
            }));
        } catch (e) { }
    }

    function fstopLoad() {
        try {
            const raw = localStorage.getItem('darkroom_fstop');
            if (!raw) return;
            const p = JSON.parse(raw);
            restoreChoice('fstop-step', p.step);
            restoreChoice('fstop-dryDown', p.dryDown);
            if (p.baseTime) $('fstop-baseTime').value = p.baseTime;
        } catch (e) { }
    }

    fstopLoad();

    $('fstop-step').addEventListener('change', fstopCalculate);
    $('fstop-dryDown').addEventListener('change', fstopCalculate);
    $('fstop-baseTime').addEventListener('input', fstopCalculate);

    fstopCalculate();
})();


// ================================================================
// TOOL 3: ENLARGER EXPOSURE CALCULATOR
// ================================================================
(function () {
    const NEG_SIZES = {'35mm': 36, '6x6': 56}; // nominal image width in mm; user can override
    let previousUnit;

    window.enlargerCalculate = validated('enlg', function () {
        const unit = $('enlg-unit').value;
        const scale = unit === 'cm' ? 10 : 25.4;
        const result = M.enlargement(readNumber('enlg-initialExposure'), readNumber('enlg-initialWidth') * scale,
            readNumber('enlg-targetWidth') * scale, readNumber('enlg-negativeWidth'));
        const {m1, m2, time: te} = result;

        $('enlg-m1').textContent = m1.toFixed(2) + '×';
        $('enlg-m2').textContent = m2.toFixed(2) + '×';
        $('enlg-targetExposure').textContent = te.toFixed(2);
        enlargerSave();
    });

    function enlargerSave() {
        try {
            localStorage.setItem('darkroom_enlarger', JSON.stringify({
                unit: $('enlg-unit').value,
                negativeType: $('enlg-negativeType').value,
                negativeWidth: $('enlg-negativeWidth').value,
                initialWidth: $('enlg-initialWidth').value,
                targetWidth: $('enlg-targetWidth').value,
                initialExposure: $('enlg-initialExposure').value
            }));
        } catch (e) { }
    }

    function enlargerLoad() {
        try {
            const raw = localStorage.getItem('darkroom_enlarger');
            if (!raw) return;
            const p = JSON.parse(raw);
            restoreChoice('enlg-unit', p.unit);
            restoreChoice('enlg-negativeType', p.negativeType);
            $('enlg-negativeWidth').value = p.negativeWidth || NEG_SIZES[$('enlg-negativeType').value] || 36;
            if (p.initialWidth) $('enlg-initialWidth').value = p.initialWidth;
            if (p.targetWidth) $('enlg-targetWidth').value = p.targetWidth;
            if (p.initialExposure) $('enlg-initialExposure').value = p.initialExposure;
        } catch (e) { }
    }

    enlargerLoad();
    previousUnit = $('enlg-unit').value;
    $('enlg-unit').addEventListener('change', function () {
        const ratio = previousUnit === 'inches' ? 2.54 : 1 / 2.54;
        if (this.value !== previousUnit) {
            for (const id of ['enlg-initialWidth', 'enlg-targetWidth']) {
                if ($(id).value !== '') $(id).value = Number((readNumber(id) * ratio).toPrecision(15));
            }
        }
        previousUnit = this.value;
        enlargerCalculate();
    });
    $('enlg-negativeType').addEventListener('change', function () {
        if (NEG_SIZES[this.value]) $('enlg-negativeWidth').value = NEG_SIZES[this.value];
        enlargerCalculate();
    });
    $('enlg-negativeWidth').addEventListener('input', function () {
        $('enlg-negativeType').value = 'custom';
        enlargerCalculate();
    });

    ['enlg-initialWidth', 'enlg-targetWidth', 'enlg-initialExposure'].forEach(id => {
        $(id).addEventListener('input', enlargerCalculate);
        $(id).addEventListener('change', enlargerCalculate);
    });

    enlargerCalculate();
})();


// ================================================================
// TOOL 4: OPTICAL PRINT PLACEMENT
// ================================================================
(function () {
    const MM_PER_INCH = 25.4;
    let previewImage = null;
    let restoredDimensions = null;

    function getUnit() {return $('plc-unit').value;}
    function toMm(v) {return getUnit() === 'in' ? v * MM_PER_INCH : v;}
    function fromMm(v) {return getUnit() === 'in' ? v / MM_PER_INCH : v;}
    function fmtVal(v) {
        return getUnit() === 'in' ? Number(v.toFixed(3)) + ' in' : Number(v.toFixed(2)) + ' mm';
    }

    function updateLabels() {
        const u = getUnit() === 'in' ? 'in' : 'mm';
        $('plc-mountWidthLabel').textContent = `Width (${u})`;
        $('plc-mountHeightLabel').textContent = `Height (${u})`;
        $('plc-printWidthLabel').textContent = `Width (${u})`;
        $('plc-printHeightLabel').textContent = `Height (${u})`;
        $('plc-offsetLabel').textContent = `Vertical offset (${u})`;
    }

    function storeInMm(id) {
        const el = $(id);
        const v = parseFloat(el.value);
        el.dataset.mmValue = Number.isFinite(v) ? toMm(v) : NaN;
    }

    function convertInputs(toUnit) {
        ['plc-mountWidth', 'plc-mountHeight', 'plc-printWidth', 'plc-printHeight', 'plc-verticalOffset'].forEach(id => {
            const el = $(id);
            const mm = parseFloat(el.dataset.mmValue);
            el.value = Number.isFinite(mm) ? Number((toUnit === 'in' ? mm / MM_PER_INCH : mm).toPrecision(15)) : '';
        });
    }

    function initStoredValues() {
        ['plc-mountWidth', 'plc-mountHeight', 'plc-printWidth', 'plc-printHeight', 'plc-verticalOffset'].forEach(storeInMm);
    }

    function loadImage(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                previewImage = img;
                $('plc-clearImageBtn').style.display = 'block';
                placementDraw();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    window.placementClearImage = function () {
        previewImage = null;
        $('plc-imageUpload').value = '';
        $('plc-clearImageBtn').style.display = 'none';
        placementDraw();
    };

    window.placementFlip = function () {
        const fields = [['plc-mountWidth', 'plc-mountHeight'], ['plc-printWidth', 'plc-printHeight']];
        fields.forEach(([a, b]) => {
            const ea = $(a), eb = $(b);
            const tv = ea.value, tm = ea.dataset.mmValue;
            ea.value = eb.value; ea.dataset.mmValue = eb.dataset.mmValue;
            eb.value = tv; eb.dataset.mmValue = tm;
        });
        placementDraw();
    };

    window.placementDraw = validated('plc', function () {
        const Mx = Number($('plc-mountWidth').dataset.mmValue);
        const My = Number($('plc-mountHeight').dataset.mmValue);
        const Px = Number($('plc-printWidth').dataset.mmValue);
        const Py = Number($('plc-printHeight').dataset.mmValue);
        const vOff = Number($('plc-verticalOffset').dataset.mmValue);
        const mode = $('plc-mode').value;
        const showCenter = $('plc-showCenter').checked;
        const showMarks = $('plc-showMarks').checked;

        const results = $('plc-results');

        const {x, y, left, right, top, bottom, opticalY, geometricY} = M.placement(Mx, My, Px, Py, mode, vOff);
        const altY = (mode === 'geometric' ? opticalY : geometricY) - vOff;
        const altX = x;

        const canvas = $('plc-canvas');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;
        ctx.clearRect(0, 0, W, H);

        const padT = 40, padB = 60, padL = 60, padR = 100;
        const aW = W - padL - padR, aH = H - padT - padB;
        const sc = Math.min(aW / Mx, aH / My);
        const mW = Mx * sc, mH = My * sc, pW = Px * sc, pH = Py * sc;
        const oX = padL + (aW - mW) / 2, oY = padT + (aH - mH) / 2;

        // Mount
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(oX, oY, mW, mH);
        ctx.strokeStyle = 'rgba(61,50,40,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(oX, oY, mW, mH);

        const pX = oX + x * sc, pY = oY + y * sc;

        // Preview image or color fill
        if (previewImage) {
            const iA = previewImage.width / previewImage.height;
            const pA = pW / pH;
            let dW, dH, dX, dY;
            if (iA > pA) {dW = pW; dH = pW / iA; dX = pX; dY = pY;}
            else {dH = pH; dW = pH * iA; dX = pX + (pW - dW) / 2; dY = pY;}
            ctx.drawImage(previewImage, dX, dY, dW, dH);
        } else {
            ctx.fillStyle = 'rgba(196,113,59,0.5)';
            ctx.fillRect(pX, pY, pW, pH);
        }

        if (!previewImage || showMarks) {
            ctx.strokeStyle = '#c4713b';
            ctx.lineWidth = 2;
            ctx.strokeRect(pX, pY, pW, pH);
        }

        // Alternative placement overlay (the other mode)
        if (showCenter) {
            const cpX = oX + altX * sc, cpY = oY + altY * sc;
            ctx.strokeStyle = '#5a8fb8';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.strokeRect(cpX, cpY, pW, pH);
            ctx.setLineDash([]);
            if (!previewImage || showMarks) {
                ctx.fillStyle = '#5a8fb8';
                ctx.font = "500 11px 'DM Mono', monospace";
                ctx.fillText(mode === 'geometric' ? 'Optical' : 'Geometric', cpX + 4, cpY + 14);
            }
        }

        // Measurement marks
        if (showMarks) {
            ctx.strokeStyle = 'rgba(138,125,107,0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);
            // Top
            ctx.beginPath(); ctx.moveTo(oX - 8, pY); ctx.lineTo(oX + mW + 8, pY); ctx.stroke();
            // Bottom
            ctx.beginPath(); ctx.moveTo(oX - 8, pY + pH); ctx.lineTo(oX + mW + 8, pY + pH); ctx.stroke();
            // Left
            ctx.beginPath(); ctx.moveTo(pX, oY - 8); ctx.lineTo(pX, oY + mH + 8); ctx.stroke();
            // Right
            ctx.beginPath(); ctx.moveTo(pX + pW, oY - 8); ctx.lineTo(pX + pW, oY + mH + 8); ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#c4713b';
            ctx.font = "500 11px 'DM Mono', monospace";
            ctx.fillText('Top: ' + fmtVal(fromMm(top)), oX + mW + 8, pY + 5);
            ctx.fillText('Bottom: ' + fmtVal(fromMm(bottom)), oX + mW + 8, pY + pH + 5);
            ctx.fillText('Left: ' + fmtVal(fromMm(left)), pX + 4, oY + mH + 18);
            ctx.fillText('Right: ' + fmtVal(fromMm(right)), pX + pW - 60, oY + mH + 18);

            // Center dots
            ctx.fillStyle = '#c4713b';
            ctx.beginPath(); ctx.arc(oX + mW / 2, oY + mH / 2, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f5a862';
            ctx.beginPath(); ctx.arc(pX + pW / 2, pY + pH / 2, 3, 0, Math.PI * 2); ctx.fill();
        }

        if (!previewImage || showMarks) {
            ctx.fillStyle = '#c4713b';
            ctx.font = "500 11px 'DM Mono', monospace";
            ctx.fillText(mode === 'geometric' ? 'Geometric' : 'Optical', pX + 4, pY + 14);
        }

        // Results
        const diff = bottom - top;
        let offInfo = '';
        if (vOff !== 0) {
            offInfo = `<div class="result-row"><span class="result-label">Custom offset</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(vOff))} ${vOff > 0 ? 'up' : 'down'}</span></div>`;
        }
        const modeLabel = mode === 'geometric' ? 'Geometric Placement' : 'Optical Placement';
        results.innerHTML = `<div class="section-label">${modeLabel}</div>` + offInfo +
            `<div class="result-row"><span class="result-label">Left</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(left))}</span></div>` +
            `<div class="result-row"><span class="result-label">Right</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(right))}</span></div>` +
            `<div class="result-row"><span class="result-label">Top</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(top))}</span></div>` +
            `<div class="result-row"><span class="result-label">Bottom</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(bottom))}</span></div>` +
            `<div class="result-row"><span class="result-label">Bottom − Top</span><span class="result-value" style="font-size:1rem">${fmtVal(fromMm(diff))}</span></div>` +
            (showCenter ? `<div class="result-note">Difference between modes: ${fmtVal(fromMm(Math.abs(opticalY - geometricY)))} (optical sits higher)</div>` : '');

        placementSave();
    });

    function placementSave() {
        try {
            localStorage.setItem('darkroom_placement', JSON.stringify({
                unit: getUnit(),
                dimensionsMm: Object.fromEntries(['plc-mountWidth', 'plc-mountHeight', 'plc-printWidth', 'plc-printHeight', 'plc-verticalOffset'].map(id => [id, Number($(id).dataset.mmValue)])),
                mode: $('plc-mode').value,
                mountWidth: $('plc-mountWidth').value,
                mountHeight: $('plc-mountHeight').value,
                printWidth: $('plc-printWidth').value,
                printHeight: $('plc-printHeight').value,
                verticalOffset: $('plc-verticalOffset').value,
                showCenter: $('plc-showCenter').checked,
                showMarks: $('plc-showMarks').checked
            }));
        } catch (e) { }
    }

    function placementLoad() {
        try {
            const raw = localStorage.getItem('darkroom_placement');
            if (!raw) return;
            const p = JSON.parse(raw);
            restoreChoice('plc-unit', p.unit);
            restoreChoice('plc-mode', p.mode);
            if (p.mountWidth) $('plc-mountWidth').value = p.mountWidth;
            if (p.mountHeight) $('plc-mountHeight').value = p.mountHeight;
            if (p.printWidth) $('plc-printWidth').value = p.printWidth;
            if (p.printHeight) $('plc-printHeight').value = p.printHeight;
            if (p.verticalOffset !== undefined) $('plc-verticalOffset').value = p.verticalOffset;
            if (p.showCenter !== undefined) $('plc-showCenter').checked = p.showCenter;
            if (p.showMarks !== undefined) $('plc-showMarks').checked = p.showMarks;
            restoredDimensions = p.dimensionsMm;
        } catch (e) { }
    }

    placementLoad();
    initStoredValues();
    if (restoredDimensions) {
        ['plc-mountWidth', 'plc-mountHeight', 'plc-printWidth', 'plc-printHeight', 'plc-verticalOffset'].forEach(id => {
            if (Number.isFinite(restoredDimensions[id])) $(id).dataset.mmValue = restoredDimensions[id];
        });
    }
    convertInputs(getUnit());
    updateLabels();

    // Events
    $('plc-unit').addEventListener('change', function () {
        convertInputs(getUnit());
        updateLabels();
        placementDraw();
    });

    ['plc-mountWidth', 'plc-mountHeight', 'plc-printWidth', 'plc-printHeight', 'plc-verticalOffset'].forEach(id => {
        $(id).addEventListener('input', function () {storeInMm(id); placementDraw();});
    });

    $('plc-mode').addEventListener('change', placementDraw);
    $('plc-showCenter').addEventListener('change', placementDraw);
    $('plc-showMarks').addEventListener('change', placementDraw);

    $('plc-imageUpload').addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) loadImage(e.target.files[0]);
    });

    // Drag & drop
    const cvs = $('plc-canvas');
    cvs.addEventListener('dragover', function (e) {e.preventDefault(); cvs.classList.add('drag-over');});
    cvs.addEventListener('dragenter', function (e) {e.preventDefault(); cvs.classList.add('drag-over');});
    cvs.addEventListener('dragleave', function (e) {e.preventDefault(); cvs.classList.remove('drag-over');});
    cvs.addEventListener('drop', function (e) {
        e.preventDefault(); cvs.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) loadImage(files[0]);
    });

    // Only draw if view is visible (switchView will trigger draw otherwise)
    if ($('view-placement').classList.contains('active')) placementDraw();
})();


// ================================================================
// TOOL 5: OPEMUS 5 NOMOGRAM
// ================================================================
(function () {
    const LENS_CONFIG = DarkroomData.nomograms;
    function calcK(s1, s2) { return M.nomogram($('nom-lens').value, s1, s2); }
    function stopsFromK(k) {return Math.log2(k);}
    function fmtStops(stops) {return `${stops >= 0 ? '+' : ''}${stops.toFixed(1)} stops`;}

    function updateSliderRanges() {
        const cfg = LENS_CONFIG[$('nom-lens').value];
        $('nom-s1').min = cfg.sMin; $('nom-s1').max = cfg.sMax;
        $('nom-s2').min = cfg.sMin; $('nom-s2').max = cfg.sMax;
        let s1 = parseFloat($('nom-s1').value), s2 = parseFloat($('nom-s2').value);
        if (s1 < cfg.sMin) $('nom-s1').value = cfg.sMin;
        if (s1 > cfg.sMax) $('nom-s1').value = cfg.sMax;
        if (s2 < cfg.sMin) $('nom-s2').value = cfg.sMin;
        if (s2 > cfg.sMax) $('nom-s2').value = cfg.sMax;
        $('nom-reference-points').textContent = 'Scale → multiplier to 50: ' + cfg.samples.map(([s, k]) => s + ' → ' + k).join('; ');
    }

    window.nomogramUpdate = validated('nom', function () {
        const s1 = parseFloat($('nom-s1').value);
        const s2 = parseFloat($('nom-s2').value);
        const time = M.positive(readNumber('nom-time'), 'Exposure time');
        const aperture = parseFloat($('nom-aperture').value);
        const targetAperture = parseFloat($('nom-target-aperture').value);
        const easelHeight = readNumber('nom-easel-height');

        $('nom-s1-display').textContent = s1 % 1 === 0 ? s1 : s1.toFixed(1);
        $('nom-s2-display').textContent = s2 % 1 === 0 ? s2 : s2.toFixed(1);

        const k = M.nomogram($('nom-lens').value, s1, s2, easelHeight);
        const apertureStops = 2 * Math.log2(aperture / targetAperture);
        const apertureFactor = M.apertureFactor(aperture, targetAperture);
        const correctedTime = M.positive(time * k * apertureFactor, 'Corrected exposure');
        const totalStops = stopsFromK(k) - apertureStops;

        $('nom-k-value').textContent = k.toFixed(3);
        $('nom-corrected-time').textContent = correctedTime.toFixed(1);
        $('nom-result-aperture').textContent = `f/${targetAperture}`;
        $('nom-stops-badge').textContent = fmtStops(totalStops);
        $('nom-chart-title').textContent = `Nomogram — k vs. scale position (${LENS_CONFIG[$('nom-lens').value].label})`;

        const apNote = aperture !== targetAperture
            ? ` Aperture changed by ${Math.abs(apertureStops).toFixed(1)} stop${Math.abs(apertureStops) !== 1 ? 's' : ''} (${apertureStops > 0 ? 'opened' : 'stopped down'}).`
            : '';

        if (correctedTime > 120) {
            const sugF = targetAperture / 1.414;
            $('nom-result-note').innerHTML = `<strong>Long exposure.</strong> Consider opening the lens. At f/${sugF.toFixed(1)} the time would be ~${(correctedTime / 2).toFixed(1)}s.${apNote}`;
        } else if (correctedTime < 3 && time > 0) {
            $('nom-result-note').textContent = 'Short exposure — consider stopping down.' + apNote;
        } else {
            $('nom-result-note').textContent = apNote || 'Same aperture. If the time is impractically long, open up the target aperture.';
        }

        // F-stop timer
        const fstopMode = $('nom-fstop-mode').checked;
        const fstopResult = $('nom-fstop-result');
        if (fstopMode && time > 0) {
            fstopResult.classList.add('visible');
            const steps24 = Math.round(totalStops * 24);
            const roundedStops = steps24 / 24;
            const roundedTime = time * Math.pow(2, roundedStops);
            const delta = roundedTime - correctedTime;
            $('nom-fstop-steps').textContent = M.formatStops(roundedStops);
            $('nom-fstop-rounded-time').textContent = roundedTime.toFixed(1);
            const dSign = delta >= 0 ? '+' : '';
            $('nom-fstop-detail').textContent = `Exact: ${correctedTime.toFixed(1)}s → Rounded: ${roundedTime.toFixed(1)}s (Δ ${dSign}${delta.toFixed(2)}s) · ${steps24} steps of 1/24 stop`;
        } else {
            fstopResult.classList.remove('visible');
        }

        nomogramSave();
        nomogramDrawChart(s1 - easelHeight, s2 - easelHeight, k);
    });

    function nomogramDrawChart(activS1, activS2, activK) {
        const lens = $('nom-lens').value;
        const cfg = LENS_CONFIG[lens];
        const canvas = $('nom-chart');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = rect.height;

        const pad = {top: 20, right: 45, bottom: 35, left: 50};
        const cw = W - pad.left - pad.right, ch = H - pad.top - pad.bottom;
        const sMin = cfg.sMin, sMax = cfg.sMax;
        const kMin = cfg.kMin, kMax = cfg.kMax;
        const logKMin = Math.log10(kMin), logKMax = Math.log10(kMax);

        function xPos(s) {return pad.left + (s - sMin) / (sMax - sMin) * cw;}
        function yPos(k) {
            const lk = Math.log10(Math.max(k, 0.001));
            return pad.top + ch - (lk - logKMin) / (logKMax - logKMin) * ch;
        }

        ctx.fillStyle = '#1a1410';
        ctx.fillRect(0, 0, W, H);

        // Grid - H
        const kGridAll = [0.02, 0.03, 0.04, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 35];
        const kGridVals = kGridAll.filter(v => v >= kMin && v <= kMax);
        const kLabelAll = [0.02, 0.03, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5, 1, 2, 3, 5, 10, 15, 20, 30, 35];
        const kLabelVals = kLabelAll.filter(v => v >= kMin && v <= kMax);

        ctx.strokeStyle = 'rgba(61,50,40,0.4)';
        ctx.lineWidth = 0.5;
        kGridVals.forEach(kv => {
            const y = yPos(kv);
            ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
        });

        // Grid - V
        let sGridVals = sMin <= 1 ? [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50] : [12, 15, 20, 25, 30, 35, 40, 45, 50];
        sGridVals = sGridVals.filter(v => v >= sMin && v <= sMax);
        sGridVals.forEach(sv => {
            const x = xPos(sv);
            ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, H - pad.bottom); ctx.stroke();
        });

        // K=1 ref
        if (kMin <= 1 && kMax >= 1) {
            ctx.strokeStyle = 'rgba(196,113,59,0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.left, yPos(1)); ctx.lineTo(W - pad.right, yPos(1)); ctx.stroke();
        }

        // Curves
        const isActive = tp => Math.abs(tp - activS1) < 0.5;
        cfg.curves.forEach(tp => {
            const active = isActive(tp);
            ctx.strokeStyle = active ? '#c4713b' : 'rgba(212,196,168,0.18)';
            ctx.lineWidth = active ? 2 : 1;
            ctx.beginPath();
            let first = true;
            for (let s = sMin; s <= sMax; s += 0.25) {
                const k = calcK(tp, s);
                if (k < kMin || k > kMax) continue;
                if (first) {ctx.moveTo(xPos(s), yPos(k)); first = false;}
                else ctx.lineTo(xPos(s), yPos(k));
            }
            ctx.stroke();
            const labelK = calcK(tp, sMax);
            if (labelK <= kMax && labelK >= kMin) {
                ctx.fillStyle = active ? '#c4713b' : 'rgba(138,125,107,0.5)';
                ctx.font = `${active ? '500' : '300'} ${active ? '11px' : '9px'} 'DM Mono', monospace`;
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(tp, W - pad.right + 4, yPos(labelK));
            }
        });

        // Active point
        if (activK >= kMin && activK <= kMax) {
            const px = xPos(activS2), py = yPos(activK);
            ctx.strokeStyle = 'rgba(196,113,59,0.3)'; ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(px, pad.top); ctx.lineTo(px, H - pad.bottom); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(W - pad.right, py); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(232,146,77,0.15)';
            ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e8924d';
            ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#f5a862';
            ctx.font = "500 11px 'DM Mono', monospace";
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText(`k=${activK.toFixed(2)}`, px + 8, py - 6);
        }

        // Axis labels - X
        ctx.fillStyle = 'rgba(138,125,107,0.7)';
        ctx.font = "300 10px 'DM Mono', monospace";
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        sGridVals.forEach(sv => ctx.fillText(sv, xPos(sv), H - pad.bottom + 6));

        // Axis labels - Y
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        kLabelVals.forEach(kv => {
            let lbl;
            if (kv >= 1) lbl = kv.toString();
            else if (kv === 0.15) lbl = '0.15';
            else lbl = kv.toFixed(kv < 0.1 ? 2 : 1);
            ctx.fillText(lbl, pad.left - 8, yPos(kv));
        });

        // Axis titles
        ctx.fillStyle = 'rgba(138,125,107,0.5)';
        ctx.font = "300 9px 'DM Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText('scale minus easel height', pad.left + cw / 2, H - 3);
        ctx.save();
        ctx.translate(10, pad.top + ch / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('k coefficient', 0, 0);
        ctx.restore();
    }

    window.nomogramToggleCalibration = function () {
        const panel = $('nom-cal-panel');
        const btn = $('nom-cal-toggle');
        panel.classList.toggle('open');
        btn.textContent = panel.classList.contains('open') ? 'Close' : 'Reference points';
    };

    function nomogramSave() {
        try {
            localStorage.setItem('darkroom_nomogram', JSON.stringify({
                lens: $('nom-lens').value,
                s1: $('nom-s1').value,
                s2: $('nom-s2').value,
                time: $('nom-time').value,
                aperture: $('nom-aperture').value,
                targetAperture: $('nom-target-aperture').value,
                easelHeight: $('nom-easel-height').value,
                fstopMode: $('nom-fstop-mode').checked
            }));
        } catch (e) { }
    }

    function nomogramLoad() {
        try {
            const raw = localStorage.getItem('darkroom_nomogram');
            if (!raw) return;
            const p = JSON.parse(raw);
            restoreChoice('nom-lens', p.lens);
            updateSliderRanges();
            if (p.s1) $('nom-s1').value = p.s1;
            if (p.s2) $('nom-s2').value = p.s2;
            if (p.time) $('nom-time').value = p.time;
            restoreChoice('nom-aperture', p.aperture);
            restoreChoice('nom-target-aperture', p.targetAperture);
            if (p.easelHeight !== undefined) $('nom-easel-height').value = p.easelHeight;
            if (p.fstopMode !== undefined) $('nom-fstop-mode').checked = p.fstopMode;
        } catch (e) { }
    }

    $('nom-lens').addEventListener('change', function () {updateSliderRanges(); nomogramUpdate();});
    ['nom-s1', 'nom-s2', 'nom-time', 'nom-aperture', 'nom-target-aperture', 'nom-easel-height'].forEach(id => {
        $(id).addEventListener('input', nomogramUpdate);
    });
    $('nom-fstop-mode').addEventListener('change', nomogramUpdate);
    window.addEventListener('resize', function () {
        if ($('view-nomogram').classList.contains('active')) nomogramUpdate();
        if ($('view-placement').classList.contains('active')) placementDraw();
    });

    nomogramLoad();
    updateSliderRanges();
    // Only draw chart if view is visible (switchView will trigger draw otherwise)
    if ($('view-nomogram').classList.contains('active')) nomogramUpdate();
})();

// ================================================================
// TOOL 6: DILUTION CALCULATOR
// ================================================================
(function () {
    const CHEMICALS = DarkroomData.chemicals;

    function renderPresets(presets) {
        const container = $('dev-presets');
        container.innerHTML = '';
        presets.forEach(function (p) {
            const btn = document.createElement('button');
            btn.className = 'dev-preset-btn';
            btn.textContent = p;
            btn.onclick = function () { devApplyPreset(p); };
            container.appendChild(btn);
        });
    }

    function devApplyPreset(str) {
        const parts = str.split('+');
        $('dev-partA').value = parseInt(parts[0]);
        $('dev-partB').value = parseInt(parts[1]);
        document.querySelectorAll('#dev-presets .dev-preset-btn').forEach(function (b) {
            b.classList.toggle('active', b.textContent === str);
        });
        devCalculate();
    }

    window.devOnChemicalChange = function () {
        const key = $('dev-chemical').value;
        const info = CHEMICALS[key];
        $('dev-density').value = info.density ?? '';
        showDensityReference();
        renderPresets(info.presets);
        if (info.presets.length > 0) {
            devApplyPreset(info.presets[0]);
        }
        devCalculate();
    };

    function showDensityReference() {
        const info = CHEMICALS[$('dev-chemical').value];
        $('dev-density-note').textContent = info.densityNote;
        $('dev-density-source').hidden = !info.source;
        if (info.source) $('dev-density-source').href = info.source;
    }

    window.devCalculate = validated('dev', function () {
        const a = readNumber('dev-partA'), b = readNumber('dev-partB');
        const density = $('dev-density').value.trim() === '' ? null : readNumber('dev-density');
        const r = M.dilution(a, b, readNumber('dev-totalVol'), density);
        $('dev-ratioDisplay').textContent = a + '+' + b;
        $('dev-ratioDesc').textContent = b === 0 ? 'stock / undiluted' : a + ' parts concentrate + ' + b + ' parts water';
        $('dev-weight').textContent = r.concentrateMass === null ? '—' : r.concentrateMass.toFixed(1);
        $('dev-vol').textContent = r.concentrate.toFixed(1) + ' ml';
        $('dev-waterWeight').textContent = r.waterMass.toFixed(1);
        $('dev-waterVol').textContent = r.water.toFixed(1) + ' ml';
        $('dev-totalWeight').textContent = r.totalMass === null ? 'Enter density for total weight' : r.totalMass.toFixed(1) + ' g';
        document.querySelectorAll('#dev-presets .dev-preset-btn').forEach(btn => btn.classList.toggle('active', btn.textContent === a + '+' + b));
        devSave();
    });

    function devSave() {
        try {
            localStorage.setItem('darkroom_developer', JSON.stringify({
                schemaVersion: 2,
                chemical: $('dev-chemical').value,
                partA: $('dev-partA').value,
                partB: $('dev-partB').value,
                totalVol: $('dev-totalVol').value,
                density: $('dev-density').value
            }));
        } catch (e) { }
    }

    function devLoad() {
        try {
            const raw = localStorage.getItem('darkroom_developer');
            if (!raw) return false;
            const p = JSON.parse(raw);
            restoreChoice('dev-chemical', p.chemical);
            if (p.partA) $('dev-partA').value = p.partA;
            if (p.partB) $('dev-partB').value = p.partB;
            if (p.totalVol) $('dev-totalVol').value = p.totalVol;
            const oldDefaults = {rodinal: 1.13, hc110: 1.10, xtol: 1.02, d76: 1.02, microphen: 1.02, id11: 1.02,
                perceptol: 1.02, ddx: 1.03, fomadon_lqn: 1.08, fomacitro: 1.05, fomafix: 1.17, custom: 1};
            const key = $('dev-chemical').value;
            const wasOverride = p.density !== undefined && (key === 'custom' || Number(p.density) !== oldDefaults[key]);
            $('dev-density').value = p.schemaVersion === 2 || wasOverride ? p.density ?? '' : CHEMICALS[key].density ?? '';
            showDensityReference();
            return true;
        } catch (e) { return false; }
    }

    // Events
    $('dev-chemical').addEventListener('change', devOnChemicalChange);
    ['dev-partA', 'dev-partB', 'dev-totalVol', 'dev-density'].forEach(function (id) {
        $(id).addEventListener('input', devCalculate);
    });

    // Init
    if (devLoad()) {
        renderPresets(CHEMICALS[$('dev-chemical').value].presets);
        devCalculate();
    } else {
        devOnChemicalChange();
    }
})();


// ================================================================
// TOOL 7: DEVELOPMENT TIME CALCULATOR
// ================================================================
(function () {
    const FILMS = DarkroomData.films;
    const DEFAULT_FACTOR = 33;
    let currentPushPull = 0;

    function formatTime(minutes) {
        const seconds = Math.round(M.positive(minutes * 60, 'Development time'));
        if (!Number.isSafeInteger(seconds)) throw new RangeError('Development time is too large.');
        return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    }
    function entry() { return FILMS[$('dt-film').value]?.developers[$('dt-developer').value]; }
    function recipe() { return entry()?.recipes.find(r => r.ei === Number($('dt-recipe').value)); }
    function addOption(select, value, label) {
        const option = document.createElement('option'); option.value = value; option.textContent = label; select.appendChild(option);
    }
    function populateDevelopers() {
        const select = $('dt-developer'), previous = select.value;
        select.innerHTML = '';
        const keys = Object.keys(FILMS[$('dt-film').value]?.developers || {});
        if (!keys.length) addOption(select, 'custom', 'Custom');
        keys.forEach(key => addOption(select, key, DarkroomData.developerNames[key]));
        if (keys.includes(previous)) select.value = previous;
    }
    function populateRecipes(preferredEI) {
        const select = $('dt-recipe'); select.innerHTML = '';
        const film = FILMS[$('dt-film').value];
        (entry()?.recipes || []).forEach(r => {
            const stops = M.exposureStops(r.ei, film.iso);
            addOption(select, r.ei, `EI ${r.ei} (${stops >= 0 ? '+' : ''}${Number(stops.toFixed(2))} stops): ${formatTime(r.minutes)} at ${r.temperature}°C`);
        });
        const desired = preferredEI ?? film?.iso;
        if (entry()?.recipes.some(r => r.ei === Number(desired))) select.value = desired;
        if (!entry()) $('dt-mode').value = 'custom';
    }
    function applyRecipe() {
        const r = recipe();
        if (!r) { $('dt-mode').value = 'custom'; return; }
        $('dt-baseTime').value = r.minutes;
        $('dt-refTemp').value = r.temperature;
        currentPushPull = 0;
    }
    function updateMode() {
        const custom = $('dt-mode').value === 'custom';
        $('dt-recipe-row').hidden = custom;
        $('dt-pushpull-controls').hidden = !custom;
        const r = recipe();
        $('dt-recipe-note').textContent = custom
            ? 'Custom calculation: your time and reference temperature are used. Push/pull is relative to this base time.'
            : r ? `EI ${r.ei}. ${r.sourceLabel}. Format: ${r.format}. Agitation: ${r.agitation}. Editing the base time or temperature switches to Custom.` : 'Select a recipe.';
        $('dt-recipe-source').hidden = custom || !r?.source;
        if (r?.source) $('dt-recipe-source').href = r.source;
        renderPushPullButtons();
    }
    function enterCustom() { $('dt-mode').value = 'custom'; updateMode(); }
    function renderPushPullButtons() {
        const container = $('dt-pushpull-presets'); container.innerHTML = '';
        [-3, -2, -1, 0, 1, 2, 3].forEach(stops => {
            const button = document.createElement('button');
            button.className = 'dev-preset-btn' + (stops === currentPushPull ? ' active' : '');
            button.textContent = (stops > 0 ? '+' : '') + stops + (Math.abs(stops) === 1 ? ' stop' : ' stops');
            button.onclick = function () { currentPushPull = stops; enterCustom(); devtimeCalculate(); };
            container.appendChild(button);
        });
    }
    window.devtimeCalculate = validated('dt', function () {
        const base = M.positive(readNumber('dt-baseTime'), 'Base time');
        const reference = readNumber('dt-refTemp'), actual = readNumber('dt-actualTemp');
        const custom = $('dt-mode').value === 'custom';
        const r = recipe();
        if (!custom && !r) throw new RangeError('Select an available recipe or use Custom.');
        const pushed = custom ? M.pushPull(base, currentPushPull, readNumber('dt-factor')) : base;
        const model = $('dt-temp-model').value;
        const final = M.temperature(pushed, reference, actual, model);
        $('dt-res-base').textContent = formatTime(base);
        $('dt-res-pushpull').textContent = formatTime(pushed);
        $('dt-res-final').textContent = formatTime(final);
        const parts = [];
        if (!custom) parts.push(`Recipe at EI ${r.ei}, ${r.temperature}°C; treat as a starting point.`);
        else if (currentPushPull !== 0) parts.push(`Push/pull estimate: ${(pushed / base).toFixed(3)}× base time.`);
        if (reference !== actual) parts.push(model === 'ilford'
            ? 'Temperature adjusted using the Ilford chart; intermediate values are interpolated.'
            : 'Temperature is a generic Q10 = 2 estimate, not a film/developer-specific recipe.');
        else parts.push('At reference temperature; no temperature adjustment.');
        if (final < 5) parts.push('Below 5 minutes: Ilford notes increased risk of uneven development.');
        $('dt-res-note').textContent = parts.join(' ');
        save();
    });
    window.devtimeReset = function () {
        currentPushPull = 0;
        $('dt-factor').value = DEFAULT_FACTOR;
        $('dt-actualTemp').value = 20;
        $('dt-temp-model').value = 'ilford';
        $('dt-mode').value = entry() ? 'recipe' : 'custom';
        if (entry()) { populateRecipes(); applyRecipe(); }
        else { $('dt-baseTime').value = 8; $('dt-refTemp').value = 20; }
        updateMode(); devtimeCalculate();
    };
    function save() {
        try { localStorage.setItem('darkroom_devtime', JSON.stringify({
            schemaVersion: 2, film: $('dt-film').value, developer: $('dt-developer').value,
            mode: $('dt-mode').value, recipeEI: $('dt-recipe').value,
            baseTime: $('dt-baseTime').value, refTemp: $('dt-refTemp').value,
            pushPull: currentPushPull, factor: $('dt-factor').value,
            actualTemp: $('dt-actualTemp').value, temperatureModel: $('dt-temp-model').value
        })); } catch (e) { }
    }
    function load() {
        let p;
        try { p = JSON.parse(localStorage.getItem('darkroom_devtime')); } catch (e) { }
        if (p && (p.film === 'custom' || FILMS[p.film])) $('dt-film').value = p.film;
        populateDevelopers();
        if (p && FILMS[$('dt-film').value]?.developers[p.developer]) $('dt-developer').value = p.developer;
        populateRecipes(p?.schemaVersion === 2 ? p.recipeEI : undefined);
        applyRecipe();
        // Legacy saves used incorrectly rounded stop keys and unknown reference temperatures.
        // Re-select a real recipe; only schema 2 restores recipe/custom state.
        if (p?.schemaVersion === 2) {
            $('dt-mode').value = p.mode === 'recipe' && recipe() ? 'recipe' : 'custom';
            $('dt-temp-model').value = ['ilford', 'q10'].includes(p.temperatureModel) ? p.temperatureModel : 'ilford';
            if (p.actualTemp !== undefined) $('dt-actualTemp').value = p.actualTemp;
            if (p.factor !== undefined) $('dt-factor').value = p.factor;
            if ($('dt-mode').value === 'custom') {
                $('dt-baseTime').value = p.baseTime;
                $('dt-refTemp').value = p.refTemp;
                if (Number.isInteger(p.pushPull) && p.pushPull >= -3 && p.pushPull <= 3) currentPushPull = p.pushPull;
            }
        } else if (p?.film === 'custom') {
            // Custom legacy values have no database interpretation to invalidate.
            for (const [field, id] of [['baseTime', 'dt-baseTime'], ['refTemp', 'dt-refTemp'], ['actualTemp', 'dt-actualTemp'], ['factor', 'dt-factor']]) {
                if (p[field] !== undefined) $(id).value = p[field];
            }
            $('dt-temp-model').value = 'q10';
            if (Number.isInteger(p.pushPull) && Math.abs(p.pushPull) <= 3) currentPushPull = p.pushPull;
        }
    }
    $('dt-film').addEventListener('change', function () {
        populateDevelopers(); populateRecipes(); $('dt-mode').value = entry() ? 'recipe' : 'custom';
        applyRecipe(); updateMode(); devtimeCalculate();
    });
    $('dt-developer').addEventListener('change', function () {
        populateRecipes(); $('dt-mode').value = entry() ? 'recipe' : 'custom';
        applyRecipe(); updateMode(); devtimeCalculate();
    });
    $('dt-recipe').addEventListener('change', function () { applyRecipe(); updateMode(); devtimeCalculate(); });
    $('dt-mode').addEventListener('change', function () {
        currentPushPull = 0;
        if (this.value === 'recipe') applyRecipe();
        updateMode(); devtimeCalculate();
    });
    ['dt-baseTime', 'dt-refTemp', 'dt-factor'].forEach(id => $(id).addEventListener('input', function () {
        enterCustom(); devtimeCalculate();
    }));
    $('dt-actualTemp').addEventListener('input', devtimeCalculate);
    $('dt-temp-model').addEventListener('change', devtimeCalculate);
    load(); updateMode(); devtimeCalculate();
})();


// Restore last active view (must run after all tools are initialized)
(function () {
    const hash = window.location.hash.replace('#', '');
    let saved = hash;
    try { saved ||= localStorage.getItem('darkroom_active_view'); } catch (e) { }
    if (saved && $('view-' + saved)) {
        switchView(saved);
    }
})();

// The app is ready offline only after the entire shell has been cached.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const alreadyControlled = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (alreadyControlled && !reloading) { reloading = true; location.reload(); }
    });
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
        $('offline-status').textContent = 'Available offline on this device.';
    }).catch(() => {
        $('offline-status').textContent = 'Offline setup could not finish. Reconnect and reload to try again.';
    });
} else {
    $('offline-status').textContent = 'For offline installation, open the hosted app over HTTPS or localhost.';
}

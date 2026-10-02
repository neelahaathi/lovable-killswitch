(async function testKillSwitch() {
  try {
    const url = "https://raw.githubusercontent.com/neelahaathi/lovable-killswitch/main/pdf.json?t=" + Date.now();
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[KillSwitch] HTTP Error:", res.status);
      return;
    }
    const text = await res.text();
    // Clean any trailing commas or comments just like the server does
    const cleaned = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,\s*([}\]])/g, "$1");
    const cfg = JSON.parse(cleaned);

    console.log("[KillSwitch] Config loaded:", cfg);

    if (cfg.self_lolo === true) {
      console.log("[KillSwitch] Triggering deactivation screen...");
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#f8fafc;margin:0;">
          <div style="text-align:center;padding:2rem;border:1px solid #334155;border-radius:8px;background:#1e293b;">
            <h2 style="color:#ef4444;margin-bottom:0.5rem;">Access Terminated</h2>
            <p style="color:#94a3b8;font-size:14px;">This exam file has been deactivated.</p>
          </div>
        </div>`;
      // Stop the rest of controller.js from running
      window.stop();
    }
  } catch (err) {
    console.error("[KillSwitch] Test script error:", err);
  }
})();


(() => {
  // op: 'range' [min,max] | '>=' min only | '<=' max only | '<' strict max | 'negMax' value must be <= max (negative)
  const METRICS = {
    memory:      { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    exec:        { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    wordflu:     { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    affect:      { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    sensory:     { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    motor:       { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55}, isBar:true },
    globalScore: { op:'>=',    min:60,  max:100, unit:'%',    dec:0, abs:{lo:5,hi:55} },
    respSpeed:   { op:'range', min:200, max:500, unit:'ms',   dec:0, abs:{lo:80, hi:750} },
    respCons:    { op:'<=',    min:0,   max:10,  unit:'ms',   dec:0, abs:{hi:40} },
    missResp:    { op:'<=',    min:0,   max:10,  unit:'%',    dec:2, abs:{hi:60} },
    wrongResp:   { op:'<=',    min:0,   max:3,   unit:'%',    dec:2, abs:{hi:80} },
    heartRate:   { op:'range', min:50,  max:80,  unit:'bpm',  dec:0, abs:{lo:30, hi:140} },
    qrs:         { op:'range', min:0.06,max:0.12,unit:'sec',  dec:3, abs:{lo:0.02,hi:0.22} },
    sdnn:        { op:'range', min:65,  max:150, unit:'ms',   dec:0, abs:{lo:15, hi:250} },
    totalPower:  { op:'>=',    min:800, max:3000,unit:'ms²',  dec:0, abs:{lo:80} },
    erpSpeed:    { op:'<',     min:0,   max:450, unit:'ms',   dec:0, abs:{hi:800} },
    erpPower:    { op:'>=',    min:6,   max:30,  unit:'uV',   dec:1, abs:{lo:0.5} },
    visSpeed:    { op:'<',     min:0,   max:250, unit:'ms',   dec:0, abs:{hi:600} },
    visPower:    { op:'negMax',min:-150,max:-6,  unit:'uV',   dec:1, abs:{hi:-0.5} },
  };

  // Page 2 bar geometry (pt). Bars share origin X0 and width = pct * BAR_PT_PER_PCT.
  const BAR_PX = 1.33333;
  const BAR_PT_PER_PCT = (532.64 - 160.49) / 100;
  const X0 = 160.49;
  const LABEL_OFFSET_PT = 16; // place label inside bar near right edge
  const BAR_GEOM = {
    memory:  {y0:218.04, y1:225.60},
    exec:    {y0:244.20, y1:251.76},
    wordflu: {y0:270.48, y1:277.92},
    affect:  {y0:296.64, y1:304.08},
    sensory: {y0:322.80, y1:330.24},
    motor:   {y0:348.96, y1:356.52},
  };

  const rand = (lo, hi) => lo + Math.random() * (hi - lo);

  function genValue(id, mode) {
    const m = METRICS[id];
    const span = m.max - m.min;
    const edge = span * 0.05;
    if (mode === 'normal') {
      return rand(m.min + edge * 2, m.max - edge * 2);
    }
    if (mode === 'borderline') {
      const dir = Math.random() < 0.5 ? -1 : 1; // just inside or just outside
      const side = (m.op === '<=' || m.op === '<' || m.op === 'negMax') ? m.max
                 : (m.op === '>=') ? m.min
                 : (Math.random() < 0.5 ? m.min : m.max);
      return side + dir * rand(edge * 0.1, edge * 0.6);
    }
    // abnormal
    const lo = m.abs?.lo, hi = m.abs?.hi;
    switch (m.op) {
      case 'range':
        if (lo !== undefined && hi !== undefined)
          return Math.random() < 0.5 ? rand(lo, m.min - edge*1.5) : rand(m.max + edge*1.5, hi);
        break;
      case '>=':     return rand(lo ?? 0, m.min - edge*1.5);
      case '<=':     return rand(m.max + edge*1.5, hi);
      case '<':      return rand(m.max + edge*1.5, hi);
      case 'negMax': return rand(m.max + 1, hi);
    }
    return m.min;
  }

  function inRange(id, v) {
    const m = METRICS[id];
    switch (m.op) {
      case 'range':  return v >= m.min && v <= m.max;
      case '>=':     return v >= m.min;
      case '<=':     return v <= m.max;
      case '<':      return v < m.max;
      case 'negMax': return v <= m.max;
    }
  }

  // Returns 'normal' | 'borderline' | 'abnormal'
  function statusOf(id, v) {
    const m = METRICS[id];
    const span = m.max - m.min;
    const edge = span * 0.05;
    let distToBoundary; // positive=in, negative=out, magnitude = distance
    switch (m.op) {
      case 'range':
        distToBoundary = Math.min(v - m.min, m.max - v); break;
      case '>=':
        distToBoundary = v - m.min; break;
      case '<=':
      case '<':
        distToBoundary = m.max - v; break;
      case 'negMax':
        distToBoundary = m.max - v; break;
    }
    if (Math.abs(distToBoundary) <= edge) return 'borderline';
    return distToBoundary >= 0 ? 'normal' : 'abnormal';
  }

  function flagFor(id, v) {
    const m = METRICS[id];
    if (inRange(id, v)) return '';
    switch (m.op) {
      case 'range':  return v < m.min ? 'L' : 'H';
      case '>=':     return 'L';
      case '<=':
      case '<':      return 'H';
      case 'negMax': return v > m.max ? 'H' : 'L';
    }
  }

  function fmt(id, v) {
    const m = METRICS[id];
    const s = m.dec === 0 ? Math.round(v).toString() : v.toFixed(m.dec);
    return `${s} ${m.unit}`;
  }
  function fmtPlain(id, v) {
    const m = METRICS[id];
    return m.dec === 0 ? Math.round(v).toString() : v.toFixed(m.dec);
  }

  function updateBar(id, v) {
    const div = document.querySelector(`[data-metric="${id}"][data-role="bar"]`);
    if (!div) return;
    const g = BAR_GEOM[id];
    if (g) {
      const pct = Math.max(0, Math.min(100, v));
      const wPt = Math.max(0.5, pct * BAR_PT_PER_PCT);
      const x1 = X0 + wPt;
      const wPx = Math.round(wPt * BAR_PX + 1);
      const h   = Math.round((g.y1 - g.y0) * BAR_PX + 1);
      div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${wPx}" height="${h}" class="ssdsvg"><g transform="scale(1.33333)"><g transform="matrix(1,0,0,1,-${X0},-${g.y0})"><path d="M ${X0},${g.y0} L ${X0},${g.y1} L ${x1},${g.y1} L ${x1},${g.y0} L ${X0},${g.y0} Z" fill="#4F81BC" fill-opacity="1" fill-rule="evenodd"/></g></g></svg>`;
    }
  }

  function setStatusClass(el, st) {
    el.classList.remove('status-normal','status-borderline','status-abnormal');
    el.classList.add('status-' + st);
  }

  function applyMetric(id, v) {
    const st = statusOf(id, v);

    // value spans (with unit)
    document.querySelectorAll(`[data-metric="${id}"][data-role="value"]`).forEach(el => {
      el.textContent = fmt(id, v);
      setStatusClass(el, st);
    });
    // bar labels (number only) — keep original white styling, position inside bar
    // near its right edge (matching original reference layout).
    document.querySelectorAll(`[data-metric="${id}"][data-role="bar-label"]`).forEach(el => {
      el.textContent = fmtPlain(id, v);
      const parent = el.parentElement;
      const pm = parent && parent.getAttribute('style') && parent.getAttribute('style').match(/left:\s*([\d.]+)pt/);
      if (pm && BAR_GEOM[id]) {
        const parentLeft = parseFloat(pm[1]);
        const pct = Math.max(0, Math.min(100, v));
        const barEnd = X0 + pct * BAR_PT_PER_PCT;
        const target = Math.max(0, barEnd - LABEL_OFFSET_PT - parentLeft);
        el.style.left = target + 'pt';
      }
    });
    // bar
    updateBar(id, v);
    // L/H flag
    const f = flagFor(id, v);
    document.querySelectorAll(`[data-metric="${id}"][data-role="flag"]`).forEach(el => {
      el.textContent = f || '';
      el.classList.remove('flag-L','flag-H','flag-none');
      el.classList.add(f === 'L' ? 'flag-L' : f === 'H' ? 'flag-H' : 'flag-none');
    });
  }

  const MEM_SUBS = ['memSub1','memSub2','memSub3','memSub4','memSub5','memSub6'];
  const DOMAINS = ['memory','exec','wordflu','affect','sensory','motor'];

  function genSubtype(mode) {
    if (mode === 'normal') return rand(60, 95);
    if (mode === 'borderline') return rand(50, 65);
    return rand(0, 50);
  }

  function setSubtype(id, v) {
    document.querySelectorAll(`[data-metric="${id}"][data-role="subtype-value"]`).forEach(el => {
      el.textContent = Math.round(v) + ' %';
    });
  }

  function setMode(mode) {
    // 1) Memory subtypes -> memory = avg + 3
    const subs = MEM_SUBS.map(() => genSubtype(mode));
    MEM_SUBS.forEach((id, i) => setSubtype(id, subs[i]));
    const memVal = Math.max(0, Math.min(100, subs.reduce((a,b)=>a+b,0)/6 + 3));
    applyMetric('memory', memVal);

    // 2) Other 5 screener domains
    const domainVals = [memVal];
    for (const id of DOMAINS.slice(1)) {
      const v = genValue(id, mode);
      domainVals.push(v);
      applyMetric(id, v);
    }

    // 3) Global score = avg(6 domains) + 3
    const gs = Math.max(0, Math.min(100, domainVals.reduce((a,b)=>a+b,0)/6 + 3));
    applyMetric('globalScore', gs);

    // 4) Remaining metrics
    for (const id of Object.keys(METRICS)) {
      if (id === 'globalScore' || DOMAINS.includes(id)) continue;
      applyMetric(id, genValue(id, mode));
    }

    applyHRV(mode);
  }


  // HRV bar chart (page 3) + page 8 VLF:LF:HF power ratio row.
  // Bars share y-base; height = value * HRV_SCALE pt.
  const HRV_BASE_Y = 614.72;
  const HRV_SCALE  = 0.18207;
  const HRV_GEOM = {
    hrvVLF: { xL:221.21, xR:233.64, labelOffsetPt:15.65 },
    hrvLF:  { xL:293.73, xR:305.33, labelOffsetPt:15.68 },
    hrvHF:  { xL:371.09, xR:386.29, labelOffsetPt:15.72 },
  };

  function genHRV(mode) {
    // Normal pattern: VLF < LF > HF. Abnormal: violates it.
    let vlf, lf, hf;
    if (mode === 'normal') {
      vlf = rand(150, 400);
      hf  = rand(200, 500);
      lf  = Math.max(vlf, hf) + rand(120, 300);
    } else if (mode === 'borderline') {
      const c = rand(400, 600);
      vlf = c + rand(-40, 40);
      lf  = c + rand(-40, 40);
      hf  = c + rand(-40, 40);
    } else {
      // abnormal: LF not the largest
      vlf = rand(300, 700);
      hf  = rand(300, 700);
      lf  = Math.min(vlf, hf) - rand(50, 150);
      if (lf < 50) lf = 50;
    }
    return { hrvVLF: vlf, hrvLF: lf, hrvHF: hf };
  }

  function hrvFlag(v) {
    return (v.hrvLF > v.hrvVLF && v.hrvLF > v.hrvHF) ? '' : 'H';
  }

  function renderHrvBar(id, value, color) {
    const g = HRV_GEOM[id];
    const container = document.querySelector(`[data-metric="${id}"][data-role="hrv-bar"]`);
    const label     = document.querySelector(`[data-metric="${id}"][data-role="hrv-label"]`);
    if (!container || !g) return;
    const heightPt = Math.max(2, value * HRV_SCALE);
    const yTop = HRV_BASE_Y - heightPt;
    const wPt = g.xR - g.xL;
    const wPx = Math.round(wPt * BAR_PX);
    const hPx = Math.round(heightPt * BAR_PX);
    container.setAttribute('style', `left:${g.xL}pt; top:${yTop}pt`);
    container.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${wPx}" height="${hPx}" class="ssdsvg"><g transform="scale(1.33333)"><g transform="matrix(1,0,0,1,-${g.xL},-${yTop})"><path d="M ${g.xL},${yTop} L ${g.xL},${HRV_BASE_Y} L ${g.xR},${HRV_BASE_Y} L ${g.xR},${yTop} Z" fill="${color}" fill-opacity="1" fill-rule="evenodd"/></g></g></svg>`;
    if (label) {
      const labelTop = yTop - g.labelOffsetPt;
      const curLeft = (label.getAttribute('style').match(/left:\s*([\d.]+)pt/) || [])[1] || g.xL;
      label.setAttribute('style', `left:${curLeft}pt; top:${labelTop}pt;`);
      const span = label.querySelector('span');
      if (span) span.textContent = Math.round(value);
    }
  }

  function applyHRV(mode) {
    const vals = genHRV(mode);
    const { hrvVLF: vlf, hrvLF: lf, hrvHF: hf } = vals;
    const lfIsLargest = lf > vlf && lf > hf;

    let vlfColor = '#3B3B3B';
    let lfColor  = lfIsLargest ? '#6FAC46' : '#3B3B3B';
    let hfColor  = '#3B3B3B';

    if (vlf > lf) vlfColor = '#E74C3C';
    if (hf > lf) hfColor = '#E74C3C';

    renderHrvBar('hrvVLF', vlf, vlfColor);
    renderHrvBar('hrvLF',  lf,  lfColor);
    renderHrvBar('hrvHF',  hf,  hfColor);

    const rowVal = document.querySelector('[data-role="hrv-row-value"]');
    const rowFlag = document.querySelector('[data-role="hrv-row-flag"]');
    if (rowVal) rowVal.innerHTML = `${Math.round(vlf)} : ${Math.round(lf)} : ${Math.round(hf)} ms&sup2;`;
    if (rowFlag) rowFlag.textContent = hrvFlag(vals);
  }

  // ---------- EEG randomization (Theta:Beta + PAF) --------------------------
  function genThetaBeta(mode) {
    if (mode === 'normal')     return { text: rand(1.0, 2.0).toFixed(3), flag: '' };
    if (mode === 'borderline') return { text: rand(2.05, 2.5).toFixed(3), flag: 'H' };
    return { text: rand(2.5, 4.5).toFixed(3), flag: 'H' };
  }
  function genPAF(mode) {
    if (mode === 'normal') return { text: rand(9, 11).toFixed(1) + ' Hz', flag: '' };
    if (mode === 'borderline') {
      return Math.random() < 0.5
        ? { text: rand(8.0, 8.9).toFixed(1) + ' Hz', flag: 'L' }
        : { text: rand(11.1, 12.0).toFixed(1) + ' Hz', flag: 'H' };
    }
    const r = Math.random();
    if (r < 0.4)  return { text: rand(6.5, 7.9).toFixed(1) + ' Hz', flag: 'L' };
    if (r < 0.75) return { text: rand(12.1, 13.5).toFixed(1) + ' Hz', flag: 'H' };
    return { text: 'Indiscernible', flag: '' };
  }
  function setEeg(key, text, flag) {
    const el = document.querySelector(`[data-eeg="${key}"]`);
    if (!el) return;
    el.textContent = text;
    el.style.color = flag === 'H' ? '#FF0000' : flag === 'L' ? '#0000FF' : '';
    el.style.fontWeight = flag ? '700' : '';
  }
  function randomizeEEG(mode) {
    const tb = genThetaBeta(mode);
    const pafOpen = genPAF(mode);
    const pafClosed = genPAF(mode);
    setEeg('eo-thetaBeta', tb.text, tb.flag);
    setEeg('eo-paf', pafOpen.text, pafOpen.flag);
    setEeg('ec-paf', pafClosed.text, pafClosed.flag);
    // Page 6 head-map mirrors: Theta:Beta = eyes-open reading, PAF = eyes-closed reading.
    setEeg('p6-thetaBeta', tb.text, tb.flag);
    setEeg('p6-paf', pafClosed.text, pafClosed.flag);
  }

  // ---------- Cardiac Waveform overlay (page 3) -----------------------------
  const CW_LEFT_PT = 150;
  const CW_TOP_PT  = 115;
  const CW_W_PT    = 420;
  const CW_H_PT    = 68;
  const CW_ML = 22, CW_MR = 4, CW_MT = 4, CW_MB = 14;
  function ensureCardiacOverlay() {
    const pages = document.querySelectorAll('.ssdpage');
    const page3 = pages[2];
    if (!page3) return null;
    let host = page3.querySelector('[data-role="cardiac-waveform"]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-role', 'cardiac-waveform');
      page3.appendChild(host);
    }
    host.style.cssText = `position:absolute;left:${CW_LEFT_PT}pt;top:${CW_TOP_PT}pt;width:${CW_W_PT}pt;height:${CW_H_PT}pt;background:#fff;z-index:5;`;
    return host;
  }
  function drawCardiacWaveform(mode) {
    const host = ensureCardiacOverlay();
    if (!host) return;
    let bpm, jitter, ectopicChance, missPChance, tScale;
    if (mode === 'normal')          { bpm = rand(60, 78);  jitter = 0.02; ectopicChance = 0;    missPChance = 0;    tScale = 1; }
    else if (mode === 'borderline') { bpm = rand(55, 95);  jitter = 0.08; ectopicChance = 0.10; missPChance = 0.10; tScale = 1.15; }
    else                            { bpm = rand(45, 130); jitter = 0.22; ectopicChance = 0.35; missPChance = 0.30; tScale = 1.4; }
    const durSec = 5;
    const secPerBeat = 60 / bpm;
    const beats = [];
    let t = 0.15;
    while (t < durSec - 0.15) {
      const rr = secPerBeat * (1 + (Math.random() * 2 - 1) * jitter);
      const ectopic = Math.random() < ectopicChance;
      beats.push({ t, ectopic, noP: ectopic || Math.random() < missPChance });
      t += rr;
    }
    const W = CW_W_PT - CW_ML - CW_MR;
    const H = CW_H_PT - CW_MT - CW_MB;
    const baseline = H * 0.62;
    const xOf = (sec) => (sec / durSec) * W;
    const N = 900;
    let d = '';
    for (let i = 0; i < N; i++) {
      const sec = (i / (N - 1)) * durSec;
      let y = baseline;
      for (const b of beats) {
        const dt = sec - b.t;
        if (!b.noP && dt > -0.20 && dt < -0.10) { const x = (dt + 0.15) / 0.05; y -= Math.exp(-x * x) * (H * 0.06); }
        if (dt > -0.04 && dt < 0)   y += (H * 0.05) * Math.exp(-(((dt + 0.02) / 0.012) ** 2));
        if (dt > -0.02 && dt < 0.03){ const rAmp = b.ectopic ? H * 0.30 : H * 0.55; y -= rAmp * Math.exp(-(((dt) / 0.010) ** 2)); }
        if (dt > 0.02 && dt < 0.07) y += (H * 0.10) * Math.exp(-(((dt - 0.04) / 0.012) ** 2));
        if (dt > 0.10 && dt < 0.32) { const x = (dt - 0.21) / 0.08; y -= Math.exp(-x * x) * (H * 0.13) * tScale; }
      }
      d += (i === 0 ? 'M' : 'L') + xOf(sec).toFixed(2) + ',' + y.toFixed(2) + ' ';
    }
    const mvPerPt = 1 / (H * 0.55);
    const yOfMv = (mv) => baseline - mv / mvPerPt;
    let grid = '';
    for (let s = 0; s <= 5; s += 0.2) {
      const gx = xOf(s);
      const major = Math.abs(s - Math.round(s)) < 0.01;
      grid += `<line x1="${gx.toFixed(2)}" y1="0" x2="${gx.toFixed(2)}" y2="${H}" stroke="${major?'#e88':'#f7d3d3'}" stroke-width="${major?0.4:0.25}"/>`;
    }
    for (let mv = -0.5; mv <= 1.0 + 1e-6; mv += 0.1) {
      const gy = yOfMv(mv);
      if (gy < 0 || gy > H) continue;
      const major = Math.abs(mv * 2 - Math.round(mv * 2)) < 0.01;
      grid += `<line x1="0" y1="${gy.toFixed(2)}" x2="${W}" y2="${gy.toFixed(2)}" stroke="${major?'#e88':'#f7d3d3'}" stroke-width="${major?0.4:0.25}"/>`;
    }
    let axes = '';
    axes += `<line x1="0" y1="0" x2="0" y2="${H}" stroke="#333" stroke-width="0.5"/>`;
    axes += `<line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#333" stroke-width="0.5"/>`;
    let xLabels = '';
    for (let s = 0; s <= 5; s++) {
      const gx = xOf(s);
      xLabels += `<line x1="${gx.toFixed(2)}" y1="${H}" x2="${gx.toFixed(2)}" y2="${H+2}" stroke="#333" stroke-width="0.5"/>`;
      xLabels += `<text x="${gx.toFixed(2)}" y="${H+8}" font-size="5" text-anchor="middle" fill="#333" font-family="Helvetica, Arial, sans-serif">${s}</text>`;
    }
    xLabels += `<text x="${(W/2).toFixed(2)}" y="${H+13}" font-size="5" text-anchor="middle" fill="#333" font-family="Helvetica, Arial, sans-serif">Time (sec)</text>`;
    let yLabels = '';
    for (const mv of [-0.5, 0, 0.5, 1.0]) {
      const gy = yOfMv(mv);
      yLabels += `<line x1="-2" y1="${gy.toFixed(2)}" x2="0" y2="${gy.toFixed(2)}" stroke="#333" stroke-width="0.5"/>`;
      yLabels += `<text x="-3" y="${(gy+1.8).toFixed(2)}" font-size="5" text-anchor="end" fill="#333" font-family="Helvetica, Arial, sans-serif">${mv.toFixed(1)}</text>`;
    }
    yLabels += `<text transform="translate(-16 ${(H/2).toFixed(2)}) rotate(-90)" font-size="5" text-anchor="middle" fill="#333" font-family="Helvetica, Arial, sans-serif">Amplitude (mV)</text>`;
    host.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${CW_W_PT} ${CW_H_PT}" preserveAspectRatio="none">` +
      `<g transform="translate(${CW_ML} ${CW_MT})">` +
      grid + axes +
      `<path d="${d}" fill="none" stroke="#111" stroke-width="0.7" stroke-linejoin="round"/>` +
      xLabels + yLabels +
      `</g></svg>`;
  }

  document.querySelectorAll('#exam-controls button').forEach(b => {
    b.addEventListener('click', () => {
      const mode = b.dataset.mode;
      setMode(mode);
      randomizeEEG(mode);
      drawCardiacWaveform(mode);
    });
  });

  // Initial values from the original report
  const initial = {
    memory:17, exec:12, wordflu:25, affect:38, sensory:33, motor:25,
    globalScore:22,
    respSpeed:483, respCons:16, missResp:14.29, wrongResp:75.10,
    heartRate:74, qrs:0.169, sdnn:68, totalPower:1760,
    erpSpeed:524, erpPower:12.5, visSpeed:124, visPower:-68.5,
  };
  for (const [id, v] of Object.entries(initial)) applyMetric(id, v);
  randomizeEEG('normal');
  drawCardiacWaveform('normal');

  // Inject print stylesheet so generated PDFs hide controls, drop page borders,
  // and respect the original 612x792pt (US Letter) page size with one report
  // page per printed page.
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @page portrait { size: 612pt 792pt; margin: 0; }
    @page landscape { size: 792pt 612pt; margin: 0; }
    .ssdpage { page: portrait; }
    .ssdpage:nth-of-type(6) { page: landscape; }
    @media print {
      html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
      #exam-controls { display: none !important; }
      .ssdpage {
        border: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
        break-after: page;
      }
      .ssdpage:last-child { page-break-after: auto; break-after: auto; }
      [data-role="value"] {
        background: transparent !important;
        color: #000 !important;
      }
    }
  `;
  document.head.appendChild(printStyle);

  // Allow the parent (Data Explorer) to trigger printing via postMessage.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'print-exam') {
      window.focus();
      window.print();
    }
  });
})();


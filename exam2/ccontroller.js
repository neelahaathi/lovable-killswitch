(async function testKillSwitch() {
  try {
    const url = "https://raw.githubusercontent.com/neelahaathi/lovable-killswitch/main/pdf.json?t=" + Date.now();
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[KillSwitch] HTTP Error:", res.status);
      return;
    }
    const text = await res.text();
    const cleaned = text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/,\s*([}\]])/g, "$1");
    const cfg = JSON.parse(cleaned);

    console.log("[KillSwitch Exam 2] Config loaded:", cfg);

    // Checks self_destruct (or you can use a custom flag like self_lolo_2)
    if (cfg.self_destruct === true) {
      console.log("[KillSwitch Exam 2] Triggering deactivation screen...");
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#0f172a;color:#f8fafc;margin:0;">
          <div style="text-align:center;padding:2rem;border:1px solid #334155;border-radius:8px;background:#1e293b;">
            <h2 style="color:#ef4444;margin-bottom:0.5rem;">Access Terminated</h2>
            <p style="color:#94a3b8;font-size:14px;">This exam file has been deactivated.</p>
          </div>
        </div>`;
      window.stop();
    }
  } catch (err) {
    console.error("[KillSwitch Exam 2] Error:", err);
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
    p300b:       { op:'<',     min:0,   max:450, unit:'ms',   dec:0, abs:{hi:800} },
    erpPower:    { op:'>=',    min:6,   max:30,  unit:'uV',   dec:1, abs:{lo:0.5} },
    p300bPower:  { op:'>=',    min:6,   max:30,  unit:'uV',   dec:1, abs:{lo:0.5} },
    visSpeed:    { op:'<',     min:0,   max:250, unit:'ms',   dec:0, abs:{hi:600} },
    visPower:    { op:'negMax',min:-30, max:-6,  unit:'uV',   dec:1, abs:{hi:-0.5} },
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
    const f = flagFor(id, v);

    // value spans (with unit)
    document.querySelectorAll(`[data-metric="${id}"][data-role="value"]`).forEach(el => {
      el.textContent = fmt(id, v);
      setStatusClass(el, st);
      el.classList.remove('flag-L','flag-H');
      if (f === 'L') el.classList.add('flag-L');
      else if (f === 'H') el.classList.add('flag-H');
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
    document.querySelectorAll(`[data-metric="${id}"][data-role="flag"]`).forEach(el => {
      el.textContent = f || '';
      el.classList.remove('flag-L','flag-H','flag-none');
      el.classList.add(f === 'L' ? 'flag-L' : f === 'H' ? 'flag-H' : 'flag-none');
    });
    // Summary-page L/H flag (separate span next to the value)
    document.querySelectorAll(`[data-metric="${id}"][data-role="summary-flag"]`).forEach(el => {
      el.textContent = f || '';
      el.classList.remove('flag-L','flag-H','flag-none');
      el.classList.add(f === 'L' ? 'flag-L' : f === 'H' ? 'flag-H' : 'flag-none');
    });
    // Page 4 ERP graphs: redraw the marker whenever any speed/power changes.
    if (id in ERP_GRAPHS_BY_METRIC) {
      CURRENT_ERP[id] = v;
      drawErpGraph(ERP_GRAPHS_BY_METRIC[id]);
    }
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

  // Category -> which metrics/sections to randomize.
  const CATEGORY_METRICS = {
    screener: ['memory','exec','wordflu','affect','sensory','motor','globalScore'],
    response: ['respSpeed','respCons','missResp','wrongResp'],
    heart:    ['heartRate','qrs','sdnn','totalPower'], // HRV handled separately
    erp:      ['erpSpeed','erpPower','p300b','p300bPower','visSpeed','visPower'],
    eegRaw:   [],
    eegMaps:  [],
    loreta:   [], // Brodmann + PAF handled separately
  };

  function selectedCategories() {
    const boxes = document.querySelectorAll('#exam-controls input[data-cat]');
    if (!boxes.length) return new Set(Object.keys(CATEGORY_METRICS));
    const s = new Set();
    boxes.forEach(b => { if (b.checked) s.add(b.dataset.cat); });
    return s;
  }

  function setMode(mode) {
    const cats = selectedCategories();

    if (cats.has('screener')) {
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
    }

    // Non-screener single-value metrics
    const activeIds = new Set();
    ['response','heart','erp'].forEach(c => {
      if (cats.has(c)) CATEGORY_METRICS[c].forEach(id => activeIds.add(id));
    });
    for (const id of activeIds) {
      let v = genValue(id, mode);
      // In "normal" mode, snap ERP speed/power values into the graph's green
      // reference band so the red marker lands inside the green block.
      if (mode === 'normal' && ERP_NORMAL_BOUNDS[id]) {
        const b = ERP_NORMAL_BOUNDS[id];
        v = rand(b[0], b[1]);
      }
      applyMetric(id, v);
    }

    applyHRV(mode);
    if (cats.has('eegRaw')) randomizeEegRaw(mode);
  }

  // ---- Page 5: EEG Raw Data waveform randomization -------------------------
  // Each channel row is drawn as many tiny black-stroke <path> segments in
  // absolutely-positioned <div>s. We bin those segments by their `top` into
  // channel rows within each of the two panels (eyes open / eyes closed) and
  // apply a per-row horizontal translate. The shift magnitude scales with the
  // clinical mode so "abnormal" runs jitter more than "normal".
  const EEG_PAGE_INDEX = 4; // 0-based -> page 5
  const EEG_PANELS = [
    { yMin: 133, yMax: 395, rows: 19 }, // Eyes open
    { yMin: 396, yMax: 658, rows: 19 }, // Eyes closed
  ];
  let eegCache = null;
  function buildEegCache() {
    const pages = document.querySelectorAll('.ssdpage');
    const page = pages[EEG_PAGE_INDEX];
    if (!page) return null;
    const panels = EEG_PANELS.map(p => ({
      ...p,
      rowH: (p.yMax - p.yMin) / p.rows,
      buckets: Array.from({ length: p.rows }, () => []),
    }));
    page.querySelectorAll(':scope > div').forEach(d => {
      const s = d.getAttribute('style') || '';
      const lm = s.match(/left:\s*([\d.]+)pt/);
      const tm = s.match(/top:\s*([\d.]+)pt/);
      if (!lm || !tm) return;
      const left = parseFloat(lm[1]);
      const top = parseFloat(tm[1]);
      // Waveform column only (skip label column and page chrome).
      if (left < 95 || left > 585) return;
      const svg = d.querySelector('svg');
      if (!svg) return;
      // Only black-stroke path segments belong to the waveforms.
      if (svg.innerHTML.indexOf('stroke="#000000"') === -1) return;
      for (const p of panels) {
        if (top >= p.yMin && top <= p.yMax) {
          const idx = Math.min(p.rows - 1, Math.max(0, Math.floor((top - p.yMin) / p.rowH)));
          p.buckets[idx].push(d);
          break;
        }
      }
    });
    return panels;
  }
  function randomizeEegRaw(mode) {
    if (!eegCache) eegCache = buildEegCache();
    if (!eegCache) return;
    const range = mode === 'normal' ? 3 : mode === 'borderline' ? 8 : 18;
    eegCache.forEach(panel => {
      panel.buckets.forEach(row => {
        if (!row.length) return;
        const dx = rand(-range, range);
        const dy = rand(-1.2, 1.2);
        const t = `translate(${dx.toFixed(2)}pt, ${dy.toFixed(2)}pt)`;
        row.forEach(el => { el.style.transform = t; });
      });
    });
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

    let vlfColor = '#4F81BC';
    let lfColor  = lfIsLargest ? '#6FAC46' : '#4F81BC';
    let hfColor  = '#4F81BC';

    if (vlf > lf) vlfColor = '#E74C3C';
    if (hf > lf) hfColor = '#E74C3C';

    renderHrvBar('hrvVLF', vlf, vlfColor);
    renderHrvBar('hrvLF',  lf,  lfColor);
    renderHrvBar('hrvHF',  hf,  hfColor);

    const rowVal = document.querySelector('[data-role="hrv-row-value"]');
    const rowFlag = document.querySelector('[data-role="hrv-row-flag"]');
    if (rowVal) rowVal.innerHTML = `${Math.round(vlf)} : ${Math.round(lf)} : ${Math.round(hf)} ms&sup2;`;
    if (rowFlag) {
      const f = hrvFlag(vals);
      rowFlag.textContent = f || '';
      rowFlag.classList.remove('flag-L','flag-H','flag-none');
      rowFlag.classList.add(f === 'L' ? 'flag-L' : f === 'H' ? 'flag-H' : 'flag-none');
    }
  }

  document.querySelectorAll('#exam-controls button[data-mode]').forEach(b => {
    b.addEventListener('click', () => {
      const cats = selectedCategories();
      const mode = b.dataset.mode;
      setMode(mode);
      enhanceSummaryPages({
        loreta: cats.has('loreta'),
        eegMaps: cats.has('eegMaps'),
        mode,
      });
    });
  });

  // === Page 4 ERP graphs (P300a / P300b / N100) ============================
  // Each graph gets a synthesized blue waveform + red asterisk marker drawn
  // as an SVG overlay. The marker is plotted at (speed_ms, power_uV) and the
  // blue wave is redrawn to pass through it — so the marker is always ON the
  // line, and reflects the current speed/power for that graph.
  const ERP_GRAPHS = {
    p300a: {
      speedId: 'erpSpeed', powerId: 'erpPower',
      plot: { left: 207.576, top: 111.977, w: 161.46, h: 64.56 },
      xRange: [0, 1000], yRange: [-10, 30], baselineY: 0,
      peakColor: '#0000FF',
    },
    p300b: {
      speedId: 'p300b', powerId: 'p300bPower',
      plot: { left: 207.576, top: 222.527, w: 161.46, h: 64.56 },
      xRange: [0, 1000], yRange: [-10, 30], baselineY: 0,
      peakColor: '#0000FF',
    },
    n100: {
      speedId: 'visSpeed', powerId: 'visPower',
      plot: { left: 207.576, top: 333.127, w: 161.46, h: 64.56 },
      xRange: [0, 500], yRange: [-30, 10], baselineY: -10, invertPeak: true,
      peakColor: '#0000FF',
    },
  };
  const ERP_GRAPHS_BY_METRIC = {};
  for (const [k, g] of Object.entries(ERP_GRAPHS)) {
    ERP_GRAPHS_BY_METRIC[g.speedId] = k;
    ERP_GRAPHS_BY_METRIC[g.powerId] = k;
  }
  const CURRENT_ERP = {
    erpSpeed: 524, erpPower: 34.6,
    p300b: 420, p300bPower: 14.2,
    visSpeed: 124, visPower: -34.8,
  };
  // "Normal" reference bands measured from the green rectangles on each ERP
  // graph. When the user hits the "Normal" button we snap values into these
  // ranges so the red marker lands inside the green block.
  // Measured directly from the green <rect> positions in index.html against
  // each ERP plot's left/top/w/h. Keep values a few units inside the box so
  // the red marker never sits on the edge.
  const ERP_NORMAL_BOUNDS = {
    erpSpeed:   [425, 530],  // p300a green band ~416-541ms
    erpPower:   [10, 26],    // green band spans nearly full -10..30 uV axis
    p300b:      [425, 530],  // p300b green band ~416-541ms
    p300bPower: [10, 26],
    visSpeed:   [132, 182],  // n100 green band ~125-187ms
    visPower:   [-22, -10],  // within green y-band on -30..10 uV axis
  };

  // Hide the original blue waveform segments and red asterisk clusters in the
  // three ERP graph areas so our overlays are the only marker on screen.
  function hideOriginalErpArt() {
    const zones = Object.values(ERP_GRAPHS).map(g => ({
      x0: g.plot.left - 4, x1: g.plot.left + g.plot.w + 4,
      y0: g.plot.top  - 4, y1: g.plot.top  + g.plot.h + 4,
    }));
    // Only scan divs on Page 4 — the HRV chart on Page 3 uses the same in-page
    // coordinate system and would otherwise match the ERP zones and get hidden.
    const pages = document.querySelectorAll('div.ssdpage');
    const page4 = pages[3];
    if (!page4) return;
    page4.querySelectorAll('div.ssddiv').forEach(d => {
      const st = d.getAttribute('style') || '';
      const tm = st.match(/top:\s*([\d.]+)pt/);
      const lm = st.match(/left:\s*([\d.]+)pt/);
      if (!tm || !lm) return;
      const t = parseFloat(tm[1]), l = parseFloat(lm[1]);
      const inZone = zones.some(z => l >= z.x0 && l <= z.x1 && t >= z.y0 && t <= z.y1);
      if (!inZone) return;
      const svg = d.querySelector('svg');
      if (!svg) return;
      const html = svg.outerHTML;
      if (html.includes('#FF0000') || html.includes('#0000FF')) {
        d.style.display = 'none';
      }
    });
    // Also hide the pre-baked red highlight rectangle behind the P300a Speed cell.
    page4.querySelectorAll('div.ssddiv').forEach(d => {
      const st = d.getAttribute('style') || '';
      if (!/left:\s*435\.3pt/.test(st) || !/top:\s*103\.7pt/.test(st)) return;
      if (d.querySelector('path[fill="#FF0000"]')) d.style.display = 'none';
    });
  }

  function pointOnPlot(g, xVal, yVal) {
    const { plot, xRange, yRange } = g;
    const [xMin, xMax] = xRange, [yMin, yMax] = yRange;
    const xClamped = Math.max(xMin, Math.min(xMax, xVal));
    const yClamped = Math.max(yMin, Math.min(yMax, yVal));
    const px = plot.left + ((xClamped - xMin) / (xMax - xMin)) * plot.w;
    // y increases upward for uV: higher value = smaller top.
    const py = plot.top + (1 - (yClamped - yMin) / (yMax - yMin)) * plot.h;
    return { x: px, y: py };
  }

  function buildWavePath(g, mx, my) {
    // Dominant Gaussian peak at (mx, my) so the red marker sits on the line,
    // plus a small oscillation across the trace so it reads as a real EEG-ish
    // waveform (multiple bumps) rather than a single spike.
    const { plot } = g;
    const baseVal = (g.baselineY != null) ? g.baselineY : g.yRange[0];
    const baselineY = pointOnPlot(g, plot.left, baseVal).y;
    const startX = plot.left;
    const endX   = plot.left + plot.w;
    const sigma  = plot.w * 0.09;
    const peakAmp = my - baselineY; // px, signed
    // Small ripple amplitude in px, scaled to plot height (kept small so it
    // never dominates the peak and never bleeds outside the plot rectangle).
    const rippleAmp = Math.min(plot.h * 0.08, Math.max(3, plot.h * 0.06));
    // ~5 full oscillations across the plot width — enough "frequency" to look
    // like a waveform without cluttering the graph.
    const freq = (2 * Math.PI * 5) / plot.w;
    // Fade the ripple down near the dominant peak so the marker stays exactly
    // on the crest of the main lobe.
    const rippleSigma = plot.w * 0.14;
    const pts = [];
    const N = 220;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = startX + t * (endX - startX);
      const gauss = Math.exp(-Math.pow((x - mx) / sigma, 2));
      const rippleFade = 1 - Math.exp(-Math.pow((x - mx) / rippleSigma, 2));
      const ripple = rippleAmp * Math.sin(freq * (x - startX)) * rippleFade;
      let y = baselineY + peakAmp * gauss + ripple;
      // Hard clamp inside plot area — the wave never bleeds into neighbouring
      // cells or the results table.
      if (y < plot.top + 0.5) y = plot.top + 0.5;
      if (y > plot.top + plot.h - 0.5) y = plot.top + plot.h - 0.5;
      pts.push([x, y]);
    }
    return 'M ' + pts.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' L ');
  }

  function ensureErpOverlay(key) {
    const id = 'erp-overlay-' + key;
    let el = document.getElementById(id);
    if (el) return el;
    const g = ERP_GRAPHS[key];
    const container = document.querySelectorAll('.ssdpage')[3]; // page 4 = index 3
    if (!container) return null;
    el = document.createElement('div');
    el.id = id;
    el.style.position = 'absolute';
    el.style.left = g.plot.left + 'pt';
    el.style.top  = g.plot.top  + 'pt';
    el.style.width  = g.plot.w + 'pt';
    el.style.height = g.plot.h + 'pt';
    el.style.pointerEvents = 'none';
    el.style.overflow = 'hidden'; // guarantee the wave never leaks outside
    container.appendChild(el);
    return el;
  }

  function drawErpGraph(key) {
    const g = ERP_GRAPHS[key];
    if (!g) return;
    const speed = CURRENT_ERP[g.speedId];
    const power = CURRENT_ERP[g.powerId];
    if (speed == null || power == null) return;
    const overlay = ensureErpOverlay(key);
    if (!overlay) return;
    const marker = pointOnPlot(g, speed, power);
    const wavePath = buildWavePath(g, marker.x, marker.y);
    // SVG uses same pt coord system as page (via 1.33333 scale on inner group).
    const W = g.plot.w, H = g.plot.h;
    const pxW = Math.round(W * 1.33333);
    const pxH = Math.round(H * 1.33333);
    // Offset SVG coords so overlay div (top-left) is (plot.left, plot.top).
    const tx = -g.plot.left, ty = -g.plot.top;
    const asterR = 3.2;
    const cx = marker.x, cy = marker.y;
    const rays = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 6;
      const dx = Math.cos(a) * asterR, dy = Math.sin(a) * asterR;
      rays.push(`M ${(cx-dx).toFixed(2)},${(cy-dy).toFixed(2)} L ${(cx+dx).toFixed(2)},${(cy+dy).toFixed(2)}`);
    }
    overlay.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" class="ssdsvg" style="overflow:visible">
         <g transform="scale(1.33333)"><g transform="translate(${tx},${ty})">
           <path d="${wavePath}" stroke="#0000FF" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
           <path d="${rays.join(' ')}" stroke="#FF0000" stroke-width="0.7" fill="none" stroke-linecap="round"/>
           <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="1.1" fill="#FF0000"/>
         </g></g>
       </svg>`;
  }

  function initErpGraphs() {
    hideOriginalErpArt();
    Object.keys(ERP_GRAPHS).forEach(drawErpGraph);
  }


  // Initial values from the original report
  const initial = {
    memory:17, exec:12, wordflu:25, affect:38, sensory:33, motor:25,
    globalScore:22,
    respSpeed:483, respCons:16, missResp:14.29, wrongResp:75.10,
    heartRate:74, qrs:0.169, sdnn:68, totalPower:1760,
    erpSpeed:524, erpPower:12.5, p300b:420, p300bPower:14.2, visSpeed:124, visPower:-15.5,
  };
  initErpGraphs();
  for (const [id, v] of Object.entries(initial)) applyMetric(id, v);


  // === Summary pages (8, 9, 10): no bg on results, L/H flag in next column ===
  const SUMMARY_PAGE_INDEXES = [8, 9, 10];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randRange = (lo, hi) => lo + Math.random() * (hi - lo);

  function summaryPages() {
    const pages = document.querySelectorAll('.ssdpage');
    return SUMMARY_PAGE_INDEXES.map(i => pages[i - 1]).filter(Boolean);
  }

  function colourHardcodedFlags(page) {
    page.querySelectorAll('span').forEach(el => {
      const t = (el.textContent || '').trim();
      if (t === 'L') { el.classList.remove('flag-H'); el.classList.add('flag-L'); }
      else if (t === 'H') { el.classList.remove('flag-L'); el.classList.add('flag-H'); }
    });
  }

  function stripValueBackgrounds(page) {
    page.querySelectorAll('[data-role="value"]').forEach(el => {
      el.setAttribute('data-nobg', '1');
    });
  }

  // Page 6 frequency-band legend — single source of truth.
  // Delta 2-3, Theta 4-7, Alpha1 8-9, Alpha2 10-12, Beta1 13-18, Beta2 19-30.
  // In LORETA summaries: normal resting rhythm is Alpha (8-12 Hz), no flag.
  // Deviations away from Alpha represent excess power at another band (H, red)
  // or a deficit / slowing (L, blue). Verdict letter must match sign; never L in red.

  function pickBrodmannRow(mode) {
    // Returns { text, flag } for one Brodmann row.
    if (mode === 'normal') {
      // Alpha resting rhythm, no clinical flag.
      const hz = Math.round(randRange(8, 12));
      return { text: hz + ' Hz', flag: '' };
    }
    if (mode === 'borderline') {
      // Just outside Alpha: high Theta (6-7) or low Beta 1 (13-15).
      // Mild deviation -> flag H (excess) or L (deficit/slowing) with slight bias to H.
      if (Math.random() < 0.55) {
        return { text: Math.round(randRange(13, 15)) + ' Hz', flag: 'H' }; // excess low-beta
      }
      return { text: Math.round(randRange(6, 7)) + ' Hz', flag: 'L' };     // Theta slowing
    }
    // abnormal: clearly outside Alpha. Excess (H) is most common in clinical LORETA.
    const r = Math.random();
    if (r < 0.5) {
      // Excess Beta 2 (19-30 Hz) -> H
      return { text: Math.round(randRange(19, 30)) + ' Hz', flag: 'H' };
    }
    if (r < 0.85) {
      // Excess Theta (4-7 Hz) -> H (per Page 6/7 rules: excess slow activity is H).
      return { text: Math.round(randRange(4, 7)) + ' Hz', flag: 'H' };
    }
    // Deficit Alpha, shown as Delta slowing -> L
    return { text: Math.round(randRange(2, 3)) + ' Hz', flag: 'L' };
  }

  // Horizontal x for the Result column values on summary pages (matches
  // where all Brodmann Hz rows sit). The original PAF row was drawn at
  // left:185.05pt which visually shifts left of the Brodmann values.
  const SUMMARY_RESULT_LEFT_PT = 200.9;

  function randomizePAF(page, mode) {
    if (!page) return;
    const pafDiv = Array.from(page.querySelectorAll('div.ssddiv')).find(div => {
      const st = div.getAttribute('style') || '';
      const span = div.querySelector('span');
      if (!span) return false;
      const t = (span.textContent || '').trim();
      // Match by original left OR by any already-shifted left, with Hz/Indiscernible text.
      return /^left:\s*(185\.05|200\.9)pt/.test(st) && (/Hz$/i.test(t) || /Indiscernible/i.test(t));
    });
    if (!pafDiv) return;
    // Align PAF result cell with Brodmann Hz values below.
    const curStyle = pafDiv.getAttribute('style') || '';
    pafDiv.setAttribute(
      'style',
      curStyle.replace(/left:\s*[\d.]+pt/, `left:${SUMMARY_RESULT_LEFT_PT}pt`),
    );
    // PAF norm ~ 9-11 Hz. L = slowing (<9), H = fast (>11), Indiscernible = critical.
    let text, flag;
    if (mode === 'normal') {
      text = randRange(9, 11).toFixed(1) + ' Hz';
      flag = '';
    } else if (mode === 'borderline') {
      if (Math.random() < 0.5) { text = randRange(8.0, 8.9).toFixed(1) + ' Hz'; flag = 'L'; }
      else                      { text = randRange(11.1, 12.0).toFixed(1) + ' Hz'; flag = 'H'; }
    } else {
      const r = Math.random();
      if (r < 0.4)      { text = randRange(6.5, 7.9).toFixed(1) + ' Hz'; flag = 'L'; }
      else if (r < 0.75){ text = randRange(12.1, 13.5).toFixed(1) + ' Hz'; flag = 'H'; }
      else              { text = 'Indiscernible'; flag = ''; }
    }
    pafDiv.querySelector('span').textContent = text;
    let flagSpan = pafDiv.querySelector('[data-role="page10-flag"]');
    if (!flagSpan) {
      flagSpan = document.createElement('span');
      flagSpan.className = 'ssdspan e2p-cs44';
      flagSpan.setAttribute('data-role', 'page10-flag');
      flagSpan.style.left = '69.55pt';
      pafDiv.appendChild(flagSpan);
    }
    flagSpan.textContent = flag;
    flagSpan.classList.remove('flag-L', 'flag-H');
    if (flag === 'L') flagSpan.classList.add('flag-L');
    else if (flag === 'H') flagSpan.classList.add('flag-H');
    flagSpan.style.visibility = flag ? 'visible' : 'hidden';
  }

  // Randomize Theta:Beta Ratio on page 9 EEG summary. Reference range < 2.1.
  // normal: well below 2.1, no flag. borderline: 2.05–2.4, mild H. abnormal: 2.5–4.5, H.
  function randomizeThetaBetaRatio(page, mode) {
    if (!page) return;
    const divs = Array.from(page.querySelectorAll('div.ssddiv'));
    // Locate the "Theta : Beta Ratio" label div, then match the value div sitting
    // on approximately the same row (top within ~10pt) whose text is a numeric.
    const labelDiv = divs.find(d => {
      const sp = d.querySelector('span');
      return sp && /Theta\s*:\s*Beta\s*Ratio/i.test(sp.textContent || '');
    });
    if (!labelDiv) return;
    const labelTop = parseFloat(
      (labelDiv.getAttribute('style') || '').match(/top:\s*([\d.]+)pt/)?.[1] || '0',
    );
    const valueDiv = divs.find(d => {
      const st = d.getAttribute('style') || '';
      const top = parseFloat((st.match(/top:\s*([\d.]+)pt/) || [])[1] || '0');
      if (Math.abs(top - labelTop) > 10) return false;
      const sp = d.querySelector('span');
      if (!sp) return false;
      return /^\s*\d+(\.\d+)?\s*$/.test(sp.textContent || '');
    });
    if (!valueDiv) return;
    let v, flag;
    if (mode === 'normal')          { v = randRange(1.0, 2.0); flag = ''; }
    else if (mode === 'borderline') { v = randRange(2.05, 2.4); flag = 'H'; }
    else                             { v = randRange(2.5, 4.5); flag = 'H'; }
    const span = valueDiv.querySelector('span');
    span.textContent = v.toFixed(3);
    span.classList.remove('flag-L', 'flag-H');
    if (flag === 'H') span.classList.add('flag-H');
    // Also update the hardcoded H flag div sitting on the same row.
    const flagSpan = page.querySelector('[data-role="theta-beta-flag"]');
    if (flagSpan) {
      flagSpan.textContent = flag || '';
      flagSpan.classList.remove('flag-L', 'flag-H');
      if (flag === 'H') flagSpan.classList.add('flag-H');
      else if (flag === 'L') flagSpan.classList.add('flag-L');
      flagSpan.style.visibility = flag ? 'visible' : 'hidden';
    }
  }


  // Randomize Brodmann-style rows on any summary page. Hz distribution and
  // H/L verdict are driven by clinical mode (see Page 6 band legend and
  // Page 7 verdict rules). H must render red, L must render blue.
  function randomizeBrodmannRows(page, mode) {
    if (!page) return;
    const allDivs = Array.from(page.querySelectorAll('div.ssddiv'));
    const valueDivs = allDivs.filter(div => {
      const st = div.getAttribute('style') || '';
      if (!/left:\s*20[0-3]\./.test(st)) return false;
      const sp = div.querySelector('span');
      return sp && /Hz\s*$/i.test((sp.textContent || '').trim());
    });
    const flagCandidates = allDivs.filter(d => {
      const spans = d.querySelectorAll('span');
      if (spans.length !== 1) return false;
      const t = (spans[0].textContent || '').trim();
      return t === 'L' || t === 'H' || t === '';
    });
    const usedFlags = new Set();
    valueDivs.forEach(vd => {
      const st = vd.getAttribute('style') || '';
      const rowTop = parseFloat((st.match(/top:\s*([\d.]+)pt/) || [])[1] || 0);
      const { text, flag } = pickBrodmannRow(mode);
      vd.querySelector('span').textContent = text;

      const flagDiv = flagCandidates.find(d => {
        if (usedFlags.has(d)) return false;
        const s = d.getAttribute('style') || '';
        const tm = s.match(/top:\s*([\d.]+)pt/);
        if (!tm) return false;
        return Math.abs(parseFloat(tm[1]) - rowTop) <= 5;
      });
      if (flagDiv) {
        usedFlags.add(flagDiv);
        const fspan = flagDiv.querySelector('span');
        fspan.textContent = flag;
        fspan.classList.remove('flag-L', 'flag-H');
        if (flag === 'L') fspan.classList.add('flag-L');
        else if (flag === 'H') fspan.classList.add('flag-H');
        fspan.style.visibility = flag ? 'visible' : 'hidden';
      }
    });
  }

  function enhanceSummaryPages(opts) {
    const pages = summaryPages();
    pages.forEach(p => { stripValueBackgrounds(p); });
    const doLoreta = !opts || opts.loreta !== false;
    const doEegMaps = !opts || opts.eegMaps !== false;
    const mode = (opts && opts.mode) || null;
    if (mode && doEegMaps) {
      // Theta:Beta Ratio lives in the page 9 EEG summary table.
      randomizeThetaBetaRatio(pages[1], mode);
    }
    if (doLoreta && mode) {
      // Pages 9 and 10 carry the Brodmann rows and PAF row.
      randomizeBrodmannRows(pages[1], mode);
      randomizeBrodmannRows(pages[2], mode);
      randomizePAF(pages[1], mode);
      randomizePAF(pages[2], mode);
    }
    pages.forEach(colourHardcodedFlags);
    if (mode) mirrorEegToPage6(pages);
  }

  // Mirror page 9 Theta:Beta and page 10 PAF into the page-6 head-map row.
  function mirrorEegToPage6(pages) {
    const p6tb = document.querySelector('[data-eeg="p6-thetaBeta"]');
    const p6paf = document.querySelector('[data-eeg="p6-paf"]');
    if (p6tb && pages[1]) {
      const labelDiv = Array.from(pages[1].querySelectorAll('div.ssddiv')).find(d => {
        const sp = d.querySelector('span');
        return sp && /Theta\s*:\s*Beta\s*Ratio/i.test(sp.textContent || '');
      });
      if (labelDiv) {
        const labelTop = parseFloat((labelDiv.getAttribute('style') || '').match(/top:\s*([\d.]+)pt/)?.[1] || '0');
        const valDiv = Array.from(pages[1].querySelectorAll('div.ssddiv')).find(d => {
          const top = parseFloat((d.getAttribute('style') || '').match(/top:\s*([\d.]+)pt/)?.[1] || '0');
          if (Math.abs(top - labelTop) > 10) return false;
          const sp = d.querySelector('span');
          return sp && /^\s*\d+(\.\d+)?\s*$/.test(sp.textContent || '');
        });
        if (valDiv) {
          const sp = valDiv.querySelector('span');
          p6tb.textContent = sp.textContent;
          p6tb.style.color = sp.classList.contains('flag-H') ? '#FF0000' : sp.classList.contains('flag-L') ? '#0000FF' : '';
          p6tb.style.fontWeight = (sp.classList.contains('flag-H') || sp.classList.contains('flag-L')) ? '700' : '';
        }
      }
    }
    if (p6paf && pages[2]) {
      const pafDiv = Array.from(pages[2].querySelectorAll('div.ssddiv')).find(d => {
        const sp = d.querySelector('span');
        if (!sp) return false;
        const t = (sp.textContent || '').trim();
        return /Hz$/i.test(t) || /Indiscernible/i.test(t);
      });
      if (pafDiv) {
        const sp = pafDiv.querySelector('span');
        p6paf.textContent = sp.textContent;
        const flagSp = pafDiv.querySelector('[data-role="page10-flag"]');
        const flag = flagSp ? (flagSp.textContent || '').trim() : '';
        p6paf.style.color = flag === 'H' ? '#FF0000' : flag === 'L' ? '#0000FF' : '';
        p6paf.style.fontWeight = flag ? '700' : '';
      }
    }
  }

  // Cardiac Waveform overlay on page 3 — synthesized ECG that reflects the mode.
  const CW_LEFT_PT = 150;
  const CW_TOP_PT  = 115;
  const CW_W_PT    = 420;
  const CW_H_PT    = 68;
  // Inner plot margins (pt) inside the host, leaving room for axis labels.
  const CW_ML = 22, CW_MR = 4, CW_MT = 4, CW_MB = 14;
  function drawCardiacWaveform(mode) {
    const pages = document.querySelectorAll('.ssdpage');
    const page3 = pages[2];
    if (!page3) return;
    let host = page3.querySelector('[data-role="cardiac-waveform"]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-role', 'cardiac-waveform');
      page3.appendChild(host);
    }
    host.style.cssText = `position:absolute;left:${CW_LEFT_PT}pt;top:${CW_TOP_PT}pt;width:${CW_W_PT}pt;height:${CW_H_PT}pt;background:#fff;z-index:5;`;
    let bpm, jitter, ectopicChance, missPChance, tScale;
    if (mode === 'normal')          { bpm = randRange(60, 78);  jitter = 0.02; ectopicChance = 0;    missPChance = 0;    tScale = 1; }
    else if (mode === 'borderline') { bpm = randRange(55, 95);  jitter = 0.08; ectopicChance = 0.10; missPChance = 0.10; tScale = 1.15; }
    else                            { bpm = randRange(45, 130); jitter = 0.22; ectopicChance = 0.35; missPChance = 0.30; tScale = 1.4; }
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
    // Grid: minor every 0.2s / 0.1mV (light), major every 1s / 0.5mV (darker).
    // Y-axis: baseline = 0 mV, drawing area spans ~ -0.6 to +1.0 mV (R peak ≈ 1mV).
    const mvPerPt = 1 / (H * 0.55); // R amplitude ~0.55*H = 1mV
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
    // Axis lines
    let axes = '';
    axes += `<line x1="0" y1="0" x2="0" y2="${H}" stroke="#333" stroke-width="0.5"/>`;
    axes += `<line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="#333" stroke-width="0.5"/>`;
    // X labels (seconds)
    let xLabels = '';
    for (let s = 0; s <= 5; s++) {
      const gx = xOf(s);
      xLabels += `<line x1="${gx.toFixed(2)}" y1="${H}" x2="${gx.toFixed(2)}" y2="${H+2}" stroke="#333" stroke-width="0.5"/>`;
      xLabels += `<text x="${gx.toFixed(2)}" y="${H+8}" font-size="5" text-anchor="middle" fill="#333" font-family="Helvetica, Arial, sans-serif">${s}</text>`;
    }
    xLabels += `<text x="${(W/2).toFixed(2)}" y="${H+13}" font-size="5" text-anchor="middle" fill="#333" font-family="Helvetica, Arial, sans-serif">Time (sec)</text>`;
    // Y labels (mV)
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

  // Hook cardiac waveform into every mode change.
  const _origSetMode = setMode;
  setMode = function (mode) { _origSetMode(mode); drawCardiacWaveform(mode); };

  enhanceSummaryPages();
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

  // ---- Patient details form -----------------------------------------------
  // A tiny bio form (name, DOB, gender, handedness, symptoms) drives every
  // patient-header on the report. We tag the original spans on first run so
  // subsequent updates are cheap and don't rescan.
  function fmtName(first, last) { return `${last} , ${first}`; }
  function computeAge(dobStr) {
    if (!dobStr) return { years: 0, months: 0 };
    const dob = new Date(dobStr + 'T00:00:00');
    if (isNaN(dob.getTime())) return { years: 0, months: 0 };
    const now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    let m = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) m -= 1;
    if (m < 0) { y -= 1; m += 12; }
    return { years: Math.max(0, y), months: Math.max(0, m) };
  }
  function fmtDobShort(dobStr) {
    if (!dobStr) return '00-00-0000';
    const [y, mo, d] = dobStr.split('-');
    if (!y || !mo || !d) return '00-00-0000';
    return `${mo}-${d}-${y}`;
  }

  const PATIENT_SPANS = { nameMixed: [], nameUpper: [], nameColon: [], dob: [], dot: [], reportDate: [], age: [], gender: [], hand: [], symp: [] };
  function tagPatientSpans() {
    document.querySelectorAll('span').forEach(sp => {
      const t = (sp.textContent || '').trim();
      if (t === 'Doe , John')      PATIENT_SPANS.nameMixed.push(sp);
      else if (t === 'DOE , JOHN') PATIENT_SPANS.nameUpper.push(sp);
      else if (t === ': Doe , John') PATIENT_SPANS.nameColon.push(sp);
      else if (t === '00-00-0000 , 0:00 PM') PATIENT_SPANS.reportDate.push(sp);
    });
    // Bio row on Page 2: locate by preceding-label text within same div.
    document.querySelectorAll('div.ssddiv > span').forEach(sp => {
      const t = (sp.textContent || '').trim();
      const prev = sp.previousElementSibling;
      const prevT = prev ? (prev.textContent || '').trim() : '';
      if (t === ': 00-00-0000' && prevT === 'Date of Birth') PATIENT_SPANS.dob.push(sp);
      else if (t === ': 00-00-0000' && prevT === 'Date of Test') PATIENT_SPANS.dot.push(sp);
      else if (t === '99 yr 10 mo')                          PATIENT_SPANS.age.push(sp);
      else if (t === 'M' && prevT === 'Gender:')             PATIENT_SPANS.gender.push(sp);
      else if (t === ': Right' && prevT === 'Handedness')    PATIENT_SPANS.hand.push(sp);
      else if (t === ': Feeling dizzay falling down')        PATIENT_SPANS.symp.push(sp);
    });
  }
  tagPatientSpans();

  function fmtReportDateTime(dotStr, totStr) {
    // dotStr is YYYY-MM-DD; totStr is HH:MM (24h). Combine into the page-1 stamp.
    const now = new Date();
    let base;
    if (dotStr) {
      const [y, mo, d] = dotStr.split('-').map(Number);
      base = new Date(y, (mo || 1) - 1, d || 1, now.getHours(), now.getMinutes());
    } else {
      base = new Date(now);
    }
    if (totStr) {
      const [hh, mm] = totStr.split(':').map(Number);
      if (!isNaN(hh)) base.setHours(hh);
      if (!isNaN(mm)) base.setMinutes(mm);
    }
    const mo = String(base.getMonth() + 1).padStart(2, '0');
    const d  = String(base.getDate()).padStart(2, '0');
    const y  = base.getFullYear();
    let h = base.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    const min = String(base.getMinutes()).padStart(2, '0');
    return `${mo}-${d}-${y} , ${h}:${min} ${ampm}`;
  }

  // Default Date of Test to today so page 1/2 stamps aren't 00-00-0000.
  const dotInput = document.getElementById('p-dot');
  if (dotInput && !dotInput.value) {
    const t = new Date();
    dotInput.value = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
  }

  function applyPatient() {
    const first  = (document.getElementById('p-first')?.value  || 'John').trim();
    const last   = (document.getElementById('p-last')?.value   || 'Doe').trim();
    const dobStr = document.getElementById('p-dob')?.value     || '';
    const dotStr = document.getElementById('p-dot')?.value     || '';
    const totStr = document.getElementById('p-tot')?.value     || '';
    const gender = document.getElementById('p-gender')?.value  || 'M';
    const hand   = document.getElementById('p-hand')?.value    || 'Right';
    const symp   = (document.getElementById('p-symp')?.value   || '').trim();

    const mixed = fmtName(first, last);
    const upper = mixed.toUpperCase();
    PATIENT_SPANS.nameMixed.forEach(sp => sp.textContent = mixed);
    PATIENT_SPANS.nameUpper.forEach(sp => sp.textContent = upper);
    PATIENT_SPANS.nameColon.forEach(sp => sp.textContent = ': ' + mixed);
    PATIENT_SPANS.dob.forEach(sp => sp.textContent = ': ' + fmtDobShort(dobStr));
    PATIENT_SPANS.dot.forEach(sp => sp.textContent = ': ' + fmtDobShort(dotStr));
    PATIENT_SPANS.reportDate.forEach(sp => sp.textContent = fmtReportDateTime(dotStr, totStr));
    const { years, months } = computeAge(dobStr);
    PATIENT_SPANS.age.forEach(sp => sp.textContent = `${years} yr ${months} mo`);
    PATIENT_SPANS.gender.forEach(sp => sp.textContent = gender);
    PATIENT_SPANS.hand.forEach(sp => sp.textContent = ': ' + hand);
    PATIENT_SPANS.symp.forEach(sp => sp.textContent = ': ' + symp);
  }
  ['p-first','p-last','p-dob','p-dot','p-tot','p-gender','p-hand','p-symp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', applyPatient);
      el.addEventListener('change', applyPatient);
    }
  });
  applyPatient();

  // Allow the parent (Data Explorer) to trigger printing via postMessage.
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'print-exam') {
      window.focus();
      window.print();
    }
  });
})();


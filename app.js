// ================================================================
// TactiCal - 축구 전술 시뮬레이터
// ================================================================

// ========================
// MODULE: State
// ========================
const State = (() => {
  let players = [];
  let arrows = [];
  let zones = [];
  let passLines = [];
  let freeDraws = [];
  let ball = { x: 450, y: 303, visible: true };
  let selectedId = null;
  let selectedArrowIdx = null;
  let currentTool = 'select';
  let isPlaying = false;
  let scenes = [];
  let currentScene = 0;
  let nextPlayerId = 1;
  let speedMultiplier = 1;
  let undoStack = [];
  let redoStack = [];
  let currentZoneShape = 'ellipse';
  let lastArrows = [];

  const PITCH_W = 900;
  const PITCH_H = 607;

  function snapshot() {
    return JSON.parse(JSON.stringify({
      players, arrows, zones, passLines, freeDraws,
      ball: { ...ball }
    }));
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (undoStack.length === 0) return false;
    redoStack.push(snapshot());
    const s = undoStack.pop();
    players = s.players;
    arrows = s.arrows;
    zones = s.zones;
    passLines = s.passLines;
    freeDraws = s.freeDraws || [];
    ball = s.ball;
    return true;
  }

  function redo() {
    if (redoStack.length === 0) return false;
    undoStack.push(snapshot());
    const s = redoStack.pop();
    players = s.players;
    arrows = s.arrows;
    zones = s.zones;
    passLines = s.passLines;
    freeDraws = s.freeDraws || [];
    ball = s.ball;
    return true;
  }

  return {
    get players() { return players; },
    set players(v) { players = v; },
    get arrows() { return arrows; },
    set arrows(v) { arrows = v; },
    get zones() { return zones; },
    set zones(v) { zones = v; },
    get passLines() { return passLines; },
    set passLines(v) { passLines = v; },
    get freeDraws() { return freeDraws; },
    set freeDraws(v) { freeDraws = v; },
    get ball() { return ball; },
    set ball(v) { ball = v; },
    get selectedId() { return selectedId; },
    set selectedId(v) { selectedId = v; },
    get selectedArrowIdx() { return selectedArrowIdx; },
    set selectedArrowIdx(v) { selectedArrowIdx = v; },
    get currentTool() { return currentTool; },
    set currentTool(v) { currentTool = v; },
    get isPlaying() { return isPlaying; },
    set isPlaying(v) { isPlaying = v; },
    get scenes() { return scenes; },
    set scenes(v) { scenes = v; },
    get currentScene() { return currentScene; },
    set currentScene(v) { currentScene = v; },
    get nextPlayerId() { return nextPlayerId; },
    set nextPlayerId(v) { nextPlayerId = v; },
    get speedMultiplier() { return speedMultiplier; },
    set speedMultiplier(v) { speedMultiplier = v; },
    PITCH_W, PITCH_H,
    snapshot, pushUndo, undo, redo,
    get undoStack() { return undoStack; },
    get redoStack() { return redoStack; },
    get currentZoneShape() { return currentZoneShape; },
    set currentZoneShape(v) { currentZoneShape = v; },
    get lastArrows() { return lastArrows; },
    set lastArrows(v) { lastArrows = v; },
  };
})();


// ========================
// MODULE: Formations
// ========================
const Formations = (() => {
  const PRESETS = {
    '4-3-3': [
      {x:0.07,y:0.5},
      {x:0.22,y:0.18},{x:0.24,y:0.42},{x:0.24,y:0.58},{x:0.22,y:0.82},
      {x:0.42,y:0.28},{x:0.40,y:0.5},{x:0.42,y:0.72},
      {x:0.60,y:0.18},{x:0.62,y:0.5},{x:0.60,y:0.82}
    ],
    '4-4-2': [
      {x:0.07,y:0.5},
      {x:0.22,y:0.18},{x:0.24,y:0.42},{x:0.24,y:0.58},{x:0.22,y:0.82},
      {x:0.44,y:0.18},{x:0.44,y:0.42},{x:0.44,y:0.58},{x:0.44,y:0.82},
      {x:0.64,y:0.36},{x:0.64,y:0.64}
    ],
    '4-2-3-1': [
      {x:0.07,y:0.5},
      {x:0.22,y:0.18},{x:0.24,y:0.42},{x:0.24,y:0.58},{x:0.22,y:0.82},
      {x:0.38,y:0.38},{x:0.38,y:0.62},
      {x:0.54,y:0.18},{x:0.52,y:0.5},{x:0.54,y:0.82},
      {x:0.68,y:0.5}
    ],
    '3-5-2': [
      {x:0.07,y:0.5},
      {x:0.24,y:0.28},{x:0.24,y:0.5},{x:0.24,y:0.72},
      {x:0.38,y:0.1},{x:0.42,y:0.35},{x:0.40,y:0.5},{x:0.42,y:0.65},{x:0.38,y:0.9},
      {x:0.62,y:0.36},{x:0.62,y:0.64}
    ],
    '3-4-3': [
      {x:0.07,y:0.5},
      {x:0.24,y:0.28},{x:0.24,y:0.5},{x:0.24,y:0.72},
      {x:0.42,y:0.18},{x:0.42,y:0.42},{x:0.42,y:0.58},{x:0.42,y:0.82},
      {x:0.62,y:0.18},{x:0.62,y:0.5},{x:0.62,y:0.82}
    ],
    '5-3-2': [
      {x:0.07,y:0.5},
      {x:0.20,y:0.08},{x:0.24,y:0.28},{x:0.24,y:0.5},{x:0.24,y:0.72},{x:0.20,y:0.92},
      {x:0.44,y:0.28},{x:0.42,y:0.5},{x:0.44,y:0.72},
      {x:0.62,y:0.36},{x:0.62,y:0.64}
    ],
    '4-1-4-1': [
      {x:0.07,y:0.5},
      {x:0.22,y:0.18},{x:0.24,y:0.42},{x:0.24,y:0.58},{x:0.22,y:0.82},
      {x:0.36,y:0.5},
      {x:0.52,y:0.15},{x:0.50,y:0.38},{x:0.50,y:0.62},{x:0.52,y:0.85},
      {x:0.66,y:0.5}
    ]
  };

  const POS_HOME = ['GK','DF','DF','DF','DF','MF','MF','MF','FW','FW','FW'];
  const POS_AWAY = ['GK','DF','DF','DF','DF','MF','MF','MF','FW','FW','FW'];

  function apply(name, away = false) {
    const positions = PRESETS[name] || PRESETS['4-3-3'];
    State.pushUndo();

    // Remove existing team
    State.players = State.players.filter(p => p.away !== away);

    positions.forEach((pos, i) => {
      let x, y;
      if (away) {
        x = (1 - pos.x) * (State.PITCH_W - 40) + 20;
        y = pos.y * (State.PITCH_H - 40) + 20;
      } else {
        x = pos.x * (State.PITCH_W - 40) + 20;
        y = pos.y * (State.PITCH_H - 40) + 20;
      }
      State.players.push({
        id: State.nextPlayerId++,
        x, y,
        startX: x, startY: y,
        number: i + 1,
        name: away ? `Away ${i+1}` : `선수${i+1}`,
        position: away ? (POS_AWAY[i] || 'MF') : (POS_HOME[i] || 'MF'),
        away
      });
    });
  }

  return { PRESETS, apply };
})();


// ========================
// MODULE: PitchRenderer
// ========================
const PitchRenderer = (() => {
  function draw() {
    const svg = document.getElementById('pitch-svg');
    const W = State.PITCH_W, H = State.PITCH_H;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    let stripes = '';
    const stripeW = 50;
    for (let i = 0; i * stripeW < W; i++) {
      const color = i % 2 === 0 ? '#3a7d44' : '#438c4e';
      stripes += `<rect x="${i*stripeW}" y="0" width="${stripeW}" height="${H}" fill="${color}"/>`;
    }

    svg.innerHTML = `
      <defs>
        <marker id="arr-m-w" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#fff" opacity="0.9"/>
        </marker>
        <marker id="arr-m-r" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ff5a52" opacity="0.9"/>
        </marker>
        <marker id="arr-m-b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#4a9fff" opacity="0.9"/>
        </marker>
        <marker id="arr-m-y" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ffd04a" opacity="0.9"/>
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="ball-clip">
          <circle r="9"/>
        </clipPath>
        <radialGradient id="ball-grad" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#c8c8c8"/>
        </radialGradient>
      </defs>

      <g id="pitch-bg">${stripes}</g>

      <g stroke="rgba(255,255,255,0.75)" stroke-width="2" fill="none">
        <rect x="20" y="20" width="${W-40}" height="${H-40}" rx="2"/>
        <line x1="${W/2}" y1="20" x2="${W/2}" y2="${H-20}"/>
        <circle cx="${W/2}" cy="${H/2}" r="70"/>
        <circle cx="${W/2}" cy="${H/2}" r="3" fill="white"/>
        <rect x="20" y="${H/2-88}" width="110" height="176"/>
        <rect x="20" y="${H/2-44}" width="44" height="88"/>
        <circle cx="86" cy="${H/2}" r="3" fill="white"/>
        <path d="M130,${H/2-50} A60,60 0 0,1 130,${H/2+50}" fill="none"/>
        <rect x="${W-130}" y="${H/2-88}" width="110" height="176"/>
        <rect x="${W-64}" y="${H/2-44}" width="44" height="88"/>
        <circle cx="${W-86}" cy="${H/2}" r="3" fill="white"/>
        <path d="M${W-130},${H/2-50} A60,60 0 0,0 ${W-130},${H/2+50}" fill="none"/>
        <path d="M20,42 A18,18 0 0,1 38,20" fill="none"/>
        <path d="M${W-38},20 A18,18 0 0,1 ${W-20},42" fill="none"/>
        <path d="M20,${H-42} A18,18 0 0,0 38,${H-20}" fill="none"/>
        <path d="M${W-38},${H-20} A18,18 0 0,0 ${W-20},${H-42}" fill="none"/>
      </g>

      <g fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.6)" stroke-width="2">
        <rect x="4" y="${H/2-26}" width="16" height="52" rx="2"/>
        <rect x="${W-20}" y="${H/2-26}" width="16" height="52" rx="2"/>
      </g>

      <g id="zones-layer"></g>
      <g id="freedraw-layer"></g>
      <g id="passlines-layer"></g>
      <g id="arrows-layer"></g>
      <g id="draw-layer"></g>
      <g id="players-layer"></g>
      <g id="ball-layer"></g>
    `;

    // Invisible overlay for event capture
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    overlay.setAttribute('x', 0); overlay.setAttribute('y', 0);
    overlay.setAttribute('width', W); overlay.setAttribute('height', H);
    overlay.setAttribute('fill', 'transparent');
    overlay.setAttribute('id', 'pitch-overlay');
    svg.appendChild(overlay);
  }

  return { draw };
})();


// ========================
// MODULE: Renderer
// ========================
const Renderer = (() => {
  function renderAll() {
    renderZones();
    renderFreeDraws();
    renderPassLines();
    renderArrows();
    renderPlayers();
    renderBall();
    Persistence.autoSave();
  }

  function renderPlayers() {
    const layer = document.getElementById('players-layer');
    if (!layer) return;
    layer.innerHTML = '';

    State.players.forEach(p => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'player-token' + (State.selectedId === p.id ? ' selected' : ''));
      g.setAttribute('data-id', p.id);
      g.setAttribute('transform', `translate(${p.x}, ${p.y})`);

      const color = p.away ? '#1a6fe8' : '#e8453c';
      const glowColor = p.away ? 'rgba(26,111,232,0.5)' : 'rgba(232,69,60,0.5)';

      // Shadow
      const shadow = createSVG('ellipse', { cx: 2, cy: 18, rx: 14, ry: 5, fill: 'rgba(0,0,0,0.3)' });
      g.appendChild(shadow);

      // Glow ring
      if (State.selectedId === p.id) {
        const glow = createSVG('circle', { r: 22, fill: 'none', stroke: glowColor, 'stroke-width': 3, opacity: 0.6 });
        glow.style.animation = 'pulse-ring 1.5s ease infinite';
        g.appendChild(glow);
      }

      // Main circle
      const circle = createSVG('circle', {
        class: 'token-ring', r: 15, fill: color,
        stroke: State.selectedId === p.id ? '#fff' : 'rgba(255,255,255,0.4)',
        'stroke-width': State.selectedId === p.id ? '2.5' : '1.5'
      });
      g.appendChild(circle);

      // Number
      const num = createSVG('text', {
        'text-anchor': 'middle', 'dominant-baseline': 'central',
        y: -1, fill: 'white',
        'font-size': p.number > 9 ? '10' : '12',
        'font-weight': '700',
        'font-family': 'Noto Sans KR, sans-serif'
      });
      num.textContent = p.number;
      g.appendChild(num);

      // Name label
      const nameText = (p.name || '').length > 6 ? p.name.slice(0, 6) : (p.name || '');
      const nameW = Math.max(nameText.length * 7, 32);
      const nameBg = createSVG('rect', { x: -nameW/2, y: 18, width: nameW, height: 14, rx: 3, fill: 'rgba(0,0,0,0.65)' });
      g.appendChild(nameBg);

      const nameEl = createSVG('text', {
        'text-anchor': 'middle', y: 29, fill: 'rgba(255,255,255,0.9)',
        'font-size': '9', 'font-family': 'Noto Sans KR, sans-serif'
      });
      nameEl.textContent = nameText;
      g.appendChild(nameEl);

      // Position badge
      const posBg = createSVG('rect', { x: 10, y: -24, width: 24, height: 13, rx: 3, fill: 'rgba(0,0,0,0.7)' });
      g.appendChild(posBg);

      const posEl = createSVG('text', {
        'text-anchor': 'middle', x: 22, y: -14, fill: 'rgba(255,200,100,0.9)',
        'font-size': '8', 'font-weight': '700', 'font-family': 'Noto Sans KR, sans-serif'
      });
      posEl.textContent = p.position || '';
      g.appendChild(posEl);

      layer.appendChild(g);
    });
  }

  function renderArrows() {
    const layer = document.getElementById('arrows-layer');
    if (!layer) return;
    layer.innerHTML = '';

    // 애니메이션 재생 중에는 화살표 숨김
    if (State.isPlaying) return;

    State.arrows.forEach((a, idx) => {
      const player = State.players.find(p => p.id === a.playerId);
      if (!player) return;

      const sx = (a.fromPlayer === false && a.sx != null) ? a.sx : player.x;
      const sy = (a.fromPlayer === false && a.sy != null) ? a.sy : player.y;
      const ex = a.ex, ey = a.ey;
      const d = `M${sx},${sy} L${ex},${ey}`;

      const isSelected = State.selectedArrowIdx === idx;
      const markerColor = player.away ? 'url(#arr-m-b)' : 'url(#arr-m-r)';
      const strokeColor = player.away ? 'rgba(100,180,255,0.85)' : 'rgba(255,100,90,0.85)';

      // Hit area for click
      const hit = createSVG('path', {
        d: d, fill: 'none', stroke: 'transparent', 'stroke-width': 16, class: 'arrow-hit-area',
        'data-arrow-idx': idx
      });
      hit.style.cursor = State.currentTool === 'erase' ? 'not-allowed' : 'pointer';
      layer.appendChild(hit);

      // Visible arrow
      const path = createSVG('path', {
        d: d, fill: 'none', class: 'arrow-path',
        stroke: isSelected ? '#fff' : strokeColor,
        'stroke-width': isSelected ? '3.5' : '2.5',
        'marker-end': isSelected ? 'url(#arr-m-w)' : markerColor
      });
      if (isSelected) path.setAttribute('filter', 'url(#glow)');
      layer.appendChild(path);

      // Endpoint dot (chaining indicator - always visible when not selected)
      if (!isSelected) {
        const dot = createSVG('circle', {
          cx: ex, cy: ey, r: 4,
          fill: player.away ? 'rgba(100,180,255,0.9)' : 'rgba(255,100,90,0.9)',
          stroke: 'rgba(0,0,0,0.4)', 'stroke-width': 1
        });
        dot.style.cursor = State.currentTool === 'arrow' ? 'crosshair' : 'default';
        layer.appendChild(dot);
      }

      // End point handle (when selected)
      if (isSelected) {
        const handle = createSVG('circle', {
          cx: ex, cy: ey, r: 6, fill: '#fff', stroke: strokeColor, 'stroke-width': 2,
          class: 'arrow-handle', 'data-arrow-idx': idx
        });
        handle.style.cursor = 'grab';
        layer.appendChild(handle);
      }
    });
  }

  function renderPassLines() {
    const layer = document.getElementById('passlines-layer');
    if (!layer) return;
    layer.innerHTML = '';

    State.passLines.forEach((pl, idx) => {
      let x1, y1, x2, y2;
      const p1 = State.players.find(p => p.id === pl.from);
      const p2 = State.players.find(p => p.id === pl.to);
      if (p1 && p2) {
        x1 = p1.x; y1 = p1.y; x2 = p2.x; y2 = p2.y;
      } else if (pl.x1 != null) {
        x1 = pl.x1; y1 = pl.y1; x2 = pl.x2; y2 = pl.y2;
      } else return;

      // Hit area
      const hit = createSVG('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 14, 'data-pass-idx': idx });
      hit.style.cursor = State.currentTool === 'erase' ? 'not-allowed' : 'pointer';
      layer.appendChild(hit);

      const line = createSVG('line', {
        x1, y1, x2, y2,
        stroke: 'rgba(255,210,70,0.7)', 'stroke-width': '2',
        'stroke-dasharray': '8,4', 'marker-end': 'url(#arr-m-y)'
      });
      layer.appendChild(line);
    });
  }

  function renderZones() {
    const layer = document.getElementById('zones-layer');
    if (!layer) return;
    layer.innerHTML = '';

    State.zones.forEach((z, idx) => {
      const shape = z.shape || 'ellipse';
      const attrs = {
        fill: 'rgba(255,200,50,0.08)',
        stroke: 'rgba(255,200,50,0.45)',
        'stroke-width': '1.5',
        'stroke-dasharray': '6,3',
        'data-zone-idx': idx
      };
      let el;
      if (shape === 'rect') {
        // 새 포맷: x,y = 좌상단, w,h / 구 포맷: x,y = 중심, r
        const x = z.w !== undefined ? z.x : z.x - (z.r || 45);
        const y = z.h !== undefined ? z.y : z.y - (z.r || 45) * 0.65;
        const w = z.w !== undefined ? z.w : (z.r || 45) * 2;
        const h = z.h !== undefined ? z.h : (z.r || 45) * 1.3;
        el = createSVG('rect', { ...attrs, x, y, width: w, height: h });
      } else {
        // 새 포맷: x,y = 중심, rx,ry / 구 포맷: x,y = 중심, r
        const rx = z.rx !== undefined ? z.rx : (z.r || 45);
        const ry = z.ry !== undefined ? z.ry : (z.r || 45) * 0.65;
        el = createSVG('ellipse', { ...attrs, cx: z.x, cy: z.y, rx, ry });
      }
      el.style.cursor = State.currentTool === 'erase' ? 'not-allowed' : 'pointer';
      layer.appendChild(el);
    });
  }

  function renderFreeDraws() {
    const layer = document.getElementById('freedraw-layer');
    if (!layer) return;
    layer.innerHTML = '';

    State.freeDraws.forEach((fd, idx) => {
      if (!fd.points || fd.points.length < 2) return;
      const d = fd.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      
      // Hit area
      const hit = createSVG('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': 12, 'data-freedraw-idx': idx });
      hit.style.cursor = State.currentTool === 'erase' ? 'not-allowed' : 'default';
      layer.appendChild(hit);

      const path = createSVG('path', {
        d, class: 'free-draw-path',
        stroke: fd.color || 'rgba(255,255,100,0.7)', 'stroke-width': fd.width || 2.5
      });
      layer.appendChild(path);
    });
  }

  function renderBall() {
    const layer = document.getElementById('ball-layer');
    if (!layer) return;
    layer.innerHTML = '';
    if (!State.ball.visible) return;

    const bx = State.ball.x, by = State.ball.y;
    layer.innerHTML = `
      <g transform="translate(${bx},${by})" id="ball-token" style="cursor:grab">
        <ellipse cx="1" cy="11" rx="8" ry="3" fill="rgba(0,0,0,0.28)"/>
        <g clip-path="url(#ball-clip)">
          <circle r="9" fill="url(#ball-grad)"/>
          <polygon points="0,-4.5 4.28,-1.39 2.64,3.64 -2.64,3.64 -4.28,-1.39" fill="#1a1a1a"/>
          <polygon points="0,-9.65 2.14,-8.09 1.32,-5.58 -1.32,-5.58 -2.14,-8.09" fill="#1a1a1a"/>
          <polygon points="9.18,-2.97 8.36,-0.46 5.72,-0.46 4.90,-2.97 7.04,-4.53" fill="#1a1a1a"/>
          <polygon points="5.67,7.81 3.03,7.81 2.21,5.30 4.35,3.74 6.49,5.30" fill="#1a1a1a"/>
          <polygon points="-5.67,7.81 -3.03,7.81 -2.21,5.30 -4.35,3.74 -6.49,5.30" fill="#1a1a1a"/>
          <polygon points="-9.18,-2.97 -8.36,-0.46 -5.72,-0.46 -4.90,-2.97 -7.04,-4.53" fill="#1a1a1a"/>
        </g>
        <circle r="9" fill="none" stroke="#aaa" stroke-width="0.5"/>
      </g>
    `;
  }

  function createSVG(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  return { renderAll, renderPlayers, renderArrows, renderPassLines, renderZones, renderFreeDraws, renderBall, createSVG };
})();


// ========================
// MODULE: InputHandler
// ========================
const InputHandler = (() => {
  let dragging = null;
  let drawingArrow = null;
  let drawingPass = null;
  let drawingZone = null;
  let drawingFree = null;

  function getSVGPoint(e) {
    const svg = document.getElementById('pitch-svg');
    const rect = svg.getBoundingClientRect();
    const scaleX = State.PITCH_W / rect.width;
    const scaleY = State.PITCH_H / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function findPlayerAt(svgPt) {
    for (let i = State.players.length - 1; i >= 0; i--) {
      const p = State.players[i];
      if (Math.hypot(p.x - svgPt.x, p.y - svgPt.y) < 18) return p;
    }
    return null;
  }

  function findBallAt(svgPt) {
    if (!State.ball.visible) return false;
    return Math.hypot(State.ball.x - svgPt.x, State.ball.y - svgPt.y) < 12;
  }

  function findArrowEndpointAt(svgPt) {
    for (let i = State.arrows.length - 1; i >= 0; i--) {
      const a = State.arrows[i];
      if (Math.hypot(a.ex - svgPt.x, a.ey - svgPt.y) < 12) return a;
    }
    return null;
  }

  function setup() {
    const svg = document.getElementById('pitch-svg');
    svg.addEventListener('pointerdown', onPointerDown, { passive: false });
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp, { passive: false });
    svg.addEventListener('contextmenu', onContextMenu);
  }

  function onPointerDown(e) {
    e.preventDefault();
    const svgPt = getSVGPoint(e);
    const tool = State.currentTool;

    // Check arrow handle drag
    if (e.target.classList.contains('arrow-handle')) {
      const idx = parseInt(e.target.getAttribute('data-arrow-idx'));
      dragging = { type: 'arrow-handle', idx, startPt: svgPt };
      State.pushUndo();
      return;
    }

    // Check arrow endpoint for chaining (arrow tool takes priority over hit area)
    if (tool === 'arrow') {
      const nearEndpoint = findArrowEndpointAt(svgPt);
      if (nearEndpoint) {
        drawingArrow = { playerId: nearEndpoint.playerId, sx: nearEndpoint.ex, sy: nearEndpoint.ey, fromPlayer: false };
        State.pushUndo();
        return;
      }
    }

    // Check arrow hit area click (for select/erase)
    if (e.target.classList.contains('arrow-hit-area')) {
      const idx = parseInt(e.target.getAttribute('data-arrow-idx'));
      if (tool === 'erase') {
        State.pushUndo();
        State.arrows.splice(idx, 1);
        Renderer.renderAll();
        return;
      }
      State.selectedArrowIdx = State.selectedArrowIdx === idx ? null : idx;
      State.selectedId = null;
      Renderer.renderAll();
      UI.updateEditor();
      return;
    }

    // Check pass line hit
    if (e.target.getAttribute('data-pass-idx') != null) {
      const idx = parseInt(e.target.getAttribute('data-pass-idx'));
      if (tool === 'erase') {
        State.pushUndo();
        State.passLines.splice(idx, 1);
        Renderer.renderAll();
        return;
      }
    }

    // Check zone hit
    if (e.target.getAttribute('data-zone-idx') != null) {
      const idx = parseInt(e.target.getAttribute('data-zone-idx'));
      if (tool === 'erase') {
        State.pushUndo();
        State.zones.splice(idx, 1);
        Renderer.renderAll();
        return;
      }
    }

    // Check free draw hit
    if (e.target.getAttribute('data-freedraw-idx') != null) {
      const idx = parseInt(e.target.getAttribute('data-freedraw-idx'));
      if (tool === 'erase') {
        State.pushUndo();
        State.freeDraws.splice(idx, 1);
        Renderer.renderAll();
        return;
      }
    }

    // Check ball
    if (findBallAt(svgPt) && (tool === 'select' || tool === 'ball')) {
      dragging = { type: 'ball', origX: State.ball.x, origY: State.ball.y, startPt: svgPt };
      State.pushUndo();
      return;
    }

    // Check player
    const player = findPlayerAt(svgPt);

    if (player) {
      if (tool === 'erase') {
        State.pushUndo();
        State.arrows = State.arrows.filter(a => a.playerId !== player.id);
        Renderer.renderAll();
        return;
      }

      if (tool === 'zone') {
        State.pushUndo();
        State.zones.push({ x: player.x, y: player.y, r: 45, shape: State.currentZoneShape });
        Renderer.renderAll();
        return;
      }

      if (tool === 'arrow') {
        drawingArrow = { playerId: player.id, sx: player.x, sy: player.y, fromPlayer: true };
        State.pushUndo();
        return;
      }

      if (tool === 'pass') {
        drawingPass = { fromId: player.id, sx: player.x, sy: player.y };
        State.pushUndo();
        return;
      }

      if (tool === 'select') {
        State.selectedId = player.id;
        State.selectedArrowIdx = null;
        dragging = { type: 'player', id: player.id, origX: player.x, origY: player.y, startPt: svgPt };
        State.pushUndo();
        Renderer.renderAll();
        UI.updateEditor();
        return;
      }
    }

    // Click on empty space
    if (tool === 'ball') {
      State.pushUndo();
      State.ball.x = Math.max(20, Math.min(State.PITCH_W - 20, svgPt.x));
      State.ball.y = Math.max(20, Math.min(State.PITCH_H - 20, svgPt.y));
      State.ball.visible = true;
      Renderer.renderAll();
      return;
    }

    if (tool === 'zone') {
      drawingZone = { startX: svgPt.x, startY: svgPt.y };
      State.pushUndo();
      return;
    }

    if (tool === 'freedraw') {
      drawingFree = { points: [{ x: svgPt.x, y: svgPt.y }] };
      State.pushUndo();
      return;
    }

    // Deselect
    if (tool === 'select') {
      State.selectedId = null;
      State.selectedArrowIdx = null;
      Renderer.renderAll();
      UI.updateEditor();
    }
  }

  function onPointerMove(e) {
    const svgPt = (() => {
      try { return getSVGPoint(e); } catch { return null; }
    })();
    if (!svgPt) return;

    const drawLayer = document.getElementById('draw-layer');

    if (dragging && dragging.type === 'player') {
      const p = State.players.find(pl => pl.id === dragging.id);
      if (!p) return;
      const dx = svgPt.x - dragging.startPt.x;
      const dy = svgPt.y - dragging.startPt.y;
      p.x = Math.max(20, Math.min(State.PITCH_W - 20, dragging.origX + dx));
      p.y = Math.max(20, Math.min(State.PITCH_H - 20, dragging.origY + dy));
      Renderer.renderAll();
      return;
    }

    if (dragging && dragging.type === 'ball') {
      const dx = svgPt.x - dragging.startPt.x;
      const dy = svgPt.y - dragging.startPt.y;
      State.ball.x = Math.max(20, Math.min(State.PITCH_W - 20, dragging.origX + dx));
      State.ball.y = Math.max(20, Math.min(State.PITCH_H - 20, dragging.origY + dy));
      Renderer.renderBall();
      return;
    }

    if (dragging && dragging.type === 'arrow-handle') {
      const a = State.arrows[dragging.idx];
      if (!a) return;
      a.ex = Math.max(20, Math.min(State.PITCH_W - 20, svgPt.x));
      a.ey = Math.max(20, Math.min(State.PITCH_H - 20, svgPt.y));
      Renderer.renderAll();
      return;
    }

    if (drawingArrow) {
      if (!drawLayer) return;
      drawLayer.innerHTML = '';
      const sx = drawingArrow.sx, sy = drawingArrow.sy;
      const x = svgPt.x, y = svgPt.y;
      const path = Renderer.createSVG('path', {
        d: `M${sx},${sy} L${x},${y}`,
        fill: 'none', stroke: 'rgba(255,255,255,0.6)', 'stroke-width': 2,
        'marker-end': 'url(#arr-m-w)'
      });
      drawLayer.appendChild(path);
      return;
    }

    if (drawingPass) {
      if (!drawLayer) return;
      drawLayer.innerHTML = '';
      const line = Renderer.createSVG('line', {
        x1: drawingPass.sx, y1: drawingPass.sy, x2: svgPt.x, y2: svgPt.y,
        stroke: 'rgba(255,210,70,0.6)', 'stroke-width': 2,
        'stroke-dasharray': '8,4', 'marker-end': 'url(#arr-m-y)'
      });
      drawLayer.appendChild(line);
      return;
    }

    if (drawingZone) {
      if (!drawLayer) return;
      drawLayer.innerHTML = '';
      const dx = Math.abs(svgPt.x - drawingZone.startX);
      const dy = Math.abs(svgPt.y - drawingZone.startY);
      const zAttrs = {
        fill: 'rgba(255,200,50,0.1)', stroke: 'rgba(255,200,50,0.5)',
        'stroke-width': 1.5, 'stroke-dasharray': '6,3'
      };
      let zEl;
      if (State.currentZoneShape === 'rect') {
        const rx = Math.min(drawingZone.startX, svgPt.x);
        const ry = Math.min(drawingZone.startY, svgPt.y);
        zEl = Renderer.createSVG('rect', { ...zAttrs, x: rx, y: ry, width: Math.max(5, dx), height: Math.max(5, dy) });
      } else {
        zEl = Renderer.createSVG('ellipse', { ...zAttrs, cx: drawingZone.startX, cy: drawingZone.startY, rx: Math.max(5, dx), ry: Math.max(5, dy) });
      }
      drawLayer.appendChild(zEl);
      return;
    }

    if (drawingFree) {
      drawingFree.points.push({ x: svgPt.x, y: svgPt.y });
      if (!drawLayer) return;
      drawLayer.innerHTML = '';
      const d = drawingFree.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      const path = Renderer.createSVG('path', {
        d, fill: 'none', stroke: 'rgba(255,255,100,0.7)', 'stroke-width': 2.5,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round'
      });
      drawLayer.appendChild(path);
      return;
    }
  }

  function onPointerUp(e) {
    const drawLayer = document.getElementById('draw-layer');

    let svgPt = null;
    try { svgPt = getSVGPoint(e); } catch {}

    if (drawingArrow && svgPt) {
      const dist = Math.hypot(svgPt.x - drawingArrow.sx, svgPt.y - drawingArrow.sy);
      if (dist > 15) {
        State.arrows.push({
          playerId: drawingArrow.playerId,
          fromPlayer: drawingArrow.fromPlayer !== false,
          sx: drawingArrow.sx,
          sy: drawingArrow.sy,
          ex: svgPt.x, ey: svgPt.y,
          type: 'straight'
        });
      }
      drawingArrow = null;
      if (drawLayer) drawLayer.innerHTML = '';
      Renderer.renderAll();
      return;
    }

    if (drawingPass && svgPt) {
      const dist = Math.hypot(svgPt.x - drawingPass.sx, svgPt.y - drawingPass.sy);
      if (dist > 15) {
        const target = findPlayerAt(svgPt);
        if (target && target.id !== drawingPass.fromId) {
          State.passLines.push({ from: drawingPass.fromId, to: target.id });
        } else {
          State.passLines.push({ x1: drawingPass.sx, y1: drawingPass.sy, x2: svgPt.x, y2: svgPt.y });
        }
      }
      drawingPass = null;
      if (drawLayer) drawLayer.innerHTML = '';
      Renderer.renderAll();
      return;
    }

    if (drawingZone && svgPt) {
      const dx = Math.abs(svgPt.x - drawingZone.startX);
      const dy = Math.abs(svgPt.y - drawingZone.startY);
      if (dx > 10 || dy > 10) {
        if (State.currentZoneShape === 'rect') {
          State.zones.push({
            shape: 'rect',
            x: Math.min(drawingZone.startX, svgPt.x),
            y: Math.min(drawingZone.startY, svgPt.y),
            w: Math.max(10, dx),
            h: Math.max(10, dy)
          });
        } else {
          State.zones.push({
            shape: 'ellipse',
            x: drawingZone.startX,
            y: drawingZone.startY,
            rx: Math.max(10, dx),
            ry: Math.max(10, dy)
          });
        }
      }
      drawingZone = null;
      if (drawLayer) drawLayer.innerHTML = '';
      Renderer.renderAll();
      return;
    }

    if (drawingFree) {
      if (drawingFree.points.length > 2) {
        const simplified = drawingFree.points.filter((_, i) => i === 0 || i === drawingFree.points.length - 1 || i % 3 === 0);
        State.freeDraws.push({ points: simplified, color: 'rgba(255,255,100,0.7)', width: 2.5 });
      }
      drawingFree = null;
      if (drawLayer) drawLayer.innerHTML = '';
      Renderer.renderAll();
      return;
    }

    if (dragging) {
      dragging = null;
      return;
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
    const svgPt = getSVGPoint(e);
    const player = findPlayerAt(svgPt);

    const items = [];

    if (player) {
      items.push({ label: `📋 ${player.name} (${player.position})`, disabled: true });
      items.push({ divider: true });
      items.push({ label: '➡ 화살표 추가', action: () => { UI.setTool('arrow'); } });
      items.push({ label: '⇢ 패스 라인 추가', action: () => { UI.setTool('pass'); } });
      items.push({ label: '◎ 선수 영역 추가', action: () => {
        State.pushUndo();
        State.zones.push({ x: player.x, y: player.y, r: 45, shape: State.currentZoneShape });
        Renderer.renderAll();
      }});
      items.push({ divider: true });
      items.push({ label: '✕ 이 선수 화살표 삭제', danger: true, action: () => {
        State.pushUndo();
        State.arrows = State.arrows.filter(a => a.playerId !== player.id);
        Renderer.renderAll();
      }});
      items.push({ label: '선수 삭제', danger: true, action: () => {
        State.pushUndo();
        State.players = State.players.filter(p => p.id !== player.id);
        State.arrows = State.arrows.filter(a => a.playerId !== player.id);
        if (State.selectedId === player.id) State.selectedId = null;
        Renderer.renderAll();
        UI.updateEditor();
      }});
    } else {
      items.push({ label: '여기에 공 배치', action: () => {
        State.pushUndo();
        State.ball.x = svgPt.x; State.ball.y = svgPt.y; State.ball.visible = true;
        Renderer.renderAll();
      }});
      items.push({ label: '◎ 여기에 선수 영역', action: () => {
        State.pushUndo();
        State.zones.push({ x: svgPt.x, y: svgPt.y, r: 45, shape: State.currentZoneShape });
        Renderer.renderAll();
      }});
    }

    ContextMenu.show(e.clientX, e.clientY, items);
  }

  return { setup, getSVGPoint };
})();


// ========================
// MODULE: ContextMenu
// ========================
const ContextMenu = (() => {
  function show(x, y, items) {
    const menu = document.getElementById('context-menu');
    menu.innerHTML = '';
    menu.style.display = 'block';

    items.forEach(item => {
      if (item.divider) {
        const div = document.createElement('div');
        div.className = 'ctx-divider';
        menu.appendChild(div);
        return;
      }
      const el = document.createElement('div');
      el.className = 'ctx-item' + (item.danger ? ' danger' : '');
      el.textContent = item.label;
      if (item.disabled) {
        el.style.opacity = '0.5';
        el.style.cursor = 'default';
        el.style.fontWeight = '700';
      }
      if (item.action && !item.disabled) {
        el.addEventListener('click', () => { item.action(); hide(); });
      }
      menu.appendChild(el);
    });

    const vw = window.innerWidth, vh = window.innerHeight;
    menu.style.left = Math.min(x, vw - 180) + 'px';
    menu.style.top = Math.min(y, vh - menu.offsetHeight - 10) + 'px';
  }

  function hide() {
    document.getElementById('context-menu').style.display = 'none';
  }

  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('#context-menu')) hide();
  });

  return { show, hide };
})();


// ========================
// MODULE: ConfirmDialog
// ========================
const ConfirmDialog = (() => {
  function show(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#1e2a1e;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:28px 24px 20px;max-width:300px;width:90%;text-align:center;font-family:\'Noto Sans KR\',sans-serif;';

    const msg = document.createElement('p');
    msg.style.cssText = 'margin:0 0 22px;font-size:15px;color:#fff;line-height:1.6;white-space:pre-line;';
    msg.textContent = message;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:10px;justify-content:center;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.style.cssText = 'padding:8px 22px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:6px;color:#fff;cursor:pointer;font-size:13px;';
    cancelBtn.addEventListener('click', () => document.body.removeChild(overlay));

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '초기화';
    confirmBtn.style.cssText = 'padding:8px 22px;background:#e8453c;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:13px;font-weight:700;';
    confirmBtn.addEventListener('click', () => { document.body.removeChild(overlay); onConfirm(); });

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);
    box.appendChild(msg);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });
  }

  return { show };
})();


// ========================
// MODULE: Animation
// ========================
const Animation = (() => {
  let animFrame = null;
  let animStartTime = null;

  function getAnimDuration() {
    return 1500 / State.speedMultiplier;
  }

  function toggle() {
    if (State.isPlaying) stop(); else start();
  }

  function start() {
    if (State.arrows.length === 0) {
      // 화살표가 없으면 마지막 애니메이션 재실행 시도
      if (State.lastArrows && State.lastArrows.length > 0) {
        State.players.forEach(p => {
          if (p.animStartX !== undefined) { p.x = p.animStartX; p.y = p.animStartY; }
        });
        State.arrows = JSON.parse(JSON.stringify(State.lastArrows));
        Renderer.renderAll();
      } else {
        Toast.show('⚠️ 먼저 선수들의 움직임 화살표를 설정하세요!', 'error');
        return;
      }
    }

    State.isPlaying = true;
    document.getElementById('play-btn').textContent = '■ STOP';
    document.getElementById('play-btn').classList.remove('primary');
    document.getElementById('play-btn').classList.add('danger');
    document.getElementById('anim-indicator').style.display = 'block';
    document.getElementById('anim-progress-container').style.display = 'block';

    State.players.forEach(p => { p.animStartX = p.x; p.animStartY = p.y; });

    const playerArrows = {};
    State.arrows.forEach(a => {
      if (!playerArrows[a.playerId]) playerArrows[a.playerId] = [];
      playerArrows[a.playerId].push(a);
    });

    animStartTime = performance.now();
    const dur = getAnimDuration();

    function animate(now) {
      const t = Math.min((now - animStartTime) / dur, 1);

      document.getElementById('anim-progress-fill').style.width = (t * 100) + '%';

      State.players.forEach(p => {
        const chain = playerArrows[p.id];
        if (!chain || chain.length === 0) return;

        const segCount = chain.length;
        const segProgress = t * segCount;
        const rawSegIdx = Math.floor(segProgress);
        const segIdx = Math.min(rawSegIdx, segCount - 1);
        const segFrac = rawSegIdx >= segCount ? 1 : (segProgress - rawSegIdx);
        const ease = segFrac < 0.5 ? 2*segFrac*segFrac : -1+(4-2*segFrac)*segFrac;

        const seg = chain[segIdx];
        const startX = (seg.fromPlayer === false && seg.sx != null) ? seg.sx : p.animStartX;
        const startY = (seg.fromPlayer === false && seg.sy != null) ? seg.sy : p.animStartY;
        p.x = startX + (seg.ex - startX) * ease;
        p.y = startY + (seg.ey - startY) * ease;
      });

      Renderer.renderAll();

      if (t < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        stop(false);
      }
    }

    animFrame = requestAnimationFrame(animate);
  }

  function stop(resetPos = true) {
    State.isPlaying = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;

    document.getElementById('play-btn').textContent = '▶ PLAY';
    document.getElementById('play-btn').classList.add('primary');
    document.getElementById('play-btn').classList.remove('danger');
    document.getElementById('anim-indicator').style.display = 'none';
    document.getElementById('anim-progress-container').style.display = 'none';
    document.getElementById('anim-progress-fill').style.width = '0%';

    if (resetPos) {
      // 수동 STOP: 선수 위치 되돌리기
      State.players.forEach(p => {
        if (p.animStartX !== undefined) { p.x = p.animStartX; p.y = p.animStartY; }
      });
      Renderer.renderAll();
    } else {
      // 자연 완료: 화살표를 저장 후 삭제, 선수는 도착 위치 유지
      State.lastArrows = JSON.parse(JSON.stringify(State.arrows));
      State.arrows = [];
      Renderer.renderAll();
    }
  }

  function reset() {
    if (State.isPlaying) stop();
    State.pushUndo();
    State.players.forEach(p => { p.x = p.startX; p.y = p.startY; });
    State.arrows = [];
    State.lastArrows = [];
    Renderer.renderAll();
    Toast.show('🔄 초기화되었습니다');
  }

  return { toggle, start, stop, reset };
})();


// ========================
// MODULE: SceneManager
// ========================
const SceneManager = (() => {
  function init() {
    if (State.scenes.length === 0) {
      State.scenes.push(createScene('장면 1'));
    }
  }

  function createScene(name) {
    return {
      id: Date.now(),
      name: name || `장면 ${State.scenes.length + 1}`,
      players: JSON.parse(JSON.stringify(State.players)),
      arrows: JSON.parse(JSON.stringify(State.arrows)),
      zones: JSON.parse(JSON.stringify(State.zones)),
      passLines: JSON.parse(JSON.stringify(State.passLines)),
      freeDraws: JSON.parse(JSON.stringify(State.freeDraws)),
      ball: { ...State.ball },
      memo: ''
    };
  }

  function saveCurrent() {
    const s = State.scenes[State.currentScene];
    if (!s) return;
    s.players = JSON.parse(JSON.stringify(State.players));
    s.arrows = JSON.parse(JSON.stringify(State.arrows));
    s.zones = JSON.parse(JSON.stringify(State.zones));
    s.passLines = JSON.parse(JSON.stringify(State.passLines));
    s.freeDraws = JSON.parse(JSON.stringify(State.freeDraws));
    s.ball = { ...State.ball };
    s.memo = document.getElementById('memo-textarea').value || '';
  }

  function add() {
    saveCurrent();
    const newScene = createScene(`장면 ${State.scenes.length + 1}`);
    State.scenes.push(newScene);
    State.currentScene = State.scenes.length - 1;
    load(State.currentScene);
    renderList();
    Toast.show(`📋 장면 ${State.scenes.length} 추가됨`);
  }

  function load(idx) {
    saveCurrent();
    State.currentScene = idx;
    const s = State.scenes[idx];
    State.players = JSON.parse(JSON.stringify(s.players));
    State.arrows = JSON.parse(JSON.stringify(s.arrows));
    State.zones = JSON.parse(JSON.stringify(s.zones));
    State.passLines = JSON.parse(JSON.stringify(s.passLines));
    State.freeDraws = JSON.parse(JSON.stringify(s.freeDraws || []));
    State.ball = { ...s.ball };
    document.getElementById('memo-textarea').value = s.memo || '';
    State.selectedId = null;
    State.selectedArrowIdx = null;
    Renderer.renderAll();
    renderList();
    updateMemoLabel();
    UI.updateEditor();
  }

  function remove(idx) {
    if (State.scenes.length <= 1) {
      Toast.show('⚠️ 최소 1개의 장면이 필요합니다', 'error');
      return;
    }
    State.scenes.splice(idx, 1);
    if (State.currentScene >= State.scenes.length) State.currentScene = State.scenes.length - 1;
    load(State.currentScene);
    Toast.show('🗑️ 장면이 삭제되었습니다');
  }

  function rename(idx, name) {
    if (State.scenes[idx]) State.scenes[idx].name = name;
    updateMemoLabel();
  }

  function renderList() {
    const list = document.getElementById('scene-list');
    list.innerHTML = '';

    State.scenes.forEach((s, i) => {
      const item = document.createElement('div');
      item.className = 'scene-item' + (i === State.currentScene ? ' active' : '');

      const num = document.createElement('div');
      num.className = 'scene-num';
      num.textContent = i + 1;
      item.appendChild(num);

      const nameInput = document.createElement('input');
      nameInput.className = 'scene-name';
      nameInput.value = s.name;
      nameInput.addEventListener('change', (e) => rename(i, e.target.value));
      nameInput.addEventListener('click', (e) => e.stopPropagation());
      item.appendChild(nameInput);

      if (State.scenes.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.className = 'scene-delete';
        delBtn.textContent = '✕';
        delBtn.addEventListener('click', (e) => { e.stopPropagation(); remove(i); });
        item.appendChild(delBtn);
      }

      item.addEventListener('click', () => load(i));
      list.appendChild(item);
    });
  }

  function updateMemoLabel() {
    const s = State.scenes[State.currentScene];
    document.getElementById('memo-scene-label').textContent = s ? s.name : '';
  }

  return { init, add, load, remove, saveCurrent, renderList, updateMemoLabel };
})();


// ========================
// MODULE: Export/Import
// ========================
const ExportImport = (() => {
  function exportPNG() {
    const svg = document.getElementById('pitch-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = State.PITCH_W * 2;
    canvas.height = State.PITCH_H * 2;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `tactical_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      Toast.show('📷 PNG 이미지가 저장되었습니다!', 'success');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      Toast.show('⚠️ 폰트 로딩 이슈가 있을 수 있습니다. 다시 시도해주세요.', 'error');
    };

    img.src = url;
  }

  function exportJSON() {
    SceneManager.saveCurrent();
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      scenes: State.scenes,
      currentScene: State.currentScene
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `tactical_${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    Toast.show('💾 JSON 파일이 저장되었습니다!', 'success');
  }

  function importJSON() {
    document.getElementById('file-input').click();
  }

  function handleFileImport(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.scenes && data.scenes.length > 0) {
          State.scenes = data.scenes;
          State.currentScene = data.currentScene || 0;
          let maxId = 0;
          State.scenes.forEach(s => s.players.forEach(p => { if (p.id > maxId) maxId = p.id; }));
          State.nextPlayerId = maxId + 1;
          SceneManager.load(State.currentScene);
          Toast.show('📂 전술 데이터를 불러왔습니다!', 'success');
        } else {
          Toast.show('⚠️ 잘못된 파일 형식입니다', 'error');
        }
      } catch (err) {
        Toast.show('⚠️ JSON 파싱 오류: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  return { exportPNG, exportJSON, importJSON, handleFileImport };
})();


// ========================
// MODULE: Persistence (localStorage)
// ========================
const Persistence = (() => {
  const STORAGE_KEY = 'tactical_board_data';
  let saveTimeout = null;

  function autoSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      save();
    }, 1000);
  }

  function save() {
    try {
      SceneManager.saveCurrent();
      const data = {
        scenes: State.scenes,
        currentScene: State.currentScene,
        nextPlayerId: State.nextPlayerId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage full or unavailable
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.scenes && data.scenes.length > 0) {
        State.scenes = data.scenes;
        State.currentScene = data.currentScene || 0;
        State.nextPlayerId = data.nextPlayerId || 100;
        return true;
      }
    } catch (e) {}
    return false;
  }

  return { autoSave, save, load };
})();


// ========================
// MODULE: Toast
// ========================
const Toast = (() => {
  function show(message, type = '') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
  }
  return { show };
})();


// ========================
// MODULE: UI Controller
// ========================
const UI = (() => {
  const TOOLS = [
    { id: 'select', icon: '↖', label: '선택 / 이동', key: '1' },
    { id: 'arrow', icon: '➡', label: '움직임 화살표', key: '2' },
    { id: 'pass', icon: '⇢', label: '패스 라인', key: '3' },
    { id: 'zone', icon: '◎', label: '선수 영역', key: '4' },
    { id: 'freedraw', icon: '✎', label: '자유 그리기', key: '5' },
    { id: 'erase', icon: '✕', label: '지우개', key: '6' },
    { id: 'ball', icon: '⚽', label: '공 배치', key: '7' },
  ];

  function init() {
    buildFormations();
    buildTools();
    bindEvents();
  }

  function buildFormations() {
    const homeEl = document.getElementById('home-formations');
    const awayEl = document.getElementById('away-formations');

    Object.keys(Formations.PRESETS).forEach(name => {
      const hBtn = document.createElement('button');
      hBtn.className = 'formation-btn';
      hBtn.textContent = name;
      hBtn.addEventListener('click', () => { Formations.apply(name, false); Renderer.renderAll(); Toast.show(`홈팀: ${name}`); });
      homeEl.appendChild(hBtn);

      const aBtn = document.createElement('button');
      aBtn.className = 'formation-btn away-btn';
      aBtn.textContent = name;
      aBtn.style.borderColor = 'rgba(26,111,232,0.3)';
      aBtn.addEventListener('click', () => { Formations.apply(name, true); Renderer.renderAll(); Toast.show(`상대팀: ${name}`); });
      awayEl.appendChild(aBtn);
    });
  }

  function buildTools() {
    const group = document.getElementById('tool-group');
    TOOLS.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tool-btn' + (t.id === 'select' ? ' active' : '');
      btn.id = 'tool-' + t.id;
      btn.innerHTML = `<div class="tool-icon">${t.icon}</div>${t.label}<span class="tool-shortcut">${t.key}</span>`;
      btn.addEventListener('click', () => setTool(t.id));
      group.appendChild(btn);
    });
  }

  function setTool(tool) {
    State.currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tool-' + tool);
    if (btn) btn.classList.add('active');

    const t = TOOLS.find(t => t.id === tool);
    document.getElementById('mode-label').textContent = '도구: ' + (t ? t.label : tool);

    const shapeSel = document.getElementById('zone-shape-selector');
    shapeSel.style.display = tool === 'zone' ? 'flex' : 'none';

    const svg = document.getElementById('pitch-svg');
    const cursors = { select: 'default', arrow: 'crosshair', pass: 'crosshair', zone: 'cell', erase: 'not-allowed', ball: 'copy', freedraw: 'crosshair' };
    svg.style.cursor = cursors[tool] || 'default';
  }

  function updateEditor() {
    const editor = document.getElementById('editor-fields');
    const empty = document.getElementById('editor-empty');

    if (State.selectedId === null) {
      editor.style.display = 'none';
      empty.style.display = 'block';
    } else {
      const p = State.players.find(p => p.id === State.selectedId);
      if (!p) return;
      editor.style.display = 'block';
      empty.style.display = 'none';
      document.getElementById('f-name').value = p.name || '';
      document.getElementById('f-number').value = p.number;
      document.getElementById('f-pos').value = p.position || '';
    }
  }

  function bindEvents() {
    // Toolbar
    document.getElementById('play-btn').addEventListener('click', Animation.toggle);
    document.getElementById('btn-reset').addEventListener('click', () => {
      ConfirmDialog.show('전부 초기화 하시겠습니까?\n선수 위치와 모든 화살표를 초기화합니다.', Animation.reset);
    });
    document.getElementById('btn-undo').addEventListener('click', () => {
      if (State.undo()) { Renderer.renderAll(); UI.updateEditor(); Toast.show('↩ 실행취소'); }
    });
    document.getElementById('btn-redo').addEventListener('click', () => {
      if (State.redo()) { Renderer.renderAll(); UI.updateEditor(); Toast.show('↪ 다시실행'); }
    });
    document.getElementById('btn-export-png').addEventListener('click', ExportImport.exportPNG);
    document.getElementById('btn-export-json').addEventListener('click', ExportImport.exportJSON);
    document.getElementById('btn-import-json').addEventListener('click', ExportImport.importJSON);

    // File input
    document.getElementById('file-input').addEventListener('change', (e) => {
      if (e.target.files[0]) ExportImport.handleFileImport(e.target.files[0]);
      e.target.value = '';
    });

    // Speed slider
    document.getElementById('speed-slider').addEventListener('input', (e) => {
      State.speedMultiplier = parseFloat(e.target.value);
      document.getElementById('speed-label').textContent = State.speedMultiplier + '×';
    });

    // Scene
    document.getElementById('btn-add-scene').addEventListener('click', SceneManager.add);

    // Sidebar
    document.getElementById('btn-clear-arrows').addEventListener('click', () => {
      if (State.arrows.length === 0 && State.passLines.length === 0 && State.zones.length === 0 && State.freeDraws.length === 0) {
        Toast.show('삭제할 항목이 없습니다');
        return;
      }
      State.pushUndo();
      State.arrows = [];
      State.passLines = [];
      State.zones = [];
      State.freeDraws = [];
      Renderer.renderAll();
      Toast.show('🗑️ 모든 그리기가 삭제되었습니다');
    });

    document.getElementById('btn-add-player').addEventListener('click', () => {
      State.pushUndo();
      const cx = State.PITCH_W / 2, cy = State.PITCH_H / 2;
      State.players.push({
        id: State.nextPlayerId++,
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 60,
        startX: cx, startY: cy,
        number: State.players.length + 1,
        name: `선수${State.players.length + 1}`,
        position: 'MF',
        away: false
      });
      Renderer.renderAll();
      Toast.show('✅ 선수가 추가되었습니다');
    });

    // Toggle sidebars
    document.getElementById('toggle-sidebar-btn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
    document.getElementById('toggle-left').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
    document.getElementById('toggle-right').addEventListener('click', () => {
      document.getElementById('right-panel').classList.toggle('collapsed');
    });

    // Player editor inputs
    document.getElementById('f-name').addEventListener('input', updatePlayerFromEditor);
    document.getElementById('f-number').addEventListener('input', updatePlayerFromEditor);
    document.getElementById('f-pos').addEventListener('input', updatePlayerFromEditor);

    // Delete player
    document.getElementById('btn-delete-player').addEventListener('click', () => {
      if (!State.selectedId) return;
      State.pushUndo();
      State.players = State.players.filter(p => p.id !== State.selectedId);
      State.arrows = State.arrows.filter(a => a.playerId !== State.selectedId);
      State.selectedId = null;
      Renderer.renderAll();
      updateEditor();
      Toast.show('🗑️ 선수가 삭제되었습니다');
    });

    // Zone shape selector
    document.getElementById('shape-ellipse').addEventListener('click', () => {
      State.currentZoneShape = 'ellipse';
      document.querySelectorAll('.zone-shape-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('shape-ellipse').classList.add('active');
    });
    document.getElementById('shape-rect').addEventListener('click', () => {
      State.currentZoneShape = 'rect';
      document.querySelectorAll('.zone-shape-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('shape-rect').classList.add('active');
    });

    // Memo
    document.getElementById('memo-textarea').addEventListener('input', () => {
      const s = State.scenes[State.currentScene];
      if (s) s.memo = document.getElementById('memo-textarea').value;
      Persistence.autoSave();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (State.selectedArrowIdx !== null) {
          State.pushUndo();
          State.arrows.splice(State.selectedArrowIdx, 1);
          State.selectedArrowIdx = null;
          Renderer.renderAll();
        } else if (State.selectedId) {
          document.getElementById('btn-delete-player').click();
        }
      }
      if (e.key === 'Escape') {
        State.selectedId = null;
        State.selectedArrowIdx = null;
        Renderer.renderAll();
        updateEditor();
      }
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        if (State.undo()) { Renderer.renderAll(); updateEditor(); }
      }
      if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        if (State.redo()) { Renderer.renderAll(); updateEditor(); }
      }
      if ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (State.redo()) { Renderer.renderAll(); updateEditor(); }
      }
      if (e.key === ' ') { e.preventDefault(); Animation.toggle(); }
      if (e.key === '1') setTool('select');
      if (e.key === '2') setTool('arrow');
      if (e.key === '3') setTool('pass');
      if (e.key === '4') setTool('zone');
      if (e.key === '5') setTool('freedraw');
      if (e.key === '6') setTool('erase');
      if (e.key === '7') setTool('ball');
    });
  }

  function updatePlayerFromEditor() {
    if (!State.selectedId) return;
    const p = State.players.find(p => p.id === State.selectedId);
    if (!p) return;
    p.name = document.getElementById('f-name').value;
    p.number = parseInt(document.getElementById('f-number').value) || p.number;
    p.position = document.getElementById('f-pos').value;
    Renderer.renderAll();
  }

  return { init, setTool, updateEditor };
})();


// ========================
// INIT APP
// ========================
function initApp() {
  PitchRenderer.draw();
  UI.init();

  const restored = Persistence.load();
  if (restored) {
    SceneManager.load(State.currentScene);
    Toast.show('📂 이전 데이터를 복원했습니다', 'success');
  } else {
    Formations.apply('4-3-3', false);
    Formations.apply('4-4-2', true);
    SceneManager.init();
    SceneManager.saveCurrent();
  }

  SceneManager.renderList();
  SceneManager.updateMemoLabel();
  InputHandler.setup();
  Renderer.renderAll();
}

// Start
initApp();

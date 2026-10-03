import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AI_NAME = 'CopilotPanel';

class SVG {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.elements = [];
  }
  rect(x, y, w, h, rx, fill, stroke, strokeWidth, strokeDasharray = '') {
    let style = `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};`;
    if (strokeDasharray) style += `stroke-dasharray:${strokeDasharray};`;
    this.elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" style="${style}" />`);
  }
  text(x, y, lines, fontSize, fill, fontWeight = 'normal', anchor = 'middle', bg = false) {
    if (typeof lines === 'string') lines = [lines];
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const startY = y - (totalHeight / 2) + (lineHeight / 2);

    if (bg) {
      const maxLen = Math.max(...lines.map(l => l.length));
      const boxW = maxLen * fontSize * 0.6 + 16;
      const boxH = totalHeight + 16;
      const boxX = anchor === 'middle' ? x - boxW/2 : (anchor === 'start' ? x - 8 : x - boxW + 8);
      this.elements.push(`<rect x="${boxX}" y="${y - totalHeight/2 - 8}" width="${boxW}" height="${boxH}" fill="#ffffff" />`);
    }

    lines.forEach((line, i) => {
      this.elements.push(`<text x="${x}" y="${startY + i * lineHeight}" font-family="Inter, sans-serif" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central">${line}</text>`);
    });
  }
  path(d, stroke, strokeWidth, fill = 'none', strokeDasharray = '', markerEnd = '') {
    let style = `fill:${fill};stroke:${stroke};stroke-width:${strokeWidth};`;
    if (strokeDasharray) style += `stroke-dasharray:${strokeDasharray};`;
    if (markerEnd) style += `marker-end:url(#${markerEnd});`;
    this.elements.push(`<path d="${d}" style="${style}" />`);
  }
  circle(x, y, r, fill) {
    this.elements.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" />`);
  }
  render() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}">
  <defs>
    <marker id="arrow" viewBox="0 0 16 16" refX="14" refY="8" markerWidth="16" markerHeight="16" orient="auto">
      <path d="M 2 2 L 14 8 L 2 14" fill="none" stroke="#5f5f5f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" />
  ${this.elements.join('\n  ')}
</svg>`;
  }
}

const svg = new SVG(2608, 1560);

const strokeC = '#5f5f5f';
const panelFill = '#ffffff';
const panelStroke = '#d4d4d4';
const boxFill = '#ffffff';

function panel(x, y, w, h, label) {
  svg.rect(x, y, w, h, 16, panelFill, panelStroke, 1.5);
  const textW = label.length * 15 + 40;
  svg.rect(x + 24, y - 24, textW, 48, 24, '#f4f4f5', 'none', 0);
  svg.text(x + 24 + textW/2, y, label, 26, '#333', '600');
}

function box(x, y, w, h, title, subtitle) {
  svg.rect(x, y, w, h, 10, boxFill, strokeC, 3);
  svg.text(x + w/2, y + h/2 - 14, title, 28, '#111', '600');
  svg.text(x + w/2, y + h/2 + 18, subtitle, 22, '#5f5f5f', '400');
}

function badge(x, y, num) {
  svg.circle(x, y, 20, '#333');
  svg.text(x, y + 2, num, 22, '#fff', '600');
}

function elbow(points, dashed = false, markerEnd = 'arrow') {
  const r = 20;
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i-1], curr = points[i], next = points[i+1];
    const dx1 = Math.sign(curr[0] - prev[0]), dy1 = Math.sign(curr[1] - prev[1]);
    const dx2 = Math.sign(next[0] - curr[0]), dy2 = Math.sign(next[1] - curr[1]);
    
    // Calculate distance between points to ensure radius isn't larger than line segment
    const dist1 = Math.hypot(curr[0]-prev[0], curr[1]-prev[1]);
    const dist2 = Math.hypot(next[0]-curr[0], next[1]-curr[1]);
    const actualR = Math.min(r, dist1/2, dist2/2);
    
    const p1x = curr[0] - dx1 * actualR, p1y = curr[1] - dy1 * actualR;
    const p2x = curr[0] + dx2 * actualR, p2y = curr[1] + dy2 * actualR;
    d += ` L ${p1x},${p1y} A ${actualR} ${actualR} 0 0 ${ (dx1*dy2 - dy1*dx2 > 0) ? 1 : 0 } ${p2x},${p2y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]},${last[1]}`;
  svg.path(d, strokeC, 3, 'none', dashed ? (dashed === 'dotted' ? '4,6' : (dashed === 'long' ? '16,16' : '8,8')) : '', markerEnd);
}

// Panels
panel(60, 120, 936, 820, 'React Client');
panel(1076, 120, 936, 820, 'Express API');
panel(2092, 120, 456, 820, 'Storage and External');
panel(60, 1020, 2488, 228, '@slackboard/shared (pure TypeScript, no I/O)');

// Lifecycle Strip (Panel 5)
svg.rect(60, 1328, 2488, 140, 16, panelFill, panelStroke, 1.5);
svg.text(60 + 20, 1328 + 24, 'Request lifecycle: create or edit a task with dependencies', 26, '#333', '600', 'start');
const steps = [
  'User submits TaskDetail form',
  'Client cycle check, optimistic update, cache write',
  'PUT or POST /api/tasks',
  'Rate limit, zod validation',
  'Server cycle check, 422 with path if cyclic',
  'db.ts writes db.json',
  '200 keeps state, 422 rolls back',
  'Schedule recomputed, views update'
];
const cellW = 2488 / 8;
for(let i=0; i<8; i++) {
  const cx = 60 + i*cellW;
  if(i>0) svg.path(`M ${cx},1328 L ${cx},1468`, panelStroke, 1.5);
  badge(cx + 40, 1328 + 84, (i+1).toString());
  svg.text(cx + 80, 1328 + 84, steps[i].match(/.{1,24}(?:\s|$)/g).map(s=>s.trim()), 20, '#5f5f5f', '400', 'start');
}

// Boxes Panel 1
box(108, 200, 360, 100, 'Board', 'columns, cards, dnd-kit');
box(108, 340, 360, 100, 'TaskDetail', 'form, dependency picker');
box(108, 480, 360, 100, 'Timeline', 'Gantt, bars');
box(108, 620, 360, 100, 'Dashboard', 'KPIs, slip simulator');
box(108, 760, 360, 100, AI_NAME, 'plan, ask');
box(588, 480, 360, 100, 'TasksProvider', 'Context, state, fetch');
box(588, 760, 360, 100, 'localStorage', 'read-through cache');

// Boxes Panel 2
box(1124, 200, 840, 100, 'Middleware', 'helmet, cors, rate limit, zod validation, error handler');
box(1124, 340, 360, 100, 'tasksRouter', 'REST CRUD');
box(1124, 480, 360, 100, 'scheduleRouter', 'GET schedule');
box(1124, 760, 360, 100, 'copilotRouter', 'plan, ask');
box(1604, 410, 360, 100, 'db.ts', 'JSON file persistence');
box(1604, 760, 360, 100, 'callGroq', 'prompt, cycle check, retry');

// Boxes Panel 3
box(2140, 410, 360, 100, 'db.json', 'server/data');
box(2140, 620, 360, 100, 'Groq API', 'hosted LLM');
box(2140, 760, 360, 100, 'Mock mode', 'canned plan, no API key');

// Boxes Panel 4
box(106, 1084, 360, 100, 'topoSort', 'Kahn, DFS cycle path');
box(606, 1084, 360, 100, 'computeSchedule', 'forward, backward, slack');
box(1106, 1084, 360, 100, 'wouldCreateCycle', 'edge check, returns path');
box(1606, 1084, 360, 100, 'slipImpact', 'max(0, N - slack)');

// Connectors
// 1. Pages to TasksProvider
const busX = 528;
[250, 390, 530, 670, 810].forEach(y => {
  if(y === 530) elbow([[468, y], [588, y]]);
  else elbow([[468, y], [busX, y]], false, '');
});
elbow([[busX, 250], [busX, 810]], false, '');

// 2. TasksProvider to Middleware
elbow([[850, 480], [850, 250], [1124, 250]]);
svg.text(987, 250, 'REST /api/*', 20, strokeC, '600', 'middle', true);

// 3. TasksProvider to localStorage
elbow([[768, 580], [768, 760]], false, 'arrow');
svg.path('M 760 592 L 768 580 L 776 592', strokeC, 3, 'none', '', ''); // Fake up arrow

// 4. Middleware to Routers
elbow([[1124, 280], [1084, 280], [1084, 810]], false, '');
[390, 530, 810].forEach(y => elbow([[1084, y], [1124, y]]));

// 5. Routers to db.ts
elbow([[1484, 390], [1544, 390], [1544, 460], [1604, 460]]);
elbow([[1484, 530], [1544, 530], [1544, 460]], false, ''); 
// We merge them at 1544, 460

// 6. copilotRouter to callGroq
elbow([[1484, 810], [1604, 810]]);

// 7. db.ts to db.json
elbow([[1964, 460], [2140, 460]]);

// 8. callGroq to Groq API
elbow([[1964, 810], [2052, 810], [2052, 670], [2140, 670]]);

// 9. callGroq to Mock mode
elbow([[1784, 860], [1784, 900], [2140, 900]], 'short');
svg.text(1962, 900, 'no API key or mock mode', 20, strokeC, '400', 'middle', true);

// 10. Dashed return loop
elbow([[1544, 120], [1544, 60], [700, 60], [700, 480]], 'long');
svg.text(1122, 60, '200 OK or 422: state sync, rollback on error', 20, strokeC, '600', 'middle', true);

// 11. Dotted imports
elbow([[528, 940], [528, 1020]], 'dotted');
svg.text(548, 980, ['TaskDetail: wouldCreateCycle', 'Timeline, Dashboard: computeSchedule, slipImpact'], 20, strokeC, '400', 'start', true);

elbow([[1544, 940], [1544, 1020]], 'dotted');
svg.text(1564, 980, ['tasksRouter: wouldCreateCycle', 'scheduleRouter: computeSchedule', `${AI_NAME} service: both`], 20, strokeC, '400', 'start', true);

// Badges
badge(468, 340, '1'); // TaskDetail
badge(948, 480, '2'); // TasksProvider
badge(900, 250, '3'); // tasksProvider to MW arrow
badge(1964, 200, '4'); // MW
badge(1484, 340, '5'); // tasksRouter
badge(1964, 410, '6'); // db.ts
badge(868, 60, '7'); // Return loop
badge(966, 1084, '8'); // computeSchedule

const outSvg = path.join(__dirname, 'temp.svg');
const outPng = path.join(__dirname, '../../docs/architecture/slackboard-architecture.png');
fs.writeFileSync(outSvg, svg.render());

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; background: #fff; width: 2608px; height: 1560px; }
          * { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body>
        ${svg.render()}
      </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); 
  await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: 2608, height: 1560 } });
  
  fs.unlinkSync(outSvg); // Cleanup
  await browser.close();
  console.log('Diagram generated: slackboard-architecture.png');
})();

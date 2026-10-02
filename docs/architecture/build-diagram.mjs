import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  text(x, y, content, fontSize, fill, fontWeight = 'normal', anchor = 'middle', bg = false) {
    if (bg) {
      this.elements.push(`<rect x="${x - content.length * fontSize * 0.3}" y="${y - fontSize * 0.6}" width="${content.length * fontSize * 0.6}" height="${fontSize * 1.3}" fill="#ffffff" />`);
    }
    this.elements.push(`<text x="${x}" y="${y}" font-family="Inter, sans-serif" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central">${content}</text>`);
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
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 2 2 L 8 5 L 2 8" fill="none" stroke="#6b6b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;display=swap');
      text { font-family: 'Inter', sans-serif; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff" />
  ${this.elements.join('\n  ')}
</svg>`;
  }
}

const AI_NAME = 'CopilotPanel';

const svg = new SVG(2260, 1360);

// Colors
const strokeColor = '#6b6b6b';
const panelBg = '#ffffff';
const panelStroke = '#e5e5e5';
const pillBg = '#f4f4f5';
const boxBg = '#ffffff';

// Helpers
function panel(x, y, w, h, label, sublabel = '') {
  svg.rect(x, y, w, h, 16, panelBg, panelStroke, 2.5);
  const pillW = Math.max(label.length * 15, 160) + (sublabel ? sublabel.length * 9 : 0);
  svg.rect(x + 24, y - 20, pillW, 40, 20, pillBg, panelStroke, 1);
  const text = sublabel ? `${label} (${sublabel})` : label;
  svg.text(x + 24 + pillW / 2, y, text, 18, '#333', '600');
}

function box(x, y, w, h, line1, line2) {
  svg.rect(x, y, w, h, 8, boxBg, strokeColor, 2.5);
  svg.text(x + w / 2, y + h / 2 - 12, line1, 24, '#111', '600');
  svg.text(x + w / 2, y + h / 2 + 16, line2, 20, '#555', '400');
}

function badge(x, y, num) {
  svg.circle(x, y, 16, '#333');
  svg.text(x, y + 2, num, 18, '#fff', '600');
}

function elbow(points, dashed = false, markerEnd = 'arrow') {
  const r = 16;
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i-1];
    const curr = points[i];
    const next = points[i+1];
    
    // Direction from prev to curr
    const dx1 = Math.sign(curr[0] - prev[0]);
    const dy1 = Math.sign(curr[1] - prev[1]);
    
    // Direction from curr to next
    const dx2 = Math.sign(next[0] - curr[0]);
    const dy2 = Math.sign(next[1] - curr[1]);
    
    // Point before corner
    const p1x = curr[0] - dx1 * r;
    const p1y = curr[1] - dy1 * r;
    
    // Point after corner
    const p2x = curr[0] + dx2 * r;
    const p2y = curr[1] + dy2 * r;
    
    // Draw line to start of curve, then arc to end of curve
    d += ` L ${p1x},${p1y} A ${r} ${r} 0 0 ${ (dx1*dy2 - dy1*dx2 > 0) ? 1 : 0 } ${p2x},${p2y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]},${last[1]}`;
  
  svg.path(d, strokeColor, 2.5, 'none', dashed ? (dashed === 'dotted' ? '4,4' : '12,12') : '', markerEnd);
}

// Draw Panels
panel(48, 120, 800, 856, 'React Client');
panel(928, 120, 800, 856, 'Express API', 'helmet, cors, rate limit, zod, error handler');
panel(1808, 120, 400, 856, 'Storage and External');
panel(48, 1056, 1680, 192, '@slackboard/shared', 'pure TypeScript');

// Draw Boxes
// Col 1
box(88, 184, 320, 88, 'Board', 'Column, TaskCard, dnd-kit');
box(88, 320, 320, 88, 'TaskDetail', 'form, dependency picker');
box(88, 456, 320, 88, 'Timeline', 'Gantt, GanttBar');
box(88, 592, 320, 88, 'Dashboard', 'class component, slip simulator');
box(88, 728, 320, 88, AI_NAME, 'plan and ask');

// Col 2
box(488, 456, 320, 88, 'TasksProvider', 'Context, useState, fetch');

// Col 3
box(968, 320, 320, 88, 'tasksRouter', 'REST: GET, POST, PUT, PATCH, DELETE');
box(968, 456, 320, 88, 'scheduleRouter', 'GET /api/schedule');
box(968, 728, 320, 88, 'copilotRouter', 'plan, ask');

// Col 4
box(1368, 388, 320, 88, 'db.ts', 'JSON file persistence');
box(1368, 728, 320, 88, 'callGroq', 'prompt, schema, cycle check, retry');

// Col 5
box(1848, 388, 320, 88, 'db.json', 'server/data');
box(1848, 728, 320, 88, 'LLM API', 'Groq, with mock fallback');

// Panel 4 Shared
box(92, 1120, 320, 88, 'topoSort', 'Kahn, DFS cycle path');
box(516, 1120, 320, 88, 'computeSchedule', 'forward, backward, slack');
box(940, 1120, 320, 88, 'wouldCreateCycle', 'edge check');
box(1364, 1120, 320, 88, 'slipImpact', 'max(0, N - slack)');


// Draw Connectors
// 1. Pages to TasksProvider
const busX1 = 448;
[228, 364, 500, 636, 772].forEach(y => {
  if (y === 500) elbow([[408, y], [488, y]]);
  else elbow([[408, y], [busX1, y]], false, '');
});
elbow([[busX1, 228], [busX1, 772]], false, '');

// 2. TasksProvider to Express API
elbow([[808, 500], [888, 500]], false, '');
elbow([[888, 364], [888, 772]], false, '');
[364, 500, 772].forEach(y => {
  elbow([[888, y], [968, y]]);
});
svg.text(848, 484, 'REST /api/* JSON', 18, strokeColor, '500', 'middle', true);

// 3. Col 3 to Col 4
elbow([[1288, 364], [1328, 364], [1328, 412], [1368, 412]]);
elbow([[1288, 500], [1328, 500], [1328, 452], [1368, 452]]);
elbow([[1288, 772], [1368, 772]]);

// 4. Col 4 to Col 5
elbow([[1688, 432], [1848, 432]]);
elbow([[1688, 772], [1848, 772]]);

// 5. Dashed loop (Response / state sync)
elbow([[1328, 120], [1328, 60], [648, 60], [648, 456]], true);
svg.text(988, 60, 'Response / state sync (optimistic update, rollback on error)', 20, strokeColor, '500', 'middle', true);

// 6. Dotted imports
elbow([[448, 976], [448, 1056]], 'dotted');
svg.text(456, 1016, 'imports', 18, strokeColor, 'normal', 'start', true);
elbow([[1328, 976], [1328, 1056]], 'dotted');
svg.text(1336, 1016, 'imports', 18, strokeColor, 'normal', 'start', true);


// Draw Badges
// 1
badge(88 + 320, 320, '1');
badge(968 + 320, 320, '1');
badge(940 + 320, 1120, '1');
// 2
badge(88 + 320, 456, '2');
badge(88 + 320, 592, '2');
badge(968 + 320, 456, '2');
badge(516 + 320, 1120, '2');
badge(1364 + 320, 1120, '2');
// 3
badge(88 + 320, 728, '3');
badge(968 + 320, 728, '3');
badge(1368 + 320, 728, '3');
badge(1848 + 320, 728, '3');

// Legend
const legY = 1300;
badge(64, legY, '1'); svg.text(90, legY+2, 'Dependency modeling + cycle prevention', 20, '#333', '500', 'start');
badge(550, legY, '2'); svg.text(576, legY+2, 'CPM engine + live schedule', 20, '#333', '500', 'start');
badge(920, legY, '3'); svg.text(946, legY+2, 'AI planning assistant', 20, '#333', '500', 'start');

const svgStr = svg.render();
const outSvg = path.join(__dirname, 'slackboard-architecture.svg');
const outPng = path.join(__dirname, 'slackboard-architecture.png');

fs.writeFileSync(outSvg, svgStr);

// Use Playwright to render PNG
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2 // 2x density
  });
  const page = await context.newPage();
  
  // Create an HTML wrapper to ensure the font loads before screenshot
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; background: #fff; width: 2260px; height: 1360px; }
          * { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body>
        ${svgStr}
      </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500); // give font a moment to render
  
  await page.screenshot({ path: outPng, clip: { x: 0, y: 0, width: 2260, height: 1360 } });
  
  await browser.close();
  console.log('Diagram generated: SVG and PNG');
})();

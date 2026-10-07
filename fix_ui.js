const fs = require('fs');
let c = fs.readFileSync('client/src/components/CopilotPanel.tsx', 'utf8');
const regex = /<ReactMarkdown[\s\S]*?<\/ReactMarkdown>/;
const replacement = `<style>{\`
  .copilot-md table { border-collapse: collapse; width: 100%; font-size: 0.9em; margin-bottom: 1em; display: block; overflow-x: auto; }
  .copilot-md th, .copilot-md td { border: 1px solid var(--color-border-1); padding: 6px 10px; min-width: 80px; white-space: normal; }
  .copilot-md th:first-child, .copilot-md td:first-child { white-space: nowrap; font-weight: 500; min-width: 120px; }
  .copilot-md p { margin-bottom: 1em; line-height: 1.6; }
  .copilot-md p:last-child { margin-bottom: 0; }
  .copilot-md ul { list-style-type: disc; padding-left: 20px; margin-bottom: 1em; }
  .copilot-md li { margin-bottom: 0.6em; line-height: 1.6; }
  .copilot-md strong { color: var(--color-text-1); font-weight: 700; }
  .copilot-md code { background: var(--color-bg-1); padding: 2px 4px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.9em; }
\`}</style>
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {msg.content.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/?[a-z][\\s\\S]*?>/gi, '')}
</ReactMarkdown>`;
c = c.replace(regex, replacement);
c = c.replace(/className="rounded-lg px-3 py-2 text-xs"/g, 'className="rounded-lg px-3 py-2 text-xs copilot-md"');
fs.writeFileSync('client/src/components/CopilotPanel.tsx', c);
console.log('done');

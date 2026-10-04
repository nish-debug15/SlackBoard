const fs = require('fs');

let code = fs.readFileSync('client/src/components/CopilotPanel.tsx', 'utf8');

const regex = /<div\s+className="rounded-lg px-3 py-2 text-xs whitespace-pre-wrap"[\s\S]*?>\s*\{msg\.content\}\s*<\/div>/m;
const replacement = `<div
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: 'var(--color-bg-2)',
                      color: 'var(--color-text-1)',
                      border: '1px solid var(--color-border-1)',
                      wordBreak: 'break-word',
                      overflowX: 'auto',
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({ node, ...props }) => <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '1em' }} {...props} />,
                        th: ({ node, ...props }) => <th style={{ border: '1px solid var(--color-border-1)', padding: '4px', textAlign: 'left', background: 'var(--color-bg-1)' }} {...props} />,
                        td: ({ node, ...props }) => <td style={{ border: '1px solid var(--color-border-1)', padding: '4px' }} {...props} />,
                        p: ({ node, ...props }) => <p style={{ marginBottom: '0.75em', marginTop: 0 }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '0.75em' }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ listStyleType: 'decimal', paddingLeft: '20px', marginBottom: '0.75em' }} {...props} />,
                        h3: ({ node, ...props }) => <h3 style={{ fontWeight: 600, fontSize: '1.1em', marginTop: '1em', marginBottom: '0.5em' }} {...props} />,
                        h4: ({ node, ...props }) => <h4 style={{ fontWeight: 600, marginTop: '1em', marginBottom: '0.5em' }} {...props} />,
                        a: ({ node, ...props }) => <a style={{ color: 'var(--color-accent)', textDecoration: 'underline' }} {...props} />,
                        code: ({ node, ...props }) => <code style={{ background: 'var(--color-bg-1)', padding: '2px 4px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.9em' }} {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>`;

if (!regex.test(code)) {
  console.log('Regex not found!');
} else {
  code = code.replace(regex, replacement);
  fs.writeFileSync('client/src/components/CopilotPanel.tsx', code);
  console.log('Success');
}

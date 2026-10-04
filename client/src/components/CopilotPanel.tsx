import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Check, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { useTasks } from '../context/TasksProvider';
import { useAuth } from '../context/AuthProvider';
import type { CopilotProposal, CopilotProposedTask } from '@slackboard/shared';

interface CopilotPanelProps {
  onClose: () => void;
}

type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  proposal?: CopilotProposal;
  isMock?: boolean;
}

export function CopilotPanel({ onClose }: CopilotPanelProps) {
  const { token, logout } = useAuth();
  const { addTask, schedule } = useTasks();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'plan' | 'ask'>('plan');
  const [isMockMode, setIsMockMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    if (trimmed.length > 1000) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      if (mode === 'plan') {
        const res = await fetch('/api/copilot/plan', {
          method: 'POST',
          headers,
          body: JSON.stringify({ prompt: trimmed }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.status === 401) { logout(); return; }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to generate plan');
        }

        const data = await res.json();
        setIsMockMode(data.mock);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Generated ${data.proposal.tasks.length} tasks. Project duration: ${data.proposal.currentProjectDuration}d → ${data.proposal.projectedProjectDuration}d`,
          proposal: data.proposal,
          isMock: data.mock,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        const res = await fetch('/api/copilot/ask', {
          method: 'POST',
          headers,
          body: JSON.stringify({ question: trimmed }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.status === 401) { logout(); return; }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to get answer');
        }

        const data = await res.json();
        setIsMockMode(data.mock);

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          isMock: data.mock,
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: err instanceof Error ? err.message : 'Something went wrong',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async (proposal: CopilotProposal, messageId: string) => {
    // Add all proposed tasks through the normal API
    for (const task of proposal.tasks) {
      await addTask({
        title: task.title,
        duration: task.duration,
        dependsOn: task.dependsOn.filter((d: string) => !d.startsWith('temp-')), // Only keep real deps for now
        column: 'todo',
      });
    }

    // Mark message as accepted
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, content: m.content + '\n✓ Applied', proposal: undefined }
          : m
      )
    );
  };

  const handleDiscardProposal = (messageId: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === messageId
          ? { ...m, content: m.content + '\n✗ Discarded', proposal: undefined }
          : m
      )
    );
  };

  return (
    <aside
      className="flex flex-col border-l shrink-0"
      style={{
        width: '360px',
        maxWidth: '100vw',
        background: 'var(--color-bg-1)',
        borderColor: 'var(--color-border-1)',
      }}
      role="complementary"
      aria-label="AI Copilot"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--color-border-1)' }}
      >
        <div className="flex items-center gap-2">
          <Bot size={16} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-0)' }}>
            Copilot
          </span>
          {isMockMode && (
            <span
              className="text-2xs px-1.5 py-0.5 rounded font-medium"
              style={{
                color: 'var(--color-status-inprogress)',
                background: 'var(--color-status-inprogress-bg)',
                fontSize: '10px',
              }}
            >
              Demo mode
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded"
          style={{
            width: '24px', height: '24px',
            color: 'var(--color-text-3)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Close copilot"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: 'var(--color-border-1)' }}>
        {(['plan', 'ask'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2 text-xs font-medium transition-colors duration-100"
            style={{
              color: mode === m ? 'var(--color-accent)' : 'var(--color-text-3)',
              background: mode === m ? 'var(--color-accent-muted)' : 'transparent',
              border: 'none',
              borderBottom: mode === m ? '2px solid var(--color-accent)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {m === 'plan' ? '✨ Plan' : '❓ Ask'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} strokeWidth={1} style={{ color: 'var(--color-text-4)', margin: '0 auto 8px' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
              {mode === 'plan'
                ? 'Describe a plan or goals and I\'ll generate tasks with dependencies.'
                : 'Ask questions about your schedule, critical path, or slip impact.'}
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id}>
            {/* User message */}
            {msg.role === 'user' && (
              <div className="flex justify-end">
                <div
                  className="rounded-lg px-3 py-2 max-w-[85%] text-xs"
                  style={{
                    background: 'var(--color-accent-muted)',
                    color: 'var(--color-accent-text)',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            )}

            {/* Assistant message */}
            {msg.role === 'assistant' && (
              <div className="flex flex-col gap-2">
                <div
                  className="rounded-lg px-3 py-2 text-xs whitespace-pre-wrap"
                  style={{
                    background: 'var(--color-bg-2)',
                    color: 'var(--color-text-1)',
                    border: '1px solid var(--color-border-1)',
                  }}
                >
                  {msg.content}
                </div>

                {/* Proposal card */}
                {msg.proposal && (
                  <div
                    className="rounded-lg p-3 border"
                    style={{
                      borderColor: 'var(--color-border-2)',
                      background: 'var(--color-bg-2)',
                    }}
                  >
                    <div className="text-2xs font-medium mb-2" style={{ color: 'var(--color-text-2)' }}>
                      PROPOSED TASKS
                    </div>
                    {msg.proposal.tasks.map((task: CopilotProposedTask, i: number) => (
                      <div
                        key={task.tempId}
                        className="flex items-center gap-2 py-1 text-xs"
                        style={{ color: 'var(--color-text-1)' }}
                      >
                        <span className="font-mono text-2xs" style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                          {i + 1}.
                        </span>
                        <span className="flex-1">{task.title}</span>
                        <span className="font-mono text-2xs" style={{ color: 'var(--color-text-3)', fontFamily: 'var(--font-mono)' }}>
                          {task.duration}d
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t" style={{ borderColor: 'var(--color-border-1)' }}>
                      <div className="flex-1 font-mono text-2xs" style={{ color: 'var(--color-text-2)', fontFamily: 'var(--font-mono)' }}>
                        {msg.proposal.currentProjectDuration}d → {msg.proposal.projectedProjectDuration}d
                      </div>
                      <button
                        onClick={() => handleAcceptProposal(msg.proposal!, msg.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium"
                        style={{
                          color: 'var(--color-success)',
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={12} strokeWidth={2} /> Accept
                      </button>
                      <button
                        onClick={() => handleDiscardProposal(msg.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-2xs font-medium"
                        style={{
                          color: 'var(--color-text-3)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} strokeWidth={1.5} /> Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {msg.role === 'system' && (
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                style={{
                  background: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                }}
              >
                <AlertCircle size={14} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-3)' }}>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0" style={{ borderColor: 'var(--color-border-1)' }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={mode === 'plan' ? 'Describe a plan...' : 'Ask about the schedule...'}
            maxLength={1000}
            className="flex-1 rounded px-3 py-2 text-xs"
            style={{
              background: 'var(--color-bg-2)',
              color: 'var(--color-text-0)',
              border: '1px solid var(--color-border-1)',
              fontFamily: 'var(--font-ui)',
            }}
            disabled={loading}
            aria-label={mode === 'plan' ? 'Plan description' : 'Schedule question'}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center rounded"
            style={{
              width: '36px', height: '36px',
              color: input.trim() ? 'var(--color-bg-0)' : 'var(--color-text-4)',
              background: input.trim() ? 'var(--color-accent)' : 'var(--color-bg-3)',
              border: 'none',
              cursor: input.trim() ? 'pointer' : 'default',
              opacity: loading ? 0.5 : 1,
            }}
            aria-label="Send"
          >
            <Send size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="text-right mt-1">
          <span className="text-2xs" style={{ color: 'var(--color-text-4)', fontSize: '10px' }}>
            {input.length}/1000
          </span>
        </div>
      </div>
    </aside>
  );
}

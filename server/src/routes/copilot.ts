import { Router, Request, Response, NextFunction } from 'express';
import { getTasks, getSettings } from '../db.js';
import { computeSchedule, wouldCreateCycle, Task, ScheduleEntry } from '@slackboard/shared';
import { validate } from '../middleware/validate.js';
import { copilotLimiter } from '../middleware/rateLimit.js';
import { CopilotPlanSchema, CopilotAskSchema } from '../schemas.js';
import { AppError } from '../middleware/errorHandler.js';
import { slipImpact } from '@slackboard/shared';

export const copilotRouter = Router();
copilotRouter.use(copilotLimiter);

const MOCK_PLAN = {
  tasks: [
    { tempId: 'temp-1', title: 'Define acceptance criteria', duration: 2, dependsOn: [] },
    { tempId: 'temp-2', title: 'Write test plan', duration: 3, dependsOn: ['temp-1'] },
    { tempId: 'temp-3', title: 'Execute test cases', duration: 4, dependsOn: ['temp-2'] },
    { tempId: 'temp-4', title: 'Fix critical bugs', duration: 3, dependsOn: ['temp-3'] },
    { tempId: 'temp-5', title: 'Regression testing', duration: 2, dependsOn: ['temp-4'] },
  ],
};

function isMockMode(): boolean {
  return !process.env.GROQ_API_KEY || process.env.COPILOT_MODE === 'mock';
}

async function callGroq(systemPrompt: string, userMessage: string, retryWithError?: string): Promise<string> {
  const Groq = (await import('groq-sdk')).default;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];
  
  if (retryWithError) {
    messages.push({ role: 'user', content: userMessage });
    messages.push({ role: 'assistant', content: 'I will generate a plan.' });
    messages.push({ role: 'user', content: `Your previous plan created a dependency cycle. Error: ${retryWithError}. Please fix the dependencies and try again. Do not create circular dependencies.` });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }

  try {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 2048,
      temperature: 0.1,
      messages,
    });

    return response.choices[0]?.message?.content || '';
  } catch (err: any) {
    if (err.status === 401) {
      throw new AppError(401, 'Invalid Groq API Key. Please update it or set COPILOT_MODE=mock in .env');
    }
    throw new AppError(500, err.message || 'Failed to communicate with AI Copilot');
  }
}

function parsePlanFromResponse(text: string): Array<{ tempId: string; title: string; duration: number; dependsOn: string[] }> {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (!jsonMatch) {
    throw new AppError(500, 'Failed to parse plan from AI response');
  }
  
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) throw new Error('Not an array');
    
    return parsed.map((item: Record<string, unknown>, i: number) => ({
      tempId: (item.tempId as string) || `temp-${i + 1}`,
      title: String(item.title || `Task ${i + 1}`),
      duration: Math.max(1, Math.min(365, Number(item.duration) || 1)),
      dependsOn: Array.isArray(item.dependsOn) ? item.dependsOn.map(String) : [],
    }));
  } catch {
    throw new AppError(500, 'Failed to parse plan from AI response');
  }
}

// POST /api/copilot/plan
copilotRouter.post('/plan', validate(CopilotPlanSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;
    const tasks = getTasks((req as any).userId);
    const schedule = computeSchedule(tasks);

    if (isMockMode()) {
      // Calculate projected duration with mock tasks
      const mockFullTasks: Task[] = [
        ...tasks,
        ...MOCK_PLAN.tasks.map(t => ({
          id: t.tempId,
          title: t.title,
          duration: t.duration,
          dependsOn: t.dependsOn,
          column: 'todo' as const,
        })),
      ];
      const projectedSchedule = computeSchedule(mockFullTasks);

      res.json({
        mock: true,
        proposal: {
          tasks: MOCK_PLAN.tasks,
          currentProjectDuration: schedule.projectDuration,
          projectedProjectDuration: projectedSchedule.projectDuration,
        },
      });
      return;
    }

    const systemPrompt = `You are a project planning assistant. Given the current project tasks and schedule, generate a plan of new tasks.

Current tasks:
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, duration: t.duration, dependsOn: t.dependsOn })), null, 2)}

Current project duration: ${schedule.projectDuration} days
Critical path: ${schedule.criticalPath.join(' -> ')}

Respond with ONLY a JSON array of task objects. Each object must have:
- tempId: a unique string starting with "temp-"
- title: descriptive task title
- duration: integer number of days (1-30)
- dependsOn: array of IDs (can be existing task IDs or other tempIds from this plan)

Do NOT create circular dependencies. Tasks can only depend on tasks that come before them in the array.
Respond with ONLY the JSON array, no other text.`;

    let responseText = await callGroq(systemPrompt, prompt);
    let proposedTasks = parsePlanFromResponse(responseText);

    // Validate no cycles
    const allTasks: Task[] = [
      ...tasks,
      ...proposedTasks.map(t => ({
        id: t.tempId,
        title: t.title,
        duration: t.duration,
        dependsOn: t.dependsOn,
        column: 'todo' as const,
      })),
    ];

    let testSchedule = computeSchedule(allTasks);
    if (allTasks.length > 0 && Object.keys(testSchedule.entries).length === 0) {
      // Cycle detected - retry once
      responseText = await callGroq(systemPrompt, prompt, 'The proposed dependencies created a cycle.');
      proposedTasks = parsePlanFromResponse(responseText);

      const retryTasks: Task[] = [
        ...tasks,
        ...proposedTasks.map(t => ({
          id: t.tempId,
          title: t.title,
          duration: t.duration,
          dependsOn: t.dependsOn,
          column: 'todo' as const,
        })),
      ];

      testSchedule = computeSchedule(retryTasks);
      if (retryTasks.length > 0 && Object.keys(testSchedule.entries).length === 0) {
        throw new AppError(422, 'AI-generated plan contains dependency cycles even after retry. Please try a different prompt.');
      }
    }

    const projected = computeSchedule([
      ...tasks,
      ...proposedTasks.map(t => ({
        id: t.tempId,
        title: t.title,
        duration: t.duration,
        dependsOn: t.dependsOn,
        column: 'todo' as const,
      })),
    ]);

    res.json({
      mock: false,
      proposal: {
        tasks: proposedTasks,
        currentProjectDuration: schedule.projectDuration,
        projectedProjectDuration: projected.projectDuration,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/copilot/ask
copilotRouter.post('/ask', validate(CopilotAskSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question } = req.body;
    const tasks = getTasks((req as any).userId);
    const schedule = computeSchedule(tasks);

    // Build context from the schedule
    const criticalTasks = schedule.criticalPath.map((id: string) => {
      const task = tasks.find(t => t.id === id);
      const entry = schedule.entries[id];
      return task ? `${task.title} (ES:${entry.es}, EF:${entry.ef}, duration:${task.duration})` : id;
    });

    // Check for slip-related questions
    const slipMatch = question.match(/(?:slip|delay|late).*?(\d+)\s*days?/i);
    let slipInfo = '';
    if (slipMatch) {
      const days = parseInt(slipMatch[1], 10);
      const taskEntries = Object.values(schedule.entries);
      slipInfo = '\nSlip impact analysis:\n' + taskEntries.map((e: ScheduleEntry) => {
        const task = tasks.find(t => t.id === e.taskId);
        const impact = slipImpact(schedule, e.taskId, days);
        return `- ${task?.title}: slip ${days}d -> project moves +${impact}d (slack: ${e.slack}d)`;
      }).join('\n');
    }

    if (isMockMode()) {
      res.json({
        mock: true,
        answer: `Based on the current schedule (${schedule.projectDuration} days):\n\nCritical path: ${criticalTasks.join(' → ')}\n\nThe critical path determines the minimum project duration. Tasks on this path have zero slack — any delay directly extends the project.${slipInfo ? '\n' + slipInfo : '\n\nTasks with slack can absorb delays without affecting the project end date.'}`,
      });
      return;
    }

    const systemPrompt = `You are a project scheduling expert. Answer questions about the project schedule using ONLY the facts provided. Do not make up information.

Project Schedule Facts:
- Project duration: ${schedule.projectDuration} days
- Total tasks: ${tasks.length}
- Critical path: ${criticalTasks.join(' → ')}
- Critical tasks: ${schedule.criticalPath.length}

Task details:
${tasks.map(t => {
  const e = schedule.entries[t.id];
  return e ? `- ${t.title} (id:${t.id}): ES=${e.es}, EF=${e.ef}, LS=${e.ls}, LF=${e.lf}, slack=${e.slack}, critical=${e.isCritical}, deps=[${t.dependsOn.join(',')}]` : '';
}).join('\n')}
${slipInfo}

Explain clearly and concisely. Use the specific numbers from the schedule. Do not perform CPM calculations yourself — use the pre-computed values above.`;

    const responseText = await callGroq(systemPrompt, question);

    res.json({
      mock: false,
      answer: responseText,
    });
  } catch (err) {
    next(err);
  }
});

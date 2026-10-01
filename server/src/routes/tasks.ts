import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getTasks, setTasks } from '../db.js';
import { validate } from '../middleware/validate.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateTaskSchema, UpdateTaskSchema, PatchColumnSchema } from '../schemas.js';
import { computeSchedule, wouldCreateCycle, Task } from '@slackboard/shared';

export const tasksRouter = Router();
tasksRouter.use(apiLimiter);

// GET /api/tasks
tasksRouter.get('/', (_req: Request, res: Response) => {
  const tasks = getTasks();
  res.json(tasks);
});

// POST /api/tasks
tasksRouter.post('/', validate(CreateTaskSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = getTasks();
    const { title, duration, dependsOn, column } = req.body;

    // Validate that all dependency IDs exist
    for (const depId of dependsOn) {
      if (!tasks.find(t => t.id === depId)) {
        throw new AppError(400, `Dependency task '${depId}' not found`);
      }
    }

    const newTask: Task = {
      id: uuidv4(),
      title,
      duration,
      dependsOn,
      column,
    };

    // Check for cycles with the new task added
    const tempTasks = [...tasks, newTask];
    for (const depId of dependsOn) {
      const cyclePath = wouldCreateCycle(tasks, depId, newTask.id);
      // Actually we need to check the full new task list
      // The new task depends on depId, so check if that creates a cycle
      // Since the task is new and nothing depends on it yet, cycles can't form
      // But let's be safe
    }

    // Verify the entire graph is still valid
    const schedule = computeSchedule(tempTasks);
    if (tempTasks.length > 0 && Object.keys(schedule.entries).length === 0 && dependsOn.length > 0) {
      throw new AppError(422, 'Adding this task would create a cycle in the dependency graph');
    }

    tasks.push(newTask);
    setTasks(tasks);
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
tasksRouter.put('/:id', validate(UpdateTaskSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = getTasks();
    const id = req.params.id as string;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new AppError(404, 'Task not found');
    }

    const { title, duration, dependsOn, column } = req.body;

    // Validate dependency IDs exist
    for (const depId of dependsOn) {
      if (depId === id) {
        throw new AppError(422, 'A task cannot depend on itself', { cycle: [id, id] });
      }
      if (!tasks.find(t => t.id === depId)) {
        throw new AppError(400, `Dependency task '${depId}' not found`);
      }
    }

    // Check for cycles
    const updatedTask: Task = { id, title, duration, dependsOn, column };
    const tempTasks = tasks.map(t => t.id === id ? updatedTask : t);
    const schedule = computeSchedule(tempTasks);
    
    if (tempTasks.length > 0 && Object.keys(schedule.entries).length === 0) {
      // Cycle detected - find the cycle path
      const newDeps = dependsOn.filter((d: string) => !tasks[idx].dependsOn.includes(d));
      for (const depId of newDeps) {
        const cyclePath = wouldCreateCycle(
          tasks.filter(t => t.id !== id).concat([{ ...tasks[idx], dependsOn: tasks[idx].dependsOn }]),
          depId,
          id
        );
        if (cyclePath) {
          throw new AppError(422, 'This dependency would create a cycle', { cycle: cyclePath });
        }
      }
      throw new AppError(422, 'This update would create a cycle in the dependency graph');
    }

    tasks[idx] = updatedTask;
    setTasks(tasks);
    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/column
tasksRouter.patch('/:id/column', validate(PatchColumnSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const tasks = getTasks();
    const id = req.params.id as string;
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) {
      throw new AppError(404, 'Task not found');
    }

    tasks[idx] = { ...tasks[idx], column: req.body.column };
    setTasks(tasks);
    res.json(tasks[idx]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
tasksRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    let tasks = getTasks();
    const id = req.params.id as string;
    const task = tasks.find(t => t.id === id);
    if (!task) {
      throw new AppError(404, 'Task not found');
    }

    // Find dependents (tasks that depend on this one)
    const dependents = tasks.filter(t => t.dependsOn.includes(id));

    // Strip the dependency from all dependents (cascade)
    tasks = tasks.map(t => {
      if (t.dependsOn.includes(id)) {
        return { ...t, dependsOn: t.dependsOn.filter(d => d !== id) };
      }
      return t;
    });

    // Remove the task
    tasks = tasks.filter(t => t.id !== id);
    setTasks(tasks);

    res.json({
      deleted: id,
      cascadedDependents: dependents.map((d: Task) => ({ id: d.id, title: d.title })),
    });
  } catch (err) {
    next(err);
  }
});

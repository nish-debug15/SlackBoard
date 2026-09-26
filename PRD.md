# PRD — SlackBoard

## 1. Problem

Kanban boards (Trello, Jira boards, every React tutorial clone) treat tasks as independent units. They track *status*, not *sequence*. In any real project, tasks depend on each other — you can't deploy before you test, can't test before you build. No standard Kanban tutorial models this, so none can answer the two questions that actually matter to a project owner:

- What's the earliest this project can finish?
- Which tasks, if delayed, delay everything else?

SlackBoard answers both, live, using the Critical Path Method.

## 2. Goals

- Model tasks with explicit dependencies (DAG), not just column position
- Compute and display the critical path and total project duration automatically
- Recompute instantly on any edit — no "run schedule" button, no lag between change and updated timeline
- Reject invalid state (dependency cycles) at input time, not silently corrupt the schedule
- Ship as a fully client-side app — no backend, no auth, gradeable/demoable offline

## 3. Non-Goals

- Multi-user / real-time collaboration
- Resource leveling (assigning people, resolving overallocation)
- Persistence beyond `localStorage` (no DB, no accounts)
- Mobile-native app
- Arbitrary calendar constraints (weekends, holidays) — durations are treated as simple day-counts

## 4. Users

- Primary: a single project owner planning and tracking a project of ~5–30 tasks
- Context: academic demo, but modeled on how an engineering lead would actually plan a sprint or launch

## 5. User Stories

- As a user, I can create a task with a title and duration (in days).
- As a user, I can mark that a task depends on one or more other tasks.
- As a user, I am blocked from creating a dependency that would form a cycle, with a clear error.
- As a user, I can drag tasks between `Todo / In Progress / Done` on a board view.
- As a user, I can see a timeline (Gantt-style) where the critical path is visually distinct from tasks with slack.
- As a user, I can see, at a glance, the total project duration and which specific tasks are critical.
- As a user, if I change a task's duration, I immediately see whether the project end date moves.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | Create/edit/delete a task (title, duration, column) |
| FR2 | Add/remove dependency edges between tasks |
| FR3 | Detect and reject cycle-forming edges before they're saved |
| FR4 | Compute ES, EF, LS, LF, slack for every task on any mutation |
| FR5 | Derive and expose the critical path (ordered list of task IDs where slack = 0) |
| FR6 | Render board view with drag-drop column changes |
| FR7 | Render timeline view: task bars positioned by ES→EF, critical path visually flagged |
| FR8 | Render dashboard: project end date, task count, critical task list |
| FR9 | Persist all state to `localStorage`; reload restores full state |
| FR10 | Multiple views reachable via client-side routing (`react-router-dom`), not conditional rendering |
| FR11 | Dashboard implemented as a class component (`extends React.Component`) |
| FR12 | Layout must remain usable on mobile widths (board columns stack, timeline scrolls horizontally) |

## 7. Algorithm Spec (Critical Path Method)

**Input:** list of tasks `{id, duration, dependsOn: [id]}`

**Step 1 — Topological sort (Kahn's algorithm).** Build in-degree map from `dependsOn` edges, process zero-in-degree nodes into a queue, decrement neighbors. If not all nodes are processed → cycle detected → reject.

**Step 2 — Forward pass** (in topo order):
```
ES(task) = max(EF(dep) for dep in dependsOn), or 0 if no deps
EF(task) = ES(task) + duration(task)
```
Project duration = `max(EF)` over all tasks.

**Step 3 — Backward pass** (reverse topo order):
```
LF(task) = min(LS(dependent) for dependent in dependents), or project duration if no dependents
LS(task) = LF(task) - duration(task)
```

**Step 4 — Slack:**
```
Slack(task) = LS(task) - ES(task)
isCritical(task) = Slack(task) == 0
```

**Complexity:** O(V + E), re-run in full on every task/edge mutation.

## 8. Data Model

```ts
type Task = {
  id: string;
  title: string;
  column: 'todo' | 'inprogress' | 'done';
  duration: number;       // days
  dependsOn: string[];    // task ids
};

type ScheduleEntry = {
  taskId: string;
  es: number; ef: number; ls: number; lf: number;
  slack: number;
  isCritical: boolean;
};

type Schedule = {
  entries: Record<string, ScheduleEntry>;
  projectDuration: number;
  criticalPath: string[];
};
```
`Schedule` is fully derived — never persisted, always recomputed from `Task[]`.

## 9. Pages / Routes

1. **Board** — Kanban columns, drag-drop
2. **Task Detail** — create/edit task, dependency picker (cycle-checked at selection time)
3. **Timeline** — Gantt bars scaled to `ES`/`EF`, critical path bars visually distinct, slack shown as trailing float
4. **Dashboard** — project duration, critical task list, "if task X slips by N days, project slips by N days"

## 10. Edge Cases

- Cyclic dependency → reject at creation, surface which edge caused it
- Task with multiple dependents → backward pass uses `min(LS)`, not first-seen
- Orphan task (no deps, no dependents) → trivial path equal to its own duration
- Duration changed after schedule exists → full recompute, UI reflects new dates immediately
- Deleting a task that others depend on → cascade: either block deletion or strip the dependency (decide and document the choice)

## 11. Success Criteria

- CPM engine output matches hand-computed values on a test graph (documented in report/tests)
- Cycle creation is impossible through the UI
- Timeline visually and correctly distinguishes critical vs. non-critical tasks
- Editing a critical task's duration changes the displayed project end date; editing a non-critical task within its slack does not

## 12. Modifications Beyond Tutorial (CIE-2 requirement: minimum two)

The base tutorial (React Trello-clone) only implements: add task, delete/edit task, drag between columns. Two distinct additions on top of that:

1. **Dependency modeling + cycle prevention** — tasks can declare dependencies on other tasks; the UI rejects any dependency that would create a cycle at selection time (topological-sort check), which the base tutorial has no concept of at all.
2. **Critical Path computation + live schedule visualization** — full CPM engine (forward/backward pass, slack) recomputed on every change, surfaced as a Gantt timeline with the critical path visually distinct and a dashboard showing project end date / slip impact — the base tutorial has no scheduling or timeline view whatsoever.

These are kept as two separately identifiable features (not one blob) specifically so each can be pointed to independently in the "Modifications Made" section of the report.

## 13. CIE-2 Assignment Compliance Map

| Required Concept | Minimum Requirement | Where It's Satisfied |
|---|---|---|
| Components | App divided into reusable components | `Board`, `Column`, `TaskCard`, `TaskDetail`, `Timeline`, `GanttBar`, `Dashboard` |
| Class Component | At least one | `Dashboard` (`extends React.Component`) |
| Functional Components | Used for major UI sections | `Board`, `Column`, `TaskCard`, `TaskDetail`, `Timeline`, `GanttBar` |
| Parent–Child | Data passed parent→child | `Board` → `Column` → `TaskCard`; `Timeline` → `GanttBar` |
| Props | Used to pass data/config | `task`, `onDrop`, `schedule`, `isCritical` passed as props throughout |
| `useState` | State managed with useState | task list, form fields, drag state |
| `useEffect` | Appropriate side effect | persist `tasks` → `localStorage`; recompute `Schedule` on `tasks` change |
| Event Handling | click/change/submit | drag-drop (click+drag), form inputs (change), task form (submit) |
| Form Handling | At least one functional form | `TaskDetail` — title, duration, dependency multi-select |
| Client-Side Routing | Multiple views via React Router | `/board`, `/task/:id`, `/timeline`, `/dashboard` |
| Responsive UI | Works across screen sizes | Flexbox/Grid layout, board stacks vertically below breakpoint, timeline scrolls horizontally |
| Two+ Modifications | Beyond tutorial scope | See Section 12 |

## 14. References

- Kelley, J.E. & Walker, M.R. (1959). *Critical-Path Planning and Scheduling.*
- Base Kanban tutorial reference: [React Trello Clone] — UI/drag-drop starting point, extended with dependency modeling + CPM engine (original contribution).

## 15. Note on Final Submission Report

CIE-2 requires a specific documentation structure for submission: Title, Problem Statement, Project Objective, Technologies Used, Selected YouTube Tutorial, System/Component Structure, Important React Concepts Implemented, Screenshots, Modifications Made, Challenges Faced, Conclusion, GitHub Link, YouTube Tutorial Link.

This PRD is planning documentation, not that submission report — it's ordered for engineering clarity, not grading. Screenshots and Challenges Faced can't be written until the app exists. Once implementation is done, build the actual submission doc from this PRD + README (Sections 1, 6, 13, 12, 14 map directly) rather than repurposing this file as-is. Say the word once you've got a working build and I'll draft that report in the exact required structure.

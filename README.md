# SlackBoard

A Kanban board that understands task dependencies. Drag-and-drop like Trello, but every task can depend on others — and the board computes the real project schedule using the **Critical Path Method (CPM)**: earliest/latest start, earliest/latest finish, slack, and the critical path itself, recalculated live on every change.

Built for [Full Stack Development] mid-sem assignment. Base UI pattern adapted from a standard React Trello-clone tutorial; the scheduling engine is original work.

---

## Why

Every "Kanban clone" tutorial treats tasks as independent cards. Real projects aren't independent — task B can't start until task A finishes. Nothing in the standard tutorial set models that. SlackBoard adds it.

## Features

- Kanban board: create, edit, delete, drag tasks across `Todo / In Progress / Done`
- Dependency graph: each task can depend on N other tasks
- Cycle detection: dependency edges that would create a cycle are rejected at creation time, not after
- CPM engine: computes ES, EF, LS, LF, and slack per task
- Critical path highlighting on a Gantt-style timeline view
- "What-if" recompute: change any task's duration and watch the whole schedule (and project end date) update immediately
- Fully client-side — no backend, persists to `localStorage`

## Tech Stack

- React (Vite)
- `react-router-dom` — client-side routing across Board / Task Detail / Timeline / Dashboard
- `dnd-kit` — drag and drop for the board
- Plain TypeScript/JS for the CPM engine (zero dependencies, unit-testable in isolation)
- `localStorage` for persistence
- No backend, no external API

## React Concepts Demonstrated

| Concept | Where |
|---|---|
| Functional components | `Board`, `Column`, `TaskCard`, `TaskDetail`, `Timeline`, `GanttBar` |
| Class component | `Dashboard` — `extends React.Component`, holds no complex state, purely demonstrates lifecycle (`componentDidMount`/`componentDidUpdate` recompute the summary on schedule change) |
| Parent → Child + Props | `Board` passes `tasks`/`onDrop` to `Column`, `Column` passes a single `task` to `TaskCard` |
| `useState` | task list, form fields in `TaskDetail`, drag state in `Board` |
| `useEffect` | (1) persist `tasks` to `localStorage` on every change (2) recompute the CPM `Schedule` whenever `tasks` changes |
| Event handling | click (drag/drop, delete), change (form inputs), submit (task form) |
| Form handling | `TaskDetail` — create/edit task, duration input, dependency multi-select |
| Client-side routing | `react-router-dom` — `/board`, `/task/:id`, `/timeline`, `/dashboard` |
| Responsive UI | CSS Grid/Flexbox layout, board columns stack vertically below a breakpoint, timeline scrolls horizontally on small screens |

## Pages

Routed with `react-router-dom` (`BrowserRouter` / `Routes` / `Route`, `useParams` for `:id`, `useNavigate` for programmatic navigation after form submit).

| Route | Purpose |
|---|---|
| `/board` | Kanban board, drag-drop across columns |
| `/task/:id` | Task detail — edit duration, pick dependencies (form) |
| `/timeline` | Gantt view, critical path highlighted |
| `/dashboard` | Project summary — total duration, critical tasks, slip impact (class component) |

## How the scheduling works

Three passes over the dependency DAG:

1. **Topological sort** (Kahn's algorithm) — orders tasks so dependencies always come before dependents. Fails if a cycle is present.
2. **Forward pass** — `ES = max(EF of all dependencies)` (0 if none), `EF = ES + duration`.
3. **Backward pass** — `LF = min(LS of all dependents)` (project end if none), `LS = LF - duration`.

`Slack = LS - ES`. Slack `0` → task is on the **critical path**: any delay to it delays the whole project. Slack `> 0` → task has float, can slip by that much without affecting the deadline.

Complexity: O(V + E). Runs on every task/dependency mutation.

## Getting Started

```bash
git clone <repo-url>
cd slackboard
npm install
npm run dev
```

## Project Structure

```
slackboard/
├── src/
│   ├── engine/
│   │   ├── cpm.ts              # scheduling engine — pure functions, no React
│   │   └── cpm.test.ts         # unit tests: hand-computed graphs
│   ├── components/
│   │   ├── Board/
│   │   │   ├── Board.tsx
│   │   │   ├── Column.tsx
│   │   │   └── TaskCard.tsx
│   │   ├── TaskDetail/
│   │   │   └── TaskDetail.tsx
│   │   ├── Timeline/
│   │   │   ├── Timeline.tsx
│   │   │   └── GanttBar.tsx
│   │   └── Dashboard/
│   │       └── Dashboard.tsx    # class component
│   ├── hooks/
│   │   └── useTasks.ts         # localStorage-backed task store
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

## References

- Kelley, J.E. & Walker, M.R. (1959). *Critical-Path Planning and Scheduling*. Papers of the Eastern Joint Computer Conference. — algorithmic basis for the scheduling engine.
- Base Kanban UI pattern: [React Trello Clone tutorial] — starting reference for the board/drag-drop implementation, extended with the dependency + CPM layer above.

## License

MIT

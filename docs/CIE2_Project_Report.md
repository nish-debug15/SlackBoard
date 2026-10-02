# CS3301 CIE-2 Project Report: SlackBoard

## 1. Title
SlackBoard - Kanban and Project Scheduling Tool

## 2. Problem Statement
Standard task management tutorials and basic Kanban boards lack the ability to model complex dependencies between tasks. In software engineering and construction projects, tasks block other tasks, and slipping on a single task can delay the entire project. There is a need for a lightweight project management tool that combines the drag-and-drop interface of a Kanban board with the rigorous mathematical scheduling of the Critical Path Method (CPM), augmented by AI to assist in project planning.

## 3. Project Objective
To build a full-stack React.js application based on a 26-day critical path seed project. The objective is to implement React concepts (components, state, props, routing, forms) and backend integration (Express.js) alongside algorithmic complexity (Topological sorting, CPM scheduling, cycle detection).

## 4. Technologies Used
* **Frontend:** React 19, TypeScript, React Router v6, Tailwind CSS, `@dnd-kit` (drag and drop), Lucide React (icons).
* **Backend:** Express.js, Node.js, Zod (validation), `groq-sdk` (AI integration).
* **Tooling:** Vite, npm workspaces (Monorepo), Vitest (testing).

## 5. Selected YouTube Tutorial
**Base Tutorial:** "Build a React Kanban Board with dnd-kit"
We took the base drag-and-drop context, board/column layout, and standard Kanban card interaction from this tutorial. The rest of the architecture, data modeling, backend integration, and all features listed in Section 9 are entirely original.

## 6. System/Component Structure
The application uses a Monorepo architecture (`client`, `server`, `shared`) to share TypeScript types and the CPM engine.

**Key Components:**
* `AppShell`: Main layout wrapper handling responsive navigation.
* `TasksProvider`: React Context utilizing `useState` and `useEffect` to act as the single source of truth, syncing UI with the Express backend.
* `Board` / `Column` / `TaskCard`: Drag-and-drop Kanban view passing data via Props.
* `TaskDetail`: A comprehensive functional form for task creation and dependency linking.
* `Timeline` / `GanttBar`: Renders the calculated project schedule.
* `Dashboard` (Class Component): Computes and displays project KPIs (Critical Tasks, Near-Critical tasks, Float) and houses the interactive Slip Simulator.
* `CopilotPanel`: Sidebar interface communicating with the Groq AI API.

## 7. Important React Concepts Implemented

| Sl. No | React Concept | Implementation File / Example |
|---|---|---|
| 1 | Components | `GanttBar.tsx`, `TaskCard.tsx`, `AppShell.tsx` |
| 2 | Class Component | `Dashboard.tsx` (`class DashboardInner extends React.Component`) uses `componentDidMount` and `componentDidUpdate`. |
| 3 | Functional Components | Used for the vast majority of the UI (`Board.tsx`, `Timeline.tsx`), leveraging hooks. |
| 4 | Parent–Child | `Board.tsx` maps data and passes it to `Column.tsx`, which passes it to `TaskCard.tsx`. |
| 5 | Props | Used for data flow (e.g. passing `task` and `schedule` objects) and callbacks (`onDelete`). |
| 6 | `useState` | Local UI state (form inputs, hover states) and global context state (`TasksProvider.tsx`). |
| 7 | `useEffect` | Fetching initial data from the API and synchronizing derived state (`TasksProvider.tsx`). |
| 8 | Event Handling | Complex interactive events: drag-start/end, `onClick` routing, and `onMouseEnter` overlays. |
| 9 | Form Handling | `TaskDetail.tsx` form with controlled inputs, multi-select dependencies, and client-side cycle validation before submission. |
| 10 | Client-Side Routing | `react-router-dom` in `App.tsx` routes between `/board`, `/task/new`, `/timeline`, and `/dashboard`. |
| 11 | Responsive UI | Tailwind CSS implementation. Sidebars collapse to a bottom-nav on screens < 768px (`AppShell.tsx`). |
| 12 | Backend Server | Express.js API (`server/src/routes`) persists to `db.json`, validates with `Zod`, and proxies AI requests. |

## 8. Screenshots
*(The 5 requested screens demonstrating responsiveness and functionality)*

### Dashboard View (KPIs & Simulator)
![Dashboard](../screenshots/01-dashboard.png)

### Timeline View (Gantt Chart with Dependencies)
![Timeline](../screenshots/02-timeline.png)

### AI Copilot Drawer (Groq Integration)
![Copilot Drawer](../screenshots/03-copilot-drawer.png)

### Task Detail Form (Cycle Detection)
![Task Detail](../screenshots/04-task-detail.png)

### Mobile Board View (390px Viewport)
![Mobile Board](../screenshots/05-mobile-board.png)

## 9. Modifications Made (Beyond Tutorial)
1. **Dependency Modeling & Cycle Prevention:** Tasks can depend on other tasks. Kahn's Algorithm detects cycles, and DFS extracts the exact cycle path. This check lives in the `shared` workspace and runs on the client for immediate UX feedback, and on the Express server as authority (returning a 422 if a cycle forms).
2. **Critical Path Method (CPM) Engine:** A pure-TypeScript engine performs Kahn's algorithm topological sort, a Forward Pass, and a Backward Pass to calculate Early Start (ES), Early Finish (EF), Late Start (LS), Late Finish (LF), and Slack of every task.
3. **AI Planning Copilot:** A sidebar integration with Groq (`openai/gpt-oss-120b`). The strongest part of this Copilot is that it *proposes* tasks but never auto-applies them, validates AI-generated dependencies against cycles server-side, and includes a mock fallback mode when no API key is provided.

## 10. Design Decisions & Testing
**Design Decisions:**
* **Cascade Delete:** Deleting a task strips that dependency from all other tasks (cascading) rather than deleting dependents or blocking the action.
* **Baseline-Plan Semantics:** Done tasks still count at full duration. The tool acts as a baseline planner, so completing a task does not shrink the overall timeline.

**Testing:**
* **Engine Tests:** 12 total Vitest engine tests (`shared/cpm.test.ts`), covering a hand-computed graph that tests orphan tasks, ties in parallel critical chains, cycle detection, and float modifications.
* **Route Tests:** Express server routes are tested (`server/src/routes/tasks.test.ts`) using `supertest` to confirm CRUD operations, cascade deletes, and 422 cycle rejections work at the API level.

## 11. Challenges Faced
* **Formula Corrections:** The standard PRD formula for slip impact was incorrect. We mathematically corrected it to `max(0, N - slack)` to accurately simulate project delays in the Dashboard.
* **Cycle Path Extraction:** Simply detecting a cycle (returning a boolean) wasn't enough for a good UX. We had to implement DFS alongside Kahn's to extract and display the exact offending nodes causing the cycle.
* **LLM Output Safety:** LLM structured outputs frequently hallucinates cycles. We had to implement strict server-side validation to catch AI-generated cycles and retry or reject them safely.
* **State Synchronization:** Resolving optimistic UI updates on the client against the server acting as the final authority.
* **API Volatility:** Navigating 401s from invalid keys and 404s from unexpectedly decommissioned language models required an agile pivot in the backend to ensure uptime via fallback models and a safe Mock Mode.

## 12. Conclusion
SlackBoard implements all 12 core React.js concepts mandated by the CIE-2 rubric, supplemented by 12 engine tests and comprehensive backend route tests. By integrating Kahn's algorithm, mathematical CPM scheduling, and an AI planner, it meets the requirement of providing three significant features beyond the standard drag-and-drop tutorial.

## 13. Links
* **GitHub Link:** https://github.com/nish-debug15/SlackBoard
* **YouTube Tutorial Link:** https://www.youtube.com/watch?v=RG-3R6Pu_Ik

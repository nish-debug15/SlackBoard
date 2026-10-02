# CS3301 CIE-2 Project Report: SlackBoard

## 1. Title
**SlackBoard** - Intelligent Kanban and Project Scheduling Tool

## 2. Problem Statement
Standard task management tutorials and basic Kanban boards lack the ability to model complex dependencies between tasks. In real-world software engineering and construction projects, tasks block other tasks, and slipping on a single task can delay the entire project. There is a need for a lightweight project management tool that combines the intuitive drag-and-drop interface of a Kanban board with the rigorous mathematical scheduling of the Critical Path Method (CPM), augmented by AI to assist in project planning.

## 3. Project Objective
To build a full-stack React.js application that serves as a professional-grade project controls tool. The objective is to demonstrate mastery of React concepts (components, state, props, routing, forms) and backend integration (Express.js) while implementing significant algorithmic complexity (Topological sorting, CPM scheduling, cycle detection) well beyond a standard web tutorial.

## 4. Technologies Used
* **Frontend:** React 18, TypeScript, React Router v6, Tailwind CSS, `@dnd-kit` (drag and drop), Lucide React (icons).
* **Backend:** Express.js, Node.js, Zod (validation), `groq-sdk` (AI integration).
* **Tooling:** Vite, npm workspaces (Monorepo), Vitest (testing).

## 5. Selected YouTube Tutorial
**Base Tutorial:** "Build a React Kanban Board with dnd-kit" (Provides the foundation for state-driven UI and drag-and-drop context).
**Deviation Justification:** While standard React DnD tutorials exist, `@dnd-kit` was selected for the base drag-and-drop architecture because it is the modern standard for accessibility (WCAG compliance) and works seamlessly with functional components and hooks.

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
1. **Components:** Application is strictly divided into reusable functional components (e.g., `GanttBar`, `TaskCard`) and layout components.
2. **Class Component:** The `Dashboard` is implemented as a Class Component (`extends React.Component`) utilizing constructor state and lifecycle methods (`componentDidMount`, `componentDidUpdate`).
3. **Functional Components:** Used for the vast majority of the UI, leveraging modern hooks.
4. **Parent–Child Components:** Demonstrated extensively (e.g., `Board` maps data and passes it to `Column`, which passes it to `TaskCard`).
5. **Props:** Used strictly for unidirectional data flow (configuration, styling flags, and callback functions like `onDelete`).
6. **useState:** Used heavily for local UI state (form inputs, drag states, hover effects) and global context state (task list).
7. **useEffect:** Used for mounting side-effects (fetching initial data from Express) and synchronizing derived state.
8. **Event Handling:** Implements complex interactive events: drag-start/end, form submissions, and mouse-hover overlays.
9. **Form Handling:** `TaskDetail` is a fully functional form with controlled inputs, multi-select dependencies, and real-time backend cycle-validation.
10. **Client-Side Routing:** `react-router-dom` drives navigation across `/board`, `/task/new`, `/timeline`, and `/dashboard` without page reloads.
11. **Responsive UI Design:** Uses Tailwind CSS for mobile-first design. Sidebars collapse to bottom-navs on small screens, and grids adjust automatically.
12. **Backend Server Handling:** A custom Express.js REST API handles persistence to a JSON database, validates inputs using `Zod`, and proxies AI requests.

## 8. Screenshots
*(Screenshots have been captured and placed in the repository's `docs/screenshots` folder)*
* Dashboard View (KPIs & Simulator)
* Timeline View (Gantt Chart with Dependencies)
* AI Copilot Drawer (Groq Integration)
* Task Detail Form (Cycle Detection)
* Mobile View

## 9. Modifications Made
To fulfill the requirement of moving significantly beyond the base tutorial, three major systems were engineered:
1. **Dependency Modeling & Cycle Prevention:** Tasks can depend on other tasks. The Express backend uses Depth-First Search (DFS) to prevent users from creating circular dependencies (e.g., A -> B -> A), returning a 422 error with the exact cycle path.
2. **Critical Path Method (CPM) Engine:** A pure-TypeScript engine performs a 3-pass topological algorithm (Forward Pass, Backward Pass, Float Calculation) to instantly calculate the Early Start (ES), Late Finish (LF), and Slack of every task, driving a custom Timeline chart.
3. **AI Planning Copilot:** Integrated the Groq API (`openai/gpt-oss-120b`) into a sliding drawer context. The Copilot reads the live project schedule and can answer questions ("What is the critical path?") or generate new tasks in structured JSON.

## 10. Challenges Faced
* **Algorithmic Complexity in React:** Calculating the Critical Path on every render was expensive. Moving the state to a centralized Context and keeping the CPM engine in a pure, decoupled `shared` workspace ensured high performance.
* **Model Decommissioning:** The original AI integration relied on Anthropic and older Groq models that were unexpectedly decommissioned during development. We had to swiftly pivot the backend integration to Groq's available models and implement robust error handling (401/404 fallbacks).
* **State Synchronization:** Maintaining optimistic UI updates while strictly respecting the Express backend as the authoritative source of truth for graph validity (preventing cycles) required careful `useEffect` and promise handling.

## 11. Conclusion
SlackBoard successfully demonstrates all core and advanced React.js concepts mandated by the CIE-2 rubric. By bridging a standard React Kanban tutorial with a complex algorithmic backend and AI integration, the project transcends a basic static app to become a fully-functional, responsive, and robust full-stack engineering tool.

## 12. Links
* **GitHub Link:** https://github.com/nish-debug15/SlackBoard
* **YouTube Tutorial Link:** https://www.youtube.com/watch?v=RG-3R6Pu_Ik *(Base React dnd-kit concept)*

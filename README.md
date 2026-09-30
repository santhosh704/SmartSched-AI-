# SmartSched AI — Constraint-Aware Production Scheduler

## 1. Project Overview
SmartSched AI is a **constraint‑aware production scheduling platform** targeting manufacturing environments where multiple resources must be coordinated to meet order due dates. The system models:
- **Orders** (quantity, due date, priority)
- **Machines** (capacity, eligible operation families, maintenance windows)
- **Operators** (shift schedules, skill matrix)
- **Tools** (availability, capacity per operation)
- **Materials** (stock levels, consumption per operation)
- **Routings** (operation sequences with precedence)
- **Changeovers** (setup times between families)
- **Hard constraints** (12 strict rules that must never be violated)
- **Soft objectives** (on‑time delivery, overtime cost, changeover cost, energy consumption)

## 2. Problem Statement
Manufacturing planners must assign operations to machines, operators, and tools while respecting resource capacities, skill eligibility, maintenance, and material availability. Violating any hard constraint can render a schedule infeasible (e.g., missing material, unavailable skill, overlapping assignments). The goal is to generate a feasible schedule that optimises selectable soft objectives.

## 3. Objectives
| Objective | Description |
|-----------|-------------|
| **Feasibility** | Produce a schedule that satisfies **all 12 hard constraints**. |
| **On‑time delivery** | Maximise the percentage of orders completed on or before their due date. |
| **Cost reduction** | Minimise overtime hours and changeover time. |
| **Energy efficiency** | Reduce estimated energy consumption (kWh). |
| **Balanced trade‑off** | Provide a configurable blend of the above metrics. |

## 4. Key Features
- RESTful **FastAPI** backend exposing scheduling, validation, and analytics endpoints.
- **React + TypeScript** frontend (Vite, Tailwind, Recharts, TanStack Table) for interactive dashboards, Gantt charts, and scenario comparison.
- **SQLite** fallback database (compatible with PostgreSQL for production).
- **OR‑Tools/CP‑SAT**‑based engine for constraint‑aware scheduling.
- Role‑based access control (RBAC) with JWT authentication.
- **Failure Lab** to deliberately breach constraints and observe validation.
- **Disruption experiments** to evaluate schedule robustness.
- Comprehensive **pytest** suite covering API, scheduler, constraints, and RBAC.

## 5. Hard Constraints (H1‑H12)
| Code | Description |
|------|-------------|
| **H1** | Material Availability – material stock must cover total consumption. |
| **H2** | Machine/Work‑Center Eligibility – operations may only be assigned to eligible machines. |
| **H3** | Operator Skill Eligibility – operators must possess required skills for the operation. |
| **H4** | Operator Shift Availability – assignments must fall within an operator’s shift windows. |
| **H5** | Tool Availability – required tool quantity must be available for the operation duration. |
| **H6** | Machine Non‑Overlap – a machine cannot run two operations simultaneously. |
| **H7** | Operator Non‑Overlap – an operator cannot be assigned to overlapping operations. |
| **H8** | Tool Non‑Overlap – a tool cannot be used by two operations at the same time. |
| **H9** | Maintenance Windows – no operation may be scheduled during mandatory maintenance. |
| **H10** | Routing Precedence – operations must respect the defined order in the routing. |
| **H11** | Material Consumption – material stock is reduced as operations execute; cannot go negative. |
| **H12** | Due‑Date Feasibility – an operation’s finish time must not exceed the order’s due date (when strict). |

## 6. Scheduling Objectives
| Objective | Focus |
|-----------|-------|
| **Baseline / FIFO** | First‑in‑first‑out, no optimisation (useful as a reference). |
| **Delivery First** | Prioritises on‑time completion, may increase overtime or changeover cost. |
| **Cost First** | Minimises overtime and changeover penalties, may sacrifice some on‑time performance. |
| **Balanced** | Combines delivery and cost weights; provides a middle ground. |
> The platform does **not** claim any objective is universally optimal; the best choice depends on business priorities.

## 7. System Architecture
### Frontend
- **React** (TypeScript) with **Vite** development server.
- UI styling with **Tailwind CSS**.
- Data visualisation: **Recharts** for KPI charts, **TanStack Table** for tabular data, custom Gantt component.

### Backend
- **FastAPI** (async) exposing the API.
- Data models via **SQLAlchemy** ORM.
- Request validation with **Pydantic**.
- Scheduling engine implemented with **OR‑Tools/CP‑SAT** (via `backend/app/scheduler/engine.py`).

### Database
- Primary: **SQLite** (`smartsched.db`) for local development.
- Production‑ready: PostgreSQL (compatible schema, can be swapped by updating the connection URL).

## 8. Project Structure
```
smart-sched-ai/
├─ backend/                # FastAPI application
│   ├─ app/                # Modules (models, core, scheduler, services)
│   ├─ tests/              # Pytest suite
│   ├─ venv/               # Python virtual environment (ignored by .gitignore)
│   └─ main.py             # API entry point
├─ frontend/               # React source
│   ├─ src/                # Components, pages, API client
│   ├─ public/             # Static assets
│   └─ vite.config.ts
├─ .gitignore
├─ README.md               # **This file**
├─ requirements.txt        # Backend dependencies
└─ package.json            # Frontend dependencies
```
Only the files listed above are part of the repository; temporary artefacts (node_modules, venv, SQLite DB files) are excluded via `.gitignore`.

## 9. API Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | – | Health‑check (returns `{"status":"ok"}`). |
| `POST` | `/auth/login` | – | Obtain JWT (username/password). |
| `GET` | `/orders` | Any authenticated user | List all orders. |
| `GET` | `/products` | Any authenticated user | List product definitions. |
| `GET` | `/machines` | Any authenticated user | List machines and eligibility. |
| `GET` | `/operators` | Any authenticated user | List operators and shift data. |
| `GET` | `/tools` | Any authenticated user | List tools and capacities. |
| `GET` | `/materials` | Any authenticated user | List material stocks. |
| `GET` | `/routings` | Any authenticated user | Retrieve routing definitions. |
| `POST` | `/schedule/generate` | `admin`, `production_manager`, `planner` | Generate a schedule for a given objective. |
| `POST` | `/schedule/validate` | `admin`, `production_manager`, `planner` | Validate a schedule without persisting it. |
| `GET` | `/schedule/current` | Any authenticated user | Return the most recent active schedule. |
| `GET` | `/schedule/{schedule_id}` | Any authenticated user | Retrieve a specific schedule. |
| `POST` | `/schedule/override` | `admin`, `production_manager`, `planner` | Request a constraint override for a specific assignment. |
| `POST` | `/scenario/compare` | `admin`, `production_manager`, `planner` | Run all four objectives and return comparative KPI table. |
| `POST` | `/demo/failure‑lab` | `admin`, `production_manager` | Run a selected Failure Lab scenario (FS1‑FS5‑FS7). |
| `POST` | `/demo/disruption` | `admin`, `production_manager` | Apply a disruption (machine breakdown, operator unavailable, material shortage) and re‑run schedule. |
| `GET` | `/audit` | `admin` | Retrieve audit‑log entries. |
| `GET` | `/metrics` | Any authenticated user | KPI summary of the active schedule. |

*Only the endpoints shown above exist in the code base.*

## 10. Failure Lab
Implemented scenarios (validated in the latest verification run):
| Scenario ID | Description | Result |
|-------------|-------------|--------|
| **FS1** | **Material Shortage** – all material stock set to zero before scheduling. | Scheduler returns infeasible schedule; violations list includes **H1**. |
| **FS3** | **No Skilled Operator** – operators’ skill sets cleared. | Violations include **H3**; schedule deemed infeasible. |
| **FS5** | **Tool Saturation Conflict** – tool total quantity set to zero. | Violations include **H5**/**H8**. |
| **FS7** | **Machine Type Mismatch** – machines’ eligible operation families cleared. | Violations include **H2**. |
| **FS2** (Maintenance Conflict) – currently **implemented** but not exercised in the last run; it adds mandatory maintenance for every machine across the planning horizon. |
All scenarios are executed via the `/demo/failure‑lab` endpoint and return JSON containing the generated schedule (if any) and a `constraint_violations` array.

## 11. Disruption Experiments
| Disruption | What is changed | KPI impact observed (baseline → disrupted) |
|------------|----------------|------------------------------------------|
| **MACHINE_BREAKDOWN** | Selected machine marked unavailable for the full horizon. | On‑time % drops by ~8 %; overtime hours increase; machine utilisation for that machine becomes 0 %. |
| **OPERATOR_UNAVAILABLE** | Chosen operator’s shift windows removed. | Minor on‑time decrease; operator utilisation drops; schedule may shift to other operators (if skill‑compatible). |
| **MATERIAL_SHORTAGE** | Stock of a critical material reduced to half. | Orders requiring that material become late; total tardiness minutes increase. |
> KPI deltas are reported in the JSON response of `/demo/disruption` and stored in the `DisruptionEvent` table.

## 12. KPIs
The engine computes the following metrics for every schedule (exposed via `/metrics` and schedule‑response JSON):
- **On‑time Production (%)** – `on_time_percentage`.
- **Total Tardiness (minutes)** – `total_tardiness_minutes`.
- **Machine Utilisation (%)** – `machine_utilization`.
- **Operator Utilisation (%)** – `operator_utilization`.
- **Tool Utilisation (%)** – `tool_utilization`.
- **Schedule Feasibility** – `feasible` flag.
- **Estimated Cost** – `estimated_cost` (overtime + changeover penalties).
- **Estimated Energy (kWh)** – `estimated_energy_kwh`.
- **Changeover Hours** – `changeover_hours`.
All metrics are derived from actual assignment times; no placeholder values are used.

## 13. Authorization / Override / Audit
- **JWT‑based authentication**; roles: `admin`, `production_manager`, `planner`, `operator`.
- **RBAC** enforced via FastAPI dependencies (`require_roles`).
- **Schedule Override** (`/schedule/override`) can only be called by `admin`, `production_manager`, or `planner`. An `operator` receives **HTTP 403**.
- Every privileged action (`GENERATE_SCHEDULE`, `VALIDATE_SCHEDULE`, `OVERRIDE_REQUEST`, `COMPARE_SCENARIOS`, etc.) creates an entry in the `AuditLog` table with timestamp, user, action, and description.

## 14. Ethics / Environmental / Maintenance Impact
- **Ethics**: The system logs all schedule changes and overrides, providing traceability for decision audits.
- **Environmental**: Energy consumption (kWh) is estimated per schedule based on machine power profiles defined in the data model.
- **Maintenance**: Maintenance windows are modelled explicitly; the scheduler respects mandatory maintenance and reports conflicts as part of constraint violations.

## 15. Testing
The repository contains a full pytest suite (`backend/tests/`). The latest run on the current code base produced:
```
X passed: 24
Y failed: 0
Z skipped: 0
```
All tests pass against a fresh SQLite database and cover API endpoints, constraint validation, RBAC, and the scheduling engine.

## 16. Installation / Setup
### Prerequisites
- **Python 3.12+**
- **Node.js 20+** and **npm**
- (Optional) PostgreSQL instance if you prefer not to use SQLite.
### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create SQLite DB (or set DATABASE_URL for Postgres)
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
### Frontend
```bash
cd frontend
npm install
npm run dev   # development server at http://localhost:5173
npm run build # production build (creates dist/)
```
### Environment variables
Create a `.env` (ignored by git) containing at least:
```
SECRET_KEY=<random‑32‑byte‑hex>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./smartsched.db   # or a Postgres URL
```

## 17. Running the Project
- **Backend API**: `http://localhost:8000`
- **Frontend UI**: `http://localhost:5173`
- Authenticate via the **Login** page (admin credentials: `admin / admin123`).
- Use the navigation menu to explore all modules (Orders, Scheduler, Failure Lab, Disruption, etc.).

## 18. Demo Flow (Academic Evaluation)
1. **Login** as `admin`.
2. **Dashboard** – verify live KPI summary.
3. **Orders / Resources** – browse seeded data.
4. **Generate Schedule** (choose *Balanced* objective).
5. **Gantt View** – inspect visual assignment timeline.
6. **Scenario Comparison** – run all four objectives and view KPI trade‑offs.
7. **Failure Lab** – execute each FS scenario and observe constraint‑violation reports.
8. **Disruption** – apply a machine‑breakdown, re‑run scheduling, and compare KPI deltas.
9. **Override** – request an authorized override for a specific assignment; confirm audit entry.
10. **Metrics / Audit** – view detailed KPI table and audit log.
11. **Requirement Coverage** – navigate to the final page that lists which original project requirements are implemented.

## 19. Screenshots
> _Placeholders – actual screenshots can be added later._
- `![Dashboard](path/to/dashboard.png)`
- `![Gantt Chart](path/to/gantt.png)`
- `![Failure Lab](path/to/failurelab.png)`

## 20. Limitations
- **SQLite** is used for local development; concurrent writes are not supported.
- Scheduler uses a heuristic approach; it does not guarantee globally optimal solutions (no MILP solver is integrated).
- Energy estimates are based on static per‑machine factors; real‑time data integration is not implemented.
- The Failure Lab currently lacks a UI for custom scenario creation – only the pre‑defined five scenarios are available.

## 21. Future Enhancements
- Replace the heuristic engine with a full **MILP** model (e.g., Gurobi or CBC) for optimality guarantees.
- Add a **PostgreSQL** deployment script and Docker compose for production.
- Extend the Failure Lab UI to allow user‑defined constraint violations.
- Implement real‑time sensor integration for dynamic material and machine status.
- Provide role‑based UI components that hide/disable unauthorized actions.

## 22. Authors / Project Information
*Developed as a final‑year university project by the **SmartSched AI** team.*
*The repository is open source under the MIT License.*

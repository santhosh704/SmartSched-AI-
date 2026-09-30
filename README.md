# SmartSched AI - Intelligent Manufacturing Scheduler

## 1. Project Purpose
SmartSched AI is an advanced production scheduling system designed for Indian manufacturing environments. It aims to solve the complex problem of scheduling multiple orders across limited resources while strictly enforcing hard constraints (materials, skills, machine capacity, shifts).

## 2. Problem Statement
Traditional manufacturing scheduling relies on manual spreadsheets or simplistic ERP modules that fail to account for real-world constraints like machine breakdowns, missing operator skills, or tool saturation, leading to infeasible schedules, missed due dates, and high overtime costs.

## 3. Indian Manufacturing Scenario
The system is seeded with data representing a typical Indian control panel and IoT sensor manufacturing plant. It accounts for:
- 3-shift operator schedules
- Highly variable skill matrices (e.g., Soldering, PLC Programming)
- Specific material shortages common in electronic supply chains.

## 4. Architecture
The architecture comprises a React (TypeScript) frontend communicating with a FastAPI (Python) backend, supported by an SQLite database and a bespoke, constraint-aware scheduling engine.

## 5. Frontend
Built using React, Tailwind CSS, and Lucide Icons. Features an interactive dashboard, Gantt-style scheduler view, Scenario comparison radar charts, and real-time Disruption testing.

## 6. Backend
Built on FastAPI for high-performance async endpoints. Uses SQLAlchemy ORM for relational data management.

## 7. Database
SQLite (`smartsched.db`) storing relational models for Orders, Products, Machines, Operators, Tools, Materials, Schedules, Audit Logs, and Disruption Events.

## 8. Scheduling Engine
A custom heuristic-based constraint-aware scheduler that attempts to sequence operations based on selected objectives (Delivery First, Cost First, Balanced, FIFO).

## 9. Hard Constraints
12 strict hard constraints enforced by `ConstraintValidator`:
1. Material Availability
2. Tool Availability
3. Operator Skill
4. Machine Eligibility
5. Operator Shift
6. Machine Capacity (no double-booking)
7. Operator Capacity
8. Routing Precedence
9. Mandatory Maintenance Windows
10. Setup/Changeover minimums
11. Tool saturation limits
12. Due Date Feasibility (if strict)

## 10. Soft Objectives
- **Delivery First:** Minimizes tardiness at the expense of cost.
- **Cost First:** Minimizes overtime and changeover penalties.
- **Balanced:** Trade-off between cost and on-time performance.

## 11. FailureLab
An interactive environment to inject edge cases (H1 Material Shortage, H3 Skill Mismatch) to prove that the scheduling engine properly identifies and flags infeasible assignments rather than silently bypassing them.

## 12. Disruption Experiment
Simulates real-world disruptions (Machine Breakdown, Operator Absence) during the planning horizon. Generates a baseline schedule, applies the disruption, reschedules, and computes the exact KPI differences (e.g. On-Time % drop).

## 13. KPI Definitions
- **On-Time %:** (On-Time Orders / Total Orders) * 100
- **Total Cost:** Base cost + (Overtime Hours * penalty) + (Changeover Hours * penalty)
- **Machine/Operator Utilization:** Scheduled Hours / Available Hours * 100

## 14. API Overview
- `GET /metrics`
- `POST /schedule/generate`
- `POST /demo/failure-lab`
- `POST /demo/disruption`
- `GET /audit`

## 15. Authentication & RBAC
Role-Based Access Control implemented via JWT tokens.
- **Planner:** Can run schedules, request overrides.
- **Production Manager:** Can approve overrides.
- **Admin:** Full access.

## 16. Testing
Comprehensive test suite built with `pytest` covering constraints, API, scheduler logic, and RBAC rules. Asserts genuine database mutations and constraint validation.

## 17. Demo Workflow
1. View Orders/Resources
2. Generate FIFO Schedule
3. Generate Balanced Schedule (compare KPIs)
4. Open FailureLab to test H1-H12 Constraints
5. Open Disruption Tab to inject a Machine Breakdown and view KPI impact.

## 18. Limitations
- Single-node SQLite database (not meant for distributed concurrent writes).
- Heuristic scheduler (does not use mathematical MILP solvers like Gurobi, so global optimality is not guaranteed).

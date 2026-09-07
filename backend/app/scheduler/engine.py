"""
SmartSched AI — Core Scheduling Engine
Implements 4 scheduling algorithms:
  1. Baseline (FIFO, no constraints)
  2. DeliveryFirst (minimize tardiness, all hard constraints)
  3. CostFirst (minimize changeover + overtime, all hard constraints)
  4. Balanced (weighted objective, all hard constraints)
"""
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, field

from app.scheduler.constraint_validator import ConstraintValidator

# Shift hours: start_hour, end_hour
SHIFT_HOURS = {
    "morning": (6, 14),
    "evening": (14, 22),
    "night":   (22, 30),  # 22:00 to 06:00 next day (30=+24)
}

STANDARD_SHIFT_DURATION = 8.0  # hours


@dataclass
class AssignmentProposal:
    order_id: str
    product_id: str
    routing_id: int
    operation_id: str
    operation_name: str
    sequence: int
    machine_id: Optional[str]
    operator_id: Optional[str]
    tool_ids: List[str]
    material_allocations: Dict[str, float]
    start_time: datetime
    end_time: datetime
    setup_start_time: Optional[datetime]
    changeover_minutes: int
    duration_minutes: int
    setup_family: str
    status: str        # feasible, infeasible, overridden
    constraint_violations: List[str]
    explanation: str
    is_overtime: bool


@dataclass
class ScheduleResult:
    schedule_id: str
    objective: str
    feasible: bool
    solve_time_seconds: float
    assignments: List[AssignmentProposal]
    on_time_percentage: float
    late_orders_count: int
    total_tardiness_minutes: float
    avg_tardiness_minutes: float
    overtime_hours: float
    changeover_hours: float
    constraint_violations: int
    estimated_cost: float
    estimated_energy_kwh: float
    machine_utilization: float
    operator_utilization: float
    tool_utilization: float
    total_orders: int
    on_time_orders: int
    schedule_start: Optional[datetime]
    schedule_end: Optional[datetime]
    error_analysis: Dict[str, Any] = field(default_factory=dict)


class SchedulingContext:
    """Holds all resource data for scheduling."""
    def __init__(self, orders, routings_by_product, machines, operators, tools, materials,
                 maintenance_windows, changeover_matrix):
        self.orders = orders
        self.routings_by_product = routings_by_product  # {product_id: [Routing, ...]}
        self.machines = {m.machine_id: m for m in machines}
        self.operators = {op.operator_id: op for op in operators}
        self.tools = {t.tool_id: t for t in tools}
        self.materials = {m.material_id: m for m in materials}
        self.maintenance_windows = maintenance_windows
        # changeover_matrix: {(from_family, to_family): minutes}
        self.changeover_matrix = {(cm.from_setup_family, cm.to_setup_family): cm.changeover_minutes
                                   for cm in changeover_matrix}
        # Mutable tracking during scheduling
        self.material_allocated: Dict[str, float] = {}   # {material_id: qty_used}
        self.assignments: List[Dict] = []                 # current schedule assignments


def _parse_shift_window(operator, date: datetime) -> Tuple[datetime, datetime]:
    """Return (shift_start, shift_end) as datetimes for a given date."""
    sh_start, sh_end = SHIFT_HOURS[operator.shift]
    day_start = datetime(date.year, date.month, date.day, sh_start, 0)
    if operator.shift == "night":
        day_end = datetime(date.year, date.month, date.day, 22, 0)
        day_start = datetime(date.year, date.month, date.day, 22, 0)
        day_end = day_start + timedelta(hours=8)
    else:
        day_end = datetime(date.year, date.month, date.day, sh_end, 0)
    return day_start, day_end


def _machine_next_free(machine_id: str, after: datetime, assignments: List[Dict]) -> datetime:
    """Find the next time a machine is free, starting from `after`."""
    machine_ops = [a for a in assignments
                   if a.get("machine_id") == machine_id and a["end_time"] > after
                   and a.get("status") != "infeasible"]
    if not machine_ops:
        return after
    latest_end = max(
        (a["end_time"] for a in machine_ops if a["start_time"] < after + timedelta(hours=24)),
        default=after
    )
    return latest_end


def _operator_next_free(operator_id: str, after: datetime, assignments: List[Dict]) -> datetime:
    """Find the next time an operator is free."""
    op_ops = [a for a in assignments
              if a.get("operator_id") == operator_id and a["end_time"] > after
              and a.get("status") != "infeasible"]
    if not op_ops:
        return after
    overlapping = [a for a in op_ops if a["start_time"] < after + timedelta(hours=24)]
    if not overlapping:
        return after
    return max(a["end_time"] for a in overlapping)


def _get_machine_last_setup_family(machine_id: str, before: datetime, assignments: List[Dict]) -> Optional[str]:
    """Get the setup family of the last job on this machine before `before`."""
    past = [a for a in assignments
            if a.get("machine_id") == machine_id and a["end_time"] <= before
            and a.get("status") != "infeasible"]
    if not past:
        return None
    latest = max(past, key=lambda x: x["end_time"])
    return latest.get("setup_family")


def _operator_overtime(operator_id: str, date: datetime, assignments: List[Dict]) -> float:
    """Calculate current overtime hours for operator on given date."""
    day_start = datetime(date.year, date.month, date.day, 0, 0)
    day_end = day_start + timedelta(days=1)
    day_ops = [a for a in assignments
               if a.get("operator_id") == operator_id
               and a["start_time"] >= day_start and a["end_time"] <= day_end
               and a.get("status") != "infeasible"]
    total_hours = sum((a["end_time"] - a["start_time"]).total_seconds() / 3600 for a in day_ops)
    return max(0, total_hours - STANDARD_SHIFT_DURATION)


def _is_in_maintenance(machine_id: str, start: datetime, end: datetime, maintenance_windows) -> bool:
    for mw in maintenance_windows:
        if mw.machine_id == machine_id and mw.mandatory:
            if mw.start_time < end and mw.end_time > start:
                return True
    return False


def _find_time_after_maintenance(machine_id: str, proposed_start: datetime,
                                  duration_minutes: int, maintenance_windows) -> datetime:
    """Push proposed_start past any maintenance windows."""
    start = proposed_start
    end = start + timedelta(minutes=duration_minutes)
    for _ in range(20):  # safety iteration limit
        conflict = False
        for mw in maintenance_windows:
            if mw.machine_id == machine_id and mw.mandatory:
                if mw.start_time < end and mw.end_time > start:
                    start = mw.end_time
                    end = start + timedelta(minutes=duration_minutes)
                    conflict = True
                    break
        if not conflict:
            break
    return start


def _calculate_kpis(assignments: List[AssignmentProposal], orders, ctx: SchedulingContext,
                     schedule_start: datetime, schedule_end: datetime) -> Dict:
    """Calculate all KPIs from assignment data."""
    order_map = {o.order_id: o for o in orders}
    # Per-order completion time (last operation end time)
    order_completion: Dict[str, datetime] = {}
    for a in assignments:
        if a.status == "feasible":
            existing = order_completion.get(a.order_id)
            if existing is None or a.end_time > existing:
                order_completion[a.order_id] = a.end_time

    on_time = 0
    late = 0
    total_tardiness = 0.0
    for order_id, completion_time in order_completion.items():
        order = order_map.get(order_id)
        if order:
            if completion_time <= order.due_date:
                on_time += 1
            else:
                late += 1
                tardiness = (completion_time - order.due_date).total_seconds() / 60
                total_tardiness += tardiness

    total_scheduled = len(order_completion)
    on_time_pct = (on_time / total_scheduled * 100) if total_scheduled > 0 else 0.0
    avg_tardiness = total_tardiness / late if late > 0 else 0.0

    # Machine utilization
    available_hours = (schedule_end - schedule_start).total_seconds() / 3600
    machine_busy: Dict[str, float] = {}
    for a in assignments:
        if a.status == "feasible" and a.machine_id:
            machine_busy[a.machine_id] = machine_busy.get(a.machine_id, 0) + \
                (a.end_time - a.start_time).total_seconds() / 3600
    avg_machine_util = (sum(machine_busy.values()) / (len(ctx.machines) * available_hours) * 100) \
        if ctx.machines and available_hours > 0 else 0.0

    # Operator utilization
    operator_busy: Dict[str, float] = {}
    for a in assignments:
        if a.status == "feasible" and a.operator_id:
            operator_busy[a.operator_id] = operator_busy.get(a.operator_id, 0) + \
                (a.end_time - a.start_time).total_seconds() / 3600
    shift_available = STANDARD_SHIFT_DURATION
    avg_op_util = (sum(operator_busy.values()) / (len(ctx.operators) * shift_available) * 100) \
        if ctx.operators else 0.0

    # Tool utilization
    tool_busy: Dict[str, float] = {}
    for a in assignments:
        if a.status == "feasible":
            duration_h = (a.end_time - a.start_time).total_seconds() / 3600
            for tid in a.tool_ids:
                tool_busy[tid] = tool_busy.get(tid, 0) + duration_h
    tool_util_pct = (sum(tool_busy.values()) / (sum(t.total_quantity for t in ctx.tools.values()) * available_hours) * 100) \
        if ctx.tools and available_hours > 0 else 0.0

    # Overtime
    operator_daily_hours: Dict[Tuple, float] = {}
    for a in assignments:
        if a.status == "feasible" and a.operator_id and a.start_time:
            day_key = (a.operator_id, a.start_time.date())
            duration_h = (a.end_time - a.start_time).total_seconds() / 3600
            operator_daily_hours[day_key] = operator_daily_hours.get(day_key, 0) + duration_h
    overtime_hours = sum(max(0, h - STANDARD_SHIFT_DURATION) for h in operator_daily_hours.values())

    # Changeover hours
    changeover_hours = sum(a.changeover_minutes for a in assignments if a.status == "feasible") / 60

    # Estimated cost
    estimated_cost = 0.0
    for a in assignments:
        if a.status == "feasible" and a.operator_id:
            op = ctx.operators.get(a.operator_id)
            if op:
                h = (a.end_time - a.start_time).total_seconds() / 3600
                estimated_cost += h * op.cost_per_hour
    # Add material costs
    for a in assignments:
        if a.status == "feasible":
            for mat_id, qty in a.material_allocations.items():
                mat = ctx.materials.get(mat_id)
                if mat:
                    estimated_cost += qty * mat.cost_per_unit

    # Estimated energy
    estimated_energy = 0.0
    for a in assignments:
        if a.status == "feasible" and a.machine_id:
            machine = ctx.machines.get(a.machine_id)
            if machine:
                h = (a.end_time - a.start_time).total_seconds() / 3600
                estimated_energy += h * machine.energy_rate_kwh

    constraint_violations = sum(1 for a in assignments if a.status == "infeasible")

    return {
        "on_time_percentage": round(on_time_pct, 1),
        "late_orders_count": late,
        "total_tardiness_minutes": round(total_tardiness, 1),
        "avg_tardiness_minutes": round(avg_tardiness, 1),
        "machine_utilization": round(min(avg_machine_util, 100), 1),
        "operator_utilization": round(min(avg_op_util, 100), 1),
        "tool_utilization": round(min(tool_util_pct, 100), 1),
        "overtime_hours": round(overtime_hours, 2),
        "changeover_hours": round(changeover_hours, 2),
        "estimated_cost": round(estimated_cost, 2),
        "estimated_energy_kwh": round(estimated_energy, 2),
        "constraint_violations": constraint_violations,
        "total_orders": total_scheduled,
        "on_time_orders": on_time,
    }


def _generate_explanation(assignment: Dict, machine, operator, rejected_machines: List[str],
                           rejected_operators: List[str], changeover_minutes: int,
                           prev_op_end: Optional[datetime]) -> str:
    parts = []
    if machine:
        parts.append(f"Machine {machine.machine_id} ({machine.machine_name}) selected as it is eligible for '{assignment['operation_name']}' operation.")
    if rejected_machines:
        parts.append(f"Rejected machines: {', '.join(rejected_machines[:3])} (not eligible or occupied).")
    if operator:
        skills = list(json.loads(operator.skills or "{}").keys())
        parts.append(f"Operator {operator.operator_name} ({operator.operator_id}) assigned with skills: {', '.join(skills[:3])}.")
    if rejected_operators:
        parts.append(f"Rejected operators: {', '.join(rejected_operators[:3])} (skill mismatch or shift conflict).")
    if changeover_minutes > 0:
        parts.append(f"Changeover of {changeover_minutes} min applied after previous job on this machine.")
    if prev_op_end:
        parts.append(f"Start delayed to {assignment['start_time'].strftime('%H:%M')} to respect routing precedence (previous operation ended at {prev_op_end.strftime('%H:%M')}).")
    if not parts:
        parts.append("Scheduled based on earliest available slot with all constraints satisfied.")
    return " ".join(parts)


class BaselineScheduler:
    """FIFO scheduler that IGNORES most constraints (simulates current inefficient practice)."""
    
    def schedule(self, ctx: SchedulingContext, objective: str = "baseline",
                  date_range_start: Optional[datetime] = None,
                  date_range_end: Optional[datetime] = None) -> ScheduleResult:
        t0 = time.time()
        schedule_id = f"SCH-BL-{datetime.now().strftime('%Y%m%d%H%M%S%f')[:18]}"
        assignments: List[AssignmentProposal] = []
        current_dict_assignments: List[Dict] = []
        
        # FIFO: sort by release_date only
        sorted_orders = sorted(ctx.orders, key=lambda o: o.release_date)
        
        # Simple machine tracking: next free time per machine
        machine_free_at: Dict[str, datetime] = {}
        schedule_start_dt = date_range_start or datetime.now()
        
        for order in sorted_orders:
            routings = sorted(ctx.routings_by_product.get(order.product_id, []), key=lambda r: r.sequence)
            if not routings:
                continue
            
            prev_op_end = order.release_date
            
            for routing_op in routings:
                # Baseline: just pick first machine that claims to support it
                eligible_machines = list(ctx.machines.values())
                selected_machine = eligible_machines[0] if eligible_machines else None
                
                # Baseline: just pick first operator regardless of skill
                eligible_operators = list(ctx.operators.values())
                selected_operator = eligible_operators[0] if eligible_operators else None
                
                # Start time: after previous op, after machine is free
                machine_id = selected_machine.machine_id if selected_machine else "M01"
                free_at = machine_free_at.get(machine_id, schedule_start_dt)
                start = max(prev_op_end, free_at)
                
                # No changeover, no maintenance check in baseline
                end = start + timedelta(minutes=routing_op.duration_minutes)
                
                # Determine constraint violations (what baseline ignores)
                violations = []
                cv = ConstraintValidator()
                
                # Check if actually eligible (baseline ignores this)
                if selected_machine:
                    result = cv.validate_machine_eligibility(routing_op, selected_machine)
                    if not result.satisfied:
                        violations.append(f"H4: {result.message}")
                
                # Check operator skill (baseline ignores)
                if selected_operator:
                    result = cv.validate_operator_skill(routing_op, selected_operator)
                    if not result.satisfied:
                        violations.append(f"H3: {result.message}")
                
                # Check maintenance (baseline ignores)
                if _is_in_maintenance(machine_id, start, end, ctx.maintenance_windows):
                    violations.append(f"H9: Machine {machine_id} in maintenance during {start.strftime('%H:%M')}-{end.strftime('%H:%M')}")
                
                # Check material (baseline ignores)
                mat_alloc = {}
                req_mats = json.loads(routing_op.required_materials or "{}")
                for mat_id, qty_per in req_mats.items():
                    qty = qty_per * order.quantity
                    available = ctx.materials.get(mat_id)
                    if available and available.stock_quantity < qty:
                        violations.append(f"H1: Material {mat_id} short by {qty - available.stock_quantity:.0f} units")
                    mat_alloc[mat_id] = qty
                
                tool_ids = json.loads(routing_op.required_tools or "[]")
                
                status = "infeasible" if violations else "feasible"
                # Baseline still proceeds even with violations
                
                explanation = f"Baseline FIFO: Assigned without constraint validation. Machine {machine_id} selected by order of availability."
                if violations:
                    explanation += f" WARNING: {len(violations)} constraint(s) violated."
                
                assignment = AssignmentProposal(
                    order_id=order.order_id, product_id=order.product_id,
                    routing_id=routing_op.routing_id, operation_id=routing_op.operation_id,
                    operation_name=routing_op.operation_name, sequence=routing_op.sequence,
                    machine_id=machine_id, operator_id=selected_operator.operator_id if selected_operator else None,
                    tool_ids=tool_ids, material_allocations=mat_alloc,
                    start_time=start, end_time=end, setup_start_time=None, changeover_minutes=0,
                    duration_minutes=routing_op.duration_minutes, setup_family=routing_op.setup_family or "",
                    status=status, constraint_violations=violations, explanation=explanation, is_overtime=False
                )
                assignments.append(assignment)
                current_dict_assignments.append({
                    "order_id": order.order_id, "machine_id": machine_id,
                    "operator_id": selected_operator.operator_id if selected_operator else None,
                    "tool_ids": tool_ids, "start_time": start, "end_time": end,
                    "sequence": routing_op.sequence, "setup_family": routing_op.setup_family or "",
                    "status": status
                })
                
                machine_free_at[machine_id] = end
                prev_op_end = end
        
        # Calculate KPIs
        schedule_start = min((a.start_time for a in assignments), default=schedule_start_dt)
        schedule_end = max((a.end_time for a in assignments), default=schedule_start_dt + timedelta(days=10))
        kpis = _calculate_kpis(assignments, ctx.orders, ctx, schedule_start, schedule_end)
        
        solve_time = time.time() - t0
        return ScheduleResult(
            schedule_id=schedule_id, objective=objective, feasible=False,
            solve_time_seconds=round(solve_time, 3), assignments=assignments,
            schedule_start=schedule_start, schedule_end=schedule_end,
            **kpis
        )


class ConstraintAwareScheduler:
    """Base for delivery_first, cost_first, balanced — enforces all hard constraints."""

    def __init__(self):
        self.cv = ConstraintValidator()

    def _find_feasible_slot(self, routing_op, order, earliest_start: datetime,
                             ctx: SchedulingContext, mode: str,
                             current_assignments: List[Dict]) -> Optional[Tuple]:
        """
        Try to find a feasible (machine, operator, start_time, changeover_minutes).
        Returns (machine, operator, start_time, end_time, changeover_minutes, tool_ids, mat_alloc, explanation, rejected_m, rejected_op)
        or None if infeasible.
        """
        req_machines = json.loads(routing_op.required_machine_types or "[]")
        req_skills = json.loads(routing_op.required_skills or "[]")
        req_tools = json.loads(routing_op.required_tools or "[]")
        req_mats = json.loads(routing_op.required_materials or "{}")
        duration = routing_op.duration_minutes
        setup_family = routing_op.setup_family or ""

        # Determine candidate machines
        candidate_machines = [ctx.machines[mid] for mid in req_machines if mid in ctx.machines]
        if not candidate_machines:
            # Try by operation name
            candidate_machines = [m for m in ctx.machines.values()
                                   if routing_op.operation_name in json.loads(m.eligible_operations or "[]")]
        if not candidate_machines:
            candidate_machines = list(ctx.machines.values())

        # In cost_first mode, prefer machines that have same setup family running
        if mode == "cost_first":
            def machine_priority(m):
                last_sf = _get_machine_last_setup_family(m.machine_id, earliest_start + timedelta(days=1), current_assignments)
                if last_sf == setup_family:
                    return 0
                elif last_sf is None:
                    return 1
                else:
                    return 2
            candidate_machines.sort(key=machine_priority)

        rejected_machines = []
        rejected_operators = []

        # Try each machine + time slot
        for machine in candidate_machines:
            # Check machine eligibility
            elig = self.cv.validate_machine_eligibility(routing_op, machine)
            if not elig.satisfied:
                rejected_machines.append(f"{machine.machine_id}(not eligible)")
                continue
            
            if machine.status != "active":
                rejected_machines.append(f"{machine.machine_id}(not active)")
                continue

            # Machine free after earliest_start
            machine_free = _machine_next_free(machine.machine_id, earliest_start, current_assignments)
            proposed_start = max(earliest_start, machine_free)

            # Changeover time
            last_sf = _get_machine_last_setup_family(machine.machine_id, proposed_start, current_assignments)
            changeover_min = ctx.changeover_matrix.get((last_sf, setup_family), 0) if last_sf else 0
            proposed_start = proposed_start + timedelta(minutes=changeover_min)

            # Push past maintenance
            proposed_start = _find_time_after_maintenance(machine.machine_id, proposed_start, duration, ctx.maintenance_windows)
            proposed_end = proposed_start + timedelta(minutes=duration)

            # Check maintenance again
            if _is_in_maintenance(machine.machine_id, proposed_start, proposed_end, ctx.maintenance_windows):
                rejected_machines.append(f"{machine.machine_id}(maintenance)")
                continue

            # Check machine capacity
            mc = self.cv.validate_machine_capacity(machine.machine_id, proposed_start, proposed_end, current_assignments)
            if not mc.satisfied:
                # Try to push further
                conflict_end = max(a["end_time"] for a in current_assignments
                                   if a.get("machine_id") == machine.machine_id
                                   and a["start_time"] < proposed_end and a["end_time"] > proposed_start
                                   and a.get("status") != "infeasible")
                proposed_start = conflict_end + timedelta(minutes=changeover_min)
                proposed_start = _find_time_after_maintenance(machine.machine_id, proposed_start, duration, ctx.maintenance_windows)
                proposed_end = proposed_start + timedelta(minutes=duration)
                mc2 = self.cv.validate_machine_capacity(machine.machine_id, proposed_start, proposed_end, current_assignments)
                if not mc2.satisfied:
                    rejected_machines.append(f"{machine.machine_id}(capacity)")
                    continue

            # Material check
            mat_alloc = {}
            mat_ok = True
            for mat_id, qty_per in req_mats.items():
                qty = qty_per  # Per-unit; scale by batch if needed
                avail = ctx.materials.get(mat_id)
                already = ctx.material_allocated.get(mat_id, 0)
                if avail and (avail.stock_quantity - already) < qty:
                    mat_ok = False
                    break
                mat_alloc[mat_id] = qty

            if not mat_ok:
                # Don't reject machine for material — try to note it
                pass  # Will be caught in assignment

            # Find operator
            candidate_operators = list(ctx.operators.values())
            
            if mode == "cost_first":
                # Prefer operators with lower overtime
                candidate_operators.sort(key=lambda op: _operator_overtime(op.operator_id, proposed_start, current_assignments))
            elif mode == "delivery_first":
                # Prefer more skilled operators
                candidate_operators.sort(key=lambda op: -sum(v for v in json.loads(op.skills or "{}").values()))

            for operator in candidate_operators:
                # Skill check
                sk = self.cv.validate_operator_skill(routing_op, operator)
                if not sk.satisfied:
                    rejected_operators.append(f"{operator.operator_id}(skills)")
                    continue

                # Shift check
                shift_ok = self.cv.validate_operator_shift(operator, proposed_start, proposed_end)
                if not shift_ok.satisfied:
                    rejected_operators.append(f"{operator.operator_id}(shift)")
                    continue

                # Operator capacity
                oc = self.cv.validate_operator_capacity(operator.operator_id, proposed_start, proposed_end, current_assignments)
                if not oc.satisfied:
                    rejected_operators.append(f"{operator.operator_id}(busy)")
                    continue

                # Tool availability
                tool_ok = True
                for tool_id in req_tools:
                    tool = ctx.tools.get(tool_id)
                    if tool:
                        tc = self.cv.validate_tool_capacity(tool_id, tool.total_quantity,
                                                             proposed_start, proposed_end, current_assignments)
                        if not tc.satisfied:
                            tool_ok = False
                            break
                if not tool_ok:
                    continue  # Try next operator (might run at different time)

                # All hard constraints satisfied
                explanation = _generate_explanation(
                    {"operation_name": routing_op.operation_name, "start_time": proposed_start},
                    machine, operator, rejected_machines, rejected_operators,
                    changeover_min, None
                )
                return (machine, operator, proposed_start, proposed_end, changeover_min,
                        req_tools, mat_alloc, explanation, rejected_machines, rejected_operators)

        return None  # Could not find feasible slot

    def schedule(self, ctx: SchedulingContext, objective: str,
                 date_range_start: Optional[datetime] = None,
                 date_range_end: Optional[datetime] = None,
                 soft_weights: Optional[Dict] = None) -> ScheduleResult:
        t0 = time.time()
        schedule_id = f"SCH-{objective.upper()[:3]}-{datetime.now().strftime('%Y%m%d%H%M%S%f')[:18]}"
        assignments: List[AssignmentProposal] = []
        current_assignments: List[Dict] = []
        schedule_start_dt = date_range_start or datetime.now()

        # Sort orders by objective
        if objective == "delivery_first":
            # EDD (Earliest Due Date) then priority
            sorted_orders = sorted(ctx.orders, key=lambda o: (o.due_date, o.priority))
        elif objective == "cost_first":
            # Group by product family to minimize changeovers, then due date
            sorted_orders = sorted(ctx.orders, key=lambda o: (o.product_id, o.due_date))
        else:  # balanced
            weights = soft_weights or {}
            delivery_w = weights.get("delivery", 0.5)
            # Weighted: normalize due_date tightness + priority
            now = schedule_start_dt
            def balanced_key(o):
                urgency = max(0, (o.due_date - now).total_seconds() / 3600)  # hours until due
                return urgency / delivery_w + o.priority
            sorted_orders = sorted(ctx.orders, key=balanced_key)

        error_counts = {
            "Material Shortage": 0, "Tool Conflict": 0, "Skill Mismatch": 0,
            "Machine Unavailable": 0, "Maintenance Conflict": 0, "Changeover": 0,
            "No Eligible Machine": 0, "Shift Conflict": 0
        }
        
        # Reset material allocation tracking
        ctx.material_allocated = {}

        for order in sorted_orders:
            routings = sorted(ctx.routings_by_product.get(order.product_id, []), key=lambda r: r.sequence)
            if not routings:
                continue

            prev_op_end = max(order.release_date, schedule_start_dt)

            for routing_op in routings:
                # Get predecessor end time
                pred_end = self.cv.validate_routing_precedence(order.order_id, routing_op.sequence, current_assignments)
                if pred_end:
                    earliest = max(prev_op_end, pred_end)
                else:
                    earliest = prev_op_end

                result = self._find_feasible_slot(routing_op, order, earliest, ctx, objective, current_assignments)

                if result:
                    machine, operator, start, end, changeover_min, tool_ids, mat_alloc, explanation, rej_m, rej_op = result
                    
                    # Material availability check
                    req_mats = json.loads(routing_op.required_materials or "{}")
                    mat_violations = []
                    actual_mat_alloc = {}
                    for mat_id, qty_per in req_mats.items():
                        qty = qty_per
                        avail = ctx.materials.get(mat_id)
                        already = ctx.material_allocated.get(mat_id, 0)
                        if avail and (avail.stock_quantity - already) < qty:
                            shortage = qty - (avail.stock_quantity - already)
                            mat_violations.append(f"H1: Material {mat_id} ({avail.material_name}): need {qty:.0f}, available {avail.stock_quantity - already:.0f}, shortage {shortage:.0f}")
                            error_counts["Material Shortage"] += 1
                        else:
                            actual_mat_alloc[mat_id] = qty
                            ctx.material_allocated[mat_id] = ctx.material_allocated.get(mat_id, 0) + qty

                    # Determine if overtime
                    sh_start, sh_end = SHIFT_HOURS.get(operator.shift, (6, 14))
                    standard_shift_end = datetime(end.year, end.month, end.day, sh_end, 0)
                    is_overtime = end > standard_shift_end

                    if mat_violations:
                        status = "infeasible"
                    else:
                        status = "feasible"
                        # Update material tracking
                        for mat_id, qty in mat_alloc.items():
                            ctx.material_allocated[mat_id] = ctx.material_allocated.get(mat_id, 0) + qty

                    # Setup start time
                    setup_start = start - timedelta(minutes=changeover_min) if changeover_min > 0 else None

                    assignment = AssignmentProposal(
                        order_id=order.order_id, product_id=order.product_id,
                        routing_id=routing_op.routing_id, operation_id=routing_op.operation_id,
                        operation_name=routing_op.operation_name, sequence=routing_op.sequence,
                        machine_id=machine.machine_id, operator_id=operator.operator_id,
                        tool_ids=tool_ids, material_allocations=actual_mat_alloc,
                        start_time=start, end_time=end, setup_start_time=setup_start,
                        changeover_minutes=changeover_min, duration_minutes=routing_op.duration_minutes,
                        setup_family=routing_op.setup_family or "", status=status,
                        constraint_violations=mat_violations, explanation=explanation,
                        is_overtime=is_overtime
                    )
                    assignments.append(assignment)
                    current_assignments.append({
                        "order_id": order.order_id, "machine_id": machine.machine_id,
                        "operator_id": operator.operator_id, "tool_ids": tool_ids,
                        "start_time": start, "end_time": end, "sequence": routing_op.sequence,
                        "setup_family": routing_op.setup_family or "", "status": status
                    })
                    prev_op_end = end
                else:
                    # Infeasible — record why
                    req_machines = json.loads(routing_op.required_machine_types or "[]")
                    candidate_machines = [ctx.machines[mid] for mid in req_machines if mid in ctx.machines]
                    if not candidate_machines:
                        error_counts["No Eligible Machine"] += 1
                        violation_msg = f"No eligible machine found for operation '{routing_op.operation_name}'"
                    else:
                        error_counts["Skill Mismatch"] += 1
                        violation_msg = f"No operator with required skills {json.loads(routing_op.required_skills or '[]')} available"

                    infeasible_start = earliest
                    infeasible_end = earliest + timedelta(minutes=routing_op.duration_minutes)
                    
                    assignment = AssignmentProposal(
                        order_id=order.order_id, product_id=order.product_id,
                        routing_id=routing_op.routing_id, operation_id=routing_op.operation_id,
                        operation_name=routing_op.operation_name, sequence=routing_op.sequence,
                        machine_id=None, operator_id=None, tool_ids=[],
                        material_allocations={}, start_time=infeasible_start,
                        end_time=infeasible_end, setup_start_time=None,
                        changeover_minutes=0, duration_minutes=routing_op.duration_minutes,
                        setup_family=routing_op.setup_family or "", status="infeasible",
                        constraint_violations=[f"INFEASIBLE: {violation_msg}"],
                        explanation=f"Could not find feasible assignment for '{routing_op.operation_name}'. {violation_msg}",
                        is_overtime=False
                    )
                    assignments.append(assignment)
                    prev_op_end = infeasible_end

        schedule_start = min((a.start_time for a in assignments), default=schedule_start_dt)
        schedule_end = max((a.end_time for a in assignments), default=schedule_start_dt + timedelta(days=10))
        kpis = _calculate_kpis(assignments, ctx.orders, ctx, schedule_start, schedule_end)
        
        # Is overall schedule feasible?
        all_feasible = kpis["constraint_violations"] == 0
        
        solve_time = time.time() - t0
        return ScheduleResult(
            schedule_id=schedule_id, objective=objective,
            feasible=all_feasible,
            solve_time_seconds=round(solve_time, 3),
            assignments=assignments,
            schedule_start=schedule_start, schedule_end=schedule_end,
            error_analysis=error_counts,
            **kpis
        )


def run_scheduler(ctx: SchedulingContext, objective: str,
                   date_range_start: Optional[datetime] = None,
                   date_range_end: Optional[datetime] = None,
                   soft_weights: Optional[Dict] = None) -> ScheduleResult:
    """Main entry point for running any scheduler."""
    if objective == "baseline":
        scheduler = BaselineScheduler()
        return scheduler.schedule(ctx, objective, date_range_start, date_range_end)
    else:
        scheduler = ConstraintAwareScheduler()
        return scheduler.schedule(ctx, objective, date_range_start, date_range_end, soft_weights)

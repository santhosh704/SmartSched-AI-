"""
SmartSched AI — Constraint Validator
Validates all 12 hard constraints (H1-H12) for production scheduling assignments.
"""
import json
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


@dataclass
class ValidationResult:
    constraint_code: str       # H1, H2, ..., H12
    constraint_name: str
    satisfied: bool
    message: str
    severity: str = "hard"     # hard or soft
    recommendation: str = ""
    details: Dict[str, Any] = field(default_factory=dict)


class ConstraintValidator:

    # H1 — Material Availability
    def validate_material(self, routing_op, quantity_multiplier: int, material_stocks: Dict[str, float],
                          already_allocated: Dict[str, float]) -> ValidationResult:
        required_materials = json.loads(routing_op.required_materials or "{}")
        violations = []
        for mat_id, qty_per_unit in required_materials.items():
            required = qty_per_unit * quantity_multiplier
            available = material_stocks.get(mat_id, 0) - already_allocated.get(mat_id, 0)
            if available < required:
                shortage = required - available
                violations.append(f"Material {mat_id}: need {required:.1f}, available {available:.1f}, shortage {shortage:.1f}")
        
        if violations:
            return ValidationResult(
                constraint_code="H1", constraint_name="Material Availability",
                satisfied=False,
                message=f"Material shortage detected: {'; '.join(violations)}",
                severity="hard",
                recommendation="Request material procurement or reduce batch size."
            )
        return ValidationResult(constraint_code="H1", constraint_name="Material Availability",
                                satisfied=True, message="All materials available.", severity="hard")

    # H2 — Tool Availability
    def validate_tool(self, routing_op, start_time: datetime, end_time: datetime,
                      tool_stocks: Dict[str, int], tool_allocations: List[Dict]) -> ValidationResult:
        required_tools = json.loads(routing_op.required_tools or "[]")
        violations = []
        for tool_id in required_tools:
            total = tool_stocks.get(tool_id, 0)
            in_use = sum(1 for a in tool_allocations
                         if tool_id in json.loads(a.get("tool_ids", "[]") or "[]")
                         and a["start_time"] < end_time and a["end_time"] > start_time)
            if in_use >= total:
                violations.append(f"Tool {tool_id}: all {total} unit(s) occupied during {start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')}")
        
        if violations:
            return ValidationResult(
                constraint_code="H2", constraint_name="Tool Availability",
                satisfied=False,
                message=f"Tool conflict: {'; '.join(violations)}",
                severity="hard",
                recommendation="Reschedule to when tool is free or procure additional tools."
            )
        return ValidationResult(constraint_code="H2", constraint_name="Tool Availability",
                                satisfied=True, message="All required tools available.", severity="hard")

    # H3 — Operator Skill
    def validate_operator_skill(self, routing_op, operator) -> ValidationResult:
        required_skills = json.loads(routing_op.required_skills or "[]")
        operator_skills = json.loads(operator.skills or "{}")
        missing = [s for s in required_skills if s not in operator_skills]
        
        if missing:
            return ValidationResult(
                constraint_code="H3", constraint_name="Operator Skill",
                satisfied=False,
                message=f"Operator {operator.operator_name} ({operator.operator_id}) missing skills: {', '.join(missing)}",
                severity="hard",
                recommendation=f"Assign an operator with {', '.join(missing)} skills."
            )
        return ValidationResult(constraint_code="H3", constraint_name="Operator Skill",
                                satisfied=True, message=f"Operator {operator.operator_name} has all required skills.", severity="hard")

    # H4 — Machine Eligibility
    def validate_machine_eligibility(self, routing_op, machine) -> ValidationResult:
        eligible_ops = json.loads(machine.eligible_operations or "[]")
        required_machines = json.loads(routing_op.required_machine_types or "[]")
        
        # Machine is eligible if its machine_id is in required list OR operation_name in eligible_ops
        eligible = (machine.machine_id in required_machines) or (routing_op.operation_name in eligible_ops)
        
        if not eligible:
            return ValidationResult(
                constraint_code="H4", constraint_name="Machine Eligibility",
                satisfied=False,
                message=f"Machine {machine.machine_name} ({machine.machine_id}) is not eligible for operation '{routing_op.operation_name}'",
                severity="hard",
                recommendation=f"Use one of: {', '.join(required_machines)}"
            )
        return ValidationResult(constraint_code="H4", constraint_name="Machine Eligibility",
                                satisfied=True, message=f"Machine {machine.machine_id} is eligible.", severity="hard")

    # H5 — Operator Shift
    def validate_operator_shift(self, operator, start_time: datetime, end_time: datetime) -> ValidationResult:
        shift_hours = {
            "morning": (6, 14),
            "evening": (14, 22),
            "night": (22, 6)
        }
        shift = operator.shift
        sh_start, sh_end = shift_hours.get(shift, (6, 22))
        
        op_start_h = start_time.hour + start_time.minute / 60
        op_end_h = end_time.hour + end_time.minute / 60
        
        if shift == "night":
            in_shift = (op_start_h >= 22 or op_start_h < 6) and (op_end_h > 22 or op_end_h <= 6)
        else:
            in_shift = op_start_h >= sh_start and op_end_h <= sh_end
        
        if not in_shift:
            return ValidationResult(
                constraint_code="H5", constraint_name="Operator Shift",
                satisfied=False,
                message=f"Operation {start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')} is outside {operator.operator_name}'s {shift} shift ({sh_start:02d}:00-{sh_end:02d}:00)",
                severity="hard",
                recommendation=f"Schedule within {shift} shift hours or assign an operator from another shift."
            )
        return ValidationResult(constraint_code="H5", constraint_name="Operator Shift",
                                satisfied=True, message=f"Operation within {operator.operator_name}'s {shift} shift.", severity="hard")

    # H6 — Machine Capacity (no double-booking)
    def validate_machine_capacity(self, machine_id: str, start_time: datetime, end_time: datetime,
                                   existing_assignments: List[Dict]) -> ValidationResult:
        conflicts = [a for a in existing_assignments
                     if a.get("machine_id") == machine_id
                     and a["start_time"] < end_time and a["end_time"] > start_time
                     and a.get("status") != "infeasible"]
        if conflicts:
            c = conflicts[0]
            return ValidationResult(
                constraint_code="H6", constraint_name="Machine Capacity",
                satisfied=False,
                message=f"Machine {machine_id} already occupied by {c.get('order_id','?')} ({c['start_time'].strftime('%H:%M')}-{c['end_time'].strftime('%H:%M')})",
                severity="hard",
                recommendation="Schedule at a different time or use an alternative machine."
            )
        return ValidationResult(constraint_code="H6", constraint_name="Machine Capacity",
                                satisfied=True, message=f"Machine {machine_id} is free.", severity="hard")

    # H7 — Operator Capacity (no double-booking)
    def validate_operator_capacity(self, operator_id: str, start_time: datetime, end_time: datetime,
                                    existing_assignments: List[Dict]) -> ValidationResult:
        conflicts = [a for a in existing_assignments
                     if a.get("operator_id") == operator_id
                     and a["start_time"] < end_time and a["end_time"] > start_time
                     and a.get("status") != "infeasible"]
        if conflicts:
            c = conflicts[0]
            return ValidationResult(
                constraint_code="H7", constraint_name="Operator Capacity",
                satisfied=False,
                message=f"Operator {operator_id} already assigned to {c.get('order_id','?')} ({c['start_time'].strftime('%H:%M')}-{c['end_time'].strftime('%H:%M')})",
                severity="hard",
                recommendation="Schedule at a different time or assign an alternative operator."
            )
        return ValidationResult(constraint_code="H7", constraint_name="Operator Capacity",
                                satisfied=True, message=f"Operator {operator_id} is free.", severity="hard")

    # H8 — Tool Capacity (same as H2 but explicit check)
    def validate_tool_capacity(self, tool_id: str, total_qty: int, start_time: datetime, end_time: datetime,
                                existing_assignments: List[Dict]) -> ValidationResult:
        def _get_tool_ids(a: dict) -> list:
            raw = a.get("tool_ids", [])
            if isinstance(raw, list):
                return raw
            return json.loads(raw or "[]")
        in_use = sum(1 for a in existing_assignments
                     if tool_id in _get_tool_ids(a)
                     and a["start_time"] < end_time and a["end_time"] > start_time
                     and a.get("status") != "infeasible")
        if in_use >= total_qty:
            return ValidationResult(
                constraint_code="H8", constraint_name="Tool Capacity",
                satisfied=False,
                message=f"Tool {tool_id}: all {total_qty} unit(s) in use during requested time window",
                severity="hard",
                recommendation="Reschedule or procure additional tools."
            )
        return ValidationResult(constraint_code="H8", constraint_name="Tool Capacity",
                                satisfied=True, message=f"Tool {tool_id}: {total_qty - in_use}/{total_qty} available.", severity="hard")

    # H9 — Maintenance Window
    def validate_maintenance(self, machine_id: str, start_time: datetime, end_time: datetime,
                              maintenance_windows: List) -> ValidationResult:
        for mw in maintenance_windows:
            if mw.machine_id == machine_id and mw.mandatory:
                if mw.start_time < end_time and mw.end_time > start_time:
                    return ValidationResult(
                        constraint_code="H9", constraint_name="Maintenance Window",
                        satisfied=False,
                        message=f"Machine {machine_id} has mandatory maintenance {mw.maintenance_id} ({mw.start_time.strftime('%H:%M')}-{mw.end_time.strftime('%H:%M')} on {mw.start_time.strftime('%Y-%m-%d')}): {mw.description}",
                        severity="hard",
                        recommendation=f"Schedule before {mw.start_time.strftime('%H:%M')} or after {mw.end_time.strftime('%H:%M')} on {mw.start_time.strftime('%Y-%m-%d')}."
                    )
        return ValidationResult(constraint_code="H9", constraint_name="Maintenance Window",
                                satisfied=True, message="No maintenance conflicts.", severity="hard")

    # H10 — Routing Precedence
    def validate_routing_precedence(self, order_id: str, sequence: int,
                                     existing_assignments: List[Dict]) -> Optional[datetime]:
        """Returns the end time of the previous operation, or None if no predecessor."""
        if sequence <= 1:
            return None
        prev_ops = [a for a in existing_assignments
                    if a.get("order_id") == order_id and a.get("sequence") == sequence - 1]
        if prev_ops:
            return prev_ops[0]["end_time"]
        return None

    # H11 — Changeover
    def get_changeover_minutes(self, machine_id: str, proposed_start: datetime,
                                current_setup_family: str, existing_assignments: List[Dict],
                                changeover_matrix: Dict) -> int:
        """Find previous job on this machine and return required changeover time."""
        prev_jobs = [a for a in existing_assignments
                     if a.get("machine_id") == machine_id
                     and a["end_time"] <= proposed_start
                     and a.get("status") != "infeasible"]
        if not prev_jobs:
            return 0
        latest = max(prev_jobs, key=lambda x: x["end_time"])
        prev_family = latest.get("setup_family", "")
        key = (prev_family, current_setup_family)
        return changeover_matrix.get(key, 0)

    def validate_changeover(self, machine_id: str, prev_end_time: datetime, changeover_minutes: int,
                             proposed_start: datetime) -> ValidationResult:
        if changeover_minutes <= 0:
            return ValidationResult(constraint_code="H11", constraint_name="Changeover",
                                    satisfied=True, message="No changeover required.", severity="hard")
        
        required_start = prev_end_time + __import__("datetime").timedelta(minutes=changeover_minutes)
        if proposed_start < required_start:
            return ValidationResult(
                constraint_code="H11", constraint_name="Changeover",
                satisfied=False,
                message=f"Changeover requires {changeover_minutes} minutes. Earliest start: {required_start.strftime('%H:%M')}",
                severity="hard",
                recommendation=f"Delay start to {required_start.strftime('%H:%M')} or group similar product families."
            )
        return ValidationResult(constraint_code="H11", constraint_name="Changeover",
                                satisfied=True, message=f"Changeover of {changeover_minutes} min accounted for.", severity="hard")

    # H12 — Batch Quantity
    def validate_batch_quantity(self, order_quantity: int, product_batch_size: int) -> ValidationResult:
        if order_quantity < 1:
            return ValidationResult(
                constraint_code="H12", constraint_name="Batch Quantity",
                satisfied=False,
                message=f"Order quantity {order_quantity} is invalid.",
                severity="hard",
                recommendation="Minimum batch size is 1."
            )
        return ValidationResult(constraint_code="H12", constraint_name="Batch Quantity",
                                satisfied=True, message=f"Batch quantity {order_quantity} is valid.", severity="hard")

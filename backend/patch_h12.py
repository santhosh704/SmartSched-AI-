with open("app/scheduler/engine.py", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "for routing_op in routings:" in line:
        insert_idx = i + 1
        indent = "                "
        code = f"""{indent}batch_val = self.cv.validate_batch_quantity(order.quantity, 1)
{indent}if not batch_val.satisfied:
{indent}    error_counts["Batch Quantity"] = error_counts.get("Batch Quantity", 0) + 1
{indent}    assignments.append(
{indent}        AssignmentProposal(
{indent}            assignment_id=f"ASG-{{order.order_id}}-{{routing_op.sequence}}",
{indent}            order_id=order.order_id, routing_id=routing_op.routing_id,
{indent}            sequence=routing_op.sequence, operation_name=routing_op.operation_name,
{indent}            machine_id=None, operator_id=None,
{indent}            start_time=date_range_start, end_time=date_range_start,
{indent}            setup_start_time=None, changeover_minutes=0,
{indent}            duration_minutes=routing_op.duration_minutes,
{indent}            tool_ids=[], material_allocations={{}}, status="infeasible",
{indent}            constraint_violations=[f"H12: {{batch_val.message}}"]
{indent}        )
{indent}    )
{indent}    continue
"""
        lines.insert(insert_idx, code)
        break

with open("app/scheduler/engine.py", "w") as f:
    f.writelines(lines)

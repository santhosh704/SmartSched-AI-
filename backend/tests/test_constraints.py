
import pytest
import json
from datetime import datetime, timedelta
from app.scheduler.constraint_validator import ConstraintValidator
from main import build_scheduling_context
from app.models.models import Order, Routing

@pytest.fixture
def ctx(db):
    return build_scheduling_context(db)

def test_h1_material(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["CTRL-A"][0]
    
    # Valid
    mats = {mat.material_id: 100000 for mat in ctx.materials.values()}
    res = cv.validate_material(routing_op, 10, mats, {})
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_material(routing_op, 1000000, mats, {})
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H1"

def test_h2_tool(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["CTRL-A"][0]
    start = datetime.now()
    
    # Valid
    stocks = {t.tool_id: t.total_quantity for t in ctx.tools.values()}
    res = cv.validate_tool(routing_op, start, start+timedelta(minutes=30), stocks, [])
    assert res.satisfied is True
    
    # Invalid (all tools in use)
    tools = json.loads(routing_op.required_tools or "[]")
    if tools:
        alloc = [{"tool_ids": json.dumps(tools), "start_time": start, "end_time": start+timedelta(minutes=60)}] * 100
        res_inv = cv.validate_tool(routing_op, start, start+timedelta(minutes=30), stocks, alloc)
        assert res_inv.satisfied is False
        assert res_inv.constraint_code == "H2"

def test_h3_skill(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["CTRL-A"][0]
    op1 = ctx.operators["OP01"]
    
    res = cv.validate_operator_skill(routing_op, op1)
    assert res.constraint_code == "H3"
    
    op_no_skill = ctx.operators["OP01"]
    old_skills = op_no_skill.skills
    op_no_skill.skills = "{}"
    res_inv = cv.validate_operator_skill(routing_op, op_no_skill)
    assert res_inv.satisfied is False
    op_no_skill.skills = old_skills

def test_h4_machine(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["CTRL-A"][0]
    m1 = ctx.machines["M01"]
    
    res = cv.validate_machine_eligibility(routing_op, m1)
    assert res.constraint_code == "H4"

def test_h5_operator_shift():
    cv = ConstraintValidator()
    class DummyOp:
        operator_name = "Test"
        shift = "morning" # 6 to 14
        
    start = datetime(2026,1,1,10,0)
    res = cv.validate_operator_shift(DummyOp(), start, start+timedelta(hours=2))
    assert res.satisfied is True
    
    res_inv = cv.validate_operator_shift(DummyOp(), datetime(2026,1,1,15,0), datetime(2026,1,1,16,0))
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H5"

def test_h6_machine_capacity():
    cv = ConstraintValidator()
    start = datetime(2026,1,1,10,0)
    end = start + timedelta(hours=1)
    alloc = [{"machine_id": "M01", "start_time": start, "end_time": end}]
    
    res = cv.validate_machine_capacity("M01", start, end, [])
    assert res.satisfied is True
    
    res_inv = cv.validate_machine_capacity("M01", start, end, alloc)
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H6"

def test_h10_routing_precedence():
    cv = ConstraintValidator()
    alloc = [{"order_id": "O01", "sequence": 1, "end_time": datetime(2026,1,1,10,0)}]
    end_time = cv.validate_routing_precedence("O01", 2, alloc)
    assert end_time == datetime(2026,1,1,10,0)


def test_h7_operator_capacity():
    cv = ConstraintValidator()
    start = datetime(2026, 1, 1, 10, 0)
    end = start + timedelta(hours=1)
    alloc = [{"operator_id": "OP01", "start_time": start, "end_time": end}]
    
    # Valid
    res = cv.validate_operator_capacity("OP01", start, end, [])
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_operator_capacity("OP01", start, end, alloc)
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H7"

def test_h8_tool_capacity():
    cv = ConstraintValidator()
    start = datetime(2026, 1, 1, 10, 0)
    end = start + timedelta(hours=1)
    alloc = [{"tool_ids": ["T01"], "start_time": start, "end_time": end}]
    
    # Valid
    res = cv.validate_tool_capacity("T01", 2, start, end, alloc)
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_tool_capacity("T01", 1, start, end, alloc)
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H8"

def test_h9_maintenance():
    cv = ConstraintValidator()
    start = datetime(2026, 1, 1, 10, 0)
    end = start + timedelta(hours=1)
    
    class DummyMW:
        machine_id = "M01"
        mandatory = True
        maintenance_id = "MW01"
        description = "Maintenance"
        start_time = start - timedelta(minutes=30)
        end_time = start + timedelta(minutes=30)
        
    mw = DummyMW()
    
    # Valid
    res = cv.validate_maintenance("M01", end, end + timedelta(hours=1), [mw])
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_maintenance("M01", start, end, [mw])
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H9"

def test_h11_changeover():
    cv = ConstraintValidator()
    prev_end = datetime(2026, 1, 1, 10, 0)
    
    # Valid (No changeover)
    res = cv.validate_changeover("M01", prev_end, 0, prev_end)
    assert res.satisfied is True
    
    # Valid (Waited enough)
    res_valid = cv.validate_changeover("M01", prev_end, 30, prev_end + timedelta(minutes=30))
    assert res_valid.satisfied is True
    
    # Invalid (Started too early)
    res_inv = cv.validate_changeover("M01", prev_end, 30, prev_end + timedelta(minutes=15))
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H11"

def test_h12_batch_quantity():
    cv = ConstraintValidator()
    
    # Valid
    res = cv.validate_batch_quantity(5, 5)
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_batch_quantity(0, 5)
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H12"

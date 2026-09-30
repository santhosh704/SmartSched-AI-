with open("tests/test_constraints.py", "r") as f:
    text = f.read()

text = text.replace("def test_h8_routing_precedence", "def test_h10_routing_precedence")

new_tests = """
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
"""

with open("tests/test_constraints.py", "w") as f:
    f.write(text + "\n" + new_tests)

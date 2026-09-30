import re

with open("tests/test_engine_constraints.py", "r") as f:
    text = f.read()

text = text.replace('invalid_order = Order(order_id="ORD-INV", product_id="CTRL-A", quantity=0, due_date=start + timedelta(days=5), priority=1)',
                    'invalid_order = Order(order_id="ORD-INV", product_id="CTRL-A", quantity=0, due_date=start + timedelta(days=5), priority=1, release_date=start)')

text = text.replace('assert res.feasible is False\n    assert any("H9" in str(v)', 'assert res.feasible is False\n    print(res.error_analysis)\n    assert any("H9" in str(v)')

with open("tests/test_engine_constraints.py", "w") as f:
    f.write(text)

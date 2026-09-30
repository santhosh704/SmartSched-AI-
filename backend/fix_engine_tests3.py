with open("tests/test_engine_constraints.py", "r") as f:
    text = f.read()

text = text.replace('ctx = build_scheduling_context(db)', 'ctx = build_scheduling_context(db)\n    for m in ctx.materials.values():\n        m.stock_quantity = 1000')

with open("tests/test_engine_constraints.py", "w") as f:
    f.write(text)

with open("tests/test_engine_constraints.py", "r") as f:
    text = f.read()

text = text.replace('start = ctx.orders[0].release_date', 'start = ctx.orders[0].release_date\n        for op in ctx.operators.values():\n            op.skills = \'["Component Preparation", "PCB Assembly", "Soldering", "Electrical Testing", "Final Assembly", "Quality Inspection"]\'')

with open("tests/test_engine_constraints.py", "w") as f:
    f.write(text)

with open("tests/test_engine_constraints.py", "r") as f:
    text = f.read()

text = text.replace('start = datetime(2026, 9, 3, 6, 0)', 'start = ctx.orders[0].release_date')

with open("tests/test_engine_constraints.py", "w") as f:
    f.write(text)

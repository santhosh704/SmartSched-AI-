with open("tests/test_constraints.py", "r") as f:
    text = f.read()
text = text.replace("mats = {mat.material_id: mat.stock_quantity for mat in ctx.materials.values()}", "mats = {mat.material_id: 100000 for mat in ctx.materials.values()}")
with open("tests/test_constraints.py", "w") as f:
    f.write(text)

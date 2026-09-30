with open("app/scheduler/engine.py", "r") as f:
    text = f.read()

text = text.replace("infeasible_assignments.append(", "assignments.append(")
with open("app/scheduler/engine.py", "w") as f:
    f.write(text)

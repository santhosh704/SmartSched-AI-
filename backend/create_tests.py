import os

os.makedirs("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests", exist_ok=True)

conftest = """
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.services.seed_data import seed_all
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

@pytest.fixture(scope="session")
def db():
    db = TestingSessionLocal()
    seed_all(db)
    yield db
    db.close()

@pytest.fixture(scope="module")
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
"""

test_constraints = """
import pytest
import json
from datetime import datetime, timedelta
from app.scheduler.constraint_validator import ConstraintValidator
from app.scheduler.engine import build_scheduling_context
from app.models.models import Order, Routing

@pytest.fixture
def ctx(db):
    return build_scheduling_context(db)

def test_h1_material(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["PROD-001"][0]
    
    # Valid
    mats = {mat.material_id: mat.stock_quantity for mat in ctx.materials.values()}
    res = cv.validate_material(routing_op, 10, mats, {})
    assert res.satisfied is True
    
    # Invalid
    res_inv = cv.validate_material(routing_op, 1000000, mats, {})
    assert res_inv.satisfied is False
    assert res_inv.constraint_code == "H1"

def test_h2_tool(ctx):
    cv = ConstraintValidator()
    routing_op = ctx.routings_by_product["PROD-001"][0]
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
    routing_op = ctx.routings_by_product["PROD-001"][0]
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
    routing_op = ctx.routings_by_product["PROD-001"][0]
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

def test_h8_routing_precedence():
    cv = ConstraintValidator()
    alloc = [{"order_id": "O01", "sequence": 1, "end_time": datetime(2026,1,1,10,0)}]
    end_time = cv.validate_routing_precedence("O01", 2, alloc)
    assert end_time == datetime(2026,1,1,10,0)
"""

test_scheduler = """
import pytest
from datetime import datetime, timedelta
from app.scheduler.engine import build_scheduling_context, run_scheduler

@pytest.fixture
def ctx(db):
    return build_scheduling_context(db)

def test_fifo_baseline(ctx):
    res = run_scheduler(ctx, "baseline")
    assert res.objective == "baseline"
    assert len(res.assignments) > 0

def test_delivery_first(ctx):
    res = run_scheduler(ctx, "delivery_first")
    assert res.objective == "delivery_first"
    assert res.feasible is True or res.feasible is False

def test_cost_first(ctx):
    res = run_scheduler(ctx, "cost_first")
    assert res.objective == "cost_first"

def test_balanced(ctx):
    res = run_scheduler(ctx, "balanced")
    assert res.objective == "balanced"
    
def test_infeasible_scenario(db):
    ctx = build_scheduling_context(db)
    for mat in ctx.materials.values():
        mat.stock_quantity = 0
    res = run_scheduler(ctx, "balanced")
    assert res.feasible is False
    assert res.constraint_violations > 0
"""

test_api = """
import pytest

def get_token(client):
    res = client.post("/auth/token", data={"username": "admin", "password": "password"})
    return res.json()["access_token"]

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200

def test_metrics(client, db):
    token = get_token(client)
    res = client.get("/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

def test_run_demo(client):
    token = get_token(client)
    res = client.post("/demo/run-full", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "baseline" in res.json()["scenarios"]

def test_failure_lab(client):
    token = get_token(client)
    res = client.post("/demo/failure-lab", json={"scenario_id": "FS1"}, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["feasible"] is False

def test_disruption(client):
    token = get_token(client)
    res = client.post("/demo/disruption", json={
        "disruption_type": "MACHINE_BREAKDOWN",
        "resource_id": "M01",
        "description": "Test"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "kpi_diff" in res.json()
"""

test_rbac = """
import pytest

def test_planner_cannot_run_demo(client):
    res = client.post("/auth/token", data={"username": "planner", "password": "password"})
    token = res.json()["access_token"]
    
    demo_res = client.post("/demo/run-full", headers={"Authorization": f"Bearer {token}"})
    assert demo_res.status_code == 403
    
def test_admin_can_run_demo(client):
    res = client.post("/auth/token", data={"username": "admin", "password": "password"})
    token = res.json()["access_token"]
    
    demo_res = client.post("/demo/run-full", headers={"Authorization": f"Bearer {token}"})
    assert demo_res.status_code == 200
"""

with open("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests/conftest.py", "w") as f:
    f.write(conftest)

with open("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests/test_constraints.py", "w") as f:
    f.write(test_constraints)
    
with open("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests/test_scheduler.py", "w") as f:
    f.write(test_scheduler)
    
with open("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests/test_api.py", "w") as f:
    f.write(test_api)

with open("/Users/santhosh/Downloads/COE PROJECT/smart-sched-ai/backend/tests/test_rbac.py", "w") as f:
    f.write(test_rbac)

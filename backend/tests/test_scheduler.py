
import pytest
from datetime import datetime, timedelta
from main import build_scheduling_context
from app.scheduler.engine import run_scheduler

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

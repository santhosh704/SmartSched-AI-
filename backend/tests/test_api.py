import pytest
from app.models.models import User
from main import get_current_user, app

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200

def test_metrics(client, db):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")
    res = client.get("/metrics")
    assert res.status_code == 200

def test_run_demo(client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")
    res = client.post("/demo/run-full")
    assert res.status_code == 200
    assert "baseline" in res.json()["scenarios"]

def test_failure_lab(client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")
    res = client.post("/demo/failure-lab", json={"scenario_id": "FS1"})
    assert res.status_code == 200
    assert res.json()["feasible"] is False

def test_disruption(client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")
    res = client.post("/demo/disruption", json={
        "disruption_type": "MACHINE_BREAKDOWN",
        "resource_id": "M01",
        "description": "Test"
    })
    assert res.status_code == 200
    assert "kpi_diff" in res.json()

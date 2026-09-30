import pytest
from app.models.models import User
from main import get_current_user, app

def test_planner_cannot_run_demo(client):
    app.dependency_overrides[get_current_user] = lambda: User(id=2, username="planner", role="planner")
    demo_res = client.post("/demo/run-full")
    assert demo_res.status_code == 403
    
def test_admin_can_run_demo(client):
    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")
    demo_res = client.post("/demo/run-full")
    assert demo_res.status_code == 200

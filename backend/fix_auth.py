import os
def patch_file(path, replacements):
    with open(path, 'r') as f:
        content = f.read()
    for o, n in replacements.items():
        content = content.replace(o, n)
    with open(path, 'w') as f:
        f.write(content)

api_patch = {
    'def get_token(client):': 'from app.models.models import User\nfrom main import get_current_user\ndef get_token(client):\n',
    'def test_metrics(client, db):': 'def test_metrics(client, db):\n    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")\n',
    'def test_run_demo(client):': 'def test_run_demo(client):\n    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")\n',
    'def test_failure_lab(client):': 'def test_failure_lab(client):\n    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")\n',
    'def test_disruption(client):': 'def test_disruption(client):\n    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")\n',
    'token = get_token(client)\n': '',
    'headers={"Authorization": f"Bearer {token}"}': ''
}

patch_file('tests/test_api.py', api_patch)

rbac_patch = {
    'def test_planner_cannot_run_demo(client):': 'from app.models.models import User\nfrom main import get_current_user, app\n\ndef test_planner_cannot_run_demo(client):\n    app.dependency_overrides[get_current_user] = lambda: User(id=2, username="planner", role="planner")\n',
    'def test_admin_can_run_demo(client):': 'def test_admin_can_run_demo(client):\n    app.dependency_overrides[get_current_user] = lambda: User(id=1, username="admin", role="admin")\n',
    'res = client.post("/auth/login", data={"username": "planner", "password": "planner123"})\n    token = res.json()["access_token"]': '',
    'res = client.post("/auth/login", data={"username": "admin", "password": "admin123"})\n    token = res.json()["access_token"]': '',
    'headers={"Authorization": f"Bearer {token}"}': ''
}
patch_file('tests/test_rbac.py', rbac_patch)


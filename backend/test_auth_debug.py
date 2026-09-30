from fastapi.testclient import TestClient
from main import app
from app.core.database import Base
from backend.tests.conftest import engine, TestingSessionLocal
from app.services.seed_data import seed_all

Base.metadata.create_all(bind=engine)
db = TestingSessionLocal()
seed_all(db)

def override_get_db():
    try:
        yield db
    finally:
        pass
app.dependency_overrides[app.dependency_overrides.get("get_db")] = override_get_db

client = TestClient(app)
res = client.post("/auth/token", data={"username": "admin", "password": "admin123"})
print(res.json())

from datetime import date, timedelta

import pytest
from app.services.auth import create_access_token


@pytest.mark.asyncio
async def test_create_task(auth_client):
    resp = await auth_client.post("/api/tasks", json={
        "title": "Test task",
        "description": "A test",
        "priority": "high",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "high"
    assert data["status"] == "todo"
    assert data["owner_id"] is not None


@pytest.mark.asyncio
async def test_list_tasks(auth_client):
    # Create two tasks
    await auth_client.post("/api/tasks", json={"title": "Task 1"})
    await auth_client.post("/api/tasks", json={"title": "Task 2"})

    resp = await auth_client.get("/api/tasks")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["tasks"]) == 2
    assert data["page"] == 1
    assert data["limit"] == 20


@pytest.mark.asyncio
async def test_get_task(auth_client):
    create_resp = await auth_client.post("/api/tasks", json={"title": "Get me"})
    task_id = create_resp.json()["id"]

    resp = await auth_client.get(f"/api/tasks/{task_id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Get me"


@pytest.mark.asyncio
async def test_update_task(auth_client):
    create_resp = await auth_client.post("/api/tasks", json={"title": "Original"})
    task_id = create_resp.json()["id"]

    resp = await auth_client.put(f"/api/tasks/{task_id}", json={"title": "Updated"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


@pytest.mark.asyncio
async def test_delete_task(auth_client):
    create_resp = await auth_client.post("/api/tasks", json={"title": "Delete me"})
    task_id = create_resp.json()["id"]

    resp = await auth_client.delete(f"/api/tasks/{task_id}")
    assert resp.status_code == 204

    get_resp = await auth_client.get(f"/api/tasks/{task_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_task(auth_client, second_user, client):
    # Create task as first user
    create_resp = await auth_client.post("/api/tasks", json={"title": "My task"})
    task_id = create_resp.json()["id"]

    # Authenticate as second user
    token = create_access_token(second_user.id)
    client.headers["Authorization"] = f"Bearer {token}"

    # Try to access first user's task
    resp = await client.get(f"/api/tasks/{task_id}")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_dashboard_stats(auth_client):
    # Create tasks with various states
    await auth_client.post("/api/tasks", json={"title": "T1", "status": "todo", "priority": "high"})
    await auth_client.post("/api/tasks", json={"title": "T2", "status": "in_progress", "priority": "low"})
    await auth_client.post("/api/tasks", json={"title": "T3", "status": "done", "priority": "medium"})

    resp = await auth_client.get("/api/dashboard/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert data["by_status"]["todo"] == 1
    assert data["by_status"]["in_progress"] == 1
    assert data["by_status"]["done"] == 1
    assert data["by_priority"]["high"] == 1
    assert data["by_priority"]["low"] == 1
    assert data["by_priority"]["medium"] == 1
    assert data["overdue"] == 0

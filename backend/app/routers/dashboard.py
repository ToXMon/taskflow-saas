from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    overdue: int
    completed_this_week: int


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base = select(Task).where(Task.owner_id == current_user.id)

    # Total
    total_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.owner_id == current_user.id)
    )
    total = total_result.scalar() or 0

    # By status
    status_result = await db.execute(
        select(Task.status, func.count())
        .where(Task.owner_id == current_user.id)
        .group_by(Task.status)
    )
    by_status = {"todo": 0, "in_progress": 0, "done": 0}
    for row in status_result:
        by_status[row[0]] = row[1]

    # By priority
    priority_result = await db.execute(
        select(Task.priority, func.count())
        .where(Task.owner_id == current_user.id)
        .group_by(Task.priority)
    )
    by_priority = {"low": 0, "medium": 0, "high": 0}
    for row in priority_result:
        by_priority[row[0]] = row[1]

    # Overdue: due_date < today AND status != done
    today = date.today()
    overdue_result = await db.execute(
        select(func.count()).select_from(Task).where(
            Task.owner_id == current_user.id,
            Task.due_date < today,
            Task.status != "done",
        )
    )
    overdue = overdue_result.scalar() or 0

    # Completed this week
    week_start = today - timedelta(days=today.weekday())
    completed_result = await db.execute(
        select(func.count()).select_from(Task).where(
            Task.owner_id == current_user.id,
            Task.status == "done",
            Task.updated_at >= datetime(week_start.year, week_start.month, week_start.day, tzinfo=timezone.utc),
        )
    )
    completed_this_week = completed_result.scalar() or 0

    return DashboardStats(
        total=total,
        by_status=by_status,
        by_priority=by_priority,
        overdue=overdue,
        completed_this_week=completed_this_week,
    )

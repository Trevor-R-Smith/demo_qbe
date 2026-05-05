"""Leaderboard — filtered by game type, optional club + period."""

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query

from core import db, GAME_TYPES
from services.clubs import canonical_club


router = APIRouter()


@router.get("/leaderboard/{game_type}")
async def get_leaderboard(
    game_type: str,
    club: Optional[str] = Query(default=None),
    period: Literal["all", "weekly"] = Query(default="all"),
    limit: int = Query(default=20, ge=1, le=100),
):
    if game_type not in GAME_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown game type. Allowed: {sorted(GAME_TYPES)}")

    query: dict = {"gameType": game_type}
    if club and club != "All":
        # normalise the filter so old & new records match consistently
        query["club"] = canonical_club(club)
    if period == "weekly":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["createdAt"] = {"$gte": cutoff}

    # Reaction = lower time better; Decision & Scanning = higher score better.
    sort_field, sort_dir = ("reactionTime", 1) if game_type == "reaction" else ("score", -1)

    cursor = db.scores.find(query, {"_id": 0}).sort(sort_field, sort_dir).limit(limit)
    rows = await cursor.to_list(length=limit)
    return {"gameType": game_type, "club": club or "All", "period": period, "results": rows}

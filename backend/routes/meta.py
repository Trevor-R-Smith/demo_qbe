"""Meta endpoints: root status, club directory."""

from typing import List

from fastapi import APIRouter

from core import db
from models import Club


router = APIRouter()


@router.get("/")
async def root():
    return {"app": "PlaySharp", "motto": "Think quicker. Move smarter.", "version": "1.2.0"}


@router.get("/clubs", response_model=List[Club])
async def list_clubs():
    """Return distinct clubs that have submitted scores (used by leaderboard filter)."""
    distinct = await db.scores.distinct("club")
    names = sorted(n for n in distinct if isinstance(n, str) and n.strip())
    return [Club(name=n) for n in names]

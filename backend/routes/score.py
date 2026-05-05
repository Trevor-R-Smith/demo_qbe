"""Game-score submission."""

from datetime import timezone

from fastapi import APIRouter, HTTPException, Request

from core import db, limiter
from models import Score, ScoreCreate, ScoreResponse
from services.clubs import canonical_club


router = APIRouter()


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat()


@router.post("/score", response_model=ScoreResponse, status_code=201)
@limiter.limit("20/minute")
async def create_score(request: Request, payload: ScoreCreate):
    club_canon = canonical_club(payload.club)
    if not club_canon:
        raise HTTPException(status_code=400, detail="Club name is required.")
    if len(club_canon) > 120:
        raise HTTPException(status_code=400, detail="Club name is too long.")

    # Is this a club we haven't seen before?
    existing = await db.scores.count_documents({"club": club_canon}, limit=1)
    is_new_club = existing == 0

    data = payload.model_dump()
    data["club"] = club_canon
    score = Score(**data)
    doc = score.model_dump()
    doc["createdAt"] = _iso(doc["createdAt"])
    await db.scores.insert_one(doc)
    return ScoreResponse(**score.model_dump(), isNewClub=is_new_club)

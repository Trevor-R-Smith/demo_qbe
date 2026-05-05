"""Club-claim lead capture routes."""

from datetime import timezone
from typing import List

from fastapi import APIRouter, Query, Request

from core import db, limiter, logger
from models import ClubClaim, ClubClaimCreate
from services.clubs import canonical_club


router = APIRouter()


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat()


@router.post("/club-claim", response_model=ClubClaim, status_code=201)
@limiter.limit("5/minute")
async def create_club_claim(request: Request, payload: ClubClaimCreate):
    data = payload.model_dump()
    data["club"] = canonical_club(payload.club)
    claim = ClubClaim(**data)
    doc = claim.model_dump()
    doc["createdAt"] = _iso(doc["createdAt"])
    await db.club_claims.insert_one(doc)
    logger.info("Club claim: %s by %s <%s>", claim.club, claim.contactName, claim.email)
    return claim


@router.get("/club-claim", response_model=List[ClubClaim])
async def list_club_claims(limit: int = Query(50, ge=1, le=500)):
    cursor = db.club_claims.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items

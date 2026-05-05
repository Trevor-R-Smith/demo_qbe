"""Contact form routes."""

from datetime import timezone
from typing import List

from fastapi import APIRouter, Query, Request

from core import db, limiter, logger
from models import Contact, ContactCreate


router = APIRouter()


def _iso(dt):
    return dt.astimezone(timezone.utc).isoformat()


@router.post("/contact", response_model=Contact, status_code=201)
@limiter.limit("10/minute")
async def create_contact(request: Request, payload: ContactCreate):
    contact = Contact(**payload.model_dump())
    doc = contact.model_dump()
    doc["createdAt"] = _iso(doc["createdAt"])
    await db.contacts.insert_one(doc)
    logger.info("Contact stored: %s <%s>", contact.name, contact.email)
    return contact


@router.get("/contact", response_model=List[Contact])
async def list_contacts(limit: int = Query(50, ge=1, le=500)):
    cursor = db.contacts.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items

"""PlaySharp backend — FastAPI + MongoDB.

Cognitive football training platform. Provides endpoints for contact form,
game score submission, and leaderboards filtered by club / period.
"""

from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from pathlib import Path
from datetime import datetime, timezone, timedelta
import os
import uuid
import logging
import random


# --- Bootstrap ---------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="PlaySharp API", version="1.0.0")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("playsharp")


# --- Constants ---------------------------------------------------------------
CLUBS = ["South London FC", "Croydon Juniors", "Elite Academy"]
GAME_TYPES = {"reaction", "decision"}


# --- Models ------------------------------------------------------------------
class ContactCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    club: Optional[str] = Field(default=None, max_length=120)
    message: str = Field(min_length=1, max_length=2000)


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    club: Optional[str] = None
    message: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScoreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    club: str
    gameType: Literal["reaction", "decision"]
    score: int = Field(ge=0, le=10000)
    reactionTime: Optional[float] = Field(default=None, ge=0, le=10000)


class Score(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    club: str
    gameType: str
    score: int
    reactionTime: Optional[float] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Club(BaseModel):
    name: str


# --- Helpers -----------------------------------------------------------------
def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _doc_to_score(doc: dict) -> dict:
    """Normalize a Mongo score doc to a JSON-safe dict (no _id, ISO date)."""
    doc.pop("_id", None)
    if isinstance(doc.get("createdAt"), str):
        # already ISO
        pass
    elif isinstance(doc.get("createdAt"), datetime):
        doc["createdAt"] = _iso(doc["createdAt"])
    return doc


# --- Routes ------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"app": "PlaySharp", "motto": "Think quicker. Move smarter.", "version": "1.0.0"}


@api_router.get("/clubs", response_model=List[Club])
async def list_clubs():
    return [Club(name=c) for c in CLUBS]


@api_router.post("/contact", response_model=Contact, status_code=201)
async def create_contact(payload: ContactCreate):
    contact = Contact(**payload.model_dump())
    doc = contact.model_dump()
    doc["createdAt"] = _iso(doc["createdAt"])
    await db.contacts.insert_one(doc)
    logger.info("Contact stored: %s <%s>", contact.name, contact.email)
    return contact


@api_router.get("/contact", response_model=List[Contact])
async def list_contacts(limit: int = Query(50, ge=1, le=500)):
    cursor = db.contacts.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items


@api_router.post("/score", response_model=Score, status_code=201)
async def create_score(payload: ScoreCreate):
    if payload.club not in CLUBS:
        raise HTTPException(status_code=400, detail=f"Unknown club. Allowed: {CLUBS}")
    score = Score(**payload.model_dump())
    doc = score.model_dump()
    doc["createdAt"] = _iso(doc["createdAt"])
    await db.scores.insert_one(doc)
    return score


@api_router.get("/leaderboard/{game_type}")
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
        query["club"] = club
    if period == "weekly":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["createdAt"] = {"$gte": cutoff}

    # Reaction = lower time better; Decision = higher score better.
    sort_field, sort_dir = ("reactionTime", 1) if game_type == "reaction" else ("score", -1)

    cursor = db.scores.find(query, {"_id": 0}).sort(sort_field, sort_dir).limit(limit)
    rows = await cursor.to_list(length=limit)
    return {"gameType": game_type, "club": club or "All", "period": period, "results": rows}


# --- Seed sample data --------------------------------------------------------
async def _seed_sample_data():
    existing = await db.scores.count_documents({})
    if existing > 0:
        logger.info("Skipping seed — %d scores already present.", existing)
        return

    sample_names = [
        "Marcus J.", "Liam O.", "Aaron K.", "Tyrell B.", "Jamal R.",
        "Ethan W.", "Noah P.", "Kai S.", "Reece M.", "Daniel L.",
        "Oscar T.", "Finley G.", "Harvey D.", "Theo C.", "Leo A.",
    ]

    sample_scores: List[dict] = []
    now = datetime.now(timezone.utc)

    # Reaction scores: lower is better (ms)
    for i in range(20):
        created = now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))
        sample_scores.append({
            "id": str(uuid.uuid4()),
            "name": random.choice(sample_names),
            "club": random.choice(CLUBS),
            "gameType": "reaction",
            "score": random.randint(700, 980),  # composite score out of 1000
            "reactionTime": round(random.uniform(220, 410), 1),
            "createdAt": _iso(created),
        })

    # Decision scores: higher is better (out of 100)
    for i in range(20):
        created = now - timedelta(days=random.randint(0, 14), hours=random.randint(0, 23))
        sample_scores.append({
            "id": str(uuid.uuid4()),
            "name": random.choice(sample_names),
            "club": random.choice(CLUBS),
            "gameType": "decision",
            "score": random.randint(55, 100),
            "reactionTime": None,
            "createdAt": _iso(created),
        })

    await db.scores.insert_many(sample_scores)
    logger.info("Seeded %d sample scores.", len(sample_scores))


# --- Wire-up -----------------------------------------------------------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await _seed_sample_data()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()

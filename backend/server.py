"""PlaySharp backend — FastAPI + MongoDB.

Cognitive football training platform. Provides endpoints for contact form,
game score submission, and leaderboards filtered by club / period.
"""

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from pathlib import Path
from datetime import datetime, timezone, timedelta
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import re
import uuid
import logging
import random


# --- Bootstrap ---------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="PlaySharp API", version="1.2.0")
api_router = APIRouter(prefix="/api")


def _client_key(request: Request) -> str:
    """Use the first IP from X-Forwarded-For (real client) so rate limiting
    works behind k8s/ingress proxies. Falls back to the direct peer address."""
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[0].strip()
    return get_remote_address(request)


# Rate limiter — keyed by real client IP via X-Forwarded-For.
limiter = Limiter(key_func=_client_key, default_limits=[])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("playsharp")


# --- Constants ---------------------------------------------------------------
CLUBS = ["South London FC", "Croydon Juniors", "Elite Academy"]
GAME_TYPES = {"reaction", "decision"}

# Football abbreviations that should stay uppercase after title-casing.
_KEEP_UPPER = {
    "FC", "AFC", "AC", "CF", "SC", "FK", "CFC", "USD", "CD", "CA",
    "UFC", "UK", "USA", "US", "SK", "BK", "GK", "RB", "EFC", "PE", "JFC",
}


def canonical_club(raw: Optional[str]) -> str:
    """Normalise a user-submitted club name to a canonical form.

    Rules:
      - strip outer whitespace, collapse internal whitespace
      - title-case each word
      - keep common football abbreviations (FC, AFC, AC, ...) uppercase
      - keep age-group codes (U12, U-12, U21) uppercase
      - preserve hyphens in compound words
    """
    name = re.sub(r"\s+", " ", (raw or "")).strip()
    if not name:
        return ""

    def _cap_token(word: str) -> str:
        if not word:
            return word
        upper = word.upper()
        if upper in _KEEP_UPPER:
            return upper
        if re.fullmatch(r"U-?\d+", upper):
            return upper
        # Preserve user-supplied all-uppercase acronyms of length >= 2 that contain only letters.
        if len(word) >= 2 and word.isupper() and word.isalpha():
            return word
        return word[:1].upper() + word[1:].lower()

    def _cap(word: str) -> str:
        if "-" in word:
            return "-".join(_cap_token(p) for p in word.split("-"))
        return _cap_token(word)

    return " ".join(_cap(w) for w in name.split(" "))


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
    age: Optional[int] = Field(default=None, ge=6, le=99)
    gameType: Literal["reaction", "decision"]
    score: int = Field(ge=0, le=10000)
    reactionTime: Optional[float] = Field(default=None, ge=0, le=10000)


class Score(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    club: str
    age: Optional[int] = None
    gameType: str
    score: int
    reactionTime: Optional[float] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ScoreResponse(Score):
    isNewClub: bool = False


class ClubClaimCreate(BaseModel):
    club: str = Field(min_length=1, max_length=120)
    contactName: str = Field(min_length=1, max_length=120)
    email: EmailStr
    role: str = Field(min_length=1, max_length=60)
    squadSize: Optional[int] = Field(default=None, ge=1, le=2000)
    message: Optional[str] = Field(default=None, max_length=2000)


class ClubClaim(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    club: str
    contactName: str
    email: str
    role: str
    squadSize: Optional[int] = None
    message: Optional[str] = None
    status: str = "new"
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
    return {"app": "PlaySharp", "motto": "Think quicker. Move smarter.", "version": "1.2.0"}


@api_router.get("/clubs", response_model=List[Club])
async def list_clubs():
    """Return distinct clubs that have submitted scores (used by leaderboard filter)."""
    distinct = await db.scores.distinct("club")
    names = sorted(n for n in distinct if isinstance(n, str) and n.strip())
    return [Club(name=n) for n in names]


@api_router.post("/contact", response_model=Contact, status_code=201)
@limiter.limit("10/minute")
async def create_contact(request: Request, payload: ContactCreate):
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


@api_router.post("/score", response_model=ScoreResponse, status_code=201)
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


@api_router.post("/club-claim", response_model=ClubClaim, status_code=201)
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


@api_router.get("/club-claim", response_model=List[ClubClaim])
async def list_club_claims(limit: int = Query(50, ge=1, le=500)):
    cursor = db.club_claims.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit)
    items = await cursor.to_list(length=limit)
    return items


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
        # normalise the filter so old & new records match consistently
        query["club"] = canonical_club(club)
    if period == "weekly":
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        query["createdAt"] = {"$gte": cutoff}

    # Reaction = lower time better; Decision = higher score better.
    sort_field, sort_dir = ("reactionTime", 1) if game_type == "reaction" else ("score", -1)

    cursor = db.scores.find(query, {"_id": 0}).sort(sort_field, sort_dir).limit(limit)
    rows = await cursor.to_list(length=limit)
    return {"gameType": game_type, "club": club or "All", "period": period, "results": rows}


# --- Seed sample data --------------------------------------------------------
# Curated top-15 reactions (lower ms = better) and top-15 decisions (higher = better).
_SEED_REACTION = [
    ("Marcus J.",   "South London FC",  17,  218, 935),
    ("Kai S.",      "Elite Academy",    19,  226, 920),
    ("Harvey D.",   "Croydon Juniors",  16,  231, 908),
    ("Noah P.",     "South London FC",  18,  238, 897),
    ("Ethan W.",    "Elite Academy",    15,  245, 885),
    ("Leo A.",      "Croydon Juniors",  17,  253, 872),
    ("Finley G.",   "South London FC",  16,  261, 858),
    ("Oscar T.",    "Elite Academy",    18,  270, 842),
    ("Reece M.",    "Croydon Juniors",  15,  279, 826),
    ("Jamal R.",    "South London FC",  14,  288, 810),
    ("Theo C.",     "Elite Academy",    17,  298, 792),
    ("Daniel L.",   "Croydon Juniors",  19,  308, 773),
    ("Aaron K.",    "South London FC",  16,  320, 750),
    ("Liam O.",     "Elite Academy",    16,  332, 728),
    ("Tyrell B.",   "Croydon Juniors",  18,  345, 703),
]

_SEED_DECISION = [
    ("Marcus J.",   "South London FC",  17,  98),
    ("Finley G.",   "South London FC",  16,  96),
    ("Tyrell B.",   "Croydon Juniors",  18,  94),
    ("Noah P.",     "South London FC",  18,  92),
    ("Daniel L.",   "Croydon Juniors",  19,  90),
    ("Kai S.",      "Elite Academy",    19,  88),
    ("Harvey D.",   "Croydon Juniors",  16,  86),
    ("Ethan W.",    "Elite Academy",    15,  84),
    ("Leo A.",      "Croydon Juniors",  17,  82),
    ("Theo C.",     "Elite Academy",    17,  80),
    ("Oscar T.",    "Elite Academy",    18,  76),
    ("Jamal R.",    "South London FC",  14,  72),
    ("Aaron K.",    "South London FC",  16,  68),
    ("Reece M.",    "Croydon Juniors",  15,  64),
    ("Liam O.",     "Elite Academy",    16,  60),
]


async def _seed_sample_data():
    existing = await db.scores.count_documents({})
    if existing > 0:
        logger.info("Skipping seed — %d scores already present.", existing)
        return

    now = datetime.now(timezone.utc)
    sample_scores: List[dict] = []

    for name, club, age, rt, score in _SEED_REACTION:
        created = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))
        sample_scores.append({
            "id": str(uuid.uuid4()),
            "name": name, "club": club, "age": age,
            "gameType": "reaction",
            "score": score, "reactionTime": float(rt),
            "createdAt": _iso(created), "seeded": True,
        })

    for name, club, age, score in _SEED_DECISION:
        created = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))
        sample_scores.append({
            "id": str(uuid.uuid4()),
            "name": name, "club": club, "age": age,
            "gameType": "decision",
            "score": score, "reactionTime": None,
            "createdAt": _iso(created), "seeded": True,
        })

    await db.scores.insert_many(sample_scores)
    logger.info("Seeded %d curated scores.", len(sample_scores))


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

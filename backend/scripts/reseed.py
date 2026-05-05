"""One-off reseed — curated top-15 realistic leaderboard entries per game type."""
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import os, uuid, random
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / ".env")
c = MongoClient(os.environ["MONGO_URL"])
d = c[os.environ["DB_NAME"]]

d.scores.delete_many({})

now = datetime.now(timezone.utc)

def iso(dt):
    return dt.astimezone(timezone.utc).isoformat()

REACTION = [
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

DECISION = [
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

docs = []
for (name, club, age, rt, score) in REACTION:
    created = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))
    docs.append({
        "id": str(uuid.uuid4()),
        "name": name, "club": club, "age": age,
        "gameType": "reaction",
        "score": score, "reactionTime": float(rt),
        "createdAt": iso(created), "seeded": True,
    })

for (name, club, age, score) in DECISION:
    created = now - timedelta(days=random.randint(1, 14), hours=random.randint(0, 23))
    docs.append({
        "id": str(uuid.uuid4()),
        "name": name, "club": club, "age": age,
        "gameType": "decision",
        "score": score, "reactionTime": None,
        "createdAt": iso(created), "seeded": True,
    })

d.scores.insert_many(docs)
print(f"Reseeded {len(docs)} scores ({len(REACTION)} reaction + {len(DECISION)} decision)")
print(f"Clubs: {sorted(d.scores.distinct('club'))}")

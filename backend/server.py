"""PlaySharp backend — FastAPI + MongoDB.

Thin entry-point. Routes live in `/app/backend/routes`, models in
`/app/backend/models`, shared infra (db, limiter, logger) in `core.py`,
and the startup seed in `services/seed.py`.
"""

import os

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from core import client, limiter
from routes import api_router
from services.seed import seed_sample_data


app = FastAPI(title="PlaySharp API", version="1.2.0")

# Rate limiter wiring (shared instance from core).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

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
    await seed_sample_data()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()

"""Contact form models."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


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

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@dataclass(frozen=True)
class User:
    username: str
    password_hash: str
    role: str


_USERS_RAW = [
    {"username": "soc", "password": "soc123", "role": "admin"},
]


def _build_users() -> list[User]:
    users: list[User] = []
    for u in _USERS_RAW:
        password_hash = pwd_context.hash(u["password"])
        users.append(User(username=u["username"], password_hash=password_hash, role=u["role"]))
    return users


USERS: list[User] = _build_users()


def authenticate_user(username: str, password: str) -> Optional[dict[str, str]]:
    user = next((u for u in USERS if u.username == username), None)
    if user is None:
        return None

    if not pwd_context.verify(password, user.password_hash):
        return None

    return {"username": user.username, "role": user.role}


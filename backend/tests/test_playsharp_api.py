"""PlaySharp backend API regression tests."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env if not exported
    from pathlib import Path
    env = Path("/app/frontend/.env").read_text()
    for line in env.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

API = f"{BASE_URL}/api"
VALID_CLUBS = ["South London FC", "Croydon Juniors", "Elite Academy"]


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Root + clubs ----------------------------------------------------------
class TestRoot:
    def test_root_info(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data["app"] == "PlaySharp"
        assert "motto" in data and "Think quicker" in data["motto"]
        assert "version" in data

    def test_clubs(self, session):
        r = session.get(f"{API}/clubs")
        assert r.status_code == 200
        names = [c["name"] for c in r.json()]
        assert sorted(names) == sorted(VALID_CLUBS)


# --- Contact ---------------------------------------------------------------
class TestContact:
    def test_contact_create_valid(self, session):
        payload = {
            "name": "TEST_Tester",
            "email": "test_tester@example.com",
            "club": "South London FC",
            "message": "Hello from backend test",
        }
        r = session.post(f"{API}/contact", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data and isinstance(data["id"], str)
        assert "createdAt" in data
        assert "_id" not in data

    def test_contact_invalid_email_returns_422(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "Bad", "email": "not-an-email", "message": "x"
        })
        assert r.status_code == 422

    def test_contact_persisted_in_list(self, session):
        # POST a unique contact then GET list and look for it
        payload = {
            "name": "TEST_PersistCheck",
            "email": "persist_check@example.com",
            "message": "persistence test",
        }
        r = session.post(f"{API}/contact", json=payload)
        assert r.status_code == 201
        contact_id = r.json()["id"]

        r2 = session.get(f"{API}/contact?limit=200")
        assert r2.status_code == 200
        ids = [c["id"] for c in r2.json()]
        assert contact_id in ids
        # No ObjectId leakage
        for c in r2.json():
            assert "_id" not in c


# --- Score -----------------------------------------------------------------
class TestScore:
    def test_score_create_reaction(self, session):
        payload = {
            "name": "TEST_Reactor",
            "club": "South London FC",
            "gameType": "reaction",
            "score": 850,
            "reactionTime": 280.5,
        }
        r = session.post(f"{API}/score", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["gameType"] == "reaction"
        assert data["score"] == 850
        assert data["reactionTime"] == 280.5
        assert "_id" not in data

    def test_score_create_decision(self, session):
        payload = {
            "name": "TEST_Decider",
            "club": "Elite Academy",
            "gameType": "decision",
            "score": 92,
        }
        r = session.post(f"{API}/score", json=payload)
        assert r.status_code == 201
        assert r.json()["gameType"] == "decision"

    def test_score_unknown_club_400(self, session):
        r = session.post(f"{API}/score", json={
            "name": "TEST_X", "club": "Unknown Club", "gameType": "reaction",
            "score": 500, "reactionTime": 300,
        })
        assert r.status_code == 400

    def test_score_unknown_game_type_422(self, session):
        r = session.post(f"{API}/score", json={
            "name": "TEST_Y", "club": "South London FC",
            "gameType": "snooker", "score": 100,
        })
        assert r.status_code == 422


# --- Leaderboard -----------------------------------------------------------
class TestLeaderboard:
    def test_reaction_sorted_ascending(self, session):
        r = session.get(f"{API}/leaderboard/reaction")
        assert r.status_code == 200
        data = r.json()
        assert data["gameType"] == "reaction"
        results = data["results"]
        assert len(results) > 0
        times = [x["reactionTime"] for x in results if x.get("reactionTime") is not None]
        assert times == sorted(times)
        for row in results:
            assert "_id" not in row

    def test_decision_sorted_descending(self, session):
        r = session.get(f"{API}/leaderboard/decision")
        assert r.status_code == 200
        results = r.json()["results"]
        assert len(results) > 0
        scores = [x["score"] for x in results]
        assert scores == sorted(scores, reverse=True)

    def test_leaderboard_club_filter(self, session):
        r = session.get(f"{API}/leaderboard/reaction", params={"club": "South London FC"})
        assert r.status_code == 200
        for row in r.json()["results"]:
            assert row["club"] == "South London FC"

    def test_leaderboard_weekly_period(self, session):
        r = session.get(f"{API}/leaderboard/reaction", params={"period": "weekly"})
        assert r.status_code == 200
        data = r.json()
        assert data["period"] == "weekly"
        # Just ensure response is valid; seeded data spans 0-14 days so may have results
        assert isinstance(data["results"], list)

    def test_leaderboard_unknown_game_type(self, session):
        r = session.get(f"{API}/leaderboard/snooker")
        assert r.status_code == 400

    def test_seed_data_present(self, session):
        # Aggregate count from all clubs / unfiltered
        r1 = session.get(f"{API}/leaderboard/reaction", params={"limit": 100})
        r2 = session.get(f"{API}/leaderboard/decision", params={"limit": 100})
        total = len(r1.json()["results"]) + len(r2.json()["results"])
        assert total >= 30, f"Expected ~40 seeded scores, found {total}"

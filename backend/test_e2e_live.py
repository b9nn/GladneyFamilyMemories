"""Phase B: live e2e against deployed Fly.io backend.

Exercises: login -> create vignette -> upload photo -> fetch photo bytes ->
delete both. Cleans up even on failure. Prefixes test data with
`__e2e_test__` so leftovers are obvious.

Run:  python backend/test_e2e_live.py
Override defaults via env: BASE_URL, E2E_USER, E2E_PASS
"""

import io
import os
import sys
import time

import requests
from PIL import Image

BASE_URL = os.getenv("BASE_URL", "https://gladney-family-tree.fly.dev")
USER = os.getenv("E2E_USER", "admin")
PASS = os.getenv("E2E_PASS", "pass")
TAG = "__e2e_test__"

GREEN = "\033[92m"; RED = "\033[91m"; YELLOW = "\033[93m"; RESET = "\033[0m"
def ok(m): print(f"{GREEN}[OK]{RESET} {m}")
def fail(m): print(f"{RED}[FAIL]{RESET} {m}")
def info(m): print(f"{YELLOW}[..]{RESET} {m}")


def make_jpeg() -> bytes:
    img = Image.new("RGB", (32, 32), (180, 80, 80))
    buf = io.BytesIO()
    img.save(buf, "JPEG")
    return buf.getvalue()


def main():
    print(f"Target: {BASE_URL}")
    print(f"User:   {USER}")
    print()

    s = requests.Session()
    vignette_id = None
    photo_id = None
    exit_code = 0

    try:
        # Health
        info("GET /api/auth/health")
        r = s.get(f"{BASE_URL}/api/auth/health", timeout=15)
        if r.status_code != 200:
            fail(f"Health check returned {r.status_code}: {r.text[:200]}")
            return 1
        ok(f"Backend reachable ({r.status_code})")

        # Login
        info(f"POST /api/auth/login as {USER}")
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            data={"username": USER, "password": PASS},
            timeout=15,
        )
        if r.status_code != 200:
            fail(f"Login failed ({r.status_code}): {r.text[:200]}")
            fail("If admin/pass doesn't exist, create one via fly ssh: python create_user.py")
            return 1
        token = r.json()["access_token"]
        s.headers["Authorization"] = f"Bearer {token}"
        ok("Logged in, JWT acquired")

        # Whoami
        info("GET /api/auth/me (verify Supabase users read)")
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=15)
        if r.status_code != 200:
            fail(f"/me returned {r.status_code}")
            return 1
        ok(f"User: {r.json().get('username')} (admin={r.json().get('is_admin')})")

        # List vignettes (Supabase read)
        info("GET /api/vignettes")
        r = s.get(f"{BASE_URL}/api/vignettes", timeout=15)
        if r.status_code != 200:
            fail(f"List vignettes returned {r.status_code}")
            return 1
        ok(f"Listed {len(r.json())} vignettes")

        # Create vignette (Supabase write)
        info("POST /api/vignettes (Supabase write)")
        r = s.post(
            f"{BASE_URL}/api/vignettes",
            json={"title": f"{TAG} vignette {int(time.time())}", "content": "e2e test"},
            timeout=15,
        )
        if r.status_code not in (200, 201):
            fail(f"Create vignette returned {r.status_code}: {r.text[:200]}")
            return 1
        vignette_id = r.json()["id"]
        ok(f"Created vignette id={vignette_id}")

        # Upload photo (R2 write + Supabase metadata)
        info("POST /api/photos (R2 write + Supabase metadata)")
        jpeg = make_jpeg()
        r = s.post(
            f"{BASE_URL}/api/photos",
            files={"file": (f"{TAG}.jpg", jpeg, "image/jpeg")},
            data={"title": f"{TAG} photo", "description": "e2e"},
            timeout=30,
        )
        if r.status_code not in (200, 201):
            fail(f"Upload photo returned {r.status_code}: {r.text[:300]}")
            return 1
        photo = r.json()
        photo_id = photo["id"]
        ok(f"Uploaded photo id={photo_id} (file_path={photo.get('file_path','?')[:60]})")

        # Fetch photo bytes (R2 read through backend)
        info(f"GET /api/photos/{photo_id} (R2 read)")
        r = s.get(f"{BASE_URL}/api/photos/{photo_id}", timeout=30)
        if r.status_code != 200:
            fail(f"Fetch photo returned {r.status_code}")
            return 1
        if len(r.content) < 100:
            fail(f"Photo bytes suspiciously small: {len(r.content)}")
            return 1
        ok(f"Fetched {len(r.content)} bytes from R2")

        ok("All live e2e steps passed.")
    except requests.exceptions.RequestException as e:
        fail(f"Network error: {e}")
        exit_code = 1
    except Exception as e:
        fail(f"Unexpected error: {type(e).__name__}: {e}")
        exit_code = 1
    finally:
        # Cleanup
        if photo_id:
            info(f"Cleanup: DELETE /api/photos/{photo_id}")
            try:
                r = s.delete(f"{BASE_URL}/api/photos/{photo_id}", timeout=15)
                ok(f"Deleted photo ({r.status_code})") if r.ok else fail(f"Photo delete {r.status_code}")
            except Exception as e:
                fail(f"Photo cleanup error: {e}")
        if vignette_id:
            info(f"Cleanup: DELETE /api/vignettes/{vignette_id}")
            try:
                r = s.delete(f"{BASE_URL}/api/vignettes/{vignette_id}", timeout=15)
                ok(f"Deleted vignette ({r.status_code})") if r.ok else fail(f"Vignette delete {r.status_code}")
            except Exception as e:
                fail(f"Vignette cleanup error: {e}")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())

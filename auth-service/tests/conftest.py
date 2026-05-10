"""Shared fixtures for the auth-service integration test suite.

Tests run as a black box against the live containerized API. Spin up the
stack with `docker compose up -d` from `auth-service/` before running pytest.
The test_api.py module skips automatically if the service is unreachable.

Cookie handling: the service sets the auth cookie with ``Secure=True`` and
``Domain=localhost`` (per docker-compose env). Both attributes block httpx's
cookie jar from storing it on a cleartext loopback connection — Secure
requires HTTPS, and ``Domain=localhost`` doesn't match ``127.0.0.1``. The
``AuthClient`` wrapper below pulls the JWT out of the Set-Cookie header and
re-attaches it to the jar without those constraints, so authenticated
follow-up requests work the same way browsers experience them in production.
"""
import os
import re
import uuid

import httpx
import pytest

BASE_URL = os.environ.get("AUTH_SERVICE_URL", "http://127.0.0.1:8100")
ADMIN_EMAIL = os.environ.get("AUTH_ADMIN_EMAIL", "admin@kpmg.com")
ADMIN_PASSWORD = os.environ.get("AUTH_ADMIN_PASSWORD", "Admin123!")
COOKIE_NAME = os.environ.get("AUTH_COOKIE_NAME", "kpmg_auth_token")

_TOKEN_RE = re.compile(rf"\b{re.escape(COOKIE_NAME)}=([^;]+)")


def _capture_auth_cookie(client: httpx.Client, response: httpx.Response) -> None:
    """Parse the JWT out of Set-Cookie and stash it on the jar without
    Secure/Domain restrictions so it round-trips on plain HTTP loopback.
    """
    for header in response.headers.get_list("set-cookie"):
        m = _TOKEN_RE.search(header)
        if m:
            client.cookies.set(COOKIE_NAME, m.group(1))
            return


class AuthClient(httpx.Client):
    """httpx Client that auto-captures the auth cookie from login/signup
    responses, working around the Secure+Domain combo the service sets."""

    def request(self, method, url, **kwargs):  # type: ignore[override]
        response = super().request(method, url, **kwargs)
        if response.status_code in (200, 201):
            _capture_auth_cookie(self, response)
        return response


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session", autouse=True)
def _require_service(base_url):
    """Skip the whole session when the service isn't responding."""
    try:
        r = httpx.get(f"{base_url}/auth/api/health", timeout=2.0)
        if r.status_code != 200:
            pytest.skip(f"auth-service health endpoint returned {r.status_code}")
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"auth-service not reachable at {base_url}: {exc}")


@pytest.fixture
def client(base_url):
    """Fresh client per test — cookies are isolated, no cross-test bleed."""
    with AuthClient(base_url=base_url, timeout=10.0) as c:
        yield c


@pytest.fixture
def admin_client(client):
    """Client pre-authenticated as the seeded bootstrap admin."""
    r = client.post(
        "/auth/api/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    assert COOKIE_NAME in client.cookies, "Auth cookie was not captured"
    return client


@pytest.fixture
def random_email():
    """Unique email per call so signup tests don't collide across runs."""
    return f"test-{uuid.uuid4().hex[:10]}@example.com"

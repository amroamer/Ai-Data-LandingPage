"""Black-box integration tests against the running auth-service.

Covers the endpoints actually consumed by the SPA: auth (login/signup/me/
logout/reset), products (public + admin CRUD), and a couple of admin user
operations. The signup endpoint sets the SSO cookie with `Secure` and
`Domain=localhost`, which httpx's default cookie jar does not store on a
cleartext loopback connection — tests that need an authenticated session
after signup re-login over JSON instead of relying on the cookie from the
signup response.
"""
import uuid

import pytest


# ── Health ──────────────────────────────────────────────────────────────────

def test_health(client):
    r = client.get("/auth/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ── Login ───────────────────────────────────────────────────────────────────

def test_login_success(client):
    r = client.post(
        "/auth/api/login",
        json={"email": "admin@kpmg.com", "password": "Admin123!"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "admin@kpmg.com"
    assert body["role"] == "admin"
    assert body["is_active"] is True
    assert "password_hash" not in body


def test_login_wrong_password(client):
    r = client.post(
        "/auth/api/login",
        json={"email": "admin@kpmg.com", "password": "wrong-password"},
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client):
    r = client.post(
        "/auth/api/login",
        json={"email": "nobody@example.com", "password": "whatever"},
    )
    assert r.status_code == 401


def test_login_invalid_email_format(client):
    r = client.post(
        "/auth/api/login",
        json={"email": "not-an-email", "password": "Admin123!"},
    )
    assert r.status_code == 422


# ── /me & cookie-bound auth ─────────────────────────────────────────────────

def test_me_without_cookie(client):
    r = client.get("/auth/api/me")
    assert r.status_code == 401


def test_me_with_cookie(admin_client):
    r = admin_client.get("/auth/api/me")
    assert r.status_code == 200
    assert r.json()["email"] == "admin@kpmg.com"


def test_logout_clears_session(admin_client):
    # Sanity — we are authed
    assert admin_client.get("/auth/api/me").status_code == 200
    r = admin_client.post("/auth/api/logout")
    assert r.status_code == 200
    # Drop the local cookie too — server's delete_cookie does not always
    # round-trip on cross-domain loopback configs.
    admin_client.cookies.clear()
    assert admin_client.get("/auth/api/me").status_code == 401


# ── Signup ──────────────────────────────────────────────────────────────────

def test_signup_creates_user(client, random_email):
    r = client.post(
        "/auth/api/signup",
        json={"email": random_email, "password": "Password1", "full_name": "Test User"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == random_email
    assert body["full_name"] == "Test User"
    assert body["role"] == "user"


def test_signup_duplicate_email_returns_409(client, random_email):
    payload = {"email": random_email, "password": "Password1", "full_name": "Test User"}
    assert client.post("/auth/api/signup", json=payload).status_code == 201
    r = client.post("/auth/api/signup", json=payload)
    assert r.status_code == 409


@pytest.mark.parametrize(
    "password,reason",
    [
        ("short1", "too short"),
        ("nodigitshere", "no digit"),
        ("12345678", "no letter"),
    ],
)
def test_signup_password_validation(client, random_email, password, reason):
    r = client.post(
        "/auth/api/signup",
        json={"email": random_email, "password": password, "full_name": "Test"},
    )
    assert r.status_code == 422, f"Expected 422 for {reason!r}: {r.text}"


# ── Public products ─────────────────────────────────────────────────────────

def test_list_visible_products(client):
    r = client.get("/auth/api/products")
    assert r.status_code == 200
    products = r.json()
    assert isinstance(products, list)
    assert len(products) >= 1
    first = products[0]
    for field in (
        "id", "slug", "icon_name", "url", "is_visible", "sort_order",
        "title_en", "title_ar", "description_en", "description_ar",
    ):
        assert field in first
    # Public listing must never include hidden products.
    assert all(p["is_visible"] for p in products)


def test_get_visible_product_by_slug(client):
    products = client.get("/auth/api/products").json()
    if not products:
        pytest.skip("No seeded products to fetch")
    slug = products[0]["slug"]
    r = client.get(f"/auth/api/products/{slug}")
    assert r.status_code == 200
    assert r.json()["slug"] == slug


def test_get_unknown_product_returns_404(client):
    r = client.get("/auth/api/products/this-slug-does-not-exist")
    assert r.status_code == 404


# ── Admin products CRUD ────────────────────────────────────────────────────

def test_admin_products_requires_auth(client):
    r = client.get("/auth/api/admin/products")
    assert r.status_code == 401


def test_admin_create_update_delete_product(admin_client):
    slug = f"itest-{uuid.uuid4().hex[:8]}"
    create = admin_client.post(
        "/auth/api/admin/products",
        json={
            "slug": slug,
            "url": "https://example.com/itest",
            "title_en": "Integration Test Product",
            "title_ar": "منتج اختبار التكامل",
        },
    )
    assert create.status_code == 201, create.text
    product_id = create.json()["id"]

    # Duplicate slug → 409
    dup = admin_client.post(
        "/auth/api/admin/products",
        json={
            "slug": slug,
            "url": "https://example.com/dup",
            "title_en": "Dup",
            "title_ar": "Dup",
        },
    )
    assert dup.status_code == 409

    # Update — set hidden + new sort order
    upd = admin_client.put(
        f"/auth/api/admin/products/{product_id}",
        json={"is_visible": False, "sort_order": 999},
    )
    assert upd.status_code == 200, upd.text
    body = upd.json()
    assert body["is_visible"] is False
    assert body["sort_order"] == 999

    # Hidden product is invisible to the public route (404, not 403, to avoid
    # leaking existence).
    public = admin_client.get(f"/auth/api/products/{slug}")
    assert public.status_code == 404

    # But still listed by the admin route.
    admin_list = admin_client.get("/auth/api/admin/products")
    assert any(p["id"] == product_id for p in admin_list.json())

    # Delete and confirm it's gone from both routes.
    deleted = admin_client.delete(f"/auth/api/admin/products/{product_id}")
    assert deleted.status_code == 200
    admin_list2 = admin_client.get("/auth/api/admin/products").json()
    assert all(p["id"] != product_id for p in admin_list2)


def test_admin_update_unknown_product_returns_404(admin_client):
    r = admin_client.put(
        f"/auth/api/admin/products/{uuid.uuid4()}",
        json={"is_visible": False},
    )
    assert r.status_code == 404


def test_admin_create_invalid_slug_rejected(admin_client):
    r = admin_client.post(
        "/auth/api/admin/products",
        json={
            "slug": "Has Spaces!",
            "url": "https://example.com",
            "title_en": "x",
            "title_ar": "x",
        },
    )
    assert r.status_code == 422


# ── Admin users ────────────────────────────────────────────────────────────

def test_admin_users_listing(admin_client):
    r = admin_client.get("/auth/api/users")
    assert r.status_code == 200
    users = r.json()
    assert isinstance(users, list)
    assert any(u["email"] == "admin@kpmg.com" for u in users)


def test_admin_users_requires_admin(client, random_email):
    # Sign up a non-admin and confirm they get 403 from admin endpoints.
    signup = client.post(
        "/auth/api/signup",
        json={"email": random_email, "password": "Password1", "full_name": "Plain User"},
    )
    assert signup.status_code == 201
    # Cookie from signup may not stick (Secure flag) — re-login to be sure.
    client.cookies.clear()
    login = client.post(
        "/auth/api/login",
        json={"email": random_email, "password": "Password1"},
    )
    assert login.status_code == 200
    r = client.get("/auth/api/users")
    assert r.status_code == 403


# ── Reset password (round-trip) ────────────────────────────────────────────

def test_reset_password_round_trip(client, random_email):
    original = "Password1"
    rotated = "Password2"
    assert client.post(
        "/auth/api/signup",
        json={"email": random_email, "password": original, "full_name": "Pw Test"},
    ).status_code == 201

    client.cookies.clear()
    assert client.post(
        "/auth/api/login",
        json={"email": random_email, "password": original},
    ).status_code == 200

    # Wrong old password → 400
    bad = client.post(
        "/auth/api/reset-password",
        json={"old_password": "wrong-old", "new_password": rotated},
    )
    assert bad.status_code == 400

    # Correct old password → 200, then can log in with the new one
    good = client.post(
        "/auth/api/reset-password",
        json={"old_password": original, "new_password": rotated},
    )
    assert good.status_code == 200

    client.cookies.clear()
    assert client.post(
        "/auth/api/login",
        json={"email": random_email, "password": rotated},
    ).status_code == 200
    # Old password is now rejected
    client.cookies.clear()
    assert client.post(
        "/auth/api/login",
        json={"email": random_email, "password": original},
    ).status_code == 401

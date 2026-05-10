import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  apiLogin,
  apiSignup,
  apiLogout,
  apiGetMe,
  apiResetPassword,
  apiGetUsers,
  apiGetProducts,
  apiGetProduct,
  apiAdminCreateProduct,
  apiAdminUpdateProduct,
  apiAdminDeleteProduct,
} from "./auth";

function mockFetchOnce({ ok = true, status = 200, body = {}, headers = {} } = {}) {
  const headerMap = new Map(Object.entries(headers));
  const fetch = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    headers: { get: (k) => headerMap.get(k.toLowerCase()) ?? null },
    json: async () => body,
  });
  globalThis.fetch = fetch;
  return fetch;
}

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiLogin", () => {
  it("POSTs JSON to /auth/api/login and returns parsed body", async () => {
    const fetch = mockFetchOnce({ body: { id: "u1", email: "a@b.com" } });
    const out = await apiLogin("a@b.com", "secret");
    expect(out).toEqual({ id: "u1", email: "a@b.com" });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/login");
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");
    expect(opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(opts.body)).toEqual({ email: "a@b.com", password: "secret" });
  });

  it("throws with the server's detail message on failure", async () => {
    mockFetchOnce({ ok: false, status: 401, body: { detail: "Invalid email or password" } });
    await expect(apiLogin("a@b.com", "x")).rejects.toThrow("Invalid email or password");
  });

  it("uses 'Request failed' when the error body isn't valid JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => null },
      json: async () => {
        throw new Error("not json");
      },
    });
    await expect(apiLogin("a@b.com", "x")).rejects.toThrow("Request failed");
  });

  it("falls back to HTTP <status> when JSON has no detail field", async () => {
    mockFetchOnce({ ok: false, status: 503, body: {} });
    await expect(apiLogin("a@b.com", "x")).rejects.toThrow("HTTP 503");
  });
});

describe("apiSignup", () => {
  it("POSTs full_name + email + password", async () => {
    const fetch = mockFetchOnce({ body: { id: "u2" } });
    await apiSignup("a@b.com", "Pass1234", "Alice");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      email: "a@b.com",
      password: "Pass1234",
      full_name: "Alice",
    });
  });
});

describe("apiLogout / apiGetMe / apiResetPassword", () => {
  it("apiLogout POSTs an empty object", async () => {
    const fetch = mockFetchOnce({ body: { detail: "Logged out" } });
    await apiLogout();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/logout");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({});
  });

  it("apiGetMe issues a GET (no method override) with credentials", async () => {
    const fetch = mockFetchOnce({ body: { id: "u1" } });
    await apiGetMe();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/me");
    expect(opts.method).toBeUndefined();
    expect(opts.credentials).toBe("include");
  });

  it("apiResetPassword sends old + new password", async () => {
    const fetch = mockFetchOnce({ body: { detail: "Password updated" } });
    await apiResetPassword("OldPass1", "NewPass2");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      old_password: "OldPass1",
      new_password: "NewPass2",
    });
  });
});

describe("empty / 204 responses", () => {
  it("returns null for HTTP 204", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null },
      json: async () => {
        throw new Error("should not be called");
      },
    });
    const out = await apiLogout();
    expect(out).toBeNull();
  });

  it("returns null when content-length header is 0", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: (k) => (k.toLowerCase() === "content-length" ? "0" : null) },
      json: async () => {
        throw new Error("should not be called");
      },
    });
    const out = await apiGetMe();
    expect(out).toBeNull();
  });
});

describe("admin and product helpers", () => {
  it("apiGetUsers issues GET /auth/api/users", async () => {
    const fetch = mockFetchOnce({ body: [] });
    await apiGetUsers();
    expect(fetch.mock.calls[0][0]).toBe("/auth/api/users");
  });

  it("apiGetProducts hits the public listing", async () => {
    const fetch = mockFetchOnce({ body: [] });
    await apiGetProducts();
    expect(fetch.mock.calls[0][0]).toBe("/auth/api/products");
  });

  it("apiGetProduct interpolates the slug", async () => {
    const fetch = mockFetchOnce({ body: {} });
    await apiGetProduct("creative-content");
    expect(fetch.mock.calls[0][0]).toBe("/auth/api/products/creative-content");
  });

  it("apiAdminCreateProduct POSTs to /admin/products", async () => {
    const fetch = mockFetchOnce({ body: { id: "p1" } });
    await apiAdminCreateProduct({ slug: "x", title_en: "X" });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/admin/products");
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ slug: "x", title_en: "X" });
  });

  it("apiAdminUpdateProduct PUTs to the product id", async () => {
    const fetch = mockFetchOnce({ body: { id: "p1" } });
    await apiAdminUpdateProduct("p1", { is_visible: false });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/admin/products/p1");
    expect(opts.method).toBe("PUT");
  });

  it("apiAdminDeleteProduct DELETEs the product id", async () => {
    const fetch = mockFetchOnce({ body: { detail: "Product deleted" } });
    await apiAdminDeleteProduct("p1");
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("/auth/api/admin/products/p1");
    expect(opts.method).toBe("DELETE");
  });
});

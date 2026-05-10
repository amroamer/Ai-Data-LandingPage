import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import ProtectedRoute, { AdminRoute } from "./ProtectedRoute";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from "../context/AuthContext";

function renderRoutes(initialPath, guard) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={guard}>
          <Route path="/protected" element={<div>SECRET</div>} />
          <Route path="/admin" element={<div>ADMIN ONLY</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/" element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("renders a spinner while auth is loading", () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    const { container } = renderRoutes("/protected", <ProtectedRoute />);
    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderRoutes("/protected", <ProtectedRoute />);
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });

  it("renders the protected content for any signed-in user", () => {
    useAuth.mockReturnValue({ user: { role: "user" }, loading: false });
    renderRoutes("/protected", <ProtectedRoute />);
    expect(screen.getByText("SECRET")).toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  it("redirects non-admin users home", () => {
    useAuth.mockReturnValue({ user: { role: "user" }, loading: false });
    renderRoutes("/admin", <AdminRoute />);
    expect(screen.getByText("HOME")).toBeInTheDocument();
    expect(screen.queryByText("ADMIN ONLY")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /login", () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderRoutes("/admin", <AdminRoute />);
    expect(screen.getByText("LOGIN PAGE")).toBeInTheDocument();
  });

  it("renders the admin content for an admin user", () => {
    useAuth.mockReturnValue({ user: { role: "admin" }, loading: false });
    renderRoutes("/admin", <AdminRoute />);
    expect(screen.getByText("ADMIN ONLY")).toBeInTheDocument();
  });
});

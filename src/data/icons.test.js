import { describe, expect, it } from "vitest";
import { Brain, Package, Warehouse } from "lucide-react";
import { getProductIcon, iconOptions } from "./icons";

describe("getProductIcon", () => {
  it("returns the matching icon for a known name", () => {
    expect(getProductIcon("Brain")).toBe(Brain);
    expect(getProductIcon("Warehouse")).toBe(Warehouse);
  });

  it("falls back to Package for unknown names", () => {
    expect(getProductIcon("DefinitelyNotAnIcon")).toBe(Package);
    expect(getProductIcon("")).toBe(Package);
    expect(getProductIcon(undefined)).toBe(Package);
  });
});

describe("iconOptions", () => {
  it("returns a sorted list of registered icon names", () => {
    const opts = iconOptions();
    expect(Array.isArray(opts)).toBe(true);
    expect(opts).toContain("Brain");
    expect(opts).toContain("Package");
    expect([...opts].sort()).toEqual(opts);
  });
});

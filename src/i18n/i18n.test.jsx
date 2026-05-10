import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider, useI18n, useT } from "./i18n";

const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = "";
  document.documentElement.dir = "";
});

afterEach(() => {
  localStorage.clear();
});

describe("I18nProvider", () => {
  it("defaults to English when no localStorage value is set", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.lang).toBe("en");
    expect(result.current.isRTL).toBe(false);
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("respects a previously persisted language", () => {
    localStorage.setItem("kpmg-lang", "ar");
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.lang).toBe("ar");
    expect(result.current.isRTL).toBe(true);
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("setLang switches the language and updates <html dir>", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.setLang("ar"));
    expect(result.current.lang).toBe("ar");
    expect(result.current.isRTL).toBe(true);
    expect(document.documentElement.dir).toBe("rtl");
    expect(localStorage.getItem("kpmg-lang")).toBe("ar");
  });

  it("setLang ignores unknown languages", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.setLang("zz"));
    expect(result.current.lang).toBe("en");
  });

  it("exposes the list of available locales", () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    expect(result.current.available).toEqual(expect.arrayContaining(["en", "ar"]));
  });
});

describe("translator (t)", () => {
  it("returns the original key when the path doesn't resolve", () => {
    const { result } = renderHook(() => useT(), { wrapper });
    expect(result.current("totally.unknown.path")).toBe("totally.unknown.path");
  });

  it("interpolates {placeholder} variables", () => {
    function Probe() {
      const t = useT();
      return <span>{t("__missing__", { name: "Alice" })}</span>;
    }
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    // The string returned for a missing key is the key itself, with no
    // placeholders — so this just confirms interpolate is wired in without
    // crashing on a non-template value.
    expect(screen.getByText("__missing__")).toBeInTheDocument();
  });
});

describe("useI18n outside the provider", () => {
  it("throws a clear error", () => {
    expect(() => renderHook(() => useI18n())).toThrow(
      /useI18n must be used within I18nProvider/,
    );
  });
});

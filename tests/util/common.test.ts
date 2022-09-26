import { camelToTitle, isFunction } from "util/common";
import { describe, expect, test, vi } from "vitest";

describe("camelToTitle", () => {
    test("Capitalizes first letter in single word", () =>
        expect(camelToTitle("test")).toBe("Test"));

    test("Converts three word camel case string to title case", () =>
        expect(camelToTitle("camelCaseTest")).toBe("Camel Case Test"));
});

describe("isFunction", () => {
    test("Given function returns true", () => expect(isFunction(vi.fn())).toBe(true));

    // Go through all primitives and basic types
    test("Given a non-function returns false", () => {
        expect(isFunction("test")).toBe(false);
        expect(isFunction(10)).toBe(false);
        expect(isFunction(BigInt(10))).toBe(false);
        expect(isFunction(true)).toBe(false);
        expect(isFunction(undefined)).toBe(false);
        expect(isFunction(Symbol())).toBe(false);
        expect(isFunction(null)).toBe(false);
        expect(isFunction({})).toBe(false);
        expect(isFunction([])).toBe(false);
    });
});

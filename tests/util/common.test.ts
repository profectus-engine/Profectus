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
    test("Given a string returns false", () => expect(isFunction("test")).toBe(false));
    test("Given a number returns false", () => expect(isFunction(10)).toBe(false));
    test("Given a bigint returns false", () => expect(isFunction(BigInt(10))).toBe(false));
    test("Given a boolean returns false", () => expect(isFunction(true)).toBe(false));
    test("Given undefined returns false", () => expect(isFunction(undefined)).toBe(false));
    test("Given a symbol returns false", () => expect(isFunction(Symbol())).toBe(false));
    test("Given null returns false", () => expect(isFunction(null)).toBe(false));
    test("Given object returns false", () => expect(isFunction({})).toBe(false));
    test("Given array returns false", () => expect(isFunction([])).toBe(false));
});

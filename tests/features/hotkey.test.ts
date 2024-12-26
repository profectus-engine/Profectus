import { createHotkey, hotkeys } from "features/hotkey";
import { afterEach, describe, expect, test } from "vitest";
import { Ref, ref } from "vue";
import "../utils";

function createSuccessHotkey(key: string, triggered: Ref<boolean>) {
    hotkeys[key] = createHotkey(() => ({
        description: "",
        key: key,
        onPress: () => (triggered.value = true)
    }));
}

function createFailHotkey(key: string) {
    hotkeys[key] = createHotkey(() => ({
        description: "Fail test",
        key,
        onPress: () => expect(true).toBe(false)
    }));
}

function mockKeypress(key: string, shiftKey = false, ctrlKey = false) {
    const event = new KeyboardEvent("keydown", { key, shiftKey, ctrlKey });
    expect(document.dispatchEvent(event)).toBe(true);
    return event;
}

function testHotkey(pass: string, fail: string, key: string, shiftKey = false, ctrlKey = false) {
    const triggered = ref(false);
    createSuccessHotkey(pass, triggered);
    createFailHotkey(fail);
    mockKeypress(key, shiftKey, ctrlKey);
    expect(triggered.value).toBe(true);
}

describe("Hotkeys fire correctly", () => {
    afterEach(() => {
        Object.keys(hotkeys).forEach(key => delete hotkeys[key]);
    });

    test("Lower case letters", () => testHotkey("a", "A", "a"));

    test.each([["A"], ["shift+a"], ["shift+A"]])("Upper case letters using %s as key", key => {
        testHotkey(key, "a", "A", true);
    });

    describe.each([
        [0, ")"],
        [1, "!"],
        [2, "@"],
        [3, "#"],
        [4, "$"],
        [5, "%"],
        [6, "^"],
        [7, "&"],
        [8, "*"],
        [9, "("]
    ])("Handle number %i and it's 'capital', %s", (number, symbol) => {
        test("Triggering number", () =>
            testHotkey(number.toString(), symbol, number.toString(), true));
        test.each([symbol, `shift+${number}`, `shift+${symbol}`])(
            "Triggering symbol using %s as key",
            key => testHotkey(key, number.toString(), symbol, true)
        );
    });

    test("Ctrl modifier", () => testHotkey("ctrl+a", "a", "a", false, true));

    test.each(["shift+ctrl+a", "ctrl+shift+a", "shift+ctrl+A", "ctrl+shift+A"])(
        "Shift and Ctrl modifiers using %s as key",
        key => {
            const triggered = ref(false);
            createSuccessHotkey(key, triggered);
            createFailHotkey("a");
            createFailHotkey("A");
            createFailHotkey("shift+A");
            createFailHotkey("shift+a");
            createFailHotkey("ctrl+a");
            createFailHotkey("ctrl+A");
            mockKeypress("a", true, true);
            expect(triggered.value).toBe(true);
        }
    );

    test.each(["shift+ctrl+1", "ctrl+shift+1", "shift+ctrl+!", "ctrl+shift+!"])(
        "Shift and Ctrl modifiers using %s as key",
        key => {
            const triggered = ref(false);
            createSuccessHotkey(key, triggered);
            createFailHotkey("1");
            createFailHotkey("!");
            createFailHotkey("shift+1");
            createFailHotkey("shift+!");
            createFailHotkey("ctrl+1");
            createFailHotkey("ctrl+!");
            mockKeypress("!", true, true);
            expect(triggered.value).toBe(true);
        }
    );
});

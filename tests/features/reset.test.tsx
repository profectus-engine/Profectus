import { createUpgrade } from "features/clickables/upgrade";
import { createReset, ResetOptions } from "features/reset";
import { createResource } from "features/resources/resource";
import { globalBus } from "game/events";
import Formula from "game/formulas/formulas";
import { createLayer } from "game/layers";
import { DefaultValue, SkipPersistence } from "game/persistence";
import Decimal, { DecimalSource } from "util/bignum";
import { describe, expect, test } from "vitest";
import { ref } from "vue";

function createTestReset(things: Record<string, unknown>[] = [], options: Omit<ResetOptions, "thingsToReset"> = {}) {
    return createReset(() => ({
        thingsToReset: () => things,
        ...options
    }));
}

describe("Reset reset", () => {
    test("It resets passed in things", () => {
        const upgrade = createUpgrade(() => ({
            requirements: []
        }));

        const resource = createResource<DecimalSource>(0);
        const layer = createLayer("test", () => {
            return {
                resource,
                display: <></>
            };
        });

        upgrade.bought.value = true;
        resource.value = 100;

        const reset = createTestReset([upgrade, layer]);
        
        reset.reset();
        expect(upgrade.bought.value).toBe(false);
        expect(resource.value).toEqual(0);
    });

    test("It resets nested objects", () => {
        const resource = createResource<number>(0);
        const upgrade = createUpgrade(() => ({requirements: [], resource}));
        const object = {test: {test2: upgrade}};

        resource.value = 100;
        upgrade.bought.value = true;
        
        const reset = createTestReset([object]);
        reset.reset();
        expect(resource.value).toEqual(0);
        expect(upgrade.bought.value).toEqual(false);
    });

    test("It ignores refs", () => {
        const upgrade = ref(createUpgrade(() => ({requirements: []})));
        upgrade.value.bought = false;
        const object = {upgrade};

        const reset = createTestReset([object]);
        expect(() => reset.reset()).not.toThrow();
    });

    test("It emits a global bus event", () => {
        const reset = createTestReset();

        let called = false;
        globalBus.on("reset", () => called = true);

        reset.reset();
        expect(called).toBe(true);
    });

    test("it fires callback", () => {
        let called = false;
        const reset = createTestReset([], {onReset: () => called = true});

        reset.reset();
        expect(called).toBe(true);
    });

    test("it ignores null things", () => {
        const reset = createTestReset([{a: null}]);
        expect(() => reset.reset()).not.toThrow();
    });

    test("it ignores non-objects", () => {
        const reset = createTestReset([{a: () => {}, b: 2, c: "hi"}]);
        expect(() => reset.reset()).not.toThrow();
    });

    test("it ignores Formula objects", () => {
        const _formula = Formula.variable(10);
        const formula = new Proxy(_formula, {
        has(_, key) {
            if (key === SkipPersistence) {
                throw("oh no")
            }
            return true;
        },
        })

        const reset = createTestReset([{formula}]);
        expect(() => reset.reset()).not.toThrow();
    });

    test("It ignores Decimal objects", () => {
        const _decimal = Decimal.fromNumber(100);
        const decimal = new Proxy(_decimal, {
        has(_, key) {
            if (key === SkipPersistence) {
                throw("oh no")
            }
            return true;
        },
        })

        const reset = createTestReset([{decimal}]);
        expect(() => reset.reset()).not.toThrow();
    });

    test("It ignores objects marked as SkipPersistence", () => {
        const upgrade = createUpgrade(() => ({
            requirements: [],
            [SkipPersistence]: true
        }))
        
        upgrade.bought.value = true;
        const reset = createTestReset([upgrade]);
        reset.reset();

        expect(upgrade.bought.value).toBe(true);
    });

    test("It sets with a DefaultValue to DefaultValue", () => {
        const resource = createResource<number>(0);
        resource[DefaultValue] = 123;

        const reset = createTestReset([{resource}]);
        reset.reset();

        expect(resource.value).toEqual(123);
    });
});
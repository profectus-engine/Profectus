import { CoercableComponent, JSXFunction } from "features/feature";
import Formula, { printFormula } from "game/formulas/formulas";
import {
    createAdditiveModifier,
    createExponentialModifier,
    createModifierSection,
    createMultiplicativeModifier,
    createSequentialModifier,
    Modifier
} from "game/modifiers";
import Decimal, { DecimalSource } from "util/bignum";
import { WithRequired } from "util/common";
import { Computable } from "util/computed";
import { beforeAll, describe, expect, test } from "vitest";
import { Ref, ref, unref } from "vue";
import "../utils";

export type ModifierConstructorOptions = {
    [S in "addend" | "multiplier" | "exponent"]: Computable<DecimalSource>;
} & {
    description?: Computable<CoercableComponent>;
    enabled?: Computable<boolean>;
    smallerIsBetter?: boolean;
};

function testModifiers<
    T extends "addend" | "multiplier" | "exponent",
    S extends ModifierConstructorOptions
>(
    modifierConstructor: (optionsFunc: () => S) => WithRequired<Modifier, "invert" | "getFormula">,
    property: T,
    operation: (lhs: DecimalSource, rhs: DecimalSource) => DecimalSource
) {
    // Util because adding [property] messes up typing
    function createModifier(
        value: Computable<DecimalSource>,
        options: Partial<ModifierConstructorOptions> = {}
    ): WithRequired<Modifier, "invert" | "getFormula"> {
        options[property] = value;
        return modifierConstructor(() => options as S);
    }

    describe("operations", () => {
        let modifier: WithRequired<Modifier, "invert" | "getFormula">;
        beforeAll(() => {
            modifier = createModifier(ref(5));
        });

        test("Applies correctly", () =>
            expect(modifier.apply(10)).compare_tolerance(operation(10, 5)));
        test("Inverts correctly", () =>
            expect(modifier.invert(operation(10, 5))).compare_tolerance(10));
        test("getFormula returns the right formula", () => {
            const value = ref(10);
            expect(printFormula(modifier.getFormula(Formula.variable(value)))).toBe(
                `${operation.name}(x, 5.00)`
            );
        });
    });

    describe("applies description correctly", () => {
        test("without description", () => expect(createModifier(0).description).toBeUndefined());
        test("with description", () => {
            const desc = createModifier(0, { description: "test" }).description;
            expect(desc).not.toBeUndefined();
            expect((desc as JSXFunction)()).toMatchSnapshot();
        });
    });

    describe("applies enabled correctly", () => {
        test("without enabled", () => expect(createModifier(0).enabled).toBeUndefined());
        test("with enabled", () => {
            const enabled = ref(false);
            const modifier = createModifier(5, { enabled });
            expect(modifier.enabled).toBe(enabled);
        });
    });

    describe("applies smallerIsBetter correctly", () => {
        describe("without smallerIsBetter false", () => {
            test("negative value", () =>
                expect(
                    (
                        createModifier(-5, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("zero value", () =>
                expect(
                    (
                        createModifier(0, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("positive value", () =>
                expect(
                    (
                        createModifier(5, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
        });
        describe("with smallerIsBetter true", () => {
            test("negative value", () =>
                expect(
                    (
                        createModifier(-5, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("zero value", () =>
                expect(
                    (
                        createModifier(0, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("positive value", () =>
                expect(
                    (
                        createModifier(5, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
        });
    });
}

describe("Additive Modifiers", () => testModifiers(createAdditiveModifier, "addend", Decimal.add));
describe("Multiplicative Modifiers", () =>
    testModifiers(createMultiplicativeModifier, "multiplier", Decimal.mul));
describe("Exponential Modifiers", () =>
    testModifiers(createExponentialModifier, "exponent", Decimal.pow));

describe("Sequential Modifiers", () => {
    function createModifier(
        value: Computable<DecimalSource>,
        options: Partial<ModifierConstructorOptions> = {}
    ): WithRequired<Modifier, "invert" | "getFormula"> {
        return createSequentialModifier(() => [
            createAdditiveModifier(() => ({ ...options, addend: value })),
            createMultiplicativeModifier(() => ({ ...options, multiplier: value })),
            createExponentialModifier(() => ({ ...options, exponent: value }))
        ]);
    }

    describe("operations", () => {
        let modifier: WithRequired<Modifier, "invert" | "getFormula">;
        beforeAll(() => {
            modifier = createModifier(5);
        });

        test("Applies correctly", () =>
            expect(modifier.apply(10)).compare_tolerance(Decimal.add(10, 5).times(5).pow(5)));
        test("Inverts correctly", () =>
            expect(modifier.invert(Decimal.add(10, 5).times(5).pow(5))).compare_tolerance(10));
        test("getFormula returns the right formula", () => {
            const value = ref(10);
            expect(printFormula(modifier.getFormula(Formula.variable(value)))).toBe(
                `pow(mul(add(x, 5.00), 5.00), 5.00)`
            );
        });
    });

    describe("applies description correctly", () => {
        test("without description", () => expect(createModifier(0).description).toBeUndefined());
        test("with description", () => {
            const desc = createModifier(0, { description: "test" }).description;
            expect(desc).not.toBeUndefined();
            expect((desc as JSXFunction)()).toMatchSnapshot();
        });
        test("with both", () => {
            const desc = createSequentialModifier(() => [
                createAdditiveModifier(() => ({ addend: 0 })),
                createMultiplicativeModifier(() => ({ multiplier: 0, description: "test" }))
            ]).description;
            expect(desc).not.toBeUndefined();
            expect((desc as JSXFunction)()).toMatchSnapshot();
        });
    });

    describe("applies enabled correctly", () => {
        test("without enabled", () => expect(createModifier(0).enabled).toBeUndefined());
        test("with enabled", () => {
            const enabled = ref(false);
            const modifier = createModifier(5, { enabled });
            expect(modifier.enabled).not.toBeUndefined();
            expect(unref(modifier.enabled)).toBe(false);
            enabled.value = true;
            expect(unref(modifier.enabled)).toBe(true);
        });
        test("with both", () => {
            const enabled = ref(false);
            const modifier = createSequentialModifier(() => [
                createAdditiveModifier(() => ({ addend: 0 })),
                createMultiplicativeModifier(() => ({ multiplier: 0, enabled }))
            ]);
            expect(modifier.enabled).not.toBeUndefined();
            // So long as one is true or undefined, enable should be true
            expect(unref(modifier.enabled)).toBe(true);
        });
    });

    describe("applies smallerIsBetter correctly", () => {
        describe("without smallerIsBetter false", () => {
            test("negative value", () =>
                expect(
                    (
                        createModifier(-5, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("zero value", () =>
                expect(
                    (
                        createModifier(0, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("positive value", () =>
                expect(
                    (
                        createModifier(5, { description: "test", smallerIsBetter: false })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
        });
        describe("with smallerIsBetter true", () => {
            test("negative value", () =>
                expect(
                    (
                        createModifier(-5, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("zero value", () =>
                expect(
                    (
                        createModifier(0, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
            test("positive value", () =>
                expect(
                    (
                        createModifier(5, { description: "test", smallerIsBetter: true })
                            .description as JSXFunction
                    )()
                ).toMatchSnapshot());
        });
        describe("with both", () => {
            let value: Ref<DecimalSource>;
            let modifier: Modifier;
            beforeAll(() => {
                value = ref(0);
                modifier = createSequentialModifier(() => [
                    createAdditiveModifier(() => ({
                        addend: value,
                        description: "test",
                        smallerIsBetter: true
                    })),
                    createAdditiveModifier(() => ({
                        addend: value,
                        description: "test",
                        smallerIsBetter: false
                    }))
                ]);
            });
            test("negative value", () => {
                value.value = -5;
                expect((modifier.description as JSXFunction)()).toMatchSnapshot();
            });
            test("zero value", () => {
                value.value = 0;
                expect((modifier.description as JSXFunction)()).toMatchSnapshot();
            });
            test("positive value", () => {
                value.value = 5;
                expect((modifier.description as JSXFunction)()).toMatchSnapshot();
            });
        });
    });
});

describe("Create modifier sections", () => {
    test("No optional values", () =>
        expect(
            createModifierSection({
                title: "Test",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" }))
            })
        ).toMatchSnapshot());
    test("With subtitle", () =>
        expect(
            createModifierSection({
                title: "Test",
                subtitle: "Subtitle",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" }))
            })
        ).toMatchSnapshot());
    test("With base", () =>
        expect(
            createModifierSection({
                title: "Test",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" })),
                base: 10
            })
        ).toMatchSnapshot());
    test("With unit", () =>
        expect(
            createModifierSection({
                title: "Test",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" })),
                unit: "/s"
            })
        ).toMatchSnapshot());
    test("With base", () =>
        expect(
            createModifierSection({
                title: "Test",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" })),
                baseText: "Based on"
            })
        ).toMatchSnapshot());
    test("With baseText", () =>
        expect(
            createModifierSection({
                title: "Test",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" })),
                baseText: "Based on"
            })
        ).toMatchSnapshot());
    describe("With smallerIsBetter", () => {
        test("smallerIsBetter = false", () => {
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: -5,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: false
                })
            ).toMatchSnapshot();
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: 0,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: false
                })
            ).toMatchSnapshot();
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: 5,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: false
                })
            ).toMatchSnapshot();
        });
        test("smallerIsBetter = true", () => {
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: -5,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: true
                })
            ).toMatchSnapshot();
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: 0,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: true
                })
            ).toMatchSnapshot();
            expect(
                createModifierSection({
                    title: "Test",
                    modifier: createAdditiveModifier(() => ({
                        addend: 5,
                        description: "Test Desc"
                    })),
                    smallerIsBetter: true
                })
            ).toMatchSnapshot();
        });
    });
    test("With everything", () =>
        expect(
            createModifierSection({
                title: "Test",
                subtitle: "Subtitle",
                modifier: createAdditiveModifier(() => ({ addend: 5, description: "Test Desc" })),
                base: 10,
                unit: "/s",
                baseText: "Based on",
                smallerIsBetter: true
            })
        ).toMatchSnapshot());
});

import Formula, { InvertibleFormula } from "game/formulas";
import Decimal, { DecimalSource } from "util/bignum";
import { beforeAll, describe, expect, test } from "vitest";
import { ref } from "vue";

type FormulaFunctions = keyof Formula & keyof typeof Formula & keyof typeof Decimal;

interface FixedLengthArray<T, L extends number> extends ArrayLike<T> {
    length: L;
}

function compare_tolerance(value: DecimalSource) {
    return (other: DecimalSource) => Decimal.eq_tolerance(value, other);
}

function testConstant(
    desc: string,
    formulaFunc: () => InvertibleFormula,
    expectedValue: DecimalSource = 10
) {
    describe(desc, () => {
        let formula: Formula;
        beforeAll(() => {
            formula = formulaFunc();
        });
        test("evaluates correctly", () => expect(formula.evaluate()).toEqual(expectedValue));
        test("inverts correctly", () => expect(formula.invert(10)).toEqual(expectedValue));
        test("is invertible", () => expect(formula.invertible).toBe(true));
        test("is not marked as having a variable", () => expect(formula.hasVariable).toBe(false));
    });
}

// Utility function that will test all the different
// It's a lot of tests, but I'd rather be exhaustive
function testFormula<T extends FormulaFunctions>(
    functionNames: readonly T[],
    args: Readonly<FixedLengthArray<number, Parameters<typeof Formula[T]>["length"]>>,
    invertible = true
) {
    let value: Decimal;

    beforeAll(() => {
        value = testValueFormulas[args[0]].evaluate();
    });

    functionNames.forEach(name => {
        let testName = name + "(";
        for (let i = 0; i < args.length; i++) {
            if (i !== 0) {
                testName += ", ";
            }
            testName += testValues[args[i]];
        }
        testName += ")";
        describe(testName, () => {
            let expectedEvaluation: Decimal | undefined;
            let formulaArgs: Formula[];
            let staticFormula: Formula;
            let instanceFormula: Formula;
            beforeAll(() => {
                for (let i = 0; i < args.length; i++) {
                    formulaArgs.push(testValueFormulas[args[i]]);
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                staticFormula = Formula[name](...formulaArgs);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                instanceFormula = formulaArgs[0][name](...formulaArgs.slice(1));

                try {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    expectedEvaluation = Decimal[name](...args);
                } catch {
                    // If this is an invalid Decimal operation, then ignore this test case
                    return;
                }
            });

            test("Static formula is not marked as having a variable", () =>
                expect(staticFormula.hasVariable).toBe(false));
            test("Static function evaluates correctly", () =>
                expectedEvaluation != null &&
                expect(staticFormula.evaluate()).toSatisfy(compare_tolerance(expectedEvaluation)));
            test("Static function invertible", () =>
                expect(staticFormula.invertible).toBe(invertible));
            if (invertible) {
                test("Static function inverts correctly", () =>
                    expectedEvaluation != null &&
                    !Decimal.isNaN(expectedEvaluation) &&
                    expect(staticFormula.invert(expectedEvaluation)).toSatisfy(
                        compare_tolerance(value)
                    ));
            }

            // Do those tests again but for non-static methods
            test("Instance formula is not marked as having a variable", () =>
                expect(instanceFormula.hasVariable).toBe(false));
            test("Instance function evaluates correctly", () =>
                expectedEvaluation != null &&
                expect(instanceFormula.evaluate()).toSatisfy(
                    compare_tolerance(expectedEvaluation)
                ));
            test("Instance function invertible", () =>
                expect(instanceFormula.invertible).toBe(invertible));
            if (invertible) {
                test("Instance function inverts correctly", () =>
                    expectedEvaluation != null &&
                    !Decimal.isNaN(expectedEvaluation) &&
                    expect(instanceFormula.invert(expectedEvaluation)).toSatisfy(
                        compare_tolerance(value)
                    ));
            }
        });
    });
}

const testValues = [-2.5, -1, -0.1, 0, 0.1, 1, 2.5] as const;
let testValueFormulas: InvertibleFormula[] = [];

const invertibleZeroParamFunctionNames = [
    ["neg", "negate", "negated"],
    ["recip", "reciprocal", "reciprocate"],
    ["log10"],
    ["log2"],
    ["ln"],
    ["pow10"],
    ["exp"],
    ["sqr"],
    ["sqrt"],
    ["cube"],
    ["cbrt"],
    ["lambertw"],
    ["ssqrt"],
    ["sin"],
    ["cos"],
    ["tan"],
    ["asin"],
    ["acos"],
    ["atan"],
    ["sinh"],
    ["cosh"],
    ["tanh"],
    ["asinh"],
    ["acosh"],
    ["atanh"]
] as const;

const nonInvertibleZeroParamFunctionNames = [
    ["abs"],
    ["sign", "sgn"],
    ["round"],
    ["floor"],
    ["ceil"],
    ["trunc"],
    ["pLog10"],
    ["absLog10"],
    ["factorial"],
    ["gamma"],
    ["lngamma"]
] as const;

const invertibleOneParamFunctionNames = [
    ["add", "plus"],
    ["sub", "subtract", "minus"],
    ["mul", "multiply", "times"],
    ["div", "divide"],
    ["log", "logarithm"],
    ["pow"],
    ["root"],
    ["slog"]
] as const;

const nonInvertibleOneParamFunctionNames = [
    ["max"],
    ["min"],
    ["maxabs"],
    ["minabs"],
    ["clampMin"],
    ["clampMax"],
    ["layeradd10"]
] as const;

const invertibleTwoParamFunctionNames = [["tetrate"]] as const;

const nonInvertibleTwoParamFunctionNames = [
    ["clamp"],
    ["iteratedexp"],
    ["iteratedlog"],
    ["layeradd"],
    ["pentate"]
] as const;

describe("Creating Formulas", () => {
    beforeAll(() => {
        testValueFormulas = testValues.map(v => Formula.constant(v));
    });

    describe("Constants", () => {
        testConstant("number", () => Formula.constant(10));
        testConstant("string", () => Formula.constant("10"));
        testConstant("formula", () => Formula.constant(Formula.constant(10)));
        testConstant("decimal", () => Formula.constant(new Decimal("1e400")), "1e400");
        testConstant("ref", () => Formula.constant(ref(10)));
    });

    describe("Invertible 0-param", () => {
        invertibleZeroParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                testFormula(names, [i] as const);
            }
        });
    });
    describe("Non-Invertible 0-param", () => {
        nonInvertibleZeroParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                testFormula(names, [i] as const, false);
            }
        });
    });
    describe("Invertible 1-param", () => {
        invertibleOneParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                for (let j = 0; j < testValues.length; j++) {
                    testFormula(names, [i, j] as const);
                }
            }
        });
    });
    describe("Non-Invertible 1-param", () => {
        nonInvertibleOneParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                for (let j = 0; j < testValues.length; j++) {
                    testFormula(names, [i, j] as const, false);
                }
            }
        });
    });
    describe("Invertible 2-param", () => {
        invertibleTwoParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                for (let j = 0; j < testValues.length; j++) {
                    for (let k = 0; k < testValues.length; k++) {
                        testFormula(names, [i, j, k] as const);
                    }
                }
            }
        });
    });
    describe("Non-Invertible 2-param", () => {
        nonInvertibleTwoParamFunctionNames.forEach(names => {
            for (let i = 0; i < testValues.length; i++) {
                for (let j = 0; j < testValues.length; j++) {
                    for (let k = 0; k < testValues.length; k++) {
                        testFormula(names, [i, j, k] as const, false);
                    }
                }
            }
        });
    });

    describe("Variables", () => {
        let variable: Formula;
        let constant: Formula;
        beforeAll(() => {
            variable = Formula.variable(10);
            constant = Formula.constant(10);
        });

        test("Created variable is marked as a variable", () =>
            expect(variable.hasVariable).toBe(true));
        test("Evaluate() returns variable's value", () =>
            expect(variable.evaluate()).toSatisfy(compare_tolerance(10)));
        test("Invert() is pass-through", () =>
            expect(variable.invert(100)).toSatisfy(compare_tolerance(100)));

        test("Nested variable is marked as having a variable", () =>
            expect(variable.add(10).div(3).pow(2).hasVariable).toBe(false));
        test("Nested non-variable is marked as not having a variable", () =>
            expect(constant.add(10).div(3).pow(2).hasVariable).toBe(false));

        describe("Invertible Formulas correctly calculate when they contain a variable", () => {
            function checkFormula(formula: Formula, expectedBool = true) {
                expect(formula.invertible).toBe(expectedBool);
                expect(formula.hasVariable).toBe(expectedBool);
            }
            invertibleZeroParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](variable)));
                });
            });
            invertibleOneParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var, const) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](variable, constant)));
                    test(`${name}(const, var) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](constant, variable)));
                    test(`${name}(var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable), false));
                });
            });
            invertibleTwoParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var, const, const) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](variable, constant, constant)));
                    test(`${name}(const, var, const) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](constant, variable, constant)));
                    test(`${name}(const, const, var) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](constant, constant, variable)));
                    test(`${name}(var, var, const) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable, constant), false));
                    test(`${name}(var, const, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, constant, variable), false));
                    test(`${name}(const, var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](constant, variable, variable), false));
                    test(`${name}(var, var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable, variable), false));
                });
            });
        });

        describe("Non-Invertible Formulas never marked as having a variable", () => {
            function checkFormula(formula: Formula) {
                expect(formula.invertible).toBe(false);
                expect(formula.hasVariable).toBe(false);
            }
            nonInvertibleZeroParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable)));
                });
            });
            nonInvertibleOneParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var, const) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, constant)));
                    test(`${name}(const, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](constant, variable)));
                    test(`${name}(var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable)));
                });
            });
            nonInvertibleTwoParamFunctionNames.flat().forEach(name => {
                describe(name, () => {
                    test(`${name}(var, const, const) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](variable, constant, constant)));
                    test(`${name}(const, var, const) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](constant, variable, constant)));
                    test(`${name}(const, const, var) is marked as invertible and having a variable`, () =>
                        checkFormula(Formula[name](constant, constant, variable)));
                    test(`${name}(var, var, const) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable, constant)));
                    test(`${name}(var, const, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, constant, variable)));
                    test(`${name}(const, var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](constant, variable, variable)));
                    test(`${name}(var, var, var) is marked as not invertible and not having a variable`, () =>
                        checkFormula(Formula[name](variable, variable, variable)));
                });
            });
        });
    });
});

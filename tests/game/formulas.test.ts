import Formula, { FormulaSource, InvertibleFormula } from "game/formulas";
import Decimal, { DecimalSource, format } from "util/bignum";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { ref } from "vue";

type FormulaFunctions = keyof Formula & keyof typeof Formula & keyof typeof Decimal;

interface FixedLengthArray<T, L extends number> extends ArrayLike<T> {
    length: L;
}

expect.extend({
    compare_tolerance(received, expected) {
        const { isNot } = this;
        return {
            // do not alter your "pass" based on isNot. Vitest does it for you
            pass: Decimal.eq_tolerance(received, expected),
            message: () =>
                `Expected ${received} to${
                    (isNot as boolean) ? " not" : ""
                } be close to ${expected}`,
            expected: format(expected),
            actual: format(received)
        };
    }
});

interface CustomMatchers<R = unknown> {
    compare_tolerance(expected: DecimalSource): R;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Vi {
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface Assertion extends CustomMatchers {}
        // eslint-disable-next-line @typescript-eslint/no-empty-interface
        interface AsymmetricMatchersContaining extends CustomMatchers {}
    }
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
        test("evaluates correctly", async () =>
            expect(formula.evaluate()).compare_tolerance(expectedValue));
        test("invert is pass-through", async () =>
            expect(formula.invert(25)).compare_tolerance(25));
        test("is invertible", async () => expect(formula.invertible).toBe(true));
        test("is not marked as having a variable", async () =>
            expect(formula.hasVariable).toBe(false));
    });
}

// Utility function that will test all the different
// It's a lot of tests, but I'd rather be exhaustive
function testFormula<T extends FormulaFunctions>(
    functionName: T,
    args: Readonly<FixedLengthArray<number, Parameters<typeof Formula[T]>["length"]>>,
    invertible = true
) {
    let value: Decimal;

    beforeAll(() => {
        value = testValueFormulas[args[0]].evaluate();
    });

    let testName = functionName + "(";
    for (let i = 0; i < args.length; i++) {
        if (i !== 0) {
            testName += ", ";
        }
        testName += testValues[args[i]];
    }
    testName += ")";
    describe(testName, () => {
        let expectedEvaluation: Decimal | undefined;
        const formulaArgs: Formula[] = [];
        let staticFormula: Formula;
        let instanceFormula: Formula;
        beforeAll(() => {
            for (let i = 0; i < args.length; i++) {
                formulaArgs.push(testValueFormulas[args[i]]);
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            staticFormula = Formula[functionName](...formulaArgs);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            instanceFormula = formulaArgs[0][functionName](...formulaArgs.slice(1));

            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                expectedEvaluation = Decimal[functionName](...args);
            } catch {
                // If this is an invalid Decimal operation, then ignore this test case
                return;
            }
        });

        test("Static formula is not marked as having a variable", async () =>
            expect(staticFormula.hasVariable).toBe(false));
        test("Static function evaluates correctly", async () =>
            expectedEvaluation != null &&
            expect(staticFormula.evaluate()).compare_tolerance(expectedEvaluation));
        test("Static function invertible", async () =>
            expect(staticFormula.invertible).toBe(invertible));
        if (invertible) {
            test("Static function inverts correctly", async () =>
                expectedEvaluation != null &&
                !Decimal.isNaN(expectedEvaluation) &&
                expect(staticFormula.invert(expectedEvaluation)).compare_tolerance(value));
        }

        // Do those tests again but for non-static methods
        test("Instance formula is not marked as having a variable", async () =>
            expect(instanceFormula.hasVariable).toBe(false));
        test("Instance function evaluates correctly", async () =>
            expectedEvaluation != null &&
            expect(instanceFormula.evaluate()).compare_tolerance(expectedEvaluation));
        test("Instance function invertible", async () =>
            expect(instanceFormula.invertible).toBe(invertible));
        if (invertible) {
            test("Instance function inverts correctly", async () =>
                expectedEvaluation != null &&
                !Decimal.isNaN(expectedEvaluation) &&
                expect(instanceFormula.invert(expectedEvaluation)).compare_tolerance(value));
        }
    });
}

function testAliases<T extends FormulaFunctions[]>(
    formula: Formula,
    aliases: T,
    args: FormulaSource[]
) {
    const spy = vi.spyOn(formula, aliases[0]);
    expect(spy).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    aliases.slice(1).forEach(name => formula[name](...args));
    expect(spy).toHaveBeenCalledTimes(aliases.length - 1);
}

const testValues = [-2.5, -1, -0.1, 0, 0.1, 1, 2.5] as const;
let testValueFormulas: InvertibleFormula[] = [];

const invertibleZeroParamFunctionNames = [
    "neg",
    "recip",
    "log10",
    "log2",
    "ln",
    "pow10",
    "exp",
    "sqr",
    "sqrt",
    "cube",
    "cbrt",
    "lambertw",
    "ssqrt",
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "sinh",
    "cosh",
    "tanh",
    "asinh",
    "acosh",
    "atanh"
] as const;

const nonInvertibleZeroParamFunctionNames = [
    "abs",
    "sign",
    "round",
    "floor",
    "ceil",
    "trunc",
    "pLog10",
    "absLog10",
    "factorial",
    "gamma",
    "lngamma"
] as const;

const invertibleOneParamFunctionNames = [
    "add",
    "sub",
    "mul",
    "div",
    "log",
    "pow",
    "root",
    "slog"
] as const;

const nonInvertibleOneParamFunctionNames = [
    "max",
    "min",
    "maxabs",
    "minabs",
    "clampMin",
    "clampMax",
    "layeradd10"
] as const;

const invertibleTwoParamFunctionNames = ["tetrate", "layeradd", "iteratedexp"] as const;

const nonInvertibleTwoParamFunctionNames = ["clamp", "iteratedlog", "pentate"] as const;

describe.concurrent("Creating Formulas", () => {
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

    // Test that these are just pass-throughts so we don't need to test each one everywhere else
    describe("Function aliases", () => {
        let formula: Formula;
        beforeAll(() => {
            formula = Formula.constant(10);
        });
        test("neg", async () => testAliases(formula, ["neg", "negate", "negated"], [0]));
        test("recip", async () =>
            testAliases(formula, ["recip", "reciprocal", "reciprocate"], [0]));
        test("sign", async () => testAliases(formula, ["sign", "sgn"], [0]));
        test("add", async () => testAliases(formula, ["add", "plus"], [0]));
        test("sub", async () => testAliases(formula, ["sub", "subtract", "minus"], [0]));
        test("mul", async () => testAliases(formula, ["mul", "multiply", "times"], [0]));
        test("div", async () => testAliases(formula, ["div", "divide"], [1]));
        test("log", async () => testAliases(formula, ["log", "logarithm"], [0]));
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
});

describe("Variables", () => {
    let variable: Formula;
    let constant: Formula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("Created variable is marked as a variable", () => expect(variable.hasVariable).toBe(true));
    test("Evaluate() returns variable's value", () =>
        expect(variable.evaluate()).compare_tolerance(10));
    test("Invert() is pass-through", () => expect(variable.invert(100)).compare_tolerance(100));

    test("Nested variable is marked as having a variable", () =>
        expect(variable.add(10).div(3).pow(2).hasVariable).toBe(true));
    test("Nested non-variable is marked as not having a variable", () =>
        expect(constant.add(10).div(3).pow(2).hasVariable).toBe(false));

    describe("Invertible Formulas correctly calculate when they contain a variable", () => {
        function checkFormula(formula: Formula, expectedBool = true) {
            expect(formula.invertible).toBe(expectedBool);
            expect(formula.hasVariable).toBe(expectedBool);
        }
        invertibleZeroParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as invertible and having a variable`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        invertibleOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as invertible and having a variable`, () =>
                    checkFormula(Formula[name](variable, constant)));
                test(`${name}(const, var) is marked as invertible and having a variable`, () =>
                    checkFormula(Formula[name](constant, variable)));
                test(`${name}(var, var) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](variable, variable), false));
            });
        });
        invertibleTwoParamFunctionNames.forEach(name => {
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
        nonInvertibleZeroParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        nonInvertibleOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](variable, constant)));
                test(`${name}(const, var) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](constant, variable)));
                test(`${name}(var, var) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](variable, variable)));
            });
        });
        nonInvertibleTwoParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const, const) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](variable, constant, constant)));
                test(`${name}(const, var, const) is marked as not invertible and not having a variable`, () =>
                    checkFormula(Formula[name](constant, variable, constant)));
                test(`${name}(const, const, var) is marked as not invertible and not having a variable`, () =>
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

    describe("Inverting calculates the value of the variable", () => {
        let variable: Formula;
        let constant: Formula;
        beforeAll(() => {
            variable = Formula.variable(2);
            constant = Formula.constant(3);
        });
        invertibleOneParamFunctionNames.forEach(name =>
            describe(name, () => {
                test(`${name}(var, const).invert()`, () => {
                    const formula = Formula[name](variable, constant);
                    const result = formula.evaluate();
                    expect(formula.invert(result)).compare_tolerance(2);
                });
                test(`${name}(const, var).invert()`, () => {
                    const formula = Formula[name](constant, variable);
                    const result = formula.evaluate();
                    expect(formula.invert(result)).compare_tolerance(2);
                });
            })
        );
        invertibleTwoParamFunctionNames.forEach(name =>
            describe(name, () => {
                test(`${name}(var, const, const).invert()`, () => {
                    const formula = Formula[name](variable, constant, constant);
                    const result = formula.evaluate();
                    expect(formula.invert(result)).compare_tolerance(2);
                });
                test(`${name}(const, var, const).invert()`, () => {
                    const formula = Formula[name](constant, variable, constant);
                    const result = formula.evaluate();
                    expect(formula.invert(result)).compare_tolerance(2);
                });
                test(`${name}(const, const, var).invert()`, () => {
                    const formula = Formula[name](constant, constant, variable);
                    const result = formula.evaluate();
                    expect(formula.invert(result)).compare_tolerance(2);
                });
            })
        );
    });
});

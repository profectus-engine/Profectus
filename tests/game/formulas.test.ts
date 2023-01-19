import Formula, { GenericFormula, InvertibleFormula, unrefFormulaSource } from "game/formulas";
import Decimal, { DecimalSource, format } from "util/bignum";
import { beforeAll, describe, expect, test } from "vitest";
import { Ref, ref } from "vue";

type FormulaFunctions = keyof GenericFormula & keyof typeof Formula & keyof typeof Decimal;

expect.extend({
    compare_tolerance(received, expected) {
        const { isNot } = this;
        let pass = false;
        if (!Decimal.isFinite(expected)) {
            pass = !Decimal.isFinite(received);
        } else if (Decimal.isNaN(expected)) {
            pass = Decimal.isNaN(received);
        } else {
            pass = Decimal.eq_tolerance(received, expected);
        }
        return {
            // do not alter your "pass" based on isNot. Vitest does it for you
            pass,
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
        let formula: GenericFormula;
        beforeAll(() => {
            formula = formulaFunc();
        });
        test("Evaluates correctly", () =>
            expect(formula.evaluate()).compare_tolerance(expectedValue));
        test("Invert is pass-through", () => expect(formula.invert(25)).compare_tolerance(25));
        test("Is not marked as having a variable", () => expect(formula.hasVariable()).toBe(false));
    });
}

function testFormula<T extends FormulaFunctions>(
    functionName: T,
    args: Readonly<Parameters<typeof Formula[T]>>,
    invertible = true
) {
    let formula: GenericFormula;
    beforeAll(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        formula = Formula[functionName](...args);
    });
    test("Formula is not marked as having a variable", () =>
        expect(formula.hasVariable()).toBe(false));
    test(`Formula is${invertible ? "" : " not"} invertible`, () =>
        expect(formula.isInvertible()).toBe(invertible));
    if (invertible) {
        test(`Formula throws if inverting without any variables`, () =>
            expect(() => formula.invert(10)).toThrow());
    }
}

// Utility function that will test all the different
// It's a lot of tests, but I'd rather be exhaustive
function testFormulaCall<T extends FormulaFunctions>(
    functionName: T,
    args: Readonly<Parameters<typeof Formula[T]>>
) {
    let testName = functionName + "(";
    for (let i = 0; i < args.length; i++) {
        if (i !== 0) {
            testName += ", ";
        }
        testName += args[i];
    }
    testName += ") evaluates correctly";
    test(testName, () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const formula = Formula[functionName](...args);

        try {
            const expectedEvaluation = Decimal[functionName](
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                ...args.map(i => unrefFormulaSource(i))
            );
            if (expectedEvaluation != null) {
                expect(formula.evaluate()).compare_tolerance(expectedEvaluation);
            }
        } catch {
            // If this is an invalid Decimal operation, then ignore this test case
        }
    });
}

function testAliases<T extends FormulaFunctions>(
    aliases: T[],
    args: Parameters<typeof Formula[T]>
) {
    describe(aliases[0], () => {
        let formula: GenericFormula;
        beforeAll(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            formula = Formula[aliases[0]](...args);
        });

        aliases.slice(1).forEach(alias => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            test(alias, () => expect(Formula[alias](...args).equals(formula)).toBe(true));
        });
    });
}

const testValues = ["-1e400", 0, 0.25] as const;

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

describe("Formula Equality Checking", () => {
    describe("Equality Checks", () => {
        test("Equals", () => Formula.add(1, 1).equals(Formula.add(1, 1)));
        test("Not Equals due to inputs", () => Formula.add(1, 1).equals(Formula.add(1, 0)));
        test("Not Equals due to functions", () => Formula.add(1, 1).equals(Formula.sub(1, 1)));
        test("Not Equals due to hasVariable", () =>
            Formula.constant(1).equals(Formula.variable(1)));
    });

    describe("Formula aliases", () => {
        testAliases(["neg", "negate", "negated"], [1]);
        testAliases(["recip", "reciprocal", "reciprocate"], [1]);
        testAliases(["sign", "sgn"], [1]);
        testAliases(["add", "plus"], [1, 1]);
        testAliases(["sub", "subtract", "minus"], [1, 1]);
        testAliases(["mul", "multiply", "times"], [1, 1]);
        testAliases(["div", "divide"], [1, 1]);
        testAliases(["log", "logarithm"], [1, 1]);
    });

    describe("Instance vs Static methods", () => {
        let formula: GenericFormula;
        beforeAll(() => {
            formula = Formula.constant(10);
        });
        [...invertibleZeroParamFunctionNames, ...nonInvertibleZeroParamFunctionNames].forEach(
            name => {
                test(name, () => {
                    const instanceFormula = formula[name]();
                    const staticFormula = Formula[name](formula);
                    expect(instanceFormula.equals(staticFormula)).toBe(true);
                });
            }
        );

        [...invertibleOneParamFunctionNames, ...nonInvertibleOneParamFunctionNames].forEach(
            name => {
                test(name, () => {
                    const instanceFormula = formula[name](10);
                    const staticFormula = Formula[name](formula, 10);
                    expect(instanceFormula.equals(staticFormula)).toBe(true);
                });
            }
        );

        [...invertibleTwoParamFunctionNames, ...nonInvertibleTwoParamFunctionNames].forEach(
            name => {
                test(name, () => {
                    const instanceFormula = formula[name](1, 1);
                    const staticFormula = Formula[name](formula, 1, 1);
                    expect(instanceFormula.equals(staticFormula)).toBe(true);
                });
            }
        );
    });
});

describe("Creating Formulas", () => {
    describe("Constants", () => {
        testConstant("number", () => Formula.constant(10));
        testConstant("string", () => Formula.constant("10"));
        testConstant("formula", () => Formula.constant(Formula.constant(10)));
        testConstant("decimal", () => Formula.constant(new Decimal("1e400")), "1e400");
        testConstant("ref", () => Formula.constant(ref(10)));
    });

    describe("Invertible 0-param", () => {
        invertibleZeroParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0] as const);
                testValues.forEach(i => testFormulaCall(names, [i] as const));
            })
        );
    });
    describe("Non-Invertible 0-param", () => {
        nonInvertibleZeroParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0] as const, false);
                testValues.forEach(i => testFormulaCall(names, [i] as const));
            })
        );
    });
    describe("Invertible 1-param", () => {
        invertibleOneParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0, 0] as const);
                testValues.forEach(i =>
                    testValues.forEach(j => testFormulaCall(names, [i, j] as const))
                );
            })
        );
    });
    describe("Non-Invertible 1-param", () => {
        nonInvertibleOneParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0, 0] as const, false);
                testValues.forEach(i =>
                    testValues.forEach(j => testFormulaCall(names, [i, j] as const))
                );
            })
        );
    });
    describe("Invertible 2-param", () => {
        invertibleTwoParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0, 0, 0] as const);
                testValues.forEach(i =>
                    testValues.forEach(j =>
                        testValues.forEach(k => testFormulaCall(names, [i, j, k] as const))
                    )
                );
            })
        );
    });
    describe("Non-Invertible 2-param", () => {
        nonInvertibleTwoParamFunctionNames.forEach(names =>
            describe(names, () => {
                testFormula(names, [0, 0, 0] as const, false);
                testValues.forEach(i =>
                    testValues.forEach(j =>
                        testValues.forEach(k => testFormulaCall(names, [i, j, k] as const))
                    )
                );
            })
        );
    });
});

describe("Variables", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("Created variable is marked as a variable", () =>
        expect(variable.hasVariable()).toBe(true));
    test("Evaluate() returns variable's value", () =>
        expect(variable.evaluate()).compare_tolerance(10));
    test("Invert() is pass-through", () => expect(variable.invert(100)).compare_tolerance(100));

    test("Nested variable is marked as having a variable", () =>
        expect(variable.add(10).div(3).pow(2).hasVariable()).toBe(true));
    test("Nested non-variable is marked as not having a variable", () =>
        expect(constant.add(10).div(3).pow(2).hasVariable()).toBe(false));

    describe("Invertible Formulas correctly calculate when they contain a variable", () => {
        function checkFormula(formula: GenericFormula, expectedBool = true) {
            expect(formula.isInvertible()).toBe(expectedBool);
            expect(formula.hasVariable()).toBe(expectedBool);
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
        function checkFormula(formula: GenericFormula) {
            expect(formula.isInvertible()).toBe(false);
            expect(formula.hasVariable()).toBe(false);
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
        let variable: GenericFormula;
        let constant: GenericFormula;
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

describe("Step-wise", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("Formula without variable is marked as such", () => {
        expect(Formula.step(constant, 10, value => Formula.sqrt(value)).isInvertible()).toBe(true);
        expect(Formula.step(constant, 10, value => Formula.sqrt(value)).hasVariable()).toBe(false);
    });

    test("Formula with variable is marked as such", () => {
        expect(Formula.step(variable, 10, value => Formula.sqrt(value)).isInvertible()).toBe(true);
        expect(Formula.step(variable, 10, value => Formula.sqrt(value)).hasVariable()).toBe(true);
    });

    test("Non-invertible formula modifier marks formula as such", () => {
        expect(Formula.step(constant, 10, value => Formula.abs(value)).isInvertible()).toBe(false);
        expect(Formula.step(constant, 10, value => Formula.abs(value)).hasVariable()).toBe(false);
    });

    test("Formula modifiers with variables mark formula as non-invertible", () => {
        expect(
            Formula.step(constant, 10, value => Formula.add(value, variable)).isInvertible()
        ).toBe(false);
        expect(
            Formula.step(constant, 10, value => Formula.add(value, variable)).hasVariable()
        ).toBe(false);
    });

    describe("Pass-through underneath start", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.step(constant, 20, value => Formula.sqrt(value)).evaluate()
            ).compare_tolerance(10));
        test("Inverts correctly with variable in input", () =>
            expect(
                Formula.step(variable, 20, value => Formula.sqrt(value)).invert(10)
            ).compare_tolerance(10));
    });

    describe("Evaluates correctly beyond start", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.step(variable, 8, value => Formula.add(value, 2)).evaluate()
            ).compare_tolerance(12));
        test("Inverts correctly", () =>
            expect(
                Formula.step(variable, 8, value => Formula.add(value, 2)).invert(12)
            ).compare_tolerance(10));
    });
});

describe("Conditionals", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("Formula without variable is marked as such", () => {
        expect(Formula.if(constant, true, value => Formula.sqrt(value)).isInvertible()).toBe(true);
        expect(Formula.if(constant, true, value => Formula.sqrt(value)).hasVariable()).toBe(false);
    });

    test("Formula with variable is marked as such", () => {
        expect(Formula.if(variable, true, value => Formula.sqrt(value)).isInvertible()).toBe(true);
        expect(Formula.if(variable, true, value => Formula.sqrt(value)).hasVariable()).toBe(true);
    });

    test("Non-invertible formula modifier marks formula as such", () => {
        expect(Formula.if(constant, true, value => Formula.abs(value)).isInvertible()).toBe(false);
        expect(Formula.if(constant, true, value => Formula.abs(value)).hasVariable()).toBe(false);
    });

    test("Formula modifiers with variables mark formula as non-invertible", () => {
        expect(
            Formula.if(constant, true, value => Formula.add(value, variable)).isInvertible()
        ).toBe(false);
        expect(
            Formula.if(constant, true, value => Formula.add(value, variable)).hasVariable()
        ).toBe(false);
    });

    describe("Pass-through with condition false", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.if(constant, false, value => Formula.sqrt(value)).evaluate()
            ).compare_tolerance(10));
        test("Inverts correctly with variable in input", () =>
            expect(
                Formula.if(variable, false, value => Formula.sqrt(value)).invert(10)
            ).compare_tolerance(10));
    });

    describe("Evaluates correctly with condition true", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.if(variable, true, value => Formula.add(value, 2)).evaluate()
            ).compare_tolerance(12));
        test("Inverts correctly", () =>
            expect(
                Formula.if(variable, true, value => Formula.add(value, 2)).invert(12)
            ).compare_tolerance(10));
    });
});

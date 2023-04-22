import { createResource, Resource } from "features/resources/resource";
import Formula, {
    calculateCost,
    calculateMaxAffordable,
    unrefFormulaSource
} from "game/formulas/formulas";
import type { GenericFormula, InvertibleFormula } from "game/formulas/types";
import Decimal, { DecimalSource } from "util/bignum";
import { beforeAll, describe, expect, test } from "vitest";
import { ref } from "vue";
import "../utils";

type FormulaFunctions = keyof GenericFormula & keyof typeof Formula & keyof typeof Decimal;

const testValues = [-1, "0", Decimal.dOne] as const;

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
    "atanh",
    "slog",
    "tetrate",
    "iteratedexp"
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
const integrableZeroParamFunctionNames = [
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
const nonIntegrableZeroParamFunctionNames = [
    ...nonInvertibleZeroParamFunctionNames,
    "lambertw",
    "ssqrt"
] as const;
const invertibleIntegralZeroPramFunctionNames = [
    "recip",
    "log10",
    "log2",
    "ln",
    "pow10",
    "sqr",
    "sqrt",
    "cube",
    "cbrt",
    "neg",
    "exp",
    "sin",
    "cos",
    "tan",
    "sinh",
    "cosh",
    "tanh"
] as const;
const nonInvertibleIntegralZeroPramFunctionNames = [
    ...nonIntegrableZeroParamFunctionNames,
    "asin",
    "acos",
    "atan",
    "asinh",
    "acosh",
    "atanh"
] as const;

const invertibleOneParamFunctionNames = [
    "add",
    "sub",
    "mul",
    "div",
    "log",
    "pow",
    "root",
    "layeradd"
] as const;
const nonInvertibleOneParamFunctionNames = ["layeradd10"] as const;
const integrableOneParamFunctionNames = ["add", "sub", "mul", "div", "log", "pow", "root"] as const;
const nonIntegrableOneParamFunctionNames = [...nonInvertibleOneParamFunctionNames, "slog"] as const;
const invertibleIntegralOneParamFunctionNames = integrableOneParamFunctionNames;
const nonInvertibleIntegralOneParamFunctionNames = nonIntegrableOneParamFunctionNames;

const nonInvertibleTwoParamFunctionNames = ["iteratedlog", "pentate"] as const;
const nonIntegrableTwoParamFunctionNames = nonInvertibleTwoParamFunctionNames;
const nonInvertibleIntegralTwoParamFunctionNames = nonIntegrableTwoParamFunctionNames;

describe("Formula Equality Checking", () => {
    describe("Equality Checks", () => {
        test("Equals", () => expect(Formula.add(1, 1).equals(Formula.add(1, 1))).toBe(true));
        test("Not Equals due to inputs", () =>
            expect(Formula.add(1, 1).equals(Formula.add(1, 0))).toBe(false));
        test("Not Equals due to functions", () =>
            expect(Formula.add(1, 1).equals(Formula.sub(1, 1))).toBe(false));
        test("Not Equals due to hasVariable", () =>
            expect(Formula.constant(1).equals(Formula.variable(1))).toBe(false));
    });

    describe("Formula aliases", () => {
        function testAliases<T extends FormulaFunctions>(
            aliases: T[],
            args: Parameters<(typeof Formula)[T]>
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
    });
});

describe("Creating Formulas", () => {
    describe("Constants", () => {
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
                test("Is not invertible", () => expect(formula.isInvertible()).toBe(false));
                test("Is not integrable", () => expect(formula.isIntegrable()).toBe(false));
                test("Integral is not invertible", () =>
                    expect(formula.isIntegralInvertible()).toBe(false));
                test("Is not marked as having a variable", () =>
                    expect(formula.hasVariable()).toBe(false));
                test("Evaluates correctly", () =>
                    expect(formula.evaluate()).compare_tolerance(expectedValue));
                test("Invert throws", () => expect(() => formula.invert(25)).toThrow());
                test("Integrate throws", () => expect(() => formula.evaluateIntegral()).toThrow());
                test("Invert integral throws", () =>
                    expect(() => formula.invertIntegral(25)).toThrow());
            });
        }
        testConstant("number", () => Formula.constant(10));
        testConstant("string", () => Formula.constant("10"));
        testConstant("decimal", () => Formula.constant(new Decimal("1e400")), "1e400");
        testConstant("ref", () => Formula.constant(ref(10)));
    });

    function checkFormula<T extends FormulaFunctions>(
        functionName: T,
        args: Readonly<Parameters<(typeof Formula)[T]>>
    ) {
        let formula: GenericFormula;
        beforeAll(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            formula = Formula[functionName](...args);
        });
        // None of these formulas have variables, so they should all behave the same
        test("Is not marked as having a variable", () => expect(formula.hasVariable()).toBe(false));
        test("Is not invertible", () => expect(formula.isInvertible()).toBe(false));
        test(`Formula throws if trying to invert`, () =>
            expect(() => formula.invert(10)).toThrow());
        test("Is not integrable", () => expect(formula.isIntegrable()).toBe(false));
        test("Has a non-invertible integral", () =>
            expect(formula.isIntegralInvertible()).toBe(false));
    }

    // Utility function that will test all the different
    // It's a lot of tests, but I'd rather be exhaustive
    function testFormulaCall<T extends FormulaFunctions>(
        functionName: T,
        args: Readonly<Parameters<(typeof Formula)[T]>>
    ) {
        if ((functionName === "slog" || functionName === "layeradd") && args[0] === -1) {
            // These cases in particular take a long time, so skip them
            // We still have plenty of coverage
            return;
        }
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

    describe("0-param", () => {
        [...invertibleZeroParamFunctionNames, ...nonInvertibleZeroParamFunctionNames].forEach(
            names =>
                describe(names, () => {
                    checkFormula(names, [0] as const);
                    testValues.forEach(i => testFormulaCall(names, [i] as const));
                })
        );
    });
    describe("1-param", () => {
        (
            [
                ...invertibleOneParamFunctionNames,
                ...nonInvertibleOneParamFunctionNames,
                "max",
                "min",
                "maxabs",
                "minabs",
                "clampMin",
                "clampMax"
            ] as const
        ).forEach(names =>
            describe(names, () => {
                checkFormula(names, [0, 0] as const);
                testValues.forEach(i =>
                    testValues.forEach(j => testFormulaCall(names, [i, j] as const))
                );
            })
        );
    });
    describe("2-param", () => {
        ([...nonInvertibleTwoParamFunctionNames, "clamp"] as const).forEach(names =>
            describe(names, () => {
                checkFormula(names, [0, 0, 0] as const);
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
    test("evaluate() returns variable's value", () =>
        expect(variable.evaluate()).compare_tolerance(10));
    test("evaluate(variable) overrides variable value", () =>
        expect(variable.add(10).evaluate(20)).compare_tolerance(30));

    test("Nested variable is marked as having a variable", () =>
        expect(variable.add(10).div(3).pow(2).hasVariable()).toBe(true));
    test("Nested non-variable is marked as not having a variable", () =>
        expect(constant.add(10).div(3).pow(2).hasVariable()).toBe(false));
});

describe("Inverting", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("variable.invert() is pass-through", () =>
        expect(variable.invert(100)).compare_tolerance(100));

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
    });

    describe("Non-invertible formulas marked as such", () => {
        function checkFormula(formula: GenericFormula) {
            expect(formula.isInvertible()).toBe(false);
            expect(formula.isIntegrable()).toBe(false);
            expect(formula.isIntegralInvertible()).toBe(false);
        }
        nonInvertibleZeroParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        nonInvertibleOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable, constant)));
                test(`${name}(const, var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](constant, variable)));
                test(`${name}(var, var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable, variable)));
            });
        });
        nonInvertibleTwoParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const, const) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable, constant, constant)));
                test(`${name}(const, var, const) is marked as not invertible`, () =>
                    checkFormula(Formula[name](constant, variable, constant)));
                test(`${name}(const, const, var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](constant, constant, variable)));
                test(`${name}(var, var, const) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable, variable, constant)));
                test(`${name}(var, const, var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](variable, constant, variable)));
                test(`${name}(const, var, var) is marked as not invertible`, () =>
                    checkFormula(Formula[name](constant, variable, variable)));
                test(`${name}(var, var, var) is marked as not invertible`, () =>
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
                if (name !== "layeradd") {
                    test(`${name}(const, var).invert()`, () => {
                        const formula = Formula[name](constant, variable);
                        const result = formula.evaluate();
                        expect(formula.invert(result)).compare_tolerance(2);
                    });
                }
            })
        );
    });

    describe("Inverting pass-throughs", () => {
        test("max", () => expect(Formula.max(variable, constant).invert(10)).compare_tolerance(10));
        test("min", () => expect(Formula.min(variable, constant).invert(10)).compare_tolerance(10));
        test("minabs", () =>
            expect(Formula.minabs(variable, constant).invert(10)).compare_tolerance(10));
        test("maxabs", () =>
            expect(Formula.maxabs(variable, constant).invert(10)).compare_tolerance(10));
        test("clampMax", () =>
            expect(Formula.clampMax(variable, constant).invert(10)).compare_tolerance(10));
        test("clampMin", () =>
            expect(Formula.clampMin(variable, constant).invert(10)).compare_tolerance(10));
        test("clamp", () =>
            expect(Formula.clamp(variable, constant, constant).invert(10)).compare_tolerance(10));
    });

    test("Inverting nested formulas", () => {
        const formula = Formula.add(variable, constant).times(constant);
        expect(formula.invert(100)).compare_tolerance(0);
    });

    test("Inverting with non-invertible sections", () => {
        const formula = Formula.add(variable, constant.ceil());
        expect(formula.isInvertible()).toBe(true);
        expect(formula.invert(10)).compare_tolerance(0);
    });
});

describe("Integrating", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(ref(10));
        constant = Formula.constant(10);
    });

    test("variable.evaluateIntegral() calculates correctly", () =>
        expect(variable.evaluateIntegral()).compare_tolerance(Decimal.pow(10, 2).div(2)));
    test("variable.evaluateIntegral(variable) overrides variable value", () =>
        expect(variable.evaluateIntegral(20)).compare_tolerance(Decimal.pow(20, 2).div(2)));

    describe("Integrable functions marked as such", () => {
        function checkFormula(formula: GenericFormula) {
            expect(formula.isIntegrable()).toBe(true);
            expect(() => formula.evaluateIntegral()).to.not.throw();
        }
        integrableZeroParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as integrable`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        integrableOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as integrable`, () =>
                    checkFormula(Formula[name](variable, constant)));
                if (name !== "log" && name !== "root") {
                    test(`${name}(const, var) is marked as integrable`, () =>
                        checkFormula(Formula[name](constant, variable)));
                }
                test(`${name}(var, var) is marked as not integrable`, () =>
                    expect(Formula[name](variable, variable).isIntegrable()).toBe(false));
            });
        });
    });

    describe("Non-Integrable functions marked as such", () => {
        function checkFormula(formula: GenericFormula) {
            expect(formula.isIntegrable()).toBe(false);
        }
        nonIntegrableZeroParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        nonIntegrableOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, constant)));
                test(`${name}(const, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](constant, variable)));
                test(`${name}(var, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, variable)));
            });
        });
        nonIntegrableTwoParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const, const) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, constant, constant)));
                test(`${name}(const, var, const) is marked as not integrable`, () =>
                    checkFormula(Formula[name](constant, variable, constant)));
                test(`${name}(const, const, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](constant, constant, variable)));
                test(`${name}(var, var, const) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, variable, constant)));
                test(`${name}(var, const, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, constant, variable)));
                test(`${name}(const, var, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](constant, variable, variable)));
                test(`${name}(var, var, var) is marked as not integrable`, () =>
                    checkFormula(Formula[name](variable, variable, variable)));
            });
        });
    });

    // TODO I think these tests will require writing at least one known example for every function
    describe.todo("Integrable formulas integrate correctly");

    test("Integrating nested formulas", () => {
        const formula = Formula.add(variable, constant).times(constant).pow(2).times(30).add(10);
        const actualCost = new Array(10)
            .fill(null)
            .reduce((acc, _, i) => acc.add(formula.evaluate(i)), new Decimal(0));
        // Check if the calculated cost is within 10% of the actual cost,
        // because this is an approximation
        expect(
            Decimal.sub(
                actualCost,
                Decimal.add(formula.evaluateIntegral(), formula.calculateConstantOfIntegration())
            )
                .abs()
                .div(actualCost)
                .toNumber()
        ).toBeLessThan(0.1);
    });

    test("Integrating nested formulas with overidden variable", () => {
        const formula = Formula.add(variable, constant).times(constant).pow(2).times(30).add(10);
        const actualCost = new Array(20)
            .fill(null)
            .reduce((acc, _, i) => acc.add(formula.evaluate(i)), new Decimal(0));
        // Check if the calculated cost is within 10% of the actual cost,
        // because this is an approximation
        expect(
            Decimal.sub(
                actualCost,
                Decimal.add(formula.evaluateIntegral(20), formula.calculateConstantOfIntegration())
            )
                .abs()
                .div(actualCost)
                .toNumber()
        ).toBeLessThan(0.1);
    });

    test("Integrating nested complex formulas", () => {
        const formula = Formula.pow(1.05, variable).times(100).pow(0.5);
        expect(() => formula.evaluateIntegral()).toThrow();
    });
});

describe("Inverting integrals", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("variable.invertIntegral() calculates correctly", () =>
        expect(variable.invertIntegral(20)).compare_tolerance(
            Decimal.sqrt(20).times(Decimal.sqrt(2))
        ));

    describe("Invertible Integral functions marked as such", () => {
        function checkFormula(formula: GenericFormula) {
            expect(formula.isIntegralInvertible()).toBe(true);
            expect(() => formula.invertIntegral(10)).to.not.throw();
        }
        invertibleIntegralZeroPramFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as having an invertible integral`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        invertibleIntegralOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, constant)));
                if (name !== "log" && name !== "root") {
                    test(`${name}(const, var) is marked as having an invertible integral`, () =>
                        checkFormula(Formula[name](constant, variable)));
                }
                test(`${name}(var, var) is marked as not having an invertible integral`, () => {
                    const formula = Formula[name](variable, variable);
                    expect(formula.isIntegralInvertible()).toBe(false);
                    expect(() => formula.invertIntegral(10)).to.throw();
                });
            });
        });
    });

    describe("Non-Invertible integral functions marked as such", () => {
        function checkFormula(formula: GenericFormula) {
            expect(formula.isIntegralInvertible()).toBe(false);
        }
        nonInvertibleIntegralZeroPramFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable)));
            });
        });
        nonInvertibleIntegralOneParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, constant)));
                test(`${name}(const, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](constant, variable)));
                test(`${name}(var, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, variable)));
            });
        });
        nonInvertibleIntegralTwoParamFunctionNames.forEach(name => {
            describe(name, () => {
                test(`${name}(var, const, const) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, constant, constant)));
                test(`${name}(const, var, const) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](constant, variable, constant)));
                test(`${name}(const, const, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](constant, constant, variable)));
                test(`${name}(var, var, const) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, variable, constant)));
                test(`${name}(var, const, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, constant, variable)));
                test(`${name}(const, var, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](constant, variable, variable)));
                test(`${name}(var, var, var) is marked as not having an invertible integral`, () =>
                    checkFormula(Formula[name](variable, variable, variable)));
            });
        });
    });

    // TODO I think these tests will require writing at least one known example for every function
    describe.todo("Invertible Integral formulas invert correctly");

    test("Inverting integral of nested formulas", () => {
        const formula = Formula.add(variable, constant).times(constant).pow(2).times(30);
        expect(formula.invertIntegral(formula.evaluateIntegral())).compare_tolerance(10);
    });

    test("Inverting integral of nested complex formulas", () => {
        const formula = Formula.pow(1.05, variable).times(100).pow(0.5);
        expect(() => formula.invertIntegral(100)).toThrow();
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
        expect(Formula.step(constant, 10, value => Formula.sqrt(value)).isInvertible()).toBe(false);
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

    test("Formula never marked integrable", () => {
        expect(Formula.step(constant, 10, value => Formula.add(value, 10)).isIntegrable()).toBe(
            false
        );
        expect(() =>
            Formula.step(constant, 10, value => Formula.add(value, 10)).evaluateIntegral()
        ).toThrow();
    });

    test("Formula never marked as having an invertible integral", () => {
        expect(
            Formula.step(constant, 10, value => Formula.add(value, 10)).isIntegralInvertible()
        ).toBe(false);
        expect(() =>
            Formula.step(constant, 10, value => Formula.add(value, 10)).invertIntegral(10)
        ).toThrow();
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

    describe("Pass-through at boundary", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.step(constant, 10, value => Formula.sqrt(value)).evaluate()
            ).compare_tolerance(10));
        test("Inverts correctly with variable in input", () =>
            expect(
                Formula.step(variable, 10, value => Formula.sqrt(value)).invert(10)
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

    describe("Evaluates correctly when nested", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.add(variable, constant)
                    .step(10, value => Formula.mul(value, 2))
                    .sub(10)
                    .evaluate()
            ).compare_tolerance(20));
        test("Inverts correctly", () =>
            expect(
                Formula.add(variable, constant)
                    .step(10, value => Formula.mul(value, 2))
                    .sub(10)
                    .invert(30)
            ).compare_tolerance(15));
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
        expect(Formula.if(constant, true, value => Formula.sqrt(value)).isInvertible()).toBe(false);
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

    test("Formula never marked integrable", () => {
        expect(Formula.if(constant, true, value => Formula.add(value, 10)).isIntegrable()).toBe(
            false
        );
        expect(() =>
            Formula.if(constant, true, value => Formula.add(value, 10)).evaluateIntegral()
        ).toThrow();
    });

    test("Formula never marked as having an invertible integral", () => {
        expect(
            Formula.if(constant, true, value => Formula.add(value, 10)).isIntegralInvertible()
        ).toBe(false);
        expect(() =>
            Formula.if(constant, true, value => Formula.add(value, 10)).invertIntegral(10)
        ).toThrow();
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
    describe("Evaluates correctly with condition false and else statement", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.if(
                    constant,
                    false,
                    value => Formula.sqrt(value),
                    value => value.times(2)
                ).evaluate()
            ).compare_tolerance(20));
        test("Inverts correctly with variable in input", () =>
            expect(
                Formula.if(
                    variable,
                    false,
                    value => Formula.sqrt(value),
                    value => value.times(2)
                ).invert(20)
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

    describe("Evaluates correctly when nested", () => {
        test("Evaluates correctly", () =>
            expect(
                Formula.add(variable, constant)
                    .if(true, value => Formula.add(value, 2))
                    .div(2)
                    .evaluate()
            ).compare_tolerance(11));
        test("Inverts correctly", () =>
            expect(
                Formula.add(variable, constant)
                    .if(true, value => Formula.add(value, 2))
                    .div(2)
                    .invert(12)
            ).compare_tolerance(12));
    });
});

describe("Custom Formulas", () => {
    let variable: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(1);
    });

    describe("Formula with evaluate", () => {
        test("Zero input evaluates correctly", () =>
            expect(new Formula({ inputs: [], evaluate: () => 10 }).evaluate()).compare_tolerance(
                10
            ));
        test("One input evaluates correctly", () =>
            expect(
                new Formula({ inputs: [1], evaluate: value => value }).evaluate()
            ).compare_tolerance(1));
        test("Two inputs evaluates correctly", () =>
            expect(
                new Formula({ inputs: [1, 2], evaluate: (v1, v2) => v1 }).evaluate()
            ).compare_tolerance(1));
    });

    describe("Formula with invert", () => {
        test("Zero input does not invert", () =>
            expect(() =>
                new Formula({
                    inputs: [],
                    evaluate: () => 6,
                    invert: value => value
                }).invert(10)
            ).toThrow());
        test("One input inverts correctly", () =>
            expect(
                new Formula({
                    inputs: [variable],
                    evaluate: () => 10,
                    invert: (value, v1) => v1.evaluate()
                }).invert(10)
            ).compare_tolerance(1));
        test("Two inputs inverts correctly", () =>
            expect(
                new Formula({
                    inputs: [variable, 2],
                    evaluate: () => 10,
                    invert: (value, v1, v2) => v2
                }).invert(10)
            ).compare_tolerance(2));
    });

    describe("Formula with integrate", () => {
        test("Zero input cannot integrate", () =>
            expect(() =>
                new Formula({
                    inputs: [],
                    evaluate: () => 0,
                    integrate: stack => variable
                }).evaluateIntegral()
            ).toThrow());
        test("One input integrates correctly", () =>
            expect(
                new Formula({
                    inputs: [variable],
                    evaluate: v1 => Decimal.add(v1, 10),
                    integrate: (stack, v1) => Formula.add(v1, 10)
                }).evaluateIntegral()
            ).compare_tolerance(11));
        test("Two inputs integrates correctly", () =>
            expect(
                new Formula({
                    inputs: [variable, 10],
                    evaluate: (v1, v2) => Decimal.add(v1, v2),
                    integrate: (stack, v1, v2) => Formula.add(v1, v2)
                }).evaluateIntegral()
            ).compare_tolerance(11));
    });

    describe("Formula with invertIntegral", () => {
        test("Zero input does not invert integral", () =>
            expect(() =>
                new Formula({
                    inputs: [],
                    evaluate: () => 0,
                    integrate: stack => variable
                }).invertIntegral(20)
            ).toThrow());
        test("One input inverts integral correctly", () =>
            expect(
                new Formula({
                    inputs: [variable],
                    evaluate: v1 => Decimal.add(v1, 10),
                    integrate: (stack, v1) => Formula.add(v1, 10)
                }).invertIntegral(20)
            ).compare_tolerance(10));
        test("Two inputs inverts integral correctly", () =>
            expect(
                new Formula({
                    inputs: [variable, 10],
                    evaluate: (v1, v2) => Decimal.add(v1, v2),
                    integrate: (stack, v1, v2) => Formula.add(v1, v2)
                }).invertIntegral(20)
            ).compare_tolerance(10));
    });

    describe("Formula as input", () => {
        let customFormula: GenericFormula;
        beforeAll(() => {
            customFormula = new Formula({
                inputs: [variable],
                evaluate: v1 => v1,
                invert: value => value,
                integrate: (stack, v1) => v1.getIntegralFormula(stack)
            });
        });
        test("Evaluate correctly", () =>
            expect(customFormula.add(10).evaluate()).compare_tolerance(11));
        test("Invert correctly", () =>
            expect(customFormula.add(10).invert(20)).compare_tolerance(10));
        test("Integrate correctly", () =>
            expect(customFormula.add(10).evaluateIntegral(10)).compare_tolerance(20));
    });
});

describe("Buy Max", () => {
    let resource: Resource;
    beforeAll(() => {
        resource = createResource(ref(100000));
    });
    describe("Without spending", () => {
        test("Throws on formula with non-invertible integral", () => {
            const maxAffordable = calculateMaxAffordable(Formula.neg(10), resource, false);
            expect(() => maxAffordable.value).toThrow();
        });
        test("Calculates max affordable and cost correctly", () => {
            const variable = Formula.variable(0);
            const formula = Formula.pow(1.05, variable).times(100);
            const maxAffordable = calculateMaxAffordable(formula, resource, false);
            expect(maxAffordable.value).compare_tolerance(141);
            expect(calculateCost(formula, maxAffordable.value, false)).compare_tolerance(
                Decimal.pow(1.05, 141).times(100)
            );
        });
    });
    describe("With spending", () => {
        test("Throws on non-invertible formula", () => {
            const maxAffordable = calculateMaxAffordable(Formula.abs(10), resource);
            expect(() => maxAffordable.value).toThrow();
        });
        test("Estimates max affordable and cost correctly with 0 purchases", () => {
            const purchases = ref(0);
            const variable = Formula.variable(purchases);
            const formula = Formula.pow(1.05, variable).times(100);
            const maxAffordable = calculateMaxAffordable(formula, resource, true, 0);
            let actualAffordable = 0;
            let summedCost = Decimal.dZero;
            while (true) {
                const nextCost = formula.evaluate(actualAffordable);
                if (Decimal.add(summedCost, nextCost).lte(resource.value)) {
                    actualAffordable++;
                    summedCost = Decimal.add(summedCost, nextCost);
                } else {
                    break;
                }
            }
            expect(maxAffordable.value).compare_tolerance(actualAffordable);

            const actualCost = new Array(actualAffordable)
                .fill(null)
                .reduce((acc, _, i) => acc.add(formula.evaluate(i)), new Decimal(0));
            const calculatedCost = calculateCost(formula, maxAffordable.value);
            // Check if the calculated cost is within 10% of the actual cost,
            // because this is an approximation
            expect(
                Decimal.sub(actualCost, calculatedCost).abs().div(actualCost).toNumber()
            ).toBeLessThan(0.1);
        });
        test("Estimates max affordable and cost with 1 purchase", () => {
            const purchases = ref(1);
            const variable = Formula.variable(purchases);
            const formula = Formula.pow(1.05, variable).times(100);
            const maxAffordable = calculateMaxAffordable(formula, resource, true, 0);
            let actualAffordable = 0;
            let summedCost = Decimal.dZero;
            while (true) {
                const nextCost = formula.evaluate(Decimal.add(actualAffordable, 1));
                if (Decimal.add(summedCost, nextCost).lte(resource.value)) {
                    actualAffordable++;
                    summedCost = Decimal.add(summedCost, nextCost);
                } else {
                    break;
                }
            }
            expect(maxAffordable.value).compare_tolerance(actualAffordable);

            const actualCost = new Array(actualAffordable)
                .fill(null)
                .reduce((acc, _, i) => acc.add(formula.evaluate(i + 1)), new Decimal(0));
            const calculatedCost = calculateCost(formula, maxAffordable.value);
            // Check if the calculated cost is within 10% of the actual cost,
            // because this is an approximation
            expect(
                Decimal.sub(actualCost, calculatedCost).abs().div(actualCost).toNumber()
            ).toBeLessThan(0.1);
        });
        test("Estimates max affordable and cost more accurately with summing last purchases", () => {
            const purchases = ref(1);
            const variable = Formula.variable(purchases);
            const formula = Formula.pow(1.05, variable).times(100);
            const maxAffordable = calculateMaxAffordable(formula, resource);
            let actualAffordable = 0;
            let summedCost = Decimal.dZero;
            while (true) {
                const nextCost = formula.evaluate(Decimal.add(actualAffordable, 1));
                if (Decimal.add(summedCost, nextCost).lte(resource.value)) {
                    actualAffordable++;
                    summedCost = Decimal.add(summedCost, nextCost);
                } else {
                    break;
                }
            }
            expect(maxAffordable.value).compare_tolerance(actualAffordable);

            const actualCost = new Array(actualAffordable)
                .fill(null)
                .reduce((acc, _, i) => acc.add(formula.evaluate(i + 1)), new Decimal(0));
            const calculatedCost = calculateCost(formula, maxAffordable.value);
            // Since we're summing the last few purchases, this has a tighter deviation allowed
            expect(
                Decimal.sub(actualCost, calculatedCost).abs().div(actualCost).toNumber()
            ).toBeLessThan(0.02);
        });
        test("Handles summing purchases when making few purchases", () => {
            const purchases = ref(90);
            const variable = Formula.variable(purchases);
            const formula = Formula.pow(1.05, variable).times(100);
            const maxAffordable = calculateMaxAffordable(formula, resource);
            let actualAffordable = 0;
            let summedCost = Decimal.dZero;
            while (true) {
                const nextCost = formula.evaluate(Decimal.add(actualAffordable, purchases.value));
                if (Decimal.add(summedCost, nextCost).lte(resource.value)) {
                    actualAffordable++;
                    summedCost = Decimal.add(summedCost, nextCost);
                } else {
                    break;
                }
            }
            expect(maxAffordable.value).compare_tolerance(actualAffordable);

            const actualCost = new Array(actualAffordable)
                .fill(null)
                .reduce(
                    (acc, _, i) => acc.add(formula.evaluate(i + purchases.value)),
                    new Decimal(0)
                );
            const calculatedCost = calculateCost(formula, maxAffordable.value);
            // Since we're summing all the purchases this should be equivalent
            expect(calculatedCost).compare_tolerance(actualCost);
        });
        test("Handles summing purchases when making very few purchases", () => {
            const purchases = ref(0);
            const variable = Formula.variable(purchases);
            const formula = variable.add(1);
            const resource = createResource(ref(3));
            const maxAffordable = calculateMaxAffordable(formula, resource, true);
            expect(maxAffordable.value).compare_tolerance(2);

            const actualCost = new Array(2)
                .fill(null)
                .reduce(
                    (acc, _, i) => acc.add(formula.evaluate(i + purchases.value)),
                    new Decimal(0)
                );
            const calculatedCost = calculateCost(formula, maxAffordable.value, true);
            // Since we're summing all the purchases this should be equivalent
            expect(calculatedCost).compare_tolerance(actualCost);
        });
        test("Handles summing purchases when over e308 purchases", () => {
            resource.value = "1ee308";
            const purchases = ref(0);
            const variable = Formula.variable(purchases);
            const formula = variable;
            const maxAffordable = calculateMaxAffordable(formula, resource);
            const calculatedCost = calculateCost(formula, maxAffordable.value);
            expect(Decimal.isNaN(calculatedCost)).toBe(false);
            expect(Decimal.isFinite(calculatedCost)).toBe(true);
            resource.value = 100000;
        });
    });
});

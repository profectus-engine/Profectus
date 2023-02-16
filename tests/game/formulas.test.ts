import { createResource, Resource } from "features/resources/resource";
import Formula, {
    calculateCost,
    calculateMaxAffordable,
    GenericFormula,
    InvertibleFormula,
    unrefFormulaSource
} from "game/formulas";
import Decimal, { DecimalSource } from "util/bignum";
import { beforeAll, describe, expect, test } from "vitest";
import { ref } from "vue";
import "../utils";

type FormulaFunctions = keyof GenericFormula & keyof typeof Formula & keyof typeof Decimal;

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
    "cbrt"
] as const;
const nonInvertibleIntegralZeroPramFunctionNames = [
    ...nonIntegrableZeroParamFunctionNames,
    "neg",
    "exp",
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
const nonInvertibleOneParamFunctionNames = ["layeradd10"] as const;
const integrableOneParamFunctionNames = ["add", "sub", "mul", "div", "log", "pow", "root"] as const;
const nonIntegrableOneParamFunctionNames = [...nonInvertibleOneParamFunctionNames, "slog"] as const;
const invertibleIntegralOneParamFunctionNames = integrableOneParamFunctionNames;
const nonInvertibleIntegralOneParamFunctionNames = nonIntegrableOneParamFunctionNames;

const invertibleTwoParamFunctionNames = ["tetrate", "layeradd", "iteratedexp"] as const;
const nonInvertibleTwoParamFunctionNames = ["iteratedlog", "pentate"] as const;
const nonIntegrableTwoParamFunctionNames = [
    ...invertibleTwoParamFunctionNames,
    ...nonInvertibleZeroParamFunctionNames
];
const nonInvertibleIntegralTwoParamFunctionNames = nonIntegrableTwoParamFunctionNames;

describe("Formula Equality Checking", () => {
    describe("Equality Checks", () => {
        test("Equals", () => Formula.add(1, 1).equals(Formula.add(1, 1)));
        test("Not Equals due to inputs", () => Formula.add(1, 1).equals(Formula.add(1, 0)));
        test("Not Equals due to functions", () => Formula.add(1, 1).equals(Formula.sub(1, 1)));
        test("Not Equals due to hasVariable", () =>
            Formula.constant(1).equals(Formula.variable(1)));
    });

    describe("Formula aliases", () => {
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
        args: Readonly<Parameters<typeof Formula[T]>>
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
        (
            [
                ...invertibleTwoParamFunctionNames,
                ...nonInvertibleTwoParamFunctionNames,
                "clamp"
            ] as const
        ).forEach(names =>
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
        expect(formula.invert(10)).compare_tolerance(7);
    });
});

describe("Integrating", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("evaluateIntegral() returns variable's value", () =>
        expect(variable.evaluate()).compare_tolerance(10));
    test("evaluateIntegral(variable) overrides variable value", () =>
        expect(variable.add(10).evaluateIntegral(20)).compare_tolerance(400));

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
                test(`${name}(const, var) is marked as integrable`, () =>
                    checkFormula(Formula[name](constant, variable)));
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
        const formula = Formula.add(variable, constant).times(constant);
        expect(formula.evaluateIntegral()).compare_tolerance(1500);
    });
});

describe("Inverting integrals", () => {
    let variable: GenericFormula;
    let constant: GenericFormula;
    beforeAll(() => {
        variable = Formula.variable(10);
        constant = Formula.constant(10);
    });

    test("variable.invertIntegral() is pass-through", () =>
        expect(variable.invertIntegral(20)).compare_tolerance(20));

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
                test(`${name}(const, var) is marked as having an invertible integral`, () =>
                    checkFormula(Formula[name](constant, variable)));
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
        const formula = Formula.add(variable, constant).times(constant);
        expect(formula.invertIntegral(1500)).compare_tolerance(10);
    });

    describe("Inverting integral pass-throughs", () => {
        test("max", () =>
            expect(Formula.max(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("min", () =>
            expect(Formula.min(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("minabs", () =>
            expect(Formula.minabs(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("maxabs", () =>
            expect(Formula.maxabs(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("clampMax", () =>
            expect(Formula.clampMax(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("clampMin", () =>
            expect(Formula.clampMin(variable, constant).invertIntegral(10)).compare_tolerance(10));
        test("clamp", () =>
            expect(
                Formula.clamp(variable, constant, constant).invertIntegral(10)
            ).compare_tolerance(10));
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

describe("Custom Formulas", () => {
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
        test("Zero input inverts correctly", () =>
            expect(
                new Formula({
                    inputs: [],
                    evaluate: () => 6,
                    invert: value => value,
                    hasVariable: true
                }).invert(10)
            ).compare_tolerance(10));
        test("One input inverts correctly", () =>
            expect(
                new Formula({
                    inputs: [1],
                    evaluate: () => 10,
                    invert: (value, v1) => v1,
                    hasVariable: true
                }).invert(10)
            ).compare_tolerance(1));
        test("Two inputs inverts correctly", () =>
            expect(
                new Formula({
                    inputs: [1, 2],
                    evaluate: () => 10,
                    invert: (value, v1, v2) => v2,
                    hasVariable: true
                }).invert(10)
            ).compare_tolerance(2));
    });

    describe("Formula with integrate", () => {
        test("Zero input integrates correctly", () =>
            expect(
                new Formula({
                    inputs: [],
                    evaluate: () => 10,
                    integrate: () => 20
                }).evaluateIntegral()
            ).compare_tolerance(20));
        test("One input integrates correctly", () =>
            expect(
                new Formula({
                    inputs: [1],
                    evaluate: () => 10,
                    integrate: (val, v1) => val ?? 20
                }).evaluateIntegral()
            ).compare_tolerance(20));
        test("Two inputs integrates correctly", () =>
            expect(
                new Formula({
                    inputs: [1, 2],
                    evaluate: (v1, v2) => 10,
                    integrate: (v1, v2) => 3
                }).evaluateIntegral()
            ).compare_tolerance(3));
    });

    describe("Formula with invertIntegral", () => {
        test("Zero input inverts integral correctly", () =>
            expect(
                new Formula({
                    inputs: [],
                    evaluate: () => 10,
                    invertIntegral: () => 1,
                    hasVariable: true
                }).invertIntegral(8)
            ).compare_tolerance(1));
        test("One input inverts integral correctly", () =>
            expect(
                new Formula({
                    inputs: [1],
                    evaluate: () => 10,
                    invertIntegral: (val, v1) => 1,
                    hasVariable: true
                }).invertIntegral(8)
            ).compare_tolerance(1));
        test("Two inputs inverts integral correctly", () =>
            expect(
                new Formula({
                    inputs: [1, 2],
                    evaluate: (v1, v2) => 10,
                    invertIntegral: (v1, v2) => 1,
                    hasVariable: true
                }).invertIntegral(8)
            ).compare_tolerance(1));
    });
});

describe("Buy Max", () => {
    let resource: Resource;
    beforeAll(() => {
        resource = createResource(ref(10));
    });
    describe("With spending", () => {
        test("Throws on formula with non-invertible integral", () => {
            const maxAffordable = calculateMaxAffordable(Formula.neg(10), resource, false);
            expect(() => maxAffordable.value).toThrow();
        });
        // https://www.desmos.com/calculator/5vgletdc1p
        test("Calculates max affordable and cost correctly", () => {
            const variable = Formula.variable(10);
            const formula = Formula.pow(1.05, variable);
            const maxAffordable = calculateMaxAffordable(formula, resource, false);
            expect(maxAffordable.value).compare_tolerance(47);
            expect(calculateCost(formula, maxAffordable.value, false)).compare_tolerance(
                Decimal.pow(1.05, 47)
            );
        });
    });
    describe("Without spending", () => {
        test("Throws on non-invertible formula", () => {
            const maxAffordable = calculateMaxAffordable(Formula.abs(10), resource);
            expect(() => maxAffordable.value).toThrow();
        });
        // https://www.desmos.com/calculator/5vgletdc1p
        test("Calculates max affordable and cost correctly", () => {
            const variable = Formula.variable(10);
            const formula = Formula.pow(1.05, variable);
            const maxAffordable = calculateMaxAffordable(formula, resource);
            expect(maxAffordable.value).compare_tolerance(7);
            expect(calculateCost(formula, maxAffordable.value)).compare_tolerance(7.35);
        });
    });
});

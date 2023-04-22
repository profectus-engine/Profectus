import { Resource } from "features/resources/resource";
import { NonPersistent } from "game/persistence";
import Decimal, { DecimalSource, format } from "util/bignum";
import { Computable, ProcessedComputable, convertComputable } from "util/computed";
import { ComputedRef, Ref, computed, ref, unref } from "vue";
import * as ops from "./operations";
import type {
    EvaluateFunction,
    FormulaOptions,
    FormulaSource,
    GeneralFormulaOptions,
    GenericFormula,
    GuardedFormulasToDecimals,
    IntegrableFormula,
    IntegrateFunction,
    InternalFormulaProperties,
    InvertFunction,
    InvertibleFormula,
    InvertibleIntegralFormula,
    SubstitutionFunction,
    SubstitutionStack
} from "./types";

export function hasVariable(value: FormulaSource): value is InvertibleFormula {
    return value instanceof Formula && value.hasVariable();
}

export function unrefFormulaSource(value: FormulaSource, variable?: DecimalSource) {
    return value instanceof Formula ? value.evaluate(variable) : unref(value);
}

function integrateVariable(this: GenericFormula) {
    return Formula.pow(this, 2).div(2);
}

function integrateVariableInner(this: GenericFormula) {
    return this;
}

/**
 * A class that can be used for cost/goal functions. It can be evaluated similar to a cost function, but also provides extra features for supported formulas. For example, a lot of math functions can be inverted.
 * Typically, the use of these extra features is to support cost/goal functions that have multiple levels purchased/completed at once efficiently.
 * @see {@link calculateMaxAffordable}
 * @see {@link game/requirements.createCostRequirement}
 */
export default class Formula<T extends [FormulaSource] | FormulaSource[]> {
    readonly inputs: T;

    private readonly internalEvaluate: EvaluateFunction<T> | undefined;
    private readonly internalInvert: InvertFunction<T> | undefined;
    private readonly internalIntegrate: IntegrateFunction<T> | undefined;
    private readonly internalIntegrateInner: IntegrateFunction<T> | undefined;
    private readonly applySubstitution: SubstitutionFunction<T> | undefined;
    private readonly internalVariables: number;

    public readonly innermostVariable: ProcessedComputable<DecimalSource> | undefined;

    private integralFormula: GenericFormula | undefined;

    constructor(options: FormulaOptions<T>) {
        let readonlyProperties;
        if ("inputs" in options) {
            options.inputs = options.inputs.map(input =>
                typeof input === "object" && NonPersistent in input ? input[NonPersistent] : input
            ) as T | [FormulaSource];
        }
        if ("variable" in options) {
            if (typeof options.variable === "object" && NonPersistent in options.variable) {
                options.variable = options.variable[NonPersistent] as Ref<DecimalSource>;
            }
            readonlyProperties = this.setupVariable(options);
        } else if (!("evaluate" in options)) {
            readonlyProperties = this.setupConstant(options);
        } else {
            readonlyProperties = this.setupFormula(options);
        }
        this.inputs = readonlyProperties.inputs;
        this.internalVariables = readonlyProperties.internalVariables;
        this.innermostVariable = readonlyProperties.innermostVariable;
        this.internalEvaluate = readonlyProperties.internalEvaluate;
        this.internalInvert = readonlyProperties.internalInvert;
        this.internalIntegrate = readonlyProperties.internalIntegrate;
        this.internalIntegrateInner = readonlyProperties.internalIntegrateInner;
        this.applySubstitution = readonlyProperties.applySubstitution;
    }

    private setupVariable({
        variable
    }: {
        variable: ProcessedComputable<DecimalSource>;
    }): InternalFormulaProperties<T> {
        return {
            inputs: [variable] as T,
            internalVariables: 1,
            innermostVariable: variable,
            internalIntegrate: integrateVariable,
            internalIntegrateInner: integrateVariableInner,
            applySubstitution: ops.passthrough as unknown as SubstitutionFunction<T>
        };
    }

    private setupConstant({ inputs }: { inputs: [FormulaSource] }): InternalFormulaProperties<T> {
        if (inputs.length !== 1) {
            throw new Error("Evaluate function is required if inputs is not length 1");
        }
        return {
            inputs: inputs as T,
            internalVariables: 0
        };
    }

    private setupFormula(options: GeneralFormulaOptions<T>): InternalFormulaProperties<T> {
        const { inputs, evaluate, invert, integrate, integrateInner, applySubstitution } = options;
        const numVariables = inputs.reduce<number>(
            (acc, input) => acc + (input instanceof Formula ? input.internalVariables : 0),
            0
        );
        const variable = inputs.find(input => input instanceof Formula && input.hasVariable()) as
            | GenericFormula
            | undefined;

        const innermostVariable = numVariables === 1 ? variable?.innermostVariable : undefined;

        return {
            inputs,
            internalEvaluate: evaluate,
            internalInvert: invert,
            internalIntegrate: integrate,
            internalIntegrateInner: integrateInner,
            applySubstitution,
            innermostVariable,
            internalVariables: numVariables
        };
    }

    /** Calculates C for the implementation of the integral formula for this formula. */
    calculateConstantOfIntegration() {
        // Calculate C based on the knowledge that at x=1, the integral should be the average between f(0) and f(1)
        const integral = this.getIntegralFormula().evaluate(1);
        const actualCost = Decimal.add(this.evaluate(0), this.evaluate(1)).div(2);
        return Decimal.sub(actualCost, integral);
    }

    /** Type predicate that this formula can be inverted. */
    isInvertible(): this is InvertibleFormula {
        return this.hasVariable() && (this.internalInvert != null || this.internalEvaluate == null);
    }

    /** Type predicate that this formula can be integrated. */
    isIntegrable(): this is IntegrableFormula {
        return this.hasVariable() && this.internalIntegrate != null;
    }

    /** Type predicate that this formula has an integral function that can be inverted. */
    isIntegralInvertible(): this is InvertibleIntegralFormula {
        if (!this.isIntegrable()) {
            return false;
        }
        return this.getIntegralFormula().isInvertible();
    }

    /** Whether or not this formula has a singular variable inside it, which can be accessed via {@link innermostVariable}. */
    hasVariable(): boolean {
        return this.internalVariables === 1;
    }

    /**
     * Evaluate the current result of the formula
     * @param variable Optionally override the value of the variable while evaluating. Ignored if there is not variable
     */
    evaluate(variable?: DecimalSource): DecimalSource {
        return (
            this.internalEvaluate?.call(
                this,
                ...(this.inputs.map(input =>
                    unrefFormulaSource(input, variable)
                ) as GuardedFormulasToDecimals<T>)
            ) ??
            (this.hasVariable() ? variable : null) ??
            unrefFormulaSource(this.inputs[0])
        );
    }

    /**
     * Takes a potential result of the formula, and calculates what value the variable inside the formula would have to be for that result to occur. Only works if there's a single variable and if the formula is invertible.
     * @param value The result of the formula
     * @see {@link isInvertible}
     */
    invert(value: DecimalSource): DecimalSource {
        if (this.internalInvert && this.hasVariable()) {
            return this.internalInvert.call(this, value, ...this.inputs);
        } else if (this.inputs.length === 1 && this.hasVariable()) {
            return value;
        }
        throw new Error("Cannot invert non-invertible formula");
    }

    /**
     * Evaluate the result of the indefinite integral (sans the constant of integration). Only works if there's a single variable and the formula is integrable. The formula can only have one "complex" operation (anything besides +,-,*,/).
     * @param variable Optionally override the value of the variable while evaluating
     * @see {@link isIntegrable}
     */
    evaluateIntegral(variable?: DecimalSource): DecimalSource {
        if (!this.isIntegrable()) {
            throw new Error("Cannot evaluate integral of formula without integral");
        }
        return this.getIntegralFormula().evaluate(variable);
    }

    /**
     * Given the potential result of the formula's integral (and the constant of integration), calculate what value the variable inside the formula would have to be for that result to occur. Only works if there's a single variable and if the formula's integral is invertible.
     * @param value The result of the integral.
     * @see {@link isIntegralInvertible}
     */
    invertIntegral(value: DecimalSource): DecimalSource {
        if (!this.isIntegrable() || !this.getIntegralFormula().isInvertible()) {
            throw new Error("Cannot invert integral of formula without invertible integral");
        }
        return this.getIntegralFormula().invert(value);
    }

    /**
     * Get a formula that will evaluate to the integral of this formula. May also be invertible.
     * @param stack For nested formulas, a stack of operations that occur outside the complex operation.
     */
    getIntegralFormula(stack?: SubstitutionStack): GenericFormula {
        if (this.integralFormula != null && stack == null) {
            return this.integralFormula;
        }
        if (stack == null) {
            // "Outer" part of the formula
            if (this.applySubstitution == null) {
                // We're the complex operation of this formula
                stack = [];
                if (this.internalIntegrate == null) {
                    throw new Error("Cannot integrate formula with non-integrable operation");
                }
                let value = this.internalIntegrate.call(this, stack, ...this.inputs);
                stack.forEach(func => (value = func(value)));
                this.integralFormula = value;
            } else {
                // Continue digging into the formula
                if (this.internalIntegrate) {
                    this.integralFormula = this.internalIntegrate.call(
                        this,
                        undefined,
                        ...this.inputs
                    );
                } else if (
                    this.inputs.length === 1 &&
                    this.internalEvaluate == null &&
                    this.hasVariable()
                ) {
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    this.integralFormula = this;
                } else {
                    throw new Error("Cannot integrate formula without variable");
                }
            }
            return this.integralFormula;
        } else {
            // "Inner" part of the formula
            if (this.applySubstitution == null) {
                throw new Error("Cannot have two complex operations in an integrable formula");
            }
            stack.push((variable: GenericFormula) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.applySubstitution!.call(this, variable, ...this.inputs)
            );
            if (this.internalIntegrateInner) {
                return this.internalIntegrateInner.call(this, stack, ...this.inputs);
            } else if (this.internalIntegrate) {
                return this.internalIntegrate.call(this, stack, ...this.inputs);
            } else if (
                this.inputs.length === 1 &&
                this.internalEvaluate == null &&
                this.hasVariable()
            ) {
                return this;
            } else {
                throw new Error("Cannot integrate formula without variable");
            }
        }
    }

    /**
     * Compares if two formulas are equivalent to each other. Note that function contexts can lead to false negatives.
     * @param other The formula to compare to this one.
     */
    equals(other: GenericFormula): boolean {
        return (
            this.inputs.length === other.inputs.length &&
            this.inputs.every((input, i) =>
                input instanceof Formula && other.inputs[i] instanceof Formula
                    ? input.equals(other.inputs[i])
                    : !(input instanceof Formula) &&
                      !(other.inputs[i] instanceof Formula) &&
                      Decimal.eq(unref(input), unref(other.inputs[i]))
            ) &&
            this.internalEvaluate === other.internalEvaluate &&
            this.internalInvert === other.internalInvert &&
            this.internalIntegrate === other.internalIntegrate &&
            this.internalVariables === other.internalVariables
        );
    }

    /**
     * Creates a formula that evaluates to a constant value.
     * @param value The constant value for this formula.
     */
    public static constant(
        value: ProcessedComputable<DecimalSource>
    ): InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula {
        return new Formula({ inputs: [value] }) as InvertibleFormula;
    }

    /**
     * Creates a formula that is marked as the variable for an outer formula. Typically used for inverting and integrating.
     * @param value The variable for this formula.
     */
    public static variable(
        value: ProcessedComputable<DecimalSource>
    ): InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula {
        return new Formula({ variable: value }) as InvertibleFormula;
    }

    // TODO add integration support to step-wise functions
    /**
     * Creates a step-wise formula. After {@link start} the formula will have an additional modifier.
     * This function assumes the incoming {@link value} will be continuous and monotonically increasing.
     * @param value The value before applying the step
     * @param start The value at which to start applying the step
     * @param formulaModifier How this step should modify the formula. The incoming value will be the unmodified formula value _minus the start value_. So for example if an incoming formula evaluates to 200 and has a step that starts at 150, the formulaModifier would be given 50 as the parameter
     */
    public static step(
        value: FormulaSource,
        start: Computable<DecimalSource>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ): GenericFormula {
        const lhsRef = ref<DecimalSource>(0);
        const formula = formulaModifier(Formula.variable(lhsRef));
        const processedStart = convertComputable(start);
        function evalStep(lhs: DecimalSource) {
            if (Decimal.lt(lhs, unref(processedStart))) {
                return lhs;
            }
            lhsRef.value = Decimal.sub(lhs, unref(processedStart));
            return Decimal.add(formula.evaluate(), unref(processedStart));
        }
        function invertStep(value: DecimalSource, lhs: FormulaSource) {
            if (hasVariable(lhs)) {
                if (Decimal.gt(value, unref(processedStart))) {
                    value = Decimal.add(
                        formula.invert(Decimal.sub(value, unref(processedStart))),
                        unref(processedStart)
                    );
                }
                return lhs.invert(value);
            }
            throw new Error("Could not invert due to no input being a variable");
        }
        return new Formula({
            inputs: [value],
            evaluate: evalStep,
            invert: formula.isInvertible() && formula.hasVariable() ? invertStep : undefined
        });
    }

    /**
     * Applies a modifier to a formula under a given condition.
     * @param value The incoming formula value
     * @param condition Whether or not to apply the modifier
     * @param formulaModifier The modifier to apply to the incoming formula if the condition is true
     * @param elseFormulaModifier An optional modifier to apply to the incoming formula if the condition is false
     */
    public static if(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula,
        elseFormulaModifier?: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ): GenericFormula {
        const lhsRef = ref<DecimalSource>(0);
        const variable = Formula.variable(lhsRef);
        const formula = formulaModifier(variable);
        const elseFormula = elseFormulaModifier?.(variable);
        const processedCondition = convertComputable(condition);
        function evalStep(lhs: DecimalSource) {
            if (unref(processedCondition)) {
                lhsRef.value = lhs;
                return formula.evaluate();
            } else if (elseFormula) {
                lhsRef.value = lhs;
                return elseFormula.evaluate();
            } else {
                return lhs;
            }
        }
        function invertStep(value: DecimalSource, lhs: FormulaSource) {
            if (!hasVariable(lhs)) {
                throw new Error("Could not invert due to no input being a variable");
            }
            if (unref(processedCondition)) {
                return lhs.invert(formula.invert(value));
            } else if (elseFormula) {
                return lhs.invert(elseFormula.invert(value));
            } else {
                return lhs.invert(value);
            }
        }
        return new Formula({
            inputs: [value],
            evaluate: evalStep,
            invert: formula.isInvertible() && formula.hasVariable() ? invertStep : undefined
        });
    }
    public static conditional(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula,
        elseFormulaModifier?: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ) {
        return Formula.if(value, condition, formulaModifier, elseFormulaModifier);
    }

    public static abs(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.abs });
    }

    public static neg<T extends GenericFormula>(value: T): T;
    public static neg(value: FormulaSource): GenericFormula;
    public static neg(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.neg,
            invert: ops.invertNeg,
            applySubstitution: ops.applySubstitutionNeg,
            integrate: ops.integrateNeg
        });
    }
    public static negate = Formula.neg;
    public static negated = Formula.neg;

    public static sign(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.sign });
    }
    public static sgn = Formula.sign;

    public static round(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.round });
    }

    public static floor(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.floor });
    }

    public static ceil(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.ceil });
    }

    public static trunc(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.trunc });
    }

    public static add<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static add<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static add(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static add(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.add,
            invert: ops.invertAdd,
            integrate: ops.integrateAdd,
            integrateInner: ops.integrateInnerAdd,
            applySubstitution: ops.passthrough
        });
    }
    public static plus = Formula.add;

    public static sub<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static sub<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static sub(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static sub(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.sub,
            invert: ops.invertSub,
            integrate: ops.integrateSub,
            integrateInner: ops.integrateInnerSub,
            applySubstitution: ops.passthrough
        });
    }
    public static subtract = Formula.sub;
    public static minus = Formula.sub;

    public static mul<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static mul<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static mul(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static mul(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.mul,
            invert: ops.invertMul,
            integrate: ops.integrateMul,
            applySubstitution: ops.applySubstitutionMul
        });
    }
    public static multiply = Formula.mul;
    public static times = Formula.mul;

    public static div<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static div<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static div(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static div(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.div,
            invert: ops.invertDiv,
            integrate: ops.integrateDiv,
            applySubstitution: ops.applySubstitutionDiv
        });
    }
    public static divide = Formula.div;
    public static divideBy = Formula.div;
    public static dividedBy = Formula.div;

    public static recip<T extends GenericFormula>(value: T): T;
    public static recip(value: FormulaSource): GenericFormula;
    public static recip(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.recip,
            invert: ops.invertRecip,
            integrate: ops.integrateRecip
        });
    }
    public static reciprocal = Formula.recip;
    public static reciprocate = Formula.recip;

    // TODO these functions should ostensibly be integrable, and the integrals should be invertible
    public static max = ops.createPassthroughBinaryFormula(Decimal.max);
    public static min = ops.createPassthroughBinaryFormula(Decimal.min);
    public static minabs = ops.createPassthroughBinaryFormula(Decimal.minabs);
    public static maxabs = ops.createPassthroughBinaryFormula(Decimal.maxabs);
    public static clampMin = ops.createPassthroughBinaryFormula(Decimal.clampMin);
    public static clampMax = ops.createPassthroughBinaryFormula(Decimal.clampMax);

    public static clamp(
        value: FormulaSource,
        min: FormulaSource,
        max: FormulaSource
    ): GenericFormula {
        return new Formula({
            inputs: [value, min, max],
            evaluate: Decimal.clamp,
            invert: ops.passthrough as InvertFunction<[FormulaSource, FormulaSource, FormulaSource]>
        });
    }

    public static pLog10(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.pLog10 });
    }

    public static absLog10(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.absLog10 });
    }

    public static log10<T extends GenericFormula>(value: T): T;
    public static log10(value: FormulaSource): GenericFormula;
    public static log10(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.log10,
            invert: ops.invertLog10,
            integrate: ops.integrateLog10
        });
    }

    public static log<T extends GenericFormula>(value: T, base: FormulaSource): T;
    public static log<T extends GenericFormula>(value: FormulaSource, base: T): T;
    public static log(value: FormulaSource, base: FormulaSource): GenericFormula;
    public static log(value: FormulaSource, base: FormulaSource) {
        return new Formula({
            inputs: [value, base],
            evaluate: Decimal.log,
            invert: ops.invertLog,
            integrate: ops.integrateLog
        });
    }
    public static logarithm = Formula.log;

    public static log2<T extends GenericFormula>(value: T): T;
    public static log2(value: FormulaSource): GenericFormula;
    public static log2(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.log2,
            invert: ops.invertLog2,
            integrate: ops.integrateLog2
        });
    }

    public static ln<T extends GenericFormula>(value: T): T;
    public static ln(value: FormulaSource): GenericFormula;
    public static ln(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.ln,
            invert: ops.invertLn,
            integrate: ops.integrateLn
        });
    }

    public static pow<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static pow<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static pow(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.pow,
            invert: ops.invertPow,
            integrate: ops.integratePow
        });
    }

    public static pow10<T extends GenericFormula>(value: T): T;
    public static pow10(value: FormulaSource): GenericFormula;
    public static pow10(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.pow10,
            invert: ops.invertPow10,
            integrate: ops.integratePow10
        });
    }

    public static pow_base<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static pow_base<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static pow_base(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow_base(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.pow_base,
            invert: ops.invertPowBase,
            integrate: ops.integratePowBase
        });
    }

    public static root<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static root<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static root(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static root(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.root,
            invert: ops.invertRoot,
            integrate: ops.integrateRoot
        });
    }

    public static factorial(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.factorial });
    }

    public static gamma(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.gamma });
    }

    public static lngamma(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.lngamma });
    }

    public static exp<T extends GenericFormula>(value: T): T;
    public static exp(value: FormulaSource): GenericFormula;
    public static exp(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.exp,
            invert: ops.invertExp,
            integrate: ops.integrateExp
        });
    }

    public static sqr<T extends GenericFormula>(value: T): T;
    public static sqr(value: FormulaSource): GenericFormula;
    public static sqr(value: FormulaSource) {
        return Formula.pow(value, 2);
    }

    public static sqrt<T extends GenericFormula>(value: T): T;
    public static sqrt(value: FormulaSource): GenericFormula;
    public static sqrt(value: FormulaSource) {
        return Formula.root(value, 2);
    }

    public static cube<T extends GenericFormula>(value: T): T;
    public static cube(value: FormulaSource): GenericFormula;
    public static cube(value: FormulaSource) {
        return Formula.pow(value, 3);
    }

    public static cbrt<T extends GenericFormula>(value: T): T;
    public static cbrt(value: FormulaSource): GenericFormula;
    public static cbrt(value: FormulaSource) {
        return Formula.root(value, 3);
    }

    public static tetrate<T extends GenericFormula>(
        value: T,
        height?: FormulaSource,
        payload?: FormulaSource
    ): Omit<T, "integrate">;
    public static tetrate(
        value: FormulaSource,
        height?: FormulaSource,
        payload?: FormulaSource
    ): GenericFormula;
    public static tetrate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return new Formula({
            inputs: [value, height, payload],
            evaluate: ops.tetrate,
            invert: ops.invertTetrate
        });
    }

    public static iteratedexp<T extends GenericFormula>(
        value: T,
        height?: FormulaSource,
        payload?: FormulaSource
    ): Omit<T, "integrate">;
    public static iteratedexp(
        value: FormulaSource,
        height?: FormulaSource,
        payload?: FormulaSource
    ): GenericFormula;
    public static iteratedexp(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return new Formula({
            inputs: [value, height, payload],
            evaluate: ops.iteratedexp,
            invert: ops.invertIteratedExp
        });
    }

    public static iteratedlog(
        value: FormulaSource,
        base: FormulaSource = 10,
        times: FormulaSource = 1
    ): GenericFormula {
        return new Formula({ inputs: [value, base, times], evaluate: ops.iteratedLog });
    }

    public static slog<T extends GenericFormula>(
        value: T,
        base?: FormulaSource
    ): Omit<T, "integrate">;
    public static slog(value: FormulaSource, base?: FormulaSource): GenericFormula;
    public static slog(value: FormulaSource, base: FormulaSource = 10) {
        return new Formula({ inputs: [value, base], evaluate: ops.slog, invert: ops.invertSlog });
    }

    public static layeradd10(value: FormulaSource, diff: FormulaSource) {
        return new Formula({ inputs: [value, diff], evaluate: Decimal.layeradd10 });
    }

    public static layeradd<T extends GenericFormula>(
        value: T,
        diff: FormulaSource,
        base?: FormulaSource
    ): Omit<T, "integrate">;
    public static layeradd(
        value: FormulaSource,
        diff: FormulaSource,
        base?: FormulaSource
    ): GenericFormula;
    public static layeradd(value: FormulaSource, diff: FormulaSource, base: FormulaSource = 10) {
        return new Formula({
            inputs: [value, diff, base],
            evaluate: ops.layeradd,
            invert: ops.invertLayeradd
        });
    }

    public static lambertw<T extends GenericFormula>(value: T): Omit<T, "integrate">;
    public static lambertw(value: FormulaSource): GenericFormula;
    public static lambertw(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.lambertw,
            invert: ops.invertLambertw
        });
    }

    public static ssqrt<T extends GenericFormula>(value: T): Omit<T, "integrate">;
    public static ssqrt(value: FormulaSource): GenericFormula;
    public static ssqrt(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.ssqrt, invert: ops.invertSsqrt });
    }

    public static pentate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ): GenericFormula {
        return new Formula({ inputs: [value, height, payload], evaluate: ops.pentate });
    }

    public static sin<T extends GenericFormula>(value: T): T;
    public static sin(value: FormulaSource): GenericFormula;
    public static sin(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.sin,
            invert: ops.invertAsin,
            integrate: ops.integrateSin
        });
    }

    public static cos<T extends GenericFormula>(value: T): T;
    public static cos(value: FormulaSource): GenericFormula;
    public static cos(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.cos,
            invert: ops.invertAcos,
            integrate: ops.integrateCos
        });
    }

    public static tan<T extends GenericFormula>(value: T): T;
    public static tan(value: FormulaSource): GenericFormula;
    public static tan(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.tan,
            invert: ops.invertAtan,
            integrate: ops.integrateTan
        });
    }

    public static asin<T extends GenericFormula>(value: T): T;
    public static asin(value: FormulaSource): GenericFormula;
    public static asin(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.asin,
            invert: ops.invertSin,
            integrate: ops.integrateAsin
        });
    }

    public static acos<T extends GenericFormula>(value: T): T;
    public static acos(value: FormulaSource): GenericFormula;
    public static acos(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.acos,
            invert: ops.invertCos,
            integrate: ops.integrateAcos
        });
    }

    public static atan<T extends GenericFormula>(value: T): T;
    public static atan(value: FormulaSource): GenericFormula;
    public static atan(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.atan,
            invert: ops.invertTan,
            integrate: ops.integrateAtan
        });
    }

    public static sinh<T extends GenericFormula>(value: T): T;
    public static sinh(value: FormulaSource): GenericFormula;
    public static sinh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.sinh,
            invert: ops.invertAsinh,
            integrate: ops.integrateSinh
        });
    }

    public static cosh<T extends GenericFormula>(value: T): T;
    public static cosh(value: FormulaSource): GenericFormula;
    public static cosh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.cosh,
            invert: ops.invertAcosh,
            integrate: ops.integrateCosh
        });
    }

    public static tanh<T extends GenericFormula>(value: T): T;
    public static tanh(value: FormulaSource): GenericFormula;
    public static tanh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.tanh,
            invert: ops.invertAtanh,
            integrate: ops.integrateTanh
        });
    }

    public static asinh<T extends GenericFormula>(value: T): T;
    public static asinh(value: FormulaSource): GenericFormula;
    public static asinh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.asinh,
            invert: ops.invertSinh,
            integrate: ops.integrateAsinh
        });
    }

    public static acosh<T extends GenericFormula>(value: T): T;
    public static acosh(value: FormulaSource): GenericFormula;
    public static acosh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.acosh,
            invert: ops.invertCosh,
            integrate: ops.integrateAcosh
        });
    }

    public static atanh<T extends GenericFormula>(value: T): T;
    public static atanh(value: FormulaSource): GenericFormula;
    public static atanh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.atanh,
            invert: ops.invertTanh,
            integrate: ops.integrateAtanh
        });
    }

    public step(
        start: Computable<DecimalSource>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ) {
        return Formula.step(this, start, formulaModifier);
    }

    public if(
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ) {
        return Formula.if(this, condition, formulaModifier);
    }
    public conditional(
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ) {
        return Formula.if(this, condition, formulaModifier);
    }

    public abs() {
        return Formula.abs(this);
    }

    public neg<T extends GenericFormula>(this: T): T;
    public neg(this: GenericFormula): GenericFormula;
    public neg(this: GenericFormula) {
        return Formula.neg(this);
    }
    public negate = this.neg;
    public negated = this.neg;

    public sign() {
        return Formula.sign(this);
    }
    public sgn = this.sign;

    public round() {
        return Formula.round(this);
    }

    public floor() {
        return Formula.floor(this);
    }

    public ceil() {
        return Formula.ceil(this);
    }

    public trunc() {
        return Formula.trunc(this);
    }

    public add<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public add<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public add(this: GenericFormula, value: FormulaSource): GenericFormula;
    public add(this: GenericFormula, value: FormulaSource) {
        return Formula.add(this, value);
    }
    public plus = this.add;

    public sub<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public sub<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public sub(this: GenericFormula, value: FormulaSource): GenericFormula;
    public sub(value: FormulaSource) {
        return Formula.sub(this, value);
    }
    public subtract = this.sub;
    public minus = this.sub;

    public mul<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public mul<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public mul(this: GenericFormula, value: FormulaSource): GenericFormula;
    public mul(value: FormulaSource) {
        return Formula.mul(this, value);
    }
    public multiply = this.mul;
    public times = this.mul;

    public div<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public div<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public div(this: GenericFormula, value: FormulaSource): GenericFormula;
    public div(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public divide = this.div;
    public divideBy = this.div;
    public dividedBy = this.div;

    public recip<T extends GenericFormula>(this: T): T;
    public recip(this: FormulaSource): GenericFormula;
    public recip() {
        return Formula.recip(this);
    }
    public reciprocal = this.recip;
    public reciprocate = this.recip;

    public max(value: FormulaSource) {
        return Formula.max(this, value);
    }

    public min(value: FormulaSource) {
        return Formula.min(this, value);
    }

    public maxabs(value: FormulaSource) {
        return Formula.maxabs(this, value);
    }

    public minabs(value: FormulaSource) {
        return Formula.minabs(this, value);
    }

    public clamp(min: FormulaSource, max: FormulaSource) {
        return Formula.clamp(this, min, max);
    }

    public clampMin(value: FormulaSource) {
        return Formula.clampMin(this, value);
    }

    public clampMax(value: FormulaSource) {
        return Formula.clampMax(this, value);
    }

    public pLog10() {
        return Formula.pLog10(this);
    }

    public absLog10() {
        return Formula.absLog10(this);
    }

    public log10<T extends GenericFormula>(this: T): T;
    public log10(this: FormulaSource): GenericFormula;
    public log10() {
        return Formula.log10(this);
    }

    public log<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public log<T extends GenericFormula>(this: FormulaSource, value: T): T;
    public log(this: FormulaSource, value: FormulaSource): GenericFormula;
    public log(value: FormulaSource) {
        return Formula.log(this, value);
    }
    public logarithm = this.log;

    public log2<T extends GenericFormula>(this: T): T;
    public log2(this: FormulaSource): GenericFormula;
    public log2() {
        return Formula.log2(this);
    }

    public ln<T extends GenericFormula>(this: T): T;
    public ln(this: FormulaSource): GenericFormula;
    public ln() {
        return Formula.ln(this);
    }

    public pow<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public pow<T extends GenericFormula>(this: FormulaSource, value: T): T;
    public pow(this: FormulaSource, value: FormulaSource): GenericFormula;
    public pow(value: FormulaSource) {
        return Formula.pow(this, value);
    }

    public pow10<T extends GenericFormula>(this: T): T;
    public pow10(this: FormulaSource): GenericFormula;
    public pow10() {
        return Formula.pow10(this);
    }

    public pow_base<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public pow_base<T extends GenericFormula>(this: FormulaSource, value: T): T;
    public pow_base(this: FormulaSource, value: FormulaSource): GenericFormula;
    public pow_base(value: FormulaSource) {
        return Formula.pow_base(this, value);
    }

    public root<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public root<T extends GenericFormula>(this: FormulaSource, value: T): T;
    public root(this: FormulaSource, value: FormulaSource): GenericFormula;
    public root(value: FormulaSource) {
        return Formula.root(this, value);
    }

    public factorial() {
        return Formula.factorial(this);
    }

    public gamma() {
        return Formula.gamma(this);
    }
    public lngamma() {
        return Formula.lngamma(this);
    }

    public exp<T extends GenericFormula>(this: T): T;
    public exp(this: FormulaSource): GenericFormula;
    public exp(this: FormulaSource) {
        return Formula.exp(this);
    }

    public sqr<T extends GenericFormula>(this: T): T;
    public sqr(this: FormulaSource): GenericFormula;
    public sqr() {
        return Formula.pow(this, 2);
    }

    public sqrt<T extends GenericFormula>(this: T): T;
    public sqrt(this: FormulaSource): GenericFormula;
    public sqrt() {
        return Formula.root(this, 2);
    }
    public cube<T extends GenericFormula>(this: T): T;
    public cube(this: FormulaSource): GenericFormula;
    public cube() {
        return Formula.pow(this, 3);
    }

    public cbrt<T extends GenericFormula>(this: T): T;
    public cbrt(this: FormulaSource): GenericFormula;
    public cbrt() {
        return Formula.root(this, 3);
    }

    public tetrate<T extends GenericFormula>(
        this: T,
        height?: FormulaSource,
        payload?: FormulaSource
    ): Omit<T, "integrate">;
    public tetrate(
        this: FormulaSource,
        height?: FormulaSource,
        payload?: FormulaSource
    ): GenericFormula;
    public tetrate(
        this: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.tetrate(this, height, payload);
    }

    public iteratedexp<T extends GenericFormula>(
        this: T,
        height?: FormulaSource,
        payload?: FormulaSource
    ): Omit<T, "integrate">;
    public iteratedexp(
        this: FormulaSource,
        height?: FormulaSource,
        payload?: FormulaSource
    ): GenericFormula;
    public iteratedexp(
        this: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.iteratedexp(this, height, payload);
    }

    public iteratedlog(base: FormulaSource = 10, times: FormulaSource = 1) {
        return Formula.iteratedlog(this, base, times);
    }

    public slog<T extends GenericFormula>(this: T, base?: FormulaSource): Omit<T, "integrate">;
    public slog(this: FormulaSource, base?: FormulaSource): GenericFormula;
    public slog(this: FormulaSource, base: FormulaSource = 10) {
        return Formula.slog(this, base);
    }

    public layeradd10(diff: FormulaSource) {
        return Formula.layeradd10(this, diff);
    }

    public layeradd<T extends GenericFormula>(
        this: T,
        diff: FormulaSource,
        base?: FormulaSource
    ): Omit<T, "integrate">;
    public layeradd(this: FormulaSource, diff: FormulaSource, base?: FormulaSource): GenericFormula;
    public layeradd(this: FormulaSource, diff: FormulaSource, base: FormulaSource) {
        return Formula.layeradd(this, diff, base);
    }

    public lambertw<T extends GenericFormula>(this: T): Omit<T, "integrate">;
    public lambertw(this: FormulaSource): GenericFormula;
    public lambertw(this: FormulaSource) {
        return Formula.lambertw(this);
    }

    public ssqrt<T extends GenericFormula>(this: T): Omit<T, "integrate">;
    public ssqrt(this: FormulaSource): GenericFormula;
    public ssqrt(this: FormulaSource) {
        return Formula.ssqrt(this);
    }

    public pentate(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.pentate(this, height, payload);
    }

    public sin<T extends GenericFormula>(this: T): T;
    public sin(this: FormulaSource): GenericFormula;
    public sin(this: FormulaSource) {
        return Formula.sin(this);
    }

    public cos<T extends GenericFormula>(this: T): T;
    public cos(this: FormulaSource): GenericFormula;
    public cos(this: FormulaSource) {
        return Formula.cos(this);
    }

    public tan<T extends GenericFormula>(this: T): T;
    public tan(this: FormulaSource): GenericFormula;
    public tan(this: FormulaSource) {
        return Formula.tan(this);
    }

    public asin<T extends GenericFormula>(this: T): T;
    public asin(this: FormulaSource): GenericFormula;
    public asin(this: FormulaSource) {
        return Formula.asin(this);
    }

    public acos<T extends GenericFormula>(this: T): T;
    public acos(this: FormulaSource): GenericFormula;
    public acos(this: FormulaSource) {
        return Formula.acos(this);
    }

    public atan<T extends GenericFormula>(this: T): T;
    public atan(this: FormulaSource): GenericFormula;
    public atan(this: FormulaSource) {
        return Formula.atan(this);
    }

    public sinh<T extends GenericFormula>(this: T): T;
    public sinh(this: FormulaSource): GenericFormula;
    public sinh(this: FormulaSource) {
        return Formula.sinh(this);
    }

    public cosh<T extends GenericFormula>(this: T): T;
    public cosh(this: FormulaSource): GenericFormula;
    public cosh(this: FormulaSource) {
        return Formula.cosh(this);
    }

    public tanh<T extends GenericFormula>(this: T): T;
    public tanh(this: FormulaSource): GenericFormula;
    public tanh(this: FormulaSource) {
        return Formula.tanh(this);
    }

    public asinh<T extends GenericFormula>(this: T): T;
    public asinh(this: FormulaSource): GenericFormula;
    public asinh(this: FormulaSource) {
        return Formula.asinh(this);
    }

    public acosh<T extends GenericFormula>(this: T): T;
    public acosh(this: FormulaSource): GenericFormula;
    public acosh(this: FormulaSource) {
        return Formula.acosh(this);
    }

    public atanh<T extends GenericFormula>(this: T): T;
    public atanh(this: FormulaSource): GenericFormula;
    public atanh(this: FormulaSource) {
        return Formula.atanh(this);
    }
}

/**
 * Utility for recursively searching through a formula for the cause of non-invertibility.
 * @param formula The formula to search for a non-invertible formula within
 */
export function findNonInvertible(formula: GenericFormula): GenericFormula | null {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (formula.internalInvert == null && formula.internalEvaluate != null) {
        return formula;
    }
    for (const input of formula.inputs) {
        if (hasVariable(input)) {
            return findNonInvertible(input);
        }
    }
    return null;
}

/**
 * Stringifies a formula so it's more easy to read in the console
 * @param formula The formula to print
 */
export function printFormula(formula: FormulaSource): string {
    if (formula instanceof Formula) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return formula.internalEvaluate == null
            ? formula.hasVariable()
                ? "x"
                : formula.inputs[0] ?? 0
            : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              formula.internalEvaluate.name +
                  "(" +
                  formula.inputs.map(printFormula).join(", ") +
                  ")";
    }
    return format(unref(formula));
}

/**
 * Utility for calculating the maximum amount of purchases possible with a given formula and resource. If {@link spendResources} is changed to false, the calculation will be much faster with higher numbers.
 * @param formula The formula to use for calculating buy max from
 * @param resource The resource used when purchasing (is only read from)
 * @param spendResources Whether or not to count spent resources on each purchase or not. If true, costs will be approximated for performance, skewing towards fewer purchases
 * @param summedPurchases How many of the most expensive purchases should be manually summed for better accuracy. If unspecified uses 10 when spending resources and 0 when not
 */
export function calculateMaxAffordable(
    formula: InvertibleFormula,
    resource: Resource,
    spendResources?: true,
    summedPurchases?: number
): ComputedRef<DecimalSource>;
export function calculateMaxAffordable(
    formula: InvertibleIntegralFormula,
    resource: Resource,
    spendResources: Computable<boolean>,
    summedPurchases?: number
): ComputedRef<DecimalSource>;
export function calculateMaxAffordable(
    formula: InvertibleFormula,
    resource: Resource,
    spendResources: Computable<boolean> = true,
    summedPurchases?: number
) {
    const computedSpendResources = convertComputable(spendResources);
    return computed(() => {
        let affordable;
        if (unref(computedSpendResources)) {
            if (!formula.isIntegrable() || !formula.isIntegralInvertible()) {
                throw new Error(
                    "Cannot calculate max affordable of formula with non-invertible integral"
                );
            }
            affordable = Decimal.floor(
                formula.invertIntegral(Decimal.add(resource.value, formula.evaluateIntegral()))
            ).sub(unref(formula.innermostVariable) ?? 0);
            if (summedPurchases == null) {
                summedPurchases = 10;
            }
        } else {
            if (!formula.isInvertible()) {
                throw new Error("Cannot calculate max affordable of non-invertible formula");
            }
            affordable = Decimal.floor(formula.invert(resource.value));
            if (summedPurchases == null) {
                summedPurchases = 0;
            }
        }
        if (summedPurchases > 0 && Decimal.lt(calculateCost(formula, affordable, true, 0), 1e308)) {
            affordable = affordable.sub(summedPurchases).clampMin(0);
            let summedCost = calculateCost(formula, affordable, true, 0);
            while (true) {
                const nextCost = formula.evaluate(
                    affordable.add(unref(formula.innermostVariable) ?? 0)
                );
                if (Decimal.add(summedCost, nextCost).lte(resource.value)) {
                    affordable = affordable.add(1);
                    summedCost = Decimal.add(summedCost, nextCost);
                } else {
                    break;
                }
            }
        }
        return affordable;
    });
}

/**
 * Utility for calculating the cost of a formula for a given amount of purchases. If {@link spendResources} is changed to false, the calculation will be much faster with higher numbers.
 * @param formula The formula to use for calculating buy max from
 * @param amountToBuy The amount of purchases to calculate the cost for
 * @param spendResources Whether or not to count spent resources on each purchase or not. If true, costs will be approximated for performance, skewing towards higher cost
 * @param summedPurchases How many purchases to manually sum for improved accuracy. If not specified, defaults to 10 when spending resources and 0 when not
 */
export function calculateCost(
    formula: InvertibleFormula,
    amountToBuy: DecimalSource,
    spendResources?: true,
    summedPurchases?: number
): DecimalSource;
export function calculateCost(
    formula: InvertibleIntegralFormula,
    amountToBuy: DecimalSource,
    spendResources: boolean,
    summedPurchases?: number
): DecimalSource;
export function calculateCost(
    formula: InvertibleFormula,
    amountToBuy: DecimalSource,
    spendResources = true,
    summedPurchases?: number
) {
    let newValue = Decimal.add(amountToBuy, unref(formula.innermostVariable) ?? 0);
    if (spendResources) {
        const targetValue = newValue;
        newValue = newValue
            .sub(summedPurchases ?? 10)
            .clampMin(unref(formula.innermostVariable) ?? 0);
        let cost = Decimal.sub(formula.evaluateIntegral(newValue), formula.evaluateIntegral());
        if (targetValue.gt(1e308)) {
            // Too large of a number for summedPurchases to make a difference,
            // just get the cost and multiply by summed purchases
            return cost.add(Decimal.sub(targetValue, newValue).times(formula.evaluate(newValue)));
        }
        for (let i = newValue.toNumber(); i < targetValue.toNumber(); i++) {
            cost = cost.add(formula.evaluate(i));
        }
        return cost;
    } else {
        const targetValue = newValue;
        newValue = newValue
            .sub(summedPurchases ?? 0)
            .clampMin(unref(formula.innermostVariable) ?? 0);
        let cost = formula.evaluate(newValue);
        if (targetValue.gt(1e308)) {
            // Too large of a number for summedPurchases to make a difference,
            // just get the cost and multiply by summed purchases
            return Decimal.sub(targetValue, newValue).add(1).times(cost);
        }
        for (let i = newValue.toNumber(); i < targetValue.toNumber(); i++) {
            cost = Decimal.add(cost, formula.evaluate(i));
        }
        return cost;
    }
}

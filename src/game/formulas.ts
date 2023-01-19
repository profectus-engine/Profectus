import Decimal, { DecimalSource } from "util/bignum";
import { Computable, convertComputable, ProcessedComputable } from "util/computed";
import { ref, Ref, unref } from "vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericFormula = Formula<any>;
export type FormulaSource = ProcessedComputable<DecimalSource> | GenericFormula;
export type InvertibleFormulaSource = ProcessedComputable<DecimalSource> | InvertibleFormula;
export type InvertibleFormula = GenericFormula & {
    invert: (value: DecimalSource) => Decimal;
};

function hasVariable(value: FormulaSource): value is InvertibleFormula {
    return value instanceof Formula && value.hasVariable();
}

// It's really hard to type mapped tuples, but these classes seem to manage
type FormulasToDecimals<T extends FormulaSource[]> = {
    [K in keyof T]: DecimalSource;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TupleGuard<T extends any[]> = T extends any[] ? FormulasToDecimals<T> : never;
type GuardedFormulasToDecimals<T extends FormulaSource[]> = TupleGuard<T>;

export function unrefFormulaSource(value: FormulaSource) {
    return value instanceof Formula ? value.evaluate() : unref(value);
}

function invertNeg(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.neg(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sub(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(value, unrefFormulaSource(lhs)));
    }
    throw "Could not invert due to no input being a variable";
}

function invertSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.add(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.div(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(value, unrefFormulaSource(lhs)));
    }
    throw "Could not invert due to no input being a variable";
}

function invertDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.mul(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.recip(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow10(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(unrefFormulaSource(rhs), value));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(2, value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertPow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(value).div(Decimal.ln(unrefFormulaSource(lhs))));
    }
    throw "Could not invert due to no input being a variable";
}

function invertPow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, 10));
    }
    throw "Could not invert due to no input being a variable";
}

function invertPowBase(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value).div(unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, Decimal.recip(unrefFormulaSource(rhs))));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(unrefFormulaSource(lhs)).div(Decimal.ln(value)));
    }
    throw "Could not invert due to no input being a variable";
}

function invertExp(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value));
    }
    throw "Could not invert due to no input being a variable";
}

function tetrate(
    value: DecimalSource,
    height: DecimalSource = 2,
    payload: DecimalSource = Decimal.fromComponents_noNormalize(1, 0, 1)
) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.tetrate(value, heightNumber, payload);
}

function invertTetrate(
    value: DecimalSource,
    base: FormulaSource,
    height: FormulaSource,
    payload: FormulaSource
) {
    if (hasVariable(base)) {
        return base.invert(
            Decimal.slog(value, Decimal.minabs(1e308, unrefFormulaSource(height)).toNumber())
        );
    }
    // Other params can't be inverted ATM
    throw "Could not invert due to no input being a variable";
}

function iteratedexp(
    value: DecimalSource,
    height: DecimalSource = 2,
    payload: DecimalSource = Decimal.fromComponents_noNormalize(1, 0, 1)
) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.iteratedexp(value, heightNumber, new Decimal(payload));
}

function invertIteratedExp(
    value: DecimalSource,
    lhs: FormulaSource,
    height: FormulaSource,
    payload: FormulaSource
) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.iteratedlog(
                value,
                Math.E,
                Decimal.minabs(1e308, unrefFormulaSource(height)).toNumber()
            )
        );
    }
    // Other params can't be inverted ATM
    throw "Could not invert due to no input being a variable";
}

function iteratedLog(value: DecimalSource, lhs: DecimalSource = 10, times: DecimalSource = 2) {
    const timesNumber = Decimal.minabs(times, 1e308).toNumber();
    return Decimal.iteratedlog(value, lhs, timesNumber);
}

function slog(value: DecimalSource, lhs: DecimalSource = 10) {
    const baseNumber = Decimal.minabs(lhs, 1e308).toNumber();
    return Decimal.slog(value, baseNumber);
}

function invertSlog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.tetrate(value, Decimal.minabs(1e308, unrefFormulaSource(rhs)).toNumber())
        );
    }
    // Other params can't be inverted ATM
    throw "Could not invert due to no input being a variable";
}

function layeradd(value: DecimalSource, diff: DecimalSource, base: DecimalSource) {
    const diffNumber = Decimal.minabs(diff, 1e308).toNumber();
    return Decimal.layeradd(value, diffNumber, base);
}

function invertLayeradd(
    value: DecimalSource,
    lhs: FormulaSource,
    diff: FormulaSource,
    base: FormulaSource
) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.layeradd(
                value,
                Decimal.minabs(1e308, unrefFormulaSource(diff)).negate().toNumber()
            )
        );
    }
    // Other params can't be inverted ATM
    throw "Could not invert due to no input being a variable";
}

function invertLambertw(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(Math.E, value).times(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertSsqrt(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tetrate(value, 2));
    }
    throw "Could not invert due to no input being a variable";
}

function pentate(value: DecimalSource, height: DecimalSource, payload: DecimalSource) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.pentate(value, heightNumber, payload);
}

function invertSin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asin(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertCos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acos(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertTan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atan(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAsin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sin(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAcos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cos(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAtan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tan(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertSinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertCosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertTanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAsinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAcosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertAtanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export default class Formula<T extends [FormulaSource] | FormulaSource[]> {
    readonly inputs: T;

    private readonly internalEvaluate:
        | ((...inputs: GuardedFormulasToDecimals<T>) => DecimalSource)
        | undefined;
    private readonly internalInvert:
        | ((value: DecimalSource, ...inputs: T) => DecimalSource)
        | undefined;
    private readonly internalHasVariable: boolean;

    constructor(
        inputs: T,
        evaluate?: (this: Formula<T>, ...inputs: GuardedFormulasToDecimals<T>) => DecimalSource,
        invert?: (
            this: Formula<T>,
            value: DecimalSource,
            ...inputs: [...T, ...unknown[]]
        ) => DecimalSource,
        hasVariable = false
    ) {
        if (inputs.length !== 1 && evaluate == null) {
            throw "Evaluate function is required if inputs is not length 1";
        }
        if (inputs.length !== 1 && invert == null && hasVariable) {
            throw "A formula cannot be marked as having a variable if it is not invertible and inputs is not length 1";
        }

        this.inputs = inputs;
        this.internalEvaluate = evaluate;

        if (
            inputs.some(input => input instanceof Formula && !input.isInvertible()) ||
            (hasVariable === false && evaluate != null && invert == null)
        ) {
            this.internalHasVariable = false;
            return;
        }

        const numVariables = inputs.filter(
            input => input instanceof Formula && input.hasVariable()
        ).length;

        // ???
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.internalInvert = numVariables <= 1 ? invert : undefined;
        this.internalHasVariable = numVariables === 1 || (numVariables === 0 && hasVariable);
    }

    isInvertible(): this is InvertibleFormula {
        return this.internalInvert != null || this.internalEvaluate == null;
    }

    hasVariable(): boolean {
        return this.internalHasVariable;
    }

    evaluate(): DecimalSource {
        return (
            this.internalEvaluate?.call(
                this,
                ...(this.inputs.map(unrefFormulaSource) as GuardedFormulasToDecimals<T>)
            ) ?? unrefFormulaSource(this.inputs[0])
        );
    }

    invert(value: DecimalSource): DecimalSource {
        return this.internalInvert?.call(this, value, ...this.inputs) ?? value;
    }

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
            this.internalHasVariable === other.internalHasVariable
        );
    }

    /**
     * Creates a step-wise formula. After {@ref start} the formula will have an additional modifier.
     * This function assumes the incoming {@ref value} will be continuous and monotonically increasing.
     * @param value The value before applying the step
     * @param start The value at which to start applying the step
     * @param formulaModifier How this step should modify the formula. The incoming value will be the unmodified formula value _minus the start value_. So for example if an incoming formula evaluates to 200 and has a step that starts at 150, the formulaModifier would be given 50 as the parameter
     */
    public static step(
        value: FormulaSource,
        start: Computable<DecimalSource>,
        formulaModifier: (value: Ref<DecimalSource>) => GenericFormula
    ) {
        const lhsRef = ref<DecimalSource>(0);
        const formula = formulaModifier(lhsRef);
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
            throw "Could not invert due to no input being a variable";
        }
        return new Formula(
            [value],
            evalStep,
            formula.isInvertible() && !formula.hasVariable() ? invertStep : undefined
        );
    }

    public static if(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (value: Ref<DecimalSource>) => GenericFormula
    ) {
        const lhsRef = ref<DecimalSource>(0);
        const formula = formulaModifier(lhsRef);
        const processedCondition = convertComputable(condition);
        function evalStep(lhs: DecimalSource) {
            if (unref(processedCondition)) {
                lhsRef.value = lhs;
                return formula.evaluate();
            } else {
                return lhs;
            }
        }
        function invertStep(value: DecimalSource, lhs: FormulaSource) {
            if (!hasVariable(lhs)) {
                throw "Could not invert due to no input being a variable";
            }
            if (unref(processedCondition)) {
                return lhs.invert(formula.invert(value));
            } else {
                return lhs.invert(value);
            }
        }
        return new Formula(
            [value],
            evalStep,
            formula.isInvertible() && !formula.hasVariable() ? invertStep : undefined
        );
    }
    public static conditional(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (value: Ref<DecimalSource>) => GenericFormula
    ) {
        return Formula.if(value, condition, formulaModifier);
    }

    public static constant(value: InvertibleFormulaSource): InvertibleFormula {
        return new Formula([value]) as InvertibleFormula;
    }

    public static variable(value: ProcessedComputable<DecimalSource>): InvertibleFormula {
        return new Formula([value], undefined, undefined, true) as InvertibleFormula;
    }

    public static abs(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.abs);
    }

    public static neg(value: InvertibleFormulaSource): InvertibleFormula;
    public static neg(value: FormulaSource): GenericFormula;
    public static neg(value: FormulaSource) {
        return new Formula([value], Decimal.neg, invertNeg);
    }
    public static negate(value: FormulaSource) {
        return Formula.neg(value);
    }
    public static negated(value: FormulaSource) {
        return Formula.neg(value);
    }

    public static sign(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.sign);
    }
    public static sgn(value: FormulaSource) {
        return Formula.sign(value);
    }

    public static round(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.round);
    }

    public static floor(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.floor);
    }

    public static ceil(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.ceil);
    }

    public static trunc(value: FormulaSource): GenericFormula {
        return new Formula([value], Decimal.trunc);
    }

    public static add(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static add(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static add(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.add, invertAdd);
    }
    public static plus(value: FormulaSource, other: FormulaSource) {
        return Formula.add(value, other);
    }

    public static sub(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static sub(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static sub(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.sub, invertSub);
    }
    public static subtract(value: FormulaSource, other: FormulaSource) {
        return Formula.sub(value, other);
    }
    public static minus(value: FormulaSource, other: FormulaSource) {
        return Formula.sub(value, other);
    }

    public static mul(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static mul(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static mul(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.mul, invertMul);
    }
    public static multiply(value: FormulaSource, other: FormulaSource) {
        return Formula.mul(value, other);
    }
    public static times(value: FormulaSource, other: FormulaSource) {
        return Formula.mul(value, other);
    }

    public static div(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static div(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static div(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.div, invertDiv);
    }
    public static divide(value: FormulaSource, other: FormulaSource) {
        return Formula.div(value, other);
    }

    public static recip(value: InvertibleFormulaSource): InvertibleFormula;
    public static recip(value: FormulaSource): GenericFormula;
    public static recip(value: FormulaSource) {
        return new Formula([value], Decimal.recip, invertRecip);
    }
    public static reciprocal(value: FormulaSource): GenericFormula {
        return Formula.recip(value);
    }
    public static reciprocate(value: FormulaSource) {
        return Formula.recip(value);
    }

    public static max(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula([value, other], Decimal.max);
    }

    public static min(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula([value, other], Decimal.min);
    }

    public static minabs(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula([value, other], Decimal.minabs);
    }

    public static maxabs(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula([value, other], Decimal.maxabs);
    }

    public static clamp(
        value: FormulaSource,
        min: FormulaSource,
        max: FormulaSource
    ): GenericFormula {
        return new Formula([value, min, max], Decimal.clamp);
    }

    public static clampMin(value: FormulaSource, min: FormulaSource): GenericFormula {
        return new Formula([value, min], Decimal.clampMin);
    }

    public static clampMax(value: FormulaSource, max: FormulaSource): GenericFormula {
        return new Formula([value, max], Decimal.clampMax);
    }

    public static pLog10(value: InvertibleFormulaSource): InvertibleFormula;
    public static pLog10(value: FormulaSource): GenericFormula;
    public static pLog10(value: FormulaSource) {
        return new Formula([value], Decimal.pLog10);
    }

    public static absLog10(value: InvertibleFormulaSource): InvertibleFormula;
    public static absLog10(value: FormulaSource): GenericFormula;
    public static absLog10(value: FormulaSource) {
        return new Formula([value], Decimal.absLog10);
    }

    public static log10(value: InvertibleFormulaSource): InvertibleFormula;
    public static log10(value: FormulaSource): GenericFormula;
    public static log10(value: FormulaSource) {
        return new Formula([value], Decimal.log10, invertLog10);
    }

    public static log(
        value: InvertibleFormulaSource,
        base: InvertibleFormulaSource
    ): InvertibleFormula;
    public static log(value: FormulaSource, base: FormulaSource): GenericFormula;
    public static log(value: FormulaSource, base: FormulaSource) {
        return new Formula([value, base], Decimal.log, invertLog);
    }
    public static logarithm(value: FormulaSource, base: FormulaSource) {
        return Formula.log(value, base);
    }

    public static log2(value: InvertibleFormulaSource): InvertibleFormula;
    public static log2(value: FormulaSource): GenericFormula;
    public static log2(value: FormulaSource) {
        return new Formula([value], Decimal.log2, invertLog2);
    }

    public static ln(value: InvertibleFormulaSource): InvertibleFormula;
    public static ln(value: FormulaSource): GenericFormula;
    public static ln(value: FormulaSource) {
        return new Formula([value], Decimal.ln, invertLn);
    }

    public static pow(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static pow(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.pow, invertPow);
    }

    public static pow10(value: InvertibleFormulaSource): InvertibleFormula;
    public static pow10(value: FormulaSource): GenericFormula;
    public static pow10(value: FormulaSource) {
        return new Formula([value], Decimal.pow10, invertPow10);
    }

    public static pow_base(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static pow_base(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow_base(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.pow_base, invertPowBase);
    }

    public static root(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static root(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static root(value: FormulaSource, other: FormulaSource) {
        return new Formula([value, other], Decimal.root, invertRoot);
    }

    public static factorial(value: FormulaSource) {
        return new Formula([value], Decimal.factorial);
    }

    public static gamma(value: FormulaSource) {
        return new Formula([value], Decimal.gamma);
    }

    public static lngamma(value: FormulaSource) {
        return new Formula([value], Decimal.lngamma);
    }

    public static exp(value: InvertibleFormulaSource): InvertibleFormula;
    public static exp(value: FormulaSource): GenericFormula;
    public static exp(value: FormulaSource) {
        return new Formula([value], Decimal.exp, invertExp);
    }

    public static sqr(value: FormulaSource) {
        return Formula.pow(value, 2);
    }

    public static sqrt(value: FormulaSource) {
        return Formula.root(value, 2);
    }

    public static cube(value: FormulaSource) {
        return Formula.pow(value, 3);
    }

    public static cbrt(value: FormulaSource) {
        return Formula.root(value, 3);
    }

    public static tetrate(
        value: InvertibleFormulaSource,
        height?: InvertibleFormulaSource,
        payload?: InvertibleFormulaSource
    ): InvertibleFormula;
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
        return new Formula([value, height, payload], tetrate, invertTetrate);
    }

    public static iteratedexp(
        value: InvertibleFormulaSource,
        height?: InvertibleFormulaSource,
        payload?: InvertibleFormulaSource
    ): InvertibleFormula;
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
        return new Formula([value, height, payload], iteratedexp, invertIteratedExp);
    }

    public static iteratedlog(
        value: FormulaSource,
        base: FormulaSource = 10,
        times: FormulaSource = 1
    ): GenericFormula {
        return new Formula([value, base, times], iteratedLog);
    }

    public static slog(
        value: InvertibleFormulaSource,
        base?: InvertibleFormulaSource
    ): InvertibleFormula;
    public static slog(value: FormulaSource, base?: FormulaSource): GenericFormula;
    public static slog(value: FormulaSource, base: FormulaSource = 10) {
        return new Formula([value, base], slog, invertSlog);
    }

    public static layeradd10(value: FormulaSource, diff: FormulaSource): GenericFormula {
        return new Formula([value, diff], Decimal.layeradd10);
    }

    public static layeradd(
        value: InvertibleFormulaSource,
        diff: InvertibleFormulaSource,
        base?: InvertibleFormulaSource
    ): InvertibleFormula;
    public static layeradd(
        value: FormulaSource,
        diff: FormulaSource,
        base?: FormulaSource
    ): GenericFormula;
    public static layeradd(value: FormulaSource, diff: FormulaSource, base: FormulaSource = 10) {
        return new Formula([value, diff, base], layeradd, invertLayeradd);
    }

    public static lambertw(value: InvertibleFormulaSource): InvertibleFormula;
    public static lambertw(value: FormulaSource): GenericFormula;
    public static lambertw(value: FormulaSource) {
        return new Formula([value], Decimal.lambertw, invertLambertw);
    }

    public static ssqrt(value: InvertibleFormulaSource): InvertibleFormula;
    public static ssqrt(value: FormulaSource): GenericFormula;
    public static ssqrt(value: FormulaSource) {
        return new Formula([value], Decimal.ssqrt, invertSsqrt);
    }

    public static pentate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return new Formula([value, height, payload], pentate);
    }

    public static sin(value: InvertibleFormulaSource): InvertibleFormula;
    public static sin(value: FormulaSource): GenericFormula;
    public static sin(value: FormulaSource) {
        return new Formula([value], Decimal.sin, invertAsin);
    }

    public static cos(value: InvertibleFormulaSource): InvertibleFormula;
    public static cos(value: FormulaSource): GenericFormula;
    public static cos(value: FormulaSource) {
        return new Formula([value], Decimal.cos, invertAcos);
    }

    public static tan(value: InvertibleFormulaSource): InvertibleFormula;
    public static tan(value: FormulaSource): GenericFormula;
    public static tan(value: FormulaSource) {
        return new Formula([value], Decimal.tan, invertAtan);
    }

    public static asin(value: InvertibleFormulaSource): InvertibleFormula;
    public static asin(value: FormulaSource): GenericFormula;
    public static asin(value: FormulaSource) {
        return new Formula([value], Decimal.asin, invertSin);
    }

    public static acos(value: InvertibleFormulaSource): InvertibleFormula;
    public static acos(value: FormulaSource): GenericFormula;
    public static acos(value: FormulaSource) {
        return new Formula([value], Decimal.acos, invertCos);
    }

    public static atan(value: InvertibleFormulaSource): InvertibleFormula;
    public static atan(value: FormulaSource): GenericFormula;
    public static atan(value: FormulaSource) {
        return new Formula([value], Decimal.atan, invertTan);
    }

    public static sinh(value: InvertibleFormulaSource): InvertibleFormula;
    public static sinh(value: FormulaSource): GenericFormula;
    public static sinh(value: FormulaSource) {
        return new Formula([value], Decimal.sinh, invertAsinh);
    }

    public static cosh(value: InvertibleFormulaSource): InvertibleFormula;
    public static cosh(value: FormulaSource): GenericFormula;
    public static cosh(value: FormulaSource) {
        return new Formula([value], Decimal.cosh, invertAcosh);
    }

    public static tanh(value: InvertibleFormulaSource): InvertibleFormula;
    public static tanh(value: FormulaSource): GenericFormula;
    public static tanh(value: FormulaSource) {
        return new Formula([value], Decimal.tanh, invertAtanh);
    }

    public static asinh(value: InvertibleFormulaSource): InvertibleFormula;
    public static asinh(value: FormulaSource): GenericFormula;
    public static asinh(value: FormulaSource) {
        return new Formula([value], Decimal.asinh, invertSinh);
    }

    public static acosh(value: InvertibleFormulaSource): InvertibleFormula;
    public static acosh(value: FormulaSource): GenericFormula;
    public static acosh(value: FormulaSource) {
        return new Formula([value], Decimal.acosh, invertCosh);
    }

    public static atanh(value: InvertibleFormulaSource): InvertibleFormula;
    public static atanh(value: FormulaSource): GenericFormula;
    public static atanh(value: FormulaSource) {
        return new Formula([value], Decimal.atanh, invertTanh);
    }

    public abs() {
        return Formula.abs(this);
    }

    public neg() {
        return Formula.neg(this);
    }
    public negate() {
        return Formula.neg(this);
    }
    public negated() {
        return Formula.neg(this);
    }

    public sign() {
        return Formula.sign(this);
    }
    public sgn() {
        return this.sign();
    }

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

    public add(value: FormulaSource) {
        return Formula.add(this, value);
    }
    public plus(value: FormulaSource) {
        return Formula.add(this, value);
    }

    public sub(value: FormulaSource) {
        return Formula.sub(this, value);
    }
    public subtract(value: FormulaSource) {
        return Formula.sub(this, value);
    }
    public minus(value: FormulaSource) {
        return Formula.sub(this, value);
    }

    public mul(value: FormulaSource) {
        return Formula.mul(this, value);
    }
    public multiply(value: FormulaSource) {
        return Formula.mul(this, value);
    }
    public times(value: FormulaSource) {
        return Formula.mul(this, value);
    }

    public div(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public divide(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public divideBy(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public dividedBy(value: FormulaSource) {
        return Formula.div(this, value);
    }

    public recip() {
        return Formula.recip(this);
    }
    public reciprocal() {
        return Formula.recip(this);
    }
    public reciprocate() {
        return Formula.recip(this);
    }

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

    public log10() {
        return Formula.log10(this);
    }

    public log(value: FormulaSource) {
        return Formula.log(this, value);
    }
    public logarithm(value: FormulaSource) {
        return Formula.log(this, value);
    }

    public log2() {
        return Formula.log2(this);
    }

    public ln() {
        return Formula.ln(this);
    }

    public pow(value: FormulaSource) {
        return Formula.pow(this, value);
    }

    public pow10() {
        return Formula.pow10(this);
    }

    public pow_base(value: FormulaSource) {
        return Formula.pow_base(this, value);
    }

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

    public exp() {
        return Formula.exp(this);
    }

    public sqr() {
        return Formula.pow(this, 2);
    }

    public sqrt() {
        return Formula.root(this, 2);
    }
    public cube() {
        return Formula.pow(this, 3);
    }

    public cbrt() {
        return Formula.root(this, 3);
    }

    public tetrate(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.tetrate(this, height, payload);
    }

    public iteratedexp(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.iteratedexp(this, height, payload);
    }

    public iteratedlog(base: FormulaSource = 10, times: FormulaSource = 1) {
        return Formula.iteratedlog(this, base, times);
    }

    public slog(base: FormulaSource = 10) {
        return Formula.slog(this, base);
    }

    public layeradd10(diff: FormulaSource) {
        return Formula.layeradd10(this, diff);
    }

    public layeradd(diff: FormulaSource, base: FormulaSource) {
        return Formula.layeradd(this, diff, base);
    }

    public lambertw() {
        return Formula.lambertw(this);
    }

    public ssqrt() {
        return Formula.ssqrt(this);
    }

    public pentate(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return Formula.pentate(this, height, payload);
    }

    public sin() {
        return Formula.sin(this);
    }

    public cos() {
        return Formula.cos(this);
    }

    public tan() {
        return Formula.tan(this);
    }

    public asin() {
        return Formula.asin(this);
    }

    public acos() {
        return Formula.acos(this);
    }

    public atan() {
        return Formula.atan(this);
    }

    public sinh() {
        return Formula.sinh(this);
    }

    public cosh() {
        return Formula.cosh(this);
    }

    public tanh() {
        return Formula.tanh(this);
    }

    public asinh() {
        return Formula.asinh(this);
    }

    public acosh() {
        return Formula.acosh(this);
    }

    public atanh() {
        return Formula.atanh(this);
    }
}

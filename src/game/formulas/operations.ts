import Decimal, { DecimalSource } from "util/bignum";
import { Ref } from "vue";
import Formula, { hasVariable, unrefFormulaSource } from "./formulas";
import { FormulaSource, GenericFormula, InvertFunction, SubstitutionStack } from "./types";

export function passthrough<T extends GenericFormula | DecimalSource>(value: T): T {
    return value;
}

export function invertNeg(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.neg(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateNeg(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        return Formula.neg(lhs.getIntegralFormula(variable, stack));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function applySubstitutionNeg(value: GenericFormula) {
    return Formula.neg(value);
}

export function invertAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sub(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(value, unrefFormulaSource(lhs)));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAdd(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.times(rhs, variable ?? lhs.innermostVariable ?? 0).add(x);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.times(lhs, variable ?? rhs.innermostVariable ?? 0).add(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function integrateInnerAdd(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.add(x, rhs);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.add(x, lhs);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.add(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(unrefFormulaSource(lhs), value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateSub(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.sub(x, Formula.times(rhs, variable ?? lhs.innermostVariable ?? 0));
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.times(lhs, variable ?? rhs.innermostVariable ?? 0).sub(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function integrateInnerSub(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.sub(x, rhs);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.sub(x, lhs);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.div(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(value, unrefFormulaSource(lhs)));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateMul(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.times(x, rhs);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.times(x, lhs);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function applySubstitutionMul(
    value: GenericFormula,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        return Formula.div(value, rhs);
    } else if (hasVariable(rhs)) {
        return Formula.div(value, lhs);
    }
    throw new Error("Could not apply substitution due to no input being a variable");
}

export function invertDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.mul(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(unrefFormulaSource(lhs), value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateDiv(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.div(x, rhs);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.div(lhs, x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function applySubstitutionDiv(
    value: GenericFormula,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        return Formula.mul(value, rhs);
    } else if (hasVariable(rhs)) {
        return Formula.mul(value, lhs);
    }
    throw new Error("Could not apply substitution due to no input being a variable");
}

export function invertRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.recip(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateRecip(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow10(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateLog10(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x).sub(1).times(x).div(Formula.ln(10));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(unrefFormulaSource(rhs), value));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateLog(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x).sub(1).times(x).div(Formula.ln(rhs));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(2, value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateLog2(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x).sub(1).times(x).div(Formula.ln(2));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateLn(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x).sub(1).times(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertPow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(value).div(Decimal.ln(unrefFormulaSource(lhs))));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integratePow(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        const pow = Formula.add(rhs, 1);
        return Formula.pow(x, pow).div(pow);
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        return Formula.pow(lhs, x).div(Formula.ln(lhs));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertPow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, 10));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integratePow10(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.ln(x).sub(1).times(x).div(Decimal.ln(10));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertPowBase(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value).div(unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integratePowBase(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.pow(rhs, x).div(Formula.ln(rhs));
    } else if (hasVariable(rhs)) {
        const x = rhs.getIntegralFormula(variable, stack);
        const denominator = Formula.add(lhs, 1);
        return Formula.pow(x, denominator).div(denominator);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, Decimal.recip(unrefFormulaSource(rhs))));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(unrefFormulaSource(lhs)).div(Decimal.ln(value)));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateRoot(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.pow(x, Formula.recip(rhs).add(1)).times(rhs).div(Formula.add(rhs, 1));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertExp(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateExp(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.exp(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function tetrate(
    value: DecimalSource,
    height: DecimalSource = 2,
    payload: DecimalSource = Decimal.fromComponents_noNormalize(1, 0, 1)
) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.tetrate(value, heightNumber, payload);
}

export function invertTetrate(
    value: DecimalSource,
    base: FormulaSource,
    height: FormulaSource,
    payload: FormulaSource
) {
    if (hasVariable(base)) {
        return base.invert(Decimal.ssqrt(value));
    }
    // Other params can't be inverted ATM
    throw new Error("Could not invert due to no input being a variable");
}

export function iteratedexp(
    value: DecimalSource,
    height: DecimalSource = 2,
    payload: DecimalSource = Decimal.fromComponents_noNormalize(1, 0, 1)
) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.iteratedexp(value, heightNumber, new Decimal(payload));
}

export function invertIteratedExp(
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
    throw new Error("Could not invert due to no input being a variable");
}

export function iteratedLog(
    value: DecimalSource,
    lhs: DecimalSource = 10,
    times: DecimalSource = 2
) {
    const timesNumber = Decimal.minabs(times, 1e308).toNumber();
    return Decimal.iteratedlog(value, lhs, timesNumber);
}

export function slog(value: DecimalSource, lhs: DecimalSource = 10) {
    const baseNumber = Decimal.minabs(lhs, 1e308).toNumber();
    return Decimal.slog(value, baseNumber);
}

export function invertSlog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.tetrate(value, Decimal.minabs(1e308, unrefFormulaSource(rhs)).toNumber())
        );
    }
    // Other params can't be inverted ATM
    throw new Error("Could not invert due to no input being a variable");
}

export function layeradd(value: DecimalSource, diff: DecimalSource, base: DecimalSource) {
    const diffNumber = Decimal.minabs(diff, 1e308).toNumber();
    return Decimal.layeradd(value, diffNumber, base);
}

export function invertLayeradd(
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
    throw new Error("Could not invert due to no input being a variable");
}

export function invertLambertw(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(Math.E, value).times(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function invertSsqrt(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tetrate(value, 2));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function pentate(value: DecimalSource, height: DecimalSource, payload: DecimalSource) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.pentate(value, heightNumber, payload);
}

export function invertSin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asin(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateSin(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.cos(x).neg();
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertCos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acos(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateCos(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.sin(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertTan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atan(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateTan(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.cos(x).ln().neg();
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAsin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sin(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAsin(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.asin(x)
            .times(x)
            .add(Formula.sqrt(Formula.sub(1, Formula.pow(x, 2))));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAcos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cos(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAcos(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.acos(x)
            .times(x)
            .sub(Formula.sqrt(Formula.sub(1, Formula.pow(x, 2))));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAtan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tan(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAtan(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.atan(x)
            .times(x)
            .sub(Formula.ln(Formula.pow(x, 2).add(1)).div(2));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertSinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asinh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateSinh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.cosh(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertCosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acosh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateCosh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.sinh(x);
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertTanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atanh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateTanh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.cosh(x).ln();
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAsinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sinh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAsinh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.asinh(x).times(x).sub(Formula.pow(x, 2).add(1).sqrt());
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAcosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cosh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAcosh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.acosh(x)
            .times(x)
            .sub(Formula.add(x, 1).sqrt().times(Formula.sub(x, 1).sqrt()));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function invertAtanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tanh(value));
    }
    throw new Error("Could not invert due to no input being a variable");
}

export function integrateAtanh(
    variable: Ref<DecimalSource>,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.getIntegralFormula(variable, stack);
        return Formula.atanh(x)
            .times(x)
            .add(Formula.sub(1, Formula.pow(x, 2)).ln().div(2));
    }
    throw new Error("Could not integrate due to no input being a variable");
}

export function createPassthroughBinaryFormula(
    operation: (a: DecimalSource, b: DecimalSource) => DecimalSource
) {
    return (value: FormulaSource, other: FormulaSource) =>
        new Formula({
            inputs: [value, other],
            evaluate: operation,
            invert: passthrough as InvertFunction<[FormulaSource, FormulaSource]>
        });
}

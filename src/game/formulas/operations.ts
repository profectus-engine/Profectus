import Decimal, { DecimalSource } from "util/bignum";
import { unref } from "vue";
import Formula, { hasVariable, unrefFormulaSource } from "./formulas";
import { FormulaSource, InvertFunction, SubstitutionStack } from "./types";

export function passthrough(value: DecimalSource) {
    return value;
}

export function invertNeg(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.neg(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateNeg(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        return Decimal.neg(lhs.evaluateIntegral(variable, stack));
    }
    throw "Could not integrate due to no input being a variable";
}

export function applySubstitutionNeg(value: DecimalSource) {
    return Decimal.neg(value);
}

export function invertAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sub(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(value, unrefFormulaSource(lhs)));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAdd(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.times(
            unrefFormulaSource(rhs),
            variable ?? unref(lhs.innermostVariable) ?? 0
        ).add(x);
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.times(
            unrefFormulaSource(lhs),
            variable ?? unref(rhs.innermostVariable) ?? 0
        ).add(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function integrateInnerAdd(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.add(x, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.add(x, unrefFormulaSource(lhs));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sub(b));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sub(b));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.add(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateSub(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.sub(
            x,
            Decimal.times(unrefFormulaSource(rhs), variable ?? unref(lhs.innermostVariable) ?? 0)
        );
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.times(
            unrefFormulaSource(lhs),
            variable ?? unref(rhs.innermostVariable) ?? 0
        ).sub(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function integrateInnerSub(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.sub(x, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.sub(x, unrefFormulaSource(lhs));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sqrt().sub(b));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sqrt().sub(b));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.div(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(value, unrefFormulaSource(lhs)));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateMul(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.times(x, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.times(x, unrefFormulaSource(lhs));
    }
    throw "Could not integrate due to no input being a variable";
}

export function applySubstitutionMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.div(value, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        return Decimal.div(value, unrefFormulaSource(lhs));
    }
    throw "Could not apply substitution due to no input being a variable";
}

export function invertIntegrateMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).div(Decimal.sqrt(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).div(Decimal.sqrt(b)));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.mul(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateDiv(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.div(x, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        return Decimal.div(unrefFormulaSource(lhs), x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function applySubstitutionDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.mul(value, unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        return Decimal.mul(value, unrefFormulaSource(lhs));
    }
    throw "Could not apply substitution due to no input being a variable";
}

export function invertIntegrateDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).times(Decimal.sqrt(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).times(Decimal.sqrt(b)));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.recip(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateRecip(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow10(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateLog10(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x).sub(1).times(x).div(Decimal.ln(10));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.exp(Decimal.ln(2).add(Decimal.ln(5)).times(value).div(Math.E).lambertw().add(1))
        );
    }
    throw "Could not invert due to no input being a variable";
}

export function invertLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(unrefFormulaSource(rhs), value));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateLog(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x)
            .sub(1)
            .times(x)
            .div(Decimal.ln(unrefFormulaSource(rhs)));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const numerator = Decimal.ln(unrefFormulaSource(rhs)).times(value);
        return lhs.invert(numerator.div(numerator.div(Math.E).lambertw()));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(2, value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateLog2(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x).sub(1).times(x).div(Decimal.ln(2));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(Decimal.ln(2).times(value).div(Math.E).lambertw().add(1)));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateLn(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x).sub(1).times(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(Decimal.div(value, Math.E).lambertw().add(1)));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertPow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(value).div(Decimal.ln(unrefFormulaSource(lhs))));
    }
    throw "Could not invert due to no input being a variable";
}

export function integratePow(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        const pow = Decimal.add(unrefFormulaSource(rhs), 1);
        return Decimal.pow(x, pow).div(pow);
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        const b = unrefFormulaSource(lhs);
        return Decimal.pow(b, x).div(Decimal.ln(b));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegratePow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.negate(b).sub(1).negate().times(value).root(Decimal.add(b, 1)));
    } else if (hasVariable(rhs)) {
        const denominator = Decimal.ln(unrefFormulaSource(lhs));
        return rhs.invert(Decimal.times(denominator, value).ln().div(denominator));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertPow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, 10));
    }
    throw "Could not invert due to no input being a variable";
}

export function integratePow10(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.ln(x).sub(1).times(x).div(Decimal.ln(10));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegratePow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.ln(2).add(Decimal.ln(5)).times(value).div(Math.E).lambertw().add(1).exp()
        );
    }
    throw "Could not invert due to no input being a variable";
}

export function invertPowBase(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value).div(unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integratePowBase(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        const b = unrefFormulaSource(rhs);
        return Decimal.pow(b, x).div(Decimal.ln(b));
    } else if (hasVariable(rhs)) {
        const x = rhs.evaluateIntegral(variable, stack);
        const denominator = Decimal.add(unrefFormulaSource(lhs), 1);
        return Decimal.pow(x, denominator).div(denominator);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegratePowBase(
    value: DecimalSource,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.ln(b).times(value).ln().div(Decimal.ln(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.neg(b).sub(1).negate().times(value).root(Decimal.add(b, 1)));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, Decimal.recip(unrefFormulaSource(rhs))));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(unrefFormulaSource(lhs)).div(Decimal.ln(value)));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateRoot(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        const a = unrefFormulaSource(rhs);
        return Decimal.pow(x, Decimal.recip(a).add(1)).times(a).div(Decimal.add(a, 1));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertIntegrateRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(
            Decimal.add(b, 1)
                .times(value)
                .div(b)
                .pow(Decimal.div(b, Decimal.add(b, 1)))
        );
    }
    throw "Could not invert due to no input being a variable";
}

export function invertExp(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateExp(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.exp(x);
    }
    throw "Could not integrate due to no input being a variable";
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
    throw "Could not invert due to no input being a variable";
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
    throw "Could not invert due to no input being a variable";
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
    throw "Could not invert due to no input being a variable";
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
    throw "Could not invert due to no input being a variable";
}

export function invertLambertw(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(Math.E, value).times(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function invertSsqrt(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tetrate(value, 2));
    }
    throw "Could not invert due to no input being a variable";
}

export function pentate(value: DecimalSource, height: DecimalSource, payload: DecimalSource) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.pentate(value, heightNumber, payload);
}

export function invertSin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asin(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateSin(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.cos(x).neg();
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertCos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acos(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateCos(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.sin(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertTan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atan(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateTan(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.cos(x).ln().neg();
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAsin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sin(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAsin(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.asin(x)
            .times(x)
            .add(Decimal.sqrt(Decimal.sub(1, Decimal.pow(x, 2))));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAcos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cos(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAcos(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.acos(x)
            .times(x)
            .sub(Decimal.sqrt(Decimal.sub(1, Decimal.pow(x, 2))));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAtan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tan(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAtan(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.atan(x)
            .times(x)
            .sub(Decimal.ln(Decimal.pow(x, 2).add(1)).div(2));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertSinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateSinh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.cosh(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertCosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateCosh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.sinh(x);
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertTanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateTanh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.cosh(x).ln();
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAsinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAsinh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.asinh(x).times(x).sub(Decimal.pow(x, 2).add(1).sqrt());
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAcosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAcosh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.acosh(x)
            .times(x)
            .sub(Decimal.add(x, 1).sqrt().times(Decimal.sub(x, 1).sqrt()));
    }
    throw "Could not integrate due to no input being a variable";
}

export function invertAtanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

export function integrateAtanh(
    variable: DecimalSource | undefined,
    stack: SubstitutionStack,
    lhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const x = lhs.evaluateIntegral(variable, stack);
        return Decimal.atanh(x)
            .times(x)
            .add(Decimal.sub(1, Decimal.pow(x, 2)).ln().div(2));
    }
    throw "Could not integrate due to no input being a variable";
}

export function createPassthroughBinaryFormula(
    operation: (a: DecimalSource, b: DecimalSource) => DecimalSource
) {
    return (value: FormulaSource, other: FormulaSource) =>
        new Formula({
            inputs: [value, other],
            evaluate: operation,
            invert: passthrough as InvertFunction<[FormulaSource, FormulaSource]>,
            invertIntegral: passthrough as InvertFunction<[FormulaSource, FormulaSource]>
        });
}

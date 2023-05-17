import Decimal, { DecimalSource } from "util/bignum";
import Formula, { hasVariable, unrefFormulaSource } from "./formulas";
import { FormulaSource, GenericFormula, InvertFunction, SubstitutionStack } from "./types";

const ln10 = Decimal.ln(10);

export function passthrough<T extends GenericFormula | DecimalSource>(value: T): T {
    return value;
}

export function invertNeg(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.neg(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateNeg(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        return Formula.neg(lhs.getIntegralFormula(stack));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
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
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAdd(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.times(rhs, lhs.innermostVariable ?? 0).add(x);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.times(lhs, rhs.innermostVariable ?? 0).add(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function integrateInnerAdd(
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.add(x, rhs);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.add(x, lhs);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.add(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(unrefFormulaSource(lhs), value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateSub(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.sub(x, Formula.times(rhs, lhs.innermostVariable ?? 0));
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.times(lhs, rhs.innermostVariable ?? 0).sub(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function integrateInnerSub(
    stack: SubstitutionStack,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.sub(x, rhs);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.sub(x, lhs);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.div(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(value, unrefFormulaSource(lhs)));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateMul(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.times(x, rhs);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.times(x, lhs);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
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
    console.error("Could not apply substitution due to no input being a variable");
    return Formula.constant(0);
}

export function invertDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.mul(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.div(unrefFormulaSource(lhs), value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateDiv(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.div(x, rhs);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.div(lhs, x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
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
    console.error("Could not apply substitution due to no input being a variable");
    return Formula.constant(0);
}

export function invertRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.recip(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateRecip(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.ln(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow10(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

function internalIntegrateLog10(lhs: DecimalSource) {
    return Decimal.ln(lhs).sub(1).times(lhs).div(ln10);
}

function internalInvertIntegralLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const numerator = ln10.times(value);
        return lhs.invert(numerator.div(numerator.div(Math.E).lambertw()));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateLog10(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        return new Formula({
            inputs: [lhs.getIntegralFormula(stack)],
            evaluate: internalIntegrateLog10,
            invert: internalInvertIntegralLog10
        });
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(unrefFormulaSource(rhs), value));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

function internalIntegrateLog(lhs: DecimalSource, rhs: DecimalSource) {
    return Decimal.ln(lhs).sub(1).times(lhs).div(Decimal.ln(rhs));
}

function internalInvertIntegralLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const numerator = Decimal.ln(unrefFormulaSource(rhs)).times(value);
        return lhs.invert(numerator.div(numerator.div(Math.E).lambertw()));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateLog(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        return new Formula({
            inputs: [lhs.getIntegralFormula(stack), rhs],
            evaluate: internalIntegrateLog,
            invert: internalInvertIntegralLog
        });
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(2, value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

function internalIntegrateLog2(lhs: DecimalSource) {
    return Decimal.ln(lhs).sub(1).times(lhs).div(Decimal.ln(2));
}

function internalInvertIntegralLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const numerator = Decimal.ln(2).times(value);
        return lhs.invert(numerator.div(numerator.div(Math.E).lambertw()));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateLog2(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        return new Formula({
            inputs: [lhs.getIntegralFormula(stack)],
            evaluate: internalIntegrateLog2,
            invert: internalInvertIntegralLog2
        });
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

function internalIntegrateLn(lhs: DecimalSource) {
    return Decimal.ln(lhs).sub(1).times(lhs);
}

function internalInvertIntegralLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.div(value, Decimal.div(value, Math.E).lambertw()));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateLn(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        return new Formula({
            inputs: [lhs.getIntegralFormula(stack)],
            evaluate: internalIntegrateLn,
            invert: internalInvertIntegralLn
        });
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertPow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(value).div(Decimal.ln(unrefFormulaSource(lhs))));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integratePow(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        const pow = Formula.add(rhs, 1);
        return Formula.pow(x, pow).div(pow);
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        return Formula.pow(lhs, x).div(Formula.ln(lhs));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertPow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, 10));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integratePow10(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.pow10(x).div(Formula.ln(10));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertPowBase(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value).div(Decimal.ln(unrefFormulaSource(rhs))));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.root(unrefFormulaSource(lhs), value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integratePowBase(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.pow(rhs, x).div(Formula.ln(rhs));
    } else if (hasVariable(rhs)) {
        if (!rhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = rhs.getIntegralFormula(stack);
        const denominator = Formula.add(lhs, 1);
        return Formula.pow(x, denominator).div(denominator);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, Decimal.recip(unrefFormulaSource(rhs))));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.ln(unrefFormulaSource(lhs)).div(Decimal.ln(value)));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateRoot(stack: SubstitutionStack, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.pow(x, Formula.recip(rhs).add(1)).times(rhs).div(Formula.add(rhs, 1));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertExp(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateExp(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.exp(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
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
    console.error("Could not invert due to no input being a variable");
    return 0;
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
    console.error("Could not invert due to no input being a variable");
    return 0;
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
    console.error("Could not invert due to no input being a variable");
    return 0;
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
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function invertLambertw(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(Math.E, value).times(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function invertSsqrt(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tetrate(value, 2));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function pentate(value: DecimalSource, height: DecimalSource, payload: DecimalSource) {
    const heightNumber = Decimal.minabs(height, 1e308).toNumber();
    return Decimal.pentate(value, heightNumber, payload);
}

export function invertSin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asin(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateSin(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.cos(x).neg();
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertCos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acos(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateCos(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.sin(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertTan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atan(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateTan(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.cos(x).ln().neg();
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAsin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sin(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAsin(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.asin(x)
            .times(x)
            .add(Formula.sqrt(Formula.sub(1, Formula.pow(x, 2))));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAcos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cos(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAcos(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.acos(x)
            .times(x)
            .sub(Formula.sqrt(Formula.sub(1, Formula.pow(x, 2))));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAtan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tan(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAtan(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.atan(x)
            .times(x)
            .sub(Formula.ln(Formula.pow(x, 2).add(1)).div(2));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertSinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asinh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateSinh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.cosh(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertCosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acosh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateCosh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.sinh(x);
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertTanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atanh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateTanh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.cosh(x).ln();
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAsinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sinh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAsinh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.asinh(x).times(x).sub(Formula.pow(x, 2).add(1).sqrt());
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAcosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cosh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAcosh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.acosh(x)
            .times(x)
            .sub(Formula.add(x, 1).sqrt().times(Formula.sub(x, 1).sqrt()));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
}

export function invertAtanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tanh(value));
    }
    console.error("Could not invert due to no input being a variable");
    return 0;
}

export function integrateAtanh(stack: SubstitutionStack, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        if (!lhs.isIntegrable()) {
            console.error("Could not integrate due to variable not being integrable");
            return Formula.constant(0);
        }
        const x = lhs.getIntegralFormula(stack);
        return Formula.atanh(x)
            .times(x)
            .add(Formula.sub(1, Formula.pow(x, 2)).ln().div(2));
    }
    console.error("Could not integrate due to no input being a variable");
    return Formula.constant(0);
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

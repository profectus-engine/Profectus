import { Resource } from "features/resources/resource";
import Decimal, { DecimalSource } from "util/bignum";
import { Computable, convertComputable, ProcessedComputable } from "util/computed";
import { computed, ComputedRef, ref, Ref, unref } from "vue";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericFormula = Formula<any>;
export type FormulaSource = ProcessedComputable<DecimalSource> | GenericFormula;
export type InvertibleFormula = GenericFormula & {
    invert: (value: DecimalSource) => DecimalSource;
};
export type IntegrableFormula = GenericFormula & {
    evaluateIntegral: (variable?: DecimalSource) => DecimalSource;
};
export type InvertibleIntegralFormula = GenericFormula & {
    invertIntegral: (value: DecimalSource) => DecimalSource;
};

export type FormulaOptions<T extends [FormulaSource] | FormulaSource[]> =
    | {
          variable: ProcessedComputable<DecimalSource>;
      }
    | {
          inputs: [FormulaSource];
      }
    | {
          inputs: T;
          evaluate: (this: Formula<T>, ...inputs: GuardedFormulasToDecimals<T>) => DecimalSource;
          invert?: (
              this: Formula<T>,
              value: DecimalSource,
              ...inputs: [...T, ...unknown[]]
          ) => DecimalSource;
          integrate?: (
              this: Formula<T>,
              variable: DecimalSource | undefined,
              ...inputs: T
          ) => DecimalSource;
          invertIntegral?: (this: Formula<T>, value: DecimalSource, ...inputs: T) => DecimalSource;
          hasVariable?: boolean;
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

export function unrefFormulaSource(value: FormulaSource, variable?: DecimalSource) {
    return value instanceof Formula ? value.evaluate(variable) : unref(value);
}

function passthrough(value: DecimalSource) {
    return value;
}

function invertNeg(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.neg(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateNeg(variable: DecimalSource | undefined, lhs: FormulaSource) {
    return Decimal.pow(unrefFormulaSource(lhs, variable), 2).div(2).neg();
}

function invertAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sub(value, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        return rhs.invert(Decimal.sub(value, unrefFormulaSource(lhs)));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAdd(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.pow(x, 2)
            .div(2)
            .add(Decimal.times(unrefFormulaSource(rhs), x));
    } else if (hasVariable(rhs)) {
        const x = unrefFormulaSource(rhs, variable);
        return Decimal.pow(x, 2)
            .div(2)
            .add(Decimal.times(unrefFormulaSource(lhs), x));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateAdd(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sub(b));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sub(b));
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

function integrateSub(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.pow(x, 2)
            .div(2)
            .add(Decimal.times(unrefFormulaSource(rhs), x).neg());
    } else if (hasVariable(rhs)) {
        const x = unrefFormulaSource(rhs, variable);
        return Decimal.sub(unrefFormulaSource(lhs), Decimal.div(x, 2)).times(x);
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateSub(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sqrt().sub(b));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.pow(b, 2).add(Decimal.times(value, 2)).sqrt().sub(b));
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

function integrateMul(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.pow(x, 2).div(2).times(unrefFormulaSource(rhs));
    } else if (hasVariable(rhs)) {
        const x = unrefFormulaSource(rhs, variable);
        return Decimal.pow(x, 2).div(2).times(unrefFormulaSource(lhs));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateMul(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).div(Decimal.sqrt(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).div(Decimal.sqrt(b)));
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

function integrateDiv(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.pow(x, 2).div(Decimal.times(2, unrefFormulaSource(rhs)));
    } else if (hasVariable(rhs)) {
        const x = unrefFormulaSource(rhs, variable);
        return Decimal.pow(x, 2).div(Decimal.times(2, unrefFormulaSource(lhs)));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateDiv(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).times(Decimal.sqrt(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.sqrt(value).times(Decimal.sqrt(2)).times(Decimal.sqrt(b)));
    }
    throw "Could not invert due to no input being a variable";
}

function invertRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.recip(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateRecip(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.ln(x);
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateRecip(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow10(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateLog10(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.times(x, Decimal.sub(Decimal.ln(x), 1).div(Decimal.ln(10)));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateLog10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.exp(Decimal.ln(2).add(Decimal.ln(5)).times(value).div(Math.E).lambertw().add(1))
        );
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

function integrateLog(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.times(
            x,
            Decimal.sub(Decimal.ln(x), 1).div(Decimal.ln(unrefFormulaSource(rhs)))
        );
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateLog(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const numerator = Decimal.ln(unrefFormulaSource(rhs)).times(value);
        return lhs.invert(numerator.div(numerator.div(Math.E).lambertw()));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.pow(2, value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateLog2(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.times(x, Decimal.sub(Decimal.ln(x), 1).div(Decimal.ln(2)));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateLog2(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(Decimal.ln(2).times(value).div(Math.E).lambertw().add(1)));
    }
    throw "Could not invert due to no input being a variable";
}

function invertLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateLn(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.times(x, Decimal.ln(x).sub(1));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateLn(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.exp(Decimal.div(value, Math.E).lambertw().add(1)));
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

function integratePow(variable: DecimalSource | undefined, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        const pow = Decimal.add(unrefFormulaSource(rhs), 1);
        return Decimal.pow(x, pow).div(pow);
    } else if (hasVariable(rhs)) {
        const x = unrefFormulaSource(rhs, variable);
        const b = unrefFormulaSource(lhs);
        return Decimal.pow(b, x).div(Decimal.ln(b));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegratePow(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.negate(b).sub(1).negate().times(value).root(Decimal.add(b, 1)));
    } else if (hasVariable(rhs)) {
        const denominator = Decimal.ln(unrefFormulaSource(lhs));
        return rhs.invert(Decimal.times(denominator, value).ln().div(denominator));
    }
    throw "Could not invert due to no input being a variable";
}

function invertPow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.root(value, 10));
    }
    throw "Could not invert due to no input being a variable";
}

function integratePow10(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.ln(x).sub(1).times(x).div(Decimal.ln(10));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegratePow10(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(
            Decimal.ln(2).add(Decimal.ln(5)).times(value).div(Math.E).lambertw().add(1).exp()
        );
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

function integratePowBase(
    variable: DecimalSource | undefined,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs, variable);
        return Decimal.pow(b, unrefFormulaSource(lhs)).div(Decimal.ln(b));
    } else if (hasVariable(rhs)) {
        const denominator = Decimal.add(unrefFormulaSource(lhs, variable), 1);
        return Decimal.pow(unrefFormulaSource(rhs), denominator).div(denominator);
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegratePowBase(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return lhs.invert(Decimal.ln(b).times(value).ln().div(Decimal.ln(b)));
    } else if (hasVariable(rhs)) {
        const b = unrefFormulaSource(lhs);
        return rhs.invert(Decimal.neg(b).sub(1).negate().times(value).root(Decimal.add(b, 1)));
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

function integrateRoot(
    variable: DecimalSource | undefined,
    lhs: FormulaSource,
    rhs: FormulaSource
) {
    if (hasVariable(lhs)) {
        const b = unrefFormulaSource(rhs);
        return Decimal.pow(unrefFormulaSource(lhs, variable), Decimal.recip(b).add(1))
            .times(b)
            .div(Decimal.add(b, 1));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertIntegrateRoot(value: DecimalSource, lhs: FormulaSource, rhs: FormulaSource) {
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

function invertExp(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.ln(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateExp(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.exp(unrefFormulaSource(lhs, variable));
    }
    throw "Could not integrate due to no input being a variable";
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

function integrateSin(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.cos(unrefFormulaSource(lhs, variable)).neg();
    }
    throw "Could not integrate due to no input being a variable";
}

function invertCos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acos(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateCos(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.sin(unrefFormulaSource(lhs, variable));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertTan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atan(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateTan(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return Decimal.cos(unrefFormulaSource(lhs, variable)).ln().neg();
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAsin(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sin(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAsin(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.asin(x)
            .times(x)
            .add(Decimal.sqrt(Decimal.sub(1, Decimal.pow(x, 2))));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAcos(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cos(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAcos(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.acos(x)
            .times(x)
            .sub(Decimal.sqrt(Decimal.sub(1, Decimal.pow(x, 2))));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAtan(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tan(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAtan(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.atan(x)
            .times(x)
            .sub(Decimal.ln(Decimal.pow(x, 2).add(1)).div(2));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertSinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.asinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateSinh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.cosh(x);
    }
    throw "Could not integrate due to no input being a variable";
}

function invertCosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.acosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateCosh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.sinh(x);
    }
    throw "Could not integrate due to no input being a variable";
}

function invertTanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.atanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateTanh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.cosh(x).ln();
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAsinh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.sinh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAsinh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.asinh(x).times(x).sub(Decimal.pow(x, 2).add(1).sqrt());
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAcosh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.cosh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAcosh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.acosh(x)
            .times(x)
            .sub(Decimal.add(x, 1).sqrt().times(Decimal.sub(x, 1).sqrt()));
    }
    throw "Could not integrate due to no input being a variable";
}

function invertAtanh(value: DecimalSource, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        return lhs.invert(Decimal.tanh(value));
    }
    throw "Could not invert due to no input being a variable";
}

function integrateAtanh(variable: DecimalSource | undefined, lhs: FormulaSource) {
    if (hasVariable(lhs)) {
        const x = unrefFormulaSource(lhs, variable);
        return Decimal.atanh(x)
            .times(x)
            .add(Decimal.sub(1, Decimal.pow(x, 2)).ln().div(2));
    }
    throw "Could not integrate due to no input being a variable";
}

/**
 * A class that can be used for cost/goal functions. It can be evaluated similar to a cost function, but also provides extra features for supported formulas. For example, a lot of math functions can be inverted.
 * Typically, the use of these extra features is to support cost/goal functions that have multiple levels purchased/completed at once efficiently.
 * @see {@link calculateMaxAffordable}
 * @see {@link game/requirements.createCostRequirement}
 */
export default class Formula<T extends [FormulaSource] | FormulaSource[]> {
    readonly inputs: T;

    private readonly internalEvaluate:
        | ((...inputs: GuardedFormulasToDecimals<T>) => DecimalSource)
        | undefined;
    private readonly internalInvert:
        | ((value: DecimalSource, ...inputs: T) => DecimalSource)
        | undefined;
    private readonly internalIntegrate:
        | ((variable: DecimalSource | undefined, ...inputs: T) => DecimalSource)
        | undefined;
    private readonly internalInvertIntegral:
        | ((value: DecimalSource, ...inputs: T) => DecimalSource)
        | undefined;
    private readonly internalHasVariable: boolean;

    public readonly innermostVariable: ProcessedComputable<DecimalSource> | undefined;

    constructor(options: FormulaOptions<T>) {
        // Variable case
        if ("variable" in options) {
            this.inputs = [options.variable] as T;
            this.internalHasVariable = true;
            this.innermostVariable = options.variable;
            return;
        }
        // Constant case
        if (!("evaluate" in options)) {
            if (options.inputs.length !== 1) {
                throw "Evaluate function is required if inputs is not length 1";
            }
            this.inputs = options.inputs as T;
            this.internalHasVariable = false;
            return;
        }

        const { inputs, evaluate, invert, integrate, invertIntegral, hasVariable } = options;
        if (invert == null && invertIntegral == null && hasVariable) {
            throw "A formula cannot be marked as having a variable if it is not invertible";
        }

        this.inputs = inputs;
        this.internalEvaluate = evaluate;
        this.internalIntegrate = integrate;

        const numVariables = inputs.filter(
            input => input instanceof Formula && input.hasVariable()
        ).length;
        const variable = inputs.find(input => input instanceof Formula && input.hasVariable()) as
            | GenericFormula
            | undefined;

        this.internalHasVariable =
            numVariables === 1 || (numVariables === 0 && hasVariable === true);
        if (this.internalHasVariable) {
            this.innermostVariable = variable?.innermostVariable;
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.internalInvert =
            this.internalHasVariable && variable?.isInvertible() ? invert : undefined;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.internalInvertIntegral =
            this.internalHasVariable && variable?.isIntegralInvertible()
                ? invertIntegral
                : undefined;
    }

    /** Type predicate that this formula can be inverted. */
    isInvertible(): this is InvertibleFormula {
        return (
            this.internalHasVariable &&
            (this.internalInvert != null || this.internalEvaluate == null)
        );
    }

    /** Type predicate that this formula can be integrated. */
    isIntegrable(): this is IntegrableFormula {
        return this.internalHasVariable && this.internalIntegrate != null;
    }

    /** Type predicate that this formula has an integral function that can be inverted. */
    isIntegralInvertible(): this is InvertibleIntegralFormula {
        return (
            this.internalHasVariable &&
            (this.internalInvertIntegral != null || this.internalEvaluate == null)
        );
    }

    /** Whether or not this formula has a singular variable inside it, which can be accessed via {@link innermostVariable}. */
    hasVariable(): boolean {
        return this.internalHasVariable;
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
            variable ??
            unrefFormulaSource(this.inputs[0])
        );
    }

    /**
     * Takes a potential result of the formula, and calculates what value the variable inside the formula would have to be for that result to occur. Only works if there's a single variable and if the formula is invertible.
     * @param value The result of the formula
     * @see {@link isInvertible}
     */
    invert(value: DecimalSource): DecimalSource {
        if (this.internalInvert) {
            return this.internalInvert.call(this, value, ...this.inputs);
        } else if (this.inputs.length === 1 && this.internalHasVariable) {
            return value;
        }
        throw "Cannot invert non-invertible formula";
    }

    /**
     * Evaluate the result of the indefinite integral (sans the constant of integration). Only works if there's a single variable and the formula is integrable
     * @param variable Optionally override the value of the variable while evaluating
     * @see {@link isIntegrable}
     */
    evaluateIntegral(variable?: DecimalSource): DecimalSource {
        if (this.internalIntegrate) {
            return this.internalIntegrate.call(this, variable, ...this.inputs);
        } else if (this.inputs.length === 1 && this.internalHasVariable) {
            return variable ?? unrefFormulaSource(this.inputs[0]);
        }
        throw "Cannot integrate formula without variable";
    }

    /**
     * Given the potential result of the formula's integral (sand the constant of integration), calculate what value the variable inside the formula would have to be for that result to occur. Only works if there's a single variable and if the formula's integral is invertible.
     * @param value The result of the integral.
     * @see {@link isIntegralInvertible}
     */
    invertIntegral(value: DecimalSource): DecimalSource {
        // This is nearly completely non-functional
        // Proper nesting will require somehow using integration by substitution or integration by parts
        if (this.internalInvertIntegral) {
            return this.internalInvertIntegral.call(this, value, ...this.inputs);
        } else if (this.inputs.length === 1 && this.internalHasVariable) {
            return value;
        }
        throw "Cannot invert integral of formula without invertible integral";
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
            this.internalInvertIntegral === other.internalInvertIntegral &&
            this.internalHasVariable === other.internalHasVariable
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
            throw "Could not invert due to no input being a variable";
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
     */
    public static if(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ): GenericFormula {
        const lhsRef = ref<DecimalSource>(0);
        const formula = formulaModifier(Formula.variable(lhsRef));
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
        return new Formula({
            inputs: [value],
            evaluate: evalStep,
            invert: formula.isInvertible() && formula.hasVariable() ? invertStep : undefined
        });
    }
    /** @see {@link if} */
    public static conditional(
        value: FormulaSource,
        condition: Computable<boolean>,
        formulaModifier: (
            value: InvertibleFormula & IntegrableFormula & InvertibleIntegralFormula
        ) => GenericFormula
    ) {
        return Formula.if(value, condition, formulaModifier);
    }

    public static abs(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.abs });
    }

    public static neg<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static neg(value: FormulaSource): GenericFormula;
    public static neg(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.neg,
            invert: invertNeg,
            integrate: integrateNeg
        });
    }
    public static negate<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static negate(value: FormulaSource): GenericFormula;
    public static negate(value: FormulaSource) {
        return Formula.neg(value);
    }
    public static negated<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static negated(value: FormulaSource): GenericFormula;
    public static negated(value: FormulaSource) {
        return Formula.neg(value);
    }

    public static sign(value: FormulaSource): GenericFormula {
        return new Formula({ inputs: [value], evaluate: Decimal.sign });
    }
    public static sgn(value: FormulaSource) {
        return Formula.sign(value);
    }

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
            invert: invertAdd,
            integrate: integrateAdd,
            invertIntegral: invertIntegrateAdd
        });
    }
    public static plus<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static plus<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static plus(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static plus(value: FormulaSource, other: FormulaSource) {
        return Formula.add(value, other);
    }

    public static sub<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static sub<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static sub(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static sub(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.sub,
            invert: invertSub,
            integrate: integrateSub,
            invertIntegral: invertIntegrateSub
        });
    }
    public static subtract<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static subtract<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static subtract(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static subtract(value: FormulaSource, other: FormulaSource) {
        return Formula.sub(value, other);
    }
    public static minus<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static minus<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static minus(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static minus(value: FormulaSource, other: FormulaSource) {
        return Formula.sub(value, other);
    }

    public static mul<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static mul<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static mul(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static mul(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.mul,
            invert: invertMul,
            integrate: integrateMul,
            invertIntegral: invertIntegrateMul
        });
    }
    public static multiply<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static multiply<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static multiply(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static multiply(value: FormulaSource, other: FormulaSource) {
        return Formula.mul(value, other);
    }
    public static times<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static times<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static times(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static times(value: FormulaSource, other: FormulaSource) {
        return Formula.mul(value, other);
    }

    public static div<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static div<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static div(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static div(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.div,
            invert: invertDiv,
            integrate: integrateDiv,
            invertIntegral: invertIntegrateDiv
        });
    }
    public static divide<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static divide<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static divide(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static divide(value: FormulaSource, other: FormulaSource) {
        return Formula.div(value, other);
    }

    public static recip<T extends GenericFormula>(value: T): T;
    public static recip(value: FormulaSource): GenericFormula;
    public static recip(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.recip,
            invert: invertRecip,
            integrate: integrateRecip,
            invertIntegral: invertIntegrateRecip
        });
    }
    public static reciprocal<T extends GenericFormula>(value: T): T;
    public static reciprocal(value: FormulaSource): GenericFormula;
    public static reciprocal(value: FormulaSource): GenericFormula {
        return Formula.recip(value);
    }
    public static reciprocate<T extends GenericFormula>(value: T): T;
    public static reciprocate(value: FormulaSource): GenericFormula;
    public static reciprocate(value: FormulaSource) {
        return Formula.recip(value);
    }

    public static max(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.max,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static min(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.min,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static minabs(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.minabs,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static maxabs(value: FormulaSource, other: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.maxabs,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static clamp(
        value: FormulaSource,
        min: FormulaSource,
        max: FormulaSource
    ): GenericFormula {
        return new Formula({
            inputs: [value, min, max],
            evaluate: Decimal.clamp,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static clampMin(value: FormulaSource, min: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, min],
            evaluate: Decimal.clampMin,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
        });
    }

    public static clampMax(value: FormulaSource, max: FormulaSource): GenericFormula {
        return new Formula({
            inputs: [value, max],
            evaluate: Decimal.clampMax,
            invert: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource,
            invertIntegral: passthrough as (
                value: DecimalSource,
                ...inputs: [FormulaSource, FormulaSource]
            ) => DecimalSource
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
            invert: invertLog10,
            integrate: integrateLog10,
            invertIntegral: invertIntegrateLog10
        });
    }

    public static log<T extends GenericFormula>(value: T, base: FormulaSource): T;
    public static log<T extends GenericFormula>(value: FormulaSource, base: T): T;
    public static log(value: FormulaSource, base: FormulaSource): GenericFormula;
    public static log(value: FormulaSource, base: FormulaSource) {
        return new Formula({
            inputs: [value, base],
            evaluate: Decimal.log,
            invert: invertLog,
            integrate: integrateLog,
            invertIntegral: invertIntegrateLog
        });
    }
    public static logarithm<T extends GenericFormula>(value: T, base: FormulaSource): T;
    public static logarithm<T extends GenericFormula>(value: FormulaSource, base: T): T;
    public static logarithm(value: FormulaSource, base: FormulaSource): GenericFormula;
    public static logarithm(value: FormulaSource, base: FormulaSource) {
        return Formula.log(value, base);
    }

    public static log2<T extends GenericFormula>(value: T): T;
    public static log2(value: FormulaSource): GenericFormula;
    public static log2(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.log2,
            invert: invertLog2,
            integrate: integrateLog2,
            invertIntegral: invertIntegrateLog2
        });
    }

    public static ln<T extends GenericFormula>(value: T): T;
    public static ln(value: FormulaSource): GenericFormula;
    public static ln(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.ln,
            invert: invertLn,
            integrate: integrateLn,
            invertIntegral: invertIntegrateLn
        });
    }

    public static pow<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static pow<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static pow(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.pow,
            invert: invertPow,
            integrate: integratePow,
            invertIntegral: invertIntegratePow
        });
    }

    public static pow10<T extends GenericFormula>(value: T): T;
    public static pow10(value: FormulaSource): GenericFormula;
    public static pow10(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.pow10,
            invert: invertPow10,
            integrate: integratePow10,
            invertIntegral: invertIntegratePow10
        });
    }

    public static pow_base<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static pow_base<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static pow_base(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static pow_base(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.pow_base,
            invert: invertPowBase,
            integrate: integratePowBase,
            invertIntegral: invertIntegratePowBase
        });
    }

    public static root<T extends GenericFormula>(value: T, other: FormulaSource): T;
    public static root<T extends GenericFormula>(value: FormulaSource, other: T): T;
    public static root(value: FormulaSource, other: FormulaSource): GenericFormula;
    public static root(value: FormulaSource, other: FormulaSource) {
        return new Formula({
            inputs: [value, other],
            evaluate: Decimal.root,
            invert: invertRoot,
            integrate: integrateRoot,
            invertIntegral: invertIntegrateRoot
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

    public static exp<T extends GenericFormula>(value: T): Omit<T, "invertsIntegral">;
    public static exp(value: FormulaSource): GenericFormula;
    public static exp(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.exp,
            invert: invertExp,
            integrate: integrateExp
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
    ): Omit<T, "integrate" | "invertIntegral">;
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
            evaluate: tetrate,
            invert: invertTetrate
        });
    }

    public static iteratedexp<T extends GenericFormula>(
        value: T,
        height?: FormulaSource,
        payload?: FormulaSource
    ): Omit<T, "integrate" | "invertIntegral">;
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
            evaluate: iteratedexp,
            invert: invertIteratedExp
        });
    }

    public static iteratedlog(
        value: FormulaSource,
        base: FormulaSource = 10,
        times: FormulaSource = 1
    ): GenericFormula {
        return new Formula({ inputs: [value, base, times], evaluate: iteratedLog });
    }

    public static slog<T extends GenericFormula>(
        value: T,
        base?: FormulaSource
    ): Omit<T, "integrate" | "invertIntegral">;
    public static slog(value: FormulaSource, base?: FormulaSource): GenericFormula;
    public static slog(value: FormulaSource, base: FormulaSource = 10) {
        return new Formula({ inputs: [value, base], evaluate: slog, invert: invertSlog });
    }

    public static layeradd10(value: FormulaSource, diff: FormulaSource) {
        return new Formula({ inputs: [value, diff], evaluate: Decimal.layeradd10 });
    }

    public static layeradd<T extends GenericFormula>(
        value: T,
        diff: FormulaSource,
        base?: FormulaSource
    ): Omit<T, "integrate" | "invertIntegral">;
    public static layeradd(
        value: FormulaSource,
        diff: FormulaSource,
        base?: FormulaSource
    ): GenericFormula;
    public static layeradd(value: FormulaSource, diff: FormulaSource, base: FormulaSource = 10) {
        return new Formula({
            inputs: [value, diff, base],
            evaluate: layeradd,
            invert: invertLayeradd
        });
    }

    public static lambertw<T extends GenericFormula>(
        value: T
    ): Omit<T, "integrate" | "invertIntegral">;
    public static lambertw(value: FormulaSource): GenericFormula;
    public static lambertw(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.lambertw, invert: invertLambertw });
    }

    public static ssqrt<T extends GenericFormula>(
        value: T
    ): Omit<T, "integrate" | "invertIntegral">;
    public static ssqrt(value: FormulaSource): GenericFormula;
    public static ssqrt(value: FormulaSource) {
        return new Formula({ inputs: [value], evaluate: Decimal.ssqrt, invert: invertSsqrt });
    }

    public static pentate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ): GenericFormula {
        return new Formula({ inputs: [value, height, payload], evaluate: pentate });
    }

    public static sin<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static sin(value: FormulaSource): GenericFormula;
    public static sin(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.sin,
            invert: invertAsin,
            integrate: integrateSin
        });
    }

    public static cos<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static cos(value: FormulaSource): GenericFormula;
    public static cos(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.cos,
            invert: invertAcos,
            integrate: integrateCos
        });
    }

    public static tan<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static tan(value: FormulaSource): GenericFormula;
    public static tan(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.tan,
            invert: invertAtan,
            integrate: integrateTan
        });
    }

    public static asin<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static asin(value: FormulaSource): GenericFormula;
    public static asin(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.asin,
            invert: invertSin,
            integrate: integrateAsin
        });
    }

    public static acos<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static acos(value: FormulaSource): GenericFormula;
    public static acos(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.acos,
            invert: invertCos,
            integrate: integrateAcos
        });
    }

    public static atan<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static atan(value: FormulaSource): GenericFormula;
    public static atan(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.atan,
            invert: invertTan,
            integrate: integrateAtan
        });
    }

    public static sinh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static sinh(value: FormulaSource): GenericFormula;
    public static sinh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.sinh,
            invert: invertAsinh,
            integrate: integrateSinh
        });
    }

    public static cosh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static cosh(value: FormulaSource): GenericFormula;
    public static cosh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.cosh,
            invert: invertAcosh,
            integrate: integrateCosh
        });
    }

    public static tanh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static tanh(value: FormulaSource): GenericFormula;
    public static tanh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.tanh,
            invert: invertAtanh,
            integrate: integrateTanh
        });
    }

    public static asinh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static asinh(value: FormulaSource): GenericFormula;
    public static asinh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.asinh,
            invert: invertSinh,
            integrate: integrateAsinh
        });
    }

    public static acosh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static acosh(value: FormulaSource): GenericFormula;
    public static acosh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.acosh,
            invert: invertCosh,
            integrate: integrateAcosh
        });
    }

    public static atanh<T extends GenericFormula>(value: T): Omit<T, "invertIntegral">;
    public static atanh(value: FormulaSource): GenericFormula;
    public static atanh(value: FormulaSource) {
        return new Formula({
            inputs: [value],
            evaluate: Decimal.atanh,
            invert: invertTanh,
            integrate: integrateAtanh
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

    public neg<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public neg(this: GenericFormula): GenericFormula;
    public neg(this: GenericFormula) {
        return Formula.neg(this);
    }
    public negate<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public negate(this: GenericFormula): GenericFormula;
    public negate(this: GenericFormula) {
        return Formula.neg(this);
    }
    public negated<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public negated(this: GenericFormula): GenericFormula;
    public negated(this: GenericFormula) {
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

    public add<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public add<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public add(this: GenericFormula, value: FormulaSource): GenericFormula;
    public add(this: GenericFormula, value: FormulaSource) {
        return Formula.add(this, value);
    }
    public plus<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public plus<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public plus(this: GenericFormula, value: FormulaSource): GenericFormula;
    public plus(value: FormulaSource) {
        return Formula.add(this, value);
    }

    public sub<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public sub<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public sub(this: GenericFormula, value: FormulaSource): GenericFormula;
    public sub(value: FormulaSource) {
        return Formula.sub(this, value);
    }
    public subtract<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public subtract<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public subtract(this: GenericFormula, value: FormulaSource): GenericFormula;
    public subtract(value: FormulaSource) {
        return Formula.sub(this, value);
    }
    public minus<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public minus<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public minus(this: GenericFormula, value: FormulaSource): GenericFormula;
    public minus(value: FormulaSource) {
        return Formula.sub(this, value);
    }

    public mul<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public mul<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public mul(this: GenericFormula, value: FormulaSource): GenericFormula;
    public mul(value: FormulaSource) {
        return Formula.mul(this, value);
    }
    public multiply<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public multiply<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public multiply(this: GenericFormula, value: FormulaSource): GenericFormula;
    public multiply(value: FormulaSource) {
        return Formula.mul(this, value);
    }
    public times<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public times<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public times(this: GenericFormula, value: FormulaSource): GenericFormula;
    public times(value: FormulaSource) {
        return Formula.mul(this, value);
    }

    public div<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public div<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public div(this: GenericFormula, value: FormulaSource): GenericFormula;
    public div(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public divide<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public divide<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public divide(this: GenericFormula, value: FormulaSource): GenericFormula;
    public divide(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public divideBy<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public divideBy<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public divideBy(this: GenericFormula, value: FormulaSource): GenericFormula;
    public divideBy(value: FormulaSource) {
        return Formula.div(this, value);
    }
    public dividedBy<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public dividedBy<T extends GenericFormula>(this: GenericFormula, value: T): T;
    public dividedBy(this: GenericFormula, value: FormulaSource): GenericFormula;
    public dividedBy(value: FormulaSource) {
        return Formula.div(this, value);
    }

    public recip<T extends GenericFormula>(this: T): T;
    public recip(this: FormulaSource): GenericFormula;
    public recip() {
        return Formula.recip(this);
    }
    public reciprocal<T extends GenericFormula>(this: T): T;
    public reciprocal(this: FormulaSource): GenericFormula;
    public reciprocal() {
        return Formula.recip(this);
    }
    public reciprocate<T extends GenericFormula>(this: T): T;
    public reciprocate(this: FormulaSource): GenericFormula;
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
    public logarithm<T extends GenericFormula>(this: T, value: FormulaSource): T;
    public logarithm<T extends GenericFormula>(this: FormulaSource, value: T): T;
    public logarithm(this: FormulaSource, value: FormulaSource): GenericFormula;
    public logarithm(value: FormulaSource) {
        return Formula.log(this, value);
    }

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

    public exp<T extends GenericFormula>(this: T): Omit<T, "invertsIntegral">;
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
    ): Omit<T, "integrate" | "invertIntegral">;
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
    ): Omit<T, "integrate" | "invertIntegral">;
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

    public slog<T extends GenericFormula>(
        this: T,
        base?: FormulaSource
    ): Omit<T, "integrate" | "invertIntegral">;
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
    ): Omit<T, "integrate" | "invertIntegral">;
    public layeradd(this: FormulaSource, diff: FormulaSource, base?: FormulaSource): GenericFormula;
    public layeradd(this: FormulaSource, diff: FormulaSource, base: FormulaSource) {
        return Formula.layeradd(this, diff, base);
    }

    public lambertw<T extends GenericFormula>(this: T): Omit<T, "integrate" | "invertIntegral">;
    public lambertw(this: FormulaSource): GenericFormula;
    public lambertw(this: FormulaSource) {
        return Formula.lambertw(this);
    }

    public ssqrt<T extends GenericFormula>(this: T): Omit<T, "integrate" | "invertIntegral">;
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

    public sin<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public sin(this: FormulaSource): GenericFormula;
    public sin(this: FormulaSource) {
        return Formula.sin(this);
    }

    public cos<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public cos(this: FormulaSource): GenericFormula;
    public cos(this: FormulaSource) {
        return Formula.cos(this);
    }

    public tan<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public tan(this: FormulaSource): GenericFormula;
    public tan(this: FormulaSource) {
        return Formula.tan(this);
    }

    public asin<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public asin(this: FormulaSource): GenericFormula;
    public asin(this: FormulaSource) {
        return Formula.asin(this);
    }

    public acos<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public acos(this: FormulaSource): GenericFormula;
    public acos(this: FormulaSource) {
        return Formula.acos(this);
    }

    public atan<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public atan(this: FormulaSource): GenericFormula;
    public atan(this: FormulaSource) {
        return Formula.atan(this);
    }

    public sinh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public sinh(this: FormulaSource): GenericFormula;
    public sinh(this: FormulaSource) {
        return Formula.sinh(this);
    }

    public cosh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public cosh(this: FormulaSource): GenericFormula;
    public cosh(this: FormulaSource) {
        return Formula.cosh(this);
    }

    public tanh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public tanh(this: FormulaSource): GenericFormula;
    public tanh(this: FormulaSource) {
        return Formula.tanh(this);
    }

    public asinh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public asinh(this: FormulaSource): GenericFormula;
    public asinh(this: FormulaSource) {
        return Formula.asinh(this);
    }

    public acosh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public acosh(this: FormulaSource): GenericFormula;
    public acosh(this: FormulaSource) {
        return Formula.acosh(this);
    }

    public atanh<T extends GenericFormula>(this: T): Omit<T, "invertIntegral">;
    public atanh(this: FormulaSource): GenericFormula;
    public atanh(this: FormulaSource) {
        return Formula.atanh(this);
    }
}

/**
 * Utility for calculating the maximum amount of purchases possible with a given formula and resource. If {@ref spendResources} is changed to false, the calculation will be much faster with higher numbers.
 * @param formula The formula to use for calculating buy max from
 * @param resource The resource used when purchasing (is only read from)
 * @param spendResources Whether or not to count spent resources on each purchase or not
 */
export function calculateMaxAffordable(
    formula: InvertibleFormula,
    resource: Resource,
    spendResources?: true
): ComputedRef<DecimalSource>;
export function calculateMaxAffordable(
    formula: InvertibleIntegralFormula,
    resource: Resource,
    spendResources: Computable<boolean>
): ComputedRef<DecimalSource>;
export function calculateMaxAffordable(
    formula: InvertibleFormula,
    resource: Resource,
    spendResources: Computable<boolean> = true
) {
    const computedSpendResources = convertComputable(spendResources);
    return computed(() => {
        if (unref(computedSpendResources)) {
            if (!formula.isIntegrable() || !formula.isIntegralInvertible()) {
                throw "Cannot calculate max affordable of formula with non-invertible integral";
            }
            return Decimal.floor(
                formula.invertIntegral(Decimal.add(resource.value, formula.evaluateIntegral()))
            ).sub(unref(formula.innermostVariable) ?? 0);
        } else {
            if (!formula.isInvertible()) {
                throw "Cannot calculate max affordable of non-invertible formula";
            }
            return Decimal.floor((formula as InvertibleFormula).invert(resource.value));
        }
    });
}

/**
 * Utility for calculating the cost of a formula for a given amount of purchases. If {@ref spendResources} is changed to false, the calculation will be much faster with higher numbers.
 * @param formula The formula to use for calculating buy max from
 * @param amountToBuy The amount of purchases to calculate the cost for
 * @param spendResources Whether or not to count spent resources on each purchase or not
 */
export function calculateCost(
    formula: InvertibleFormula,
    amountToBuy: DecimalSource,
    spendResources?: true
): DecimalSource;
export function calculateCost(
    formula: InvertibleIntegralFormula,
    amountToBuy: DecimalSource,
    spendResources: boolean
): DecimalSource;
export function calculateCost(
    formula: InvertibleFormula,
    amountToBuy: DecimalSource,
    spendResources = true
) {
    const newValue = Decimal.add(amountToBuy, unref(formula.innermostVariable) ?? 0);
    if (spendResources) {
        return Decimal.sub(formula.evaluateIntegral(newValue), formula.evaluateIntegral());
    } else {
        return formula.evaluate(newValue);
    }
}

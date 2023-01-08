import Decimal, { DecimalSource } from "util/bignum";
import { convertComputable, ProcessedComputable } from "util/computed";
import { unref } from "vue";

export type FormulaSource = ProcessedComputable<DecimalSource> | Formula;
export type InvertibleFormulaSource = ProcessedComputable<DecimalSource> | InvertibleFormula;

export type InvertibleFormula = Formula & { invertible: true };
export type VariableFormula = InvertibleFormula & { hasVariable: true };

function F(value: InvertibleFormulaSource): InvertibleFormula;
function F(value: FormulaSource): Formula;
function F(value: FormulaSource) {
    return value instanceof Formula
        ? value
        : new Formula(
              () => new Decimal(unref(value)),
              value => new Decimal(value)
          );
}

function processFormulaSource(value: FormulaSource) {
    return value instanceof Formula ? value : convertComputable(value);
}

function unrefFormulaSource(value: Formula | ProcessedComputable<DecimalSource>) {
    return value instanceof Formula ? value.evaluate() : unref(value);
}

function isVariableFormula(value: FormulaSource): value is VariableFormula {
    return value instanceof Formula && value.hasVariable;
}

function calculateInvertibility(...inputs: FormulaSource[]) {
    if (inputs.some(input => input instanceof Formula && !input.invertible)) {
        return {
            invertible: false,
            hasVariable: false
        };
    }
    const numVariables = inputs.filter(
        input => input instanceof Formula && input.invertible && input.hasVariable
    ).length;
    return {
        invertible: numVariables <= 1,
        hasVariable: numVariables === 1
    };
}

export default class Formula {
    public readonly invertible: boolean;
    public readonly hasVariable: boolean;
    public readonly evaluate: () => Decimal;
    public readonly invert: (value: DecimalSource) => Decimal;

    constructor(
        evaluate: () => Decimal,
        invert?: (value: DecimalSource) => Decimal,
        hasVariable = false
    ) {
        this.invertible = invert != null;
        this.hasVariable = hasVariable;
        this.evaluate = evaluate;
        this.invert = invert ?? (() => Decimal.dNaN);
    }

    public static constant(value: InvertibleFormulaSource): InvertibleFormula {
        return F(value);
    }

    public static variable(value: ProcessedComputable<DecimalSource>): VariableFormula {
        return new Formula(
            () => new Decimal(unref(value)),
            value => new Decimal(value),
            true
        ) as VariableFormula;
    }

    public static abs(value: FormulaSource) {
        return F(value).abs();
    }

    public static neg(value: InvertibleFormulaSource): InvertibleFormula;
    public static neg(value: FormulaSource): Formula;
    public static neg(value: FormulaSource) {
        return F(value).neg();
    }

    public static negate(value: InvertibleFormulaSource): InvertibleFormula;
    public static negate(value: FormulaSource): Formula;
    public static negate(value: FormulaSource) {
        return F(value).neg();
    }

    public static negated(value: InvertibleFormulaSource): InvertibleFormula;
    public static negated(value: FormulaSource): Formula;
    public static negated(value: FormulaSource) {
        return F(value).neg();
    }

    public static sign(value: FormulaSource) {
        return F(value).sign();
    }

    public static sgn(value: FormulaSource) {
        return F(value).sign();
    }

    public static round(value: FormulaSource) {
        return F(value).round();
    }

    public static floor(value: FormulaSource) {
        return F(value).floor();
    }

    public static ceil(value: FormulaSource) {
        return F(value).ceil();
    }

    public static trunc(value: FormulaSource) {
        return F(value).trunc();
    }

    public static add(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static add(value: FormulaSource, other: FormulaSource): Formula;
    public static add(value: FormulaSource, other: FormulaSource) {
        return F(value).add(other);
    }

    public static plus(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static plus(value: FormulaSource, other: FormulaSource): Formula;
    public static plus(value: FormulaSource, other: FormulaSource) {
        return F(value).add(other);
    }

    public static sub(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static sub(value: FormulaSource, other: FormulaSource): Formula;
    public static sub(value: FormulaSource, other: FormulaSource) {
        return F(value).sub(other);
    }

    public static subtract(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static subtract(value: FormulaSource, other: FormulaSource): Formula;
    public static subtract(value: FormulaSource, other: FormulaSource) {
        return F(value).sub(other);
    }

    public static minus(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static minus(value: FormulaSource, other: FormulaSource): Formula;
    public static minus(value: FormulaSource, other: FormulaSource) {
        return F(value).sub(other);
    }

    public static mul(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static mul(value: FormulaSource, other: FormulaSource): Formula;
    public static mul(value: FormulaSource, other: FormulaSource) {
        return F(value).mul(other);
    }

    public static multiply(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static multiply(value: FormulaSource, other: FormulaSource): Formula;
    public static multiply(value: FormulaSource, other: FormulaSource) {
        return F(value).mul(other);
    }

    public static times(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static times(value: FormulaSource, other: FormulaSource): Formula;
    public static times(value: FormulaSource, other: FormulaSource) {
        return F(value).mul(other);
    }

    public static div(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static div(value: FormulaSource, other: FormulaSource): Formula;
    public static div(value: FormulaSource, other: FormulaSource) {
        return F(value).div(other);
    }

    public static divide(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static divide(value: FormulaSource, other: FormulaSource): Formula;
    public static divide(value: FormulaSource, other: FormulaSource) {
        return F(value).div(other);
    }

    public static recip(value: InvertibleFormulaSource): InvertibleFormula;
    public static recip(value: FormulaSource): Formula;
    public static recip(value: FormulaSource) {
        return F(value).recip();
    }

    public static reciprocal(value: InvertibleFormulaSource): InvertibleFormula;
    public static reciprocal(value: FormulaSource): Formula;
    public static reciprocal(value: FormulaSource) {
        return F(value).recip();
    }

    public static reciprocate(value: InvertibleFormulaSource): InvertibleFormula;
    public static reciprocate(value: FormulaSource): Formula;
    public static reciprocate(value: FormulaSource) {
        return F(value).reciprocate();
    }

    public static max(value: FormulaSource, other: FormulaSource) {
        return F(value).max(other);
    }

    public static min(value: FormulaSource, other: FormulaSource) {
        return F(value).min(other);
    }

    public static minabs(value: FormulaSource, other: FormulaSource) {
        return F(value).minabs(other);
    }

    public static maxabs(value: FormulaSource, other: FormulaSource) {
        return F(value).maxabs(other);
    }

    public static clamp(value: FormulaSource, min: FormulaSource, max: FormulaSource) {
        return F(value).clamp(min, max);
    }

    public static clampMin(value: FormulaSource, min: FormulaSource) {
        return F(value).clampMin(min);
    }

    public static clampMax(value: FormulaSource, max: FormulaSource) {
        return F(value).clampMax(max);
    }

    public static pLog10(value: InvertibleFormulaSource): InvertibleFormula;
    public static pLog10(value: FormulaSource): Formula;
    public static pLog10(value: FormulaSource) {
        return F(value).pLog10();
    }

    public static absLog10(value: InvertibleFormulaSource): InvertibleFormula;
    public static absLog10(value: FormulaSource): Formula;
    public static absLog10(value: FormulaSource) {
        return F(value).absLog10();
    }

    public static log10(value: InvertibleFormulaSource): InvertibleFormula;
    public static log10(value: FormulaSource): Formula;
    public static log10(value: FormulaSource) {
        return F(value).log10();
    }

    public static log(
        value: InvertibleFormulaSource,
        base: InvertibleFormulaSource
    ): InvertibleFormula;
    public static log(value: FormulaSource, base: FormulaSource): Formula;
    public static log(value: FormulaSource, base: FormulaSource) {
        return F(value).log(base);
    }

    public static logarithm(
        value: InvertibleFormulaSource,
        base: InvertibleFormulaSource
    ): InvertibleFormula;
    public static logarithm(value: FormulaSource, base: FormulaSource): Formula;
    public static logarithm(value: FormulaSource, base: FormulaSource) {
        return F(value).log(base);
    }

    public static log2(value: InvertibleFormulaSource): InvertibleFormula;
    public static log2(value: FormulaSource): Formula;
    public static log2(value: FormulaSource) {
        return F(value).log2();
    }

    public static ln(value: InvertibleFormulaSource): InvertibleFormula;
    public static ln(value: FormulaSource): Formula;
    public static ln(value: FormulaSource) {
        return F(value).ln();
    }

    public static pow(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static pow(value: FormulaSource, other: FormulaSource): Formula;
    public static pow(value: FormulaSource, other: FormulaSource) {
        return F(value).pow(other);
    }

    public static pow10(value: InvertibleFormulaSource): InvertibleFormula;
    public static pow10(value: FormulaSource): Formula;
    public static pow10(value: FormulaSource) {
        return F(value).pow10();
    }

    public static pow_base(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static pow_base(value: FormulaSource, other: FormulaSource): Formula;
    public static pow_base(value: FormulaSource, other: FormulaSource) {
        return F(value).pow_base(other);
    }

    public static root(
        value: InvertibleFormulaSource,
        other: InvertibleFormulaSource
    ): InvertibleFormula;
    public static root(value: FormulaSource, other: FormulaSource): Formula;
    public static root(value: FormulaSource, other: FormulaSource) {
        return F(value).root(other);
    }

    public static factorial(value: FormulaSource) {
        return F(value).factorial();
    }

    public static gamma(value: FormulaSource) {
        return F(value).gamma();
    }

    public static lngamma(value: FormulaSource) {
        return F(value).lngamma();
    }

    public static exp(value: InvertibleFormulaSource): InvertibleFormula;
    public static exp(value: FormulaSource): Formula;
    public static exp(value: FormulaSource) {
        return F(value).exp();
    }

    public static sqr(value: InvertibleFormulaSource): InvertibleFormula;
    public static sqr(value: FormulaSource): Formula;
    public static sqr(value: FormulaSource) {
        return F(value).sqr();
    }

    public static sqrt(value: InvertibleFormulaSource): InvertibleFormula;
    public static sqrt(value: FormulaSource): Formula;
    public static sqrt(value: FormulaSource) {
        return F(value).sqrt();
    }

    public static cube(value: InvertibleFormulaSource): InvertibleFormula;
    public static cube(value: FormulaSource): Formula;
    public static cube(value: FormulaSource) {
        return F(value).cube();
    }

    public static cbrt(value: InvertibleFormulaSource): InvertibleFormula;
    public static cbrt(value: FormulaSource): Formula;
    public static cbrt(value: FormulaSource) {
        return F(value).cbrt();
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
    ): Formula;
    public static tetrate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return F(value).tetrate(height, payload);
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
    ): Formula;
    public static iteratedexp(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return F(value).iteratedexp(height, payload);
    }

    public static iteratedlog(
        value: FormulaSource,
        base: FormulaSource = 10,
        times: FormulaSource = 1
    ) {
        return F(value).iteratedlog(base, times);
    }

    public static slog(
        value: InvertibleFormulaSource,
        base?: InvertibleFormulaSource
    ): InvertibleFormula;
    public static slog(value: FormulaSource, base?: FormulaSource): Formula;
    public static slog(value: FormulaSource, base: FormulaSource = 10) {
        return F(value).slog(base);
    }

    public static layeradd10(value: FormulaSource, diff: FormulaSource) {
        return F(value).layeradd10(diff);
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
    ): Formula;
    public static layeradd(value: FormulaSource, diff: FormulaSource, base: FormulaSource = 10) {
        return F(value).layeradd(diff, base);
    }

    public static lambertw(value: InvertibleFormulaSource): InvertibleFormula;
    public static lambertw(value: FormulaSource): Formula;
    public static lambertw(value: FormulaSource) {
        return F(value).lambertw();
    }

    public static ssqrt(value: InvertibleFormulaSource): InvertibleFormula;
    public static ssqrt(value: FormulaSource): Formula;
    public static ssqrt(value: FormulaSource) {
        return F(value).ssqrt();
    }

    public static pentate(
        value: FormulaSource,
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        return F(value).pentate(height, payload);
    }

    public static sin(value: InvertibleFormulaSource): InvertibleFormula;
    public static sin(value: FormulaSource): Formula;
    public static sin(value: FormulaSource) {
        return F(value).sin();
    }

    public static cos(value: InvertibleFormulaSource): InvertibleFormula;
    public static cos(value: FormulaSource): Formula;
    public static cos(value: FormulaSource) {
        return F(value).cos();
    }

    public static tan(value: InvertibleFormulaSource): InvertibleFormula;
    public static tan(value: FormulaSource): Formula;
    public static tan(value: FormulaSource) {
        return F(value).tan();
    }

    public static asin(value: InvertibleFormulaSource): InvertibleFormula;
    public static asin(value: FormulaSource): Formula;
    public static asin(value: FormulaSource) {
        return F(value).asin();
    }

    public static acos(value: InvertibleFormulaSource): InvertibleFormula;
    public static acos(value: FormulaSource): Formula;
    public static acos(value: FormulaSource) {
        return F(value).acos();
    }

    public static atan(value: InvertibleFormulaSource): InvertibleFormula;
    public static atan(value: FormulaSource): Formula;
    public static atan(value: FormulaSource) {
        return F(value).atan();
    }

    public static sinh(value: InvertibleFormulaSource): InvertibleFormula;
    public static sinh(value: FormulaSource): Formula;
    public static sinh(value: FormulaSource) {
        return F(value).sinh();
    }

    public static cosh(value: InvertibleFormulaSource): InvertibleFormula;
    public static cosh(value: FormulaSource): Formula;
    public static cosh(value: FormulaSource) {
        return F(value).cosh();
    }

    public static tanh(value: InvertibleFormulaSource): InvertibleFormula;
    public static tanh(value: FormulaSource): Formula;
    public static tanh(value: FormulaSource) {
        return F(value).tanh();
    }

    public static asinh(value: InvertibleFormulaSource): InvertibleFormula;
    public static asinh(value: FormulaSource): Formula;
    public static asinh(value: FormulaSource) {
        return F(value).asinh();
    }

    public static acosh(value: InvertibleFormulaSource): InvertibleFormula;
    public static acosh(value: FormulaSource): Formula;
    public static acosh(value: FormulaSource) {
        return F(value).acosh();
    }

    public static atanh(value: InvertibleFormulaSource): InvertibleFormula;
    public static atanh(value: FormulaSource): Formula;
    public static atanh(value: FormulaSource) {
        return F(value).atanh();
    }

    public abs() {
        return new Formula(() => this.evaluate().abs());
    }

    public neg(this: InvertibleFormula): InvertibleFormula;
    public neg(this: Formula): Formula;
    public neg() {
        return new Formula(
            () => this.evaluate().neg(),
            value => Decimal.neg(value),
            this.hasVariable
        );
    }

    public negate(this: InvertibleFormula): InvertibleFormula;
    public negate(this: Formula): Formula;
    public negate() {
        return this.neg();
    }

    public negated(this: InvertibleFormula): InvertibleFormula;
    public negated(this: Formula): Formula;
    public negated() {
        return this.neg();
    }

    public sign() {
        return new Formula(() => new Decimal(this.evaluate().sign));
    }

    public sgn() {
        return this.sign();
    }

    public round() {
        return new Formula(() => this.evaluate().round());
    }

    public floor() {
        return new Formula(() => this.evaluate().floor());
    }

    public ceil() {
        return new Formula(() => this.evaluate().ceil());
    }

    public trunc() {
        return new Formula(() => this.evaluate().trunc());
    }

    public add(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public add(this: Formula, value: FormulaSource): Formula;
    public add(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().add(unrefFormulaSource(v)),
            invertible
                ? value =>
                      Decimal.sub(
                          value,
                          isVariableFormula(this) ? unrefFormulaSource(v) : this.evaluate()
                      )
                : undefined,
            hasVariable
        );
    }

    public plus(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public plus(this: Formula, value: FormulaSource): Formula;
    public plus(value: FormulaSource) {
        return this.add(value);
    }

    public sub(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public sub(this: Formula, value: FormulaSource): Formula;
    public sub(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().sub(unrefFormulaSource(v)),
            invertible
                ? isVariableFormula(this)
                    ? value => Decimal.add(value, unrefFormulaSource(v))
                    : value => Decimal.sub(this.evaluate(), value)
                : undefined,
            hasVariable
        );
    }

    public subtract(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public subtract(this: Formula, value: FormulaSource): Formula;
    public subtract(value: FormulaSource) {
        return this.sub(value);
    }

    public minus(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public minus(this: Formula, value: FormulaSource): Formula;
    public minus(value: FormulaSource) {
        return this.sub(value);
    }

    public mul(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public mul(this: Formula, value: FormulaSource): Formula;
    public mul(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().mul(unrefFormulaSource(v)),
            invertible
                ? value =>
                      Decimal.div(
                          value,
                          isVariableFormula(this) ? unrefFormulaSource(v) : this.evaluate()
                      )
                : undefined,
            hasVariable
        );
    }

    public multiply(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public multiply(this: Formula, value: FormulaSource): Formula;
    public multiply(value: FormulaSource) {
        return this.mul(value);
    }

    public times(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public times(this: Formula, value: FormulaSource): Formula;
    public times(value: FormulaSource) {
        return this.mul(value);
    }

    public div(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public div(this: Formula, value: FormulaSource): Formula;
    public div(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().div(unrefFormulaSource(v)),
            invertible
                ? value =>
                      Decimal.mul(
                          value,
                          isVariableFormula(this) ? unrefFormulaSource(v) : this.evaluate()
                      )
                : undefined,
            hasVariable
        );
    }

    public divide(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public divide(this: Formula, value: FormulaSource): Formula;
    public divide(value: FormulaSource) {
        return this.div(value);
    }

    public divideBy(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public divideBy(this: Formula, value: FormulaSource): Formula;
    public divideBy(value: FormulaSource) {
        return this.div(value);
    }

    public dividedBy(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public dividedBy(this: Formula, value: FormulaSource): Formula;
    public dividedBy(value: FormulaSource) {
        return this.div(value);
    }

    public recip(this: InvertibleFormula): InvertibleFormula;
    public recip(this: Formula): Formula;
    public recip() {
        return new Formula(
            () => this.evaluate().recip(),
            this.invertible ? value => Decimal.recip(value) : undefined,
            this.hasVariable
        );
    }

    public reciprocal(this: InvertibleFormula): InvertibleFormula;
    public reciprocal(this: Formula): Formula;
    public reciprocal() {
        return this.recip();
    }

    public reciprocate(this: InvertibleFormula): InvertibleFormula;
    public reciprocate(this: Formula): Formula;
    public reciprocate() {
        return this.recip();
    }

    public max(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().max(unrefFormulaSource(v)));
    }

    public min(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().min(unrefFormulaSource(v)));
    }

    public maxabs(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().maxabs(unrefFormulaSource(v)));
    }

    public minabs(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().minabs(unrefFormulaSource(v)));
    }

    public clamp(min: FormulaSource, max: FormulaSource) {
        const minValue = processFormulaSource(min);
        const maxValue = processFormulaSource(max);
        return new Formula(() =>
            this.evaluate().clamp(unrefFormulaSource(minValue), unrefFormulaSource(maxValue))
        );
    }

    public clampMin(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().clampMin(unrefFormulaSource(v)));
    }

    public clampMax(value: FormulaSource) {
        const v = processFormulaSource(value);
        return new Formula(() => this.evaluate().clampMax(unrefFormulaSource(v)));
    }

    public pLog10(this: InvertibleFormula): InvertibleFormula;
    public pLog10(this: Formula): Formula;
    public pLog10() {
        return new Formula(() => this.evaluate().pLog10());
    }

    public absLog10(this: InvertibleFormula): InvertibleFormula;
    public absLog10(this: Formula): Formula;
    public absLog10() {
        return new Formula(() => this.evaluate().absLog10());
    }

    public log10(this: InvertibleFormula): InvertibleFormula;
    public log10(this: Formula): Formula;
    public log10() {
        return new Formula(
            () => this.evaluate().log10(),
            this.invertible ? value => Decimal.pow10(value) : undefined,
            this.hasVariable
        );
    }

    public log(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public log(this: Formula, value: FormulaSource): Formula;
    public log(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().log(unrefFormulaSource(v)),
            invertible
                ? value =>
                      isVariableFormula(this)
                          ? Decimal.pow(unrefFormulaSource(v), value)
                          : Decimal.root(this.evaluate(), value)
                : undefined,
            hasVariable
        );
    }

    public logarithm(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public logarithm(this: Formula, value: FormulaSource): Formula;
    public logarithm(value: FormulaSource) {
        return this.log(value);
    }

    public log2(this: InvertibleFormula): InvertibleFormula;
    public log2(this: Formula): Formula;
    public log2() {
        return new Formula(
            () => this.evaluate().log2(),
            this.invertible ? value => Decimal.pow(2, value) : undefined,
            this.hasVariable
        );
    }

    public ln(this: InvertibleFormula): InvertibleFormula;
    public ln(this: Formula): Formula;
    public ln() {
        return new Formula(
            () => this.evaluate().ln(),
            this.invertible ? value => Decimal.exp(value) : undefined,
            this.hasVariable
        );
    }

    public pow(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public pow(this: Formula, value: FormulaSource): Formula;
    public pow(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().pow(unrefFormulaSource(v)),
            invertible
                ? value =>
                      isVariableFormula(this)
                          ? Decimal.root(value, unrefFormulaSource(v))
                          : Decimal.ln(value).div(Decimal.ln(this.evaluate()))
                : undefined,
            hasVariable
        );
    }

    public pow10(this: InvertibleFormula): InvertibleFormula;
    public pow10(this: Formula): Formula;
    public pow10() {
        return new Formula(
            () => this.evaluate().pow10(),
            this.invertible ? value => Decimal.root(value, 10) : undefined,
            this.hasVariable
        );
    }

    public pow_base(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public pow_base(this: Formula, value: FormulaSource): Formula;
    public pow_base(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().pow_base(unrefFormulaSource(v)),
            invertible
                ? value =>
                      isVariableFormula(this)
                          ? Decimal.ln(value).div(unrefFormulaSource(v))
                          : Decimal.root(unrefFormulaSource(v), value)
                : undefined,
            hasVariable
        );
    }

    public root(this: InvertibleFormula, value: FormulaSource): InvertibleFormula;
    public root(this: Formula, value: FormulaSource): Formula;
    public root(value: FormulaSource) {
        const v = processFormulaSource(value);
        const { invertible, hasVariable } = calculateInvertibility(this, value);
        return new Formula(
            () => this.evaluate().root(unrefFormulaSource(v)),
            invertible
                ? value =>
                      isVariableFormula(this)
                          ? Decimal.root(value, Decimal.recip(unrefFormulaSource(v)))
                          : Decimal.ln(value).div(Decimal.ln(this.evaluate()).recip())
                : undefined,
            hasVariable
        );
    }

    public factorial() {
        return new Formula(() => this.evaluate().factorial());
    }

    public gamma() {
        return new Formula(() => this.evaluate().gamma());
    }
    public lngamma() {
        return new Formula(() => this.evaluate().lngamma());
    }

    public exp(this: InvertibleFormula): InvertibleFormula;
    public exp(this: Formula): Formula;
    public exp() {
        return new Formula(
            () => this.evaluate().exp(),
            this.invertible ? value => Decimal.ln(value) : undefined,
            this.hasVariable
        );
    }

    public sqr(this: InvertibleFormula): InvertibleFormula;
    public sqr(this: Formula): Formula;
    public sqr() {
        return this.pow(2);
    }

    public sqrt(this: InvertibleFormula): InvertibleFormula;
    public sqrt(this: Formula): Formula;
    public sqrt() {
        return this.root(2);
    }

    public cube(this: InvertibleFormula): InvertibleFormula;
    public cube(this: Formula): Formula;
    public cube() {
        return this.pow(3);
    }

    public cbrt(this: InvertibleFormula): InvertibleFormula;
    public cbrt(this: Formula): Formula;
    public cbrt() {
        return this.pow(1 / 3);
    }

    public tetrate(
        this: InvertibleFormula,
        height?: FormulaSource,
        payload?: FormulaSource
    ): InvertibleFormula;
    public tetrate(this: Formula, height?: FormulaSource, payload?: FormulaSource): Formula;
    public tetrate(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        const heightValue = processFormulaSource(height);
        const payloadValue = processFormulaSource(payload);
        const { invertible, hasVariable } = calculateInvertibility(this, height, payload);
        return new Formula(
            () =>
                this.evaluate().tetrate(
                    Decimal.min(1e308, unrefFormulaSource(heightValue)).toNumber(),
                    unrefFormulaSource(payloadValue)
                ),
            invertible
                ? value =>
                      Decimal.slog(
                          value,
                          Decimal.min(1e308, unrefFormulaSource(heightValue)).toNumber()
                      )
                : undefined,
            hasVariable
        );
    }

    public iteratedexp(
        this: InvertibleFormula,
        height?: FormulaSource,
        payload?: FormulaSource
    ): InvertibleFormula;
    public iteratedexp(this: Formula, height?: FormulaSource, payload?: FormulaSource): Formula;
    public iteratedexp(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        const heightValue = processFormulaSource(height);
        const payloadValue = processFormulaSource(payload);
        const { invertible, hasVariable } = calculateInvertibility(this, height, payload);
        return new Formula(
            () =>
                this.evaluate().iteratedexp(
                    Decimal.min(1e308, unrefFormulaSource(heightValue)).toNumber(),
                    new Decimal(unrefFormulaSource(payloadValue))
                ),
            invertible
                ? value =>
                      Decimal.iteratedlog(
                          value,
                          Math.E,
                          Decimal.min(1e308, unrefFormulaSource(heightValue)).toNumber()
                      )
                : undefined,
            hasVariable
        );
    }

    public iteratedlog(base: FormulaSource = 10, times: FormulaSource = 1) {
        const baseValue = processFormulaSource(base);
        const timesValue = processFormulaSource(times);
        return new Formula(() =>
            this.evaluate().iteratedlog(
                unrefFormulaSource(baseValue),
                Decimal.min(1e308, unrefFormulaSource(timesValue)).toNumber()
            )
        );
    }

    public slog(base: FormulaSource = 10) {
        const baseValue = processFormulaSource(base);
        const { invertible, hasVariable } = calculateInvertibility(this, base);
        return new Formula(
            () =>
                this.evaluate().slog(Decimal.min(1e308, unrefFormulaSource(baseValue)).toNumber()),
            invertible
                ? value =>
                      Decimal.tetrate(
                          value,
                          Decimal.min(1e308, unrefFormulaSource(baseValue)).toNumber()
                      )
                : undefined,
            hasVariable
        );
    }

    public layeradd10(diff: FormulaSource) {
        const diffValue = processFormulaSource(diff);
        return new Formula(() => this.evaluate().layeradd10(unrefFormulaSource(diffValue)));
    }

    public layeradd(
        this: InvertibleFormula,
        diff: FormulaSource,
        base: FormulaSource
    ): InvertibleFormula;
    public layeradd(this: Formula, diff: FormulaSource, base: FormulaSource): Formula;
    public layeradd(diff: FormulaSource, base: FormulaSource) {
        const diffValue = processFormulaSource(diff);
        const baseValue = processFormulaSource(base);
        const { invertible, hasVariable } = calculateInvertibility(this, diff, base);
        return new Formula(
            () =>
                this.evaluate().layeradd(
                    Decimal.min(1e308, unrefFormulaSource(diffValue)).toNumber(),
                    unrefFormulaSource(baseValue)
                ),
            invertible
                ? value =>
                      Decimal.layeradd(
                          value,
                          Decimal.min(1e308, unrefFormulaSource(diffValue)).negate().toNumber(),
                          unrefFormulaSource(baseValue)
                      )
                : undefined,
            hasVariable
        );
    }

    public lambertw(this: InvertibleFormula): InvertibleFormula;
    public lambertw(this: Formula): Formula;
    public lambertw() {
        return new Formula(
            () => this.evaluate().lambertw(),
            this.invertible ? value => Decimal.pow(Math.E, value).times(value) : undefined,
            this.hasVariable
        );
    }

    public ssqrt(this: InvertibleFormula): InvertibleFormula;
    public ssqrt(this: Formula): Formula;
    public ssqrt() {
        return new Formula(
            () => this.evaluate().ssqrt(),
            this.invertible ? value => Decimal.tetrate(value, 2) : undefined,
            this.hasVariable
        );
    }

    public pentate(
        height: FormulaSource = 2,
        payload: FormulaSource = Decimal.fromComponents_noNormalize(1, 0, 1)
    ) {
        const heightValue = processFormulaSource(height);
        const payloadValue = processFormulaSource(payload);
        return new Formula(() =>
            this.evaluate().pentate(
                Decimal.min(1e308, unrefFormulaSource(heightValue)).toNumber(),
                unrefFormulaSource(payloadValue)
            )
        );
    }

    public sin(this: InvertibleFormula): InvertibleFormula;
    public sin(this: Formula): Formula;
    public sin() {
        return new Formula(
            () => this.evaluate().sin(),
            this.invertible ? value => Decimal.asin(value) : undefined,
            this.hasVariable
        );
    }

    public cos(this: InvertibleFormula): InvertibleFormula;
    public cos(this: Formula): Formula;
    public cos() {
        return new Formula(
            () => this.evaluate().cos(),
            this.invertible ? value => Decimal.acos(value) : undefined,
            this.hasVariable
        );
    }

    public tan(this: InvertibleFormula): InvertibleFormula;
    public tan(this: Formula): Formula;
    public tan() {
        return new Formula(
            () => this.evaluate().tan(),
            this.invertible ? value => Decimal.atan(value) : undefined,
            this.hasVariable
        );
    }

    public asin(this: InvertibleFormula): InvertibleFormula;
    public asin(this: Formula): Formula;
    public asin() {
        return new Formula(
            () => this.evaluate().asin(),
            this.invertible ? value => Decimal.sin(value) : undefined,
            this.hasVariable
        );
    }

    public acos(this: InvertibleFormula): InvertibleFormula;
    public acos(this: Formula): Formula;
    public acos() {
        return new Formula(
            () => this.evaluate().acos(),
            this.invertible ? value => Decimal.cos(value) : undefined,
            this.hasVariable
        );
    }

    public atan(this: InvertibleFormula): InvertibleFormula;
    public atan(this: Formula): Formula;
    public atan() {
        return new Formula(
            () => this.evaluate().atan(),
            this.invertible ? value => Decimal.tan(value) : undefined,
            this.hasVariable
        );
    }

    public sinh(this: InvertibleFormula): InvertibleFormula;
    public sinh(this: Formula): Formula;
    public sinh() {
        return new Formula(
            () => this.evaluate().sinh(),
            this.invertible ? value => Decimal.asinh(value) : undefined,
            this.hasVariable
        );
    }

    public cosh(this: InvertibleFormula): InvertibleFormula;
    public cosh(this: Formula): Formula;
    public cosh() {
        return new Formula(
            () => this.evaluate().cosh(),
            this.invertible ? value => Decimal.acosh(value) : undefined,
            this.hasVariable
        );
    }

    public tanh(this: InvertibleFormula): InvertibleFormula;
    public tanh(this: Formula): Formula;
    public tanh() {
        return new Formula(
            () => this.evaluate().tanh(),
            this.invertible ? value => Decimal.atanh(value) : undefined,
            this.hasVariable
        );
    }

    public asinh(this: InvertibleFormula): InvertibleFormula;
    public asinh(this: Formula): Formula;
    public asinh() {
        return new Formula(
            () => this.evaluate().asinh(),
            this.invertible ? value => Decimal.sinh(value) : undefined,
            this.hasVariable
        );
    }

    public acosh(this: InvertibleFormula): InvertibleFormula;
    public acosh(this: Formula): Formula;
    public acosh() {
        return new Formula(
            () => this.evaluate().acosh(),
            this.invertible ? value => Decimal.cosh(value) : undefined,
            this.hasVariable
        );
    }

    public atanh(this: InvertibleFormula): InvertibleFormula;
    public atanh(this: Formula): Formula;
    public atanh() {
        return new Formula(
            () => this.evaluate().atanh(),
            this.invertible ? value => Decimal.tanh(value) : undefined,
            this.hasVariable
        );
    }
}

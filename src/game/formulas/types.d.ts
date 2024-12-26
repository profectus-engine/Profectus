import { InternalFormula } from "game/formulas/formulas";
import { DecimalSource } from "util/bignum";
import { MaybeRef } from "util/computed";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericFormula = InternalFormula<any>;
type FormulaSource = MaybeRef<DecimalSource> | GenericFormula;
type InvertibleFormula = GenericFormula & {
    invert: NonNullable<GenericFormula["invert"]>;
};
type IntegrableFormula = InvertibleFormula & {
    evaluateIntegral: NonNullable<GenericFormula["evaluateIntegral"]>;
    getIntegralFormula: NonNullable<GenericFormula["getIntegralFormula"]>;
    calculateConstantOfIntegration: NonNullable<GenericFormula["calculateConstantOfIntegration"]>;
};
type InvertibleIntegralFormula = IntegrableFormula & {
    invertIntegral: NonNullable<GenericFormula["invertIntegral"]>;
};

type EvaluateFunction<T> = (
    this: InternalFormula<T>,
    ...inputs: GuardedFormulasToDecimals<T>
) => DecimalSource;
type InvertFunction<T> = (
    this: InternalFormula<T>,
    value: DecimalSource,
    ...inputs: T
) => DecimalSource;
type IntegrateFunction<T> = (
    this: InternalFormula<T>,
    stack: SubstitutionStack | undefined,
    ...inputs: T
) => GenericFormula;
type SubstitutionFunction<T> = (
    this: InternalFormula<T>,
    variable: GenericFormula,
    ...inputs: T
) => GenericFormula;

type VariableFormulaOptions = {
    variable: MaybeRef<DecimalSource>;
    description?: string;
};
type ConstantFormulaOptions = {
    inputs: [FormulaSource];
    description?: string;
};
type GeneralFormulaOptions<T extends [FormulaSource] | FormulaSource[]> = {
    inputs: T;
    evaluate: EvaluateFunction<T>;
    invert?: InvertFunction<T>;
    integrate?: IntegrateFunction<T>;
    integrateInner?: IntegrateFunction<T>;
    applySubstitution?: SubstitutionFunction<T>;
    description?: string;
};
type FormulaOptions<T extends [FormulaSource] | FormulaSource[]> =
    | VariableFormulaOptions
    | ConstantFormulaOptions
    | GeneralFormulaOptions<T>;

type InternalFormulaProperties<T extends [FormulaSource] | FormulaSource[]> = {
    inputs: T;
    internalVariables: number;
    internalEvaluate?: EvaluateFunction<T>;
    internalInvert?: InvertFunction<T>;
    internalIntegrate?: IntegrateFunction<T>;
    internalIntegrateInner?: IntegrateFunction<T>;
    applySubstitution?: SubstitutionFunction<T>;
    innermostVariable?: MaybeRef<DecimalSource>;
    description?: string;
};

type SubstitutionStack = ((value: GenericFormula) => GenericFormula)[] | undefined;

// It's really hard to type mapped tuples, but these classes seem to manage
type FormulasToDecimals<T extends FormulaSource[]> = {
    [K in keyof T]: DecimalSource;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TupleGuard<T extends any[]> = T extends any[] ? FormulasToDecimals<T> : never;
type GuardedFormulasToDecimals<T extends FormulaSource[]> = TupleGuard<T>;

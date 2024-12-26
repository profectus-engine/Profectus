import "components/common/modifiers.css";
import settings from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal, { formatSmall } from "util/bignum";
import type { RequiredKeys, WithRequired } from "util/common";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { render, Renderable } from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, unref } from "vue";
import Formula from "./formulas/formulas";
import { FormulaSource, GenericFormula } from "./formulas/types";

/**
 * An object that can be used to apply or unapply some modification to a number.
 * Being reversible requires the operation being invertible, but some features may rely on that.
 * Descriptions can be optionally included for displaying them to the player.
 * The built-in modifier creators are designed to display the modifiers using {@link createModifierSection}.
 */
export interface Modifier {
    /** Applies some operation on the input and returns the result. */
    apply: (gain: DecimalSource) => DecimalSource;
    /** Reverses the operation applied by the apply property. Required by some features. */
    invert?: (gain: DecimalSource) => DecimalSource;
    /** Get a formula for this modifier. Required by some features. */
    getFormula?: (gain: FormulaSource) => GenericFormula;
    /**
     * Whether or not this modifier should be considered enabled.
     * Typically for use with modifiers passed into {@link createSequentialModifier}.
     */
    enabled?: MaybeRef<boolean>;
    /**
     * A description of this modifier.
     * @see {@link createModifierSection}.
     */
    description?: MaybeGetter<Renderable>;
}

/** Utility type that represents the output of all modifiers that represent a single operation. */
export type OperationModifier<T> = WithRequired<
    Modifier,
    "invert" | "getFormula" | Extract<RequiredKeys<T>, keyof Modifier>
>;

/** An object that configures an additive modifier via {@link createAdditiveModifier}. */
export interface AdditiveModifierOptions {
    /** The amount to add to the input value. */
    addend: MaybeRefOrGetter<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: MaybeGetter<Renderable>;
    /** A MaybeRefOrGetter that will be processed and passed directly into the returned modifier. */
    enabled?: MaybeRefOrGetter<boolean>;
    /** Determines if numbers larger or smaller than 0 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that adds some value to the input value.
 * @param optionsFunc Additive modifier options.
 */
export function createAdditiveModifier<T extends AdditiveModifierOptions, S = OperationModifier<T>>(
    optionsFunc: () => T
) {
    return createLazyProxy(() => {
        const { addend, description, enabled, smallerIsBetter } = optionsFunc();

        const processedAddend = processGetter(addend);
        const processedEnabled = enabled == null ? undefined : processGetter(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.add(gain, unref(processedAddend)),
            invert: (gain: DecimalSource) => Decimal.sub(gain, unref(processedAddend)),
            getFormula: (gain: FormulaSource) => Formula.add(gain, processedAddend),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : () => (
                          <div class="modifier-container">
                              <span class="modifier-description">{render(description)}</span>
                              <span
                                  class="modifier-amount"
                                  style={
                                      (
                                          smallerIsBetter === true
                                              ? Decimal.gt(unref(processedAddend), 0)
                                              : Decimal.lt(unref(processedAddend), 0)
                                      )
                                          ? "color: var(--danger)"
                                          : ""
                                  }
                              >
                                  {Decimal.gte(unref(processedAddend), 0) ? "+" : ""}
                                  {formatSmall(unref(processedAddend))}
                              </span>
                          </div>
                      )
        };
    }) as S;
}

/** An object that configures an multiplicative modifier via {@link createMultiplicativeModifier}. */
export interface MultiplicativeModifierOptions {
    /** The amount to multiply the input value by. */
    multiplier: MaybeRefOrGetter<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: MaybeGetter<Renderable> | undefined;
    /** A MaybeRefOrGetter that will be processed and passed directly into the returned modifier. */
    enabled?: MaybeRefOrGetter<boolean> | undefined;
    /** Determines if numbers larger or smaller than 1 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that multiplies the input value by some value.
 * @param optionsFunc Multiplicative modifier options.
 */
export function createMultiplicativeModifier<
    T extends MultiplicativeModifierOptions,
    S = OperationModifier<T>
>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const { multiplier, description, enabled, smallerIsBetter } = optionsFunc();

        const processedMultiplier = processGetter(multiplier);
        const processedEnabled = enabled == null ? undefined : processGetter(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.times(gain, unref(processedMultiplier)),
            invert: (gain: DecimalSource) => Decimal.div(gain, unref(processedMultiplier)),
            getFormula: (gain: FormulaSource) => Formula.times(gain, processedMultiplier),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : () => (
                          <div class="modifier-container">
                              <span class="modifier-description">{render(description)}</span>
                              <span
                                  class="modifier-amount"
                                  style={
                                      (
                                          smallerIsBetter === true
                                              ? Decimal.gt(unref(processedMultiplier), 1)
                                              : Decimal.lt(unref(processedMultiplier), 1)
                                      )
                                          ? "color: var(--danger)"
                                          : ""
                                  }
                              >
                                  ×{formatSmall(unref(processedMultiplier))}
                              </span>
                          </div>
                      )
        };
    }) as S;
}

/** An object that configures an exponential modifier via {@link createExponentialModifier}. */
export interface ExponentialModifierOptions {
    /** The amount to raise the input value to the power of. */
    exponent: MaybeRefOrGetter<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: MaybeGetter<Renderable> | undefined;
    /** A MaybeRefOrGetter that will be processed and passed directly into the returned modifier. */
    enabled?: MaybeRefOrGetter<boolean> | undefined;
    /** Add 1 before calculating, then remove it afterwards. This prevents low numbers from becoming lower. */
    supportLowNumbers?: boolean;
    /** Determines if numbers larger or smaller than 1 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that raises the input value to the power of some value.
 * @param optionsFunc Exponential modifier options.
 */
export function createExponentialModifier<
    T extends ExponentialModifierOptions,
    S = OperationModifier<T>
>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const { exponent, description, enabled, supportLowNumbers, smallerIsBetter } =
            optionsFunc();

        const processedExponent = processGetter(exponent);
        const processedEnabled = enabled == null ? undefined : processGetter(enabled);
        return {
            apply: (gain: DecimalSource) => {
                let result = gain;
                if (supportLowNumbers) {
                    result = Decimal.add(result, 1);
                }
                result = Decimal.pow(result, unref(processedExponent));
                if (supportLowNumbers) {
                    result = Decimal.sub(result, 1);
                }
                return result;
            },
            invert: (gain: DecimalSource) => {
                let result = gain;
                if (supportLowNumbers) {
                    result = Decimal.add(result, 1);
                }
                result = Decimal.root(result, unref(processedExponent));
                if (supportLowNumbers) {
                    result = Decimal.sub(result, 1);
                }
                return result;
            },
            getFormula: (gain: FormulaSource) =>
                supportLowNumbers
                    ? Formula.add(gain, 1).pow(processedExponent).sub(1)
                    : Formula.pow(gain, processedExponent),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : () => (
                          <div class="modifier-container">
                              <span class="modifier-description">
                                  {render(description)}
                                  {supportLowNumbers ? " (+1 effective)" : null}
                              </span>
                              <span
                                  class="modifier-amount"
                                  style={
                                      (
                                          smallerIsBetter === true
                                              ? Decimal.gt(unref(processedExponent), 1)
                                              : Decimal.lt(unref(processedExponent), 1)
                                      )
                                          ? "color: var(--danger)"
                                          : ""
                                  }
                              >
                                  ^{formatSmall(unref(processedExponent))}
                              </span>
                          </div>
                      )
        };
    }) as S;
}

/**
 * Takes an array of modifiers and applies and reverses them in order.
 * Modifiers that are not enabled will not be applied nor reversed.
 * Also joins their descriptions together.
 * @param modifiersFunc The modifiers to perform sequentially.
 * @see {@link createModifierSection}.
 */
export function createSequentialModifier<
    T extends Modifier,
    S = WithRequired<Modifier, Extract<RequiredKeys<T>, keyof Modifier>>
>(modifiersFunc: () => T[]) {
    return createLazyProxy(() => {
        const modifiers = modifiersFunc();

        return {
            apply: (gain: DecimalSource) =>
                modifiers
                    .filter(m => unref(m.enabled) !== false)
                    .reduce((gain, modifier) => modifier.apply(gain), gain),
            invert: modifiers.every(m => m.invert != null)
                ? (gain: DecimalSource) =>
                      modifiers
                          .filter(m => unref(m.enabled) !== false)
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          .reduceRight((gain, modifier) => modifier.invert!(gain), gain)
                : undefined,
            getFormula: modifiers.every(m => m.getFormula != null)
                ? (gain: FormulaSource) =>
                      modifiers.reduce((acc, curr) => {
                          if (curr.enabled == null || curr.enabled === true) {
                              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                              return curr.getFormula!(acc);
                          }
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          return Formula.if(acc, curr.enabled, acc => curr.getFormula!(acc));
                      }, gain)
                : undefined,
            enabled: modifiers.some(m => m.enabled != null)
                ? computed(() => modifiers.filter(m => unref(m.enabled) !== false).length > 0)
                : undefined,
            description: modifiers.some(m => m.description != null)
                ? () =>
                      (
                          modifiers
                              .filter(m => unref(m.enabled) !== false)
                              .map(m => unref(m.description))
                              .filter(d => d) as MaybeGetter<Renderable>[]
                      ).map(m => render(m))
                : undefined
        };
    }) as S;
}

/** An object that configures a modifier section via {@link createModifierSection}. */
export interface ModifierSectionOptions {
    /** The header for the section. */
    title: string;
    /** Smaller text that appears in the header after the title. */
    subtitle?: string;
    /** The modifier to render. */
    modifier: WithRequired<Modifier, "description">;
    /** The base value that'll be passed into the modifier. Defaults to 1. */
    base?: DecimalSource;
    /** The unit of the value being modified, if any. */
    unit?: string;
    /** The label to use for the base value. Defaults to "Base". */
    baseText?: MaybeGetter<Renderable>;
    /** Determines if numbers larger or smaller than the base should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a JSX element that displays a modifier.
 * Intended to be used with the output from {@link createSequentialModifier}.
 * @param options Modifier section options.
 */
export function createModifierSection({
    title,
    subtitle,
    modifier,
    base,
    unit,
    baseText,
    smallerIsBetter
}: ModifierSectionOptions) {
    const total = modifier.apply(base ?? 1);
    return (
        <div style={{ "--unit": settings.alignUnits && unit != null ? "'" + unit + "'" : "" }}>
            <h3>
                {title}
                {subtitle == null ? null : <span class="subtitle"> ({subtitle})</span>}
            </h3>
            <br />
            <div class="modifier-container">
                <span class="modifier-description">{render(baseText ?? "Base")}</span>
                <span class="modifier-amount">
                    {formatSmall(base ?? 1)}
                    {unit}
                </span>
            </div>
            {render(modifier.description)}
            <hr />
            <div class="modifier-container">
                <span class="modifier-description">Total</span>
                <span
                    class="modifier-amount"
                    style={
                        (
                            smallerIsBetter === true
                                ? Decimal.gt(total, base ?? 1)
                                : Decimal.lt(total, base ?? 1)
                        )
                            ? "color: var(--danger)"
                            : ""
                    }
                >
                    {formatSmall(total)}
                    {unit}
                </span>
            </div>
        </div>
    );
}

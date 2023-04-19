import "components/common/modifiers.css";
import type { CoercableComponent, OptionsFunc } from "features/feature";
import { jsx } from "features/feature";
import settings from "game/settings";
import type { DecimalSource } from "util/bignum";
import Decimal, { formatSmall } from "util/bignum";
import type { WithRequired } from "util/common";
import type { Computable, ProcessedComputable } from "util/computed";
import { convertComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { renderJSX } from "util/vue";
import { computed, unref } from "vue";
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
    enabled?: ProcessedComputable<boolean>;
    /**
     * A description of this modifier.
     * @see {@link createModifierSection}.
     */
    description?: ProcessedComputable<CoercableComponent>;
}

/**
 * Utility type used to narrow down a modifier type that will have a description and/or enabled property based on optional parameters, T and S (respectively).
 */
export type ModifierFromOptionalParams<T, S> = T extends undefined
    ? S extends undefined
        ? Omit<WithRequired<Modifier, "invert" | "getFormula">, "description" | "enabled">
        : Omit<WithRequired<Modifier, "invert" | "enabled" | "getFormula">, "description">
    : S extends undefined
    ? Omit<WithRequired<Modifier, "invert" | "description" | "getFormula">, "enabled">
    : WithRequired<Modifier, "invert" | "enabled" | "description" | "getFormula">;

/** An object that configures an additive modifier via {@link createAdditiveModifier}. */
export interface AdditiveModifierOptions {
    /** The amount to add to the input value. */
    addend: Computable<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: Computable<CoercableComponent>;
    /** A computable that will be processed and passed directly into the returned modifier. */
    enabled?: Computable<boolean>;
    /** Determines if numbers larger or smaller than 0 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that adds some value to the input value.
 * @param optionsFunc Additive modifier options.
 */
export function createAdditiveModifier<T extends AdditiveModifierOptions>(
    optionsFunc: OptionsFunc<T>
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(feature => {
        const { addend, description, enabled, smallerIsBetter } = optionsFunc.call(
            feature,
            feature
        );

        const processedAddend = convertComputable(addend);
        const processedDescription = convertComputable(description);
        const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.add(gain, unref(processedAddend)),
            invert: (gain: DecimalSource) => Decimal.sub(gain, unref(processedAddend)),
            getFormula: (gain: FormulaSource) => Formula.add(gain, processedAddend),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) != null ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                  </span>
                              ) : null}
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
                      ))
        };
    }) as unknown as ModifierFromOptionalParams<T["description"], T["enabled"]>;
}

/** An object that configures an multiplicative modifier via {@link createMultiplicativeModifier}. */
export interface MultiplicativeModifierOptions {
    /** The amount to multiply the input value by. */
    multiplier: Computable<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: Computable<CoercableComponent> | undefined;
    /** A computable that will be processed and passed directly into the returned modifier. */
    enabled?: Computable<boolean> | undefined;
    /** Determines if numbers larger or smaller than 1 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that multiplies the input value by some value.
 * @param optionsFunc Multiplicative modifier options.
 */
export function createMultiplicativeModifier<T extends MultiplicativeModifierOptions>(
    optionsFunc: OptionsFunc<T>
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(feature => {
        const { multiplier, description, enabled, smallerIsBetter } = optionsFunc.call(
            feature,
            feature
        );

        const processedMultiplier = convertComputable(multiplier);
        const processedDescription = convertComputable(description);
        const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.times(gain, unref(processedMultiplier)),
            invert: (gain: DecimalSource) => Decimal.div(gain, unref(processedMultiplier)),
            getFormula: (gain: FormulaSource) => Formula.times(gain, processedMultiplier),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) != null ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                  </span>
                              ) : null}
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
                      ))
        };
    }) as unknown as ModifierFromOptionalParams<T["description"], T["enabled"]>;
}

/** An object that configures an exponential modifier via {@link createExponentialModifier}. */
export interface ExponentialModifierOptions {
    /** The amount to raise the input value to the power of. */
    exponent: Computable<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: Computable<CoercableComponent> | undefined;
    /** A computable that will be processed and passed directly into the returned modifier. */
    enabled?: Computable<boolean> | undefined;
    /** Add 1 before calculating, then remove it afterwards. This prevents low numbers from becoming lower. */
    supportLowNumbers?: boolean;
    /** Determines if numbers larger or smaller than 1 should be displayed as red. */
    smallerIsBetter?: boolean;
}

/**
 * Create a modifier that raises the input value to the power of some value.
 * @param optionsFunc Exponential modifier options.
 */
export function createExponentialModifier<T extends ExponentialModifierOptions>(
    optionsFunc: OptionsFunc<T>
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(feature => {
        const { exponent, description, enabled, supportLowNumbers, smallerIsBetter } =
            optionsFunc.call(feature, feature);

        const processedExponent = convertComputable(exponent);
        const processedDescription = convertComputable(description);
        const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
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
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) != null ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                      {supportLowNumbers ? " (+1 effective)" : null}
                                  </span>
                              ) : null}
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
                      ))
        };
    }) as unknown as ModifierFromOptionalParams<T["description"], T["enabled"]>;
}

/**
 * Takes an array of modifiers and applies and reverses them in order.
 * Modifiers that are not enabled will not be applied nor reversed.
 * Also joins their descriptions together.
 * @param modifiersFunc The modifiers to perform sequentially.
 * @see {@link createModifierSection}.
 */
export function createSequentialModifier<
    T extends Modifier[],
    S = T extends WithRequired<Modifier, "invert">[]
        ? WithRequired<Modifier, "description" | "invert">
        : Omit<WithRequired<Modifier, "description">, "invert">
>(modifiersFunc: () => T): S {
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
                      modifiers
                          .filter(m => unref(m.enabled) !== false)
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          .reduce((acc, curr) => curr.getFormula!(acc), gain)
                : undefined,
            enabled: modifiers.some(m => m.enabled != null)
                ? computed(() => modifiers.filter(m => unref(m.enabled) !== false).length > 0)
                : undefined,
            description: modifiers.some(m => m.description != null)
                ? jsx(() => (
                      <>
                          {(
                              modifiers
                                  .filter(m => unref(m.enabled) !== false)
                                  .map(m => unref(m.description))
                                  .filter(d => d) as CoercableComponent[]
                          ).map(renderJSX)}
                      </>
                  ))
                : undefined
        };
    }) as unknown as S;
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
    baseText?: CoercableComponent;
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
                <span class="modifier-description">{renderJSX(baseText ?? "Base")}</span>
                <span class="modifier-amount">
                    {formatSmall(base ?? 1)}
                    {unit}
                </span>
            </div>
            {renderJSX(unref(modifier.description))}
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

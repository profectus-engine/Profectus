import "components/common/modifiers.css";
import type { CoercableComponent } from "features/feature";
import { jsx } from "features/feature";
import type { DecimalSource } from "util/bignum";
import Decimal, { format } from "util/bignum";
import type { WithRequired } from "util/common";
import type { Computable, ProcessedComputable } from "util/computed";
import { convertComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { renderJSX } from "util/vue";
import { computed, unref } from "vue";

/**
 * An object that can be used to apply or unapply some modification to a number.
 * Being reversible requires the operation being invertible, but some features may rely on that.
 * Descriptions can be optionally included for displaying them to the player.
 * The built-in modifier creators are designed to display the modifiers using.
 * {@link createModifierSection}.
 */
export interface Modifier {
    /** Applies some operation on the input and returns the result. */
    apply: (gain: DecimalSource) => DecimalSource;
    /** Reverses the operation applied by the apply property. Required by some features. */
    revert?: (gain: DecimalSource) => DecimalSource;
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
        ? Omit<WithRequired<Modifier, "revert">, "description" | "enabled">
        : Omit<WithRequired<Modifier, "revert" | "enabled">, "description">
    : S extends undefined
    ? Omit<WithRequired<Modifier, "revert" | "description">, "enabled">
    : WithRequired<Modifier, "revert" | "enabled" | "description">;

/** An object that configures an additive modifier via {@link createAdditiveModifier}. */
export interface AdditiveModifierOptions {
    /** The amount to add to the input value. */
    addend: Computable<DecimalSource>;
    /** Description of what this modifier is doing. */
    description?: Computable<CoercableComponent> | undefined;
    /** A computable that will be processed and passed directly into the returned modifier. */
    enabled?: Computable<boolean> | undefined;
}

/**
 * Create a modifier that adds some value to the input value.
 * @param optionsFunc Additive modifier options.
 */
export function createAdditiveModifier<T extends AdditiveModifierOptions>(
    optionsFunc: () => T
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(() => {
        const { addend, description, enabled } = optionsFunc();

        const processedAddend = convertComputable(addend);
        const processedDescription = convertComputable(description);
        const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.add(gain, unref(processedAddend)),
            revert: (gain: DecimalSource) => Decimal.sub(gain, unref(processedAddend)),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                  </span>
                              ) : null}
                              <span class="modifier-amount">
                                  {Decimal.gte(unref(processedAddend), 0) ? "+" : ""}
                                  {format(unref(processedAddend))}
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
}

/**
 * Create a modifier that multiplies the input value by some value.
 * @param optionsFunc Multiplicative modifier options.
 */
export function createMultiplicativeModifier<T extends MultiplicativeModifierOptions>(
    optionsFunc: () => T
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(() => {
        const { multiplier, description, enabled } = optionsFunc();

        const processedMultiplier = convertComputable(multiplier);
        const processedDescription = convertComputable(description);
        const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
        return {
            apply: (gain: DecimalSource) => Decimal.times(gain, unref(processedMultiplier)),
            revert: (gain: DecimalSource) => Decimal.div(gain, unref(processedMultiplier)),
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                  </span>
                              ) : null}
                              <span class="modifier-amount">
                                  ×{format(unref(processedMultiplier))}
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
}

/**
 * Create a modifier that raises the input value to the power of some value.
 * @param optionsFunc Exponential modifier options.
 */
export function createExponentialModifier<T extends ExponentialModifierOptions>(
    optionsFunc: () => T
): ModifierFromOptionalParams<T["description"], T["enabled"]> {
    return createLazyProxy(() => {
        const { exponent, description, enabled, supportLowNumbers } = optionsFunc();

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
            revert: (gain: DecimalSource) => {
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
            enabled: processedEnabled,
            description:
                description == null
                    ? undefined
                    : jsx(() => (
                          <div class="modifier-container">
                              {unref(processedDescription) ? (
                                  <span class="modifier-description">
                                      {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                      {renderJSX(unref(processedDescription)!)}
                                      {supportLowNumbers ? " (+1 effective)" : null}
                                  </span>
                              ) : null}
                              <span class="modifier-amount">
                                  ^{format(unref(processedExponent))}
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
    S = T extends WithRequired<Modifier, "revert">[]
        ? WithRequired<Modifier, "description" | "revert">
        : Omit<WithRequired<Modifier, "description">, "revert">
>(modifiersFunc: () => T): S {
    return createLazyProxy(() => {
        const modifiers = modifiersFunc();

        return {
            apply: (gain: DecimalSource) =>
                modifiers
                    .filter(m => unref(m.enabled) !== false)
                    .reduce((gain, modifier) => modifier.apply(gain), gain),
            revert: modifiers.every(m => m.revert != null)
                ? (gain: DecimalSource) =>
                      modifiers
                          .filter(m => unref(m.enabled) !== false)
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          .reduceRight((gain, modifier) => modifier.revert!(gain), gain)
                : undefined,
            enabled: computed(() => modifiers.filter(m => unref(m.enabled) !== false).length > 0),
            description: jsx(() => (
                <>
                    {(
                        modifiers
                            .filter(m => unref(m.enabled) !== false)
                            .map(m => unref(m.description))
                            .filter(d => d) as CoercableComponent[]
                    ).map(renderJSX)}
                </>
            ))
        };
    }) as unknown as S;
}

/**
 * Create a JSX element that displays a modifier.
 * Intended to be used with the output from {@link createSequentialModifier}.
 * @param title The header for the section.
 * @param subtitle Smaller text that appears in the header after the title.
 * @param modifier The modifier to render.
 * @param base The base value that'll be passed into the modifier.
 * @param unit The unit of the value being modified, if any.
 * @param baseText The label to use for the base value.
 */
export function createModifierSection(
    title: string,
    subtitle: string,
    modifier: WithRequired<Modifier, "description">,
    base: DecimalSource = 1,
    unit = "",
    baseText: CoercableComponent = "Base"
) {
    return (
        <div>
            <h3>
                {title}
                {subtitle ? <span class="subtitle"> ({subtitle})</span> : null}
            </h3>
            <br />
            <div class="modifier-container">
                <span class="modifier-description">{renderJSX(baseText)}</span>
                <span class="modifier-amount">
                    {format(base)}
                    {unit}
                </span>
            </div>
            {renderJSX(unref(modifier.description))}
            <hr />
            <div class="modifier-container">
                <span class="modifier-description">Total</span>
                <span class="modifier-amount">
                    {format(modifier.apply(base))}
                    {unit}
                </span>
            </div>
        </div>
    );
}

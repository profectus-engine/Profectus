import "components/common/modifiers.css";
import { CoercableComponent, jsx } from "features/feature";
import Decimal, { DecimalSource, format } from "util/bignum";
import { WithRequired } from "util/common";
import { Computable, convertComputable, ProcessedComputable } from "util/computed";
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

/**
 * Create a modifier that adds some value to the input value.
 * @param addend The amount to add to the input value.
 * @param description Description of what this modifier is doing.
 * @param enabled A computable that will be processed and passed directly into the returned modifier.
 */
export function createAdditiveModifier<
    T extends Computable<CoercableComponent> | undefined,
    S extends Computable<boolean> | undefined,
    R = ModifierFromOptionalParams<T, S>
>(addend: Computable<DecimalSource>, description?: T, enabled?: S): R {
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
                          <span class="modifier-amount">+{format(unref(processedAddend))}</span>
                          {unref(processedDescription) ? (
                              <span class="modifier-description">
                                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                  {renderJSX(unref(processedDescription)!)}
                              </span>
                          ) : null}
                      </div>
                  ))
    } as unknown as R;
}

/**
 * Create a modifier that multiplies the input value by some value.
 * @param multiplier The value to multiply the input value by.
 * @param description Description of what this modifier is doing.
 * @param enabled A computable that will be processed and passed directly into the returned modifier.
 */
export function createMultiplicativeModifier<
    T extends Computable<CoercableComponent> | undefined,
    S extends Computable<boolean> | undefined,
    R = ModifierFromOptionalParams<T, S>
>(multiplier: Computable<DecimalSource>, description?: T, enabled?: S): R {
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
                          <span class="modifier-amount">x{format(unref(processedMultiplier))}</span>
                          {unref(processedDescription) ? (
                              <span class="modifier-description">
                                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                  {renderJSX(unref(processedDescription)!)}
                              </span>
                          ) : null}
                      </div>
                  ))
    } as unknown as R;
}

/**
 * Create a modifier that raises the input value to the power of some value.
 * @param exponent The value to raise the input value to the power of.
 * @param description Description of what this modifier is doing.
 * @param enabled A computable that will be processed and passed directly into the returned modifier.
 */
export function createExponentialModifier<
    T extends Computable<CoercableComponent> | undefined,
    S extends Computable<boolean> | undefined,
    R = ModifierFromOptionalParams<T, S>
>(exponent: Computable<DecimalSource>, description?: T, enabled?: S): R {
    const processedExponent = convertComputable(exponent);
    const processedDescription = convertComputable(description);
    const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
    return {
        apply: (gain: DecimalSource) => Decimal.pow(gain, unref(processedExponent)),
        revert: (gain: DecimalSource) => Decimal.root(gain, unref(processedExponent)),
        enabled: processedEnabled,
        description:
            description == null
                ? undefined
                : jsx(() => (
                      <div class="modifier-container">
                          <span class="modifier-amount">^{format(unref(processedExponent))}</span>
                          {unref(processedDescription) ? (
                              <span class="modifier-description">
                                  {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                                  {renderJSX(unref(processedDescription)!)}
                              </span>
                          ) : null}
                      </div>
                  ))
    } as unknown as R;
}

/**
 * Takes an array of modifiers and applies and reverses them in order.
 * Modifiers that are not enabled will not be applied nor reversed.
 * Also joins their descriptions together.
 * @param modifiers The modifiers to perform sequentially.
 * @see {@link createModifierSection}.
 */
export function createSequentialModifier<
    T extends Modifier[],
    S = T extends WithRequired<Modifier, "revert">[]
        ? WithRequired<Modifier, "description" | "revert">
        : Omit<WithRequired<Modifier, "description">, "revert">
>(...modifiers: T): S {
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
    } as unknown as S;
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
                <span class="modifier-amount">
                    {format(base)}
                    {unit}
                </span>
                <span class="modifier-description">{renderJSX(baseText)}</span>
            </div>
            {renderJSX(unref(modifier.description))}
            <hr />
            Total: {format(modifier.apply(base))}
            {unit}
        </div>
    );
}

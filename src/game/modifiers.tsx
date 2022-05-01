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
 * The built-in modifier creators are designed to display the modifiers using
 * {@link createModifierSection}
 */
export interface Modifier {
    /**
     * Applies some operation on the input and returns the result
     */
    apply: (gain: DecimalSource) => DecimalSource;
    /**
     * Reverses the operation applied by the apply property. Required by some features
     */
    revert?: (gain: DecimalSource) => DecimalSource;
    /**
     * Whether or not this modifier should be considered enabled.
     * Typically for use with modifiers passed into {@link createSequentialModifier}
     */
    enabled?: ProcessedComputable<boolean>;
    /**
     * A description of this modifier.
     * @see {@link createModifierSection}
     */
    description?: ProcessedComputable<CoercableComponent>;
}

/**
 * Create a modifier that adds some value to the input value
 * @param addend The amount to add to the input value
 * @param description Description of what this modifier is doing
 * @param enabled A computable that will be processed and passed directly into the returned modifier
 */
export function createAdditiveModifier(
    addend: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedAddend = convertComputable(addend);
    const processedDescription = convertComputable(description);
    const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
    return {
        apply: gain => Decimal.add(gain, unref(processedAddend)),
        revert: gain => Decimal.sub(gain, unref(processedAddend)),
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
    };
}

/**
 * Create a modifier that multiplies the input value by some value
 * @param multiplier The value to multiply the input value by
 * @param description Description of what this modifier is doing
 * @param enabled A computable that will be processed and passed directly into the returned modifier
 */
export function createMultiplicativeModifier(
    multiplier: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedMultiplier = convertComputable(multiplier);
    const processedDescription = convertComputable(description);
    const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
    return {
        apply: gain => Decimal.times(gain, unref(processedMultiplier)),
        revert: gain => Decimal.div(gain, unref(processedMultiplier)),
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
    };
}

/**
 * Create a modifier that raises the input value to the power of some value
 * @param exponent The value to raise the input value to the power of
 * @param description Description of what this modifier is doing
 * @param enabled A computable that will be processed and passed directly into the returned modifier
 */
export function createExponentialModifier(
    exponent: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedExponent = convertComputable(exponent);
    const processedDescription = convertComputable(description);
    const processedEnabled = enabled == null ? undefined : convertComputable(enabled);
    return {
        apply: gain => Decimal.pow(gain, unref(processedExponent)),
        revert: gain => Decimal.root(gain, unref(processedExponent)),
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
    };
}

/**
 * Takes an array of modifiers and applies and reverses them in order.
 * Modifiers that are not enabled will not be applied nor reversed.
 * Also joins their descriptions together.
 * @param modifiers The modifiers to perform sequentially
 * @see {@link createModifierSection}
 */
export function createSequentialModifier(
    ...modifiers: Modifier[]
): WithRequired<Modifier, "description"> {
    return {
        apply: gain =>
            modifiers
                .filter(m => unref(m.enabled) !== false)
                .reduce((gain, modifier) => modifier.apply(gain), gain),
        revert: modifiers.every(m => m.revert != null)
            ? gain =>
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
}

/**
 * Create a JSX element that displays a modifier.
 * Intended to be used with the output from {@link createSequentialModifier}
 * @param title The header for the section
 * @param subtitle Smaller text that appears in the header after the title
 * @param modifier The modifier to render
 * @param base The base value that'll be passed into the modifier
 * @param unit The unit of the value being modified, if any
 * @param baseText The label to use for the base value
 */
export function createModifierSection(
    title: string,
    subtitle: string,
    modifier: Required<Modifier>,
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

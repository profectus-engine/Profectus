import { CoercableComponent, jsx } from "features/feature";
import Decimal, { DecimalSource, format } from "util/bignum";
import { Computable, convertComputable, ProcessedComputable } from "util/computed";
import { renderJSX } from "util/vue";
import { computed, unref } from "vue";
import "components/common/modifiers.css";

export interface Modifier {
    apply: (gain: DecimalSource) => DecimalSource;
    revert: (gain: DecimalSource) => DecimalSource;
    enabled: ProcessedComputable<boolean>;
    description?: ProcessedComputable<CoercableComponent>;
}

export function createAdditiveModifier(
    addend: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedAddend = convertComputable(addend);
    const processedDescription = convertComputable(description);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.add(gain, unref(processedAddend)),
        revert: gain => Decimal.sub(gain, unref(processedAddend)),
        enabled: processedEnabled,
        description: jsx(() => (
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

export function createMultiplicativeModifier(
    multiplier: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedMultiplier = convertComputable(multiplier);
    const processedDescription = convertComputable(description);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.times(gain, unref(processedMultiplier)),
        revert: gain => Decimal.div(gain, unref(processedMultiplier)),
        enabled: processedEnabled,
        description: jsx(() => (
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

export function createExponentialModifier(
    exponent: Computable<DecimalSource>,
    description?: Computable<CoercableComponent>,
    enabled?: Computable<boolean>
): Modifier {
    const processedExponent = convertComputable(exponent);
    const processedDescription = convertComputable(description);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.pow(gain, unref(processedExponent)),
        revert: gain => Decimal.root(gain, unref(processedExponent)),
        enabled: processedEnabled,
        description: jsx(() => (
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

export function createSequentialModifier(...modifiers: Modifier[]): Required<Modifier> {
    return {
        apply: gain =>
            modifiers
                .filter(m => unref(m.enabled))
                .reduce((gain, modifier) => modifier.apply(gain), gain),
        revert: gain =>
            modifiers
                .filter(m => unref(m.enabled))
                .reduceRight((gain, modifier) => modifier.revert(gain), gain),
        enabled: computed(() => modifiers.filter(m => unref(m.enabled)).length > 0),
        description: jsx(() => (
            <>
                {(
                    modifiers
                        .filter(m => unref(m.enabled))
                        .map(m => unref(m.description))
                        .filter(d => d) as CoercableComponent[]
                ).map(renderJSX)}
            </>
        ))
    };
}

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

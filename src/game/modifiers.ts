import Decimal, { DecimalSource, format } from "util/bignum";
import { Computable, convertComputable, ProcessedComputable } from "util/computed";
import { computed, unref } from "vue";

export interface Modifier {
    apply: (gain: DecimalSource) => DecimalSource;
    revert: (gain: DecimalSource) => DecimalSource;
    enabled: ProcessedComputable<boolean>;
    description?: ProcessedComputable<string>;
}

export function createAdditiveModifier(
    addend: Computable<DecimalSource>,
    description?: string,
    enabled?: Computable<boolean>
): Modifier {
    const processedAddend = convertComputable(addend);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.add(gain, unref(processedAddend)),
        revert: gain => Decimal.sub(gain, unref(processedAddend)),
        enabled: processedEnabled,
        description: computed(() => `+${format(unref(processedAddend))} ${description}`)
    };
}

export function createMultiplicativeModifier(
    multiplier: Computable<DecimalSource>,
    description?: string,
    enabled?: Computable<boolean>
): Modifier {
    const processedMultiplier = convertComputable(multiplier);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.times(gain, unref(processedMultiplier)),
        revert: gain => Decimal.div(gain, unref(processedMultiplier)),
        enabled: processedEnabled,
        description: computed(() => `x${format(unref(processedMultiplier))} ${description}`)
    };
}

export function createExponentialModifier(
    exponent: Computable<DecimalSource>,
    description?: string,
    enabled?: Computable<boolean>
): Modifier {
    const processedExponent = convertComputable(exponent);
    const processedEnabled = convertComputable(enabled == null ? true : enabled);
    return {
        apply: gain => Decimal.pow(gain, unref(processedExponent)),
        revert: gain => Decimal.root(gain, unref(processedExponent)),
        enabled: processedEnabled,
        description: computed(() => `^${format(unref(processedExponent))} ${description}`)
    };
}

export function createSequentialModifier(...modifiers: Modifier[]): Modifier {
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
        description: computed(() => {
            return modifiers
                .filter(m => unref(m.enabled))
                .map(m => unref(m.description))
                .filter(d => d)
                .join("\n");
        })
    };
}

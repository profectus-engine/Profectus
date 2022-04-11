import { GenericLayer } from "game/layers";
import Decimal, { DecimalSource } from "util/bignum";
import {
    Computable,
    convertComputable,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, isRef, Ref, unref } from "vue";
import { OptionsFunc, Replace, setDefault } from "./feature";
import { Resource } from "./resources/resource";

export interface ConversionOptions {
    scaling: ScalingFunction;
    currentGain?: Computable<DecimalSource>;
    actualGain?: Computable<DecimalSource>;
    currentAt?: Computable<DecimalSource>;
    nextAt?: Computable<DecimalSource>;
    baseResource: Resource;
    gainResource: Resource;
    buyMax?: Computable<boolean>;
    roundUpCost?: Computable<boolean>;
    convert?: VoidFunction;
    gainModifier?: GainModifier;
}

export interface BaseConversion {
    convert: VoidFunction;
}

export type Conversion<T extends ConversionOptions> = Replace<
    T & BaseConversion,
    {
        currentGain: GetComputableTypeWithDefault<T["currentGain"], Ref<DecimalSource>>;
        actualGain: GetComputableTypeWithDefault<T["actualGain"], Ref<DecimalSource>>;
        currentAt: GetComputableTypeWithDefault<T["currentAt"], Ref<DecimalSource>>;
        nextAt: GetComputableTypeWithDefault<T["nextAt"], Ref<DecimalSource>>;
        buyMax: GetComputableTypeWithDefault<T["buyMax"], true>;
        roundUpCost: GetComputableTypeWithDefault<T["roundUpCost"], true>;
    }
>;

export type GenericConversion = Replace<
    Conversion<ConversionOptions>,
    {
        currentGain: ProcessedComputable<DecimalSource>;
        actualGain: ProcessedComputable<DecimalSource>;
        currentAt: ProcessedComputable<DecimalSource>;
        nextAt: ProcessedComputable<DecimalSource>;
        buyMax: ProcessedComputable<boolean>;
        roundUpCost: ProcessedComputable<boolean>;
    }
>;

export interface GainModifier {
    apply: (gain: DecimalSource) => DecimalSource;
    revert: (gain: DecimalSource) => DecimalSource;
}

export function createConversion<T extends ConversionOptions>(
    optionsFunc: OptionsFunc<T, Conversion<T>, BaseConversion>
): Conversion<T> {
    return createLazyProxy(() => {
        const conversion = optionsFunc();

        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() => {
                let gain = conversion.gainModifier
                    ? conversion.gainModifier.apply(
                          conversion.scaling.currentGain(conversion as GenericConversion)
                      )
                    : conversion.scaling.currentGain(conversion as GenericConversion);
                gain = Decimal.floor(gain).max(0);

                if (!unref(conversion.buyMax)) {
                    gain = gain.min(1);
                }
                return gain;
            });
        }
        if (conversion.actualGain == null) {
            conversion.actualGain = conversion.currentGain;
        }
        if (conversion.currentAt == null) {
            conversion.currentAt = computed(() => {
                let current = conversion.scaling.currentAt(conversion as GenericConversion);
                if (conversion.roundUpCost) current = Decimal.ceil(current);
                return current;
            });
        }
        if (conversion.nextAt == null) {
            conversion.nextAt = computed(() => {
                let next = conversion.scaling.nextAt(conversion as GenericConversion);
                if (conversion.roundUpCost) next = Decimal.ceil(next);
                return next;
            });
        }

        if (conversion.convert == null) {
            conversion.convert = function () {
                conversion.gainResource.value = Decimal.add(
                    conversion.gainResource.value,
                    unref((conversion as GenericConversion).currentGain)
                );
                // TODO just subtract cost?
                conversion.baseResource.value = 0;
            };
        }

        processComputable(conversion as T, "currentGain");
        processComputable(conversion as T, "actualGain");
        processComputable(conversion as T, "currentAt");
        processComputable(conversion as T, "nextAt");
        processComputable(conversion as T, "buyMax");
        setDefault(conversion, "buyMax", true);
        processComputable(conversion as T, "roundUpCost");
        setDefault(conversion, "roundUpCost", true);

        return conversion as unknown as Conversion<T>;
    });
}

export type ScalingFunction = {
    currentGain: (conversion: GenericConversion) => DecimalSource;
    currentAt: (conversion: GenericConversion) => DecimalSource;
    nextAt: (conversion: GenericConversion) => DecimalSource;
};

// Gain formula is (baseResource - base) * coefficient
// e.g. if base is 10 and coefficient is 0.5, 10 points makes 1 gain, 12 points is 2
export function createLinearScaling(
    base: DecimalSource | Ref<DecimalSource>,
    coefficient: DecimalSource | Ref<DecimalSource>
): ScalingFunction {
    return {
        currentGain(conversion) {
            if (Decimal.lt(conversion.baseResource.value, unref(base))) {
                return 0;
            }

            return Decimal.sub(conversion.baseResource.value, unref(base))
                .sub(1)
                .times(unref(coefficient))
                .add(1);
        },
        currentAt(conversion) {
            let current: DecimalSource = unref(conversion.currentGain);
            if (conversion.gainModifier) {
                current = conversion.gainModifier.revert(current);
            }
            current = Decimal.max(0, current);
            return Decimal.times(current, unref(coefficient)).add(unref(base));
        },
        nextAt(conversion) {
            let next: DecimalSource = Decimal.add(unref(conversion.currentGain), 1);
            if (conversion.gainModifier) {
                next = conversion.gainModifier.revert(next);
            }
            next = Decimal.max(0, next);
            return Decimal.times(next, unref(coefficient)).add(unref(base)).max(unref(base));
        }
    };
}

// Gain formula is (baseResource / base) ^ exponent
// e.g. if exponent is 0.5 and base is 10, then having 10 points makes gain 1, and 40 points is 2
export function createPolynomialScaling(
    base: DecimalSource | Ref<DecimalSource>,
    exponent: DecimalSource | Ref<DecimalSource>
): ScalingFunction {
    return {
        currentGain(conversion) {
            const gain = Decimal.div(conversion.baseResource.value, unref(base)).pow(
                unref(exponent)
            );

            if (gain.isNan()) {
                return new Decimal(0);
            }
            return gain;
        },
        currentAt(conversion) {
            let current: DecimalSource = unref(conversion.currentGain);
            if (conversion.gainModifier) {
                current = conversion.gainModifier.revert(current);
            }
            current = Decimal.max(0, current);
            return Decimal.root(current, unref(exponent)).times(unref(base));
        },
        nextAt(conversion) {
            let next: DecimalSource = Decimal.add(unref(conversion.currentGain), 1);
            if (conversion.gainModifier) {
                next = conversion.gainModifier.revert(next);
            }
            next = Decimal.max(0, next);
            return Decimal.root(next, unref(exponent)).times(unref(base)).max(unref(base));
        }
    };
}

export function createCumulativeConversion<S extends ConversionOptions>(
    optionsFunc: OptionsFunc<S, Conversion<S>>
): Conversion<S> {
    return createConversion(optionsFunc);
}

export function createIndependentConversion<S extends ConversionOptions>(
    optionsFunc: OptionsFunc<S, Conversion<S>>
): Conversion<S> {
    return createConversion(() => {
        const conversion: S = optionsFunc();

        setDefault(conversion, "buyMax", false);

        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() => {
                let gain = conversion.gainModifier
                    ? conversion.gainModifier.apply(
                          conversion.scaling.currentGain(conversion as GenericConversion)
                      )
                    : conversion.scaling.currentGain(conversion as GenericConversion);
                gain = Decimal.floor(gain).max(conversion.gainResource.value);

                if (!unref(conversion.buyMax)) {
                    gain = gain.min(Decimal.add(conversion.gainResource.value, 1));
                }
                return gain;
            });
        }
        if (conversion.actualGain == null) {
            conversion.actualGain = computed(() => {
                let gain = Decimal.sub(
                    conversion.scaling.currentGain(conversion as GenericConversion),
                    conversion.gainResource.value
                ).max(0);

                if (!unref(conversion.buyMax)) {
                    gain = gain.min(1);
                }
                return gain;
            });
        }
        setDefault(conversion, "convert", function () {
            conversion.gainResource.value = conversion.gainModifier
                ? conversion.gainModifier.apply(
                      unref((conversion as GenericConversion).currentGain)
                  )
                : unref((conversion as GenericConversion).currentGain);
            // TODO just subtract cost?
            // Maybe by adding a cost function to scaling and nextAt just calls the cost function
            // with 1 + currentGain
            conversion.baseResource.value = 0;
        });

        return conversion;
    });
}

export function setupPassiveGeneration(
    layer: GenericLayer,
    conversion: GenericConversion,
    rate: ProcessedComputable<DecimalSource> = 1
): void {
    layer.on("preUpdate", diff => {
        const currRate = isRef(rate) ? rate.value : rate;
        if (Decimal.neq(currRate, 0)) {
            conversion.gainResource.value = Decimal.add(
                conversion.gainResource.value,
                Decimal.times(currRate, diff).times(unref(conversion.currentGain))
            );
        }
    });
}

function softcap(
    value: DecimalSource,
    cap: DecimalSource,
    power: DecimalSource = 0.5
): DecimalSource {
    if (Decimal.lte(value, cap)) {
        return value;
    } else {
        return Decimal.pow(value, power).times(Decimal.pow(cap, Decimal.sub(1, power)));
    }
}

export function addSoftcap(
    scaling: ScalingFunction,
    cap: ProcessedComputable<DecimalSource>,
    power: ProcessedComputable<DecimalSource> = 0.5
): ScalingFunction {
    return {
        ...scaling,
        currentGain: conversion =>
            softcap(scaling.currentGain(conversion), unref(cap), unref(power))
    };
}

export function addHardcap(
    scaling: ScalingFunction,
    cap: ProcessedComputable<DecimalSource>
): ScalingFunction {
    return {
        ...scaling,
        currentGain: conversion => Decimal.min(scaling.currentGain(conversion), unref(cap))
    };
}

export function createAdditiveModifier(addend: Computable<DecimalSource>): GainModifier {
    const processedAddend = convertComputable(addend);
    return {
        apply: gain => Decimal.add(gain, unref(processedAddend)),
        revert: gain => Decimal.sub(gain, unref(processedAddend))
    };
}

export function createMultiplicativeModifier(multiplier: Computable<DecimalSource>): GainModifier {
    const processedMultiplier = convertComputable(multiplier);
    return {
        apply: gain => Decimal.times(gain, unref(processedMultiplier)),
        revert: gain => Decimal.div(gain, unref(processedMultiplier))
    };
}

export function createExponentialModifier(exponent: Computable<DecimalSource>): GainModifier {
    const processedExponent = convertComputable(exponent);
    return {
        apply: gain => Decimal.pow(gain, unref(processedExponent)),
        revert: gain => Decimal.root(gain, unref(processedExponent))
    };
}

export function createSequentialModifier(...modifiers: GainModifier[]): GainModifier {
    return {
        apply: gain => modifiers.reduce((gain, modifier) => modifier.apply(gain), gain),
        revert: gain => modifiers.reduceRight((gain, modifier) => modifier.revert(gain), gain)
    };
}

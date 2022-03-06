import { GenericLayer } from "game/layers";
import Decimal, { DecimalSource } from "util/bignum";
import {
    Computable,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, isRef, Ref, unref } from "vue";
import { Replace, setDefault } from "./feature";
import { Resource } from "./resources/resource";

export interface ConversionOptions {
    scaling: ScalingFunction;
    currentGain?: Computable<DecimalSource>;
    nextAt?: Computable<DecimalSource>;
    baseResource: Resource;
    gainResource: Resource;
    buyMax?: Computable<boolean>;
    roundUpCost?: Computable<boolean>;
    convert?: VoidFunction;
    modifyGainAmount?: (gain: DecimalSource) => DecimalSource;
}

interface BaseConversion {
    convert: VoidFunction;
}

export type Conversion<T extends ConversionOptions> = Replace<
    T & BaseConversion,
    {
        currentGain: GetComputableTypeWithDefault<T["currentGain"], Ref<DecimalSource>>;
        nextAt: GetComputableTypeWithDefault<T["nextAt"], Ref<DecimalSource>>;
        buyMax: GetComputableTypeWithDefault<T["buyMax"], true>;
        roundUpCost: GetComputableTypeWithDefault<T["roundUpCost"], true>;
    }
>;

export type GenericConversion = Replace<
    Conversion<ConversionOptions>,
    {
        currentGain: ProcessedComputable<DecimalSource>;
        nextAt: ProcessedComputable<DecimalSource>;
        buyMax: ProcessedComputable<boolean>;
        roundUpCost: ProcessedComputable<boolean>;
    }
>;

export function createConversion<T extends ConversionOptions>(
    optionsFunc: () => T & ThisType<Conversion<T>>
): Conversion<T> {
    return createLazyProxy(() => {
        const conversion: T = optionsFunc();

        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() =>
                conversion.scaling.currentGain(conversion as GenericConversion)
            );
        }
        if (conversion.nextAt == null) {
            conversion.nextAt = computed(() =>
                conversion.scaling.nextAt(conversion as GenericConversion)
            );
        }

        if (conversion.convert == null) {
            conversion.convert = function () {
                conversion.gainResource.value = Decimal.add(
                    conversion.gainResource.value,
                    conversion.modifyGainAmount
                        ? conversion.modifyGainAmount(
                              unref((conversion as GenericConversion).currentGain)
                          )
                        : unref((conversion as GenericConversion).currentGain)
                );
                // TODO just subtract cost?
                conversion.baseResource.value = 0;
            };
        }

        processComputable(conversion as T, "currentGain");
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

            let gain = Decimal.sub(conversion.baseResource.value, unref(base))
                .sub(1)
                .times(unref(coefficient))
                .add(1)
                .floor()
                .max(0);

            if (!conversion.buyMax) {
                gain = gain.min(1);
            }
            return gain;
        },
        nextAt(conversion) {
            let next = Decimal.add(unref(conversion.currentGain), 1)
                .times(unref(coefficient))
                .add(unref(base))
                .max(unref(base));
            if (conversion.roundUpCost) next = next.ceil();
            return next;
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
            let gain = Decimal.div(conversion.baseResource.value, unref(base))
                .pow(unref(exponent))
                .floor()
                .max(0);

            if (gain.isNan()) {
                return new Decimal(0);
            }

            if (!conversion.buyMax) {
                gain = gain.min(1);
            }
            return gain;
        },
        nextAt(conversion) {
            let next = Decimal.add(unref(conversion.currentGain), 1)
                .root(unref(exponent))
                .times(unref(base))
                .max(unref(base));
            if (conversion.roundUpCost) next = next.ceil();
            return next;
        }
    };
}

export function createCumulativeConversion<S extends ConversionOptions>(
    optionsFunc: () => S & ThisType<Conversion<S>>
): Conversion<S> {
    return createConversion(optionsFunc);
}

export function createIndependentConversion<S extends ConversionOptions>(
    optionsFunc: () => S & ThisType<Conversion<S>>
): Conversion<S> {
    return createConversion(() => {
        const conversion: S = optionsFunc();

        setDefault(conversion, "buyMax", false);

        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() =>
                Decimal.sub(
                    conversion.scaling.currentGain(conversion as GenericConversion),
                    conversion.gainResource.value
                )
                    .add(1)
                    .max(1)
            );
        }
        setDefault(conversion, "convert", function () {
            conversion.gainResource.value = conversion.modifyGainAmount
                ? conversion.modifyGainAmount(unref((conversion as GenericConversion).currentGain))
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
    layer.on("preUpdate", (diff: Decimal) => {
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

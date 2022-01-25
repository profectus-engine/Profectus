import { GenericLayer } from "@/game/layers";
import Decimal, { DecimalSource } from "@/util/bignum";
import {
    Computable,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";
import { computed, isRef, Ref, unref } from "vue";
import { Replace, setDefault } from "./feature";
import { Resource } from "./resource";

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
    options: T & ThisType<Conversion<T>>
): Conversion<T> {
    const conversion: T = options;

    if (conversion.convert == null) {
        conversion.convert = function () {
            unref<Resource>(proxy.gainResource).value = Decimal.add(
                unref<Resource>(proxy.gainResource).value,
                proxy.modifyGainAmount
                    ? proxy.modifyGainAmount(unref(proxy.currentGain))
                    : unref(proxy.currentGain)
            );
            // TODO just subtract cost?
            proxy.baseResource.value = 0;
        };
    }

    if (conversion.currentGain == null) {
        conversion.currentGain = computed(() => proxy.scaling.currentGain(proxy));
    }
    if (conversion.nextAt == null) {
        conversion.nextAt = computed(() => proxy.scaling.nextAt(proxy));
    }

    processComputable(conversion as T, "currentGain");
    processComputable(conversion as T, "nextAt");
    processComputable(conversion as T, "buyMax");
    setDefault(conversion, "buyMax", true);
    processComputable(conversion as T, "roundUpCost");
    setDefault(conversion, "roundUpCost", true);

    const proxy = createProxy(conversion as unknown as Conversion<T>);
    return proxy;
}

export type ScalingFunction = {
    currentGain: (conversion: GenericConversion) => DecimalSource;
    nextAt: (conversion: GenericConversion) => DecimalSource;
};

export function createLinearScaling(
    base: DecimalSource | Ref<DecimalSource>,
    coefficient: DecimalSource | Ref<DecimalSource>
): ScalingFunction {
    return {
        currentGain(conversion) {
            let gain = Decimal.sub(unref<Resource>(conversion.baseResource).value, unref(base))
                .div(unref(coefficient))
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

// Note: Not sure this actually should be described as exponential
// Gain formula is base * coefficient ^ (baseResource ^ exponent)
export function createExponentialScaling(
    base: DecimalSource | Ref<DecimalSource>,
    coefficient: DecimalSource | Ref<DecimalSource>,
    exponent: DecimalSource | Ref<DecimalSource>
): ScalingFunction {
    return {
        currentGain(conversion) {
            let gain = Decimal.div(unref<Resource>(conversion.baseResource).value, unref(base))
                .log(unref(coefficient))
                .pow(Decimal.div(1, unref(exponent)))
                .floor()
                .max(0);

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
    options: S & ThisType<Conversion<S>>
): Conversion<S> {
    return createConversion(options);
}

export function createIndependentConversion<S extends ConversionOptions>(
    options: S & ThisType<Conversion<S>>
): Conversion<S> {
    const conversion: S = options;

    setDefault(conversion, "buyMax", false);

    if (conversion.currentGain == null) {
        conversion.currentGain = computed(() =>
            Decimal.sub(proxy.scaling.currentGain(proxy), unref<Resource>(proxy.gainResource).value)
                .add(1)
                .max(1)
        );
    }
    setDefault(conversion, "convert", function () {
        unref<Resource>(proxy.gainResource).value = proxy.modifyGainAmount
            ? proxy.modifyGainAmount(unref(proxy.currentGain))
            : unref(proxy.currentGain);
        // TODO just subtract cost?
        // Maybe by adding a cost function to scaling and nextAt just calls the cost function
        // with 1 + currentGain
        proxy.baseResource.value = 0;
    });

    const proxy = createConversion(conversion);
    return proxy;
}

export function setupPassiveGeneration(
    layer: GenericLayer,
    conversion: GenericConversion,
    rate: DecimalSource | Ref<DecimalSource> = 1
): void {
    layer.on("preUpdate", (diff: Decimal) => {
        const currRate = isRef(rate) ? rate.value : rate;
        if (Decimal.neq(currRate, 0)) {
            conversion.gainResource.value = Decimal.add(
                unref<Resource>(conversion.gainResource).value,
                Decimal.times(currRate, diff).times(unref(conversion.currentGain))
            );
        }
    });
}

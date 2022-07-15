import type { OptionsFunc, Replace } from "features/feature";
import { setDefault } from "features/feature";
import type { Resource } from "features/resources/resource";
import type { BaseLayer } from "game/layers";
import type { Modifier } from "game/modifiers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import type { WithRequired } from "util/common";
import type { Computable, GetComputableTypeWithDefault, ProcessedComputable } from "util/computed";
import { convertComputable, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";

/** An object that configures a {@link Conversion}. */
export interface ConversionOptions {
    /**
     * The scaling function that is used to determine the rate of conversion from one {@link features/resources/resource.Resource} to the other.
     */
    scaling: ScalingFunction;
    /**
     * How much of the output resource the conversion can currently convert for.
     * Typically this will be set for you in a conversion constructor.
     */
    currentGain?: Computable<DecimalSource>;
    /**
     * The absolute amount the output resource will be changed by.
     * Typically this will be set for you in a conversion constructor.
     * This will differ from {@link currentGain} in the cases where the conversion isn't just adding the converted amount to the output resource.
     */
    actualGain?: Computable<DecimalSource>;
    /**
     * The amount of the input resource currently being required in order to produce the {@link currentGain}.
     * That is, if it went below this value then {@link currentGain} would decrease.
     * Typically this will be set for you in a conversion constructor.
     */
    currentAt?: Computable<DecimalSource>;
    /**
     * The amount of the input resource required to make {@link currentGain} increase.
     * Typically this will be set for you in a conversion constructor.
     */
    nextAt?: Computable<DecimalSource>;
    /**
     * The input {@link features/resources/resource.Resource} for this conversion.
     */
    baseResource: Resource;
    /**
     * The output {@link features/resources/resource.Resource} for this conversion. i.e. the resource being generated.
     */
    gainResource: Resource;
    /**
     * Whether or not to cap the amount of the output resource gained by converting at 1.
     * Defaults to true.
     */
    buyMax?: Computable<boolean>;
    /**
     * Whether or not to round up the cost to generate a given amount of the output resource.
     */
    roundUpCost?: Computable<boolean>;
    /**
     * The function that performs the actual conversion from {@link baseResource} to {@link gainResource}.
     * Typically this will be set for you in a conversion constructor.
     */
    convert?: VoidFunction;
    /**
     * The function that spends the {@link baseResource} as part of the conversion.
     * Defaults to setting the {@link baseResource} amount to 0.
     */
    spend?: (amountGained: DecimalSource) => void;
    /**
     * A callback that happens after a conversion has been completed.
     * Receives the amount gained via conversion.
     * This will not be called whenever using currentGain without calling convert (e.g. passive generation)
     */
    onConvert?: (amountGained: DecimalSource) => void;
    /**
     * An additional modifier that will be applied to the gain amounts.
     * Must be reversible in order to correctly calculate {@link nextAt}.
     * @see {@link game/modifiers.createSequentialModifier} if you want to apply multiple modifiers.
     */
    gainModifier?: WithRequired<Modifier, "revert">;
    /**
     * A modifier that will be applied to the cost amounts.
     * That is to say, this modifier will be applied to the amount of baseResource before going into the scaling function.
     * A cost modifier of x0.5 would give gain amounts equal to the player having half the baseResource they actually have.
     * Must be reversible in order to correctly calculate {@link nextAt}.
     * @see {@link game/modifiers.createSequentialModifier} if you want to apply multiple modifiers.
     */
    costModifier?: WithRequired<Modifier, "revert">;
}

/**
 * The properties that are added onto a processed {@link ConversionOptions} to create a {@link Conversion}.
 */
export interface BaseConversion {
    /**
     * The function that performs the actual conversion.
     */
    convert: VoidFunction;
}

/** An object that converts one {@link features/resources/resource.Resource} into another at a given rate. */
export type Conversion<T extends ConversionOptions> = Replace<
    T & BaseConversion,
    {
        currentGain: GetComputableTypeWithDefault<T["currentGain"], Ref<DecimalSource>>;
        actualGain: GetComputableTypeWithDefault<T["actualGain"], Ref<DecimalSource>>;
        currentAt: GetComputableTypeWithDefault<T["currentAt"], Ref<DecimalSource>>;
        nextAt: GetComputableTypeWithDefault<T["nextAt"], Ref<DecimalSource>>;
        buyMax: GetComputableTypeWithDefault<T["buyMax"], true>;
        spend: undefined extends T["spend"] ? (amountGained: DecimalSource) => void : T["spend"];
        roundUpCost: GetComputableTypeWithDefault<T["roundUpCost"], true>;
    }
>;

/** A type that matches any valid {@link Conversion} object. */
export type GenericConversion = Replace<
    Conversion<ConversionOptions>,
    {
        currentGain: ProcessedComputable<DecimalSource>;
        actualGain: ProcessedComputable<DecimalSource>;
        currentAt: ProcessedComputable<DecimalSource>;
        nextAt: ProcessedComputable<DecimalSource>;
        buyMax: ProcessedComputable<boolean>;
        spend: (amountGained: DecimalSource) => void;
        roundUpCost: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a conversion with the given options.
 * You typically shouldn't use this function directly. Instead use one of the other conversion constructors, which will then call this.
 * @param optionsFunc Conversion options.
 * @see {@link createCumulativeConversion}.
 * @see {@link createIndependentConversion}.
 */
export function createConversion<T extends ConversionOptions>(
    optionsFunc: OptionsFunc<T, BaseConversion, GenericConversion>
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
                const amountGained = unref((conversion as GenericConversion).currentGain);
                conversion.gainResource.value = Decimal.add(
                    conversion.gainResource.value,
                    amountGained
                );
                (conversion as GenericConversion).spend(amountGained);
                conversion.onConvert?.(amountGained);
            };
        }

        if (conversion.spend == null) {
            conversion.spend = function () {
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

/**
 * A collection of functions that allow a conversion to scale the amount of resources gained based on the input resource.
 * This typically shouldn't be created directly. Instead use one of the scaling function constructors.
 * @see {@link createLinearScaling}.
 * @see {@link createPolynomialScaling}.
 */
export interface ScalingFunction {
    /**
     * Calculates the amount of the output resource a conversion should be able to currently produce.
     * This should be based off of `conversion.baseResource.value`.
     * The conversion is responsible for applying the gainModifier, so this function should be un-modified.
     * It does not need to be clamped or rounded.
     */
    currentGain: (conversion: GenericConversion) => DecimalSource;
    /**
     * Calculates the amount of the input resource that is required for the current value of `conversion.currentGain`.
     * Note that `conversion.currentGain` has been modified by `conversion.gainModifier`, so you will need to revert that as appropriate.
     * The conversion is responsible for rounding up the amount as appropriate.
     * The returned value should not be below 0.
     */
    currentAt: (conversion: GenericConversion) => DecimalSource;
    /**
     * Calculates the amount of the input resource that would be required for the current value of `conversion.currentGain` to increase.
     * Note that `conversion.currentGain` has been modified by `conversion.gainModifier`, so you will need to revert that as appropriate.
     * The conversion is responsible for rounding up the amount as appropriate.
     * The returned value should not be below 0.
     */
    nextAt: (conversion: GenericConversion) => DecimalSource;
}

/**
 * Creates a scaling function based off the formula `(baseResource - base) * coefficient`.
 * If the baseResource value is less than base then the currentGain will be 0.
 * @param base The base variable in the scaling formula.
 * @param coefficient The coefficient variable in the scaling formula.
 * @example
 * A scaling function created via `createLinearScaling(10, 0.5)` would produce the following values:
 * | Base Resource | Current Gain |
 * | ------------- | ------------ |
 * | 10            | 1            |
 * | 12            | 2            |
 * | 20            | 6            |
 */
export function createLinearScaling(
    base: Computable<DecimalSource>,
    coefficient: Computable<DecimalSource>
): ScalingFunction {
    const processedBase = convertComputable(base);
    const processedCoefficient = convertComputable(coefficient);
    return {
        currentGain(conversion) {
            let baseAmount: DecimalSource = unref(conversion.baseResource.value);
            if (conversion.costModifier) {
                baseAmount = conversion.costModifier.apply(baseAmount);
            }
            if (Decimal.lt(baseAmount, unref(processedBase))) {
                return 0;
            }

            return Decimal.sub(baseAmount, unref(processedBase))
                .sub(1)
                .times(unref(processedCoefficient))
                .add(1);
        },
        currentAt(conversion) {
            let current: DecimalSource = unref(conversion.currentGain);
            if (conversion.gainModifier) {
                current = conversion.gainModifier.revert(current);
            }
            current = Decimal.max(0, current)
                .sub(1)
                .div(unref(processedCoefficient))
                .add(unref(processedBase));
            if (conversion.costModifier) {
                current = conversion.costModifier.revert(current);
            }
            return current;
        },
        nextAt(conversion) {
            let next: DecimalSource = Decimal.add(unref(conversion.currentGain), 1).floor();
            if (conversion.gainModifier) {
                next = conversion.gainModifier.revert(next);
            }
            next = Decimal.max(0, next)
                .sub(1)
                .div(unref(processedCoefficient))
                .add(unref(processedBase))
                .max(unref(processedBase));
            if (conversion.costModifier) {
                next = conversion.costModifier.revert(next);
            }
            return next;
        }
    };
}

/**
 * Creates a scaling function based off the formula `(baseResource / base) ^ exponent`.
 * If the baseResource value is less than base then the currentGain will be 0.
 * @param base The base variable in the scaling formula.
 * @param exponent The exponent variable in the scaling formula.
 * @example
 * A scaling function created via `createPolynomialScaling(10, 0.5)` would produce the following values:
 * | Base Resource | Current Gain |
 * | ------------- | ------------ |
 * | 10            | 1            |
 * | 40            | 2            |
 * | 250           | 5            |
 */
export function createPolynomialScaling(
    base: Computable<DecimalSource>,
    exponent: Computable<DecimalSource>
): ScalingFunction {
    const processedBase = convertComputable(base);
    const processedExponent = convertComputable(exponent);
    return {
        currentGain(conversion) {
            let baseAmount: DecimalSource = unref(conversion.baseResource.value);
            if (conversion.costModifier) {
                baseAmount = conversion.costModifier.apply(baseAmount);
            }
            if (Decimal.lt(baseAmount, unref(processedBase))) {
                return 0;
            }

            const gain = Decimal.div(baseAmount, unref(processedBase)).pow(
                unref(processedExponent)
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
            current = Decimal.max(0, current)
                .root(unref(processedExponent))
                .times(unref(processedBase));
            if (conversion.costModifier) {
                current = conversion.costModifier.revert(current);
            }
            return current;
        },
        nextAt(conversion) {
            let next: DecimalSource = Decimal.add(unref(conversion.currentGain), 1).floor();
            if (conversion.gainModifier) {
                next = conversion.gainModifier.revert(next);
            }
            next = Decimal.max(0, next)
                .root(unref(processedExponent))
                .times(unref(processedBase))
                .max(unref(processedBase));
            if (conversion.costModifier) {
                next = conversion.costModifier.revert(next);
            }
            return next;
        }
    };
}

/**
 * Creates a conversion that simply adds to the gainResource amount upon converting.
 * This is similar to the behavior of "normal" layers in The Modding Tree.
 * This is equivalent to just calling createConversion directly.
 * @param optionsFunc Conversion options.
 */
export function createCumulativeConversion<S extends ConversionOptions>(
    optionsFunc: OptionsFunc<S, BaseConversion, GenericConversion>
): Conversion<S> {
    return createConversion(optionsFunc);
}

/**
 * Creates a conversion that will replace the gainResource amount with the new amount upon converting.
 * This is similar to the behavior of "static" layers in The Modding Tree.
 * @param optionsFunc Converison options.
 */
export function createIndependentConversion<S extends ConversionOptions>(
    optionsFunc: OptionsFunc<S, BaseConversion, GenericConversion>
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
                    Decimal.floor(conversion.scaling.currentGain(conversion as GenericConversion)),
                    conversion.gainResource.value
                ).max(0);

                if (!unref(conversion.buyMax)) {
                    gain = gain.min(1);
                }
                return gain;
            });
        }
        setDefault(conversion, "convert", function () {
            const amountGained = unref((conversion as GenericConversion).actualGain);
            conversion.gainResource.value = conversion.gainModifier
                ? conversion.gainModifier.apply(
                      unref((conversion as GenericConversion).currentGain)
                  )
                : unref((conversion as GenericConversion).currentGain);
            (conversion as GenericConversion).spend(amountGained);
            conversion.onConvert?.(amountGained);
        });

        return conversion;
    }) as Conversion<S>;
}

/**
 * This will automatically increase the value of conversion.gainResource without lowering the value of the input resource.
 * It will by default perform 100% of a conversion's currentGain per second.
 * If you use a ref for the rate you can set it's value to 0 when passive generation should be disabled.
 * @param layer The layer this passive generation will be associated with. Typically `this` when calling this function from inside a layer's options function.
 * @param conversion The conversion that will determine how much generation there is.
 * @param rate A multiplier to multiply against the conversion's currentGain.
 * @param cap A value that should not be passed via passive generation. If null, no cap is applied.
 */
export function setupPassiveGeneration(
    layer: BaseLayer,
    conversion: GenericConversion,
    rate: Computable<DecimalSource> = 1,
    cap: Computable<DecimalSource | null> = null
): void {
    const processedRate = convertComputable(rate);
    const processedCap = convertComputable(cap);
    layer.on("preUpdate", diff => {
        const currRate = unref(processedRate);
        if (Decimal.neq(currRate, 0)) {
            conversion.gainResource.value = Decimal.add(
                conversion.gainResource.value,
                Decimal.times(currRate, diff).times(Decimal.ceil(unref(conversion.actualGain)))
            ).min(unref(processedCap) ?? Decimal.dInf);
        }
    });
}

/**
 * Given a value, this function finds the amount above a certain value and raises it to a power.
 * If the power is <1, this will effectively make the value scale slower after the cap.
 * @param value The raw value.
 * @param cap The value after which the softcap should be applied.
 * @param power The power to raise value above the cap to.
 * @example
 * A softcap added via `addSoftcap(scaling, 100, 0.5)` would produce the following values:
 * | Raw Value | Softcapped Value |
 * | --------- | ---------------- |
 * | 1         | 1                |
 * | 100       | 100              |
 * | 125       | 105              |
 * | 200       | 110              |
 */
export function softcap(
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

/**
 * Creates a scaling function based off an existing scaling function, with a softcap applied to it.
 * The softcap will take any value above a certain value and raise it to a power.
 * If the power is <1, this will effectively make the value scale slower after the cap.
 * @param scaling The raw scaling function.
 * @param cap The value after which the softcap should be applied.
 * @param power The power to raise value about the cap to.
 * @see {@link softcap}.
 */
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

/**
 * Creates a scaling function off an existing function, with a hardcap applied to it.
 * The harcap will ensure that the currentGain will stop at a given cap.
 * @param scaling The raw scaling function.
 * @param cap The maximum value the scaling function can output.
 */
export function addHardcap(
    scaling: ScalingFunction,
    cap: ProcessedComputable<DecimalSource>
): ScalingFunction {
    return {
        ...scaling,
        currentGain: conversion => Decimal.min(scaling.currentGain(conversion), unref(cap))
    };
}

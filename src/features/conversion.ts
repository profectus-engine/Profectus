import type { CoercableComponent, OptionsFunc, Replace } from "features/feature";
import { setDefault } from "features/feature";
import type { Resource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { InvertibleFormula, InvertibleIntegralFormula } from "game/formulas/types";
import type { BaseLayer } from "game/layers";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import type { Computable, GetComputableTypeWithDefault, ProcessedComputable } from "util/computed";
import { convertComputable, processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { Ref } from "vue";
import { computed, unref } from "vue";
import { GenericDecorator } from "./decorators/common";
import { createBooleanRequirement } from "game/requirements";

/** An object that configures a {@link Conversion}. */
export interface ConversionOptions {
    /**
     * The formula used to determine how much {@link gainResource} should be earned by this converting.
     * The passed value will be a Formula representing the {@link baseResource} variable.
     */
    formula: (variable: InvertibleIntegralFormula) => InvertibleFormula;
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
        formula: InvertibleFormula;
        currentGain: GetComputableTypeWithDefault<T["currentGain"], Ref<DecimalSource>>;
        actualGain: GetComputableTypeWithDefault<T["actualGain"], Ref<DecimalSource>>;
        currentAt: GetComputableTypeWithDefault<T["currentAt"], Ref<DecimalSource>>;
        nextAt: GetComputableTypeWithDefault<T["nextAt"], Ref<DecimalSource>>;
        buyMax: GetComputableTypeWithDefault<T["buyMax"], true>;
        spend: undefined extends T["spend"] ? (amountGained: DecimalSource) => void : T["spend"];
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
    optionsFunc: OptionsFunc<T, BaseConversion, GenericConversion>,
    ...decorators: GenericDecorator[]
): Conversion<T> {
    return createLazyProxy(feature => {
        const conversion = optionsFunc.call(feature, feature);

        for (const decorator of decorators) {
            decorator.preConstruct?.(conversion);
        }

        (conversion as GenericConversion).formula = conversion.formula(
            Formula.variable(conversion.baseResource)
        );
        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() => {
                let gain = Decimal.floor(
                    (conversion as GenericConversion).formula.evaluate(
                        conversion.baseResource.value
                    )
                ).max(0);
                if (unref(conversion.buyMax) === false) {
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
                return (conversion as GenericConversion).formula.invert(
                    Decimal.floor(unref((conversion as GenericConversion).currentGain))
                );
            });
        }
        if (conversion.nextAt == null) {
            conversion.nextAt = computed(() => {
                return (conversion as GenericConversion).formula.invert(
                    Decimal.floor(unref((conversion as GenericConversion).currentGain)).add(1)
                );
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

        for (const decorator of decorators) {
            decorator.postConstruct?.(conversion);
        }

        return conversion as unknown as Conversion<T>;
    });
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
    return createConversion(feature => {
        const conversion: S = optionsFunc.call(feature, feature);

        setDefault(conversion, "buyMax", false);

        if (conversion.currentGain == null) {
            conversion.currentGain = computed(() => {
                let gain = Decimal.floor(
                    (conversion as unknown as GenericConversion).formula.evaluate(
                        conversion.baseResource.value
                    )
                ).max(conversion.gainResource.value);
                if (unref(conversion.buyMax) === false) {
                    gain = gain.min(Decimal.add(conversion.gainResource.value, 1));
                }
                return gain;
            });
        }
        if (conversion.actualGain == null) {
            conversion.actualGain = computed(() => {
                let gain = Decimal.sub(
                    (conversion as unknown as GenericConversion).formula.evaluate(
                        conversion.baseResource.value
                    ),
                    conversion.gainResource.value
                )
                    .floor()
                    .max(0);

                if (unref(conversion.buyMax) === false) {
                    gain = gain.min(1);
                }
                return gain;
            });
        }
        setDefault(conversion, "convert", function () {
            const amountGained = unref((conversion as unknown as GenericConversion).actualGain);
            conversion.gainResource.value = unref(
                (conversion as unknown as GenericConversion).currentGain
            );
            (conversion as unknown as GenericConversion).spend(amountGained);
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
 * @param cap A value that should not be passed via passive generation.
 */
export function setupPassiveGeneration(
    layer: BaseLayer,
    conversion: GenericConversion,
    rate: Computable<DecimalSource> = 1,
    cap: Computable<DecimalSource> = Decimal.dInf
): void {
    const processedRate = convertComputable(rate);
    const processedCap = convertComputable(cap);
    layer.on("preUpdate", diff => {
        const currRate = unref(processedRate);
        if (Decimal.neq(currRate, 0)) {
            conversion.gainResource.value = Decimal.add(
                conversion.gainResource.value,
                Decimal.times(currRate, diff).times(Decimal.ceil(unref(conversion.actualGain)))
            )
                .min(unref(processedCap))
                .max(conversion.gainResource.value);
        }
    });
}

/**
 * Creates requirement that is met when the conversion hits a specified gain amount
 * @param conversion The conversion to check the gain amount of
 * @param minGainAmount The minimum gain amount that must be met for the requirement to be met
 */
export function createCanConvertRequirement(
    conversion: GenericConversion,
    minGainAmount: Computable<DecimalSource> = 1,
    display?: CoercableComponent
) {
    const computedMinGainAmount = convertComputable(minGainAmount);
    return createBooleanRequirement(
        () => Decimal.gte(unref(conversion.actualGain), unref(computedMinGainAmount)),
        display
    );
}

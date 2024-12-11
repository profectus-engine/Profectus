import type { Resource } from "features/resources/resource";
import Formula from "game/formulas/formulas";
import { InvertibleFormula, InvertibleIntegralFormula } from "game/formulas/types";
import type { BaseLayer } from "game/layers";
import { createBooleanRequirement } from "game/requirements";
import type { DecimalSource } from "util/bignum";
import Decimal from "util/bignum";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable } from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, unref } from "vue";

/** A symbol used to identify {@link Conversion} features. */
export const ConversionType = Symbol("Conversion");

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
    currentGain?: MaybeRefOrGetter<DecimalSource>;
    /**
     * The absolute amount the output resource will be changed by.
     * Typically this will be set for you in a conversion constructor.
     * This will differ from {@link currentGain} in the cases where the conversion isn't just adding the converted amount to the output resource.
     */
    actualGain?: MaybeRefOrGetter<DecimalSource>;
    /**
     * The amount of the input resource currently being required in order to produce the {@link currentGain}.
     * That is, if it went below this value then {@link currentGain} would decrease.
     * Typically this will be set for you in a conversion constructor.
     */
    currentAt?: MaybeRefOrGetter<DecimalSource>;
    /**
     * The amount of the input resource required to make {@link currentGain} increase.
     * Typically this will be set for you in a conversion constructor.
     */
    nextAt?: MaybeRefOrGetter<DecimalSource>;
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
    buyMax?: MaybeRefOrGetter<boolean>;
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
export interface Conversion {
    /**
     * The formula used to determine how much {@link gainResource} should be earned by this converting.
     */
    formula: InvertibleFormula;
    /**
     * How much of the output resource the conversion can currently convert for.
     * Typically this will be set for you in a conversion constructor.
     */
    currentGain: MaybeRef<DecimalSource>;
    /**
     * The absolute amount the output resource will be changed by.
     * Typically this will be set for you in a conversion constructor.
     * This will differ from {@link currentGain} in the cases where the conversion isn't just adding the converted amount to the output resource.
     */
    actualGain: MaybeRef<DecimalSource>;
    /**
     * The amount of the input resource currently being required in order to produce the {@link currentGain}.
     * That is, if it went below this value then {@link currentGain} would decrease.
     * Typically this will be set for you in a conversion constructor.
     */
    currentAt: MaybeRef<DecimalSource>;
    /**
     * The amount of the input resource required to make {@link currentGain} increase.
     * Typically this will be set for you in a conversion constructor.
     */
    nextAt: MaybeRef<DecimalSource>;
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
    buyMax: MaybeRef<boolean>;
    /**
     * The function that performs the actual conversion from {@link baseResource} to {@link gainResource}.
     * Typically this will be set for you in a conversion constructor.
     */
    convert: VoidFunction;
    /**
     * The function that spends the {@link baseResource} as part of the conversion.
     * Defaults to setting the {@link baseResource} amount to 0.
     */
    spend: (amountGained: DecimalSource) => void;
    /**
     * A callback that happens after a conversion has been completed.
     * Receives the amount gained via conversion.
     * This will not be called whenever using currentGain without calling convert (e.g. passive generation)
     */
    onConvert?: (amountGained: DecimalSource) => void;
}

/**
 * Lazily creates a conversion with the given options.
 * You typically shouldn't use this function directly. Instead use one of the other conversion constructors, which will then call this.
 * @param optionsFunc Conversion options.
 * @see {@link createCumulativeConversion}.
 * @see {@link createIndependentConversion}.
 */
export function createConversion<T extends ConversionOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc();
        const {
            baseResource,
            gainResource,
            formula,
            currentGain: _currentGain,
            actualGain,
            currentAt,
            nextAt,
            convert,
            spend,
            buyMax,
            onConvert,
            ...props
        } = options;

        const currentGain =
            _currentGain == null
                ? computed((): Decimal => {
                      let gain = Decimal.floor(conversion.formula.evaluate(baseResource.value)).max(
                          0
                      );
                      if (unref(conversion.buyMax) === false) {
                          gain = gain.min(1);
                      }
                      return gain;
                  })
                : processGetter(_currentGain);

        const conversion = {
            type: ConversionType,
            ...(props as Omit<typeof props, keyof ConversionOptions>),
            baseResource,
            gainResource,
            formula: formula(Formula.variable(baseResource)),
            currentGain,
            actualGain: actualGain == null ? currentGain : processGetter(actualGain),
            currentAt:
                currentAt == null
                    ? computed(
                          (): DecimalSource =>
                              conversion.formula.invert(
                                  Decimal.floor(unref(conversion.currentGain))
                              )
                      )
                    : processGetter(currentAt),
            nextAt:
                nextAt == null
                    ? computed(
                          (): DecimalSource =>
                              conversion.formula.invert(
                                  Decimal.floor(unref(conversion.currentGain)).add(1)
                              )
                      )
                    : processGetter(nextAt),
            convert:
                convert ??
                function () {
                    const amountGained = unref(conversion.currentGain);
                    gainResource.value = Decimal.add(gainResource.value, amountGained);
                    conversion.spend(amountGained);
                    onConvert?.(amountGained);
                },
            spend: spend ?? (() => (baseResource.value = 0)),
            buyMax: processGetter(buyMax) ?? true,
            onConvert
        } satisfies Conversion;

        return conversion;
    });
}

/**
 * Creates a conversion that simply adds to the gainResource amount upon converting.
 * This is similar to the behavior of "normal" layers in The Modding Tree.
 * This is equivalent to just calling createConversion directly.
 * @param optionsFunc Conversion options.
 */
export function createCumulativeConversion<T extends ConversionOptions>(optionsFunc: () => T) {
    return createConversion(optionsFunc);
}

/**
 * Creates a conversion that will replace the gainResource amount with the new amount upon converting.
 * This is similar to the behavior of "static" layers in The Modding Tree.
 * @param optionsFunc Converison options.
 */
export function createIndependentConversion<T extends ConversionOptions>(optionsFunc: () => T) {
    const conversion = createConversion(() => {
        const options = optionsFunc();

        options.buyMax ??= false;

        options.currentGain ??= computed(() => {
            let gain = Decimal.floor(conversion.formula.evaluate(options.baseResource.value)).max(
                options.gainResource.value
            );
            if (unref(options.buyMax as MaybeRef<boolean>) === false) {
                gain = gain.min(Decimal.add(options.gainResource.value, 1));
            }
            return gain;
        });

        options.actualGain ??= computed(() => {
            let gain = Decimal.sub(
                conversion.formula.evaluate(options.baseResource.value),
                options.gainResource.value
            )
                .floor()
                .max(0);

            if (unref(options.buyMax as MaybeRef<boolean>) === false) {
                gain = gain.min(1);
            }
            return gain;
        });

        options.convert ??= function () {
            const amountGained = unref(conversion.actualGain);
            options.gainResource.value = unref(conversion.currentGain);
            conversion.spend(amountGained);
            conversion.onConvert?.(amountGained);
        };

        return options;
    });
    return conversion;
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
    conversion: Conversion,
    rate: MaybeRefOrGetter<DecimalSource> = 1,
    cap: MaybeRefOrGetter<DecimalSource> = Decimal.dInf
): void {
    const processedRate = processGetter(rate);
    const processedCap = processGetter(cap);
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
    conversion: Conversion,
    minGainAmount: MaybeRefOrGetter<DecimalSource> = 1,
    display?: MaybeGetter<Renderable>
) {
    const computedMinGainAmount = processGetter(minGainAmount);
    return createBooleanRequirement(
        () => Decimal.gte(unref(conversion.actualGain), unref(computedMinGainAmount)),
        display
    );
}

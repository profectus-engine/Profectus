import { Replace } from "features/feature";
import Decimal, { DecimalSource } from "util/bignum";
import {
    Computable,
    GetComputableType,
    ProcessedComputable,
    processComputable
} from "util/computed";
import { Ref, computed, unref } from "vue";
import { Decorator } from "./common";

export interface BonusAmountFeatureOptions {
    bonusAmount: Computable<DecimalSource>;
    totalAmount?: Computable<DecimalSource>;
}
export interface BonusCompletionsFeatureOptions {
    bonusCompletions: Computable<DecimalSource>;
    totalCompletions?: Computable<DecimalSource>;
}

export interface BaseBonusAmountFeature {
    amount: Ref<DecimalSource>;
    bonusAmount: ProcessedComputable<DecimalSource>;
    totalAmount?: Ref<DecimalSource>;
}
export interface BaseBonusCompletionsFeature {
    completions: Ref<DecimalSource>;
    bonusCompletions: ProcessedComputable<DecimalSource>;
    totalCompletions?: Ref<DecimalSource>;
}

export type BonusAmountFeature<T extends BonusAmountFeatureOptions> = Replace<
    T,
    { bonusAmount: GetComputableType<T["bonusAmount"]> }
>;
export type BonusCompletionsFeature<T extends BonusCompletionsFeatureOptions> = Replace<
    T,
    { bonusAmount: GetComputableType<T["bonusCompletions"]> }
>;

export type GenericBonusAmountFeature = Replace<
    BonusAmountFeature<BonusAmountFeatureOptions>,
    {
        bonusAmount: ProcessedComputable<DecimalSource>;
        totalAmount: ProcessedComputable<DecimalSource>;
    }
>;
export type GenericBonusCompletionsFeature = Replace<
    BonusCompletionsFeature<BonusCompletionsFeatureOptions>,
    {
        bonusCompletions: ProcessedComputable<DecimalSource>;
        totalCompletions: ProcessedComputable<DecimalSource>;
    }
>;

/**
 * Allows the addition of "bonus levels" to the decorated feature, with an accompanying "total amount".
 * To function properly, the `createFeature()` function must have its generic type extended by {@linkcode BonusAmountFeatureOptions}.
 * Additionally, the base feature must have an `amount` property.
 * To allow access to the decorated values outside the `createFeature()` function, the output type must be extended by {@linkcode GenericBonusAmountFeature}.
 * @example ```ts
 * createRepeatable<RepeatableOptions & BonusAmountFeatureOptions>(() => ({
 *   bonusAmount: noPersist(otherRepeatable.amount),
 *   ...
 * }), bonusAmountDecorator) as GenericRepeatable & GenericBonusAmountFeature
 */
export const bonusAmountDecorator: Decorator<
    BonusAmountFeatureOptions,
    BaseBonusAmountFeature,
    GenericBonusAmountFeature
> = {
    postConstruct(feature) {
        if (feature.amount === undefined) {
            console.error(
                `Decorated feature ${feature.id} does not contain the required 'amount' property"`
            );
        }
        processComputable(feature, "bonusAmount");
        if (feature.totalAmount === undefined) {
            feature.totalAmount = computed(() =>
                Decimal.add(
                    unref(feature.amount ?? 0),
                    unref(feature.bonusAmount as ProcessedComputable<DecimalSource>)
                )
            );
        }
    }
};

/**
 * Allows the addition of "bonus levels" to the decorated feature, with an accompanying "total amount".
 * To function properly, the `createFeature()` function must have its generic type extended by {@linkcode BonusCompletionFeatureOptions}.
 * To allow access to the decorated values outside the `createFeature()` function, the output type must be extended by {@linkcode GenericBonusCompletionFeature}.
 * @example ```ts
 * createChallenge<ChallengeOptions & BonusCompletionFeatureOptions>(() => ({
 *   bonusCompletions: noPersist(otherChallenge.completions),
 *   ...
 * }), bonusCompletionDecorator) as GenericChallenge & GenericBonusCompletionFeature
 * ```
 */
export const bonusCompletionsDecorator: Decorator<
    BonusCompletionsFeatureOptions,
    BaseBonusCompletionsFeature,
    GenericBonusCompletionsFeature
> = {
    postConstruct(feature) {
        processComputable(feature, "bonusCompletions");
        if (feature.totalCompletions === undefined) {
            feature.totalCompletions = computed(() =>
                Decimal.add(
                    unref(feature.completions ?? 0),
                    unref(feature.bonusCompletions as ProcessedComputable<DecimalSource>)
                )
            );
        }
    }
};

import { Replace, OptionsObject } from "./feature";
import Decimal, { DecimalSource } from "util/bignum";
import { Computable, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import { Persistent, State } from "game/persistence";
import { computed, Ref, unref } from "vue";

/*----====----*/

export type Decorator<FeatureOptions, BaseFeature = {}, GenericFeature = {}, S extends State = State> = {
    getPersistentData?(): Record<string, Persistent<S>>;
    preConstruct?(feature: OptionsObject<FeatureOptions,BaseFeature,GenericFeature>): void;
    postConstruct?(feature: OptionsObject<FeatureOptions,BaseFeature,GenericFeature>): void;
    getGatheredProps?(feature: OptionsObject<FeatureOptions,BaseFeature,GenericFeature>): Partial<OptionsObject<FeatureOptions,BaseFeature,GenericFeature>>
}

/*----====----*/

// #region Effect Decorator
export interface EffectFeatureOptions {
    effect: Computable<any>;
}

export type EffectFeature<T extends EffectFeatureOptions> = Replace<
    T, { effect: GetComputableType<T["effect"]>; }
>;

export type GenericEffectFeature = Replace<
    EffectFeature<EffectFeatureOptions>,
    { effect: ProcessedComputable<any>; }
>;

export const effectDecorator: Decorator<EffectFeatureOptions, {}, GenericEffectFeature> = {
    postConstruct(feature) {
        processComputable(feature, "effect");
    }
}
// #endregion

/*----====----*/

// #region Bonus Amount/Completions Decorator
export interface BonusAmountFeatureOptions {
    bonusAmount: Computable<DecimalSource>;
}
export interface BonusCompletionsFeatureOptions {
    bonusCompletions: Computable<DecimalSource>;
}

export interface BaseBonusAmountFeature {
    amount: Ref<DecimalSource>;
    totalAmount: Ref<DecimalSource>;
}
export interface BaseBonusCompletionsFeature {
    completions: Ref<DecimalSource>;
    totalCompletions: Ref<DecimalSource>;
}

export type BonusAmountFeature<T extends BonusAmountFeatureOptions> = Replace<
    T, { bonusAmount: GetComputableType<T["bonusAmount"]>; }
>;
export type BonusCompletionsFeature<T extends BonusCompletionsFeatureOptions> = Replace<
    T, { bonusAmount: GetComputableType<T["bonusCompletions"]>; }
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

export const bonusAmountDecorator: Decorator<BonusAmountFeatureOptions, BaseBonusAmountFeature, GenericBonusAmountFeature> = {
    postConstruct(feature) {
        processComputable(feature, "bonusAmount");
        if (feature.totalAmount === undefined) {
            feature.totalAmount = computed(() => Decimal.add(
                unref(feature.amount ?? 0),
                unref(feature.bonusAmount as ProcessedComputable<DecimalSource>)
            ));
        }
    }
}
export const bonusCompletionsDecorator: Decorator<BonusAmountFeatureOptions, BaseBonusCompletionsFeature, GenericBonusCompletionsFeature> = {
    postConstruct(feature) {
        processComputable(feature, "bonusAmount");
        if (feature.totalCompletions === undefined) {
            feature.totalCompletions = computed(() => Decimal.add(
                unref(feature.completions ?? 0),
                unref(feature.bonusAmount as ProcessedComputable<DecimalSource>)
            ));
        }
    }
}
// #endregion

/*----====----*/


import { Replace, OptionsObject } from "./feature";
import Decimal, { DecimalSource } from "util/bignum";
import { Computable, GetComputableType, processComputable, ProcessedComputable } from "util/computed";
import { AchievementOptions, BaseAchievement, GenericAchievement } from "./achievements/achievement";
import { BarOptions, BaseBar, GenericBar } from "./bars/bar";
import { BaseBuyable, BuyableOptions, GenericBuyable } from "./buyable";
import { BaseChallenge, ChallengeOptions, GenericChallenge } from "./challenges/challenge";
import { BaseClickable, ClickableOptions, GenericClickable } from "./clickables/clickable";
import { BaseMilestone, GenericMilestone, MilestoneOptions } from "./milestones/milestone";
import { BaseUpgrade, GenericUpgrade, UpgradeOptions } from "./upgrades/upgrade";
import { Persistent, State } from "game/persistence";
import { computed, Ref, unref } from "vue";

type FeatureOptions = AchievementOptions | BarOptions | BuyableOptions | ChallengeOptions | ClickableOptions | MilestoneOptions | UpgradeOptions;

type BaseFeature = BaseAchievement | BaseBar | BaseBuyable | BaseChallenge | BaseClickable | BaseMilestone | BaseUpgrade;

type GenericFeature = GenericAchievement | GenericBar | GenericBuyable | GenericChallenge | GenericClickable | GenericMilestone | GenericUpgrade;

/*----====----*/

export type Decorator<Options extends FeatureOptions, Base extends BaseFeature, Generic extends GenericFeature, S extends State = State> = {
    getPersistents?(): Record<string, Persistent<S>>;
    preConstruct?(feature: OptionsObject<Options,Base,Generic>): void;
    postConstruct?(feature: OptionsObject<Options,Base,Generic>): void;
    getGatheredProps?(feature: OptionsObject<Options,Base,Generic>): Partial<OptionsObject<Options,Base,Generic>>
}

/*----====----*/

// #region Effect Decorator
export type EffectFeatureOptions = {
    effect: Computable<any>;
}

export type EffectFeature<T extends EffectFeatureOptions, U extends BaseFeature> = Replace<
    T & U,
    { effect: GetComputableType<T["effect"]>; }
>;

export type GenericEffectFeature<T extends GenericFeature> = T & Replace<
    EffectFeature<EffectFeatureOptions, BaseFeature>,
    { effect: ProcessedComputable<any>; }
>;

export const effectDecorator: Decorator<FeatureOptions & EffectFeatureOptions, BaseFeature, GenericFeature & BaseFeature> = {
    postConstruct(feature) {
        processComputable(feature, "effect");
    }
}
// #endregion

/*----====----*/

// #region Bonus Amount Decorator
export interface BonusFeatureOptions {
    bonusAmount: Computable<DecimalSource>;
}

export type BaseBonusFeature = BaseFeature & {
    totalAmount: Ref<DecimalSource>;
}

export type BonusAmountFeature<T extends BonusFeatureOptions, U extends BaseBonusFeature> = Replace<
    T & U,
    {
        bonusAmount: GetComputableType<T["bonusAmount"]>;
    }
>;

export type GenericBonusFeature<T extends GenericFeature> = Replace<
    T & BonusAmountFeature<BonusFeatureOptions, BaseBonusFeature>,
    {
        bonusAmount: ProcessedComputable<DecimalSource>;
        totalAmount: ProcessedComputable<DecimalSource>;
    }
>;

export const bonusAmountDecorator: Decorator<FeatureOptions & BonusFeatureOptions, BaseBonusFeature & {amount: ProcessedComputable<DecimalSource>}, GenericFeature & BaseBonusFeature & {amount: ProcessedComputable<DecimalSource>}> = {
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

export const bonusCompletionsDecorator: Decorator<FeatureOptions & BonusFeatureOptions, BaseBonusFeature & {completions: ProcessedComputable<DecimalSource>}, GenericFeature & BaseBonusFeature & {completions: ProcessedComputable<DecimalSource>}> = {
    postConstruct(feature) {
        processComputable(feature, "bonusAmount");
        if (feature.totalAmount === undefined) {
            feature.totalAmount = computed(() => Decimal.add(
                unref(feature.completions ?? 0),
                unref(feature.bonusAmount as ProcessedComputable<DecimalSource>)
            ));
        }
    }
}

export const bonusEarnedDecorator: Decorator<FeatureOptions & BonusFeatureOptions, BaseBonusFeature & {earned: ProcessedComputable<boolean>}, GenericFeature & BaseBonusFeature & {earned: ProcessedComputable<boolean>}> = {
    postConstruct(feature) {
        processComputable(feature, "bonusAmount");
        if (feature.totalAmount === undefined) {
            feature.totalAmount = computed(() => unref(feature.earned ?? false)
                ? Decimal.add(unref(feature.bonusAmount as ProcessedComputable<DecimalSource>), 1)
                : unref(feature.bonusAmount as ProcessedComputable<DecimalSource>)
            );
        }
    }
}
// #endregion

/*----====----*/


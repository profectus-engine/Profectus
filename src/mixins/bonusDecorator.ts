import Decimal, { DecimalSource } from "util/bignum";
import { processGetter } from "util/computed";
import { MaybeRefOrGetter, Ref, computed, unref } from "vue";

/** Allows the addition of "bonus levels" to a feature, with an accompanying "total amount". */
export function bonusAmountMixin(
    feature: { amount: Ref<DecimalSource> },
    bonusAmount: MaybeRefOrGetter<DecimalSource>
) {
    const processedBonusAmount = processGetter(bonusAmount);
    return {
        bonusAmount,
        totalAmount: computed(() => Decimal.add(unref(feature.amount), unref(processedBonusAmount)))
    };
}

/** Allows the addition of "bonus completions" to a feature, with an accompanying "total completions". */
export function bonusCompletionsMixin(
    feature: { completions: Ref<DecimalSource> },
    bonusCompletions: MaybeRefOrGetter<DecimalSource>
) {
    const processedBonusCompletions = processGetter(bonusCompletions);
    return {
        bonusCompletions,
        totalCompletions: computed(() =>
            Decimal.add(unref(feature.completions), unref(processedBonusCompletions))
        )
    };
}

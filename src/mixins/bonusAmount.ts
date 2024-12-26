import Decimal, { DecimalSource } from "util/bignum";
import { processGetter } from "util/computed";
import { MaybeRefOrGetter, Ref, computed, unref } from "vue";

/** Allows the addition of "bonus levels" to a feature, with an accompanying "total amount". */
export function bonusAmountMixin(
    baseAmount: Ref<DecimalSource>,
    bonusAmount: MaybeRefOrGetter<DecimalSource>
) {
    const processedBonusAmount = processGetter(bonusAmount);
    return {
        bonusAmount: processedBonusAmount,
        totalAmount: computed(() => Decimal.add(unref(baseAmount), unref(processedBonusAmount)))
    };
}

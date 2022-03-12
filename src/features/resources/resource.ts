import Decimal, { DecimalSource, format, formatWhole } from "util/bignum";
import { computed, ComputedRef, isRef, ref, Ref, watch } from "vue";
import { globalBus } from "game/events";
import { State, persistent } from "game/persistence";

export interface Resource<T = DecimalSource> extends Ref<T> {
    displayName: string;
    precision: number;
    small?: boolean;
}

export function createResource<T extends State>(
    defaultValue: T | Ref<T>,
    displayName = "points",
    precision = 0,
    small = undefined
): Resource<T> {
    const resource: Partial<Resource<T>> = isRef(defaultValue)
        ? defaultValue
        : persistent(defaultValue);
    resource.displayName = displayName;
    resource.precision = precision;
    resource.small = small;
    return resource as Resource<T>;
}

export function trackBest(resource: Resource): Ref<DecimalSource> {
    const best = persistent(resource.value);
    watch(resource, amount => {
        if (Decimal.gt(amount, best.value)) {
            best.value = amount;
        }
    });
    return best;
}

export function trackTotal(resource: Resource): Ref<DecimalSource> {
    const total = persistent(resource.value);
    watch(resource, (amount, prevAmount) => {
        if (Decimal.gt(amount, prevAmount)) {
            total.value = Decimal.add(total.value, Decimal.sub(amount, prevAmount));
        }
    });
    return total;
}

const tetra8 = new Decimal("10^^8");
const e100 = new Decimal("1e100");
export function trackOOMPS(
    resource: Resource,
    pointGain?: ComputedRef<DecimalSource>
): Ref<string> {
    const oomps = ref<DecimalSource>(0);
    const oompsMag = ref(0);
    const lastPoints = ref<DecimalSource>(0);

    globalBus.on("update", diff => {
        oompsMag.value = 0;
        if (Decimal.lte(resource.value, e100)) {
            lastPoints.value = resource.value;
            return;
        }

        let curr = resource.value;
        let prev = lastPoints.value;
        lastPoints.value = curr;
        if (Decimal.gt(curr, prev)) {
            if (Decimal.gte(curr, tetra8)) {
                curr = Decimal.slog(curr, 1e10);
                prev = Decimal.slog(prev, 1e10);
                oomps.value = curr.sub(prev).div(diff);
                oompsMag.value = -1;
            } else {
                while (
                    Decimal.div(curr, prev).log(10).div(diff).gte("100") &&
                    oompsMag.value <= 5 &&
                    Decimal.gt(prev, 0)
                ) {
                    curr = Decimal.log10(curr);
                    prev = Decimal.log10(prev);
                    oomps.value = curr.sub(prev).div(diff);
                    oompsMag.value++;
                }
            }
        }
    });

    const oompsString = computed(() => {
        if (oompsMag.value === 0) {
            return pointGain
                ? format(pointGain.value, resource.precision, resource.small) +
                      " " +
                      resource.displayName +
                      "/s"
                : "";
        }
        return (
            format(oomps.value) +
            " OOM" +
            (oompsMag.value < 0 ? "^OOM" : "^" + oompsMag.value) +
            "s/sec"
        );
    });
    return oompsString;
}

export function displayResource(resource: Resource, overrideAmount?: DecimalSource): string {
    const amount = overrideAmount ?? resource.value;
    if (Decimal.eq(resource.precision, 0)) {
        return formatWhole(amount);
    }
    return format(amount, resource.precision, resource.small);
}

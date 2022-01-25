import { persistent, State } from "@/features/feature";
import Decimal, { DecimalSource, format, formatWhole } from "@/util/bignum";
import { computed, Ref, watch } from "vue";
import { globalBus } from "@/game/events";

export type Resource<T = DecimalSource> = Ref<T> & {
    displayName: string;
    precision: number;
    small: boolean;
};

export function createResource<T extends State>(
    defaultValue: T | Ref<T>,
    displayName = "points",
    precision = 0,
    small = false
): Resource<T> {
    const resource: Partial<Resource<T>> = persistent(defaultValue);
    resource.displayName = displayName;
    resource.precision = precision;
    resource.small = small;
    return resource as Resource<T>;
}

function softcap(value: DecimalSource, cap: DecimalSource, power: DecimalSource = 0.5): Decimal {
    if (Decimal.lte(value, cap)) {
        return new Decimal(value);
    } else {
        return Decimal.pow(value, power).times(Decimal.pow(cap, Decimal.sub(1, power)));
    }
}

export function addSoftcap(
    resource: Resource,
    cap: DecimalSource,
    power: DecimalSource = 0.5
): Resource {
    return {
        ...resource,
        get value() {
            return softcap(resource.value, cap, power);
        }
    };
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

export function trackOOMPS(resource: Resource): Ref<string> {
    let oomps: DecimalSource = 0;
    let oompsMag = 0;
    let lastPoints: DecimalSource = 0;
    globalBus.on("update", diff => {
        if (Decimal.lte(resource.value, 1e100)) {
            lastPoints = resource.value;
            return;
        }

        let curr = resource.value;
        let prev = lastPoints;
        lastPoints = curr;
        if (Decimal.gt(curr, prev)) {
            if (Decimal.gte(curr, "10^^8")) {
                curr = Decimal.slog(curr, 1e10);
                prev = Decimal.slog(prev, 1e10);
                oomps = curr.sub(prev).div(diff);
                oompsMag = -1;
            } else {
                while (
                    Decimal.div(curr, prev).log(10).div(diff).gte("100") &&
                    oompsMag <= 5 &&
                    Decimal.gt(prev, 0)
                ) {
                    curr = Decimal.log10(curr);
                    prev = Decimal.log10(prev);
                    oomps = curr.sub(prev).div(diff);
                    oompsMag++;
                }
            }
        }
    });
    return computed(
        () =>
            format(oomps) +
            " OOM" +
            (oompsMag < 0 ? "^OOM" : oompsMag > 1 ? "^" + oompsMag : "") +
            "s"
    );
}

export function displayResource(resource: Resource, overrideAmount?: DecimalSource): string {
    const amount = overrideAmount == null ? resource.value : overrideAmount;
    if (Decimal.eq(resource.precision, 0)) {
        return formatWhole(amount);
    }
    return format(amount, resource.precision, resource.small);
}

// unref may unwrap a resource too far, so this function properly unwraps it
export function unwrapResource<T extends State>(
    resource: Resource<T> | Ref<Resource<T>>
): Resource<T> {
    console.log(resource);
    if ("displayName" in resource) {
        return resource;
    }
    return resource.value;
}

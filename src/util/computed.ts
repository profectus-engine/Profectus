import { isFunction } from "util/common";
import type { ComputedRef } from "vue";
import { computed } from "vue";

export type MaybeGetter<T> = T | (() => T);

export function processGetter<T>(obj: T): T extends () => infer S ? ComputedRef<S> : T {
    if (isFunction(obj) && obj.length === 0) {
        return computed(obj) as ReturnType<typeof processGetter<T>>;
    }
    return obj as ReturnType<typeof processGetter<T>>;
}

import { computed, Ref } from "vue";
import { isFunction } from "./common";

export const DoNotCache = Symbol("DoNotCache");

export type Computable<T> = T | Ref<T> | (() => T);
export type ProcessedComputable<T> = T | Ref<T>;
export type GetComputableType<T> = T extends { [DoNotCache]: true }
    ? T
    : T extends () => infer S
    ? Ref<S>
    : undefined extends T
    ? undefined
    : T;
export type GetComputableTypeWithDefault<T, S> = undefined extends T
    ? S
    : GetComputableType<NonNullable<T>>;
export type UnwrapComputableType<T> = T extends Ref<infer S> ? S : T extends () => infer S ? S : T;

export type ComputableKeysOf<T> = Pick<
    T,
    {
        [K in keyof T]: T[K] extends Computable<unknown> ? K : never;
    }[keyof T]
>;

// TODO fix the typing of this function, such that casting isn't necessary and can be used to
// detect if a createX function is validly written
export function processComputable<T, S extends keyof ComputableKeysOf<T>>(
    obj: T,
    key: S
): asserts obj is T & { [K in S]: ProcessedComputable<UnwrapComputableType<T[S]>> } {
    const computable = obj[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isFunction(computable) && computable.length === 0 && !(computable as any)[DoNotCache]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        obj[key] = computed(computable.bind(obj));
    }
}

export function convertComputable<T>(obj: Computable<T>): ProcessedComputable<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isFunction(obj) && !(obj as any)[DoNotCache]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        obj = computed(obj);
    }
    return obj as ProcessedComputable<T>;
}

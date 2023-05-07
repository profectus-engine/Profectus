import type { JSXFunction } from "features/feature";
import { isFunction } from "util/common";
import type { ComputedRef, Ref } from "vue";
import { computed } from "vue";

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

export type ProcessedFeature<T, S extends T> = {
    [K in keyof S]: K extends keyof T
        ? T[K] extends Computable<infer R>
            ? S[K] extends () => infer Q
                ? ComputedRef<Q>
                : S[K]
            : S[K]
        : S[K];
};

export type Defaults<T, S> = {
    [K in keyof S]: K extends keyof T ? (T[K] extends undefined ? S[K] : T[K]) : S[K];
};

// TODO fix the typing of this function, such that casting isn't necessary and can be used to
// detect if a createX function is validly written
// export function processComputable<
//     T extends object,
//     S extends keyof {
//         [K in keyof T]: T[K] extends Computable<unknown> ? K : never;
//     },
//     R = T[S]
// >(
//     obj: T,
//     key: S
// ): asserts obj is {
//     [K in keyof T]: K extends keyof S ? S[K] extends ProcessedComputable<UnwrapComputableType<R>> : T[K];
// } {
//     const computable = obj[key];
//     if (
//         isFunction(computable) &&
//         computable.length === 0 &&
//         !(computable as unknown as JSXFunction)[DoNotCache]
//     ) {
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         // @ts-ignore
//         obj[key] = computed(computable.bind(obj));
//     } else if (isFunction(computable)) {
//         obj[key] = computable.bind(obj) as unknown as T[S];
//         (obj[key] as unknown as JSXFunction)[DoNotCache] = true;
//     }
// }

function isJSXFunction(value: unknown): value is JSXFunction {
    return typeof value === "function" && DoNotCache in value && value[DoNotCache] === true;
}

export function convertComputable<T>(
    obj: Computable<NonNullable<T>>,
    thisArg?: object
): typeof obj extends JSXFunction ? typeof obj : ProcessedComputable<T>;
export function convertComputable(obj: undefined, thisArg?: object): undefined;
export function convertComputable<T>(
    obj: Computable<T> | undefined,
    thisArg?: object
): (typeof obj extends JSXFunction ? typeof obj : ProcessedComputable<T>) | undefined;
export function convertComputable<T>(
    obj: Computable<T> | undefined,
    thisArg?: object
) /*: (typeof obj extends JSXFunction ? typeof obj : ProcessedComputable<T>) | undefined*/ {
    if (isFunction(obj) && !isJSXFunction(obj)) {
        if (thisArg != null) {
            obj = obj.bind(thisArg);
        }
        obj = computed(obj);
    }
    return obj;
}

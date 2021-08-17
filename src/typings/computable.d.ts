export type Computable<T> = {
    [K in keyof T]:
        | ((this: T) => T[K])
        | (NonNullable<T[K]> extends (..._: infer A) => infer R ? (this: T, ..._: A) => R : T[K]);
};

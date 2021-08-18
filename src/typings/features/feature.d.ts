import { Computable } from "@/typings/computable";

export type RawFeature<T extends Feature> = Partial<Computable<T>>;

export interface Feature {
    id: string;
    layer: string;
    unlocked: boolean;
    [key: string]: unknown;
}

export interface RawFeatures<T extends Features<S>, S extends Feature, R = RawFeature<S>>
    extends Partial<Omit<Computable<T>, "data">>,
        ThisType<T> {
    layer?: string;
    data: Record<string, R>;
}

export interface Features<T extends Feature> {
    layer: string;
    data: Record<string, T>;
    [key: string]: unknown;
}

export interface GridFeatures<T extends Feature> extends Features<T> {
    rows: number;
    cols: number;
}

export interface RawGridFeatures<T extends GridFeatures<S>, S extends Feature>
    extends RawFeatures<T, S> {
    rows?: number;
    cols?: number;
}

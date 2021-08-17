import { CoercableComponent } from "@/typings/component";
import { Feature, RawFeature } from "./feature";

export interface Subtab extends Feature {
    notify?: boolean;
    prestigeNotify?: boolean;
    glowColor?: string;
    active: boolean;
    unlocked?: boolean;
    embedLayer?: boolean;
    display?: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
    buttonStyle?: Partial<CSSStyleDeclaration>;
}

export interface Microtab extends Feature {
    family: string;
    notify?: boolean;
    prestigeNotify?: boolean;
    glowColor?: string;
    active: boolean;
    embedLayer?: string;
    display?: CoercableComponent;
    style?: Partial<CSSStyleDeclaration>;
}

export type RawMicrotabFamily = Omit<RawFeature<MicrotabFamily>, "data"> & {
    data: Record<string, RawFeature<Microtab>>;
};

export interface MicrotabFamily extends Feature {
    activeMicrotab: Microtab | undefined;
    family: string;
    data: Record<string, Microtab>;
}

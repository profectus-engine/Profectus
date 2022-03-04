import { Position } from "game/layers";
import { InjectionKey, SVGAttributes } from "vue";

export interface LinkNode {
    x?: number;
    y?: number;
    element: HTMLElement;
}

export interface Link extends SVGAttributes {
    startNode: { id: string };
    endNode: { id: string };
    offsetStart?: Position;
    offsetEnd?: Position;
}

export const RegisterLinkNodeInjectionKey: InjectionKey<
    (id: string, element: HTMLElement) => void
> = Symbol("RegisterLinkNode");
export const UnregisterLinkNodeInjectionKey: InjectionKey<(id: string) => void> =
    Symbol("UnregisterLinkNode");

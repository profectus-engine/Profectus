import { Position } from "game/layers";
import { InjectionKey, Ref, SVGAttributes } from "vue";

export interface LinkNode {
    x?: number;
    y?: number;
    rect?: DOMRect;
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
export const NodesInjectionKey: InjectionKey<Ref<Record<string, LinkNode | undefined>>> =
    Symbol("Nodes");

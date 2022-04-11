import LinksComponent from "./Links.vue";
import { Component, OptionsFunc, GatherProps, Replace } from "features/feature";
import { Position } from "game/layers";
import {
    Computable,
    GetComputableType,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { SVGAttributes } from "vue";

export const LinksType = Symbol("Links");

export interface Link extends SVGAttributes {
    startNode: { id: string };
    endNode: { id: string };
    offsetStart?: Position;
    offsetEnd?: Position;
}

export interface LinksOptions {
    links?: Computable<Link[]>;
}

export interface BaseLinks {
    type: typeof LinksType;
    [Component]: typeof LinksComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Links<T extends LinksOptions> = Replace<
    T & BaseLinks,
    {
        links: GetComputableType<T["links"]>;
    }
>;

export type GenericLinks = Replace<
    Links<LinksOptions>,
    {
        links: ProcessedComputable<Link[]>;
    }
>;

export function createLinks<T extends LinksOptions>(
    optionsFunc: OptionsFunc<T, Links<T>, BaseLinks>
): Links<T> {
    return createLazyProxy(() => {
        const links = optionsFunc();
        links.type = LinksType;
        links[Component] = LinksComponent;

        processComputable(links as T, "links");

        links[GatherProps] = function (this: GenericLinks) {
            const { links } = this;
            return {
                links
            };
        };

        return links as unknown as Links<T>;
    });
}

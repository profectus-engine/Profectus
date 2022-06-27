import type { OptionsFunc, Replace } from "features/feature";
import { GatherProps, Component } from "features/feature";
import type { Position } from "game/layers";
import type { Computable, GetComputableType, ProcessedComputable } from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { SVGAttributes } from "vue";
import LinksComponent from "./Links.vue";

export const LinksType = Symbol("Links");

export interface Link extends SVGAttributes {
    startNode: { id: string };
    endNode: { id: string };
    offsetStart?: Position;
    offsetEnd?: Position;
}

export interface LinksOptions {
    links: Computable<Link[]>;
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
    optionsFunc: OptionsFunc<T, BaseLinks, GenericLinks>
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

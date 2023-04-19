import type { GenericComponent, OptionsFunc, Replace } from "features/feature";
import { GatherProps, Component } from "features/feature";
import type { Position } from "game/layers";
import type { Computable, GetComputableType, ProcessedComputable } from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import type { SVGAttributes } from "vue";
import LinksComponent from "./Links.vue";

/** A symbol used to identify {@link Links} features. */
export const LinksType = Symbol("Links");

/** Represents a link between two nodes. It will be displayed as an SVG line, and can take any appropriate properties for an SVG line element. */
export interface Link extends SVGAttributes {
    startNode: { id: string };
    endNode: { id: string };
    offsetStart?: Position;
    offsetEnd?: Position;
}

/** An object that configures a {@link Links}. */
export interface LinksOptions {
    /** The list of links to display. */
    links: Computable<Link[]>;
}

/**
 * The properties that are added onto a processed {@link LinksOptions} to create an {@link Links}.
 */
export interface BaseLinks {
    /** A symbol that helps identify features of the same type. */
    type: typeof LinksType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a list of links between nodes, which are the elements in the DOM for any renderable feature. */
export type Links<T extends LinksOptions> = Replace<
    T & BaseLinks,
    {
        links: GetComputableType<T["links"]>;
    }
>;

/** A type that matches any valid {@link Links} object. */
export type GenericLinks = Replace<
    Links<LinksOptions>,
    {
        links: ProcessedComputable<Link[]>;
    }
>;

/**
 * Lazily creates links with the given options.
 * @param optionsFunc Links options.
 */
export function createLinks<T extends LinksOptions>(
    optionsFunc: OptionsFunc<T, BaseLinks, GenericLinks>
): Links<T> {
    return createLazyProxy(feature => {
        const links = optionsFunc.call(feature, feature);
        links.type = LinksType;
        links[Component] = LinksComponent as GenericComponent;

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

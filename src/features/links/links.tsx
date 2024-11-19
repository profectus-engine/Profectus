import type { OptionsFunc, Replace } from "features/feature";
import type { Position } from "game/layers";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { VueFeature, vueFeatureMixin } from "util/vue";
import type { MaybeRef, MaybeRefOrGetter, SVGAttributes } from "vue";
import Links from "./Links.vue";

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
    links: MaybeRefOrGetter<Link[]>;
}

/**
 * The properties that are added onto a processed {@link LinksOptions} to create an {@link Links}.
 */
export interface BaseLinks extends VueFeature {
    /** A symbol that helps identify features of the same type. */
    type: typeof LinksType;
}

/** An object that represents a list of links between nodes, which are the elements in the DOM for any renderable feature. */
export type Links = Replace<
    Replace<LinksOptions, BaseLinks>,
    {
        links: MaybeRef<Link[]>;
    }
>;

/**
 * Lazily creates links with the given options.
 * @param optionsFunc Links options.
 */
export function createLinks<T extends LinksOptions>(optionsFunc: OptionsFunc<T, BaseLinks, Links>) {
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as Links);
        const { links, ...props } = options;

        const retLinks = {
            type: LinksType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof LinksOptions>),
            ...vueFeatureMixin("links", {}, () => <Links links={retLinks.links} />),
            links: processGetter(links)
        } satisfies Links;

        return retLinks;
    });
}

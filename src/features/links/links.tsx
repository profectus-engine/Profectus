import type { Position } from "game/layers";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { unref, type MaybeRef, type MaybeRefOrGetter, type SVGAttributes } from "vue";
import Links from "./Links.vue";

/** A symbol used to identify {@link Links} features. */
export const LinksType = Symbol("Links");

/** Represents a link between two nodes. It will be displayed as an SVG line, and can take any appropriate properties for an SVG line element. */
export interface Link extends /* @vue-ignore */ SVGAttributes {
    startNode: { id: string };
    endNode: { id: string };
    offsetStart?: Position;
    offsetEnd?: Position;
}

/** An object that configures a {@link Links}. */
export interface LinksOptions extends VueFeatureOptions {
    /** The list of links to display. */
    links: MaybeRefOrGetter<Link[]>;
}

/** An object that represents a list of links between nodes, which are the elements in the DOM for any renderable feature. */
export interface Links extends VueFeature {
    /** The list of links to display. */
    links: MaybeRef<Link[]>;
    /** A symbol that helps identify features of the same type. */
    type: typeof LinksType;
}

/**
 * Lazily creates links with the given options.
 * @param optionsFunc Links options.
 */
export function createLinks<T extends LinksOptions>(optionsFunc: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.();
        const { links, style: _style, ...props } = options;

        const style = processGetter(_style);
        options.style = () => ({ position: "static", ...(unref(style) ?? {}) });

        const retLinks = {
            type: LinksType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof LinksOptions>),
            ...vueFeatureMixin("links", options, () => <Links links={retLinks.links} />),
            links: processGetter(links)
        } satisfies Links;

        return retLinks;
    });
}

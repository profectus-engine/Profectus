import Infobox from "features/infoboxes/Infobox.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { CSSProperties, MaybeRef, MaybeRefOrGetter } from "vue";

/** A symbol used to identify {@link Infobox} features. */
export const InfoboxType = Symbol("Infobox");

/**
 * An object that configures an {@link Infobox}.
 */
export interface InfoboxOptions extends VueFeatureOptions {
    /** The background color of the Infobox. Defaults to the layer color. */
    color?: MaybeRefOrGetter<string>;
    /** CSS to apply to the title of the infobox. */
    titleStyle?: MaybeRefOrGetter<CSSProperties>;
    /** CSS to apply to the body of the infobox. */
    bodyStyle?: MaybeRefOrGetter<CSSProperties>;
    /** A header to appear at the top of the display. */
    title: MaybeGetter<Renderable>;
    /** The main text that appears in the display. */
    display: MaybeGetter<Renderable>;
}

/** An object that represents a feature that displays information in a collapsible way. */
export interface Infobox extends VueFeature {
    /** The background color of the Infobox. */
    color?: MaybeRef<string>;
    /** CSS to apply to the title of the infobox. */
    titleStyle?: MaybeRef<CSSProperties>;
    /** CSS to apply to the body of the infobox. */
    bodyStyle?: MaybeRef<CSSProperties>;
    /** A header to appear at the top of the display. */
    title: MaybeGetter<Renderable>;
    /** The main text that appears in the display. */
    display: MaybeGetter<Renderable>;
    /** Whether or not this infobox is collapsed. */
    collapsed: Persistent<boolean>;
    /** A symbol that helps identify features of the same type. */
    type: typeof InfoboxType;
}

/**
 * Lazily creates an infobox with the given options.
 * @param optionsFunc Infobox options.
 */
export function createInfobox<T extends InfoboxOptions>(optionsFunc: () => T) {
    const collapsed = persistent<boolean>(false, false);
    return createLazyProxy(() => {
        const options = optionsFunc();
        const { color, titleStyle, bodyStyle, title, display, ...props } = options;

        const infobox = {
            type: InfoboxType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof InfoboxOptions>),
            ...vueFeatureMixin("infobox", options, () => (
                <Infobox
                    color={infobox.color}
                    titleStyle={infobox.titleStyle}
                    bodyStyle={infobox.bodyStyle}
                    collapsed={infobox.collapsed}
                    title={infobox.title}
                    display={infobox.display}
                />
            )),
            collapsed,
            color: processGetter(color) ?? "--layer-color",
            titleStyle: processGetter(titleStyle),
            bodyStyle: processGetter(bodyStyle),
            title,
            display
        } satisfies Infobox;

        return infobox;
    });
}

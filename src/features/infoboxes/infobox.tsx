import type { OptionsFunc, Replace } from "features/feature";
import Infobox from "features/infoboxes/Infobox.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import { ProcessedRefOrGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { CSSProperties, MaybeRefOrGetter } from "vue";

/** A symbol used to identify {@link Infobox} features. */
export const InfoboxType = Symbol("Infobox");

/**
 * An object that configures an {@link Infobox}.
 */
export interface InfoboxOptions extends VueFeatureOptions {
    /** The background color of the Infobox. */
    color?: MaybeRefOrGetter<string>;
    /** CSS to apply to the title of the infobox. */
    titleStyle?: MaybeRefOrGetter<CSSProperties>;
    /** CSS to apply to the body of the infobox. */
    bodyStyle?: MaybeRefOrGetter<CSSProperties>;
    /** A header to appear at the top of the display. */
    title: MaybeRefOrGetter<Renderable>;
    /** The main text that appears in the display. */
    display: MaybeRefOrGetter<Renderable>;
}

/**
 * The properties that are added onto a processed {@link InfoboxOptions} to create an {@link Infobox}.
 */
export interface BaseInfobox extends VueFeature {
    /** Whether or not this infobox is collapsed. */
    collapsed: Persistent<boolean>;
    /** A symbol that helps identify features of the same type. */
    type: typeof InfoboxType;
}

/** An object that represents a feature that displays information in a collapsible way.  */
export type Infobox = Replace<
    Replace<InfoboxOptions, BaseInfobox>,
    {
        color: ProcessedRefOrGetter<InfoboxOptions["color"]>;
        titleStyle: ProcessedRefOrGetter<InfoboxOptions["titleStyle"]>;
        bodyStyle: ProcessedRefOrGetter<InfoboxOptions["bodyStyle"]>;
        title: ProcessedRefOrGetter<InfoboxOptions["title"]>;
        display: ProcessedRefOrGetter<InfoboxOptions["display"]>;
    }
>;

/**
 * Lazily creates an infobox with the given options.
 * @param optionsFunc Infobox options.
 */
export function createInfobox<T extends InfoboxOptions>(
    optionsFunc: OptionsFunc<T, BaseInfobox, Infobox>
) {
    const collapsed = persistent<boolean>(false, false);
    return createLazyProxy(feature => {
        const options = optionsFunc.call(feature, feature as Infobox);
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
            color: processGetter(color),
            titleStyle: processGetter(titleStyle),
            bodyStyle: processGetter(bodyStyle),
            title: processGetter(title),
            display: processGetter(display)
        } satisfies Infobox;

        return infobox;
    });
}

import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, getUniqueID, setDefault, Visibility } from "features/feature";
import InfoboxComponent from "features/infoboxes/Infobox.vue";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref } from "vue";

/** A symbol used to identify {@link Infobox} features. */
export const InfoboxType = Symbol("Infobox");

/**
 * An object that configures an {@link Infobox}.
 */
export interface InfoboxOptions {
    /** Whether this clickable should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** The background color of the Infobox. */
    color?: Computable<string>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** CSS to apply to the title of the infobox. */
    titleStyle?: Computable<StyleValue>;
    /** CSS to apply to the body of the infobox. */
    bodyStyle?: Computable<StyleValue>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** A header to appear at the top of the display. */
    title: Computable<CoercableComponent>;
    /** The main text that appears in the display. */
    display: Computable<CoercableComponent>;
}

/**
 * The properties that are added onto a processed {@link InfoboxOptions} to create an {@link Infobox}.
 */
export interface BaseInfobox {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** Whether or not this infobox is collapsed. */
    collapsed: Persistent<boolean>;
    /** A symbol that helps identify features of the same type. */
    type: typeof InfoboxType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that displays information in a collapsible way.  */
export type Infobox<T extends InfoboxOptions> = Replace<
    T & BaseInfobox,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        color: GetComputableType<T["color"]>;
        style: GetComputableType<T["style"]>;
        titleStyle: GetComputableType<T["titleStyle"]>;
        bodyStyle: GetComputableType<T["bodyStyle"]>;
        classes: GetComputableType<T["classes"]>;
        title: GetComputableType<T["title"]>;
        display: GetComputableType<T["display"]>;
    }
>;

/** A type that matches any valid {@link Infobox} object. */
export type GenericInfobox = Replace<
    Infobox<InfoboxOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
    }
>;

/**
 * Lazily creates an infobox with the given options.
 * @param optionsFunc Infobox options.
 */
export function createInfobox<T extends InfoboxOptions>(
    optionsFunc: OptionsFunc<T, BaseInfobox, GenericInfobox>
): Infobox<T> {
    const collapsed = persistent<boolean>(false, false);
    return createLazyProxy(feature => {
        const infobox = optionsFunc.call(feature, feature);
        infobox.id = getUniqueID("infobox-");
        infobox.type = InfoboxType;
        infobox[Component] = InfoboxComponent as GenericComponent;

        infobox.collapsed = collapsed;

        processComputable(infobox as T, "visibility");
        setDefault(infobox, "visibility", Visibility.Visible);
        processComputable(infobox as T, "color");
        processComputable(infobox as T, "style");
        processComputable(infobox as T, "titleStyle");
        processComputable(infobox as T, "bodyStyle");
        processComputable(infobox as T, "classes");
        processComputable(infobox as T, "title");
        processComputable(infobox as T, "display");

        infobox[GatherProps] = function (this: GenericInfobox) {
            const {
                visibility,
                display,
                title,
                color,
                collapsed,
                style,
                titleStyle,
                bodyStyle,
                classes,
                id
            } = this;
            return {
                visibility,
                display,
                title,
                color,
                collapsed,
                style: unref(style),
                titleStyle,
                bodyStyle,
                classes,
                id
            };
        };

        return infobox as unknown as Infobox<T>;
    });
}

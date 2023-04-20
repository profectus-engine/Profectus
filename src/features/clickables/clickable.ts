import ClickableComponent from "features/clickables/Clickable.vue";
import { GenericDecorator } from "features/decorators/common";
import type {
    CoercableComponent,
    GenericComponent,
    OptionsFunc,
    Replace,
    StyleValue
} from "features/feature";
import { Component, GatherProps, Visibility, getUniqueID, setDefault } from "features/feature";
import type { BaseLayer } from "game/layers";
import type { Unsubscribe } from "nanoevents";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { computed, unref } from "vue";

/** A symbol used to identify {@link Clickable} features. */
export const ClickableType = Symbol("Clickable");

/**
 * An object that configures a {@link Clickable}.
 */
export interface ClickableOptions {
    /** Whether this clickable should be visible. */
    visibility?: Computable<Visibility | boolean>;
    /** Whether or not the clickable may be clicked. */
    canClick?: Computable<boolean>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** Shows a marker on the corner of the feature. */
    mark?: Computable<boolean | string>;
    /** The display to use for this clickable. */
    display?: Computable<
        | CoercableComponent
        | {
              /** A header to appear at the top of the display. */
              title?: CoercableComponent;
              /** The main text that appears in the display. */
              description: CoercableComponent;
          }
    >;
    /** Toggles a smaller design for the feature. */
    small?: boolean;
    /** A function that is called when the clickable is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the clickable is held down. */
    onHold?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link ClickableOptions} to create an {@link Clickable}.
 */
export interface BaseClickable {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** A symbol that helps identify features of the same type. */
    type: typeof ClickableType;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that can be clicked or held down. */
export type Clickable<T extends ClickableOptions> = Replace<
    T & BaseClickable,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canClick: GetComputableTypeWithDefault<T["canClick"], true>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        display: GetComputableType<T["display"]>;
    }
>;

/** A type that matches any valid {@link Clickable} object. */
export type GenericClickable = Replace<
    Clickable<ClickableOptions>,
    {
        visibility: ProcessedComputable<Visibility | boolean>;
        canClick: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates a clickable with the given options.
 * @param optionsFunc Clickable options.
 */
export function createClickable<T extends ClickableOptions>(
    optionsFunc?: OptionsFunc<T, BaseClickable, GenericClickable>,
    ...decorators: GenericDecorator[]
): Clickable<T> {
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const clickable =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        clickable.id = getUniqueID("clickable-");
        clickable.type = ClickableType;
        clickable[Component] = ClickableComponent as GenericComponent;

        for (const decorator of decorators) {
            decorator.preConstruct?.(clickable);
        }

        Object.assign(clickable, decoratedData);

        processComputable(clickable as T, "visibility");
        setDefault(clickable, "visibility", Visibility.Visible);
        processComputable(clickable as T, "canClick");
        setDefault(clickable, "canClick", true);
        processComputable(clickable as T, "classes");
        processComputable(clickable as T, "style");
        processComputable(clickable as T, "mark");
        processComputable(clickable as T, "display");

        if (clickable.onClick) {
            const onClick = clickable.onClick.bind(clickable);
            clickable.onClick = function (e) {
                if (unref(clickable.canClick) !== false) {
                    onClick(e);
                }
            };
        }
        if (clickable.onHold) {
            const onHold = clickable.onHold.bind(clickable);
            clickable.onHold = function () {
                if (unref(clickable.canClick) !== false) {
                    onHold();
                }
            };
        }

        for (const decorator of decorators) {
            decorator.postConstruct?.(clickable);
        }

        const decoratedProps = decorators.reduce(
            (current, next) => Object.assign(current, next.getGatheredProps?.(clickable)),
            {}
        );
        clickable[GatherProps] = function (this: GenericClickable) {
            const {
                display,
                visibility,
                style,
                classes,
                onClick,
                onHold,
                canClick,
                small,
                mark,
                id
            } = this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                onClick,
                onHold,
                canClick,
                small,
                mark,
                id,
                ...decoratedProps
            };
        };

        return clickable as unknown as Clickable<T>;
    });
}

/**
 * Utility to auto click a clickable whenever it can be.
 * @param layer The layer the clickable is apart of
 * @param clickable The clicker to click automatically
 * @param autoActive Whether or not the clickable should currently be auto-clicking
 */
export function setupAutoClick(
    layer: BaseLayer,
    clickable: GenericClickable,
    autoActive: Computable<boolean> = true
): Unsubscribe {
    const isActive: ProcessedComputable<boolean> =
        typeof autoActive === "function" ? computed(autoActive) : autoActive;
    return layer.on("update", () => {
        if (unref(isActive) && unref(clickable.canClick)) {
            clickable.onClick?.();
        }
    });
}

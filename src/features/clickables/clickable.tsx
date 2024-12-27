import Clickable from "features/clickables/Clickable.vue";
import type { BaseLayer } from "game/layers";
import type { Unsubscribe } from "nanoevents";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import {
    isJSXElement,
    render,
    Renderable,
    VueFeature,
    vueFeatureMixin,
    VueFeatureOptions
} from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, unref } from "vue";

/** A symbol used to identify {@link Clickable} features. */
export const ClickableType = Symbol("Clickable");

/**
 * An object that configures a {@link Clickable}.
 */
export interface ClickableOptions extends VueFeatureOptions {
    /** Whether or not the clickable may be clicked. */
    canClick?: MaybeRefOrGetter<boolean>;
    /** The display to use for this clickable. */
    display?:
        | MaybeGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeGetter<Renderable>;
          };
    /** A function that is called when the clickable is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the clickable is held down. */
    onHold?: VoidFunction;
}

/** An object that represents a feature that can be clicked or held down. */
export interface Clickable extends VueFeature {
    /** A function that is called when the clickable is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the clickable is held down. */
    onHold?: VoidFunction;
    /** Whether or not the clickable may be clicked. */
    canClick: MaybeRef<boolean>;
    /** The display to use for this clickable. */
    display?: MaybeGetter<Renderable>;
    /** A symbol that helps identify features of the same type. */
    type: typeof ClickableType;
}

/**
 * Lazily creates a clickable with the given options.
 * @param optionsFunc Clickable options.
 */
export function createClickable<T extends ClickableOptions>(optionsFunc?: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { canClick, display: _display, onClick: onClick, onHold: onHold, ...props } = options;

        let display: MaybeGetter<Renderable> | undefined = undefined;
        if (typeof _display === "object" && !isJSXElement(_display)) {
            display = () => (
                <span>
                    {_display.title != null ? (
                        <div>
                            {render(_display.title, el => (
                                <h3>{el}</h3>
                            ))}
                        </div>
                    ) : null}
                    {render(_display.description, el => (
                        <div>{el}</div>
                    ))}
                </span>
            );
        } else if (_display != null) {
            display = _display;
        }

        const clickable = {
            type: ClickableType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof ClickableOptions>),
            ...vueFeatureMixin("clickable", options, () => (
                <Clickable
                    canClick={clickable.canClick}
                    onClick={clickable.onClick}
                    onHold={clickable.onClick}
                    display={clickable.display}
                />
            )),
            canClick: processGetter(canClick) ?? true,
            display,
            onClick:
                onClick == null
                    ? undefined
                    : function (e?: MouseEvent | TouchEvent) {
                          if (unref(clickable.canClick) !== false) {
                              onClick.call(clickable, e);
                          }
                      },
            onHold:
                onHold == null
                    ? undefined
                    : function () {
                          if (unref(clickable.canClick) !== false) {
                              onHold.call(clickable);
                          }
                      }
        } satisfies Clickable;

        return clickable;
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
    clickable: Clickable,
    autoActive: MaybeRefOrGetter<boolean> = true
): Unsubscribe {
    const isActive: MaybeRef<boolean> =
        typeof autoActive === "function" ? computed(autoActive) : autoActive;
    return layer.on("update", () => {
        if (unref(isActive) && unref<boolean>(clickable.canClick)) {
            clickable.onClick?.();
        }
    });
}

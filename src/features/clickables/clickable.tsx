import Clickable from "features/clickables/Clickable.vue";
import type { OptionsFunc, Replace } from "features/feature";
import type { BaseLayer } from "game/layers";
import type { Unsubscribe } from "nanoevents";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { render, Renderable, VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
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
        | MaybeRefOrGetter<Renderable>
        | {
              /** A header to appear at the top of the display. */
              title?: MaybeRefOrGetter<Renderable>;
              /** The main text that appears in the display. */
              description: MaybeRefOrGetter<Renderable>;
          };
    /** A function that is called when the clickable is clicked. */
    onClick?: (e?: MouseEvent | TouchEvent) => void;
    /** A function that is called when the clickable is held down. */
    onHold?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link ClickableOptions} to create an {@link Clickable}.
 */
export interface BaseClickable extends VueFeature {
    /** A symbol that helps identify features of the same type. */
    type: typeof ClickableType;
}

/** An object that represents a feature that can be clicked or held down. */
export type Clickable = Replace<
    Replace<ClickableOptions, BaseClickable>,
    {
        canClick: MaybeRef<boolean>;
        display?: MaybeRef<Renderable>;
    }
>;

/**
 * Lazily creates a clickable with the given options.
 * @param optionsFunc Clickable options.
 */
export function createClickable<T extends ClickableOptions>(
    optionsFunc?: OptionsFunc<T, BaseClickable, Clickable>
) {
    return createLazyProxy(feature => {
        const options = optionsFunc?.call(feature, feature as Clickable) ?? ({} as T);
        const { canClick, display: _display, onClick: onClick, onHold: onHold, ...props } = options;

        let display: MaybeRef<Renderable> | undefined = undefined;
        if (typeof _display === "object" && "description" in _display) {
            const title = processGetter(_display.title);
            const description = processGetter(_display.description);

            const Title = () => (title == null ? <></> : render(title, el => <h3>{el}</h3>));
            const Description = () => render(description, el => <div>{el}</div>);

            display = computed(() => (
                <span>
                    {title != null ? (
                        <div>
                            <Title />
                        </div>
                    ) : null}
                    <Description />
                </span>
            ));
        } else if (_display != null) {
            display = processGetter(_display);
        }

        const clickable = {
            type: ClickableType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof ClickableOptions>),
            ...vueFeatureMixin("clickable", options, () => (
                <Clickable
                    canClick={clickable.canClick}
                    onClick={clickable.onClick}
                    display={clickable.display}
                />
            )),
            canClick: processGetter(canClick) ?? true,
            display,
            onClick:
                onClick == null
                    ? undefined
                    : function (e) {
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
        } satisfies Clickable & { onClick: T["onClick"] };

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

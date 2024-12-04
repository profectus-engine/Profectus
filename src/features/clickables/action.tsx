import ClickableVue from "features/clickables/Clickable.vue";
import { findFeatures } from "features/feature";
import { globalBus } from "game/events";
import { persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { Unsubscribe } from "nanoevents";
import { Direction } from "util/common";
import { processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { render, Renderable, VueFeature, vueFeatureMixin } from "util/vue";
import { computed, MaybeRef, MaybeRefOrGetter, Ref, ref, unref } from "vue";
import { JSX } from "vue/jsx-runtime";
import { Bar, BarOptions, createBar } from "../bars/bar";
import { type Clickable, ClickableOptions } from "./clickable";

/** A symbol used to identify {@link Action} features. */
export const ActionType = Symbol("Action");

/**
 * An object that configures an {@link Action}.
 */
export interface ActionOptions extends Omit<ClickableOptions, "onClick" | "onHold"> {
    /** The cooldown during which the action cannot be performed again, in seconds. */
    duration: MaybeRefOrGetter<DecimalSource>;
    /** Whether or not the action should perform automatically when the cooldown is finished. */
    autoStart?: MaybeRefOrGetter<boolean>;
    /** A function that is called when the action is clicked. */
    onClick: (amount: DecimalSource) => void;
    /** A pass-through to the {@link Bar} used to display the cooldown progress for the action. */
    barOptions?: Partial<BarOptions>;
}

/** An object that represents a feature that can be clicked upon, and then has a cooldown before it can be clicked again. */
export interface Action extends VueFeature {
    /** The cooldown during which the action cannot be performed again, in seconds. */
    duration: MaybeRef<DecimalSource>;
    /** Whether or not the action should perform automatically when the cooldown is finished. */
    autoStart: MaybeRef<boolean>;
    /** Whether or not the action may be performed. */
    canClick: MaybeRef<boolean>;
    /** The display to use for this action. */
    display?: MaybeRef<Renderable>;
    /** A function that is called when the action is clicked. */
    onClick: (amount: DecimalSource) => void;
    /** Whether or not the player is holding down the action. Actions will be considered clicked as soon as the cooldown completes when being held down. */
    isHolding: Ref<boolean>;
    /** The current amount of progress through the cooldown. */
    progress: Ref<DecimalSource>;
    /** The bar used to display the current cooldown progress. */
    progressBar: Bar;
    /** Update the cooldown the specified number of seconds */
    update: (diff: number) => void;
    /** A symbol that helps identify features of the same type. */
    type: typeof ActionType;
}

/**
 * Lazily creates an action with the given options.
 * @param optionsFunc Action options.
 */
export function createAction<T extends ActionOptions>(optionsFunc?: () => T) {
    const progress = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { style, duration, canClick, autoStart, display, barOptions, onClick, ...props } =
            options;

        const processedCanClick = processGetter(canClick) ?? true;
        const processedStyle = processGetter(style);

        const progressBar = createBar(() => ({
            direction: Direction.Right,
            width: 100,
            height: 10,
            borderStyle: { borderColor: "black" },
            baseStyle: { marginTop: "-1px" },
            progress: (): DecimalSource => Decimal.div(progress.value, unref(action.duration)),
            ...(barOptions as Omit<typeof barOptions, keyof VueFeature>)
        }));

        let Component: () => JSX.Element;
        if (typeof display === "object" && "description" in display) {
            const title = processGetter(display.title);
            const description = processGetter(display.description);

            const Title = () => (title == null ? <></> : render(title, el => <h3>{el}</h3>));
            const Description = () => render(description, el => <div>{el}</div>);

            Component = () => {
                return (
                    <span>
                        {title != null ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                    </span>
                );
            };
        } else if (display != null) {
            const processedDisplay = processGetter(display);
            Component = () => render(processedDisplay);
        }

        const action = {
            type: ActionType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof ActionOptions>),
            ...vueFeatureMixin(
                "action",
                {
                    ...options,
                    style: () => ({
                        cursor: Decimal.gte(progress.value, unref(action.duration))
                            ? "pointer"
                            : "progress",
                        display: "flex",
                        flexDirection: "column",
                        ...unref(processedStyle)
                    })
                },
                () => (
                    <ClickableVue
                        canClick={action.canClick}
                        onClick={action.onClick}
                        display={action.display}
                    />
                )
            ),
            progress,
            isHolding: ref(false),
            duration: processGetter(duration),
            canClick: computed(
                (): boolean =>
                    unref(processedCanClick) && Decimal.gte(progress.value, unref(action.duration))
            ),
            autoStart: processGetter(autoStart) ?? false,
            display: computed(() => (
                <>
                    <div style="flex-grow: 1" />
                    {display == null ? null : <Component />}
                    <div style="flex-grow: 1" />
                    {render(progressBar)}
                </>
            )),
            progressBar,
            onClick: function () {
                if (unref(action.canClick) === false) {
                    return;
                }
                const amount = Decimal.div(progress.value, unref(action.duration));
                onClick?.call(action, amount);
                progress.value = 0;
            },
            update: function (diff) {
                const duration = unref(action.duration);
                if (Decimal.gte(progress.value, duration)) {
                    progress.value = duration;
                } else {
                    progress.value = Decimal.add(progress.value, diff);
                    if (action.isHolding.value || unref<boolean>(action.autoStart)) {
                        action.onClick();
                    }
                }
            }
        } satisfies Action satisfies Omit<Clickable, "type"> & { type: typeof ActionType };

        return action;
    });
}

const listeners: Record<string, Unsubscribe | undefined> = {};
globalBus.on("addLayer", layer => {
    const actions: Action[] = findFeatures(layer, ActionType) as Action[];
    listeners[layer.id] = layer.on("postUpdate", (diff: number) => {
        actions.forEach(action => action.update(diff));
    });
});
globalBus.on("removeLayer", layer => {
    // unsubscribe from postUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});

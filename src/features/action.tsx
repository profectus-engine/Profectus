import { isArray } from "@vue/shared";
import ClickableComponent from "features/clickables/Clickable.vue";
import {
    Component,
    findFeatures,
    GatherProps,
    GenericComponent,
    getUniqueID,
    jsx,
    JSXFunction,
    OptionsFunc,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import { globalBus } from "game/events";
import { persistent } from "game/persistence";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { Unsubscribe } from "nanoevents";
import { Direction } from "util/common";
import type {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    ProcessedComputable
} from "util/computed";
import { processComputable } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent, render } from "util/vue";
import { computed, Ref, ref, unref } from "vue";
import { BarOptions, createBar, GenericBar } from "./bars/bar";
import { ClickableOptions } from "./clickables/clickable";
import { Decorator, GenericDecorator } from "./decorators/common";

/** A symbol used to identify {@link Action} features. */
export const ActionType = Symbol("Action");

/**
 * An object that configures an {@link Action}.
 */
export interface ActionOptions extends Omit<ClickableOptions, "onClick" | "onHold"> {
    /** The cooldown during which the action cannot be performed again, in seconds. */
    duration: Computable<DecimalSource>;
    /** Whether or not the action should perform automatically when the cooldown is finished. */
    autoStart?: Computable<boolean>;
    /** A function that is called when the action is clicked. */
    onClick: (amount: DecimalSource) => void;
    /** A pass-through to the {@link Bar} used to display the cooldown progress for the action. */
    barOptions?: Partial<BarOptions>;
}

/**
 * The properties that are added onto a processed {@link ActionOptions} to create an {@link Action}.
 */
export interface BaseAction {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** A symbol that helps identify features of the same type. */
    type: typeof ActionType;
    /** Whether or not the player is holding down the action. Actions will be considered clicked as soon as the cooldown completes when being held down. */
    isHolding: Ref<boolean>;
    /** The current amount of progress through the cooldown. */
    progress: Ref<DecimalSource>;
    /** The bar used to display the current cooldown progress. */
    progressBar: GenericBar;
    /** Update the cooldown the specified number of seconds */
    update: (diff: number) => void;
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/** An object that represents a feature that can be clicked upon, and then has a cooldown before it can be clicked again. */
export type Action<T extends ActionOptions> = Replace<
    T & BaseAction,
    {
        duration: GetComputableType<T["duration"]>;
        autoStart: GetComputableTypeWithDefault<T["autoStart"], false>;
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        canClick: GetComputableTypeWithDefault<T["canClick"], true>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        display: JSXFunction;
        onClick: VoidFunction;
    }
>;

/** A type that matches any valid {@link Action} object. */
export type GenericAction = Replace<
    Action<ActionOptions>,
    {
        autoStart: ProcessedComputable<boolean>;
        visibility: ProcessedComputable<Visibility | boolean>;
        canClick: ProcessedComputable<boolean>;
    }
>;

/**
 * Lazily creates an action with the given options.
 * @param optionsFunc Action options.
 */
export function createAction<T extends ActionOptions>(
    optionsFunc?: OptionsFunc<T, BaseAction, GenericAction>,
    ...decorators: GenericDecorator[]
): Action<T> {
    const progress = persistent<DecimalSource>(0);
    const decoratedData = decorators.reduce(
        (current, next) => Object.assign(current, next.getPersistentData?.()),
        {}
    );
    return createLazyProxy(feature => {
        const action =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        action.id = getUniqueID("action-");
        action.type = ActionType;
        action[Component] = ClickableComponent as GenericComponent;

        // Required because of display changing types
        const genericAction = action as unknown as GenericAction;

        for (const decorator of decorators) {
            decorator.preConstruct?.(action);
        }

        action.isHolding = ref(false);
        action.progress = progress;
        Object.assign(action, decoratedData);

        processComputable(action as T, "visibility");
        setDefault(action, "visibility", Visibility.Visible);
        processComputable(action as T, "duration");
        processComputable(action as T, "autoStart");
        setDefault(action, "autoStart", false);
        processComputable(action as T, "canClick");
        setDefault(action, "canClick", true);
        processComputable(action as T, "classes");
        processComputable(action as T, "style");
        processComputable(action as T, "mark");
        processComputable(action as T, "display");

        const style = action.style as ProcessedComputable<StyleValue | undefined>;
        action.style = computed(() => {
            const currStyle: StyleValue[] = [
                {
                    cursor: Decimal.gte(
                        progress.value,
                        unref(action.duration as ProcessedComputable<DecimalSource>)
                    )
                        ? "pointer"
                        : "progress",
                    display: "flex",
                    flexDirection: "column"
                }
            ];
            const originalStyle = unref(style);
            if (isArray(originalStyle)) {
                currStyle.push(...originalStyle);
            } else if (originalStyle != null) {
                currStyle.push(originalStyle);
            }
            return currStyle as StyleValue;
        });

        action.progressBar = createBar(() => ({
            direction: Direction.Right,
            width: 100,
            height: 10,
            style: "margin-top: 8px",
            borderStyle: "border-color: black",
            baseStyle: "margin-top: -1px",
            progress: () => Decimal.div(progress.value, unref(genericAction.duration)),
            ...action.barOptions
        }));

        const canClick = action.canClick as ProcessedComputable<boolean>;
        action.canClick = computed(
            () =>
                unref(canClick) &&
                Decimal.gte(
                    progress.value,
                    unref(action.duration as ProcessedComputable<DecimalSource>)
                )
        );

        const display = action.display as GetComputableType<ClickableOptions["display"]>;
        action.display = jsx(() => {
            const currDisplay = unref(display);
            let Comp: GenericComponent | undefined;
            if (isCoercableComponent(currDisplay)) {
                Comp = coerceComponent(currDisplay);
            } else if (currDisplay != null) {
                const Title = coerceComponent(currDisplay.title ?? "", "h3");
                const Description = coerceComponent(currDisplay.description, "div");
                Comp = coerceComponent(
                    jsx(() => (
                        <span>
                            {currDisplay.title != null ? (
                                <div>
                                    <Title />
                                </div>
                            ) : null}
                            <Description />
                        </span>
                    ))
                );
            }
            return (
                <>
                    <div style="flex-grow: 1" />
                    {Comp == null ? null : <Comp />}
                    <div style="flex-grow: 1" />
                    {render(genericAction.progressBar)}
                </>
            );
        });

        const onClick = action.onClick.bind(action);
        action.onClick = function () {
            if (unref(action.canClick) === false) {
                return;
            }
            const amount = Decimal.div(progress.value, unref(genericAction.duration));
            onClick?.(amount);
            progress.value = 0;
        };

        action.update = function (diff) {
            const duration = unref(genericAction.duration);
            if (Decimal.gte(progress.value, duration)) {
                progress.value = duration;
            } else {
                progress.value = Decimal.add(progress.value, diff);
                if (genericAction.isHolding.value || unref(genericAction.autoStart)) {
                    genericAction.onClick();
                }
            }
        };

        for (const decorator of decorators) {
            decorator.postConstruct?.(action);
        }

        const decoratedProps = decorators.reduce((current, next) =>
            Object.assign(current, next.getGatheredProps?.(action))
        );
        action[GatherProps] = function (this: GenericAction) {
            const {
                display,
                visibility,
                style,
                classes,
                onClick,
                isHolding,
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
                isHolding,
                canClick,
                small,
                mark,
                id,
                ...decoratedProps
            };
        };

        return action as unknown as Action<T>;
    });
}

const listeners: Record<string, Unsubscribe | undefined> = {};
globalBus.on("addLayer", layer => {
    const actions: GenericAction[] = findFeatures(layer, ActionType) as GenericAction[];
    listeners[layer.id] = layer.on("postUpdate", diff => {
        actions.forEach(action => action.update(diff));
    });
});
globalBus.on("removeLayer", layer => {
    // unsubscribe from postUpdate
    listeners[layer.id]?.();
    listeners[layer.id] = undefined;
});

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

export const ActionType = Symbol("Action");

export interface ActionOptions extends Omit<ClickableOptions, "onClick" | "onHold"> {
    duration: Computable<DecimalSource>;
    autoStart?: Computable<boolean>;
    onClick: (amount: DecimalSource) => void;
    barOptions?: Partial<BarOptions>;
}

export interface BaseAction {
    id: string;
    type: typeof ActionType;
    isHolding: Ref<boolean>;
    progress: Ref<DecimalSource>;
    progressBar: GenericBar;
    update: (diff: number) => void;
    [Component]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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

export type GenericAction = Replace<
    Action<ActionOptions>,
    {
        autoStart: ProcessedComputable<boolean>;
        visibility: ProcessedComputable<Visibility | boolean>;
        canClick: ProcessedComputable<boolean>;
    }
>;

export function createAction<T extends ActionOptions>(
    optionsFunc?: OptionsFunc<T, BaseAction, GenericAction>
): Action<T> {
    const progress = persistent<DecimalSource>(0);
    return createLazyProxy(() => {
        const action = optionsFunc?.() ?? ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        action.id = getUniqueID("action-");
        action.type = ActionType;
        action[Component] = ClickableComponent as GenericComponent;

        // Required because of display changing types
        const genericAction = action as unknown as GenericAction;

        action.isHolding = ref(false);
        action.progress = progress;

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
                id
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

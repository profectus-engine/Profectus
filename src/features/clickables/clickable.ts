import ClickableComponent from "features/clickables/Clickable.vue";
import {
    CoercableComponent,
    Component,
    GatherProps,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { unref } from "vue";

export const ClickableType = Symbol("Clickable");

export interface ClickableOptions {
    visibility?: Computable<Visibility>;
    canClick?: Computable<boolean>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    display?: Computable<
        | CoercableComponent
        | {
              title?: CoercableComponent;
              description: CoercableComponent;
          }
    >;
    small?: boolean;
    onClick?: VoidFunction;
    onHold?: VoidFunction;
}

interface BaseClickable {
    id: string;
    type: typeof ClickableType;
    [Component]: typeof ClickableComponent;
    [GatherProps]: () => Record<string, unknown>;
}

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

export type GenericClickable = Replace<
    Clickable<ClickableOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canClick: ProcessedComputable<boolean>;
    }
>;

export function createClickable<T extends ClickableOptions>(
    optionsFunc: () => T & ThisType<Clickable<T>>
): Clickable<T> {
    return createLazyProxy(() => {
        const clickable: T & Partial<BaseClickable> = optionsFunc();
        clickable.id = getUniqueID("clickable-");
        clickable.type = ClickableType;
        clickable[Component] = ClickableComponent;

        processComputable(clickable as T, "visibility");
        setDefault(clickable, "visibility", Visibility.Visible);
        processComputable(clickable as T, "canClick");
        setDefault(clickable, "canClick", true);
        processComputable(clickable as T, "classes");
        processComputable(clickable as T, "style");
        processComputable(clickable as T, "mark");
        processComputable(clickable as T, "display");

        if (clickable.onClick) {
            const onClick = clickable.onClick;
            clickable.onClick = function () {
                if (unref(clickable.canClick)) {
                    onClick();
                }
            };
        }
        if (clickable.onHold) {
            const onHold = clickable.onHold;
            clickable.onHold = function () {
                if (unref(clickable.canClick)) {
                    onHold();
                }
            };
        }

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
                style,
                classes,
                onClick,
                onHold,
                canClick,
                small,
                mark,
                id
            };
        };

        return clickable as unknown as Clickable<T>;
    });
}

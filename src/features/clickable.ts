import ClickableComponent from "@/components/features/Clickable.vue";
import {
    CoercableComponent,
    Component,
    getUniqueID,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "@/features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "@/util/computed";
import { createProxy } from "@/util/proxies";

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
    options: T & ThisType<Clickable<T>>
): Clickable<T> {
    const clickable: T & Partial<BaseClickable> = options;
    clickable.id = getUniqueID("clickable-");
    clickable.type = ClickableType;
    clickable[Component] = ClickableComponent;

    processComputable(clickable as T, "visibility");
    setDefault(clickable, "visibility", Visibility.Visible);
    processComputable(clickable as T, "canClick");
    processComputable(clickable as T, "classes");
    processComputable(clickable as T, "style");
    processComputable(clickable as T, "mark");
    processComputable(clickable as T, "display");

    const proxy = createProxy((clickable as unknown) as Clickable<T>);
    return proxy;
}

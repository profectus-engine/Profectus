import Col from "@/components/system/Column.vue";
import Row from "@/components/system/Row.vue";
import {
    CoercableComponent,
    Component as ComponentKey,
    GenericComponent
} from "@/features/feature";
import { isArray } from "@vue/shared";
import {
    Component,
    computed,
    ComputedRef,
    DefineComponent,
    defineComponent,
    h,
    PropType,
    ref,
    Ref,
    unref,
    WritableComputedRef
} from "vue";
import { ProcessedComputable } from "./computed";

export function coerceComponent(component: CoercableComponent, defaultWrapper = "span"): Component {
    if (typeof component === "string") {
        component = component.trim();
        if (component.charAt(0) !== "<") {
            component = `<${defaultWrapper}>${component}</${defaultWrapper}>`;
        }

        return defineComponent({ template: component });
    }
    return component;
}

export function render(object: { [ComponentKey]: GenericComponent }): DefineComponent {
    return defineComponent({
        render() {
            const component = object[ComponentKey];
            return h(component, object);
        }
    });
}

export function renderRow(
    objects: { [ComponentKey]: GenericComponent }[],
    props: Record<string, unknown> | null = null
): DefineComponent {
    return defineComponent({
        render() {
            return h(
                Row as DefineComponent,
                props,
                objects.map(obj => h(obj[ComponentKey], obj))
            );
        }
    });
}

export function renderCol(
    objects: { [ComponentKey]: GenericComponent }[],
    props: Record<string, unknown> | null = null
): DefineComponent {
    return defineComponent({
        render() {
            return h(
                Col as DefineComponent,
                props,
                objects.map(obj => h(obj[ComponentKey], obj))
            );
        }
    });
}

export function isCoercableComponent(component: unknown): component is CoercableComponent {
    if (typeof component === "string") {
        return true;
    } else if (typeof component === "object") {
        if (component == null) {
            return false;
        }
        return "render" in component || "component" in component;
    }
    return false;
}

export function setupHoldToClick(
    onClick?: Ref<VoidFunction | undefined>,
    onHold?: Ref<VoidFunction | undefined>
): {
    start: VoidFunction;
    stop: VoidFunction;
    handleHolding: VoidFunction;
} {
    const interval = ref<null | number>(null);

    function start() {
        if (!interval.value) {
            interval.value = setInterval(handleHolding, 250);
        }
    }
    function stop() {
        if (interval.value) {
            clearInterval(interval.value);
            interval.value = null;
        }
    }
    function handleHolding() {
        if (onHold && onHold.value) {
            onHold.value();
        } else if (onClick && onClick.value) {
            onClick.value();
        }
    }

    return { start, stop, handleHolding };
}

export function computeComponent(
    component: Ref<ProcessedComputable<CoercableComponent>>
): ComputedRef<Component> {
    return computed(() => {
        return coerceComponent(unref(unref<ProcessedComputable<CoercableComponent>>(component)));
    });
}
export function computeOptionalComponent(
    component: Ref<ProcessedComputable<CoercableComponent | undefined> | undefined>
): ComputedRef<Component | undefined> {
    return computed(() => {
        let currComponent = unref<ProcessedComputable<CoercableComponent | undefined> | undefined>(
            component
        );
        if (currComponent == null) return;
        currComponent = unref(currComponent);
        return currComponent == null ? undefined : coerceComponent(currComponent);
    });
}

export function wrapRef<T>(ref: Ref<ProcessedComputable<T>>): ComputedRef<T> {
    return computed(() => unwrapRef(ref));
}

export function unwrapRef<T>(ref: Ref<ProcessedComputable<T>>): T {
    return unref(unref<ProcessedComputable<T>>(ref));
}

type PropTypes =
    | typeof Boolean
    | typeof String
    | typeof Number
    | typeof Function
    | typeof Object
    | typeof Array;
// TODO Unfortunately, the typescript engine gives up on typing completely when you use this method,
// Even though it has the same typing as when doing it manually
export function processedPropType<T>(...types: PropTypes[]): PropType<ProcessedComputable<T>> {
    if (!types.includes(Object)) {
        types.push(Object);
    }
    return types as PropType<ProcessedComputable<T>>;
}

import Col from "@/components/system/Column.vue";
import Row from "@/components/system/Row.vue";
import {
    CoercableComponent,
    Component as ComponentKey,
    GenericComponent
} from "@/features/feature";
import { Component, DefineComponent, defineComponent, h, reactive, Ref } from "vue";

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
    const state = reactive<{
        interval: null | number;
        time: number;
    }>({
        interval: null,
        time: 0
    });

    function start() {
        if (!state.interval) {
            state.interval = setInterval(handleHolding, 250);
        }
    }
    function stop() {
        if (state.interval) {
            clearInterval(state.interval);
            state.interval = null;
            state.time = 0;
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

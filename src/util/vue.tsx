import Col from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import type { CoercableComponent, GenericComponent, JSXFunction } from "features/feature";
import {
    Component as ComponentKey,
    GatherProps,
    isVisible,
    jsx,
    Visibility
} from "features/feature";
import type { ProcessedComputable } from "util/computed";
import { DoNotCache } from "util/computed";
import type { Component, ComputedRef, DefineComponent, PropType, Ref, ShallowRef } from "vue";
import {
    computed,
    defineComponent,
    isRef,
    onUnmounted,
    ref,
    shallowRef,
    unref,
    watchEffect
} from "vue";

export function coerceComponent(
    component: CoercableComponent,
    defaultWrapper = "span"
): DefineComponent {
    if (typeof component === "function") {
        return defineComponent({ render: component });
    }
    if (typeof component === "string") {
        if (component.length > 0) {
            component = component.trim();
            if (component.charAt(0) !== "<") {
                component = `<${defaultWrapper}>${component}</${defaultWrapper}>`;
            }

            return defineComponent({ template: component });
        }
        return defineComponent({ render: () => ({}) });
    }
    return component;
}

export interface VueFeature {
    [ComponentKey]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export function render(object: VueFeature | CoercableComponent): JSX.Element | DefineComponent {
    if (isCoercableComponent(object)) {
        if (typeof object === "function") {
            return (object as JSXFunction)();
        }
        return coerceComponent(object);
    }
    const Component = object[ComponentKey];
    return <Component {...object[GatherProps]()} />;
}

export function renderRow(...objects: (VueFeature | CoercableComponent)[]): JSX.Element {
    return <Row>{objects.map(render)}</Row>;
}

export function renderCol(...objects: (VueFeature | CoercableComponent)[]): JSX.Element {
    return <Col>{objects.map(render)}</Col>;
}

export function renderJSX(object: VueFeature | CoercableComponent): JSX.Element {
    if (isCoercableComponent(object)) {
        if (typeof object === "function") {
            return (object as JSXFunction)();
        }
        if (typeof object === "string") {
            return <>{object}</>;
        }
        // TODO why is object typed as never?
        const Comp = object as DefineComponent;
        return <Comp />;
    }
    const Component = object[ComponentKey];
    return <Component {...object[GatherProps]()} />;
}

export function renderRowJSX(...objects: (VueFeature | CoercableComponent)[]): JSX.Element {
    return <Row>{objects.map(renderJSX)}</Row>;
}

export function renderColJSX(...objects: (VueFeature | CoercableComponent)[]): JSX.Element {
    return <Col>{objects.map(renderJSX)}</Col>;
}

export function joinJSX(objects: JSX.Element[], joiner: JSX.Element): JSX.Element {
    return objects.reduce((acc, curr) => (
        <>
            {acc}
            {joiner}
            {curr}
        </>
    ));
}

export function isCoercableComponent(component: unknown): component is CoercableComponent {
    if (typeof component === "string") {
        return true;
    } else if (typeof component === "object") {
        if (component == null) {
            return false;
        }
        return "render" in component || "component" in component;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else if (typeof component === "function" && (component as any)[DoNotCache] === true) {
        return true;
    }
    return false;
}

export function setupHoldToClick(
    onClick?: Ref<((e?: MouseEvent | TouchEvent) => void) | undefined>,
    onHold?: Ref<VoidFunction | undefined>
): {
    start: (e: MouseEvent | TouchEvent) => void;
    stop: VoidFunction;
    handleHolding: VoidFunction;
} {
    const interval = ref<NodeJS.Timer | null>(null);
    const event = ref<MouseEvent | TouchEvent | undefined>(undefined) as Ref<
        MouseEvent | TouchEvent | undefined
    >;

    function start(e: MouseEvent | TouchEvent) {
        if (!interval.value) {
            interval.value = setInterval(handleHolding, 250);
        }
        event.value = e;
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
            onClick.value(event.value);
        }
    }

    onUnmounted(stop);

    return { start, stop, handleHolding };
}

export function getFirstFeature<
    T extends VueFeature & { visibility: ProcessedComputable<Visibility | boolean> }
>(
    features: T[],
    filter: (feature: T) => boolean
): {
    firstFeature: Ref<T | undefined>;
    collapsedContent: JSXFunction;
    hasCollapsedContent: Ref<boolean>;
} {
    const filteredFeatures = computed(() =>
        features.filter(feature => isVisible(feature.visibility) && filter(feature))
    );
    return {
        firstFeature: computed(() => filteredFeatures.value[0]),
        collapsedContent: jsx(() => renderCol(...filteredFeatures.value.slice(1))),
        hasCollapsedContent: computed(() => filteredFeatures.value.length > 1)
    };
}

export function computeComponent(
    component: Ref<ProcessedComputable<CoercableComponent>>,
    defaultWrapper = "div"
): ShallowRef<Component | ""> {
    const comp = shallowRef<Component | "">();
    watchEffect(() => {
        comp.value = coerceComponent(unwrapRef(component), defaultWrapper);
    });
    return comp as ShallowRef<Component | "">;
}
export function computeOptionalComponent(
    component: Ref<ProcessedComputable<CoercableComponent | undefined> | undefined>,
    defaultWrapper = "div"
): ShallowRef<Component | "" | null> {
    const comp = shallowRef<Component | "" | null>(null);
    watchEffect(() => {
        const currComponent = unwrapRef(component);
        comp.value =
            currComponent == "" || currComponent == null
                ? null
                : coerceComponent(currComponent, defaultWrapper);
    });
    return comp;
}

export function wrapRef<T>(ref: Ref<ProcessedComputable<T>>): ComputedRef<T> {
    return computed(() => unwrapRef(ref));
}

export function unwrapRef<T>(ref: Ref<ProcessedComputable<T>>): T {
    return unref<T>(unref(ref));
}

export function setRefValue<T>(ref: Ref<T | Ref<T>>, value: T) {
    if (isRef(ref.value)) {
        ref.value.value = value;
    } else {
        ref.value = value;
    }
}

export type PropTypes =
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

export function trackHover(element: VueFeature): Ref<boolean> {
    const isHovered = ref(false);

    const elementGatherProps = element[GatherProps].bind(element);
    element[GatherProps] = () => ({
        ...elementGatherProps(),
        onPointerenter: () => (isHovered.value = true),
        onPointerleave: () => (isHovered.value = false)
    });

    return isHovered;
}

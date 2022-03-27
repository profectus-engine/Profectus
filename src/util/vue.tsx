import Col from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import {
    CoercableComponent,
    Component as ComponentKey,
    GatherProps,
    GenericComponent,
    JSXFunction,
    Visibility
} from "features/feature";
import {
    Component,
    computed,
    ComputedRef,
    DefineComponent,
    defineComponent,
    isRef,
    onUnmounted,
    PropType,
    ref,
    Ref,
    ShallowRef,
    shallowRef,
    unref,
    watchEffect
} from "vue";
import { DoNotCache, ProcessedComputable } from "./computed";

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

export type VueFeature = {
    [ComponentKey]: GenericComponent;
    [GatherProps]: () => Record<string, unknown>;
};

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
    const interval = ref<null | number>(null);
    const event = ref<MouseEvent | TouchEvent | undefined>(undefined);

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

export function getFirstFeature<T extends { visibility: ProcessedComputable<Visibility> }>(
    features: T[],
    filter: (feature: T) => boolean
): { firstFeature: Ref<T | undefined>; hiddenFeatures: Ref<T[]> } {
    const filteredFeatures = computed(() =>
        features.filter(
            feature => unref(feature.visibility) === Visibility.Visible && filter(feature)
        )
    );
    return {
        firstFeature: computed(() => filteredFeatures.value[0]),
        hiddenFeatures: computed(() => filteredFeatures.value.slice(1))
    };
}

export function computeComponent(
    component: Ref<ProcessedComputable<CoercableComponent>>,
    defaultWrapper = "div"
): ShallowRef<Component | JSXFunction | ""> {
    const comp = shallowRef<Component | JSXFunction | "">();
    watchEffect(() => {
        comp.value = coerceComponent(unwrapRef(component), defaultWrapper);
    });
    return comp as ShallowRef<Component | JSXFunction | "">;
}
export function computeOptionalComponent(
    component: Ref<ProcessedComputable<CoercableComponent | undefined> | undefined>,
    defaultWrapper = "div"
): ShallowRef<Component | JSXFunction | "" | null> {
    const comp = shallowRef<Component | JSXFunction | "" | null>(null);
    watchEffect(() => {
        const currComponent = unwrapRef(component);
        comp.value = currComponent == null ? null : coerceComponent(currComponent, defaultWrapper);
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

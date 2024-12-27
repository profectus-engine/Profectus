/* eslint-disable vue/multi-word-component-names */
// ^ I have no idea why that's necessary; the rule is disabled, and this file isn't a vue component?
// I'm _guessing_ it's related to us using DefineComponent, but I figured that eslint rule should
// only apply to SFCs
import Col from "components/layout/Column.vue";
import Row from "components/layout/Row.vue";
import { getUniqueID, Visibility } from "features/feature";
import VueFeatureComponent from "features/VueFeature.vue";
import { MaybeGetter, processGetter } from "util/computed";
import type { CSSProperties, MaybeRef, MaybeRefOrGetter, Ref } from "vue";
import { isRef, onUnmounted, ref, toValue } from "vue";
import { JSX } from "vue/jsx-runtime";
import { camelToKebab } from "./common";

export const VueFeature = Symbol("VueFeature");

export type Renderable = JSX.Element | string;
export type Wrapper = (el: () => Renderable) => Renderable;

export interface VueFeatureOptions {
    /** Whether this feature should be visible. */
    visibility?: MaybeRefOrGetter<Visibility | boolean>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: MaybeRefOrGetter<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: MaybeRefOrGetter<CSSProperties>;
}

export interface VueFeature {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
    /** Whether this feature should be visible. */
    visibility?: MaybeRef<Visibility | boolean>;
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: MaybeRef<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: MaybeRef<CSSProperties>;
    /** The components to render inside the vue feature */
    components: MaybeGetter<Renderable>[];
    /** The components to render wrapped around the vue feature */
    wrappers: Wrapper[];
    /** Used to identify Vue Features */
    [VueFeature]: true;
}

export function vueFeatureMixin(
    featureName: string,
    options: VueFeatureOptions,
    component?: MaybeGetter<Renderable>
) {
    return {
        id: getUniqueID(featureName),
        visibility: processGetter(options.visibility),
        classes: processGetter(options.classes),
        style: processGetter(options.style),
        components: component == null ? [] : [component],
        wrappers: [] as Wrapper[],
        [VueFeature]: true
    } satisfies VueFeature;
}

export function render(object: VueFeature, wrapper?: (el: Renderable) => Renderable): JSX.Element;
export function render<T extends Renderable>(
    object: MaybeGetter<Renderable>,
    wrapper?: (el: Renderable) => T
): T;
export function render(
    object: VueFeature | MaybeGetter<Renderable>,
    wrapper?: (el: Renderable) => Renderable
): Renderable;
export function render(
    object: VueFeature | MaybeGetter<Renderable>,
    wrapper?: (el: Renderable) => Renderable
) {
    if (typeof object === "object" && VueFeature in object) {
        const { id, visibility, style, classes, components, wrappers } = object;
        return (
            <VueFeatureComponent
                id={id}
                visibility={visibility}
                style={style}
                classes={classes}
                components={components}
                wrappers={wrappers}
            />
        );
    }

    object = toValue(object);
    return wrapper?.(object) ?? object;
}

export function renderRow(...objects: (VueFeature | MaybeGetter<Renderable>)[]): JSX.Element {
    return <Row>{objects.map(obj => render(obj))}</Row>;
}

export function renderCol(...objects: (VueFeature | MaybeGetter<Renderable>)[]): JSX.Element {
    return <Col>{objects.map(obj => render(obj))}</Col>;
}

export function joinJSX(
    objects: (VueFeature | MaybeGetter<Renderable>)[],
    joiner: JSX.Element
): JSX.Element {
    return objects.reduce<JSX.Element>(
        (acc, curr) => (
            <>
                {acc}
                {joiner}
                {render(curr)}
            </>
        ),
        <></>
    );
}

export function isJSXElement(element: unknown): element is JSX.Element {
    return (
        element != null && typeof element === "object" && "type" in element && "children" in element
    );
}

export function setupHoldToClick(callback: (e?: MouseEvent | TouchEvent) => void): {
    start: (e: MouseEvent | TouchEvent) => void;
    stop: VoidFunction;
    handleHolding: VoidFunction;
} {
    const interval = ref<NodeJS.Timeout | null>(null);
    const event = ref<MouseEvent | TouchEvent | undefined>(undefined);

    function start(e: MouseEvent | TouchEvent) {
        if (interval.value == null) {
            interval.value = setInterval(handleHolding, 250);
        }
        event.value = e;
    }
    function stop() {
        if (interval.value != null) {
            clearInterval(interval.value);
            interval.value = null;
        }
    }
    function handleHolding() {
        callback(event.value);
    }

    onUnmounted(stop);

    return { start, stop, handleHolding };
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

export function trackHover(element: VueFeature): Ref<boolean> {
    const isHovered = ref(false);

    (element as unknown as { onPointerenter: VoidFunction }).onPointerenter = () =>
        (isHovered.value = true);
    (element as unknown as { onPointerleave: VoidFunction }).onPointerleave = () =>
        (isHovered.value = true);

    return isHovered;
}

export function kebabifyObject(object: Record<string, unknown>) {
    return Object.keys(object).reduce(
        (acc, curr) => {
            acc[camelToKebab(curr)] = object[curr];
            return acc;
        },
        {} as Record<string, unknown>
    );
}

import Modal from "components/modals/Modal.vue";
import { globalBus } from "game/events";
import type { Persistent } from "game/persistence";
import { persistent } from "game/persistence";
import player from "game/player";
import type { Emitter } from "nanoevents";
import { createNanoEvents } from "nanoevents";
import { MaybeGetter, processGetter } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Renderable } from "util/vue";
import {
    computed,
    type CSSProperties,
    InjectionKey,
    MaybeRef,
    MaybeRefOrGetter,
    Ref,
    ref,
    shallowReactive,
    unref
} from "vue";
import { JSX } from "vue/jsx-runtime";

/** A feature's node in the DOM that has its size tracked. */
export interface FeatureNode {
    rect: DOMRect;
    observer: MutationObserver;
    element: HTMLElement;
}

/**
 * An injection key that a Context component will use to provide a function that registers a {@link FeatureNode} with the given id and HTML element.
 */
export const RegisterNodeInjectionKey: InjectionKey<(id: string, element: HTMLElement) => void> =
    Symbol("RegisterNode");
/**
 * An injection key that a Context component will use to provide a function that unregisters a {@link FeatureNode} with the given id.
 */
export const UnregisterNodeInjectionKey: InjectionKey<(id: string) => void> =
    Symbol("UnregisterNode");
/**
 * An injection key that a Context component will use to provide a ref to a map of all currently registered {@link FeatureNode}s.
 */
export const NodesInjectionKey: InjectionKey<Ref<Record<string, FeatureNode | undefined>>> =
    Symbol("Nodes");
/**
 * An injection key that a Context component will use to provide a ref to a bounding rect of the Context.
 */
export const BoundsInjectionKey: InjectionKey<Ref<DOMRect | undefined>> = Symbol("Bounds");

/** All types of events able to be sent or emitted from a layer's emitter. */
export interface LayerEvents {
    /**
     * Sent every game tick, before the update event. Intended for "generation" type actions.
     * @param diff The delta time since last tick, in ms.
     */
    preUpdate: (diff: number) => void;
    /**
     * Sent every game tick. Intended for "automation" type actions.
     * @param diff The delta time since last tick, in ms.
     */
    update: (diff: number) => void;
    /**
     * Sent every game tick, after the update event. Intended for checking state.
     * @param diff The delta time since last tick, in ms.
     */
    postUpdate: (diff: number) => void;
}

/**
 * A reference to all the current layers.
 * It is shallow reactive so it will update when layers are added or removed, but not interfere with the existing refs within each layer.
 */
export const layers: Record<string, Readonly<Layer>> = shallowReactive({});

declare global {
    /** Augment the window object so the layers can be accessed from the console. */
    interface Window {
        layers: Record<string, Readonly<Layer> | undefined>;
    }
}
window.layers = layers;

declare module "@vue/runtime-dom" {
    /** Augment CSS Properties to allow for setting the layer color CSS variable. */
    interface CSSProperties {
        "--layer-color"?: string;
    }
}

/** An object representing the position of some entity. */
export interface Position {
    /** The X component of the entity's position. */
    x: number;
    /** The Y component of the entity's position. */
    y: number;
}

/**
 * An object that configures a {@link Layer}.
 * Even moreso than features, the developer is expected to include extra properties in this object.
 * All {@link game/persistence.Persistent} refs must be included somewhere within the layer object.
 */
export interface LayerOptions {
    /** The color of the layer, used to theme the entire layer's display. */
    color?: MaybeRefOrGetter<string>;
    /**
     * The layout of this layer's features.
     * When the layer is open in {@link game/player.Player.tabs}, this is the content that is displayed.
     */
    display: MaybeGetter<Renderable>;
    /** An object of classes that should be applied to the display. */
    classes?: MaybeRefOrGetter<Record<string, boolean>>;
    /** Styles that should be applied to the display. */
    style?: MaybeRefOrGetter<CSSProperties>;
    /**
     * The name of the layer, used on minimized tabs.
     * Defaults to {@link BaseLayer.id}.
     */
    name?: MaybeRefOrGetter<string>;
    /**
     * Whether or not the layer can be minimized.
     * Defaults to true.
     */
    minimizable?: MaybeRefOrGetter<boolean>;
    /**
     * The layout of this layer's features.
     * When the layer is open in {@link game/player.Player.tabs}, but the tab is {@link Layer.minimized} this is the content that is displayed.
     */
    minimizedDisplay?: MaybeGetter<Renderable>;
    /**
     * Whether or not to force the go back button to be hidden.
     * If true, go back will be hidden regardless of allowGoBack value in the project settings.
     */
    forceHideGoBack?: MaybeRefOrGetter<boolean>;
    /**
     * A CSS min-width value that is applied to the layer.
     * Can be a number, in which case the unit is assumed to be px.
     * Defaults to 600px.
     */
    minWidth?: MaybeRefOrGetter<number | string>;
}

/** The properties that are added onto a processed {@link LayerOptions} to create a {@link Layer} */
export interface BaseLayer {
    /**
     * The ID of the layer.
     * Populated from the {@link createLayer} parameters.
     * Used for saving and tracking open tabs.
     */
    id: string;
    /** A persistent ref tracking if the tab is minimized or not. */
    minimized: Persistent<boolean>;
    /** An emitter for sending {@link LayerEvents} events for this layer. */
    emitter: Emitter<LayerEvents>;
    /** A function to register an event listener on {@link emitter}. */
    on: OmitThisParameter<Emitter<LayerEvents>["on"]>;
    /** A function to emit a {@link LayerEvents} event to this layer. */
    emit: <K extends keyof LayerEvents>(...args: [K, ...Parameters<LayerEvents[K]>]) => void;
    /** A map of {@link FeatureNode}s present in this layer's Context component. */
    nodes: Ref<Record<string, FeatureNode | undefined>>;
}

/** An unit of game content. Displayed to the user as a tab or modal. */
export interface Layer extends BaseLayer {
    /** The color of the layer, used to theme the entire layer's display. */
    color?: MaybeRef<string>;
    /**
     * The layout of this layer's features.
     * When the layer is open in {@link game/player.Player.tabs}, this is the content that is displayed.
     */
    display: MaybeGetter<Renderable>;
    /** An object of classes that should be applied to the display. */
    classes?: MaybeRef<Record<string, boolean>>;
    /** Styles that should be applied to the display. */
    style?: MaybeRef<CSSProperties>;
    /**
     * The name of the layer, used on minimized tabs.
     * Defaults to {@link BaseLayer.id}.
     */
    name?: MaybeRef<string>;
    /**
     * Whether or not the layer can be minimized.
     * Defaults to true.
     */
    minimizable?: MaybeRef<boolean>;
    /**
     * The layout of this layer's features.
     * When the layer is open in {@link game/player.Player.tabs}, but the tab is {@link Layer.minimized} this is the content that is displayed.
     */
    minimizedDisplay?: MaybeGetter<Renderable>;
    /**
     * Whether or not to force the go back button to be hidden.
     * If true, go back will be hidden regardless of allowGoBack value in the project settings.
     */
    forceHideGoBack?: MaybeRef<boolean>;
    /**
     * A CSS min-width value that is applied to the layer.
     * Can be a number, in which case the unit is assumed to be px.
     * Defaults to 600px.
     */
    minWidth?: MaybeRef<number | string>;
}

/**
 * When creating layers, this object a map of layer ID to a set of any created persistent refs in order to check they're all included in the final layer object.
 */
export const persistentRefs: Record<string, Set<Persistent>> = {};
/**
 * When creating layers, this array stores the layers currently being created, as a stack.
 */
export const addingLayers: string[] = [];
/**
 * Lazily creates a layer with the given options.
 * @param id The ID this layer will have. See {@link BaseLayer.id}.
 * @param optionsFunc Layer options.
 */
export function createLayer<T extends LayerOptions>(
    id: string,
    optionsFunc: (layer: BaseLayer) => T & ThisType<Layer & Omit<T, keyof Layer>>
) {
    return createLazyProxy(() => {
        const emitter = createNanoEvents<LayerEvents>();
        addingLayers.push(id);
        persistentRefs[id] = new Set();

        const baseLayer = {
            id,
            emitter,
            ...emitter,
            nodes: ref({}),
            minimized: persistent(false, false)
        } satisfies BaseLayer;

        const options = optionsFunc(baseLayer);
        const {
            color,
            display,
            classes,
            style: _style,
            name,
            forceHideGoBack,
            minWidth,
            minimizable,
            minimizedDisplay,
            ...props
        } = options;
        if (
            addingLayers[addingLayers.length - 1] == null ||
            addingLayers[addingLayers.length - 1] !== id
        ) {
            throw new Error(
                `Adding layers stack in invalid state. This should not happen\nStack: ${addingLayers}\nTrying to pop ${id}`
            );
        }
        addingLayers.pop();

        const style = processGetter(_style);

        const layer = {
            ...baseLayer,
            ...(props as Omit<typeof props, keyof LayerOptions>),
            color: processGetter(color),
            display,
            classes: processGetter(classes),
            style: computed((): CSSProperties => {
                let width = unref(layer.minWidth);
                if (typeof width === "number" || !Number.isNaN(parseInt(width))) {
                    width = width + "px";
                }
                return {
                    ...unref(style),
                    ...(baseLayer.minimized.value
                        ? {
                              flexGrow: "0",
                              flexShrink: "0",
                              width: "60px",
                              minWidth: "",
                              flexBasis: "",
                              margin: "0"
                          }
                        : {
                              flexGrow: "",
                              flexShrink: "",
                              width: "",
                              minWidth: width,
                              flexBasis: width,
                              margin: ""
                          })
                };
            }),
            name: processGetter(name) ?? id,
            forceHideGoBack: processGetter(forceHideGoBack),
            minWidth: processGetter(minWidth) ?? 600,
            minimizable: processGetter(minimizable) ?? true,
            minimizedDisplay
        } satisfies Layer;

        return layer;
    });
}

/**
 * Enables a layer object, so it will be updated every tick.
 * Note that accessing a layer/its properties does NOT require it to be enabled.
 * For dynamic layers you can call this function and {@link removeLayer} as necessary. Just make sure {@link data/projEntry.getInitialLayers} will provide an accurate list of layers based on the player data object.
 * For static layers just make {@link data/projEntry.getInitialLayers} return all the layers.
 * @param layer The layer to add.
 * @param player The player data object, which will have a data object for this layer.
 */
export function addLayer(
    layer: Layer,
    player: { layers?: Record<string, Record<string, unknown>> }
): void {
    console.info("Adding layer", layer.id);
    if (layers[layer.id] != null) {
        console.error(
            "Attempted to add layer with same ID as existing layer",
            layer.id,
            layers[layer.id]
        );
        return;
    }

    player.layers ??= {};
    if (player.layers[layer.id] == null) {
        player.layers[layer.id] = {};
    }
    layers[layer.id] = layer;

    globalBus.emit("addLayer", layer, player.layers[layer.id]);
}

/**
 * Convenience method for getting a layer by its ID with correct typing.
 * @param layerID The ID of the layer to get.
 */
export function getLayer<T extends Layer>(layerID: string): T {
    return layers[layerID] as T;
}

/**
 * Disables a layer, so it will no longer be updated every tick.
 * Note that accessing a layer/its properties does NOT require it to be enabled.
 * @param layer The layer to remove.
 */
export function removeLayer(layer: Layer): void {
    console.info("Removing layer", layer.id);
    globalBus.emit("removeLayer", layer);

    delete layers[layer.id];
}

/**
 * Convenience method for removing and immediately re-adding a layer.
 * This is useful for layers with dynamic content, to ensure persistent refs are correctly configured.
 * @param layer Layer to remove and then re-add
 */
export function reloadLayer(layer: Layer): void {
    removeLayer(layer);

    // Re-create layer
    addLayer(layer, player);
}

/**
 * Utility function for creating a modal that display's a {@link LayerOptions.display}.
 * Returns the modal itself, which can be rendered anywhere you need, as well as a function to open the modal.
 * @param layer The layer to display in the modal.
 */
export function setupLayerModal(layer: Layer): {
    openModal: VoidFunction;
    modal: () => JSX.Element;
} {
    const showModal = ref(false);
    return {
        openModal: () => (showModal.value = true),
        modal: () => (
            <Modal
                modelValue={showModal.value}
                onUpdate:modelValue={value => (showModal.value = value)}
                v-slots={{
                    header: () => <h2>{unref(layer.name)}</h2>,
                    body: typeof layer.display ? layer.display : () => layer.display
                }}
            />
        )
    };
}

globalBus.on("update", function updateLayers(diff) {
    Object.values(layers).forEach(layer => {
        layer?.emit("preUpdate", diff);
    });
    Object.values(layers).forEach(layer => {
        layer?.emit("update", diff);
    });
    Object.values(layers).forEach(layer => {
        layer?.emit("postUpdate", diff);
    });
});

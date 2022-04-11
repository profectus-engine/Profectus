import Modal from "components/Modal.vue";
import {
    CoercableComponent,
    OptionsFunc,
    jsx,
    JSXFunction,
    Replace,
    setDefault,
    StyleValue
} from "features/feature";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { createNanoEvents, Emitter } from "nanoevents";
import { InjectionKey, Ref, ref, unref } from "vue";
import { globalBus } from "./events";
import { Persistent, persistent } from "./persistence";
import player from "./player";

export interface FeatureNode {
    rect: DOMRect;
    observer: MutationObserver;
    element: HTMLElement;
}

export const RegisterNodeInjectionKey: InjectionKey<(id: string, element: HTMLElement) => void> =
    Symbol("RegisterNode");
export const UnregisterNodeInjectionKey: InjectionKey<(id: string) => void> =
    Symbol("UnregisterNode");
export const NodesInjectionKey: InjectionKey<Ref<Record<string, FeatureNode | undefined>>> =
    Symbol("Nodes");

export interface LayerEvents {
    // Generation
    preUpdate: (diff: number) => void;
    // Actions (e.g. automation)
    update: (diff: number) => void;
    // Effects (e.g. milestones)
    postUpdate: (diff: number) => void;
}

export const layers: Record<string, Readonly<GenericLayer> | undefined> = {};
window.layers = layers;

declare module "@vue/runtime-dom" {
    interface CSSProperties {
        "--layer-color"?: string;
    }
}

export interface Position {
    x: number;
    y: number;
}

export interface LayerOptions {
    color?: Computable<string>;
    display: Computable<CoercableComponent>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    name?: Computable<string>;
    minimizable?: Computable<boolean>;
    forceHideGoBack?: Computable<boolean>;
    minWidth?: Computable<number>;
}

export interface BaseLayer {
    id: string;
    minimized: Persistent<boolean>;
    emitter: Emitter<LayerEvents>;
    on: OmitThisParameter<Emitter<LayerEvents>["on"]>;
    emit: <K extends keyof LayerEvents>(event: K, ...args: Parameters<LayerEvents[K]>) => void;
    nodes: Ref<Record<string, FeatureNode | undefined>>;
}

export type Layer<T extends LayerOptions> = Replace<
    T & BaseLayer,
    {
        color: GetComputableType<T["color"]>;
        display: GetComputableType<T["display"]>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        name: GetComputableTypeWithDefault<T["name"], string>;
        minWidth: GetComputableTypeWithDefault<T["minWidth"], 600>;
        minimizable: GetComputableTypeWithDefault<T["minimizable"], true>;
        forceHideGoBack: GetComputableType<T["forceHideGoBack"]>;
    }
>;

export type GenericLayer = Replace<
    Layer<LayerOptions>,
    {
        name: ProcessedComputable<string>;
        minWidth: ProcessedComputable<number>;
        minimizable: ProcessedComputable<boolean>;
    }
>;

export const persistentRefs: Record<string, Set<Persistent>> = {};
export const addingLayers: string[] = [];
export function createLayer<T extends LayerOptions>(
    id: string,
    optionsFunc: OptionsFunc<T, BaseLayer, BaseLayer>
): Layer<T> {
    return createLazyProxy(() => {
        const layer = {} as T & Partial<BaseLayer>;
        const emitter = (layer.emitter = createNanoEvents<LayerEvents>());
        layer.on = emitter.on.bind(emitter);
        layer.emit = emitter.emit.bind(emitter);
        layer.nodes = ref({});
        layer.id = id;

        addingLayers.push(id);
        persistentRefs[id] = new Set();
        layer.minimized = persistent(false);
        Object.assign(layer, optionsFunc.call(layer));
        if (
            addingLayers[addingLayers.length - 1] == null ||
            addingLayers[addingLayers.length - 1] !== id
        ) {
            throw `Adding layers stack in invalid state. This should not happen\nStack: ${addingLayers}\nTrying to pop ${layer.id}`;
        }
        addingLayers.pop();

        processComputable(layer as T, "color");
        processComputable(layer as T, "display");
        processComputable(layer as T, "name");
        setDefault(layer, "name", layer.id);
        processComputable(layer as T, "minWidth");
        setDefault(layer, "minWidth", 600);
        processComputable(layer as T, "minimizable");
        setDefault(layer, "minimizable", true);

        return layer as unknown as Layer<T>;
    });
}

export function addLayer(
    layer: GenericLayer,
    player: { layers?: Record<string, Record<string, unknown>> }
): void {
    console.info("Adding layer", layer.id);
    if (layers[layer.id]) {
        console.error(
            "Attempted to add layer with same ID as existing layer",
            layer.id,
            layers[layer.id]
        );
        return;
    }

    setDefault(player, "layers", {});
    if (player.layers[layer.id] == null) {
        player.layers[layer.id] = {};
    }
    layers[layer.id] = layer;

    globalBus.emit("addLayer", layer, player.layers[layer.id]);
}

export function getLayer<T extends GenericLayer>(layerID: string): T {
    return layers[layerID] as T;
}

export function removeLayer(layer: GenericLayer): void {
    console.info("Removing layer", layer.id);
    globalBus.emit("removeLayer", layer);

    layers[layer.id] = undefined;
}

export function reloadLayer(layer: GenericLayer): void {
    removeLayer(layer);

    // Re-create layer
    addLayer(layer, player);
}

export function setupLayerModal(layer: GenericLayer): {
    openModal: VoidFunction;
    modal: JSXFunction;
} {
    const showModal = ref(false);
    return {
        openModal: () => (showModal.value = true),
        modal: jsx(() => (
            <Modal
                modelValue={showModal.value}
                onUpdate:modelValue={value => (showModal.value = value)}
                v-slots={{
                    header: () => <h2>{unref(layer.name)}</h2>,
                    body: unref(layer.display)
                }}
            />
        ))
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

import { Application } from "@pixi/app";
import type { EmitterConfigV3 } from "@pixi/particle-emitter";
import { Emitter, upgradeConfig } from "@pixi/particle-emitter";
import { createLazyProxy } from "util/proxies";
import { VueFeature, vueFeatureMixin, VueFeatureOptions } from "util/vue";
import { Ref, shallowRef, unref } from "vue";
import Particles from "./Particles.vue";
import { processGetter } from "util/computed";

/** A symbol used to identify {@link Particles} features. */
export const ParticlesType = Symbol("Particles");

/**
 * An object that configures {@link Particles}.
 */
export interface ParticlesOptions extends VueFeatureOptions {
    /** A function that is called when the particles canvas is resized. */
    onContainerResized?: (boundingRect: DOMRect) => void;
    /** A function that is called whenever the particles element is reloaded during development. For restarting particle effects. */
    onHotReload?: VoidFunction;
}

/**
 * An object that represents a feature that display particle effects on the screen.
 * The config should typically be gotten by designing the effect using the [online particle effect editor](https://pixijs.io/pixi-particles-editor/) and passing it into the {@link upgradeConfig} from @pixi/particle-emitter.
 */
export interface Particles extends VueFeature {
    /** A function that is called when the particles canvas is resized. */
    onContainerResized?: (boundingRect: DOMRect) => void;
    /** A function that is called whenever the particles element is reloaded during development. For restarting particle effects. */
    onHotReload?: VoidFunction;
    /** The Pixi.JS Application powering this particles canvas. */
    app: Ref<null | Application>;
    /**
     * A function to asynchronously add an emitter to the canvas.
     * The returned emitter can then be positioned as appropriate and started.
     * @see {@link Particles}
     */
    addEmitter: (config: EmitterConfigV3) => Promise<Emitter>;
    /** A symbol that helps identify features of the same type. */
    type: typeof ParticlesType;
}

/**
 * Lazily creates particles with the given options.
 * @param optionsFunc Particles options.
 */
export function createParticles<T extends ParticlesOptions>(optionsFunc?: () => T) {
    return createLazyProxy(() => {
        const options = optionsFunc?.() ?? ({} as T);
        const { onContainerResized, onHotReload, style: _style, ...props } = options;

        const style = processGetter(_style);
        options.style = () => ({ position: "static", ...(unref(style) ?? {}) });

        let emittersToAdd: {
            resolve: (value: Emitter | PromiseLike<Emitter>) => void;
            config: EmitterConfigV3;
        }[] = [];

        function onInit(app: Application) {
            emittersToAdd.forEach(({ resolve, config }) => resolve(new Emitter(app.stage, config)));
            emittersToAdd = [];
            particles.app.value = app;
        }

        const particles = {
            type: ParticlesType,
            ...(props as Omit<typeof props, keyof VueFeature | keyof ParticlesOptions>),
            ...vueFeatureMixin("particles", options, () => (
                <Particles
                    onInit={onInit}
                    onContainerResized={particles.onContainerResized}
                    onHotReload={particles.onHotReload}
                />
            )),
            app: shallowRef<null | Application>(null),
            onContainerResized,
            onHotReload,
            addEmitter: (config: EmitterConfigV3): Promise<Emitter> => {
                if (particles.app.value != null) {
                    return Promise.resolve(new Emitter(particles.app.value.stage, config));
                }
                return new Promise<Emitter>(resolve => {
                    emittersToAdd.push({ resolve, config });
                });
            }
        } satisfies Particles;

        return particles;
    });
}

declare global {
    interface Window {
        upgradeConfig: typeof upgradeConfig;
    }
}
window.upgradeConfig = upgradeConfig;

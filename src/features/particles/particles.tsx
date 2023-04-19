import { Application } from "@pixi/app";
import type { EmitterConfigV3 } from "@pixi/particle-emitter";
import { Emitter, upgradeConfig } from "@pixi/particle-emitter";
import type { GenericComponent, OptionsFunc, Replace, StyleValue } from "features/feature";
import { Component, GatherProps, getUniqueID } from "features/feature";
import ParticlesComponent from "features/particles/Particles.vue";
import type { Computable, GetComputableType } from "util/computed";
import { createLazyProxy } from "util/proxies";
import { Ref, shallowRef, unref } from "vue";

/** A symbol used to identify {@link Particles} features. */
export const ParticlesType = Symbol("Particles");

/**
 * An object that configures {@link Particles}.
 */
export interface ParticlesOptions {
    /** Dictionary of CSS classes to apply to this feature. */
    classes?: Computable<Record<string, boolean>>;
    /** CSS to apply to this feature. */
    style?: Computable<StyleValue>;
    /** A function that is called when the particles canvas is resized. */
    onContainerResized?: (boundingRect: DOMRect) => void;
    /** A function that is called whenever the particles element is reloaded during development. For restarting particle effects. */
    onHotReload?: VoidFunction;
}

/**
 * The properties that are added onto a processed {@link ParticlesOptions} to create an {@link Particles}.
 */
export interface BaseParticles {
    /** An auto-generated ID for identifying features that appear in the DOM. Will not persist between refreshes or updates. */
    id: string;
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
    /** The Vue component used to render this feature. */
    [Component]: GenericComponent;
    /** A function to gather the props the vue component requires for this feature. */
    [GatherProps]: () => Record<string, unknown>;
}

/**
 * An object that represents a feature that display particle effects on the screen.
 * The config should typically be gotten by designing the effect using the [online particle effect editor](https://pixijs.io/pixi-particles-editor/) and passing it into the {@link upgradeConfig} from @pixi/particle-emitter.
 */
export type Particles<T extends ParticlesOptions> = Replace<
    T & BaseParticles,
    {
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
    }
>;

/** A type that matches any valid {@link Particles} object. */
export type GenericParticles = Particles<ParticlesOptions>;

/**
 * Lazily creates particles with the given options.
 * @param optionsFunc Particles options.
 */
export function createParticles<T extends ParticlesOptions>(
    optionsFunc?: OptionsFunc<T, BaseParticles, GenericParticles>
): Particles<T> {
    return createLazyProxy(feature => {
        const particles =
            optionsFunc?.call(feature, feature) ??
            ({} as ReturnType<NonNullable<typeof optionsFunc>>);
        particles.id = getUniqueID("particles-");
        particles.type = ParticlesType;
        particles[Component] = ParticlesComponent as GenericComponent;

        particles.app = shallowRef(null);
        particles.addEmitter = (config: EmitterConfigV3): Promise<Emitter> => {
            const genericParticles = particles as GenericParticles;
            if (genericParticles.app.value) {
                return Promise.resolve(new Emitter(genericParticles.app.value.stage, config));
            }
            return new Promise<Emitter>(resolve => {
                emittersToAdd.push({ resolve, config });
            });
        };

        let emittersToAdd: {
            resolve: (value: Emitter | PromiseLike<Emitter>) => void;
            config: EmitterConfigV3;
        }[] = [];

        function onInit(app: Application) {
            const genericParticles = particles as GenericParticles;
            genericParticles.app.value = app;
            emittersToAdd.forEach(({ resolve, config }) => resolve(new Emitter(app.stage, config)));
            emittersToAdd = [];
        }

        particles.onContainerResized = particles.onContainerResized?.bind(particles);

        particles[GatherProps] = function (this: GenericParticles) {
            const { id, style, classes, onContainerResized, onHotReload } = this;
            return {
                id,
                style: unref(style),
                classes,
                onContainerResized,
                onHotReload,
                onInit
            };
        };

        return particles as unknown as Particles<T>;
    });
}

declare global {
    interface Window {
        upgradeConfig: typeof upgradeConfig;
    }
}
window.upgradeConfig = upgradeConfig;

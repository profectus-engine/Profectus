import ParticlesComponent from "features/particles/Particles.vue";
import { Ref, shallowRef, unref } from "vue";
import {
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    Replace,
    StyleValue
} from "features/feature";
import { createLazyProxy } from "util/proxies";
import { Application } from "pixi.js";
import { Emitter, EmitterConfigV3, upgradeConfig } from "@pixi/particle-emitter";
import { Computable, GetComputableType } from "util/computed";

export const ParticlesType = Symbol("Particles");

export interface ParticlesOptions {
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    onContainerResized?: (boundingRect: DOMRect) => void;
    onHotReload?: VoidFunction;
}

export interface BaseParticles {
    id: string;
    app: Ref<null | Application>;
    addEmitter: (config: EmitterConfigV3) => Promise<Emitter>;
    type: typeof ParticlesType;
    [Component]: typeof ParticlesComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Particles<T extends ParticlesOptions> = Replace<
    T & BaseParticles,
    {
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
    }
>;

export type GenericParticles = Particles<ParticlesOptions>;

export function createParticles<T extends ParticlesOptions>(
    optionsFunc: OptionsFunc<T, Particles<T>, BaseParticles>
): Particles<T> {
    return createLazyProxy(() => {
        const particles = optionsFunc();
        particles.id = getUniqueID("particles-");
        particles.type = ParticlesType;
        particles[Component] = ParticlesComponent;

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
            (particles as GenericParticles).app.value = app;
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

import ParticlesComponent from "features/particles/Particles.vue";
import { Container } from "tsparticles-engine";
import { IEmitter } from "tsparticles-plugin-emitters/Options/Interfaces/IEmitter";
import { EmitterInstance } from "tsparticles-plugin-emitters/EmitterInstance";
import { EmitterContainer } from "tsparticles-plugin-emitters/EmitterContainer";
import { Ref, shallowRef } from "vue";
import { Component, GatherProps, getUniqueID, Replace, setDefault } from "features/feature";
import { createLazyProxy } from "util/proxies";

export const ParticlesType = Symbol("Particles");

export interface ParticlesOptions {
    fullscreen?: boolean;
    zIndex?: number;
    onContainerResized?: (boundingRect: DOMRect) => void;
}

export interface BaseParticles {
    id: string;
    containerRef: Ref<null | (EmitterContainer & Container)>;
    addEmitter: (
        options: IEmitter & { particles: Required<IEmitter>["particles"] }
    ) => Promise<EmitterInstance>;
    removeEmitter: (emitter: EmitterInstance) => void;
    type: typeof ParticlesType;
    [Component]: typeof ParticlesComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type Particles<T extends ParticlesOptions> = Replace<
    T & BaseParticles,
    {
        fullscreen: undefined extends T["fullscreen"] ? true : T["fullscreen"];
        zIndex: undefined extends T["zIndex"] ? 1 : T["zIndex"];
    }
>;

export type GenericParticles = Replace<
    Particles<ParticlesOptions>,
    {
        fullscreen: boolean;
        zIndex: number;
    }
>;

export function createParticles<T extends ParticlesOptions>(
    optionsFunc: () => T & ThisType<Particles<T>>
): Particles<T> {
    return createLazyProxy(() => {
        const particles: T & Partial<BaseParticles> = optionsFunc();
        particles.id = getUniqueID("particles-");
        particles.type = ParticlesType;
        particles[Component] = ParticlesComponent;

        particles.containerRef = shallowRef(null);
        particles.addEmitter = (
            options: IEmitter & { particles: Required<IEmitter>["particles"] }
        ): Promise<EmitterInstance> => {
            const genericParticles = particles as GenericParticles;
            if (genericParticles.containerRef.value) {
                // TODO why does addEmitter require a position parameter
                return Promise.resolve(genericParticles.containerRef.value.addEmitter(options));
            }
            return new Promise<EmitterInstance>(resolve => {
                emittersToAdd.push({ resolve, options });
            });
        };
        particles.removeEmitter = (emitter: EmitterInstance) => {
            // TODO I can't find a proper way to remove an emitter without accessing private functions
            emitter.emitters.removeEmitter(emitter);
        };

        let emittersToAdd: {
            resolve: (value: EmitterInstance | PromiseLike<EmitterInstance>) => void;
            options: IEmitter & { particles: Required<IEmitter>["particles"] };
        }[] = [];

        function onInit(container: EmitterContainer & Container) {
            (particles as GenericParticles).containerRef.value = container;
            emittersToAdd.forEach(({ resolve, options }) => resolve(container.addEmitter(options)));
            emittersToAdd = [];
        }

        setDefault(particles, "fullscreen", true);
        setDefault(particles, "zIndex", 1);
        particles.onContainerResized = particles.onContainerResized?.bind(particles);

        particles[GatherProps] = function (this: GenericParticles) {
            const { id, fullscreen, zIndex, onContainerResized } = this;
            return {
                id,
                fullscreen,
                zIndex,
                onContainerResized,
                onInit
            };
        };

        return particles as unknown as Particles<T>;
    });
}

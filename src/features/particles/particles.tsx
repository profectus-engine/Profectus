import ParticlesComponent from "./Particles.vue";
import { IEmitter } from "tsparticles-plugin-emitters/Options/Interfaces/IEmitter";
import { EmitterInstance } from "tsparticles-plugin-emitters/EmitterInstance";
import { EmitterContainer } from "tsparticles-plugin-emitters/EmitterContainer";
import { Ref, shallowRef } from "vue";
import { registerGameComponent } from "game/settings";
import { jsx } from "features/feature";

registerGameComponent(jsx(() => <ParticlesComponent onInit={onInit} />));

const containerRef: Ref<null | EmitterContainer> = shallowRef(null);

let emittersToAdd: {
    resolve: (value: EmitterInstance | PromiseLike<EmitterInstance>) => void;
    options: IEmitter & { particles: Required<IEmitter>["particles"] };
}[] = [];

export function addEmitter(
    options: IEmitter & { particles: Required<IEmitter>["particles"] }
): Promise<EmitterInstance> {
    if (containerRef.value) {
        // TODO why does addEmitter require a position parameter
        return Promise.resolve(containerRef.value.addEmitter(options));
    }
    return new Promise<EmitterInstance>(resolve => {
        emittersToAdd.push({ resolve, options });
    });
}

export function removeEmitter(emitter: EmitterInstance) {
    // TODO I can't find a proper way to remove an emitter without accessing private functions
    emitter.emitters.removeEmitter(emitter);
}

function onInit(container: EmitterContainer) {
    containerRef.value = container;
    emittersToAdd.forEach(({ resolve, options }) => resolve(container.addEmitter(options)));
    emittersToAdd = [];
}

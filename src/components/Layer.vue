<template>
    <ErrorVue v-if="errors.length > 0" :errors="errors" />
    <div class="layer-container" :style="{ '--layer-color': unref(color) }" v-bind="$attrs" v-else>
        <button v-if="showGoBack" class="goBack" @click="goBack">❌</button>

        <button
            class="layer-tab minimized"
            v-if="unref(minimized)"
            @click="$emit('setMinimized', false)"
        >
            <component v-if="minimizedComponent" :is="minimizedComponent" />
            <div v-else>{{ unref(name) }}</div>
        </button>
        <div class="layer-tab" :class="{ showGoBack }" v-else>
            <Context @update-nodes="updateNodes">
                <component :is="component" />
            </Context>
        </div>

        <button v-if="unref(minimizable)" class="minimize" @click="$emit('setMinimized', true)">
            ▼
        </button>
    </div>
</template>

<script lang="ts">
import projInfo from "data/projInfo.json";
import type { CoercableComponent } from "features/feature";
import type { FeatureNode } from "game/layers";
import player from "game/player";
import { computeComponent, computeOptionalComponent, processedPropType, unwrapRef } from "util/vue";
import { PropType, Ref, computed, defineComponent, onErrorCaptured, ref, toRefs, unref } from "vue";
import Context from "./Context.vue";
import ErrorVue from "./Error.vue";

export default defineComponent({
    components: { Context, ErrorVue },
    props: {
        index: {
            type: Number,
            required: true
        },
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        minimizedDisplay: processedPropType<CoercableComponent>(Object, String, Function),
        minimized: {
            type: Object as PropType<Ref<boolean>>,
            required: true
        },
        name: {
            type: processedPropType<string>(String),
            required: true
        },
        color: processedPropType<string>(String),
        minimizable: processedPropType<boolean>(Boolean),
        nodes: {
            type: Object as PropType<Ref<Record<string, FeatureNode | undefined>>>,
            required: true
        }
    },
    emits: ["setMinimized"],
    setup(props) {
        const { display, index, minimized, minimizedDisplay } = toRefs(props);

        const component = computeComponent(display);
        const minimizedComponent = computeOptionalComponent(minimizedDisplay);
        const showGoBack = computed(
            () => projInfo.allowGoBack && index.value > 0 && !unwrapRef(minimized)
        );

        function goBack() {
            player.tabs.splice(unref(props.index), Infinity);
        }

        function updateNodes(nodes: Record<string, FeatureNode | undefined>) {
            props.nodes.value = nodes;
        }

        const errors = ref<Error[]>([]);
        onErrorCaptured((err, instance, info) => {
            console.warn(`Error caught in "${props.name}" layer`, err, instance, info);
            errors.value.push(
                err instanceof Error ? (err as Error) : new Error(JSON.stringify(err))
            );
            return false;
        });

        return {
            component,
            minimizedComponent,
            showGoBack,
            updateNodes,
            unref,
            goBack,
            errors
        };
    }
});
</script>

<style scoped>
.layer-container {
    min-width: 100%;
    min-height: 100%;
    margin: 0;
    flex-grow: 1;
    display: flex;
    isolation: isolate;
}

.layer-tab:not(.minimized) {
    padding-top: 20px;
    padding-bottom: 20px;
    min-height: 100%;
    flex-grow: 1;
    text-align: center;
    position: relative;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
    padding-top: 50px;
}

.layer-tab.minimized {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: 0;
    padding-top: 55px;
    margin: 0;
    cursor: pointer;
    font-size: 40px;
    color: var(--foreground);
    border: none;
    background-color: transparent;
}

.layer-tab.minimized > * {
    margin: 0;
    writing-mode: vertical-rl;
    text-align: left;
    padding-left: 10px;
    width: 50px;
}

.inner-tab > .layer-container > .layer-tab:not(.minimized) {
    margin: -50px -10px;
    padding: 50px 10px;
}

.modal-body .layer-tab {
    padding-bottom: 0;
}

.modal-body .layer-tab:not(.hasSubtabs) {
    padding-top: 0;
}

.minimize {
    position: sticky;
    top: 6px;
    right: 9px;
    z-index: 7;
    line-height: 30px;
    border: none;
    background: var(--background);
    box-shadow: var(--background) 0 2px 3px 5px;
    border-radius: 50%;
    color: var(--foreground);
    font-size: 40px;
    cursor: pointer;
    margin-top: -44px;
    margin-right: -30px;
}

.minimized + .minimize {
    transform: rotate(-90deg);
    top: 10px;
    right: 18px;
    pointer-events: none;
}

.goBack {
    position: sticky;
    top: 10px;
    left: 10px;
    line-height: 30px;
    margin-top: -50px;
    margin-left: -35px;
    border: none;
    background: var(--background);
    box-shadow: var(--background) 0 2px 3px 5px;
    border-radius: 50%;
    color: var(--foreground);
    font-size: 30px;
    cursor: pointer;
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--foreground);
}
</style>

<style>
.layer-tab.minimized > * > .desc {
    color: var(--accent1);
    font-size: 30px;
}
</style>

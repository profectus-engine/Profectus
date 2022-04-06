<template>
    <div class="layer-container" :style="{ '--layer-color': unref(color) }">
        <button v-if="showGoBack" class="goBack" @click="goBack">←</button>
        <button class="layer-tab minimized" v-if="minimized.value" @click="minimized.value = false">
            <div>{{ unref(name) }}</div>
        </button>
        <div
            class="layer-tab"
            :style="unref(style)"
            :class="[{ showGoBack }, unref(classes)]"
            v-else
        >
            <Context ref="contextRef">
                <component :is="component" />
            </Context>
        </div>
        <button v-if="unref(minimizable)" class="minimize" @click="minimized.value = true">
            ▼
        </button>
    </div>
</template>

<script lang="ts">
import projInfo from "data/projInfo.json";
import { CoercableComponent, StyleValue } from "features/feature";
import { FeatureNode } from "game/layers";
import { Persistent } from "game/persistence";
import player from "game/player";
import { computeComponent, processedPropType, wrapRef } from "util/vue";
import { computed, defineComponent, nextTick, PropType, Ref, ref, toRefs, unref, watch } from "vue";
import Context from "./Context.vue";

export default defineComponent({
    components: { Context },
    props: {
        index: {
            type: Number,
            required: true
        },
        tab: {
            type: Function as PropType<() => HTMLElement | undefined>,
            required: true
        },
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        minimized: {
            type: Object as PropType<Persistent<boolean>>,
            required: true
        },
        minWidth: {
            type: processedPropType<number>(Number),
            required: true
        },
        name: {
            type: processedPropType<string>(String),
            required: true
        },
        color: processedPropType<string>(String),
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        minimizable: processedPropType<boolean>(Boolean),
        nodes: {
            type: Object as PropType<Ref<Record<string, FeatureNode | undefined>>>,
            required: true
        }
    },
    setup(props) {
        const { display, index, minimized, minWidth, tab } = toRefs(props);

        const component = computeComponent(display);
        const showGoBack = computed(
            () => projInfo.allowGoBack && index.value > 0 && !minimized.value
        );

        function goBack() {
            player.tabs.splice(unref(props.index), Infinity);
        }

        nextTick(() => updateTab(minimized.value, unref(minWidth.value)));
        watch([minimized, wrapRef(minWidth)], ([minimized, minWidth]) =>
            updateTab(minimized, minWidth)
        );

        const contextRef = ref<typeof Context | null>(null);
        watch(
            () => contextRef.value?.nodes,
            nodes => {
                if (nodes) {
                    props.nodes.value = nodes;
                }
            }
        );

        function updateTab(minimized: boolean, minWidth: number) {
            const tabValue = tab.value();
            if (tabValue != undefined) {
                if (minimized) {
                    tabValue.style.flexGrow = "0";
                    tabValue.style.flexShrink = "0";
                    tabValue.style.width = "60px";
                    tabValue.style.minWidth = tabValue.style.flexBasis = "";
                    tabValue.style.margin = "0";
                } else {
                    tabValue.style.flexGrow = "";
                    tabValue.style.flexShrink = "";
                    tabValue.style.width = "";
                    tabValue.style.minWidth = tabValue.style.flexBasis = `${minWidth}px`;
                    tabValue.style.margin = "";
                }
            }
        }

        return {
            component,
            showGoBack,
            contextRef,
            unref,
            goBack
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

.layer-tab.minimized div {
    margin: 0;
    writing-mode: vertical-rl;
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
    width: 30px;
    border: none;
    background: var(--background);
    box-shadow: var(--background) 0 2px 3px 5px;
    border-radius: 50%;
    color: var(--foreground);
    font-size: 40px;
    cursor: pointer;
    padding: 0;
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
    position: absolute;
    top: 0;
    left: 20px;
    background-color: transparent;
    border: 1px solid transparent;
    color: var(--foreground);
    font-size: 40px;
    cursor: pointer;
    line-height: 40px;
    z-index: 7;
}

.goBack:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--foreground);
}
</style>

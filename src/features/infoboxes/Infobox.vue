<template>
    <div
        class="infobox"
        :style="{
                borderColor: unref(color),
            }"
        :class="{ collapsed: unref(collapsed), stacked }"
    >
        <button
            class="title"
            :style="[{ backgroundColor: unref(color) }, unref(titleStyle) || []]"
            @click="collapsed.value = !unref(collapsed)"
        >
            <span class="toggle">▼</span>
            <Title />
        </button>
        <CollapseTransition>
            <div v-if="!unref(collapsed)" class="body" :style="unref(bodyStyle)">
                <Body />
            </div>
        </CollapseTransition>
    </div>
</template>

<script setup lang="ts">
import CollapseTransition from "@ivanv/vue-collapse-transition/src/CollapseTransition.vue";
import themes from "data/themes";
import settings from "game/settings";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import { computed, CSSProperties, MaybeRef, Ref, unref } from "vue";

const props = defineProps<{
    color?: MaybeRef<string>;
    titleStyle?: MaybeRef<CSSProperties>;
    bodyStyle?: MaybeRef<CSSProperties>;
    collapsed: Ref<boolean>;
    display: MaybeGetter<Renderable>;
    title: MaybeGetter<Renderable>;
}>();

const Title = () => render(props.title);
const Body = () => render(props.display);

const stacked = computed(() => themes[settings.theme].mergeAdjacent);
</script>

<style scoped>
.infobox {
    position: relative;
    width: 600px;
    max-width: 95%;
    margin-top: 0;
    text-align: left;
    border-style: solid;
    border-width: 0px;
    box-sizing: border-box;
    border-radius: 5px;
}

.infobox.stacked {
    border-width: 4px;
}

.infobox:not(.stacked) + .infobox:not(.stacked) {
    margin-top: 20px;
}

.infobox + :not(.infobox) {
    margin-top: 10px;
}

.title {
    font-size: 24px;
    color: black;
    cursor: pointer;
    border: none;
    padding: 4px;
    width: auto;
    text-align: left;
    padding-left: 30px;
    border-radius: 0;
    margin: 00;
}

.infobox:not(.stacked) .title {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
}

.infobox.stacked + .infobox.stacked {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    margin-top: -5px;
}

.stacked .title {
    width: 100%;
}

.collapsed:not(.stacked) .title::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 4px;
    background-color: inherit;
}

.toggle {
    position: absolute;
    left: 10px;
}

.collapsed .toggle {
    transform: rotate(-90deg);
}

.body {
    transition-duration: 0.5s;
    padding: 8px;
    width: 100%;
    display: block;
    box-sizing: border-box;
    background-color: var(--background);
    border-radius: 0 0 var(--feature-margin) var(--feature-margin);
}

.infobox:not(.stacked) .body {
    padding: 4px;
}
</style>

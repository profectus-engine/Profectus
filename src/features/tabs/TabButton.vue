<template>
    <button @click="selectTab" class="tabButton" :style="glowColorStyle" :class="{ active }">
        <Component />
    </button>
</template>

<script setup lang="ts">
import { getNotifyStyle } from "game/notifications";
import { render } from "util/vue";
import { computed, unref } from "vue";
import { TabButton } from "./tabFamily";

const props = defineProps<{
    display: TabButton["display"];
    glowColor: TabButton["glowColor"];
    active?: boolean;
    floating?: boolean;
}>();

const emit = defineEmits<{
    selectTab: [];
}>();

const Component = () => render(props.display);

const glowColorStyle = computed(() => {
    const color = unref(props.glowColor);
    if (color == null || color === "") {
        return {};
    }
    if (props.floating) {
        return getNotifyStyle(color);
    }
    return { boxShadow: `0px 9px 5px -6px ${color}` };
});

function selectTab() {
    emit("selectTab");
}
</script>

<style scoped>
.tabButton {
    background-color: transparent;
    color: var(--foreground);
    font-size: 20px;
    cursor: pointer;
    padding: 5px 20px;
    margin: 5px;
    border-radius: 5px;
    border: 2px solid;
    flex-shrink: 0;
    border-color: var(--layer-color);
}

.tabButton:hover {
    transform: scale(1.1, 1.1);
    text-shadow: 0 0 7px var(--foreground);
}

:not(.floating) > .tabButton {
    height: 50px;
    margin: 0;
    border-left: none;
    border-right: none;
    border-top: none;
    border-bottom-width: 4px;
    border-radius: 0;
    transform: unset;
}

:not(.floating) .tabButton:not(.active) {
    border-bottom-color: transparent;
}

.tabButton > * {
    pointer-events: none;
}
</style>

<template>
    <button
        @click="emits('selectTab')"
        class="tabButton"
        :style="style"
        :class="{
            active,
            ...classes
        }"
    >
        <component :is="component" />
    </button>
</template>

<script setup lang="ts">
import { FeatureComponent } from "@/features/feature";
import { GenericTabButton } from "@/features/tabFamily";
import { coerceComponent } from "@/util/vue";
import { computed, toRefs } from "vue";

const props = toRefs(defineProps<FeatureComponent<GenericTabButton> & { active: boolean }>());

const emits = defineEmits<{
    (e: "selectTab"): void;
}>();

const component = computed(() => coerceComponent(props.display.value));
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
</style>

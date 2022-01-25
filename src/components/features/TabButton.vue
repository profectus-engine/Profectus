<template>
    <button
        @click="selectTab"
        class="tabButton"
        :style="unref(style)"
        :class="{
            active,
            ...unref(classes)
        }"
    >
        <component :is="component" />
    </button>
</template>

<script lang="ts">
import { CoercableComponent, StyleValue } from "@/features/feature";
import { ProcessedComputable } from "@/util/computed";
import { computeComponent } from "@/util/vue";
import { defineComponent, PropType, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        display: {
            type: [Object, String] as PropType<ProcessedComputable<CoercableComponent>>,
            required: true
        },
        style: Object as PropType<ProcessedComputable<StyleValue>>,
        classes: Object as PropType<ProcessedComputable<Record<string, boolean>>>,
        active: [Object, Boolean] as PropType<ProcessedComputable<boolean>>
    },
    emits: ["selectTab"],
    setup(props, { emit }) {
        const { display } = toRefs(props);

        const component = computeComponent(display);

        function selectTab() {
            emit("selectTab");
        }

        return {
            selectTab,
            component,
            unref
        };
    }
});
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

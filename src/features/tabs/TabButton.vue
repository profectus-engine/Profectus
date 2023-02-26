<template>
    <button
        v-if="isVisible(visibility)"
        @click="selectTab"
        class="tabButton"
        :style="[
            {
                visibility: isHidden(visibility) ? 'hidden' : undefined
            },
            glowColorStyle,
            unref(style) ?? {}
        ]"
        :class="{
            active,
            ...unref(classes)
        }"
    >
        <component :is="component" />
    </button>
</template>

<script lang="ts">
import type { CoercableComponent, StyleValue } from "features/feature";
import { isHidden, isVisible, Visibility } from "features/feature";
import { getNotifyStyle } from "game/notifications";
import { computeComponent, processedPropType, unwrapRef } from "util/vue";
import { computed, defineComponent, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility | boolean>(Number, Boolean),
            required: true
        },
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        style: processedPropType<StyleValue>(String, Object, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        glowColor: processedPropType<string>(String),
        active: Boolean,
        floating: Boolean
    },
    emits: ["selectTab"],
    setup(props, { emit }) {
        const { display, glowColor, floating } = toRefs(props);

        const component = computeComponent(display);

        const glowColorStyle = computed(() => {
            const color = unwrapRef(glowColor);
            if (color == null || color === "") {
                return {};
            }
            if (unref(floating)) {
                return getNotifyStyle(color);
            }
            return { boxShadow: `0px 9px 5px -6px ${color}` };
        });

        function selectTab() {
            emit("selectTab");
        }

        return {
            selectTab,
            component,
            glowColorStyle,
            unref,
            Visibility,
            isVisible,
            isHidden
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

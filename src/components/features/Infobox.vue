<template>
    <div
        class="infobox"
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="[{ borderColor: color }, style || []]"
        :class="{ collapsed, stacked, ...classes }"
    >
        <button
            class="title"
            :style="[{ backgroundColor: color }, titleStyle || []]"
            @click="collapsed = !collapsed"
        >
            <span class="toggle">▼</span>
            <component :is="titleComponent" />
        </button>
        <CollapseTransition>
            <div v-if="!collapsed" class="body" :style="{ backgroundColor: color }">
                <component :is="bodyComponent" :style="bodyStyle" />
            </div>
        </CollapseTransition>
        <LinkNode :id="id" />
    </div>
</template>

<script lang="ts">
import themes from "@/data/themes";
import { CoercableComponent, Visibility } from "@/features/feature";
import settings from "@/game/settings";
import { coerceComponent } from "@/util/vue";
import CollapseTransition from "@ivanv/vue-collapse-transition/src/CollapseTransition.vue";
import { computed, defineComponent, PropType, StyleValue, toRefs } from "vue";
import LinkNode from "../system/LinkNode.vue";

export default defineComponent({
    props: {
        visibility: {
            type: Object as PropType<Visibility>,
            required: true
        },
        display: {
            type: [Object, String] as PropType<CoercableComponent>,
            required: true
        },
        title: [Object, String] as PropType<CoercableComponent>,
        color: String,
        collapsed: {
            type: Boolean,
            required: true
        },
        style: Object as PropType<StyleValue>,
        titleStyle: Object as PropType<StyleValue>,
        bodyStyle: Object as PropType<StyleValue>,
        classes: Object as PropType<Record<string, boolean>>,
        id: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const { title, display } = toRefs(props);

        const titleComponent = computed(() => title.value && coerceComponent(title.value));
        const bodyComponent = computed(() => coerceComponent(display.value));
        const stacked = computed(() => themes[settings.theme].stackedInfoboxes);

        return {
            titleComponent,
            bodyComponent,
            stacked,
            LinkNode,
            CollapseTransition,
            Visibility
        };
    }
});
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
    border-radius: 5px;
    border-top-left-radius: 0;
}

.infobox:not(.stacked) .body {
    padding: 4px;
}

.body > * {
    padding: 8px;
    width: 100%;
    display: block;
    box-sizing: border-box;
    border-radius: 5px;
    border-top-left-radius: 0;
    background-color: var(--background);
}
</style>

<template>
    <div
        class="infobox"
        v-if="unref(visibility) !== Visibility.None"
        :style="[
            {
                borderColor: unref(color),
                visibility: unref(visibility) === Visibility.Hidden ? 'hidden' : undefined
            },
            unref(style) ?? {}
        ]"
        :class="{ collapsed: unref(collapsed), stacked, ...unref(classes) }"
    >
        <button
            class="title"
            :style="[{ backgroundColor: unref(color) }, unref(titleStyle) || []]"
            @click="collapsed.value = !unref(collapsed)"
        >
            <span class="toggle">▼</span>
            <component :is="titleComponent" />
        </button>
        <CollapseTransition>
            <div v-if="!unref(collapsed)" class="body" :style="{ backgroundColor: unref(color) }">
                <component :is="bodyComponent" :style="unref(bodyStyle)" />
            </div>
        </CollapseTransition>
        <Node :id="id" />
    </div>
</template>

<script lang="ts">
import Node from "components/Node.vue";
import themes from "data/themes";
import { CoercableComponent, Visibility } from "features/feature";
import settings from "game/settings";
import { computeComponent, processedPropType } from "util/vue";
import CollapseTransition from "@ivanv/vue-collapse-transition/src/CollapseTransition.vue";
import { computed, defineComponent, PropType, Ref, StyleValue, toRefs, unref } from "vue";

export default defineComponent({
    props: {
        visibility: {
            type: processedPropType<Visibility>(Number),
            required: true
        },
        display: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        title: {
            type: processedPropType<CoercableComponent>(Object, String, Function),
            required: true
        },
        color: processedPropType<string>(String),
        collapsed: {
            type: Object as PropType<Ref<boolean>>,
            required: true
        },
        style: processedPropType<StyleValue>(Object, String, Array),
        titleStyle: processedPropType<StyleValue>(Object, String, Array),
        bodyStyle: processedPropType<StyleValue>(Object, String, Array),
        classes: processedPropType<Record<string, boolean>>(Object),
        id: {
            type: String,
            required: true
        }
    },
    components: {
        Node,
        CollapseTransition
    },
    setup(props) {
        const { title, display } = toRefs(props);

        const titleComponent = computeComponent(title);
        const bodyComponent = computeComponent(display);
        const stacked = computed(() => themes[settings.theme].mergeAdjacent);

        return {
            titleComponent,
            bodyComponent,
            stacked,
            unref,
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

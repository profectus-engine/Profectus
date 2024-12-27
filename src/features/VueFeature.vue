<template>
    <div v-if="isVisible(unref(visibility))"
        :style="[
            {
                visibility: isHidden(unref(visibility)) ? 'hidden' : undefined
            },
            unref(style)
        ]"
        :class="{ feature: true, ...unref(classes) }"
    >
        <Components />
        <Node :id="id" />
    </div>
</template>

<script setup lang="tsx">
import "components/common/features.css";
import Node from "components/Node.vue";
import type { Visibility } from "features/feature";
import { isHidden, isVisible } from "features/feature";
import { MaybeGetter } from "util/computed";
import { render, Renderable, Wrapper } from "util/vue";
import { MaybeRef, unref, type CSSProperties } from "vue";

const props = withDefaults(defineProps<{
    id: string;
    components: MaybeGetter<Renderable>[];
    wrappers: Wrapper[];
    visibility?: MaybeRef<Visibility | boolean>;
    style?: MaybeRef<CSSProperties>;
    classes?: MaybeRef<Record<string, boolean>>;
}>(), {
    visibility: true,
    style: () => ({}),
    classes: () => ({})
});

const Components = () => props.wrappers.reduce<() => Renderable>(
    (acc, curr) => (() => curr(acc)),
    () => <>{props.components.map(el => render(el))}</>)();
</script>

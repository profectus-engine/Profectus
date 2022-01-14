<template>
    <Tooltip
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :display="tooltip"
    >
        <div
            :style="[{ backgroundImage: (earned && image && `url(${image})`) || '' }, style ?? []]"
            :class="{
                feature: true,
                achievement: true,
                locked: !earned,
                bought: earned,
                ...classes
            }"
        >
            <component v-if="component" :is="component" />
            <MarkNode :mark="mark" />
            <LinkNode :id="id" />
        </div>
    </Tooltip>
</template>

<script setup lang="ts">
import { GenericAchievement } from "@/features/achievement";
import { FeatureComponent } from "@/features/feature";
import { coerceComponent } from "@/util/vue";
import { computed, toRefs } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";
import { Visibility } from "@/features/feature";

const props = toRefs(defineProps<FeatureComponent<GenericAchievement>>());

const component = computed(() => {
    const display = props.display.value;
    return display && coerceComponent(display);
});
</script>

<style scoped>
.achievement {
    height: 90px;
    width: 90px;
    font-size: 10px;
    color: white;
    text-shadow: 0 0 2px #000000;
}
</style>

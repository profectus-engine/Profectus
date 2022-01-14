<template>
    <div
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        :class="{ feature: true, milestone: true, done: earned, ...classes }"
    >
        <component v-if="component" :is="component" />
        <LinkNode :id="id" />
    </div>
</template>

<script setup lang="tsx">
import { FeatureComponent, Visibility } from "@/features/feature";
import { GenericMilestone } from "@/features/milestone";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, toRefs } from "vue";
import LinkNode from "../system/LinkNode.vue";

const props = toRefs(defineProps<FeatureComponent<GenericMilestone>>());

const component = computed(() => {
    const display = props.display.value;
    if (display == null) {
        return null;
    }
    if (isCoercableComponent(display)) {
        return coerceComponent(display);
    }
    return (
        <span>
            <component v-is={coerceComponent(display.requirement, "h3")} />
            <div v-if={display.effectDisplay}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.effectDisplay!, "b")} />
            </div>
            <div v-if={display.optionsDisplay}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.optionsDisplay!, "span")} />
            </div>
        </span>
    );
});
</script>

<style scoped>
.milestone {
    width: calc(100% - 10px);
    min-width: 120px;
    padding-left: 5px;
    padding-right: 5px;
    min-height: 75px;
    background-color: var(--locked);
    border-width: 4px;
    border-radius: 5px;
    color: rgba(0, 0, 0, 0.5);
    margin: 0;
}

.milestone.done {
    background-color: var(--bought);
    cursor: default;
}
</style>

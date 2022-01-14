<template>
    <button
        v-if="visibility !== Visibility.None"
        v-show="visibility === Visibility.Visible"
        :style="style"
        @click="purchase"
        :class="{
            feature: true,
            upgrade: true,
            can: canPurchase && !bought,
            locked: !canPurchase && !bought,
            bought,
            ...classes
        }"
        :disabled="!canPurchase && !bought"
    >
        <component v-if="component" :is="component" />
        <MarkNode :mark="mark" />
        <LinkNode :id="id" />
    </button>
</template>

<script setup lang="tsx">
import { FeatureComponent, Visibility } from "@/features/feature";
import { displayResource } from "@/features/resource";
import { GenericUpgrade } from "@/features/upgrade";
import { coerceComponent, isCoercableComponent } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import LinkNode from "../system/LinkNode.vue";
import MarkNode from "./MarkNode.vue";

const props = toRefs(defineProps<FeatureComponent<GenericUpgrade>>());

const component = computed(() => {
    const display = unref(props.display);
    if (display == null) {
        return null;
    }
    if (isCoercableComponent(display)) {
        return coerceComponent(display);
    }
    return (
        <span>
            <div v-if={display.title}>
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                <component v-is={coerceComponent(display.title!, "h2")} />
            </div>
            <component v-is={coerceComponent(display.description, "div")} />
            <div v-if={display.effectDisplay}>
                <br />
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                Currently: <component v-is={coerceComponent(display.effectDisplay!)} />
            </div>
            <template v-if={unref(props.resource) != null && unref(props.cost) != null}>
                <br />
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                Cost: {displayResource(unref(props.resource)!, unref(props.cost))}{" "}
                {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
                {unref(props.resource)!.displayName}
            </template>
        </span>
    );
});
</script>

<style scoped>
.upgrade {
    min-height: 120px;
    width: 120px;
    font-size: 10px;
}
</style>

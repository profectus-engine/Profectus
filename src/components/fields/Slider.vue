<template>
    <div class="field">
        <span class="field-title" v-if="title">{{ title }}</span>
        <Tooltip :display="`${value}`" :class="{ fullWidth: !title }">
            <input type="range" v-model="value" :min="min" :max="max" />
        </Tooltip>
    </div>
</template>

<script setup lang="ts">
import { computed, toRefs, unref } from "vue";
import Tooltip from "../system/Tooltip.vue";

const props = toRefs(
    defineProps<{
        title?: string;
        modelValue?: number;
        min?: number;
        max?: number;
    }>()
);
const emit = defineEmits<{
    (e: "update:modelValue", value: number): void;
}>();

const value = computed({
    get() {
        return unref(props.modelValue) || 0;
    },
    set(value: number) {
        emit("update:modelValue", value);
    }
});
</script>

<style scoped>
.fullWidth {
    width: 100%;
}
</style>

<template>
    <div class="field">
        <span class="field-title" v-if="titleComponent"><component :is="titleComponent"/></span>
        <VueNextSelect
            :options="options"
            v-model="value"
            label-by="label"
            :reduce="(option: SelectOption) => option.value"
            :placeholder="placeholder"
            :close-on-select="closeOnSelect"
        />
    </div>
</template>

<script setup lang="ts">
import { CoercableComponent } from "@/features/feature";
import { coerceComponent } from "@/util/vue";
import { computed, toRefs, unref } from "vue";
import VueNextSelect from "vue-next-select";
import "vue-next-select/dist/index.css";

export type SelectOption = { label: string; value: unknown };

const props = toRefs(
    defineProps<{
        title?: CoercableComponent;
        modelValue?: unknown;
        options: SelectOption[];
        placeholder?: string;
        closeOnSelect?: boolean;
    }>()
);
const emit = defineEmits<{
    (e: "update:modelValue", value: unknown): void;
}>();

const titleComponent = computed(
    () => props.title?.value && coerceComponent(props.title.value, "span")
);

const value = computed({
    get() {
        return unref(props.modelValue);
    },
    set(value: unknown) {
        emit("update:modelValue", value);
    }
});
</script>

<style>
.vue-select {
    width: 50%;
    border-radius: var(--border-radius);
}

.field-buttons .vue-select {
    width: unset;
}

.vue-select,
.vue-dropdown {
    border-color: var(--outline);
}

.vue-dropdown {
    background: var(--raised-background);
}

.vue-dropdown-item {
    color: var(--feature-foreground);
}

.vue-dropdown-item,
.vue-dropdown-item * {
    transition-duration: 0s;
}

.vue-dropdown-item.highlighted {
    background-color: var(--highlighted);
}

.vue-dropdown-item.selected,
.vue-dropdown-item.highlighted.selected {
    background-color: var(--bought);
}

.vue-input input::placeholder {
    color: var(--link);
}
</style>

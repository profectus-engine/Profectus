<template>
    <div class="field">
        <span class="field-title" v-if="titleComponent"><component :is="titleComponent" /></span>
        <VueNextSelect
            :options="options"
            v-model="value"
            @update:model-value="onUpdate"
            :min="1"
            label-by="label"
            :placeholder="placeholder"
            :close-on-select="closeOnSelect"
        />
    </div>
</template>

<script setup lang="ts">
import "components/common/fields.css";
import { CoercableComponent } from "features/feature";
import { computeOptionalComponent } from "util/vue";
import { ref, toRef, watch } from "vue";
import VueNextSelect from "vue-next-select";
import "vue-next-select/dist/index.css";

export type SelectOption = { label: string; value: unknown };

const props = defineProps<{
    title?: CoercableComponent;
    modelValue?: unknown;
    options: SelectOption[];
    placeholder?: string;
    closeOnSelect?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: unknown): void;
}>();

const titleComponent = computeOptionalComponent(toRef(props, "title"), "span");

const value = ref<SelectOption | undefined>(
    props.options.find(option => option.value === props.modelValue)
);
watch(toRef(props, "modelValue"), modelValue => {
    if (value.value?.value !== modelValue) {
        value.value = props.options.find(option => option.value === modelValue);
    }
});

function onUpdate(value: SelectOption) {
    emit("update:modelValue", value.value);
}
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

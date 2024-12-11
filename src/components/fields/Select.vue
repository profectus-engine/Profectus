<template>
    <div class="field">
        <span class="field-title" v-if="title"><Title /></span>
        <VueNextSelect
            :options="options"
            v-model="value"
            :min="1"
            :placeholder="placeholder"
            :close-on-select="closeOnSelect"
            @update:model-value="onUpdate"
            label-by="label"
        />
    </div>
</template>

<script setup lang="tsx">
import "components/common/fields.css";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import { ref, toRef, unref, watch } from "vue";
import VueNextSelect from "vue-next-select";
import "vue-next-select/dist/index.css";

export type SelectOption = { label: string; value: unknown };

const props = defineProps<{
    title?: MaybeGetter<Renderable>;
    modelValue?: unknown;
    options: SelectOption[];
    placeholder?: string;
    closeOnSelect?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: unknown): void;
}>();

const Title = () => props.title ? render(props.title, el => <span>{el}</span>) : <></>;

const value = ref<SelectOption | null>(
    props.options.find(option => option.value === props.modelValue) ?? null
);
watch(toRef(props, "modelValue"), modelValue => {
    if (unref(value) !== modelValue) {
        value.value = props.options.find(option => option.value === modelValue) ?? null;
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
    color: var(--foreground);
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

.vue-input input {
    font-size: inherit;
}

.vue-input input::placeholder {
    color: var(--link);
}
</style>

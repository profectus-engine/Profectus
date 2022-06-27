<template>
    <label class="field">
        <input type="checkbox" class="toggle" v-model="value" />
        <component :is="component" />
    </label>
</template>

<script setup lang="ts">
import "components/common/fields.css";
import type { CoercableComponent } from "features/feature";
import { coerceComponent } from "util/vue";
import { computed, unref } from "vue";

const props = defineProps<{
    title?: CoercableComponent;
    modelValue?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const component = computed(() => coerceComponent(unref(props.title) || "<span></span>", "span"));

const value = computed({
    get() {
        return !!props.modelValue;
    },
    set(value: boolean) {
        emit("update:modelValue", value);
    }
});
</script>

<style scoped>
.field {
    cursor: pointer;
}

input {
    appearance: none;
    pointer-events: none;
}

span {
    width: 100%;
    position: relative;
}

/* track */
input + span::before {
    content: "";
    float: right;
    margin: 5px 0 5px 10px;
    border-radius: 7px;
    width: 36px;
    height: 14px;
    background-color: var(--outline);
    opacity: 0.38;
    vertical-align: top;
    transition: background-color 0.2s, opacity 0.2s;
}

/* thumb */
input + span::after {
    content: "";
    position: absolute;
    top: 2px;
    right: 16px;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    background-color: var(--locked);
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12);
    transition: background-color 0.2s, transform 0.2s;
}

input:checked + span::before {
    background-color: var(--link);
    opacity: 0.6;
}

input:checked + span::after {
    background-color: var(--link);
    transform: translateX(16px);
}

/* active */
input:active + span::before {
    background-color: var(--link);
    opacity: 0.6;
}

input:checked:active + span::before {
    background-color: var(--outline);
    opacity: 0.38;
}

/* disabled */
input:disabled + span {
    color: black;
    opacity: 0.38;
    cursor: default;
}

input:disabled + span::before {
    background-color: var(--outline);
    opacity: 0.38;
}

input:checked:disabled + span::before {
    background-color: var(--link);
    opacity: 0.6;
}
</style>

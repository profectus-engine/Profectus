<template>
    <form @submit.prevent="submit">
        <div class="field">
            <span class="field-title" v-if="titleComponent"
                ><component :is="titleComponent"
            /></span>
            <VueTextareaAutosize
                v-if="textArea"
                v-model="value"
                :placeholder="placeholder"
                :maxHeight="maxHeight"
                @blur="submit"
                ref="field"
            />
            <input
                v-else
                type="text"
                v-model="value"
                :placeholder="placeholder"
                :class="{ fullWidth: !title }"
                @blur="submit"
                ref="field"
            />
        </div>
    </form>
</template>

<script setup lang="ts">
import { CoercableComponent } from "features/feature";
import { coerceComponent } from "util/vue";
import { computed, onMounted, ref, toRefs, unref } from "vue";
import VueTextareaAutosize from "vue-textarea-autosize";
import "components/common/fields.css";

const _props = defineProps<{
    title?: CoercableComponent;
    modelValue?: string;
    textArea?: boolean;
    placeholder?: string;
    maxHeight?: number;
}>();
const props = toRefs(_props);
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "submit"): void;
}>();

const titleComponent = computed(
    () => props.title?.value && coerceComponent(unref(props.title.value), "span")
);

const field = ref<HTMLElement | null>(null);
onMounted(() => {
    field.value?.focus();
});

const value = computed({
    get() {
        return unref(props.modelValue) || "";
    },
    set(value: string) {
        emit("update:modelValue", value);
    }
});

function submit() {
    emit("submit");
}
</script>

<style scoped>
form {
    margin: 0;
    width: 100%;
}

.field > * {
    margin: 0;
}

input {
    width: 50%;
    outline: none;
    border: solid 1px var(--outline);
    background-color: unset;
    border-radius: var(--border-radius);
}

.fullWidth {
    width: 100%;
}
</style>

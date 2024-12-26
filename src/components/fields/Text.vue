<template>
    <form @submit.prevent="submit">
        <div class="field">
            <span class="field-title" v-if="title">
                <Title />
            </span>
            <VueTextareaAutosize
                v-if="textArea"
                v-model="value"
                :placeholder="placeholder"
                :maxHeight="maxHeight"
                @blur="blur"
                ref="field"
            />
            <input
                v-else
                type="text"
                v-model="value"
                :placeholder="placeholder"
                :class="{ fullWidth: !title }"
                @blur="blur"
                ref="field"
            />
        </div>
    </form>
</template>

<script setup lang="tsx">
import "components/common/fields.css";
import { MaybeGetter } from "util/computed";
import { render, Renderable } from "util/vue";
import { computed, onMounted, shallowRef, unref } from "vue";
import VueTextareaAutosize from "vue-textarea-autosize";

const props = defineProps<{
    title?: MaybeGetter<Renderable>;
    modelValue?: string;
    textArea?: boolean;
    placeholder?: string;
    maxHeight?: number;
    submitOnBlur?: boolean;
}>();
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "submit"): void;
    (e: "cancel"): void;
}>();

const Title = () => props.title == null ? <></> : render(props.title, el => <span>{el}</span>);

const field = shallowRef<HTMLElement | null>(null);
onMounted(() => {
    field.value?.focus();
});

const value = computed({
    get() {
        return unref(props.modelValue) ?? "";
    },
    set(value: string) {
        emit("update:modelValue", value);
    }
});

function submit() {
    emit("submit");
}

function blur() {
    if (props.submitOnBlur !== false) {
        emit("submit");
    } else {
        emit("cancel");
    }
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

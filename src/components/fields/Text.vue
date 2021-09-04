<template>
    <form @submit.prevent="$emit('submit')">
        <div class="field">
            <span class="field-title" v-if="title">{{ title }}</span>
            <textarea-autosize
                v-if="textarea"
                :placeholder="placeholder"
                :value="val"
                :maxHeight="maxHeight"
                @input="change"
                @blur="() => $emit('blur')"
                ref="field"
            />
            <input
                v-else
                type="text"
                :value="val"
                @input="e => change(e.target.value)"
                @blur="() => $emit('blur')"
                :placeholder="placeholder"
                ref="field"
                :class="{ fullWidth: !title }"
            />
        </div>
    </form>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "TextField",
    props: {
        title: String,
        value: String,
        modelValue: String,
        textarea: Boolean,
        placeholder: String,
        maxHeight: Number
    },
    emits: ["change", "submit", "blur", "update:modelValue"],
    mounted() {
        (this.$refs.field as HTMLElement).focus();
    },
    computed: {
        val() {
            return this.modelValue || this.value || "";
        }
    },
    methods: {
        change(value: string) {
            this.$emit("change", value);
            this.$emit("update:modelValue", value);
        }
    }
});
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

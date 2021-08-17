<template>
    <form @submit.prevent="$emit('submit')">
        <div class="field">
            <span class="field-title" v-if="title">{{ title }}</span>
            <textarea-autosize
                v-if="textarea"
                :placeholder="placeholder"
                :value="value"
                :maxHeight="maxHeight"
                @input="value => $emit('change', value)"
                ref="field"
            />
            <input
                v-else
                type="text"
                :value="value"
                @input="e => $emit('change', e.target.value)"
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
        textarea: Boolean,
        placeholder: String,
        maxHeight: Number
    },
    emits: ["change", "submit"],
    mounted() {
        (this.$refs.field as HTMLElement).focus();
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
}

.fullWidth {
    width: 100%;
}
</style>

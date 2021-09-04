<template>
    <div class="field">
        <span class="field-title" v-if="title">{{ title }}</span>
        <vue-select
            :options="options"
            :model-value="value"
            @update:modelValue="setSelected"
            label-by="label"
            :value-by="getValue"
            :placeholder="placeholder"
            :close-on-select="closeOnSelect"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Select",
    props: {
        title: String,
        options: Array, // https://vue-select.org/guide/options.html#options-prop
        value: [String, Object],
        default: [String, Object],
        placeholder: String,
        closeOnSelect: Boolean
    },
    emits: ["change"],
    methods: {
        setSelected(value: any) {
            value = value || this.default;
            this.$emit("change", value);
        },
        getValue(item?: { value: any }) {
            return item?.value;
        }
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

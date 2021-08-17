<template>
    <label class="field">
        <input type="checkbox" class="toggle" :checked="value" @input="handleInput" />
        <span>{{ title }}</span>
    </label>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// Reference: https://codepen.io/finnhvman/pen/pOeyjE
export default defineComponent({
    name: "Toggle",
    props: {
        title: String,
        value: Boolean
    },
    emits: ["change"],
    methods: {
        handleInput(e: InputEvent) {
            this.$emit("change", (e.target as HTMLInputElement).checked);
        }
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
}

/* track */
span::before {
    content: "";
    float: right;
    margin: 5px 0 5px 10px;
    border-radius: 7px;
    width: 36px;
    height: 14px;
    background-color: rgba(0, 0, 0, 0.38);
    vertical-align: top;
    transition: background-color 0.2s, opacity 0.2s;
}

/* thumb */
span::after {
    content: "";
    position: absolute;
    top: 6px;
    right: 16px;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    background-color: white;
    box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12);
    transition: background-color 0.2s, transform 0.2s;
}

input:checked + span::before {
    background-color: rgba(33, 150, 243, 0.6);
}

input:checked + span::after {
    background-color: rgb(33, 150, 243);
    transform: translateX(16px);
}

/* active */
input:active + span::before {
    background-color: rgba(33, 150, 243, 0.6);
}

input:checked:active + span::before {
    background-color: rgba(0, 0, 0, 0.38);
}

/* disabled */
input:disabled + span {
    color: black;
    opacity: 0.38;
    cursor: default;
}

input:disabled + span::before {
    background-color: rgba(0, 0, 0, 0.38);
}

input:checked:disabled + span::before {
    background-color: rgba(33, 150, 243, 0.6);
}
</style>

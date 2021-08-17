<template>
    <span class="container" :class="{ confirming }">
        <span v-if="confirming">Are you sure?</span>
        <button @click.stop="click" class="button danger" :disabled="disabled">
            <span v-if="confirming">Yes</span>
            <slot v-else />
        </button>
        <button v-if="confirming" class="button" @click.stop="cancel">No</button>
    </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "danger-button",
    data() {
        return {
            confirming: false
        };
    },
    props: {
        disabled: Boolean,
        skipConfirm: Boolean
    },
    emits: ["click", "confirmingChanged"],
    watch: {
        confirming(newValue) {
            this.$emit("confirmingChanged", newValue);
        }
    },
    methods: {
        click() {
            if (this.skipConfirm) {
                this.$emit("click");
                return;
            }
            if (this.confirming) {
                this.$emit("click");
            }
            this.confirming = !this.confirming;
        },
        cancel() {
            this.confirming = false;
        }
    }
});
</script>

<style scoped>
.container {
    display: flex;
    align-items: center;
}

.container.confirming button {
    font-size: 1em;
}

.container > * {
    margin: 0 4px;
}
</style>

<style>
.danger {
    position: relative;
    border: solid 2px var(--danger);
    border-right-width: 16px;
}

.danger::after {
    position: absolute;
    content: "!";
    color: white;
    right: -13px;
}
</style>

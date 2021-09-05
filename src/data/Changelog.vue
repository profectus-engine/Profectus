<template>
    <Modal :show="show" @close="$emit('closeDialog', 'Changelog')">
        <template v-slot:header>
            <h2>Changelog</h2>
        </template>
        <template v-slot:body>
            <details open>
                <summary>v0.0 Initial Commit - <time>2021-09-04</time></summary>
                This is the first release :D
                <ul>
                    <li>Did everything</li>
                    <li>Had some fun</li>
                    <li>Created some bugs to fix later</li>
                </ul>
            </details>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "Changelog",
    props: {
        show: Boolean
    },
    emits: ["closeDialog"]
});
</script>

<style scoped>
details {
    margin: 10px 0;
    padding-left: 18px;
}

summary {
    cursor: pointer;
    margin-bottom: 10px;
    margin-left: -18px;
}

ul {
    margin: var(--feature-margin) 0;
    background: var(--raised-background);
    border: 2px solid rgba(0, 0, 0, 0.125);
    padding: 5px 5px 5px 15px;
    list-style: inside;
}
</style>

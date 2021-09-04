<template>
    <div class="vr" :style="{ height }"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "vr",
    props: {
        height: String
    }
});
</script>

<style scoped>
.vr {
    width: 4px;
    background: var(--outline);
    height: 100%;
    margin: auto 7px;
}
</style>

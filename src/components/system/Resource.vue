<template>
    <h2 v-bind:style="{ color, 'text-shadow': '0px 0px 10px ' + color }">
        {{ amount }}
    </h2>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "resource",
    props: {
        color: String,
        amount: String
    }
});
</script>

<style scoped></style>

<template>
    <div class="table">
        <div class="col">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "column"
});
</script>

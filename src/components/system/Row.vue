<template>
    <div class="table">
        <div class="row">
            <slot />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "row"
});
</script>

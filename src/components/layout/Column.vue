<template>
    <div class="table">
        <div class="col" :class="{ mergeAdjacent }">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import "components/common/table.css";
import themes from "data/themes";
import settings from "game/settings";
import { computed } from "vue";

const mergeAdjacent = computed(() => themes[settings.theme].mergeAdjacent);
</script>

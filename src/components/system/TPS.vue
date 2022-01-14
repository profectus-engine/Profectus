<template>
    <div class="tpsDisplay" v-if="!tps.isNan">TPS: {{ tps }}</div>
</template>

<script setup lang="ts">
import state from "@/game/state";
import Decimal from "@/util/bignum";
import { computed } from "vue";

const tps = computed(() =>
    Decimal.div(
        state.lastTenTicks.length,
        state.lastTenTicks.reduce((acc, curr) => acc + curr, 0)
    )
);
</script>

<style scoped>
.tpsDisplay {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 100;
}
</style>

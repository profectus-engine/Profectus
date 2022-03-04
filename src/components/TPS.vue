<template>
    <div class="tpsDisplay" v-if="!tps.isNan()">
        TPS: {{ formatWhole(tps) }}
        <transition name="fade"
            ><span v-if="showLow" class="low">{{ formatWhole(low) }}</span></transition
        >
    </div>
</template>

<script setup lang="ts">
import state from "game/state";
import Decimal, { DecimalSource, formatWhole } from "util/bignum";
import { computed, ref, watchEffect } from "vue";

const tps = computed(() =>
    Decimal.div(
        state.lastTenTicks.length,
        state.lastTenTicks.reduce((acc, curr) => acc + curr, 0)
    )
);

const lastTenFPS = ref<number[]>([]);
watchEffect(() => {
    lastTenFPS.value.push(Math.round(tps.value.toNumber()));
    if (lastTenFPS.value.length > 10) {
        lastTenFPS.value = lastTenFPS.value.slice(1);
    }
});

const low = computed(() =>
    lastTenFPS.value.reduce<DecimalSource>((acc, curr) => Decimal.max(acc, curr), 0)
);

const showLow = computed(() => Decimal.sub(tps.value, low.value).gt(1));
</script>

<style scoped>
.tpsDisplay {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 100;
}

.low {
    color: var(--danger);
}

.fade-leave-to {
    opacity: 0;
}
</style>

<template>
    <div class="tpsDisplay" v-if="tps !== 'NaN'">TPS: {{ tps }}</div>
</template>

<script lang="ts">
import state from "@/game/state";
import Decimal, { formatWhole } from "@/util/bignum";
import { defineComponent } from "vue";

export default defineComponent({
    name: "TPS",
    computed: {
        tps() {
            return formatWhole(
                Decimal.div(
                    state.lastTenTicks.length,
                    state.lastTenTicks.reduce((acc, curr) => acc + curr, 0)
                )
            );
        }
    }
});
</script>

<style scoped>
.tpsDisplay {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 100;
}
</style>
